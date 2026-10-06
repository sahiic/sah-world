-- Quran Companion pilot: private, role-specific lesson reflections.
-- Teacher identity activation is intentionally a manual admin action; never
-- assign a placeholder teacher to an auth user from a migration.
CREATE TABLE IF NOT EXISTS public.appointment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('student', 'hoca')),
  surah_name TEXT CHECK (surah_name IS NULL OR char_length(surah_name) <= 100),
  start_ayah SMALLINT CHECK (start_ayah IS NULL OR start_ayah > 0),
  end_ayah SMALLINT CHECK (end_ayah IS NULL OR end_ayah > 0),
  topics_covered TEXT[] NOT NULL DEFAULT '{}',
  performance_note TEXT CHECK (performance_note IS NULL OR char_length(performance_note) <= 600),
  student_reflection TEXT CHECK (student_reflection IS NULL OR char_length(student_reflection) <= 600),
  next_assignment TEXT CHECK (next_assignment IS NULL OR char_length(next_assignment) <= 300),
  difficulty_rating SMALLINT CHECK (difficulty_rating IS NULL OR difficulty_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointment_notes_ayah_range_check
    CHECK (start_ayah IS NULL OR end_ayah IS NULL OR start_ayah <= end_ayah),
  CONSTRAINT appointment_notes_one_per_role UNIQUE (appointment_id, author_role)
);

CREATE INDEX IF NOT EXISTS appointment_notes_appointment_idx
  ON public.appointment_notes(appointment_id);
CREATE INDEX IF NOT EXISTS appointment_notes_author_idx
  ON public.appointment_notes(author_id);

CREATE OR REPLACE FUNCTION public.guard_appointment_note_author()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  appointment_student UUID;
  appointment_hoca UUID;
BEGIN
  SELECT student_id, hoca_id INTO appointment_student, appointment_hoca
  FROM public.appointments WHERE id = NEW.appointment_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'APPOINTMENT_NOT_FOUND' USING ERRCODE = '23503'; END IF;
  IF NEW.author_id <> auth.uid() AND NOT public.is_quran_admin() THEN
    RAISE EXCEPTION 'NOTE_AUTHOR_MISMATCH' USING ERRCODE = '42501';
  END IF;
  IF NEW.author_role = 'student' AND NEW.author_id <> appointment_student THEN
    RAISE EXCEPTION 'STUDENT_NOTE_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  IF NEW.author_role = 'hoca'
     AND NOT public.owns_hoca(appointment_hoca)
     AND NOT public.is_quran_admin() THEN
    RAISE EXCEPTION 'HOCA_NOTE_FORBIDDEN' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_appointment_note_author() FROM PUBLIC;
CREATE TRIGGER appointment_notes_author_guard
  BEFORE INSERT OR UPDATE ON public.appointment_notes
  FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_note_author();
CREATE TRIGGER appointment_notes_updated_at
  BEFORE UPDATE ON public.appointment_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_notes TO authenticated;

CREATE POLICY appointment_notes_participant_read ON public.appointment_notes
  FOR SELECT TO authenticated USING (
    public.is_quran_admin()
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_notes.appointment_id
        AND (a.student_id = auth.uid() OR public.owns_hoca(a.hoca_id))
    )
  );

CREATE POLICY appointment_notes_author_insert ON public.appointment_notes
  FOR INSERT TO authenticated WITH CHECK (
    (author_id = auth.uid() AND (
      (author_role = 'student' AND EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = appointment_notes.appointment_id AND a.student_id = auth.uid()
      ))
      OR (author_role = 'hoca' AND EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = appointment_notes.appointment_id AND public.owns_hoca(a.hoca_id)
      ))
    )) OR public.is_quran_admin()
  );

CREATE POLICY appointment_notes_author_update ON public.appointment_notes
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_quran_admin())
  WITH CHECK (
    (author_id = auth.uid() AND (
      (author_role = 'student' AND EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = appointment_notes.appointment_id AND a.student_id = auth.uid()
      ))
      OR (author_role = 'hoca' AND EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = appointment_notes.appointment_id AND public.owns_hoca(a.hoca_id)
      ))
    )) OR public.is_quran_admin()
  );

CREATE POLICY appointment_notes_admin_delete ON public.appointment_notes
  FOR DELETE TO authenticated USING (public.is_quran_admin());
