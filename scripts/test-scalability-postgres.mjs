import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:net';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Real PostgreSQL and upstream pgmq, with a minimal isolated application fixture.
// No project credentials or production connections are used.
const exec = promisify(execFile);
const bin = process.env.SCALABILITY_PG_BIN || '/opt/homebrew/opt/postgresql@16/bin';
const root = resolve(import.meta.dirname, '..');
const temp = await mkdtemp(join(tmpdir(), 'ielts-scalability-test-'));
const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
await new Promise((resolve) => server.close(resolve));
let started = false;
const psql = async (sql) =>
  (
    await exec(
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
    )
  ).stdout.trim();
try {
  const pgmq = process.env.SCALABILITY_PGMQ_SQL
    ? await readFile(process.env.SCALABILITY_PGMQ_SQL, 'utf8')
    : await fetch(
        'https://raw.githubusercontent.com/pgmq/pgmq/v1.5.1/pgmq-extension/sql/pgmq.sql'
      ).then((r) => {
        if (!r.ok) throw new Error('Cannot fetch pinned pgmq fixture');
        return r.text();
      });
  assert.equal(
    createHash('sha256').update(pgmq).digest('hex'),
    '65b9302faa660539584769a572b57f2df76ccf1b3a2153c37cefc57b8db633e9'
  );
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
  const paths = [
    'supabase/tests/helpers/scalability_fixture.sql',
    'supabase/migrations/20261012221833_optimize_learner_session_projections.sql',
    'supabase/migrations/20261012221842_durable_writing_jobs_and_ai_admission.sql',
    'supabase/migrations/20261012222224_fence_queued_writing_session_results.sql',
    'supabase/tests/scalability_admission.sql',
  ];
  const fixture = await readFile(join(root, paths[0]), 'utf8');
  const learner = await readFile(join(root, paths[1]), 'utf8');
  const jobs = (await readFile(join(root, paths[2]), 'utf8')).replace(
    'create extension if not exists pgmq;',
    ''
  );
  const fence = await readFile(join(root, paths[3]), 'utf8');
  const tests = await readFile(join(root, paths[4]), 'utf8');
  const sqlPath = join(temp, 'checks.sql');
  await writeFile(sqlPath, [fixture, pgmq, learner, jobs, fence, tests].join('\n'));
  await exec(
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
      '-f',
      sqlPath,
    ],
    { maxBuffer: 4 * 1024 * 1024 }
  );
  const bursts = await Promise.all(
    Array.from({ length: 20 }, () =>
      psql("select public.check_shared_ai_burst('concurrent',3,60000)->>'allowed'")
    )
  );
  assert.equal(
    bursts.filter((v) => v === 'true').length,
    3,
    'Burst limit must be atomic across connections'
  );
  const leases = await Promise.all(
    Array.from({ length: 16 }, (_, i) =>
      psql(`select public.acquire_text_ai_lease('concurrent-${i}')->>'allowed'`)
    )
  );
  assert.equal(
    leases.filter((v) => v === 'true').length,
    8,
    'Concurrency cap must hold across connections'
  );
  await psql("update ai_work.text_leases set expires_at=now()-interval '1 second'");
  assert.equal(await psql("select public.acquire_text_ai_lease('renewed')->>'allowed'"), 'true');
  assert.equal(await psql("select public.acquire_text_ai_lease('renewed')->>'allowed'"), 'true');
  assert.equal(await psql("select public.acquire_text_ai_lease('renewed')->>'allowed'"), 'false');
  await psql(
    `insert into auth.users values('00000000-0000-0000-0000-000000000001'); insert into public.users values('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001')`
  );
  const enqueueSql = `select public.enqueue_writing_feedback('00000000-0000-0000-0000-000000000001',repeat('d',64),' {"writingText":"Essay","taskPrompt":"Prompt","taskType":"Task 2"}') ->> 'jobId'`;
  const duplicateJobs = await Promise.all(Array.from({ length: 10 }, () => psql(enqueueSql)));
  assert.equal(new Set(duplicateJobs).size, 1, 'Concurrent submissions must share one job');
  assert.equal(
    await psql('select count(*) from public.ai_api_usage'),
    '1',
    'Concurrent submissions reserved quota twice'
  );
  console.log(
    'PostgreSQL/pgmq checks passed: ownership, keyset history, quota integration, retry/fencing, atomic burst and concurrency caps.'
  );
} catch (error) {
  throw new Error(error.stderr || error.message);
} finally {
  if (started) await exec(join(bin, 'pg_ctl'), ['-D', join(temp, 'data'), 'stop', '-m', 'fast']);
  await rm(temp, { recursive: true, force: true });
}
