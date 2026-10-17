BEGIN;
-- Preserve each previous relationship as a separate row. The prerequisite's
-- transactional guard still enforces exactly one active relation per person.
ALTER TABLE public.quran_peer_matches DROP CONSTRAINT IF EXISTS quran_peer_matches_requester_id_helper_id_key;
CREATE INDEX IF NOT EXISTS peer_pair_history ON public.quran_peer_matches(requester_id,helper_id,created_at DESC);
-- Convert weekly wall-clock slots to actual instants, respecting each IANA zone
-- and the DST offset of the coming week (including adjacent local week edges).
CREATE OR REPLACE FUNCTION public.quran_peer_overlap(a jsonb,az text,b jsonb,bz text)
RETURNS boolean LANGUAGE sql STABLE SET search_path=public AS $$
 WITH days AS (SELECT (current_date+i)::date d FROM generate_series(-1,8) i),
 aa AS (SELECT (d+split_part(s,'-',1)::time) AT TIME ZONE az st,(d+split_part(s,'-',2)::time) AT TIME ZONE az en FROM days CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(a->lower(to_char(d,'Dy')),'[]')) s),
 bb AS (SELECT (d+split_part(s,'-',1)::time) AT TIME ZONE bz st,(d+split_part(s,'-',2)::time) AT TIME ZONE bz en FROM days CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(b->lower(to_char(d,'Dy')),'[]')) s)
 SELECT EXISTS(SELECT 1 FROM aa,bb WHERE greatest(aa.st,bb.st)<least(aa.en,bb.en));
$$;
REVOKE ALL ON FUNCTION public.quran_peer_overlap(jsonb,text,jsonb,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.quran_peer_score(me public.quran_peer_profiles,p public.quran_peer_profiles,is_new boolean)
RETURNS integer LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT (CASE WHEN (me.level IN ('beginner','alphabet') AND p.level IN ('helper','fluent')) OR (p.level IN ('beginner','alphabet') AND me.level IN ('helper','fluent')) THEN 40 WHEN me.level=p.level THEN 25 ELSE 15 END
 +CASE WHEN me.learning_goal=p.learning_goal THEN 15 ELSE 0 END
 +CASE WHEN me.current_surah=p.current_surah THEN 10 ELSE 0 END
 +CASE WHEN public.quran_peer_overlap(me.availability,me.timezone,p.availability,p.timezone) THEN 20 ELSE 0 END
 +CASE WHEN p.last_active_at>now()-interval '7 days' THEN 10 ELSE 0 END
 +CASE WHEN is_new THEN 5 ELSE 0 END)::integer;
$$;
REVOKE ALL ON FUNCTION public.quran_peer_score(public.quran_peer_profiles,public.quran_peer_profiles,boolean) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.discover_quran_peers()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public AS $$
DECLARE me quran_peer_profiles; result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 SELECT * INTO me FROM quran_peer_profiles WHERE user_id=auth.uid();
 IF NOT FOUND THEN RETURN '[]'::jsonb; END IF;
 UPDATE quran_peer_profiles SET last_active_at=now() WHERE user_id=auth.uid() AND last_active_at<now()-interval '5 minutes';
 SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY score DESC,user_id),'[]') INTO result FROM (
  SELECT p.user_id,u.display_name,u.avatar_url,p.level,p.current_surah,p.learning_goal,p.availability,p.study_preference,p.bio_short,p.timezone,
   public.quran_peer_score(me,p,NOT EXISTS(SELECT 1 FROM quran_peer_matches m WHERE auth.uid() IN(m.requester_id,m.helper_id) AND p.user_id IN(m.requester_id,m.helper_id))) score,
   public.quran_peer_overlap(me.availability,me.timezone,p.availability,p.timezone) common_time,
   NOT EXISTS(SELECT 1 FROM quran_peer_matches m WHERE auth.uid() IN(m.requester_id,m.helper_id) AND p.user_id IN(m.requester_id,m.helper_id)) new_partner
  FROM quran_peer_profiles p JOIN profiles u ON u.id=p.user_id
  WHERE p.discoverable AND p.user_id<>auth.uid()
   AND NOT EXISTS(SELECT 1 FROM quran_peer_matches m WHERE m.status IN('pending','accepted') AND p.user_id IN(m.requester_id,m.helper_id))
  ORDER BY score DESC,p.user_id LIMIT 60
 ) c;
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.smart_match_quran_peer()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); candidate uuid; mid uuid; my_profile quran_peer_profiles;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1',0));
 IF EXISTS(SELECT 1 FROM quran_peer_matches WHERE status IN('pending','accepted') AND uid IN(requester_id,helper_id)) THEN RAISE EXCEPTION 'PEER_ALREADY_MATCHED'; END IF;
 SELECT * INTO my_profile FROM quran_peer_profiles WHERE user_id=uid;
 IF NOT FOUND OR NOT my_profile.discoverable THEN RAISE EXCEPTION 'PROFILE_REQUIRED'; END IF;
 UPDATE quran_peer_profiles SET last_active_at=now() WHERE user_id=uid;
 -- Only two explicit queue opt-ins can form an automatic pair. Never overwrite history.
 -- Search the entire opt-in queue; the discovery screen's 60-card limit must
 -- never hide a waiting candidate from the matching algorithm.
 SELECT p.user_id INTO candidate FROM quran_peer_queue q JOIN quran_peer_profiles p ON p.user_id=q.user_id
 WHERE p.user_id<>uid AND p.discoverable
 AND NOT EXISTS(SELECT 1 FROM quran_peer_matches m WHERE m.status IN('pending','accepted') AND p.user_id IN(m.requester_id,m.helper_id))
 ORDER BY public.quran_peer_score(my_profile,p,NOT EXISTS(SELECT 1 FROM quran_peer_matches m WHERE uid IN(m.requester_id,m.helper_id) AND p.user_id IN(m.requester_id,m.helper_id))) DESC,q.queued_at,q.user_id LIMIT 1;
 IF candidate IS NULL THEN
  INSERT INTO quran_peer_queue(user_id) VALUES(uid) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('state','waiting');
 END IF;
 INSERT INTO quran_peer_matches(requester_id,helper_id,status,message,responded_at) VALUES(uid,candidate,'accepted','Uyumlu Kur’an kardeşliği',now()) RETURNING id INTO mid;
 DELETE FROM quran_peer_queue WHERE user_id IN(uid,candidate);
 RETURN jsonb_build_object('state','matched','match_id',mid);
END; $$;

-- Old clients use the same opt-in/profile/score rules, not the former FIFO path.
CREATE OR REPLACE FUNCTION public.join_quran_peer_queue()
RETURNS TABLE(state text,match_id uuid,partner_id uuid,partner_name text,partner_avatar text,queued_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); active quran_peer_matches; result jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1',0));
 SELECT m.* INTO active FROM quran_peer_matches m WHERE m.status IN('pending','accepted') AND uid IN(m.requester_id,m.helper_id) LIMIT 1;
 IF active.id IS NULL THEN
  result:=smart_match_quran_peer();
  IF result->>'state'='waiting' THEN
   RETURN QUERY SELECT 'waiting'::text,NULL::uuid,NULL::uuid,NULL::text,NULL::text,q.queued_at FROM quran_peer_queue q WHERE q.user_id=uid;
   RETURN;
  END IF;
  SELECT m.* INTO active FROM quran_peer_matches m WHERE m.id=(result->>'match_id')::uuid;
 END IF;
 RETURN QUERY SELECT CASE WHEN active.status='accepted' THEN 'matched' ELSE 'request_pending' END,active.id,p.id,p.display_name,p.avatar_url,NULL::timestamptz FROM profiles p WHERE p.id=CASE WHEN active.requester_id=uid THEN active.helper_id ELSE active.requester_id END;
END; $$;

CREATE OR REPLACE FUNCTION public.request_quran_peer_v2(target_user_id uuid,note text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); mid uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1',0));
 IF target_user_id=uid OR NOT EXISTS(SELECT 1 FROM quran_peer_profiles WHERE user_id=target_user_id AND discoverable) OR NOT EXISTS(SELECT 1 FROM quran_peer_profiles WHERE user_id=uid AND discoverable) THEN RAISE EXCEPTION 'PROFILE_REQUIRED'; END IF;
 IF length(note)>400 OR note ~* '(@|https?://|www\.|[0-9][0-9 ()+.-]{6,}[0-9])' THEN RAISE EXCEPTION 'INVALID_NOTE'; END IF;
 IF EXISTS(SELECT 1 FROM quran_peer_queue WHERE user_id IN(uid,target_user_id)) THEN RAISE EXCEPTION 'PEER_IN_AUTO_QUEUE'; END IF;
 IF EXISTS(SELECT 1 FROM quran_peer_matches WHERE uid IN(requester_id,helper_id) AND target_user_id IN(requester_id,helper_id) AND responded_at>now()-interval '24 hours') THEN RAISE EXCEPTION 'REQUEST_COOLDOWN'; END IF;
 IF (SELECT count(*) FROM quran_peer_matches WHERE requester_id=uid AND created_at>now()-interval '1 hour')>=5 THEN RAISE EXCEPTION 'REQUEST_RATE_LIMIT'; END IF;
 INSERT INTO quran_peer_matches(requester_id,helper_id,message) VALUES(uid,target_user_id,btrim(note)) RETURNING id INTO mid;
 RETURN mid;
END; $$;
REVOKE ALL ON FUNCTION public.discover_quran_peers() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.smart_match_quran_peer() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.request_quran_peer_v2(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.discover_quran_peers(),public.smart_match_quran_peer(),public.request_quran_peer_v2(uuid,text) TO authenticated;
COMMIT;
