-- Private lesson notes belong to the actual participants, not a platform role.
BEGIN;
CREATE OR REPLACE FUNCTION public.can_write_quran_note(target_appointment UUID,note_role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM appointments a JOIN hoca_profiles h ON h.id=a.hoca_id
    WHERE a.id=target_appointment AND a.status='completed' AND
      ((note_role='student' AND a.student_id=auth.uid()) OR (note_role='hoca' AND h.user_id=auth.uid())))
$$;
REVOKE ALL ON FUNCTION public.can_write_quran_note(UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_write_quran_note(UUID,TEXT) TO authenticated;

DROP POLICY IF EXISTS appointment_notes_participant_select ON public.appointment_notes;
CREATE POLICY appointment_notes_participant_select ON public.appointment_notes FOR SELECT TO authenticated
  USING(public.can_access_quran_context(appointment_id));
DROP POLICY IF EXISTS appointment_notes_participant_insert ON public.appointment_notes;
CREATE POLICY appointment_notes_participant_insert ON public.appointment_notes FOR INSERT TO authenticated
  WITH CHECK(author_id=auth.uid() AND public.can_write_quran_note(appointment_id,author_role));
DROP POLICY IF EXISTS appointment_notes_participant_update ON public.appointment_notes;
CREATE POLICY appointment_notes_participant_update ON public.appointment_notes FOR UPDATE TO authenticated
  USING(author_id=auth.uid())
  WITH CHECK(author_id=auth.uid() AND public.can_write_quran_note(appointment_id,author_role));

CREATE OR REPLACE FUNCTION public.guard_quran_note_identity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF (NEW.id,NEW.appointment_id,NEW.author_id,NEW.author_role,NEW.created_at)
    IS DISTINCT FROM (OLD.id,OLD.appointment_id,OLD.author_id,OLD.author_role,OLD.created_at) THEN
    RAISE EXCEPTION 'NOTE_IDENTITY_IMMUTABLE' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_quran_note_identity() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_quran_note_identity_trigger ON public.appointment_notes;
CREATE TRIGGER guard_quran_note_identity_trigger BEFORE UPDATE ON public.appointment_notes
  FOR EACH ROW EXECUTE FUNCTION public.guard_quran_note_identity();
NOTIFY pgrst,'reload schema';
COMMIT;
