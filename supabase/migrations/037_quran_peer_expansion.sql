-- 037: Expand browse_quran_helpers to include 'fluent' users alongside 'helper'
-- This migration is NOT yet applied to production.

CREATE OR REPLACE FUNCTION public.browse_quran_helpers()
RETURNS TABLE (id UUID, display_name TEXT, avatar_url TEXT, xp INTEGER, quran_level TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT p.id, p.display_name, p.avatar_url, p.xp, p.quran_level
  FROM public.profiles p WHERE p.quran_level IN ('helper', 'fluent') AND p.id <> auth.uid()
  ORDER BY p.xp DESC LIMIT 40;
END;
$$;

-- Browsing and requesting must agree; otherwise fluent peers appear but every
-- request fails with INVALID_HELPER. Preserve the existing quotas/idempotency.
CREATE OR REPLACE FUNCTION public.send_quran_peer_request(target_helper_id UUID,request_message TEXT DEFAULT '')
RETURNS public.quran_peer_matches LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item public.quran_peer_matches;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF target_helper_id IS NULL OR auth.uid()=target_helper_id OR NOT EXISTS(SELECT 1 FROM profiles WHERE id=target_helper_id AND quran_level IN ('helper','fluent'))
    OR char_length(coalesce(request_message,''))>400 THEN RAISE EXCEPTION 'INVALID_HELPER'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,35));
  SELECT * INTO item FROM quran_peer_matches WHERE requester_id=auth.uid() AND helper_id=target_helper_id FOR UPDATE;
  IF item.status IN('pending','accepted') THEN RETURN item; END IF;
  IF item.responded_at>now()-interval '24 hours' THEN RAISE EXCEPTION 'REQUEST_COOLDOWN'; END IF;
  IF (SELECT count(*) FROM quran_peer_matches WHERE requester_id=auth.uid() AND created_at>now()-interval '1 hour')>=5 THEN RAISE EXCEPTION 'REQUEST_RATE_LIMIT'; END IF;
  INSERT INTO quran_peer_matches(requester_id,helper_id,message) VALUES(auth.uid(),target_helper_id,btrim(coalesce(request_message,'')))
    ON CONFLICT(requester_id,helper_id) DO UPDATE SET status='pending',message=EXCLUDED.message,created_at=now(),responded_at=NULL RETURNING * INTO item;
  RETURN item;
END;
$$;
REVOKE ALL ON FUNCTION public.browse_quran_helpers(),public.send_quran_peer_request(UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.browse_quran_helpers(),public.send_quran_peer_request(UUID,TEXT) TO authenticated;
NOTIFY pgrst,'reload schema';
