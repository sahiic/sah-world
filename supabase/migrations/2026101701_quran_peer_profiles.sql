BEGIN;
CREATE TABLE IF NOT EXISTS public.quran_peer_profiles (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 level text NOT NULL CHECK(level IN ('beginner','alphabet','fluent','helper')),
 current_surah integer NOT NULL CHECK(current_surah BETWEEN 1 AND 114),
 learning_goal text NOT NULL CHECK(learning_goal IN ('tajweed','khatm','memorize','practice')),
 availability jsonb NOT NULL DEFAULT '{}',
 study_preference text NOT NULL CHECK(study_preference IN ('reading','written','listening')),
 bio_short text NOT NULL DEFAULT '' CHECK(length(bio_short)<=240),
 timezone text NOT NULL DEFAULT 'Europe/Istanbul',
 discoverable boolean NOT NULL DEFAULT false,
 last_active_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quran_peer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quran_peer_profiles FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.quran_peer_profiles TO authenticated;
DROP POLICY IF EXISTS peer_profile_self ON public.quran_peer_profiles;
CREATE POLICY peer_profile_self ON public.quran_peer_profiles FOR SELECT TO authenticated USING(user_id=auth.uid());

CREATE OR REPLACE FUNCTION public.save_quran_peer_profile(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); day text; slots jsonb; slot text; bio text:=btrim(coalesce(payload->>'bio_short','')); av jsonb:=payload->'availability';
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF jsonb_typeof(av) IS DISTINCT FROM 'object' OR av='{}'::jsonb OR length(av::text)>3000 THEN RAISE EXCEPTION 'INVALID_AVAILABILITY'; END IF;
 FOR day,slots IN SELECT * FROM jsonb_each(av) LOOP
  IF day NOT IN ('mon','tue','wed','thu','fri','sat','sun') OR jsonb_typeof(slots)<>'array' THEN RAISE EXCEPTION 'INVALID_AVAILABILITY'; END IF;
  IF jsonb_array_length(slots) NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'INVALID_AVAILABILITY'; END IF;
  FOR slot IN SELECT jsonb_array_elements_text(slots) LOOP
   IF slot IS NULL OR slot !~ '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$' OR split_part(slot,'-',1)>=split_part(slot,'-',2) THEN RAISE EXCEPTION 'INVALID_AVAILABILITY'; END IF;
  END LOOP;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=payload->>'timezone') THEN RAISE EXCEPTION 'INVALID_TIMEZONE'; END IF;
 -- Public introduction is intentionally short; disallow contact details and links.
 IF length(bio)<5 OR bio ~* '(@|https?://|www\.|[0-9][0-9 ()+.-]{6,}[0-9])' THEN RAISE EXCEPTION 'CONTACT_DETAILS_NOT_ALLOWED'; END IF;
 INSERT INTO quran_peer_profiles(user_id,level,current_surah,learning_goal,availability,study_preference,bio_short,timezone,discoverable)
 VALUES(uid,payload->>'level',(payload->>'current_surah')::integer,payload->>'learning_goal',av,payload->>'study_preference',bio,payload->>'timezone',coalesce((payload->>'discoverable')::boolean,false))
 ON CONFLICT(user_id) DO UPDATE SET level=excluded.level,current_surah=excluded.current_surah,learning_goal=excluded.learning_goal,availability=excluded.availability,study_preference=excluded.study_preference,bio_short=excluded.bio_short,timezone=excluded.timezone,discoverable=excluded.discoverable,last_active_at=now(),updated_at=now();
 RETURN (SELECT to_jsonb(p) FROM quran_peer_profiles p WHERE user_id=uid);
END; $$;
REVOKE ALL ON FUNCTION public.save_quran_peer_profile(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_quran_peer_profile(jsonb) TO authenticated;
COMMIT;
