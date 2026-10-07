// Isolated PostgreSQL fixture, NOT a live Supabase test. No production credentials.
const path = require("node:path"),
  os = require("node:os");
const runtimeRoot =
  process.env.QURAN_PGLITE_ROOT || path.join(os.tmpdir(), "sah-quran-pglite");
const { PGlite } = require(
  path.join(runtimeRoot, "node_modules/@electric-sql/pglite"),
);
const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
async function run() {
  const db = new PGlite();
  const viewer = "11111111-1111-4111-8111-111111111111",
    other = "22222222-2222-4222-8222-222222222222";
  await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE SCHEMA auth;
 CREATE TABLE auth.users(id UUID PRIMARY KEY,email TEXT);CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS 'SELECT nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
 GRANT USAGE ON SCHEMA auth TO authenticated;GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
 CREATE TABLE profiles(id UUID PRIMARY KEY,display_name TEXT,role TEXT DEFAULT 'user');
 CREATE TABLE hoca_profiles(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID UNIQUE REFERENCES profiles(id),display_name TEXT,title TEXT,bio TEXT,specialties TEXT[],is_active BOOLEAN,is_placeholder BOOLEAN);
 CREATE TABLE appointments(id UUID PRIMARY KEY,student_id UUID REFERENCES profiles(id),hoca_id UUID REFERENCES hoca_profiles(id),status TEXT);
 CREATE TABLE quran_study_goals(id UUID PRIMARY KEY,user_id UUID REFERENCES profiles(id),title TEXT,progress_percent INTEGER);
 CREATE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS 'BEGIN NEW.updated_at=now();RETURN NEW;END';
 CREATE FUNCTION public.is_quran_admin() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path=public AS 'SELECT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role=''admin'')';
 INSERT INTO auth.users VALUES('${viewer}','eyuperen5633@gmail.com');INSERT INTO profiles VALUES('${viewer}','Fixture Admin','user'),('${other}','Other User','user');
 GRANT SELECT ON appointments,hoca_profiles TO authenticated;`);
  for (let attempt = 0; attempt < 2; attempt++)
    for (const file of [
      "031_quran_companion_pro.sql",
      "032_quran_readiness.sql",
      "033_quran_answer_keys.sql",
    ])
      await db.exec(fs.readFileSync("supabase/migrations/" + file, "utf8"));
  assert.equal(
    (await db.query(`SELECT role FROM profiles WHERE id='${viewer}'`)).rows[0]
      .role,
    "admin",
  );
  assert.equal(
    (
      await db.query(
        `SELECT title FROM hoca_profiles WHERE user_id='${viewer}'`,
      )
    ).rows[0].title,
    "Baş Muallim",
  );
  const hocaId = (
    await db.query(`SELECT id FROM hoca_profiles WHERE user_id='${viewer}'`)
  ).rows[0].id;
  const appointmentId = crypto.randomUUID();
  await db.query("INSERT INTO appointments VALUES($1,$2,$3,'completed')", [
    appointmentId,
    other,
    hocaId,
  ]);
  const keys = (
    await db.query(
      "SELECT * FROM quran_practice_keys WHERE practice_type='letters' ORDER BY question_id LIMIT 8",
    )
  ).rows;
  const answers = keys.map((k) => ({
      questionId: k.question_id,
      selected: k.answer,
    })),
    session = crypto.randomUUID();
  await db.exec(`SET ROLE authenticated;SET request.jwt.claim.sub='${viewer}'`);
  const submit = (id = session, score = 8, a = answers) =>
    db.query("SELECT submit_quran_practice($1,$2,$3,$4,$5,$6) result", [
      id,
      "letters",
      score,
      8,
      30,
      JSON.stringify(a),
    ]);
  assert.equal((await submit()).rows[0].result.reward, 25);
  assert.equal((await submit()).rows[0].result.replayed, true);
  assert.equal(
    Number((await db.query("SELECT get_my_hasanat_total() n")).rows[0].n),
    25,
  );
  assert.equal(
    (await db.query("SELECT * FROM quran_streaks")).rows[0].current_streak,
    1,
  );
  await assert.rejects(() =>
    submit(crypto.randomUUID(), 8, [...answers.slice(1), answers[1]]),
  );
  await assert.rejects(() => submit(crypto.randomUUID(), 7));
  await assert.rejects(() =>
    submit(
      crypto.randomUUID(),
      8,
      answers.map((a) => ({ ...a, questionId: "unknown" })),
    ),
  );
  await assert.rejects(() =>
    db.query(
      "INSERT INTO quran_hasanat(user_id,amount,source) VALUES($1,99,'daily')",
      [viewer],
    ),
  );
  await assert.rejects(() => db.query("SELECT record_quran_activity()"));
  await assert.rejects(() =>
    db.query("SELECT submit_quran_practice(NULL,NULL,NULL,NULL,NULL,NULL)"),
  );
  await assert.rejects(() => db.query("SELECT * FROM quran_practice_keys"));
  await db.exec(`SET request.jwt.claim.sub='${other}'`);
  assert.equal(
    (await db.query("SELECT * FROM quran_exercise_results")).rows.length,
    0,
  );
  await assert.rejects(() => submit());
  await assert.rejects(() =>
    db.query("SELECT admin_set_quran_role($1,'admin')", [other]),
  );
  assert.equal(
    (await db.query("SELECT * FROM get_quran_weekly_leaderboard()")).rows
      .length,
    0,
  );
  await db.exec(
    `RESET ROLE;INSERT INTO quran_leaderboard_preferences(user_id,opted_in) VALUES('${viewer}',true);SET ROLE authenticated`,
  );
  const board = (await db.query("SELECT * FROM get_quran_weekly_leaderboard()"))
    .rows;
  assert.equal(board.length, 1);
  assert.ok(!JSON.stringify(board).includes(viewer));
  assert.ok(!JSON.stringify(board).includes("@"));
  const reviewId = crypto.randomUUID();
  await db.query(
    "INSERT INTO quran_teacher_reviews(id,appointment_id,hoca_id,student_id,rating,comment) VALUES($1,$2,$3,$4,5,'Patient teaching')",
    [reviewId, appointmentId, hocaId, other],
  );
  assert.equal(
    (await db.query("SELECT * FROM get_quran_teacher_reviews($1)", [hocaId]))
      .rows.length,
    0,
  );
  await db.exec(`SET request.jwt.claim.sub='${viewer}'`);
  assert.equal(
    (await db.query("SELECT * FROM quran_teacher_reviews")).rows.length,
    0,
  );
  await assert.rejects(() =>
    db.query(
      "INSERT INTO quran_teacher_reviews(appointment_id,hoca_id,student_id,rating,comment) VALUES($1,$2,$3,5,'Forged feedback')",
      [appointmentId, hocaId, viewer],
    ),
  );
  await db.exec(`SET request.jwt.claim.sub='${other}'`);
  await db.query(
    "UPDATE quran_teacher_reviews SET published=true WHERE id=$1",
    [reviewId],
  );
  await db.exec(`SET request.jwt.claim.sub='${viewer}'`);
  const publicReviews = (
    await db.query("SELECT * FROM get_quran_teacher_reviews($1)", [hocaId])
  ).rows;
  assert.equal(publicReviews.length, 1);
  assert.deepEqual(Object.keys(publicReviews[0]).sort(), [
    "comment",
    "created_at",
    "rating",
  ]);
  assert.ok(!JSON.stringify(publicReviews).includes(other));
  await db.exec("RESET ROLE;SET ROLE anon");
  await assert.rejects(() =>
    db.query("SELECT * FROM get_quran_teacher_reviews($1)", [hocaId]),
  );
  await assert.rejects(() =>
    db.query("SELECT * FROM get_quran_weekly_leaderboard()"),
  );
  await db.close();
  console.log(
    "PASS: repeatable migrations, approved bootstrap fixture, answer validation, atomic retry, ownership/role isolation, restricted ledger/streak writes, opt-in anonymous leaderboard, private/opt-in teacher feedback. NOT tested on production.",
  );
}
run().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
