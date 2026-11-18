import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * cron.job_run_details grows by ~7,500 rows a day (six every-minute jobs) and
 * pg_cron never trims it. The platform-health page reads its own projection
 * (admin_health_private.scheduled_cron_runs), so provider history can be pruned
 * as long as the sync job keeps seeing a newer max(runid) and in-flight runs
 * survive.
 */
const DIR = 'supabase/migrations';
const file = readdirSync(DIR).find((name) => name.endsWith('_prune_cron_run_history.sql'));
const sql = file ? readFileSync(`${DIR}/${file}`, 'utf8') : '';
const code = sql
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('--'))
  .join('\n');

describe('cron run history retention migration', () => {
  it('exists and sorts after the health-history sync migration it depends on', () => {
    expect(file).toBeDefined();
    expect(file.split('_')[0] > '20261114155233').toBe(true);
  });

  it('prunes through a private SECURITY DEFINER function with a pinned search_path', () => {
    expect(code).toMatch(
      /CREATE OR REPLACE FUNCTION admin_health_private\.prune_cron_run_history\(/
    );
    expect(code).toMatch(/SECURITY DEFINER/);
    expect(code).toMatch(/SET search_path\s*(TO|=)\s*''/);
    expect(code).toMatch(
      /REVOKE ALL ON FUNCTION admin_health_private\.prune_cron_run_history\(\)\s+FROM PUBLIC, anon, authenticated, service_role/
    );
  });

  it('only deletes finished runs, so in-flight rows survive for the health sync', () => {
    expect(code).toMatch(/DELETE FROM cron\.job_run_details/);
    expect(code).toMatch(/status IN \('succeeded', 'failed'\)/);
  });

  it('keeps successes for 7 days and failures for 30 days', () => {
    expect(code).toMatch(/status = 'succeeded'[\s\S]*interval '7 days'/);
    expect(code).toMatch(/status = 'failed'[\s\S]*interval '30 days'/);
  });

  it('never deletes the newest run, so the sync high-water mark cannot go backwards', () => {
    expect(code).toMatch(/runid\s*<\s*\(\s*SELECT max\(runid\) FROM cron\.job_run_details\s*\)/);
  });

  it('schedules itself once a day, replacing any previous schedule of the same name', () => {
    expect(code).toMatch(/cron\.unschedule\(/);
    expect(code).toMatch(/cron\.schedule\(\s*'prune-cron-run-history'/);
    expect(code).toMatch(/'\d{1,2} \d{1,2} \* \* \*'/);
  });

  it('does not touch the health projection or the sync job', () => {
    expect(code).not.toMatch(/DELETE FROM admin_health_private/);
    expect(code).not.toMatch(/unschedule\([^)]*sync-admin-health-cron-history/);
    expect(code).not.toMatch(/TRUNCATE/i);
  });
});
