-- Kur'an Kardeşim pilot: completed appointment notes for students and teachers.
-- Ramazan Hoca activation remains an explicit admin action once the real auth user exists:
-- UPDATE public.hoca_profiles
-- SET is_placeholder = false, user_id = '<GERCEK_USER_ID>'
-- WHERE display_name = 'İmam Hatip Ramazan Hoca';

CREATE TABLE IF NOT EXISTS public.appointment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('student', 'hoca')),
  surah_name TEXT,
  start_ayah SMALLINT CHECK (start_ayah IS NULL OR start_ayah > 0),
  end_ayah SMALLINT CHECK (end_ayah IS NULL OR end_ayah > 0),
  topics_covered TEXT[] NOT NULL DEFAULT '{}',
  performance_note TEXT CHECK (char_length(performance_note) <= 600),
  student_reflection TEXT CHECK (char_length(student_reflection) <= 600),
  next_assignment TEXT CHECK (char_length(next_assignment) <= 300),
  difficulty_rating SMALLINT CHECK (difficulty_rating IS NULL OR difficulty_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, author_role),
  CHECK (end_ayah IS NULL OR start_ayah IS NULL OR end_ayah >= start_ayah)
);

CREATE INDEX IF NOT EXISTS appointment_notes_appointment_idx
  ON public.appointment_notes (appointment_id);
CREATE INDEX IF NOT EXISTS appointment_notes_author_idx
  ON public.appointment_notes (author_id);

DROP TRIGGER IF EXISTS appointment_notes_updated_at ON public.appointment_notes;
CREATE TRIGGER appointment_notes_updated_at
  BEFORE UPDATE ON public.appointment_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointment_notes_participant_select ON public.appointment_notes
  FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.id = appointment_notes.appointment_id
        AND (a.student_id = auth.uid() OR public.owns_hoca(a.hoca_id))
    )
    OR public.is_quran_admin()
  );

CREATE POLICY appointment_notes_participant_insert ON public.appointment_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.id = appointment_notes.appointment_id
        AND a.status = 'completed'
        AND (
          (author_role = 'student' AND a.student_id = auth.uid())
          OR (author_role = 'hoca' AND public.owns_hoca(a.hoca_id))
          OR public.is_quran_admin()
        )
    )
  );

CREATE POLICY appointment_notes_participant_update ON public.appointment_notes
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_quran_admin())
  WITH CHECK (author_id = auth.uid() OR public.is_quran_admin());

GRANT SELECT, INSERT, UPDATE ON public.appointment_notes TO authenticated;

COMMENT ON TABLE public.appointment_notes IS
  'Teacher feedback and student reflection attached to a completed Quran appointment.';
