// Isolated PostgreSQL/RLS tests. NOT a live Supabase/Realtime integration test.
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const { PGlite } = require(
  path.join(
    process.env.QURAN_PGLITE_ROOT || path.join(os.tmpdir(), "sah-quran-pglite"),
    "node_modules/@electric-sql/pglite",
  ),
);
async function run() {
  const db = new PGlite();
  const student = crypto.randomUUID(),
    teacher = crypto.randomUUID(),
    outsider = crypto.randomUUID(),
    helper = crypto.randomUUID(),
    peerOne = crypto.randomUUID(),
    peerTwo = crypto.randomUUID(),
    peerThree = crypto.randomUUID();
  await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE SCHEMA auth;CREATE SCHEMA realtime;
 CREATE TABLE auth.users(id UUID PRIMARY KEY,email TEXT);
 CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS 'SELECT nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
 GRANT USAGE ON SCHEMA auth,realtime TO authenticated,anon;GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon;
 CREATE TABLE realtime.messages(id UUID DEFAULT gen_random_uuid(),extension TEXT,topic TEXT);ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
 GRANT SELECT,INSERT ON realtime.messages TO authenticated;
 CREATE FUNCTION realtime.topic() RETURNS TEXT LANGUAGE sql STABLE AS 'SELECT current_setting(''request.realtime.topic'',true)';
 CREATE TABLE profiles(id UUID PRIMARY KEY,display_name TEXT,avatar_url TEXT,xp INTEGER DEFAULT 0,streak_current INTEGER DEFAULT 0,role TEXT DEFAULT 'user',created_at TIMESTAMPTZ DEFAULT now());
 CREATE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS 'BEGIN NEW.updated_at=now();RETURN NEW;END';
 -- Fixture-only byte generator: PGlite omits pgcrypto; production keeps the
 -- existing cryptographic gen_random_bytes implementation unchanged.
 CREATE FUNCTION public.gen_random_bytes(n INTEGER) RETURNS BYTEA LANGUAGE sql VOLATILE AS 'SELECT substring(decode(replace(gen_random_uuid()::text,''-'',''''),''hex'') from 1 for n)';
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO authenticated;
 INSERT INTO profiles(id,display_name) VALUES('${student}','Student'),('${teacher}','Teacher'),('${outsider}','Outsider'),('${helper}','Helper');`);
  for (const file of [
    "002_social_layer.sql",
    "003_groups_reports.sql",
    "016_secure_communities.sql",
    "022_quran_companion.sql",
    "030_quran_pilot.sql",
    "031_quran_companion_pro.sql",
    "032_quran_readiness.sql",
    "033_quran_answer_keys.sql",
  ]) {
    // WASM PostgreSQL has no replication server. SQL/RLS remains actual; only
    // publication setup is omitted from the fixture, never from the migration.
    let sql = fs
      .readFileSync("supabase/migrations/" + file, "utf8")
      .replace(
        /ALTER PUBLICATION supabase_realtime ADD TABLE public\.\w+;/g,
        "NULL;",
      );
    sql = sql.replace(/^NULL;$/gm, "");
    await db.exec(sql);
  }
  for (let n = 0; n < 2; n++)
    for (const file of [
      "034_quran_social_threads.sql",
      "035_quran_study_rooms.sql",
      "036_quran_lesson_note_integrity.sql",
    ])
      await db.exec(fs.readFileSync("supabase/migrations/" + file, "utf8"));
  await db.query("UPDATE profiles SET quran_level='helper' WHERE id=$1", [
    helper,
  ]);
  const hoca = crypto.randomUUID(),
    appt1 = crypto.randomUUID(),
    appt2 = crypto.randomUUID();
  await db.query(
    "INSERT INTO hoca_profiles(id,user_id,display_name) VALUES($1,$2,'Teacher')",
    [hoca, teacher],
  );
  const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  await db.query(
    "INSERT INTO hoca_availability(hoca_id,day_of_week,start_time,end_time,is_recurring,specific_date) VALUES($1,1,'10:00','13:00',false,$2)",
    [hoca, date],
  );
  for (const [id, time] of [
    [appt1, "10:00"],
    [appt2, "11:00"],
  ])
    await db.query(
      "INSERT INTO appointments(id,hoca_id,student_id,scheduled_start,scheduled_end) VALUES($1,$2,$3,$4::timestamptz,$4::timestamptz+interval '30 minutes')",
      [id, hoca, student, date + "T" + time + ":00+03:00"],
    );
  const as = async (id) =>
    db.exec(
      `RESET ROLE;SET ROLE authenticated;SET request.jwt.claim.sub='${id}'`,
    );
  await as(student);
  const send = (id, content) =>
    db.query("SELECT * FROM send_quran_message($1,$2)", [id, content]);
  const m1 = (await send(appt1, "Lesson one only")).rows[0],
    m2 = (await send(appt2, "Lesson two only")).rows[0];
  await assert.rejects(() =>
    db
      .query("UPDATE chat_messages SET is_read=true WHERE id=$1", [m1.id])
      .then((r) => assert.equal(r.affectedRows, 1)),
  );
  await as(teacher);
  assert.equal(
    (
      await db.query("SELECT mark_quran_thread_read($1,$2) n", [
        appt1,
        [m1.id, m2.id],
      ])
    ).rows[0].n,
    1,
  );
  assert.equal(
    (await db.query("SELECT is_read FROM chat_messages WHERE id=$1", [m2.id]))
      .rows[0].is_read,
    false,
  );
  await assert.rejects(() =>
    db.query("UPDATE chat_messages SET content='forged' WHERE id=$1", [m2.id]),
  );
  await assert.rejects(() =>
    db.query("UPDATE chat_messages SET context_id=$1 WHERE id=$2", [
      appt1,
      m2.id,
    ]),
  );
  await assert.rejects(() =>
    db.query(
      "INSERT INTO chat_messages(sender_id,receiver_id,context_id,content) VALUES($1,$2,$3,'wrong partner')",
      [teacher, outsider, appt1],
    ),
  );
  await as(outsider);
  await assert.rejects(() =>
    db.query("SELECT * FROM get_friends_with_last_message($1)", [student]),
  );
  assert.equal((await db.query("SELECT * FROM chat_messages")).rows.length, 0);
  assert.equal(
    (await db.query("SELECT * FROM get_quran_thread_summaries()")).rows.length,
    0,
  );
  await assert.rejects(() => send(appt1, "intrusion"));
  assert.equal(
    (
      await db.query("SELECT can_join_quran_presence($1) allowed", [
        "quran:context:" + appt1,
      ])
    ).rows[0].allowed,
    false,
  );
  await as(student);
  assert.equal(
    (
      await db.query("SELECT can_join_quran_presence($1) allowed", [
        "quran:context:" + appt1,
      ])
    ).rows[0].allowed,
    true,
  );
  assert.equal(
    (await db.query("SELECT can_join_quran_presence('quran-online') allowed"))
      .rows[0].allowed,
    false,
  );
  assert.equal(
    (
      await db.query(
        "SELECT can_join_quran_presence('quran:context:not-a-uuid') allowed",
      )
    ).rows[0].allowed,
    false,
  );
  const summaries = (
    await db.query("SELECT * FROM get_quran_thread_summaries()")
  ).rows;
  assert.equal(summaries.length, 2);
  assert.equal(
    summaries.find((x) => x.context_id === appt1).last_message,
    "Lesson one only",
  );
  // Old NULL-context data is retained but excluded from lesson summaries.
  await db.query(
    "INSERT INTO chat_messages(sender_id,receiver_id,content) VALUES($1,$2,'legacy archive')",
    [student, teacher],
  );
  assert.equal(
    (await db.query("SELECT * FROM get_quran_thread_summaries()")).rows.find(
      (x) => x.context_id === appt1,
    ).last_message,
    "Lesson one only",
  );
  // Failure must roll back the cancellation, preserving the original booking.
  await assert.rejects(() =>
    db.query("SELECT reschedule_hoca_appointment($1,$2,'')", [
      appt1,
      date + "T11:00:00+03:00",
    ]),
  );
  assert.equal(
    (await db.query("SELECT status FROM appointments WHERE id=$1", [appt1]))
      .rows[0].status,
    "confirmed",
  );
  await as(outsider);
  await assert.rejects(() =>
    db.query("SELECT reschedule_hoca_appointment($1,$2,'')", [
      appt1,
      date + "T12:00:00+03:00",
    ]),
  );
  await as(student);
  const replacement = (
    await db.query(
      "SELECT * FROM reschedule_hoca_appointment($1,$2,'same lesson')",
      [appt1, date + "T12:00:00+03:00"],
    )
  ).rows[0];
  assert.equal(replacement.student_id, student);
  assert.equal(
    (await db.query("SELECT status FROM appointments WHERE id=$1", [appt1]))
      .rows[0].status,
    "cancelled",
  );
  await assert.rejects(() =>
    db.query("SELECT reschedule_hoca_appointment($1,$2,'')", [
      appt1,
      date + "T12:30:00+03:00",
    ]),
  );
  // Accepted peer connections are not reset by duplicate requests.
  const match = (
    await db.query("SELECT * FROM send_quran_peer_request($1,'hello')", [
      helper,
    ])
  ).rows[0];
  await as(helper);
  await db.query("SELECT respond_quran_peer_match($1,true)", [match.id]);
  await as(student);
  assert.equal(
    (
      await db.query("SELECT (send_quran_peer_request($1,'again')).status s", [
        helper,
      ])
    ).rows[0].s,
    "accepted",
  );
  await send(match.id, "peer-only");
  await assert.rejects(() =>
    db.query(
      "SELECT create_quran_study_room('bad',1::smallint,1::smallint,8::smallint,$1,NULL)",
      [[helper]],
    ),
  );
  await assert.rejects(() =>
    db.query(
      "SELECT create_quran_study_room('bad',1::smallint,1::smallint,7::smallint,$1,NULL)",
      [[outsider]],
    ),
  );
  const room = (
    await db.query(
      "SELECT * FROM create_quran_study_room('Fatiha study',1::smallint,1::smallint,7::smallint,$1,NULL)",
      [[helper]],
    )
  ).rows[0];
  const code = (
    await db.query("SELECT group_code FROM groups WHERE id=$1", [room.group_id])
  ).rows[0].group_code;
  await db.query("SELECT send_group_message($1,'Creator message')", [
    room.group_id,
  ]);
  await as(helper);
  assert.equal(
    (await db.query("SELECT * FROM quran_study_rooms")).rows.length,
    1,
  );
  assert.equal(
    (
      await db.query("SELECT * FROM chat_messages WHERE group_id=$1", [
        room.group_id,
      ])
    ).rows.length,
    0,
  );
  await assert.rejects(() => db.query("SELECT join_group_by_code($1)", [code]));
  await assert.rejects(() =>
    db.query("SELECT send_group_message($1,'before consent')", [room.group_id]),
  );
  await db.query("SELECT respond_quran_room_invite($1,true)", [room.id]);
  assert.equal(
    (
      await db.query("SELECT * FROM chat_messages WHERE group_id=$1", [
        room.group_id,
      ])
    ).rows.length,
    1,
  );
  await db.query("SELECT respond_quran_room_invite($1,true)", [room.id]);
  assert.equal(
    (
      await db.query("SELECT * FROM group_members WHERE group_id=$1", [
        room.group_id,
      ])
    ).rows.length,
    2,
  );
  await as(outsider);
  assert.equal(
    (await db.query("SELECT * FROM quran_study_rooms")).rows.length,
    0,
  );
  await assert.rejects(() =>
    db.query("SELECT respond_quran_room_invite($1,true)", [room.id]),
  );
  await assert.rejects(() => db.query("SELECT join_group_by_code($1)", [code]));
  await as(helper);
  await db.query("SELECT leave_group($1)", [room.group_id]);
  assert.equal(
    (
      await db.query("SELECT * FROM chat_messages WHERE group_id=$1", [
        room.group_id,
      ])
    ).rows.length,
    0,
  );
  await assert.rejects(() => db.query("SELECT join_group_by_code($1)", [code]));
  // Completed lesson notes are visible to both participants, never strangers.
  await db.exec("RESET ROLE");
  await db.query("UPDATE appointments SET status='completed' WHERE id=$1", [
    appt2,
  ]);
  await as(student);
  await db.query(
    "INSERT INTO appointment_notes(appointment_id,author_id,author_role,student_reflection) VALUES($1,$2,'student','Private mutual reflection')",
    [appt2, student],
  );
  await assert.rejects(() => db.query("UPDATE appointment_notes SET author_role='hoca' WHERE appointment_id=$1", [appt2]));
  await assert.rejects(() => db.query("UPDATE appointment_notes SET appointment_id=$1 WHERE appointment_id=$2", [appt1, appt2]));
  await db.query("UPDATE appointment_notes SET student_reflection='Private mutual reflection' WHERE appointment_id=$1", [appt2]);
  await as(teacher);
  assert.equal(
    (
      await db.query(
        "SELECT student_reflection FROM appointment_notes WHERE appointment_id=$1",
        [appt2],
      )
    ).rows[0].student_reflection,
    "Private mutual reflection",
  );
  await as(outsider);
  assert.equal(
    (await db.query("SELECT * FROM appointment_notes")).rows.length,
    0,
  );
  await db.exec("RESET ROLE");
  await db.query("UPDATE profiles SET role='admin' WHERE id=$1", [outsider]);
  await as(outsider);
  assert.equal((await db.query("SELECT * FROM appointment_notes")).rows.length, 0, "platform admin role alone never exposes private participant notes");
  await assert.rejects(() => db.query("INSERT INTO appointment_notes(appointment_id,author_id,author_role,performance_note) VALUES($1,$2,'hoca','Forged teacher note')", [appt2,outsider]));
  // --- Message edit/delete (migration 038) ---
  await db.exec("RESET ROLE");
  for (let attempt = 0; attempt < 2; attempt++) {
    await db.exec(fs.readFileSync("supabase/migrations/037_quran_peer_expansion.sql", "utf8"));
    await db.exec(fs.readFileSync("supabase/migrations/038_quran_message_edit.sql", "utf8"));
  }
  await db.query("UPDATE profiles SET quran_level='fluent' WHERE id=$1", [teacher]);
  await as(student);
  const pool = (await db.query("SELECT * FROM browse_quran_helpers()")).rows;
  assert.ok(pool.some(p => p.id === helper && p.quran_level === 'helper'));
  assert.ok(pool.some(p => p.id === teacher && p.quran_level === 'fluent'));
  assert.ok(!pool.some(p => p.id === student));
  assert.equal((await db.query("SELECT (send_quran_peer_request($1,'Fluent peer')).status s", [teacher])).rows[0].s, 'pending');
  await assert.rejects(() => db.query("SELECT send_quran_peer_request($1,'Wrong level')", [outsider]));
  // --- Opt-in one-to-one queue and active-partner guard (migration 039) ---
  await db.exec("RESET ROLE");
  const pairingSql = fs.readFileSync("supabase/migrations/2026101700_quran_peer_pairing_queue.sql", "utf8");
  await db.exec(pairingSql);
  await db.exec(pairingSql); // idempotent re-apply must preserve queued/match data.
  await db.query(
    "INSERT INTO profiles(id,display_name) VALUES($1,'Peer One'),($2,'Peer Two'),($3,'Peer Three')",
    [peerOne, peerTwo, peerThree],
  );
  await as(peerOne);
  const firstQueue = (await db.query("SELECT * FROM join_quran_peer_queue()")).rows[0];
  assert.equal(firstQueue.state, "waiting");
  assert.ok(firstQueue.queued_at);
  assert.equal((await db.query("SELECT * FROM get_my_quran_peer_queue()")).rows.length, 1);
  assert.equal((await db.query("SELECT * FROM join_quran_peer_queue()")).rows[0].state, "waiting", "repeated join is idempotent");
  await assert.rejects(() => db.query("INSERT INTO quran_peer_queue(user_id) VALUES($1)", [peerThree]), "queue writes are RPC-only");
  await as(peerTwo);
  const paired = (await db.query("SELECT * FROM join_quran_peer_queue()")).rows[0];
  assert.equal(paired.state, "matched");
  assert.equal(paired.partner_id, peerOne);
  assert.ok(paired.match_id);
  const relation = (await db.query("SELECT * FROM quran_peer_matches WHERE id=$1", [paired.match_id])).rows[0];
  assert.equal(relation.status, "accepted", "both queue opt-ins establish the private chat relationship");
  assert.equal((await db.query("SELECT * FROM get_my_quran_peer_queue()")).rows.length, 0);
  await assert.rejects(() => db.query("SELECT send_quran_peer_request($1,'Another partner')", [helper]), /PEER_ALREADY_MATCHED/);
  await as(peerOne);
  assert.equal((await db.query("SELECT * FROM join_quran_peer_queue()")).rows[0].state, "matched", "joined participant cannot be paired twice");
  assert.equal((await db.query("SELECT * FROM get_my_quran_peer_queue()")).rows.length, 0);
  assert.equal((await db.query("SELECT leave_quran_peer_match($1) left", [paired.match_id])).rows[0].left, true);
  assert.equal((await db.query("SELECT status FROM quran_peer_matches WHERE id=$1", [paired.match_id])).rows[0].status, "cancelled");
  assert.equal((await db.query("SELECT leave_quran_peer_match($1)", [paired.match_id])).rows[0].leave_quran_peer_match, false, "only an active participant match can be ended");
  const requeue = (await db.query("SELECT * FROM join_quran_peer_queue()")).rows[0];
  assert.equal(requeue.state, "waiting", "ending a pair permits a later opt-in");
  await as(peerThree);
  const nextPair = (await db.query("SELECT * FROM join_quran_peer_queue()")).rows[0];
  assert.equal(nextPair.state, "matched");
  assert.equal(nextPair.partner_id, peerOne);
  assert.equal((await db.query("SELECT count(*)::int n FROM quran_peer_matches WHERE status IN ('pending','accepted') AND (requester_id IN ($1,$2) OR helper_id IN ($1,$2))", [peerOne, peerThree])).rows[0].n, 1, "at most one active relation exists for either participant");
  await as(outsider);
  assert.equal((await db.query("SELECT * FROM get_my_quran_peer_queue()")).rows.length, 0);
  await db.exec("RESET ROLE;SET ROLE anon;RESET request.jwt.claim.sub");
  await assert.rejects(() => db.query("SELECT * FROM get_my_quran_peer_queue()"), "anonymous RPC access is denied");
  await as(peerOne);
  assert.equal((await db.query("SELECT leave_quran_peer_queue() left")).rows[0].left, false, "a matched user has no queue entry to leave");
  await as(student);
  const editMsg = (await send(appt2, "Typo here")).rows[0];
  await assert.rejects(() => db.query("SELECT update_quran_message($1,NULL)", [editMsg.id]));
  await assert.rejects(() => db.query("SELECT update_quran_message($1,'   ')", [editMsg.id]));
  await assert.rejects(() => db.query("SELECT update_quran_message($1,repeat('x',2001))", [editMsg.id]));
  // A receiver can acknowledge, but cannot forge edit/deletion metadata.
  await as(teacher);
  await assert.rejects(() => db.query("UPDATE chat_messages SET deleted_at=now(),is_read=true WHERE id=$1", [editMsg.id]));
  await assert.rejects(() => db.query("UPDATE chat_messages SET edited_at=now(),is_read=true WHERE id=$1", [editMsg.id]));
  await assert.rejects(() => db.query("SELECT delete_quran_message($1)", [editMsg.id]));
  await db.query("SELECT mark_quran_thread_read($1,$2)", [appt2,[editMsg.id]]);
  await as(student);
  await db.query("SELECT update_quran_message($1,'Fixed text')", [editMsg.id]);
  const edited = (await db.query("SELECT content,edited_at FROM chat_messages WHERE id=$1", [editMsg.id])).rows[0];
  assert.equal(edited.content, "Fixed text");
  assert.notEqual(edited.edited_at, null);
  // Outsider cannot edit student's message
  await as(outsider);
  await assert.rejects(() => db.query("SELECT update_quran_message($1,'hacked')", [editMsg.id]));
  // Student can soft-delete own message
  await as(student);
  await db.query("SELECT delete_quran_message($1)", [editMsg.id]);
  const deleted = (await db.query("SELECT content,deleted_at FROM chat_messages WHERE id=$1", [editMsg.id])).rows[0];
  assert.equal(deleted.content, "Bu mesaj silindi.");
  assert.notEqual(deleted.deleted_at, null);
  // Cannot edit or delete again after soft-delete
  await assert.rejects(() => db.query("SELECT update_quran_message($1,'retry')", [editMsg.id]));
  await assert.rejects(() => db.query("SELECT delete_quran_message($1)", [editMsg.id]));
  // A real legacy row older than fifteen minutes also cannot be edited/deleted.
  const oldMessage = (await db.query("INSERT INTO chat_messages(sender_id,receiver_id,content,created_at) VALUES($1,$2,'Old message',now()-interval '16 minutes') RETURNING id", [student,teacher])).rows[0].id;
  await assert.rejects(() => db.query("SELECT update_quran_message($1,'Too late')", [oldMessage]));
  await assert.rejects(() => db.query("SELECT delete_quran_message($1)", [oldMessage]));
  assert.equal((await db.query("SELECT content FROM chat_messages WHERE id=$1", [oldMessage])).rows[0].content, 'Old message');

  await db.exec("RESET ROLE;SET ROLE anon");
  for (const query of ["SELECT * FROM browse_quran_helpers()", "SELECT update_quran_message(NULL,'No')", "SELECT delete_quran_message(NULL)"])
    await assert.rejects(() => db.query(query));
  await assert.rejects(() =>
    db.query("SELECT * FROM get_quran_thread_summaries()"),
  );
  console.log(
    "PASS: thread isolation, bounded receipts, immutable routing/content, outsider/anon denial, private presence authorization, reschedule rollback, peer idempotency, room consent and code-bypass protection, message edit/delete ownership. Realtime delivery and concurrent production load NOT verified.",
  );
  await db.exec('RESET ROLE');
  for (const file of ['2026101701_quran_peer_profiles.sql','2026101702_smart_peer_matching.sql','2026101703_peer_study_sessions.sql','2026101704_peer_progress_tracking.sql']) {
    await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
  }
  const a=crypto.randomUUID(), b=crypto.randomUUID(), c=crypto.randomUUID();
  await db.query("INSERT INTO profiles(id,display_name) VALUES($1,'V2 learner'),($2,'V2 helper'),($3,'V2 outsider')",[a,b,c]);
  const pp={level:'beginner',current_surah:1,learning_goal:'practice',availability:{mon:['19:00-21:00']},study_preference:'written',bio_short:'Birlikte düzenli okumak istiyorum.',timezone:'Europe/Istanbul',discoverable:true};
  await as(a);
  await db.query('SELECT save_quran_peer_profile($1)',[pp]);
  await assert.rejects(()=>db.query('SELECT save_quran_peer_profile($1)',[{...pp,bio_short:'Beni test@example.com adresinden bul'}]));
  await assert.rejects(()=>db.query('SELECT save_quran_peer_profile($1)',[{...pp,availability:{mon:['21:00-19:00']}}]));
  await as(b);await db.query('SELECT save_quran_peer_profile($1)',[{...pp,level:'helper'}]);
  await as(a);
  let candidates=(await db.query('SELECT discover_quran_peers() result')).rows[0].result;
  assert.equal(candidates.find(x=>x.user_id===b).score,100,'matching score uses all five factors');
  assert.equal((await db.query('SELECT smart_match_quran_peer() result')).rows[0].result.state,'waiting');
  await as(b);
  const pairedV2=(await db.query('SELECT smart_match_quran_peer() result')).rows[0].result;
  assert.equal(pairedV2.state,'matched');
  await assert.rejects(()=>db.query('SELECT smart_match_quran_peer()'),'only one active partner');
  const mid=pairedV2.match_id;
  const session=(await db.query("SELECT peer_study_action($1,'create',$2) result",[mid,{duration_minutes:5,surah:1}])).rows[0].result;
  await db.query("SELECT peer_study_action($1,'ready',$2)",[mid,{session_id:session.id}]);
  assert.equal((await db.query('SELECT get_peer_workspace($1) result',[mid])).rows[0].result.session.started_at,null,'one participant cannot start the shared timer');
  await as(a);await db.query("SELECT peer_study_action($1,'ready',$2)",[mid,{session_id:session.id}]);
  await assert.rejects(()=>db.query("SELECT peer_study_action($1,'complete',$2)",[mid,{session_id:session.id,pages:2}]),'cannot complete early');
  await as(c);
  assert.equal((await db.query('SELECT * FROM quran_peer_profiles')).rows.length,0,'other private profile rows are not readable');
  assert.equal((await db.query('SELECT * FROM quran_peer_study_sessions')).rows.length,0,'session RLS denies outsiders');
  await assert.rejects(()=>db.query('SELECT get_peer_workspace($1)',[mid]));
  await assert.rejects(()=>db.query("SELECT peer_study_action($1,'cancel',$2)",[mid,{session_id:session.id}]));
  await assert.rejects(()=>db.query('SELECT set_peer_weekly_goal($1,10)',[mid]));
  await db.exec('RESET ROLE');
  await db.query("UPDATE quran_peer_study_sessions SET started_at=now()-interval '6 minutes' WHERE id=$1",[session.id]);
  await as(a);await db.query("SELECT peer_study_action($1,'complete',$2)",[mid,{session_id:session.id,pages:2}]);
  assert.equal((await db.query('SELECT get_peer_workspace($1) result',[mid])).rows[0].result.total_pages,0,'requires both completions');
  await as(b);await db.query("SELECT peer_study_action($1,'complete',$2)",[mid,{session_id:session.id,pages:3}]);
  const progress=(await db.query('SELECT get_peer_workspace($1) result',[mid])).rows[0].result;
  assert.equal(progress.total_pages,5);assert.equal(progress.streak,1);assert.equal(progress.surahs,1);assert.equal(progress.session,null);
  await db.exec('RESET ROLE;SET ROLE anon;RESET request.jwt.claim.sub');
  for(const q of ['SELECT discover_quran_peers()','SELECT smart_match_quran_peer()',"SELECT save_quran_peer_profile('{}')"]){await assert.rejects(()=>db.query(q));}
  console.log('PASS: V2 profile validation, opt-in matching score, one-partner invariant, two-party timer, completion gate, progress and outsider/anon RLS.');
  await db.close();
}
run().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
