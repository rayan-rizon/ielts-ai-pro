import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

  it('keeps Writing on Gemini and uses OpenRouter DeepSeek with Gemini fallback for Speaking', () => {
    const writing = readFunction('generateDetailedFeedback');
    const speaking = readFunction('evaluateSpeakingTest');
    expect(writing).toContain('gemini-2.5-flash');
    expect(speaking).toContain('requestSpeakingEvaluation');
    expect(speaking).toContain("Deno.env.get('OPENROUTER_API_KEY')");
    expect(speaking).toContain("Deno.env.get('GEMINI_API_KEY')");
    expect(writing).not.toContain('DEEPSEEK_API_KEY');
    expect(speaking).not.toContain('DEEPSEEK_API_KEY');
    expect(speaking).not.toContain('AI_GATEWAY_API_KEY');
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
