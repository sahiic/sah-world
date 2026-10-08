-- 038: Add edited_at / deleted_at columns and RPCs for message edit & soft-delete
-- NOT YET APPLIED to production.

-- Columns ------------------------------------------------------------------
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Relax trigger: allow the sender to change content/edited_at/deleted_at
-- within 15 minutes. Everything else (routing, sender, timestamps) stays
-- locked. Receiver-side is_read marking is unchanged.
CREATE OR REPLACE FUNCTION public.guard_quran_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partner UUID;
BEGIN
  IF TG_OP='UPDATE' THEN
    -- Sender editing own message within 15 min window
    IF auth.uid() IS NOT DISTINCT FROM OLD.sender_id
      AND OLD.created_at > now() - interval '15 minutes'
      AND OLD.deleted_at IS NULL
      AND NEW.sender_id IS NOT DISTINCT FROM OLD.sender_id
      AND NEW.receiver_id IS NOT DISTINCT FROM OLD.receiver_id
      AND NEW.group_id IS NOT DISTINCT FROM OLD.group_id
      AND NEW.context_id IS NOT DISTINCT FROM OLD.context_id
      AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at
      AND NEW.is_read IS NOT DISTINCT FROM OLD.is_read
    THEN
      RETURN NEW;
    END IF;
    -- Receiver marking as read
    IF auth.uid() IS DISTINCT FROM OLD.receiver_id OR OLD.group_id IS NOT NULL
      OR (to_jsonb(NEW)-'is_read'-'edited_at'-'deleted_at') IS DISTINCT FROM (to_jsonb(OLD)-'is_read'-'edited_at'-'deleted_at')
      OR NOT NEW.is_read THEN
      RAISE EXCEPTION 'MESSAGE_UPDATE_DENIED' USING ERRCODE='42501';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.context_id IS NULL THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR NEW.sender_id IS DISTINCT FROM auth.uid() OR NEW.group_id IS NOT NULL THEN
    RAISE EXCEPTION 'MESSAGE_CONTEXT_DENIED' USING ERRCODE='42501';
  END IF;
  SELECT CASE WHEN m.requester_id=auth.uid() THEN m.helper_id ELSE m.requester_id END INTO partner
    FROM quran_peer_matches m WHERE m.id=NEW.context_id AND m.status='accepted'
      AND auth.uid() IN (m.requester_id,m.helper_id);
  IF partner IS NULL THEN
    SELECT CASE WHEN a.student_id=auth.uid() THEN h.user_id ELSE a.student_id END INTO partner
      FROM appointments a JOIN hoca_profiles h ON h.id=a.hoca_id
      WHERE a.id=NEW.context_id AND a.status IN ('pending','confirmed','completed')
        AND auth.uid() IN (a.student_id,h.user_id);
  END IF;
  IF partner IS NULL OR NEW.receiver_id IS DISTINCT FROM partner OR NEW.is_read THEN
    RAISE EXCEPTION 'MESSAGE_CONTEXT_DENIED' USING ERRCODE='42501';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_quran_message() FROM PUBLIC,anon,authenticated;

-- Update RPC ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_quran_message(
  target_message_id UUID,
  new_content TEXT
) RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF length(trim(new_content)) < 1 OR length(new_content) > 2000 THEN
    RAISE EXCEPTION 'INVALID_CONTENT' USING ERRCODE = '22023';
  END IF;
  UPDATE public.chat_messages
  SET content   = trim(new_content),
      edited_at = now()
  WHERE id = target_message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL
    AND created_at > now() - interval '15 minutes';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- Delete (soft) RPC ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_quran_message(
  target_message_id UUID
) RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;
  UPDATE public.chat_messages
  SET deleted_at = now(),
      content    = 'Bu mesaj silindi.'
  WHERE id = target_message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL
    AND created_at > now() - interval '15 minutes';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;
END;
$$;
