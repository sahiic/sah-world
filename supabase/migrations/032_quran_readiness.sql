-- Apply after 031. Application points are motivational, NOT a measure of religious reward.
BEGIN;
ALTER TABLE public.quran_exercise_results DROP CONSTRAINT IF EXISTS quran_exercise_results_exercise_type_check;
ALTER TABLE public.quran_exercise_results ADD CONSTRAINT quran_exercise_results_exercise_type_check CHECK (exercise_type IN ('completion','ordering','tajweed','spaced','meaning','letters'));
ALTER TABLE public.quran_exercise_results ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.quran_exercise_results ALTER COLUMN time_spent_seconds TYPE INTEGER;
ALTER TABLE public.quran_study_goals ADD COLUMN IF NOT EXISTS daily_ayah_goal SMALLINT NOT NULL DEFAULT 5 CHECK (daily_ayah_goal BETWEEN 1 AND 100);
ALTER TABLE public.quran_study_goals ADD COLUMN IF NOT EXISTS daily_minutes_goal SMALLINT NOT NULL DEFAULT 10 CHECK (daily_minutes_goal BETWEEN 1 AND 180);
ALTER TABLE public.quran_hasanat ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES public.quran_exercise_results(id);
CREATE UNIQUE INDEX IF NOT EXISTS quran_hasanat_exercise_once ON public.quran_hasanat(exercise_id) WHERE exercise_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.quran_practice_keys (
  practice_type TEXT NOT NULL, question_id TEXT NOT NULL, answer TEXT NOT NULL,
  surah_id SMALLINT NOT NULL, ayah SMALLINT NOT NULL, topic TEXT NOT NULL,
  PRIMARY KEY(practice_type,question_id)
);
ALTER TABLE public.quran_practice_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quran_practice_keys FROM anon,authenticated;

CREATE TABLE IF NOT EXISTS public.quran_review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  surah_id SMALLINT NOT NULL CHECK(surah_id BETWEEN 1 AND 114), start_ayah SMALLINT NOT NULL CHECK(start_ayah BETWEEN 1 AND 286),
  end_ayah SMALLINT NOT NULL CHECK(end_ayah>=start_ayah AND end_ayah<=286), next_review_date DATE NOT NULL,
  interval_index SMALLINT NOT NULL DEFAULT 0 CHECK(interval_index BETWEEN 0 AND 4),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK(review_count>=0), last_review_date DATE,
  UNIQUE(user_id,surah_id,start_ayah)
);
ALTER TABLE public.quran_review_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quran_review_own ON public.quran_review_schedule;
CREATE POLICY quran_review_own ON public.quran_review_schedule FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.quran_review_schedule TO authenticated;

-- Only the atomic submission function can write scores, points and streaks.
DROP POLICY IF EXISTS exercise_own_all ON public.quran_exercise_results;
DROP POLICY IF EXISTS exercise_own_read ON public.quran_exercise_results;
CREATE POLICY exercise_own_read ON public.quran_exercise_results FOR SELECT TO authenticated USING(user_id=auth.uid());
REVOKE INSERT,UPDATE,DELETE ON public.quran_exercise_results FROM authenticated;
DROP POLICY IF EXISTS hasanat_own_all ON public.quran_hasanat;
DROP POLICY IF EXISTS hasanat_own_read ON public.quran_hasanat;
CREATE POLICY hasanat_own_read ON public.quran_hasanat FOR SELECT TO authenticated USING(user_id=auth.uid());
REVOKE INSERT,UPDATE,DELETE ON public.quran_hasanat FROM authenticated;
DROP POLICY IF EXISTS streaks_own_all ON public.quran_streaks;
DROP POLICY IF EXISTS streaks_own_read ON public.quran_streaks;
CREATE POLICY streaks_own_read ON public.quran_streaks FOR SELECT TO authenticated USING(user_id=auth.uid());
REVOKE INSERT,UPDATE,DELETE ON public.quran_streaks FROM authenticated;

CREATE OR REPLACE FUNCTION public.record_quran_activity()
RETURNS public.quran_streaks LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE viewer UUID:=auth.uid(); today DATE:=(now() AT TIME ZONE 'Europe/Istanbul')::date; rec public.quran_streaks; n INTEGER; consumed BOOLEAN;
BEGIN
  IF viewer IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  INSERT INTO public.quran_streaks(user_id) VALUES(viewer) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO rec FROM public.quran_streaks WHERE user_id=viewer FOR UPDATE;
  IF rec.last_activity_date=today THEN RETURN rec; END IF;
  consumed:=COALESCE(rec.last_activity_date=today-2 AND rec.streak_freeze_available,false);
  n:=CASE WHEN rec.last_activity_date=today-1 OR consumed THEN rec.current_streak+1 ELSE 1 END;
  UPDATE public.quran_streaks SET current_streak=n,longest_streak=GREATEST(longest_streak,n),
    last_activity_date=today,total_days=total_days+1,
    streak_freeze_available=CASE WHEN consumed THEN false ELSE streak_freeze_available OR n%7=0 END
    WHERE user_id=viewer RETURNING * INTO rec;
  RETURN rec;
END; $$;
-- Avoid manufacturing streaks without a practice. Called internally by submission only.
REVOKE ALL ON FUNCTION public.record_quran_activity() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.submit_quran_practice(session_id UUID,practice_type TEXT,practice_score INTEGER,question_count INTEGER,elapsed_seconds INTEGER,practice_answers JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE viewer UUID:=auth.uid(); existing public.quran_exercise_results; item JSONB; k public.quran_practice_keys;
  verified JSONB:='[]'; actual_score INTEGER:=0; reward INTEGER; today DATE:=(now() AT TIME ZONE 'Europe/Istanbul')::date;
BEGIN
  IF viewer IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  -- Serialize the user's daily cap and retries across different connections.
  PERFORM pg_advisory_xact_lock(hashtextextended(viewer::text,0));
  SELECT * INTO existing FROM public.quran_exercise_results WHERE id=session_id;
  IF FOUND THEN
    IF existing.user_id<>viewer THEN RAISE EXCEPTION 'SESSION_CONFLICT' USING ERRCODE='42501'; END IF;
    RETURN jsonb_build_object('reward',0,'replayed',true);
  END IF;
  IF session_id IS NULL OR practice_type IS NULL OR question_count IS NULL OR elapsed_seconds IS NULL OR practice_answers IS NULL OR practice_score IS NULL
    OR practice_type NOT IN ('completion','ordering','tajweed','meaning','letters') OR question_count NOT BETWEEN 1 AND 8
    OR (practice_type<>'ordering' AND question_count<>8) OR elapsed_seconds NOT BETWEEN 1 AND 21600
    OR jsonb_typeof(practice_answers)<>'array' OR jsonb_array_length(practice_answers)<>question_count
    OR (SELECT count(DISTINCT a->>'questionId') FROM jsonb_array_elements(practice_answers) a)<>question_count
    THEN RAISE EXCEPTION 'INVALID_PRACTICE' USING ERRCODE='22023'; END IF;
  IF (SELECT count(*) FROM public.quran_exercise_results WHERE user_id=viewer AND (created_at AT TIME ZONE 'Europe/Istanbul')::date=today)>=20 THEN
    RAISE EXCEPTION 'DAILY_LIMIT' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(practice_answers) LOOP
    SELECT * INTO k FROM public.quran_practice_keys p WHERE p.practice_type=submit_quran_practice.practice_type AND p.question_id=item->>'questionId';
    IF NOT FOUND OR item->>'selected' IS NULL OR length(item->>'selected')>1000 THEN RAISE EXCEPTION 'UNKNOWN_QUESTION' USING ERRCODE='22023'; END IF;
    actual_score:=actual_score+CASE WHEN item->>'selected'=k.answer THEN 1 ELSE 0 END;
    verified:=verified||jsonb_build_array(jsonb_build_object('questionId',k.question_id,'surahId',k.surah_id,'ayah',k.ayah,'topic',k.topic,'correct',item->>'selected'=k.answer,'selected',item->>'selected','answer',k.answer));
  END LOOP;
  IF actual_score<>practice_score THEN RAISE EXCEPTION 'SCORE_MISMATCH' USING ERRCODE='22023'; END IF;
  INSERT INTO public.quran_exercise_results(id,user_id,exercise_type,score,total_questions,time_spent_seconds,answers)
    VALUES(session_id,viewer,practice_type,actual_score,question_count,elapsed_seconds,verified);
  reward:=CASE WHEN actual_score=question_count THEN 25 ELSE 10 END;
  INSERT INTO public.quran_hasanat(user_id,amount,source,description,exercise_id) VALUES(viewer,reward,'exercise','Alıştırma öğrenme puanı',session_id);
  FOR item IN SELECT value FROM jsonb_array_elements(verified) LOOP
    IF NOT (item->>'correct')::boolean AND (item->>'surahId')::integer>0 THEN
      INSERT INTO public.quran_review_schedule(user_id,surah_id,start_ayah,end_ayah,next_review_date)
        VALUES(viewer,(item->>'surahId')::integer,(item->>'ayah')::integer,(item->>'ayah')::integer,today)
        ON CONFLICT(user_id,surah_id,start_ayah) DO UPDATE SET next_review_date=LEAST(quran_review_schedule.next_review_date,today);
    END IF;
  END LOOP;
  PERFORM public.record_quran_activity();
  RETURN jsonb_build_object('reward',reward,'replayed',false);
END; $$;
REVOKE ALL ON FUNCTION public.submit_quran_practice(UUID,TEXT,INTEGER,INTEGER,INTEGER,JSONB) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_quran_practice(UUID,TEXT,INTEGER,INTEGER,INTEGER,JSONB) TO authenticated;

-- Sharing is explicitly opt-in. No names, emails or private lesson notes are exposed.
CREATE TABLE IF NOT EXISTS public.quran_leaderboard_preferences(user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,opted_in BOOLEAN NOT NULL DEFAULT false);
ALTER TABLE public.quran_leaderboard_preferences ADD COLUMN IF NOT EXISTS alias_seed UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.quran_leaderboard_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quran_leaderboard_own ON public.quran_leaderboard_preferences;
CREATE POLICY quran_leaderboard_own ON public.quran_leaderboard_preferences FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.quran_leaderboard_preferences TO authenticated;
CREATE OR REPLACE FUNCTION public.get_quran_weekly_leaderboard()
RETURNS TABLE(alias TEXT,points BIGINT,is_me BOOLEAN) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT 'Kardeş '||upper(substr(md5(p.alias_seed::text||date_trunc('week',now() AT TIME ZONE 'Europe/Istanbul')::text),1,6)),sum(h.amount),h.user_id=auth.uid()
    FROM public.quran_hasanat h JOIN public.quran_leaderboard_preferences p ON p.user_id=h.user_id AND p.opted_in
    WHERE auth.uid() IS NOT NULL AND h.created_at >= date_trunc('week',now() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul'
    GROUP BY h.user_id,p.alias_seed ORDER BY sum(h.amount) DESC,h.user_id LIMIT 10;
$$;
REVOKE ALL ON FUNCTION public.get_quran_weekly_leaderboard() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_quran_weekly_leaderboard() TO authenticated;

CREATE TABLE IF NOT EXISTS public.quran_teacher_reviews(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  hoca_id UUID NOT NULL REFERENCES public.hoca_profiles(id) ON DELETE CASCADE,student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK(rating BETWEEN 1 AND 5),comment TEXT NOT NULL CHECK(length(comment) BETWEEN 3 AND 600),
  published BOOLEAN NOT NULL DEFAULT false,created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quran_teacher_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quran_reviews_read ON public.quran_teacher_reviews;
CREATE POLICY quran_reviews_read ON public.quran_teacher_reviews FOR SELECT TO authenticated USING(student_id=auth.uid());
DROP POLICY IF EXISTS quran_reviews_insert ON public.quran_teacher_reviews;
CREATE POLICY quran_reviews_insert ON public.quran_teacher_reviews FOR INSERT TO authenticated WITH CHECK(student_id=auth.uid() AND EXISTS(SELECT 1 FROM public.appointments a WHERE a.id=appointment_id AND a.student_id=auth.uid() AND a.hoca_id=quran_teacher_reviews.hoca_id AND a.status='completed'));
DROP POLICY IF EXISTS quran_reviews_update ON public.quran_teacher_reviews;
CREATE POLICY quran_reviews_update ON public.quran_teacher_reviews FOR UPDATE TO authenticated USING(student_id=auth.uid()) WITH CHECK(student_id=auth.uid() AND EXISTS(SELECT 1 FROM public.appointments a WHERE a.id=appointment_id AND a.student_id=auth.uid() AND a.hoca_id=quran_teacher_reviews.hoca_id AND a.status='completed'));
GRANT SELECT,INSERT,UPDATE ON public.quran_teacher_reviews TO authenticated;
COMMENT ON TABLE public.quran_teacher_reviews IS 'Separate opt-in public feedback; private appointment_notes never appear here.';
CREATE OR REPLACE FUNCTION public.get_quran_teacher_reviews(target_hoca_id UUID)
RETURNS TABLE(rating SMALLINT,comment TEXT,created_at TIMESTAMPTZ) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT r.rating,r.comment,r.created_at FROM public.quran_teacher_reviews r JOIN public.hoca_profiles h ON h.id=r.hoca_id
    WHERE auth.uid() IS NOT NULL AND h.is_active AND r.published AND r.hoca_id=target_hoca_id ORDER BY r.created_at DESC LIMIT 50;
$$;
REVOKE ALL ON FUNCTION public.get_quran_teacher_reviews(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_quran_teacher_reviews(UUID) TO authenticated;
COMMIT;
