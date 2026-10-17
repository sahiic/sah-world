-- Prerequisite: opt-in, one-to-one Quran companion pairing.
-- A user is paired only after explicitly joining the queue. Both participants
-- have opted in before an accepted private thread is created.
BEGIN;

CREATE TABLE IF NOT EXISTS public.quran_peer_queue (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quran_peer_queue_fifo_idx
  ON public.quran_peer_queue (queued_at, user_id);

ALTER TABLE public.quran_peer_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quran_peer_queue_read_own ON public.quran_peer_queue;
CREATE POLICY quran_peer_queue_read_own ON public.quran_peer_queue
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- The queue is writable only through the transactional RPCs below.
REVOKE ALL ON TABLE public.quran_peer_queue FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_single_active_quran_peer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'accepted') THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1', 0));
  IF EXISTS (
    SELECT 1 FROM public.quran_peer_matches m
    WHERE m.id IS DISTINCT FROM NEW.id
      AND m.status IN ('pending', 'accepted')
      AND (m.requester_id IN (NEW.requester_id, NEW.helper_id)
        OR m.helper_id IN (NEW.requester_id, NEW.helper_id))
  ) THEN
    RAISE EXCEPTION 'PEER_ALREADY_MATCHED' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quran_peer_single_active_guard ON public.quran_peer_matches;
CREATE TRIGGER quran_peer_single_active_guard
  BEFORE INSERT OR UPDATE OF requester_id, helper_id, status
  ON public.quran_peer_matches
  FOR EACH ROW EXECUTE FUNCTION public.guard_single_active_quran_peer();
REVOKE ALL ON FUNCTION public.guard_single_active_quran_peer() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.join_quran_peer_queue()
RETURNS TABLE (
  state TEXT,
  match_id UUID,
  partner_id UUID,
  partner_name TEXT,
  partner_avatar TEXT,
  queued_at TIMESTAMPTZ
)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  viewer UUID := auth.uid();
  candidate UUID;
  active public.quran_peer_matches;
  existing_queue_time TIMESTAMPTZ;
  created_match public.quran_peer_matches;
BEGIN
  IF viewer IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1', 0));

  SELECT m.* INTO active
  FROM public.quran_peer_matches m
  WHERE m.status IN ('pending', 'accepted')
    AND viewer IN (m.requester_id, m.helper_id)
  ORDER BY m.created_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN QUERY SELECT
      CASE WHEN active.status = 'accepted' THEN 'matched' ELSE 'request_pending' END,
      active.id,
      CASE WHEN active.requester_id = viewer THEN active.helper_id ELSE active.requester_id END,
      p.display_name,
      p.avatar_url,
      NULL::TIMESTAMPTZ
    FROM public.profiles p
    WHERE p.id = CASE WHEN active.requester_id = viewer THEN active.helper_id ELSE active.requester_id END;
    RETURN;
  END IF;

  SELECT q.queued_at INTO existing_queue_time
  FROM public.quran_peer_queue q WHERE q.user_id = viewer;

  SELECT q.user_id INTO candidate
  FROM public.quran_peer_queue q
  WHERE q.user_id <> viewer
    AND NOT EXISTS (
      SELECT 1 FROM public.quran_peer_matches m
      WHERE m.status IN ('pending', 'accepted')
        AND q.user_id IN (m.requester_id, m.helper_id)
    )
  ORDER BY q.queued_at, q.user_id
  LIMIT 1
  FOR UPDATE OF q;

  IF candidate IS NOT NULL THEN
    DELETE FROM public.quran_peer_queue q WHERE q.user_id IN (viewer, candidate);
    INSERT INTO public.quran_peer_matches (requester_id, helper_id, status, message, responded_at)
    VALUES (viewer, candidate, 'accepted', 'Otomatik Kur’an kardeşliği eşleşmesi', now())
    RETURNING * INTO created_match;
    RETURN QUERY SELECT 'matched'::TEXT, created_match.id, p.id, p.display_name, p.avatar_url, NULL::TIMESTAMPTZ
      FROM public.profiles p WHERE p.id = candidate;
    RETURN;
  END IF;

  INSERT INTO public.quran_peer_queue (user_id)
  VALUES (viewer)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT q.queued_at INTO existing_queue_time
  FROM public.quran_peer_queue q WHERE q.user_id = viewer;
  RETURN QUERY SELECT 'waiting'::TEXT, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT, existing_queue_time;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_quran_peer_queue()
RETURNS TABLE (queued_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT q.queued_at FROM public.quran_peer_queue q WHERE q.user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_quran_peer_queue()
RETURNS BOOLEAN LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE removed INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1', 0));
  DELETE FROM public.quran_peer_queue WHERE user_id = auth.uid();
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_quran_peer_match(target_match_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE changed INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1', 0));
  UPDATE public.quran_peer_matches
  SET status = 'cancelled', responded_at = now()
  WHERE id = target_match_id
    AND status = 'accepted'
    AND auth.uid() IN (requester_id, helper_id);
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

-- Keep the manual request path, but enforce the same one-active-partner rule.
CREATE OR REPLACE FUNCTION public.send_quran_peer_request(target_helper_id UUID, request_message TEXT DEFAULT '')
RETURNS public.quran_peer_matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item public.quran_peer_matches;
  viewer UUID := auth.uid();
BEGIN
  IF viewer IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;
  IF target_helper_id IS NULL OR viewer = target_helper_id
    OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_helper_id AND quran_level IN ('helper', 'fluent'))
    OR char_length(coalesce(request_message, '')) > 400
  THEN RAISE EXCEPTION 'INVALID_HELPER' USING ERRCODE = '22023'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1', 0));
  SELECT * INTO item FROM public.quran_peer_matches
  WHERE viewer IN(requester_id,helper_id) AND target_helper_id IN(requester_id,helper_id)
  ORDER BY (status IN('pending','accepted')) DESC,created_at DESC LIMIT 1 FOR UPDATE;
  IF item.status IN ('pending', 'accepted') THEN RETURN item; END IF;
  IF item.responded_at > now() - interval '24 hours' THEN RAISE EXCEPTION 'REQUEST_COOLDOWN'; END IF;
  IF request_message ~* '(@|https?://|www\.|[0-9][0-9 ()+.-]{6,}[0-9])' THEN RAISE EXCEPTION 'INVALID_NOTE'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.quran_peer_matches m
    WHERE m.status IN ('pending', 'accepted')
      AND (m.requester_id IN (viewer, target_helper_id) OR m.helper_id IN (viewer, target_helper_id))
  ) THEN RAISE EXCEPTION 'PEER_ALREADY_MATCHED' USING ERRCODE = '23505'; END IF;
  IF EXISTS (SELECT 1 FROM public.quran_peer_queue q WHERE q.user_id IN (viewer, target_helper_id))
  THEN RAISE EXCEPTION 'PEER_IN_AUTO_QUEUE' USING ERRCODE = '55000'; END IF;
  IF (SELECT count(*) FROM public.quran_peer_matches WHERE requester_id = viewer AND created_at > now() - interval '1 hour') >= 5
  THEN RAISE EXCEPTION 'REQUEST_RATE_LIMIT'; END IF;

  INSERT INTO public.quran_peer_matches (requester_id, helper_id, message)
  VALUES (viewer, target_helper_id, btrim(coalesce(request_message, '')))
  RETURNING * INTO item;
  RETURN item;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_quran_peer_match(target_match_id UUID, accept_request BOOLEAN)
RETURNS public.quran_peer_matches LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item public.quran_peer_matches;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('quran-peer-pairing-v1', 0));
  SELECT * INTO item FROM public.quran_peer_matches
  WHERE id = target_match_id AND helper_id = auth.uid() AND status = 'pending' FOR UPDATE;
  IF item.id IS NULL THEN RAISE EXCEPTION 'MATCH_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  UPDATE public.quran_peer_matches
  SET status = CASE WHEN accept_request THEN 'accepted' ELSE 'declined' END, responded_at = now()
  WHERE id = target_match_id RETURNING * INTO item;
  RETURN item;
END;
$$;

REVOKE ALL ON FUNCTION public.join_quran_peer_queue() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_quran_peer_queue() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_quran_peer_queue() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_quran_peer_match(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_quran_peer_request(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_quran_peer_match(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_quran_peer_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_quran_peer_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_quran_peer_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_quran_peer_match(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_quran_peer_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_quran_peer_match(UUID, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
