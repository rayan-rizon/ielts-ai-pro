import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AI_ROUTES,
  SPEAKING_DETAILED_FEEDBACK_FALLBACK_MODEL,
  SPEAKING_DETAILED_FEEDBACK_PRIMARY_MODEL,
  WRITING_DIRECT_GEMINI_MODEL,
} from '../../../supabase/functions/_shared/aiModelRegistry';

const readFunction = (name: string) =>
  readFileSync(resolve(process.cwd(), `supabase/functions/${name}/index.ts`), 'utf8');

const lowRiskFunctions = [
  'generateAdaptiveLearningPath',
  'generateStudyRecommendations',
  'evaluateGrammarTransfer',
];

describe('OpenRouter DeepSeek-first text AI Edge Function integration', () => {
  it.each(lowRiskFunctions)('%s keeps Gemini as a secret-backed fallback', (name) => {
    const source = readFunction(name);
    expect(source).toContain("Deno.env.get('OPENROUTER_API_KEY')");
    expect(source).toContain("Deno.env.get('DEEPSEEK_API_KEY')");
    expect(source).toContain("Deno.env.get('GEMINI_API_KEY')");
    expect(source).toContain('requestJsonWithGeminiFallback');
    expect(source).toContain('fallbackUsed');
    expect(source).toContain('fallbackReason');
    expect(source).toContain('estimatedProviderCostUsd');
  });

  it('uses GPT-6 Luna first and direct Google Gemini as Speaking deep-dive fallback', () => {
    const speaking = readFunction('generateDetailedSpeakingFeedback');
    const steps = AI_ROUTES.find((route) => route.id === 'speaking-detailed-feedback')?.steps;

    expect(steps?.map((step) => [step.role, step.model])).toEqual([
      ['primary', SPEAKING_DETAILED_FEEDBACK_PRIMARY_MODEL],
      ['fallback', SPEAKING_DETAILED_FEEDBACK_FALLBACK_MODEL],
    ]);
    expect(speaking).toContain("Deno.env.get('OPENROUTER_API_KEY')");
    expect(speaking).toContain("Deno.env.get('GEMINI_API_KEY')");
    expect(speaking).toContain('requestOpenRouterLunaJson');
    expect(speaking).toContain('requestGeminiWithRetry');
    expect(speaking).toContain('jsonMode: false');
    expect(speaking).toContain('normalizeProviderResponse');
    expect(speaking).toContain('wastedProviderCostUsd');
  });

  it('uses direct Google Gemini for Writing fallback and DeepSeek fallback for Speaking', () => {
    const writing = readFileSync(
      resolve(process.cwd(), 'supabase/functions/_shared/writingEvaluation.ts'),
      'utf8'
    );
    const speaking = readFunction('evaluateSpeakingTest');
    expect(writing).toContain('WRITING_DIRECT_GEMINI_MODEL');
    expect(writing).not.toContain('WRITING_OPENROUTER_VISION_FALLBACK_MODEL');
    expect(writing).toContain('requestOpenRouterWritingFeedback');
    expect(writing).toContain('./writingProvider.ts');
    expect(writing).not.toContain('MARKING_TEMPERATURE');
    expect(writing).not.toContain("'openrouter-gemini'");
    expect(writing).toContain("'x-goog-api-key': GEMINI_API_KEY");
    expect(writing).toContain("rateLimitType: 'provider'");
    const writingSteps = AI_ROUTES.find((route) => route.id === 'writing-detailed-feedback')?.steps;
    expect(writingSteps?.map((step) => [step.role, step.model])).toEqual([
      ['primary', 'openai/gpt-6-luna'],
      ['fallback', WRITING_DIRECT_GEMINI_MODEL],
      ['repair', WRITING_DIRECT_GEMINI_MODEL],
    ]);
    expect(speaking).toContain('requestSpeakingEvaluation');
    expect(speaking).toContain("Deno.env.get('OPENROUTER_API_KEY')");
    expect(speaking).toContain("Deno.env.get('GEMINI_API_KEY')");
    expect(writing).not.toContain('DEEPSEEK_API_KEY');
    expect(speaking).not.toContain('DEEPSEEK_API_KEY');
    expect(speaking).not.toContain('AI_GATEWAY_API_KEY');
  });

  it('keeps Luna fallback telemetry specific enough to identify provider contract failures', () => {
    const provider = readFileSync(
      resolve(process.cwd(), 'supabase/functions/_shared/writingProvider.ts'),
      'utf8'
    );
    const writing = readFileSync(
      resolve(process.cwd(), 'supabase/functions/_shared/writingEvaluation.ts'),
      'utf8'
    );

    expect(provider).toContain("provider: { sort: 'throughput', require_parameters: true }");
    expect(provider).not.toContain('temperature:');
    expect(provider).not.toContain('top_p:');
    expect(provider).toContain('openrouter_luna_${code}');
    expect(writing).toContain('providerFailureReason');
    expect(writing).toContain('wastedProviderCostUsd');
    expect(writing).not.toContain('luna_no_parsable_feedback');
  });

  it('requires grounded Task 1 visual evidence and uses the public Band 3 mismatch boundary', () => {
    const writing = readFileSync(
      resolve(process.cwd(), 'supabase/functions/_shared/writingEvaluation.ts'),
      'utf8'
    );
    expect(writing).toContain('taskAnalysis');
    expect(writing).toContain('TaskAchievement cannot exceed 3.0');
    expect(writing).toContain("['image/png', 'image/jpeg', 'image/webp']");
    expect(writing).toContain('imageBlob.size > 8 * 1024 * 1024');
  });

  it('keeps provider credentials out of request URLs and client code', () => {
    const providerFunctions = [
      'generateDetailedFeedback',
      'generateDetailedSpeakingFeedback',
      'evaluateSpeakingTest',
      'transcribeAudio',
    ];
    for (const name of providerFunctions) {
      expect(readFunction(name)).not.toContain('generateContent?key=');
    }
  });

  it('refuses silent audio before calling Whisper or Gemini transcription', () => {
    const speaking = readFunction('processSpeakingSession');
    expect(speaking).toContain('shouldGuardSilentSpeech');
    expect(speaking).toContain("transcriptionProvider = 'silence-guard'");
    expect(speaking).toContain('if (audioBase64 && !transcript && !silenceGuarded)');
    expect(speaking).toContain("transcriptionError = 'No speech detected by browser'");
  });
});
