import { describe, expect, it } from 'vitest';

import {
  buildOpenRouterSpeechRequest,
  computePracticeTtsCacheKey,
  DEFAULT_PRACTICE_TTS_MODEL,
  EXAM_TTS_STYLE,
  estimatePracticeTtsCostUsd,
  isPracticeTtsAllowed,
  isSpeakingTtsCacheable,
  normalizePracticeTtsText,
  parsePcmContentType,
  parsePracticeTtsRollout,
  PRACTICE_TTS_MAX_CHARACTERS,
  PRACTICE_TTS_MODELS,
  PRACTICE_TTS_STYLE,
  resolveSpeakingAccent,
  resolvePracticeTtsSelection,
  resolveExamGeminiVoice,
  toPlayableAudio,
} from '../../../supabase/functions/_shared/practiceTts.ts';
import { AI_ROUTES, MODELS } from '../../../supabase/functions/_shared/aiModelRegistry.ts';
import { SPEAKING_EXAMINER_VOICES } from '../../features/testing/speaking/utils/speakingAccents.js';

describe('practice TTS rollout', () => {
  it('treats anything other than admin or all as off', () => {
    expect(parsePracticeTtsRollout(undefined)).toBe('off');
    expect(parsePracticeTtsRollout('ALL ')).toBe('all');
    expect(parsePracticeTtsRollout('everyone')).toBe('off');
    expect(isPracticeTtsAllowed('off', true)).toBe(false);
    expect(isPracticeTtsAllowed('admin', false)).toBe(false);
    expect(isPracticeTtsAllowed('admin', true)).toBe(true);
    expect(isPracticeTtsAllowed('all', false)).toBe(true);
  });
});

describe('practice TTS model selection', () => {
  it('ignores learner overrides and uses the configured voice', () => {
    const selection = resolvePracticeTtsSelection({
      configuredModel: DEFAULT_PRACTICE_TTS_MODEL,
      configuredVoice: 'Kore',
      requestedModel: 'sesame/csm-1b',
      requestedVoice: 'Puck',
      isAdmin: false,
    });
    expect(selection).toEqual({ model: DEFAULT_PRACTICE_TTS_MODEL, voice: 'Kore' });
  });

  it('lets admins pick a listed voice, but no unlisted model', () => {
    expect(resolvePracticeTtsSelection({ requestedVoice: 'Puck', isAdmin: true })).toEqual({
      model: DEFAULT_PRACTICE_TTS_MODEL,
      voice: 'Puck',
    });

    expect(
      resolvePracticeTtsSelection({
        requestedModel: 'openai/gpt-audio',
        requestedVoice: 'alloy',
        isAdmin: true,
      })
    ).toEqual({
      model: DEFAULT_PRACTICE_TTS_MODEL,
      voice: PRACTICE_TTS_MODELS[DEFAULT_PRACTICE_TTS_MODEL].defaultVoice,
    });
  });

  it('falls back to the default model when configuration is invalid', () => {
    expect(
      resolvePracticeTtsSelection({ configuredModel: 'typo/model', isAdmin: false }).model
    ).toBe(DEFAULT_PRACTICE_TTS_MODEL);
  });

  it('prices every listed model in the registry', () => {
    for (const model of Object.keys(PRACTICE_TTS_MODELS)) {
      expect(MODELS[model], model).toBeDefined();
      expect(estimatePracticeTtsCostUsd(model, 'Tell me about your hometown.')).toBeGreaterThan(0);
    }
    const route = AI_ROUTES.find((entry) => entry.id === 'practice-text-to-speech');
    expect(route?.steps.map((step) => step.model)).toContain(DEFAULT_PRACTICE_TTS_MODEL);
  });
});

describe('practice TTS request and cache', () => {
  it('sends the Gemini style as speech metadata, never inside the spoken text', () => {
    const body = buildOpenRouterSpeechRequest(
      { model: 'google/gemini-3.8-flash-lite-tts', voice: 'Sulafat' },
      'Hello there.'
    ) as any;
    expect(body.input).toBe('Hello there.');
    // OpenRouter rejects mp3 for Gemini TTS; the server wraps the PCM as WAV.
    expect(body.response_format).toBe('pcm');
    expect(body.provider.options['google-ai-studio'].speech_metadata.style).toBe(
      PRACTICE_TTS_STYLE
    );
  });

  it('keys the cache on model, voice and text', async () => {
    const gemini = { model: 'google/gemini-3.8-flash-lite-tts', voice: 'Sulafat' };
    const a = await computePracticeTtsCacheKey(gemini, 'Hello.');
    expect(a).toMatch(/^tts-cache\/practice\/v1\/[0-9a-f]{64}\.wav$/);
    expect(await computePracticeTtsCacheKey(gemini, 'Hello.')).toBe(a);
    expect(await computePracticeTtsCacheKey({ ...gemini, voice: 'Kore' }, 'Hello.')).not.toBe(a);
    expect(await computePracticeTtsCacheKey(gemini, 'Hello!')).not.toBe(a);
    expect(await computePracticeTtsCacheKey({ ...gemini, accent: 'british' }, 'Hello.')).toBe(a);
    expect(
      await computePracticeTtsCacheKey({ ...gemini, accent: 'australian' }, 'Hello.')
    ).not.toBe(a);
    expect(await computePracticeTtsCacheKey({ ...gemini, accent: 'american' }, 'Hello.')).not.toBe(
      a
    );
  });

  it('keeps each regional Gemini exam voice in a separate R2 WAV key', async () => {
    const base = {
      model: DEFAULT_PRACTICE_TTS_MODEL,
      voice: 'en-gb-tutor-4',
      style: EXAM_TTS_STYLE,
      route: 'exam' as const,
    };
    const british = await computePracticeTtsCacheKey(base, 'Good morning.');
    expect(british).toMatch(/^tts-cache\/exam-gemini\/v1\/[0-9a-f]{64}\.wav$/);
    expect(
      await computePracticeTtsCacheKey({ ...base, voice: 'en-gb-tutor-14' }, 'Good morning.')
    ).not.toBe(british);
    expect(
      await computePracticeTtsCacheKey({ ...base, voice: 'en-au-tutor-5' }, 'Good morning.')
    ).not.toBe(british);
    expect(resolveExamGeminiVoice('australian-male')).toBe('en-au-tutor-5');
    expect(resolveExamGeminiVoice('untrusted', 'american')).toBe('despina');
    expect(resolveExamGeminiVoice('australian-female')).toBe('en-au-tutor-5');
    expect(resolveExamGeminiVoice('american-male')).toBe('despina');
    for (const voice of SPEAKING_EXAMINER_VOICES) {
      expect(resolveExamGeminiVoice(voice.id)).toBe(voice.geminiVoice);
    }
    expect(
      await computePracticeTtsCacheKey({ ...base, route: undefined }, 'Good morning.')
    ).not.toBe(british);
  });

  it('limits accent changes to exam mode and sends the selected style', () => {
    expect(resolveSpeakingAccent('australian', 'exam')).toBe('australian');
    expect(resolveSpeakingAccent('american', 'exam')).toBe('american');
    expect(resolveSpeakingAccent('american', 'practice')).toBe('british');
    expect(resolveSpeakingAccent('unknown', 'exam')).toBe('british');
    const body = buildOpenRouterSpeechRequest(
      { model: DEFAULT_PRACTICE_TTS_MODEL, voice: 'Sulafat', accent: 'australian' },
      'Hello.'
    ) as any;
    expect(body.provider.options['google-ai-studio'].speech_metadata.style).toContain(
      'Australian English accent'
    );
  });

  it('caches long shared exam introductions but not unique practice coaching', () => {
    const introduction = 'Welcome to your IELTS Speaking examination. '.repeat(7);
    expect(introduction.length).toBeGreaterThan(200);
    expect(isSpeakingTtsCacheable(introduction, 'exam')).toBe(true);
    expect(isSpeakingTtsCacheable(introduction, 'practice')).toBe(false);
    expect(isSpeakingTtsCacheable('Do you work or study?', 'practice')).toBe(true);
  });

  it('normalizes whitespace and caps length', () => {
    expect(normalizePracticeTtsText('  Hello \n  there ')).toBe('Hello there');
    expect(normalizePracticeTtsText('x'.repeat(5000))).toHaveLength(PRACTICE_TTS_MAX_CHARACTERS);
  });

  it('wraps Gemini PCM in a valid WAV header and rejects non-PCM bodies', () => {
    const pcm = new Uint8Array(48000); // one second of 24 kHz mono 16-bit
    const audio = toPlayableAudio('audio/pcm;rate=24000;channels=1', pcm);
    expect(audio?.contentType).toBe('audio/wav');
    const view = new DataView(audio!.bytes.buffer);
    expect(new TextDecoder().decode(audio!.bytes.slice(0, 4))).toBe('RIFF');
    expect(new TextDecoder().decode(audio!.bytes.slice(8, 12))).toBe('WAVE');
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(40, true)).toBe(48000);
    expect(audio!.bytes.byteLength).toBe(48044);

    expect(parsePcmContentType('application/json')).toBeNull();
    expect(toPlayableAudio('application/json', pcm)).toBeNull();
    const errorBody = new TextEncoder().encode(`{"error":{"message":"${'x'.repeat(600)}"}}`);
    expect(toPlayableAudio('application/json', errorBody)).toBeNull();
    expect(toPlayableAudio('audio/pcm;rate=24000', new Uint8Array(10))).toBeNull();
  });
});

describe('practice TTS cache policy', () => {
  it('caches shared short lines and skips unique coach replies', async () => {
    const { isPracticeTtsCacheable } =
      await import('../../../supabase/functions/_shared/practiceTts.ts');
    expect(
      isPracticeTtsCacheable(
        "Hi! Let's practise Part 1 together. Just answer naturally, and I'll help you say it better as we go. Here's your first question."
      )
    ).toBe(true);
    expect(isPracticeTtsCacheable('When do you usually eat bread?')).toBe(true);
    expect(isPracticeTtsCacheable('x'.repeat(260))).toBe(false);
  });
});
