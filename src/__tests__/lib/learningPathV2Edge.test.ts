import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_ROUTES } from '../../../supabase/functions/_shared/aiModelRegistry';
import {
  COACH_RESPONSE_SCHEMA,
  isCoachResponse,
} from '../../../supabase/functions/_shared/learningPathCoach';

const source = readFileSync(
  resolve(process.cwd(), 'supabase/functions/generateAdaptiveLearningPath/index.ts'),
  'utf8'
);
const adaptiveLearningRoute = AI_ROUTES.find((route) => route.id === 'adaptive-learning-path');

describe('Learning Path Edge Function safeguards', () => {
  it('suppresses duplicate path and AI work on an unchanged fingerprint', () => {
    const fingerprintGate = source.indexOf('latestPath?.input_fingerprint === fingerprint');
    const aiCall = source.lastIndexOf('await buildCoachSummary');
    expect(fingerprintGate).toBeGreaterThan(-1);
    expect(fingerprintGate).toBeLessThan(aiCall);
    expect(source).toContain("cacheStatus: 'fingerprint_hit'");
  });

  it('keeps AI bounded and scheduling deterministic', () => {
    expect(adaptiveLearningRoute).toBeDefined();
    expect(adaptiveLearningRoute?.maxOutputTokens).toBeGreaterThan(0);
    expect(adaptiveLearningRoute?.maxOutputTokens).toBeLessThanOrEqual(512);
    expect(source).toContain("AI_ROUTES.find((route) => route.id === 'adaptive-learning-path')");
    expect(source).toContain('buildSevenDaySchedule');
    expect(source).toContain('Never predict improvement');
    expect(source).toContain(
      'Never invent activities, keys, evidence, routes, scores, or capacity'
    );
    expect(source).toContain('resolveCoachRanking');
    expect(COACH_RESPONSE_SCHEMA.properties.rankedActivityIndices.maxItems).toBe(3);
  });

  it('falls back when quota, provider, or parsing is unavailable', () => {
    expect(source).toContain("fallbackReason: 'quota_unavailable'");
    expect(source).toContain('deterministicFallback: true');
    expect(source).toContain('requestJsonWithGeminiFallback');
    expect(source).toContain('responseSchema: COACH_RESPONSE_SCHEMA');
    expect(source).toContain('validateJson: isCoachResponse');
    expect(
      isCoachResponse({
        headline: 'Prioritize measured evidence',
        explanation: 'Keep the plan grounded in completed work.',
        rankedActivityIndices: [0, 2, 1],
      })
    ).toBe(true);
    expect(source).toContain("deepseekApiKey: Deno.env.get('DEEPSEEK_API_KEY')");
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
      'cachedPromptTokens',
      'fallbackUsed',
      'estimatedProviderCostUsd',
      'deterministicFallback',
    ]) {
      expect(source).toContain(field);
    }
  });
});
