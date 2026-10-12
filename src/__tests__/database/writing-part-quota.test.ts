import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260910145956_standardize_writing_part_quota.sql'),
  'utf8'
);
const functionSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/_shared/writingEvaluation.ts'),
  'utf8'
);
const correctionMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260910153137_correct_writing_quota_backfill.sql'),
  'utf8'
);

describe('Writing evaluation quota contract', () => {
  it('converts each admin-configured Writing evaluation into two part reviews', () => {
    expect(migration).toContain('ELSE v_daily_limit * 2');
    expect(migration).toContain('ELSE v_monthly_limit * 2');
    expect(migration).toContain('WHEN v_daily_limit = -1 THEN 2147483647');
    expect(migration).toContain("p_feature_type = 'writing'");
  });

  it('counts cached Writing reviews while preserving cache exclusions for other AI routes', () => {
    expect(migration).toContain("p_endpoint = 'generateDetailedFeedback' OR cached = false");
    expect(migration).toContain("reservationStatus', 'completed') <> 'failed'");
  });

  it('backfills only the gap left by the old cache bypass', () => {
    expect(migration).toContain('saved.part_count - COALESCE(recorded.part_count, 0)');
    expect(migration).toContain("'source', 'writing_cache_quota_backfill'");
  });

  it('repairs legacy null task keys without touching original usage rows', () => {
    expect(correctionMigration).toContain(
      "request_metadata ->> 'source' = 'writing_cache_quota_backfill'"
    );
    expect(correctionMigration).toContain(
      "jsonb_typeof(ts.content_data -> 'task1Band') = 'number'"
    );
    expect(correctionMigration).toContain(
      "jsonb_typeof(ts.content_data -> 'task2Band') = 'number'"
    );
    expect(correctionMigration).toContain("'source', 'writing_cache_quota_backfill_v2'");
  });

  it('reserves quota before serving globally cached feedback', () => {
    const reservationIndex = functionSource.indexOf('await reserveDatabaseQuota(');
    const cacheLookupIndex = functionSource.indexOf(".from('ai_feedback_cache')");

    expect(reservationIndex).toBeGreaterThan(-1);
    expect(cacheLookupIndex).toBeGreaterThan(reservationIndex);
    expect(functionSource).toMatch(
      /finalizeApiUsage\(\s*supabase,\s*quotaReservation\.reservationId,\s*0,\s*true/
    );
  });
});
