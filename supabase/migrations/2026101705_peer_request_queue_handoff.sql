BEGIN;

-- A manual request takes precedence over automatic search. Keep the transition
-- atomic: if validation or the one-partner guard fails, both queues stay intact.
CREATE OR REPLACE FUNCTION public.request_quran_peer_v2(target_user_id uuid, note text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); mid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1',0));
  IF target_user_id IS NULL OR target_user_id=uid
    OR NOT EXISTS(SELECT 1 FROM quran_peer_profiles WHERE user_id=target_user_id AND discoverable)
    OR NOT EXISTS(SELECT 1 FROM quran_peer_profiles WHERE user_id=uid AND discoverable)
  THEN RAISE EXCEPTION 'PROFILE_REQUIRED'; END IF;
  IF length(coalesce(note,''))>400 OR note ~* '(@|https?://|www\.|[0-9][0-9 ()+.-]{6,}[0-9])' THEN RAISE EXCEPTION 'INVALID_NOTE'; END IF;
  IF EXISTS(SELECT 1 FROM quran_peer_matches WHERE status IN('pending','accepted') AND (uid IN(requester_id,helper_id) OR target_user_id IN(requester_id,helper_id))) THEN RAISE EXCEPTION 'PEER_ALREADY_MATCHED'; END IF;
  IF EXISTS(SELECT 1 FROM quran_peer_matches WHERE uid IN(requester_id,helper_id) AND target_user_id IN(requester_id,helper_id) AND responded_at>now()-interval '24 hours') THEN RAISE EXCEPTION 'REQUEST_COOLDOWN'; END IF;
  IF (SELECT count(*) FROM quran_peer_matches WHERE requester_id=uid AND created_at>now()-interval '1 hour')>=5 THEN RAISE EXCEPTION 'REQUEST_RATE_LIMIT'; END IF;
  INSERT INTO quran_peer_matches(requester_id,helper_id,message)
    VALUES(uid,target_user_id,btrim(coalesce(note,''))) RETURNING id INTO mid;
  DELETE FROM quran_peer_queue WHERE user_id IN(uid,target_user_id);
  RETURN mid;
END; $$;

-- Let the sender withdraw a pending request instead of being blocked forever.
-- The recipient still accepts/declines through respond_quran_peer_match.
CREATE OR REPLACE FUNCTION public.leave_quran_peer_match(target_match_id uuid)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public AS $$
DECLARE changed integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1',0));
  UPDATE quran_peer_matches SET status='cancelled',responded_at=now()
    WHERE id=target_match_id AND (
      (status='accepted' AND auth.uid() IN(requester_id,helper_id))
      OR (status='pending' AND auth.uid()=requester_id)
    );
  GET DIAGNOSTICS changed=ROW_COUNT;
  RETURN changed=1;
END; $$;

REVOKE ALL ON FUNCTION public.request_quran_peer_v2(uuid,text), public.leave_quran_peer_match(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_quran_peer_v2(uuid,text), public.leave_quran_peer_match(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
