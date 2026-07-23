import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'supabase/functions/generateAdaptiveLearningPath/index.ts'),
  'utf8'
);

describe('Learning Path Edge Function safeguards', () => {
  it('suppresses duplicate path and AI work on an unchanged fingerprint', () => {
    const fingerprintGate = source.indexOf('latest?.path_data?.input_fingerprint === fingerprint');
    const aiCall = source.lastIndexOf('await buildCoachSummary');
    expect(fingerprintGate).toBeGreaterThan(-1);
    expect(fingerprintGate).toBeLessThan(aiCall);
    expect(source).toContain("cacheStatus: 'fingerprint_hit'");
  });

  it('keeps AI bounded and scheduling deterministic', () => {
    expect(source).toContain('maxOutputTokens: 400');
    expect(source).toContain('buildSevenDaySchedule');
    expect(source).toContain('Never predict improvement');
  });

  it('falls back when quota, provider, or parsing is unavailable', () => {
    expect(source).toContain("fallbackReason: 'quota_unavailable'");
    expect(source).toContain('deterministicFallback: true');
    expect(source).toContain("throw new Error('Malformed coach summary')");
    expect(source).not.toContain('quotaExceededResponse');
  });

  it('records trigger, fingerprint, model, generator, cache, tokens, and fallback telemetry', () => {
    for (const field of [
      'trigger',
      'fingerprint',
      'model',
      'generatorVersion',
      'cacheStatus',
      'promptTokens',
      'outputTokens',
      'deterministicFallback',
    ]) {
      expect(source).toContain(field);
    }
  });
});
