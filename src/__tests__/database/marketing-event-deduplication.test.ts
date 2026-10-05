import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('marketing event deduplication', () => {
  it('uses a full unique index compatible with the PostgREST conflict target', () => {
    const sql = readFileSync(
      'supabase/migrations/20261005180000_idempotent_marketing_events.sql',
      'utf8'
    );
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX marketing_events_dedupe_idx_full\s+ON public.marketing_events \(dedupe_key\);/
    );
    expect(sql).not.toContain('NULLS NOT DISTINCT');
    expect(sql.indexOf('CREATE UNIQUE INDEX')).toBeLessThan(sql.indexOf('DROP INDEX'));
    expect(sql).toContain("SET LOCAL lock_timeout = '5s'");
  });

  it('ignores duplicates in every direct event writer without merging event data', () => {
    for (const path of [
      'supabase/functions/marketing-track/index.ts',
      'supabase/functions/marketing-campaign-dispatch/index.ts',
      'src/features/marketing/services/MarketingDelivery.js',
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain("onConflict: 'dedupe_key', ignoreDuplicates: true");
      expect(source).not.toMatch(/from\('marketing_events'\)\.insert/);
    }
  });
});
