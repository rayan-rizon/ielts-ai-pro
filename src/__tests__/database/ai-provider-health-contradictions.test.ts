import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Regression cover for the "Text AI Providers" card rendering DEGRADED beside
 * "0% ERROR RATE", crediting Gemini with three calls it never served, and
 * showing "$0.000000" for seven calls that recorded no cost at all.
 *
 * The migration is asserted as source because this repository has no Postgres
 * in test; these checks pin the exact shapes the defects lived in.
 */
const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260904153723_fix_ai_provider_health_contradictions.sql'
  ),
  'utf8'
);
const standardizedHealthMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260915193302_standardize_ai_provider_health_recovery.sql'
  ),
  'utf8'
);

const readFunction = (name: string) =>
  readFileSync(
    resolve(
      process.cwd(),
      name === 'generateDetailedFeedback'
        ? 'supabase/functions/_shared/writingEvaluation.ts'
        : `supabase/functions/${name}/index.ts`
    ),
    'utf8'
  );

describe('get_ai_provider_health contradictions', () => {
  it('routes every recovery-pressure decision through two named gates', () => {
    expect(migration).toContain('v_recovery_is_degraded :=');
    expect(migration).toContain('v_recovery_needs_review :=');
    // The attention gate must exclude the degraded gate, or the two overlap and
    // the more severe one silently wins while the copy describes the milder one.
    expect(migration).toContain('AND NOT v_recovery_is_degraded');
  });

  it('no longer decides status from a raw threshold the copy cannot see', () => {
    // The original shadowing branch. Its presence is the bug.
    expect(migration).not.toContain('WHEN v_upstream_failures >= 3 AND v_upstream_rate >= 25 THEN');
    const statusBranches = migration
      .slice(migration.indexOf('v_status := CASE'), migration.indexOf('RETURN jsonb_build_object'))
      .split('\n')
      .filter((line) => line.trim().startsWith('WHEN'));
    // Every recovery-driven status branch reads a gate, never a bare threshold.
    for (const branch of statusBranches) {
      if (branch.includes('v_upstream')) {
        expect(branch).toMatch(/v_recovery_(is_degraded|needs_review)/);
      }
    }
  });

  it('gives the degraded recovery state its own copy instead of the milder one', () => {
    const impact = migration.slice(migration.indexOf("'impact', CASE"));
    expect(impact).toContain('WHEN v_recovery_is_degraded THEN');
    expect(impact).toContain('WHEN v_recovery_needs_review THEN');
    // The "no action is required" line must not be reachable for a degraded card.
    const degradedCopy = impact.slice(
      impact.indexOf('WHEN v_recovery_is_degraded THEN'),
      impact.indexOf('WHEN v_recovery_needs_review THEN')
    );
    expect(degradedCopy).not.toContain('no action is required');
    expect(degradedCopy).toContain('is not delivering AI output');
  });

  it('never counts a failed call as a call the provider served', () => {
    expect(migration).toContain("WHERE res_status NOT IN ('reserved', 'failed') AND NOT is_cached");
    const served = migration.slice(
      migration.indexOf('served_calls AS ('),
      migration.indexOf('INTO v_attempts')
    );
    // Every per-provider count reads served_calls, not the raw tracked set.
    for (const provider of ['openrouter-deepseek', 'openrouter-luna', 'deepseek', 'gemini']) {
      expect(served).toContain(`SELECT count(*) FROM served_calls WHERE provider = '${provider}'`);
    }
  });

  it('reports an absent cost as absent rather than as zero', () => {
    expect(migration).toContain(
      "'estimatedCostUsd', CASE WHEN v_cost_calls > 0 THEN round(v_cost, 6) END"
    );
    expect(migration).toContain("'costedCalls', v_cost_calls");
  });

  it('accepts the scientific notation JSON emits for sub-microdollar costs', () => {
    expect(migration).toContain("~ '^[0-9]+(\\.[0-9]+)?([eE][-+]?[0-9]+)?$'");
    expect(Number('1e-7')).toBeGreaterThan(0);
    expect(/^[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$/.test('1e-7')).toBe(true);
    expect(/^[0-9]+(\.[0-9]+)?$/.test('1e-7')).toBe(false);
  });
});

describe('get_ai_provider_health provider and recovery standard', () => {
  it('attributes OpenRouter Gemini separately from direct Google Gemini', () => {
    expect(standardizedHealthMigration).toContain("'openrouter-gemini'");
    expect(standardizedHealthMigration).toContain("'openrouterGeminiCalls', v_openrouter_gemini");
    expect(standardizedHealthMigration).toContain("'google/gemini-%'");
  });

  it('counts recovery only when a fallback actually delivered a result', () => {
    expect(standardizedHealthMigration).toContain(
      "res_status NOT IN ('reserved', 'failed') AND NOT is_cached"
    );
    expect(standardizedHealthMigration).toContain("request_metadata->>'fallbackUsed' = 'true'");
    expect(standardizedHealthMigration).not.toContain(
      "res_status = 'failed'\n            AND request_metadata->>'deterministicFallback' = 'true'"
    );
  });

  it('documents the route accurately and keeps learner-visible failures actionable', () => {
    expect(standardizedHealthMigration).toContain(
      'OpenRouter (Luna, Gemini, DeepSeek) -> Direct (DeepSeek, Gemini)'
    );
    expect(standardizedHealthMigration).toContain("WHEN v_errors > 0 THEN 'degraded'");
  });
});

describe('cost telemetry is actually written', () => {
  // Every endpoint the health RPC aggregates must record a cost, or the panel
  // sums an empty set. Both of these previously recorded none.
  it.each(['generateDetailedFeedback', 'generateDetailedSpeakingFeedback'])(
    '%s records estimatedProviderCostUsd from the registry rate',
    (name) => {
      const source = readFunction(name);
      // Speaking deep dives price their calls inside the shared text provider
      // (since 1c5ca489), which returns the estimate on each result's usage.
      const pricing = source.includes('../_shared/textAiProvider.ts')
        ? readFileSync(
            resolve(process.cwd(), 'supabase/functions/_shared/textAiProvider.ts'),
            'utf8'
          )
        : source;
      expect(pricing).toContain('estimateTokenCostUsd');
      expect(source).toContain('estimatedProviderCostUsd');
      expect(source).toContain('promptTokens');
      expect(source).toContain('outputTokens');
    }
  );

  it('attributes the single-provider deep dive so it is not unattributed', () => {
    expect(readFunction('generateDetailedSpeakingFeedback')).toContain("provider: 'gemini'");
  });
});
