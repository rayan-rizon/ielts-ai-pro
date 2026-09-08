// Run ONLY against an isolated local database with the Skill Lab migrations applied.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
const run = promisify(execFile);
const connection = process.env.SKILL_LAB_TEST_DATABASE_URL;
if (!connection || !['127.0.0.1', 'localhost'].includes(new URL(connection).hostname))
  throw new Error('Set SKILL_LAB_TEST_DATABASE_URL to an isolated localhost PostgreSQL database.');
const psql = process.env.PSQL_BIN || 'psql';
const user = randomUUID(),
  auth = randomUUID();
const quote = (s) => "'" + String(s).replaceAll("'", "''") + "'";
async function sql(text) {
  return (await run(psql, [connection, '-Atq', '-v', 'ON_ERROR_STOP=1', '-c', text])).stdout.trim();
}
async function start(id) {
  return sql(
    `begin;set local role authenticated;select set_config('request.jwt.claim.sub',${quote(auth)},true);select public.skill_lab_action('start',null,jsonb_build_object('skill','reading_true_false_not_given','request_id',${quote(id)}));commit;`
  );
}
const wasEnabled = await sql('select enabled from skill_lab_private.settings');
try {
  await sql(
    `insert into auth.users(id,email) values(${quote(auth)},'concurrency@example.invalid');delete from public.users where auth_id=${quote(auth)};insert into public.users(id,auth_id,email) values(${quote(user)},${quote(auth)},'concurrency@example.invalid');update skill_lab_private.settings set enabled=true;`
  );
  const id = randomUUID();
  const duplicate = await Promise.allSettled([start(id), start(id)]);
  if (duplicate.some((r) => r.status !== 'fulfilled'))
    throw new Error('Same-request concurrency failed');
  if (
    (await sql(`select count(*) from public.skill_lab_sessions where user_id=${quote(user)}`)) !==
    '1'
  )
    throw new Error('Duplicate request consumed two lessons');
  const competing = await Promise.allSettled([start(randomUUID()), start(randomUUID())]);
  if (competing.filter((r) => r.status === 'fulfilled').length !== 1)
    throw new Error('Last free lesson was not reserved atomically');
  if (
    (await sql(`select count(*) from public.skill_lab_sessions where user_id=${quote(user)}`)) !==
    '2'
  )
    throw new Error('Daily limit exceeded');
  console.log('Concurrent duplicate starts and competition for the last free lesson passed.');
} finally {
  await sql(
    `delete from public.users where id=${quote(user)};delete from auth.users where id=${quote(auth)};update skill_lab_private.settings set enabled=${wasEnabled === 't' ? 'true' : 'false'};`
  );
}
