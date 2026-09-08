// Isolated local DB only: real transaction races, ownership and AI access checks.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
const run = promisify(execFile);
const connection = process.env.SKILL_LAB_TEST_DATABASE_URL;
if (!connection || !['127.0.0.1', 'localhost'].includes(new URL(connection).hostname)) throw Error('Use an isolated localhost database.');
const psql = process.env.PSQL_BIN || 'psql';
const auth = randomUUID(), user = randomUUID(), group = `qa-${randomUUID()}`;
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
async function sql(text) { return (await run(psql, [connection, '-Atq', '-v', 'ON_ERROR_STOP=1', '-c', text])).stdout.trim(); }
async function start(id) { return JSON.parse(await sql(`select public.practice_library_state('${auth}','start',null,jsonb_build_object('group_id','${group}','request_id','${id}'))`)); }
async function rejects(work, label) { let failed = false; try { await work(); } catch { failed = true; } if (!failed) throw Error(label); }
try {
  await sql(`insert into auth.users(id,email) values('${auth}','qa@example.invalid');insert into public.users(id,auth_id,email,subscription_tier) values('${user}','${auth}','qa@example.invalid','free');insert into skill_lab_private.library_preview_users values('${auth}',now()+interval '1 hour');insert into skill_lab_private.library_groups(id,source_id,focus,version,snapshot,eligible) select '${group}',id,'reading:multiple_choice','qa',jsonb_build_object('source',jsonb_build_object('title',title),'questions','[]'::jsonb),true from public.passages where is_active and access_tier='free' and test_type='reading' limit 1;`);
  const request = randomUUID();
  const duplicate = await Promise.all([start(request), start(request)]);
  if (duplicate[0].id !== duplicate[1].id) throw Error('Duplicate start charged twice');
  const session = duplicate[0].id;
  const race = await Promise.allSettled([start(randomUUID()), start(randomUUID())]);
  if (race.filter(r => r.status === 'fulfilled').length !== 1) throw Error('Free limit race failed');
  if (await sql(`select count(*) from skill_lab_private.library_sessions where user_id='${user}'`) !== '2') throw Error('Incorrect daily use');
  await rejects(() => sql(`set role authenticated;select public.practice_library_state('${auth}','resume','${session}')`), 'Client can read private state');
  await rejects(() => sql(`select public.practice_library_state('${randomUUID()}','resume','${session}')`), 'Cross-user read allowed');
  await rejects(() => sql(`select public.practice_library_ai_reserve('${auth}','${session}','${randomUUID()}','help')`), 'Free AI allowed');
  await sql(`update public.users set subscription_tier='premium' where id='${user}'`);
  const reserved = JSON.parse(await sql(`select public.practice_library_ai_reserve('${auth}','${session}','${randomUUID()}','help')`));
  if (reserved.state !== 'reserved') throw Error('Paid preview AI blocked');
  await rejects(() => sql(`select public.practice_library_ai_reserve('${auth}','${session}','${randomUUID()}','help')`), 'Concurrent AI allowed');
  await sql(`update skill_lab_private.library_preview_users set expires_at=now()-interval '1 second' where auth_id='${auth}'`);
  const globallyEnabled = await sql('select library_enabled from skill_lab_private.settings');
  if (globallyEnabled === 'f') await rejects(() => start(randomUUID()), 'Expired preview allowed');
  console.log('PASS: duplicate starts, final free allowance race, client grants, ownership, free AI, paid preview AI, concurrent AI, preview expiry.');
} finally {
  await sql(`delete from skill_lab_private.operations where user_id='${user}';delete from public.practice_library_exposure where user_id='${user}';delete from skill_lab_private.library_sessions where user_id='${user}';delete from skill_lab_private.library_groups where id=${quote(group)};delete from skill_lab_private.library_preview_users where auth_id='${auth}';delete from public.users where id='${user}';delete from auth.users where id='${auth}';`);
}
