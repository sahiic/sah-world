BEGIN;
CREATE TABLE IF NOT EXISTS public.quran_peer_study_sessions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 match_id uuid NOT NULL REFERENCES public.quran_peer_matches(id),
 created_by uuid NOT NULL REFERENCES public.profiles(id),
 scheduled_at timestamptz NOT NULL DEFAULT now(),
 duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 5 AND 90),
 surah integer NOT NULL CHECK(surah BETWEEN 1 AND 114),
 started_at timestamptz,
 ended_at timestamptz,
 cancelled_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS peer_session_one_open ON public.quran_peer_study_sessions(match_id) WHERE ended_at IS NULL AND cancelled_at IS NULL;
CREATE TABLE IF NOT EXISTS public.quran_peer_session_members(
 session_id uuid REFERENCES public.quran_peer_study_sessions(id),
 user_id uuid REFERENCES public.profiles(id),
 ready_at timestamptz,
 completed_at timestamptz,
 pages integer NOT NULL DEFAULT 0 CHECK(pages BETWEEN 0 AND 100),
 PRIMARY KEY(session_id,user_id)
);
ALTER TABLE public.quran_peer_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_peer_session_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quran_peer_study_sessions,public.quran_peer_session_members FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.quran_peer_study_sessions,public.quran_peer_session_members TO authenticated;
DROP POLICY IF EXISTS peer_session_participant ON public.quran_peer_study_sessions;
CREATE POLICY peer_session_participant ON public.quran_peer_study_sessions FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.quran_peer_matches m WHERE m.id=match_id AND auth.uid() IN(m.requester_id,m.helper_id)));
DROP POLICY IF EXISTS peer_member_participant ON public.quran_peer_session_members;
CREATE POLICY peer_member_participant ON public.quran_peer_session_members FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.quran_peer_study_sessions s WHERE s.id=session_id));

CREATE OR REPLACE FUNCTION public.peer_study_action(target_match_id uuid,action text,payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); m quran_peer_matches; s quran_peer_study_sessions; scheduled timestamptz; completed integer;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('peer-study-'||target_match_id::text,0));
 SELECT * INTO m FROM quran_peer_matches WHERE id=target_match_id AND status='accepted' AND uid IN(requester_id,helper_id) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'MATCH_REQUIRED'; END IF;
 SELECT * INTO s FROM quran_peer_study_sessions WHERE match_id=target_match_id AND ended_at IS NULL AND cancelled_at IS NULL FOR UPDATE;
 IF action='create' THEN
  IF s.id IS NOT NULL THEN RETURN to_jsonb(s); END IF;
  scheduled:=coalesce((payload->>'scheduled_at')::timestamptz,now());
  IF scheduled<now()-interval '1 minute' OR scheduled>now()+interval '30 days' THEN RAISE EXCEPTION 'INVALID_DATE'; END IF;
  INSERT INTO quran_peer_study_sessions(match_id,created_by,scheduled_at,duration_minutes,surah) VALUES(m.id,uid,scheduled,(payload->>'duration_minutes')::integer,(payload->>'surah')::integer) RETURNING * INTO s;
  INSERT INTO quran_peer_session_members(session_id,user_id) VALUES(s.id,m.requester_id),(s.id,m.helper_id);
 ELSE
  IF s.id IS NULL OR s.id IS DISTINCT FROM (payload->>'session_id')::uuid THEN RAISE EXCEPTION 'SESSION_NOT_FOUND'; END IF;
  IF action='ready' THEN
   IF s.scheduled_at>now() THEN RAISE EXCEPTION 'SESSION_NOT_DUE'; END IF;
   UPDATE quran_peer_session_members SET ready_at=coalesce(ready_at,now()) WHERE session_id=s.id AND user_id=uid;
   IF (SELECT count(*) FROM quran_peer_session_members WHERE session_id=s.id AND ready_at IS NOT NULL)=2 THEN
    UPDATE quran_peer_study_sessions SET started_at=coalesce(started_at,now()) WHERE id=s.id RETURNING * INTO s;
   END IF;
  ELSIF action='complete' THEN
   IF s.started_at IS NULL OR now()<s.started_at+make_interval(mins=>s.duration_minutes) THEN RAISE EXCEPTION 'SESSION_NOT_FINISHED'; END IF;
   UPDATE quran_peer_session_members SET pages=(payload->>'pages')::integer,completed_at=now() WHERE session_id=s.id AND user_id=uid AND completed_at IS NULL;
   SELECT count(*) INTO completed FROM quran_peer_session_members WHERE session_id=s.id AND completed_at IS NOT NULL;
   IF completed=2 THEN UPDATE quran_peer_study_sessions SET ended_at=now() WHERE id=s.id RETURNING * INTO s; END IF;
  ELSIF action='cancel' THEN
   UPDATE quran_peer_study_sessions SET cancelled_at=now() WHERE id=s.id RETURNING * INTO s;
  ELSE RAISE EXCEPTION 'INVALID_ACTION'; END IF;
 END IF;
 RETURN to_jsonb(s);
END; $$;
REVOKE ALL ON FUNCTION public.peer_study_action(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.peer_study_action(uuid,text,jsonb) TO authenticated;
COMMIT;
