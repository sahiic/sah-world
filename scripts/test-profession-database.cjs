// Isolated PostgreSQL only. Never connects to a real Supabase project.
const path=require('node:path'), fs=require('node:fs'), assert=require('node:assert/strict');
const {PGlite}=require(path.join(process.env.QURAN_PGLITE_ROOT || path.join(require('node:os').tmpdir(),'sah-quran-pglite'),'node_modules/@electric-sql/pglite'));
const {PROFESSION_LESSONS,PROFESSION_TRACKS}=require('../tests/helpers/load-typescript.cjs')('src/lib/professionSchool.ts');
async function run(){
  const db=new PGlite();
  try {
    await db.exec(`CREATE ROLE authenticated; CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
      CREATE TABLE profiles(id uuid PRIMARY KEY,xp integer DEFAULT 0,badges text[] DEFAULT '{}');
      CREATE TABLE xp_events(user_id uuid,source_type text,source_id uuid,label text,xp_amount integer,UNIQUE(user_id,source_type,source_id));
      CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN NEW.updated_at=now();RETURN NEW;END';`);
    await db.exec(fs.readFileSync('supabase/migrations/011_profession_ethics_school.sql','utf8'));
    await db.exec(`INSERT INTO profiles(id) VALUES('11111111-1111-4111-8111-111111111111');
      INSERT INTO user_lesson_progress(user_id,lesson_id,reflection_note) VALUES('11111111-1111-4111-8111-111111111111','muhendis-1','Preserve this private fixture');`);
    const before=(await db.query('SELECT * FROM user_lesson_progress')).rows;
    for(let i=0;i<2;i++) await db.exec(fs.readFileSync('supabase/migrations/039_profession_new_tracks.sql','utf8'));
    assert.equal((await db.query('SELECT count(*)::int n FROM profession_tracks')).rows[0].n,10);
    assert.equal((await db.query('SELECT count(*)::int n FROM profession_lessons')).rows[0].n,80);
    assert.deepEqual((await db.query('SELECT * FROM user_lesson_progress')).rows,before);
    const ids=['avukat','eczaci','muhasebeci','hemsire'];
    for(const lesson of PROFESSION_LESSONS.filter(l=>ids.includes(l.trackId))){
      const row=(await db.query('SELECT * FROM profession_lessons WHERE id=$1',[lesson.id])).rows[0];
      assert.deepEqual(row.content_body,lesson.content);assert.deepEqual(row.source_references,lesson.sourceReferences);
      assert.equal(row.title,lesson.title);assert.equal(row.xp_reward,30);
    }
    for(const track of PROFESSION_TRACKS.filter(t=>ids.includes(t.id)))assert.equal((await db.query('SELECT profession_name FROM profession_tracks WHERE id=$1',[track.id])).rows[0].profession_name,track.professionName);
    console.log('PASS: 10 tracks / 80 lessons, repeatable seed, client parity and existing user progress preserved. Isolated fixture only.');
  } finally {await db.close()}
}
run().catch(error=>{console.error(error);process.exitCode=1});
