BEGIN;
CREATE TABLE IF NOT EXISTS public.quran_peer_progress(
 match_id uuid PRIMARY KEY REFERENCES public.quran_peer_matches(id),
 weekly_page_goal integer NOT NULL DEFAULT 10 CHECK(weekly_page_goal BETWEEN 1 AND 700)
);
ALTER TABLE public.quran_peer_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quran_peer_progress FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.quran_peer_progress TO authenticated;
DROP POLICY IF EXISTS peer_progress_participant ON public.quran_peer_progress;
CREATE POLICY peer_progress_participant ON public.quran_peer_progress FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM quran_peer_matches m WHERE m.id=match_id AND auth.uid() IN(m.requester_id,m.helper_id)));
CREATE OR REPLACE FUNCTION public.set_peer_weekly_goal(target_match_id uuid,page_goal integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM quran_peer_matches WHERE id=target_match_id AND status='accepted' AND auth.uid() IN(requester_id,helper_id)) THEN RAISE EXCEPTION 'MATCH_REQUIRED'; END IF;
 INSERT INTO quran_peer_progress VALUES(target_match_id,page_goal) ON CONFLICT(match_id) DO UPDATE SET weekly_page_goal=excluded.weekly_page_goal;
END; $$;

CREATE OR REPLACE FUNCTION public.get_peer_workspace(target_match_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); zone text; days date[]; d date; series integer:=0; today date; result jsonb;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM quran_peer_matches WHERE id=target_match_id AND uid IN(requester_id,helper_id)) THEN RAISE EXCEPTION 'MATCH_REQUIRED'; END IF;
 SELECT timezone INTO zone FROM quran_peer_profiles WHERE user_id=uid;
 zone:=coalesce(zone,'Europe/Istanbul'); today:=(now() AT TIME ZONE zone)::date;
 SELECT array_agg(study_day ORDER BY study_day DESC) INTO days FROM (SELECT DISTINCT (ended_at AT TIME ZONE zone)::date AS study_day FROM quran_peer_study_sessions WHERE match_id=target_match_id AND ended_at IS NOT NULL) x;
 IF days[1]=today-1 THEN today:=today-1; END IF;
 FOREACH d IN ARRAY coalesce(days,'{}'::date[]) LOOP
  IF d<>today-series THEN EXIT; END IF;
  series:=series+1;
 END LOOP;
 SELECT jsonb_build_object(
  'weekly_goal',coalesce((SELECT weekly_page_goal FROM quran_peer_progress WHERE match_id=target_match_id),10),
  'total_pages',coalesce((SELECT sum(sm.pages) FROM quran_peer_session_members sm JOIN quran_peer_study_sessions s ON s.id=sm.session_id WHERE s.match_id=target_match_id AND s.ended_at IS NOT NULL),0),
  'weekly_pages',coalesce((SELECT sum(sm.pages) FROM quran_peer_session_members sm JOIN quran_peer_study_sessions s ON s.id=sm.session_id WHERE s.match_id=target_match_id AND s.ended_at IS NOT NULL AND s.ended_at>=date_trunc('week',now() AT TIME ZONE zone) AT TIME ZONE zone),0),
  'surahs', (SELECT count(DISTINCT surah) FROM quran_peer_study_sessions WHERE match_id=target_match_id AND ended_at IS NOT NULL),
  'last_study',(SELECT max(ended_at) FROM quran_peer_study_sessions WHERE match_id=target_match_id),
  'streak',series,
  'partner_today_pages',coalesce((SELECT sum(sm.pages) FROM quran_peer_session_members sm JOIN quran_peer_study_sessions s ON s.id=sm.session_id WHERE s.match_id=target_match_id AND sm.user_id<>uid AND (sm.completed_at AT TIME ZONE zone)::date=(now() AT TIME ZONE zone)::date),0),
  'session',(SELECT to_jsonb(s)||jsonb_build_object('members',(SELECT jsonb_agg(to_jsonb(sm)) FROM quran_peer_session_members sm WHERE sm.session_id=s.id)) FROM quran_peer_study_sessions s WHERE match_id=target_match_id AND ended_at IS NULL AND cancelled_at IS NULL ORDER BY created_at DESC LIMIT 1)
 ) INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.set_peer_weekly_goal(uuid,integer),public.get_peer_workspace(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_peer_weekly_goal(uuid,integer),public.get_peer_workspace(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
