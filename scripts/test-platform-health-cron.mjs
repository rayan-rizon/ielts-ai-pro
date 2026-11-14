import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:net';
const exec = promisify(execFile);
const bin = process.env.SCALABILITY_PG_BIN || '/opt/homebrew/opt/postgresql@16/bin';
const root = resolve(import.meta.dirname, '..');
const temp = await mkdtemp(join(tmpdir(), 'ielts-health-cron-'));
const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
await new Promise((resolve) => server.close(resolve));
let started = false;
const psql = async (sql) =>
  exec(
    join(bin, 'psql'),
    [
      '-h',
      '127.0.0.1',
      '-p',
      String(port),
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-At',
      '-c',
      sql,
    ],
    { maxBuffer: 4 * 1024 * 1024 }
  );
function baselineFunction(source, marker, name, renamed) {
  const from = source.indexOf(marker);
  const start = source.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`, from);
  const end = source.indexOf('$function$;', start) + '$function$;'.length;
  if ([from, start].some((index) => index < 0)) throw Error('Baseline health function missing');
  if (end < start) throw Error('Baseline health function missing');
  return source.slice(start, end).replace(`public.${name}(`, `public.${renamed}(`);
}
try {
  await exec(join(bin, 'initdb'), ['-D', join(temp, 'data'), '--auth=trust', '--encoding=UTF8']);
  await exec(join(bin, 'pg_ctl'), [
    '-D',
    join(temp, 'data'),
    '-l',
    join(temp, 'postgres.log'),
    '-o',
    `-p ${port} -h 127.0.0.1 -k ${temp}`,
    'start',
  ]);
  started = true;
  await psql(
    await readFile(join(root, 'supabase/tests/helpers/platform_health_cron_fixture.sql'), 'utf8')
  );
  const baseline = await readFile(
    join(root, 'supabase/migrations/20260902120537_complete_project_baseline.sql'),
    'utf8'
  );
  await psql(
    baselineFunction(
      baseline,
      'RENAME TO get_platform_health_core_v2;',
      'get_platform_health',
      'get_platform_health_core_v3'
    )
  );
  await psql(
    baselineFunction(
      baseline,
      'RENAME TO get_platform_health_incidents_core_v2;',
      'get_platform_health_incidents',
      'get_platform_health_incidents_core_v3'
    )
  );
  await psql(
    await readFile(
      join(root, 'supabase/migrations/20261114155233_optimize_platform_health_cron_history.sql'),
      'utf8'
    )
  );
  await psql(await readFile(join(root, 'supabase/tests/platform_health_cron.sql'), 'utf8'));
  console.log(
    'Platform-health PostgreSQL checks passed: bounded synchronization, running transitions, incident evidence, start-time ordering, staleness, reset recovery, and authorization.'
  );
} catch (error) {
  throw new Error(error.stderr || error.message);
} finally {
  if (started) await exec(join(bin, 'pg_ctl'), ['-D', join(temp, 'data'), 'stop', '-m', 'fast']);
  await rm(temp, { recursive: true, force: true });
}
