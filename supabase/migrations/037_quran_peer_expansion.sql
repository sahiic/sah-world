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
