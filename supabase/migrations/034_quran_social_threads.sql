-- Additive Quran communication upgrade. NULL contexts remain an explicit legacy
-- archive: never copy old pair-wide messages into every new appointment.
BEGIN;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS context_id UUID;
CREATE INDEX IF NOT EXISTS chat_messages_context_created_idx
  ON public.chat_messages(context_id, created_at DESC, id) WHERE context_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS chat_messages_context_unread_idx
  ON public.chat_messages(receiver_id, context_id) WHERE NOT is_read AND context_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.can_access_quran_context(target_context UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM quran_peer_matches m WHERE m.id=target_context
      AND m.status='accepted' AND auth.uid() IN (m.requester_id,m.helper_id))
    OR EXISTS (SELECT 1 FROM appointments a JOIN hoca_profiles h ON h.id=a.hoca_id
      WHERE a.id=target_context AND auth.uid() IN (a.student_id,h.user_id))
  )
$$;
REVOKE ALL ON FUNCTION public.can_access_quran_context(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_access_quran_context(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_quran_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partner UUID;
BEGIN
  IF TG_OP='UPDATE' THEN
    -- Receivers may acknowledge only; they must never rewrite content, routing,
    -- timestamps or the sender. Also applies to calls through definer RPCs.
    IF auth.uid() IS DISTINCT FROM OLD.receiver_id OR OLD.group_id IS NOT NULL
      OR (to_jsonb(NEW)-'is_read') IS DISTINCT FROM (to_jsonb(OLD)-'is_read')
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
DROP TRIGGER IF EXISTS guard_quran_message_trigger ON public.chat_messages;
CREATE TRIGGER guard_quran_message_trigger BEFORE INSERT OR UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_quran_message();
DROP POLICY IF EXISTS chat_select ON public.chat_messages;
CREATE POLICY chat_select ON public.chat_messages FOR SELECT TO authenticated USING (
  (group_id IS NOT NULL AND public.is_group_member(group_id)) OR
  (group_id IS NULL AND auth.uid() IN (sender_id,receiver_id)
    AND (context_id IS NULL OR public.can_access_quran_context(context_id)))
);
DROP POLICY IF EXISTS chat_insert ON public.chat_messages;
CREATE POLICY chat_insert ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id=auth.uid() AND (
    (group_id IS NOT NULL AND context_id IS NULL AND public.is_group_member(group_id)) OR
    (group_id IS NULL AND receiver_id IS NOT NULL AND receiver_id<>auth.uid()
      AND (context_id IS NULL OR public.can_access_quran_context(context_id)))
  )
);

CREATE OR REPLACE FUNCTION public.send_quran_message(target_context UUID, message_content TEXT)
RETURNS public.chat_messages LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE partner UUID; result public.chat_messages;
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_access_quran_context(target_context) THEN
    RAISE EXCEPTION 'CONTEXT_DENIED' USING ERRCODE='42501'; END IF;
  IF message_content IS NULL OR char_length(btrim(message_content)) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'INVALID_MESSAGE' USING ERRCODE='22023'; END IF;
  SELECT CASE WHEN requester_id=auth.uid() THEN helper_id ELSE requester_id END INTO partner
    FROM quran_peer_matches WHERE id=target_context AND status='accepted';
  IF partner IS NULL THEN
    SELECT CASE WHEN a.student_id=auth.uid() THEN h.user_id ELSE a.student_id END INTO partner
      FROM appointments a JOIN hoca_profiles h ON h.id=a.hoca_id
      WHERE a.id=target_context AND a.status IN ('pending','confirmed','completed');
  END IF;
  IF partner IS NULL THEN RAISE EXCEPTION 'THREAD_READ_ONLY' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,34));
  IF (SELECT count(*) FROM chat_messages WHERE sender_id=auth.uid() AND created_at>now()-interval '1 minute')>=20 THEN
    RAISE EXCEPTION 'MESSAGE_RATE_LIMIT'; END IF;
  INSERT INTO chat_messages(sender_id,receiver_id,context_id,content)
    VALUES(auth.uid(),partner,target_context,btrim(message_content)) RETURNING * INTO result;
  RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.mark_quran_thread_read(target_context UUID,message_ids UUID[])
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE affected INTEGER;
BEGIN
  IF NOT public.can_access_quran_context(target_context) THEN RAISE EXCEPTION 'CONTEXT_DENIED' USING ERRCODE='42501'; END IF;
  IF message_ids IS NULL OR cardinality(message_ids)>100 THEN RAISE EXCEPTION 'INVALID_MESSAGE_IDS'; END IF;
  UPDATE chat_messages SET is_read=true WHERE context_id=target_context AND id=ANY(message_ids) AND receiver_id=auth.uid() AND NOT is_read;
  GET DIAGNOSTICS affected=ROW_COUNT; RETURN affected;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_quran_thread_summaries()
RETURNS TABLE(context_id UUID,kind TEXT,unread_count BIGINT,last_message TEXT,last_message_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH contexts AS (
    SELECT m.id,'peer'::text kind FROM quran_peer_matches m WHERE m.status='accepted' AND auth.uid() IN(m.requester_id,m.helper_id)
    UNION ALL SELECT a.id,'appointment' FROM appointments a JOIN hoca_profiles h ON h.id=a.hoca_id WHERE auth.uid() IN(a.student_id,h.user_id)
  ) SELECT c.id,c.kind,
    (SELECT count(*) FROM chat_messages m WHERE m.context_id=c.id AND m.receiver_id=auth.uid() AND NOT m.is_read),
    latest.content,latest.created_at FROM contexts c LEFT JOIN LATERAL (
      SELECT content,created_at FROM chat_messages m WHERE m.context_id=c.id AND auth.uid() IN(m.sender_id,m.receiver_id)
      ORDER BY created_at DESC,id DESC LIMIT 1
    ) latest ON true
$$;
REVOKE ALL ON FUNCTION public.send_quran_message(UUID,TEXT),public.mark_quran_thread_read(UUID,UUID[]),public.get_quran_thread_summaries() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.send_quran_message(UUID,TEXT),public.mark_quran_thread_read(UUID,UUID[]),public.get_quran_thread_summaries() TO authenticated;

-- The legacy hub's definer RPC must not bypass RLS by accepting someone else's
-- identity, or pull Quran lesson messages into its general friend inbox.
CREATE OR REPLACE FUNCTION public.get_friends_with_last_message(requesting_user UUID)
RETURNS TABLE(friend_id UUID,display_name TEXT,avatar_url TEXT,xp INTEGER,streak_current INTEGER,friendship_id UUID,last_message TEXT,last_message_at TIMESTAMPTZ,unread_count BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL OR requesting_user IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'IDENTITY_DENIED' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT p.id,p.display_name,p.avatar_url,p.xp,p.streak_current,f.id,last_msg.content,last_msg.created_at,
    (SELECT count(*) FROM chat_messages c WHERE c.sender_id=p.id AND c.receiver_id=auth.uid() AND c.context_id IS NULL AND c.group_id IS NULL AND NOT c.is_read)
  FROM friendships f JOIN profiles p ON p.id=CASE WHEN f.user_id=auth.uid() THEN f.friend_id ELSE f.user_id END
  LEFT JOIN LATERAL(SELECT c.content,c.created_at FROM chat_messages c WHERE c.context_id IS NULL AND c.group_id IS NULL
    AND ((c.sender_id=auth.uid() AND c.receiver_id=p.id) OR (c.sender_id=p.id AND c.receiver_id=auth.uid())) ORDER BY c.created_at DESC,c.id DESC LIMIT 1) last_msg ON true
  WHERE f.status='accepted' AND auth.uid() IN(f.user_id,f.friend_id) ORDER BY last_msg.created_at DESC NULLS LAST;
END;
$$;
REVOKE ALL ON FUNCTION public.get_friends_with_last_message(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_friends_with_last_message(UUID) TO authenticated;

-- Serialize bookings on the teacher AND student, including different-duration
-- overlapping slots. Rescheduling rolls back its cancellation if booking fails.
CREATE OR REPLACE FUNCTION public.book_hoca_appointment(target_hoca_id UUID,target_start TIMESTAMPTZ,notes TEXT DEFAULT '')
RETURNS public.appointments LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.appointments; chosen_end TIMESTAMPTZ; teacher public.hoca_profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF target_start IS NULL OR target_start<=now() OR char_length(coalesce(notes,''))>600 THEN RAISE EXCEPTION 'INVALID_BOOKING'; END IF;
  SELECT * INTO teacher FROM hoca_profiles WHERE id=target_hoca_id FOR UPDATE;
  IF NOT FOUND OR NOT teacher.is_active OR teacher.is_placeholder OR teacher.user_id IS NULL OR teacher.user_id=auth.uid() THEN
    RAISE EXCEPTION 'INVALID_TEACHER'; END IF;
  PERFORM 1 FROM profiles WHERE id=auth.uid() FOR UPDATE;
  IF (SELECT count(*) FROM appointments WHERE student_id=auth.uid() AND status IN('pending','confirmed') AND scheduled_start>now())>=5 THEN
    RAISE EXCEPTION 'UPCOMING_LIMIT'; END IF;
  SELECT slot_end INTO chosen_end FROM compute_hoca_slots(target_hoca_id,(target_start AT TIME ZONE 'Europe/Istanbul')::date)
    WHERE slot_start=target_start LIMIT 1;
  IF chosen_end IS NULL THEN RAISE EXCEPTION 'SLOT_UNAVAILABLE'; END IF;
  IF EXISTS(SELECT 1 FROM appointments WHERE student_id=auth.uid() AND status IN('pending','confirmed')
    AND tstzrange(scheduled_start,scheduled_end,'[)') && tstzrange(target_start,chosen_end,'[)')) THEN RAISE EXCEPTION 'STUDENT_TIME_CONFLICT'; END IF;
  INSERT INTO appointments(hoca_id,student_id,scheduled_start,scheduled_end,topic_notes)
    VALUES(target_hoca_id,auth.uid(),target_start,chosen_end,btrim(coalesce(notes,''))) RETURNING * INTO result;
  RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.reschedule_hoca_appointment(target_appointment_id UUID,new_start TIMESTAMPTZ,new_notes TEXT DEFAULT '')
RETURNS public.appointments LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE old_appt public.appointments; result public.appointments;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  SELECT * INTO old_appt FROM appointments WHERE id=target_appointment_id FOR UPDATE;
  IF NOT FOUND OR old_appt.student_id<>auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE='42501'; END IF;
  IF old_appt.status NOT IN('pending','confirmed') THEN RAISE EXCEPTION 'CANNOT_RESCHEDULE'; END IF;
  IF old_appt.scheduled_start<=now()+interval '2 hours' THEN RAISE EXCEPTION 'CANCELLATION_WINDOW'; END IF;
  IF new_start IS NULL OR new_start=old_appt.scheduled_start THEN RAISE EXCEPTION 'INVALID_BOOKING'; END IF;
  UPDATE appointments SET status='cancelled',cancelled_at=now(),cancellation_reason='Yeniden planlandı' WHERE id=old_appt.id;
  SELECT * INTO result FROM book_hoca_appointment(old_appt.hoca_id,new_start,new_notes);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.reschedule_hoca_appointment(UUID,TIMESTAMPTZ,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reschedule_hoca_appointment(UUID,TIMESTAMPTZ,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.send_quran_peer_request(target_helper_id UUID,request_message TEXT DEFAULT '')
RETURNS public.quran_peer_matches LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item public.quran_peer_matches;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF target_helper_id IS NULL OR auth.uid()=target_helper_id OR NOT EXISTS(SELECT 1 FROM profiles WHERE id=target_helper_id AND quran_level='helper')
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

-- Presence is per authorized relationship, never a public user directory. RLS
-- authorizes joining the private topic; payloads are untrusted UI hints only.
CREATE OR REPLACE FUNCTION public.can_join_quran_presence(topic TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE context UUID;
BEGIN
  IF topic !~ '^quran:context:[0-9a-f-]{36}$' THEN RETURN false; END IF;
  BEGIN context:=substring(topic FROM 15)::uuid; EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
  RETURN public.can_access_quran_context(context);
END;
$$;
REVOKE ALL ON FUNCTION public.can_join_quran_presence(TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_join_quran_presence(TEXT) TO authenticated;
DROP POLICY IF EXISTS quran_presence_read ON realtime.messages;
CREATE POLICY quran_presence_read ON realtime.messages FOR SELECT TO authenticated USING (
  extension='presence' AND public.can_join_quran_presence((SELECT realtime.topic()))
);
DROP POLICY IF EXISTS quran_presence_write ON realtime.messages;
CREATE POLICY quran_presence_write ON realtime.messages FOR INSERT TO authenticated WITH CHECK (
  extension='presence' AND public.can_join_quran_presence((SELECT realtime.topic()))
);

DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='quran_peer_matches') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.quran_peer_matches;
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='appointments') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
  END IF;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
