import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260920213955_optimize_marketing_copilot_expiry.sql'
  ),
  'utf8'
);

describe('Marketing Copilot expiry migration', () => {
  it('indexes only active, time-bound interventions', () => {
    expect(migration).toContain('marketing_interventions_active_expiry_idx');
    expect(migration).toContain('(expires_at, created_at, id)');
    expect(migration).toContain("'prepared', 'needs_approval', 'approved', 'queued', 'sent'");
  });
});
