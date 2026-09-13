import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260913173136_enforce_copilot_review_and_suppress_legacy_notifications.sql'
  ),
  'utf8'
);

describe('Copilot review enforcement migration', () => {
  it('makes review the only database-supported delivery mode', () => {
    expect(migration).toContain("CHECK (mode = 'review')");
    expect(migration).toContain("p_mode <> 'review'");
    expect(migration).toContain("mode = 'review'");
    expect(migration).not.toContain("mode = 'guardrailed_auto'");
  });

  it('suppresses superseded journey campaigns without deleting delivery history', () => {
    expect(migration).toContain("status = 'paused'");
    expect(migration).toContain("'superseded_by_autopilot', true");
    expect(migration).toContain("journey.config ? 'superseded_by_autopilot'");
    expect(migration).not.toMatch(/DELETE\s+FROM\s+public\.marketing_deliveries/i);
  });

  it('keeps the policy mutation admin-only', () => {
    expect(migration).toContain('IF NOT public.is_admin()');
    expect(migration).toContain('SECURITY INVOKER');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION');
  });
});
