-- Consent-based small rooms bridged to the existing groups/chat infrastructure.
BEGIN;
CREATE TABLE IF NOT EXISTS public.quran_study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL UNIQUE REFERENCES public.groups(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK(char_length(btrim(name)) BETWEEN 2 AND 100),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  surah_target SMALLINT NOT NULL CHECK(surah_target BETWEEN 1 AND 114),
  start_ayah SMALLINT NOT NULL DEFAULT 1 CHECK(start_ayah>0),
  end_ayah SMALLINT NOT NULL CHECK(end_ayah>=start_ayah AND end_ayah<=286),
  scheduled_at TIMESTAMPTZ,
  max_participants SMALLINT NOT NULL DEFAULT 5 CHECK(max_participants BETWEEN 2 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quran_study_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.quran_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'invited' CHECK(status IN('invited','accepted','declined')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id,user_id)
);
CREATE INDEX IF NOT EXISTS quran_room_member_user_idx ON public.quran_study_room_members(user_id,status);
ALTER TABLE public.quran_study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_study_room_members ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.can_read_quran_room(target_room UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM quran_study_room_members WHERE room_id=target_room AND user_id=auth.uid() AND status IN('invited','accepted'))
$$;
REVOKE ALL ON FUNCTION public.can_read_quran_room(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_read_quran_room(UUID) TO authenticated;
DROP POLICY IF EXISTS quran_rooms_read ON public.quran_study_rooms;
CREATE POLICY quran_rooms_read ON public.quran_study_rooms FOR SELECT TO authenticated USING(public.can_read_quran_room(id));
DROP POLICY IF EXISTS quran_room_members_read ON public.quran_study_room_members;
CREATE POLICY quran_room_members_read ON public.quran_study_room_members FOR SELECT TO authenticated USING(
  user_id=auth.uid() OR EXISTS(SELECT 1 FROM quran_study_rooms r WHERE r.id=room_id AND public.is_group_member(r.group_id))
);
GRANT SELECT ON public.quran_study_rooms,public.quran_study_room_members TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.quran_study_rooms,public.quran_study_room_members FROM authenticated,anon;

CREATE OR REPLACE FUNCTION public.create_quran_study_room(room_name TEXT,target_surah SMALLINT,first_ayah SMALLINT,last_ayah SMALLINT,invited_users UUID[],study_time TIMESTAMPTZ DEFAULT NULL)
RETURNS public.quran_study_rooms LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.quran_study_rooms; base public.groups; invite UUID; ayah_counts INTEGER[]:=ARRAY[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF room_name IS NULL OR char_length(btrim(room_name)) NOT BETWEEN 2 AND 60 OR target_surah IS NULL OR target_surah NOT BETWEEN 1 AND 114
    OR first_ayah IS NULL OR last_ayah IS NULL OR first_ayah<1 OR last_ayah<first_ayah OR last_ayah>ayah_counts[target_surah]
    OR invited_users IS NULL OR cardinality(invited_users) NOT BETWEEN 1 AND 4 OR (study_time IS NOT NULL AND study_time<=now()) THEN
    RAISE EXCEPTION 'INVALID_ROOM' USING ERRCODE='22023'; END IF;
  IF (SELECT count(DISTINCT u) FROM unnest(invited_users) u)<>cardinality(invited_users) THEN RAISE EXCEPTION 'INVALID_INVITES'; END IF;
  FOREACH invite IN ARRAY invited_users LOOP
    IF invite IS NULL OR invite=auth.uid() OR NOT EXISTS(SELECT 1 FROM quran_peer_matches m WHERE status='accepted'
      AND ((requester_id=auth.uid() AND helper_id=invite) OR (helper_id=auth.uid() AND requester_id=invite))) THEN
      RAISE EXCEPTION 'ACCEPTED_PEER_REQUIRED' USING ERRCODE='42501'; END IF;
  END LOOP;
  SELECT * INTO base FROM public.create_group(btrim(room_name),'Kur''an çalışma odası');
  INSERT INTO quran_study_rooms(group_id,name,creator_id,surah_target,start_ayah,end_ayah,scheduled_at)
    VALUES(base.id,btrim(room_name),auth.uid(),target_surah,first_ayah,last_ayah,study_time) RETURNING * INTO result;
  INSERT INTO quran_study_room_members(room_id,user_id,status) VALUES(result.id,auth.uid(),'accepted');
  INSERT INTO quran_study_room_members(room_id,user_id) SELECT result.id,u FROM unnest(invited_users) u;
  RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.respond_quran_room_invite(target_room UUID,accept_invite BOOLEAN)
RETURNS public.quran_study_rooms LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.quran_study_rooms; membership public.quran_study_room_members;
BEGIN
  IF auth.uid() IS NULL OR accept_invite IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  SELECT * INTO result FROM quran_study_rooms WHERE id=target_room FOR UPDATE;
  IF NOT FOUND OR NOT result.is_active THEN RAISE EXCEPTION 'ROOM_INACTIVE'; END IF;
  SELECT * INTO membership FROM quran_study_room_members WHERE room_id=target_room AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND OR membership.status='declined' THEN RAISE EXCEPTION 'INVITE_REQUIRED' USING ERRCODE='42501'; END IF;
  IF result.creator_id=auth.uid() THEN RETURN result; END IF;
  IF accept_invite THEN
    IF membership.status<>'accepted' AND (SELECT count(*) FROM quran_study_room_members WHERE room_id=target_room AND status='accepted')>=result.max_participants THEN RAISE EXCEPTION 'ROOM_FULL'; END IF;
    IF (SELECT count(*) FROM group_members WHERE user_id=auth.uid())>=10 AND NOT public.is_group_member(result.group_id) THEN RAISE EXCEPTION 'MEMBERSHIP_LIMIT_REACHED'; END IF;
    UPDATE quran_study_room_members SET status='accepted',joined_at=now() WHERE id=membership.id;
    INSERT INTO group_members(group_id,user_id,role) VALUES(result.group_id,auth.uid(),'member') ON CONFLICT(group_id,user_id) DO NOTHING;
  ELSE
    IF membership.status='accepted' THEN RAISE EXCEPTION 'ALREADY_JOINED'; END IF;
    UPDATE quran_study_room_members SET status='declined' WHERE id=membership.id;
  END IF;
  RETURN result;
END;
$$;
-- A group code must never bypass room invitation/consent, even through the
-- existing SECURITY DEFINER join_group_by_code RPC used elsewhere in the app.
CREATE OR REPLACE FUNCTION public.guard_quran_group_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM quran_study_rooms r WHERE r.group_id=NEW.group_id
    AND (NOT r.is_active OR NOT EXISTS(SELECT 1 FROM quran_study_room_members m WHERE m.room_id=r.id AND m.user_id=NEW.user_id AND m.status='accepted'))) THEN
    RAISE EXCEPTION 'ROOM_INVITE_REQUIRED' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_quran_group_membership_trigger ON public.group_members;
CREATE TRIGGER guard_quran_group_membership_trigger BEFORE INSERT ON public.group_members FOR EACH ROW EXECUTE FUNCTION public.guard_quran_group_membership();
CREATE OR REPLACE FUNCTION public.sync_quran_room_departure()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE quran_study_room_members SET status='declined' WHERE user_id=OLD.user_id AND room_id IN(SELECT id FROM quran_study_rooms WHERE group_id=OLD.group_id);
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS sync_quran_room_departure_trigger ON public.group_members;
CREATE TRIGGER sync_quran_room_departure_trigger AFTER DELETE ON public.group_members FOR EACH ROW EXECUTE FUNCTION public.sync_quran_room_departure();
CREATE OR REPLACE FUNCTION public.guard_quran_room_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.group_id IS NOT NULL AND EXISTS(SELECT 1 FROM quran_study_rooms r WHERE r.group_id=NEW.group_id
    AND (NOT r.is_active OR NOT public.is_group_member(r.group_id))) THEN RAISE EXCEPTION 'ROOM_MESSAGE_DENIED' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_quran_room_message_trigger ON public.chat_messages;
CREATE TRIGGER guard_quran_room_message_trigger BEFORE INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.guard_quran_room_message();
REVOKE ALL ON FUNCTION public.guard_quran_group_membership(),public.sync_quran_room_departure(),public.guard_quran_room_message() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_quran_study_room(TEXT,SMALLINT,SMALLINT,SMALLINT,UUID[],TIMESTAMPTZ),public.respond_quran_room_invite(UUID,BOOLEAN) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_quran_study_room(TEXT,SMALLINT,SMALLINT,SMALLINT,UUID[],TIMESTAMPTZ),public.respond_quran_room_invite(UUID,BOOLEAN) TO authenticated;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='quran_study_room_members') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.quran_study_room_members;
    END IF;
  END IF;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
