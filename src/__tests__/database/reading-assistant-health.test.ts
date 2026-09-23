import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260910031302_add_reading_assistant_health_telemetry.sql'
  ),
  'utf8'
);
const fallbackHealthMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260910042708_extend_reading_assistant_fallback_health.sql'
  ),
  'utf8'
);
const lunaHealthMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260923104430_switch_luna_model_health_telemetry.sql'
  ),
  'utf8'
);
const functionSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/reading-assistant/index.ts'),
  'utf8'
);

describe('Reading assistant operational telemetry', () => {
  it('adds a persisted, admin-only Reading Assistant health card', () => {
    expect(migration).toContain("'key', 'reading_assistant'");
    expect(migration).toContain("endpoint = 'reading-assistant'");
    expect(migration).toContain("'p95LatencyMs'");
    expect(migration).toContain("'estimatedCostUsd'");
    expect(migration).toContain("'fallbacks'");
    expect(migration).toContain('public.is_admin()');
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon'
    );
  });

  it('keeps the fallback provider order and model counts visible in admin health', () => {
    expect(fallbackHealthMigration).toContain('get_platform_health_core_v11');
    expect(fallbackHealthMigration).toContain("'deepseekCalls', v_deepseek");
    expect(fallbackHealthMigration).toContain("'lunaCalls', v_luna");
    expect(fallbackHealthMigration).toContain("'gptOssCalls', v_gpt_oss");
    expect(fallbackHealthMigration).toContain("'glmCalls', v_glm");
    expect(fallbackHealthMigration).toContain(
      'GPT OSS 120B -> GPT-5.6 Luna -> DeepSeek V4 Flash -> Gemini 2.5 Flash -> GLM 5.3 Flash'
    );
  });

  it('combines historical GPT-5.6 Luna and active GPT-6 Luna calls in health telemetry', () => {
    expect(lunaHealthMigration).toContain("'openai/gpt-5.6-luna', 'openai/gpt-6-luna'");
    expect(lunaHealthMigration).toContain(
      'GPT OSS 120B -> GPT-6 Luna -> DeepSeek V4 Flash -> GLM 5.3 Flash'
    );
    expect(lunaHealthMigration).toContain(
      "replace(service->>'provider', 'GPT-5.6 Luna', 'GPT-6 Luna')"
    );
    expect(lunaHealthMigration).toContain(
      'REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon, authenticated'
    );
    expect(lunaHealthMigration).toContain(
      'GRANT EXECUTE ON FUNCTION public.get_platform_health(integer) TO authenticated'
    );
  });

  it('records both completed and failed provider outcomes for the existing AI Usage views', () => {
    expect(functionSource).toContain("endpoint: 'reading-assistant'");
    expect(functionSource).toContain("reservationStatus: 'completed'");
    expect(functionSource).toContain("reservationStatus: 'failed'");
    expect(functionSource).toContain('estimatedProviderCostUsd');
    expect(functionSource).toContain('latencyMs');
    expect(functionSource).toContain('fallbackUsed');
    expect(functionSource).toContain('requestOpenRouterLunaJson');
    expect(functionSource).toContain('requestOpenRouterDeepSeekJson');
    expect(functionSource.indexOf('requestOpenRouterLunaJson({')).toBeLessThan(
      functionSource.indexOf('requestOpenRouterDeepSeekJson({')
    );
  });
});
