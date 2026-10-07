-- SAH World — Kur'an-ı Kerim Kardeşim PRO
-- Admin/hoca bootstrap, surah progress persistence, streak tracking,
-- exercise result history, and hasanat (spiritual reward) system.

-- 1) Allow admin_set_quran_role to also assign 'admin' role
CREATE OR REPLACE FUNCTION public.admin_set_quran_role(target_user_id UUID, next_role TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_name TEXT;
BEGIN
  IF NOT public.is_quran_admin() THEN RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501'; END IF;
  IF next_role NOT IN ('user', 'hoca', 'admin') THEN RAISE EXCEPTION 'INVALID_ROLE' USING ERRCODE = '22023'; END IF;
  UPDATE public.profiles SET role = next_role WHERE id = target_user_id RETURNING display_name INTO target_name;
  IF target_name IS NULL THEN RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF next_role = 'hoca' OR next_role = 'admin' THEN
    INSERT INTO public.hoca_profiles (user_id, display_name, title, bio, specialties, is_active)
    VALUES (target_user_id, target_name, 'Kur''an Öğreticisi', 'Kur''an-ı Kerim öğretiminde öğrencilere rehberlik etmektedir.', ARRAY['Yeni Başlayanlar'], true)
    ON CONFLICT (user_id) DO UPDATE SET is_active = true, display_name = EXCLUDED.display_name;
  ELSE
    UPDATE public.hoca_profiles SET is_active = false WHERE user_id = target_user_id;
  END IF;
  RETURN next_role;
END;
$$;

-- 2) Bootstrap first admin by email (runs once during migration)
DO $$
DECLARE target UUID; target_name TEXT;
BEGIN
  SELECT u.id INTO target FROM auth.users u WHERE u.email = 'eyuperen5633@gmail.com';
  IF target IS NOT NULL THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = target RETURNING display_name INTO target_name;
    INSERT INTO public.hoca_profiles (user_id, display_name, title, bio, specialties, is_active, is_placeholder)
    VALUES (target, COALESCE(target_name, 'Admin'), 'Baş Muallim',
      'Platform yöneticisi ve Kur''an-ı Kerim öğreticisi. Tecvid, mahreç ve ezberleme konularında rehberlik sağlar.',
      ARRAY['Tecvid', 'Mahreç', 'Ezberleme', 'Yönetim'], true, false)
    ON CONFLICT (user_id) DO UPDATE SET
      is_active = true, is_placeholder = false, title = 'Baş Muallim',
      bio = EXCLUDED.bio, specialties = EXCLUDED.specialties;
  END IF;
END;
$$;

-- 3) Surah progress persistence
CREATE TABLE IF NOT EXISTS public.quran_surah_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  surah_id SMALLINT NOT NULL CHECK (surah_id BETWEEN 1 AND 114),
  read_status TEXT NOT NULL DEFAULT 'none' CHECK (read_status IN ('none','started','reading','completed')),
  memorize_status TEXT NOT NULL DEFAULT 'none' CHECK (memorize_status IN ('none','studying','reviewing','memorized')),
  completed_ayahs SMALLINT NOT NULL DEFAULT 0 CHECK (completed_ayahs >= 0),
  total_errors SMALLINT NOT NULL DEFAULT 0 CHECK (total_errors >= 0),
  difficult_ayahs SMALLINT[] NOT NULL DEFAULT '{}',
  last_study_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, surah_id)
);

CREATE INDEX IF NOT EXISTS quran_surah_progress_user_idx ON public.quran_surah_progress (user_id);
CREATE TRIGGER quran_surah_progress_updated_at BEFORE UPDATE ON public.quran_surah_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.quran_surah_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY qsp_own_all ON public.quran_surah_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_surah_progress TO authenticated;

-- 4) Streak tracking
CREATE TABLE IF NOT EXISTS public.quran_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak SMALLINT NOT NULL DEFAULT 0,
  longest_streak SMALLINT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_days SMALLINT NOT NULL DEFAULT 0,
  streak_freeze_available BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER quran_streaks_updated_at BEFORE UPDATE ON public.quran_streaks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.quran_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY streaks_own_all ON public.quran_streaks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.quran_streaks TO authenticated;

-- 5) Exercise result history
CREATE TABLE IF NOT EXISTS public.quran_exercise_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('completion','ordering','tajweed','spaced')),
  surah_id SMALLINT,
  score SMALLINT NOT NULL CHECK (score >= 0),
  total_questions SMALLINT NOT NULL CHECK (total_questions > 0),
  time_spent_seconds SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quran_exercise_user_idx ON public.quran_exercise_results (user_id, created_at DESC);

ALTER TABLE public.quran_exercise_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY exercise_own_all ON public.quran_exercise_results FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT ON public.quran_exercise_results TO authenticated;

-- 6) Hasanat (spiritual reward) ledger
CREATE TABLE IF NOT EXISTS public.quran_hasanat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount SMALLINT NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL CHECK (source IN ('exercise','streak','review','milestone','appointment','daily')),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quran_hasanat_user_idx ON public.quran_hasanat (user_id, created_at DESC);

ALTER TABLE public.quran_hasanat ENABLE ROW LEVEL SECURITY;
CREATE POLICY hasanat_own_all ON public.quran_hasanat FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT ON public.quran_hasanat TO authenticated;

-- 7) RPC: record streak activity (handles day transitions, freeze logic)
CREATE OR REPLACE FUNCTION public.record_quran_activity()
RETURNS public.quran_streaks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  viewer UUID := auth.uid();
  today DATE := CURRENT_DATE;
  rec public.quran_streaks;
BEGIN
  IF viewer IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501'; END IF;

  INSERT INTO public.quran_streaks (user_id, current_streak, longest_streak, last_activity_date, total_days)
  VALUES (viewer, 1, 1, today, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN quran_streaks.last_activity_date = today THEN quran_streaks.current_streak
      WHEN quran_streaks.last_activity_date = today - 1 THEN quran_streaks.current_streak + 1
      WHEN quran_streaks.last_activity_date = today - 2 AND quran_streaks.streak_freeze_available
        THEN quran_streaks.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(quran_streaks.longest_streak, CASE
      WHEN quran_streaks.last_activity_date = today THEN quran_streaks.current_streak
      WHEN quran_streaks.last_activity_date = today - 1 THEN quran_streaks.current_streak + 1
      WHEN quran_streaks.last_activity_date = today - 2 AND quran_streaks.streak_freeze_available
        THEN quran_streaks.current_streak + 1
      ELSE 1
    END),
    total_days = CASE
      WHEN quran_streaks.last_activity_date = today THEN quran_streaks.total_days
      ELSE quran_streaks.total_days + 1
    END,
    streak_freeze_available = CASE
      WHEN quran_streaks.last_activity_date = today - 2 AND quran_streaks.streak_freeze_available THEN false
      ELSE quran_streaks.streak_freeze_available
    END,
    last_activity_date = today
  RETURNING * INTO rec;
  RETURN rec;
END;
$$;

REVOKE ALL ON FUNCTION public.record_quran_activity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_quran_activity() TO authenticated;

-- 8) RPC: get user's total hasanat
CREATE OR REPLACE FUNCTION public.get_my_hasanat_total()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(amount), 0) FROM public.quran_hasanat WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_hasanat_total() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_hasanat_total() TO authenticated;

COMMENT ON TABLE public.quran_surah_progress IS 'Per-user reading and memorization progress for each of the 114 surahs.';
COMMENT ON TABLE public.quran_streaks IS 'Daily activity streaks for Quran study consistency tracking.';
COMMENT ON TABLE public.quran_exercise_results IS 'History of completed exercises with scores and timing.';
COMMENT ON TABLE public.quran_hasanat IS 'Spiritual reward points earned through various Quran study activities.';
