// Isolated PostgreSQL engine verification. Install PGlite in a temporary folder,
// then pass its dist/index.js path; no live data, credentials, or schema writes.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const migration = readFileSync(
  'supabase/migrations/20261012204757_optimize_dashboard_timezone_and_activity.sql',
  'utf8'
);
const historyMigration = readFileSync(
  'supabase/migrations/20261012204906_bound_admin_user_session_history.sql',
  'utf8'
);
const original = readFileSync(
  'supabase/migrations/20261006000411_restore_learner_dashboard_accuracy.sql',
  'utf8'
);
const dashboard = original.slice(
  original.indexOf('CREATE FUNCTION public.get_dashboard_stats'),
  original.indexOf('DROP FUNCTION IF EXISTS public.get_recent_sessions')
);
const activitySource = readFileSync(
  'supabase/migrations/20260919202000_accurate_admin_active_user_history.sql',
  'utf8'
);
const activityTrigger = activitySource.slice(
  activitySource.indexOf(
    'CREATE OR REPLACE FUNCTION admin_analytics_private.capture_user_activity_day()'
  ),
  activitySource.indexOf('-- Replace the legacy caller-controlled')
);
const userId = '00000000-0000-0000-0000-000000000001';
const authId = '10000000-0000-0000-0000-000000000001';

await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated, anon;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE AS
    $$ SELECT coalesce(current_setting('test.admin', true), '') = 'yes' $$;
  CREATE TABLE public.users(id uuid PRIMARY KEY, auth_id uuid UNIQUE,
    study_availability jsonb, last_active timestamptz, updated_at timestamptz);
  CREATE TABLE public.test_sessions(id uuid PRIMARY KEY, user_id uuid, test_type text,
    score numeric, actual_duration_seconds integer, content_data jsonb,
    is_completed boolean, completed_at timestamptz, created_at timestamptz);
  CREATE TABLE public.learning_path_activities(user_id uuid, is_completed boolean,
    completion_source text, completed_at timestamptz);
  CREATE SCHEMA admin_analytics_private;
  CREATE TABLE admin_analytics_private.user_activity_days(user_id uuid, activity_day date,
    first_seen_at timestamptz, last_seen_at timestamptz, PRIMARY KEY(user_id,activity_day));
  CREATE FUNCTION public.is_abandoned_test_session(text,numeric,integer,jsonb)
    RETURNS boolean LANGUAGE sql IMMUTABLE AS $$ SELECT coalesce(($4->>'abandoned')::boolean,false) $$;
  CREATE FUNCTION public.get_session_duration_seconds(text,integer,jsonb)
    RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT coalesce($2,0) $$;
  INSERT INTO users VALUES ('${userId}','${authId}','{"timezone":"Asia/Dhaka"}',NULL,NULL);
  INSERT INTO test_sessions
    SELECT md5(g::text)::uuid,'${userId}',CASE WHEN g%2=0 THEN 'reading' ELSE 'writing' END,
      CASE WHEN g=1 THEN 0 ELSE 6 + (g%3)*0.5 END, 600,
      jsonb_build_object('abandoned',g=2,'large_body',repeat('x',10000)),g<>3,
      now()-make_interval(days=>g%6),now()-make_interval(days=>g%6)
    FROM generate_series(1,60) g;
  INSERT INTO learning_path_activities VALUES
    ('${userId}',true,'manual',now()),('${userId}',true,'test_session',now());
  SELECT set_config('request.jwt.claim.sub','${authId}',false);
`);
await db.exec(activityTrigger);
await db.exec(dashboard);
const query = async (sql, params = []) => (await db.query(sql, params)).rows;
const inputs = [
  'Asia/Dhaka',
  'America/New_York',
  'Europe/London',
  'UTC',
  'US/Eastern',
  '',
  null,
  'invalid/zone',
  'utc',
  'UTC+6',
];
await db.exec('BEGIN'); // Keep now() fixed across old/new outputs.
const expected = [];
for (const input of inputs)
  expected.push((await query('SELECT get_dashboard_stats($1)::jsonb result', [input]))[0].result);
await db.exec(migration);
await db.exec(migration); // Idempotency and ACL preservation.
for (const [index, input] of inputs.entries()) {
  assert.deepEqual(
    (await query('SELECT get_dashboard_stats($1)::jsonb result', [input]))[0].result,
    expected[index]
  );
}
assert.equal(
  (await query('SELECT count(*)::int count FROM dashboard_private.timezone_names'))[0].count,
  (await query('SELECT count(*)::int count FROM pg_timezone_names'))[0].count
);
assert.equal(
  (
    await query(
      "SELECT has_schema_privilege('authenticated','dashboard_private','USAGE') permitted"
    )
  )[0].permitted,
  false
);
assert.equal(
  (
    await query(
      "SELECT has_function_privilege('anon','public.get_dashboard_stats(text)','EXECUTE') permitted"
    )
  )[0].permitted,
  false
);
assert.equal(
  (
    await query(
      "SELECT has_function_privilege('authenticated','public.get_dashboard_stats(text)','EXECUTE') permitted"
    )
  )[0].permitted,
  true
);
await db.exec('COMMIT');

// The only substitution in this test is the clock; test the real RPC predicate
// and real daily-history trigger around Dhaka midnight deterministically.
const fixedClockMigration = migration.replace(
  'clock_timestamp()',
  "current_setting('test.now')::timestamptz"
);
await db.exec(fixedClockMigration);
for (const [previous, now, shouldWrite] of [
  [null, '2026-10-12T17:59:00Z', true],
  ['2026-10-12T17:58:00Z', '2026-10-12T17:59:00Z', false],
  ['2026-10-12T17:59:00Z', '2026-10-12T18:00:00Z', true],
  ['2026-10-12T18:00:00Z', '2026-10-12T18:04:59Z', false],
  ['2026-10-12T18:00:00Z', '2026-10-12T18:05:00Z', true],
  ['2026-10-13T18:00:00Z', '2026-10-12T18:05:00Z', true],
]) {
  await db.query('UPDATE users SET last_active=$1,updated_at=$1', [previous]);
  await db.query("SELECT set_config('test.now',$1,false)", [now]);
  await db.query('SELECT update_user_last_active($1)', [authId]);
  const actual = (await query('SELECT last_active FROM users'))[0].last_active;
  assert.equal(
    actual?.getTime() ?? null,
    shouldWrite ? Date.parse(now) : previous ? Date.parse(previous) : null
  );
  if (shouldWrite) {
    assert.equal(
      (
        await query(
          "SELECT count(*)::int count FROM admin_analytics_private.user_activity_days WHERE activity_day=($1::timestamptz AT TIME ZONE 'Asia/Dhaka')::date",
          [now]
        )
      )[0].count,
      1
    );
  }
}
await assert.rejects(db.query('SELECT update_user_last_active($1)', [userId]), /Access denied/);
await db.query("SELECT set_config('request.jwt.claim.sub','',false)");
await assert.rejects(db.query('SELECT update_user_last_active($1)', [authId]), /Access denied/);

await db.exec(
  `UPDATE test_sessions SET created_at=NULL WHERE id IN (SELECT id FROM test_sessions ORDER BY id LIMIT 3)`
);
await db.exec(historyMigration);
await assert.rejects(
  db.query('SELECT admin_user_session_history($1)', [userId]),
  /Admin access required/
);
await db.query("SELECT set_config('test.admin','yes',false)");
const allIds = [];
let cursor = null;
let stats;
do {
  const page = (
    await query('SELECT admin_user_session_history($1,$2,$3,25) result', [
      userId,
      cursor?.created_at ?? null,
      cursor?.id ?? null,
    ])
  )[0].result;
  assert.ok(page.sessions.length <= 25);
  for (const row of page.sessions) assert.equal('content_data' in row, false);
  if (stats) assert.deepEqual(page.stats, stats);
  stats = page.stats;
  allIds.push(...page.sessions.map((row) => row.id));
  cursor = page.nextCursor;
} while (cursor);
assert.equal(allIds.length, 60);
assert.equal(new Set(allIds).size, 60); // Equal timestamps must not skip/duplicate.
assert.equal(stats.totalCompleted, 58);
assert.equal(stats.recentTrend.length, 10);
const summary = (
  await query(
    "SELECT to_char(avg(score),'FM999990.0') average FROM test_sessions WHERE is_completed AND score<>0"
  )
)[0];
assert.equal(stats.overallAverage, summary.average);
await assert.rejects(
  db.query('SELECT admin_user_session_history($1,now(),NULL,25)', [userId]),
  /Both cursor fields/
);
assert.equal(
  (
    await query(
      "SELECT has_function_privilege('anon','public.admin_user_session_history(uuid,timestamptz,uuid,integer)','EXECUTE') allowed"
    )
  )[0].allowed,
  false
);
assert.equal(
  (await query('SELECT admin_user_session_history($1,NULL,NULL,1000) result', [userId]))[0].result
    .sessions.length,
  50
);
const boundaries = (
  await query(`SELECT
  ('2026-03-08'::timestamp AT TIME ZONE 'America/New_York') start,
  ('2026-03-09'::timestamp AT TIME ZONE 'America/New_York') finish`)
)[0];
assert.equal(boundaries.finish - boundaries.start, 23 * 60 * 60 * 1000);
// Real Writing trigger/claim bodies, with only their required table fixture.
const coaching = readFileSync(
  'supabase/migrations/20260923184024_writing_practice_coaching.sql',
  'utf8'
);
await db.exec(coaching.slice(coaching.indexOf('create table'), coaching.indexOf('create index')));
await db.exec('ALTER TABLE test_sessions ADD COLUMN user_responses jsonb');
await db.exec(
  coaching.slice(
    coaching.indexOf('create or replace function public.validate_writing_coaching_insert')
  )
);
await db.exec(`
  CREATE SCHEMA ai_coach_private;
  CREATE TABLE ai_coach_messages(user_id uuid);
  CREATE TABLE ai_coach_action_proposals(conversation_id uuid,message_id uuid);
  CREATE TABLE ai_coach_activity_links(conversation_id uuid,proposal_id uuid,source_session_id uuid,completed_session_id uuid);
  CREATE TABLE ai_coach_private.exercise_answers(user_id uuid);
  CREATE TABLE ai_coach_private.operations(conversation_id uuid);
`);
const hardening = readFileSync(
  'supabase/migrations/20261012204910_harden_writing_search_paths_and_coach_foreign_keys.sql',
  'utf8'
);
await db.exec('BEGIN');
await db.exec(hardening);
await db.exec('COMMIT');
await db.exec(
  `UPDATE test_sessions SET user_responses='[{"task2_response":"saved essay"}]' WHERE id=md5('5')::uuid`
);
await db.query(
  `INSERT INTO writing_practice_coaching(id,session_id,user_id,task_type,original_text,revision_text)
  VALUES($1,md5('5')::uuid,$2,'Task 2','saved essay','saved essay')`,
  [userId, userId]
);
assert.equal((await query('SELECT claim_writing_transformation($1) ok', [userId]))[0].ok, true);
assert.equal((await query('SELECT claim_writing_transformation($1) ok', [userId]))[0].ok, false);
assert.equal(
  (await query('SELECT claim_writing_revision_check($1,$2) ok', [userId, 'saved essay']))[0].ok,
  true
);
assert.equal(
  (await query('SELECT claim_writing_revision_check($1,$2) ok', [userId, 'saved essay']))[0].ok,
  false
);
await assert.rejects(
  db.query(
    `INSERT INTO writing_practice_coaching(session_id,user_id,task_type,original_text,revision_text)
  VALUES(md5('7')::uuid,$1,'Task 2','invented answer','invented answer')`,
    [userId]
  ),
  /saved original/
);
assert.equal(
  (
    await query(
      "SELECT has_function_privilege('authenticated','claim_writing_transformation(uuid)','EXECUTE') allowed"
    )
  )[0].allowed,
  false
);
assert.equal(
  (
    await query(
      "SELECT has_function_privilege('service_role','claim_writing_transformation(uuid)','EXECUTE') allowed"
    )
  )[0].allowed,
  true
);
assert.equal(
  (await query("SELECT count(*)::int count FROM pg_indexes WHERE indexname LIKE '%_fk'"))[0].count,
  9
);
await db.close();
console.log(
  'PASS: 10 old/new dashboard outputs; exact timezone whitelist; ACLs; 6 heartbeat boundary cases; daily-history trigger; auth denials; 60-row tied/null cursor pagination; lifetime summaries; page limit; DST boundary; real Writing trigger/claims with pinned search paths; 9 FK indexes.'
);
