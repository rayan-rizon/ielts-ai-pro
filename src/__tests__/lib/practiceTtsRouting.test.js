import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke, callEdgeFunctionStream } = vi.hoisted(() => ({
  invoke: vi.fn(),
  callEdgeFunctionStream: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke } },
}));
vi.mock('@/utils/api', () => ({ callEdgeFunctionStream }));

import {
  prefetchSpeakingTts,
  requestSpeakingTts,
  resetSpeakingTtsRoutingForTests,
  setSpeakingTtsVoice,
  setSpeakingTtsProfile,
} from '@/features/testing/speaking/utils/speakingTtsPrefetch';

const cachedPractice = { success: true, audioUrl: 'https://media.ieltsai.pro/a.wav', cached: true };
const legacyAudio = { success: true, audioUrl: 'data:audio/mpeg;base64,legacy' };

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const pcmResponse = (headers = {}) =>
  new Response(new Uint8Array([0, 0, 1, 0]), {
    status: 200,
    headers: { 'Content-Type': 'audio/pcm;rate=24000;channels=1', ...headers },
  });

describe('practice-mode TTS routing', () => {
  beforeEach(() => {
    resetSpeakingTtsRoutingForTests();
    invoke.mockReset();
    callEdgeFunctionStream.mockReset();
    invoke.mockResolvedValue({ data: legacyAudio, error: null });
    vi.stubEnv('VITE_PRACTICE_TTS', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends exam mode with the selected regional Gemini voice to the R2 route', async () => {
    setSpeakingTtsProfile('exam');
    setSpeakingTtsVoice('australian-male');
    callEdgeFunctionStream.mockResolvedValue(
      jsonResponse({
        success: true,
        audioUrl: 'https://media.ieltsai.pro/exam-voice.wav',
        model: 'google/gemini-3.8-flash-lite-tts',
        voice: 'en-au-tutor-5',
      })
    );
    const result = await requestSpeakingTts('Do you work or study?');
    expect(callEdgeFunctionStream).toHaveBeenCalledWith(
      'synthesizePracticeSpeech',
      expect.objectContaining({
        text: 'Do you work or study?',
        mode: 'exam',
        stream: true,
        examVoice: 'australian-male',
      })
    );
    expect(result.data.audioUrl).toContain('.wav');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('uses an R2 cached Gemini exam clip without another provider call', async () => {
    setSpeakingTtsProfile('exam');
    callEdgeFunctionStream.mockResolvedValue(
      jsonResponse({
        ...cachedPractice,
        model: 'google/gemini-3.8-flash-lite-tts',
        voice: 'en-gb-tutor-4',
      })
    );
    const result = await requestSpeakingTts('Do you work or study?');
    expect(result.data).toMatchObject({ audioUrl: cachedPractice.audioUrl, cached: true });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('does not switch providers if exam Gemini is unavailable', async () => {
    setSpeakingTtsProfile('exam');
    setSpeakingTtsVoice('british-male');
    callEdgeFunctionStream.mockResolvedValue(
      jsonResponse({ useLegacy: true, reason: 'provider_error' })
    );
    const result = await requestSpeakingTts('Do you work or study?');
    expect(result.data).toBeNull();
    expect(result.error.message).toContain('Gemini exam voice unavailable');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('rejects a cached exam response with the wrong Gemini voice', async () => {
    setSpeakingTtsProfile('exam');
    setSpeakingTtsVoice('australian-male');
    callEdgeFunctionStream.mockResolvedValue(
      jsonResponse({
        ...cachedPractice,
        model: 'google/gemini-3.8-flash-lite-tts',
        voice: 'en-gb-tutor-4',
      })
    );
    const result = await requestSpeakingTts('Do you work or study?');
    expect(result.data).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('accepts only a PCM stream with the selected Gemini voice', async () => {
    setSpeakingTtsProfile('exam');
    callEdgeFunctionStream.mockResolvedValueOnce(
      pcmResponse({
        'X-TTS-Model': 'google/gemini-3.8-flash-lite-tts',
        'X-TTS-Voice': 'en-gb-tutor-4',
      })
    );
    const selected = await requestSpeakingTts('Do you work or study?');
    expect(selected.data.stream).toBeInstanceOf(ReadableStream);
    callEdgeFunctionStream.mockResolvedValueOnce(pcmResponse());
    const mismatched = await requestSpeakingTts('Another question?');
    expect(mismatched.data).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('allows a build-time exam kill switch', async () => {
    vi.stubEnv('VITE_EXAM_TTS', 'off');
    setSpeakingTtsProfile('exam');
    await requestSpeakingTts('Do you work or study?');
    expect(callEdgeFunctionStream).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('keeps practice mode on the standard voice when the build kill switch is set', async () => {
    vi.stubEnv('VITE_PRACTICE_TTS', 'off');
    setSpeakingTtsProfile('practice');
    await requestSpeakingTts('Do you work or study?');
    expect(callEdgeFunctionStream).not.toHaveBeenCalled();
  });

  it('asks for a stream and hands back live PCM for a fresh phrase', async () => {
    setSpeakingTtsProfile('practice');
    callEdgeFunctionStream.mockResolvedValue(pcmResponse());

    const result = await requestSpeakingTts('Nice answer.');

    expect(callEdgeFunctionStream).toHaveBeenCalledWith(
      'synthesizePracticeSpeech',
      expect.objectContaining({ text: 'Nice answer.', mode: 'practice', stream: true })
    );
    expect(result.data.stream).toBeInstanceOf(ReadableStream);
    expect(result.data.sampleRate).toBe(24000);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('uses the cached clip URL when the server already has the phrase', async () => {
    setSpeakingTtsProfile('practice');
    callEdgeFunctionStream.mockResolvedValue(jsonResponse(cachedPractice));
    const result = await requestSpeakingTts('Do you work or study?');
    expect(result.data.audioUrl).toBe(cachedPractice.audioUrl);
  });

  it('falls back to the standard voice when the practice route fails or is missing', async () => {
    setSpeakingTtsProfile('practice');
    callEdgeFunctionStream
      .mockResolvedValueOnce(
        jsonResponse({ success: false, useLegacy: true, reason: 'provider_error' })
      )
      .mockResolvedValueOnce(jsonResponse({ error: 'not found' }, 404))
      .mockRejectedValueOnce(new Error('network'));

    for (const text of ['One.', 'Two.', 'Three.']) {
      const result = await requestSpeakingTts(text);
      expect(result.data.audioUrl).toBe(legacyAudio.audioUrl);
    }
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it('stops calling the practice route once the server excludes this learner', async () => {
    setSpeakingTtsProfile('practice');
    callEdgeFunctionStream.mockResolvedValue(
      jsonResponse({ success: false, useLegacy: true, reason: 'rollout' })
    );
    await requestSpeakingTts('First question.');
    await requestSpeakingTts('Second question.');
    expect(callEdgeFunctionStream).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('hands a prefetched stream to exactly one playback', async () => {
    setSpeakingTtsProfile('practice');
    callEdgeFunctionStream.mockImplementation(async () => pcmResponse());

    prefetchSpeakingTts('Tell me about your hometown.');
    const first = await requestSpeakingTts('Tell me about your hometown.');
    const second = await requestSpeakingTts('Tell me about your hometown.');

    // The prefetch is reused once; a replay requests a fresh stream.
    expect(callEdgeFunctionStream).toHaveBeenCalledTimes(2);
    expect(first.data.stream).not.toBe(second.data.stream);
  });

  it('checks auth and rollout before any provider, cache or quota work on the server', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'supabase/functions/synthesizePracticeSpeech/index.ts'),
      'utf8'
    );
    const handler = source.indexOf('serve(async');
    const auth = source.indexOf('if (authError || !user)', handler);
    const earlyLookup = source.indexOf('? lookupCache(', handler);
    const rollout = source.indexOf(
      "if (mode === 'practice' && !isPracticeTtsAllowed(rollout, isAdmin))",
      handler
    );
    const readLookup = source.indexOf('await earlyLookup', handler);
    const quota = source.indexOf('reserveDatabaseQuota(', handler);
    const cacheHit = source.indexOf('if (cacheHit)', handler);
    const burst = source.indexOf('const burst = checkRateLimit(', handler);
    const gemini = source.indexOf('return await streamGeminiSpeech(', handler);
    const openRouter = source.indexOf('fetch(OPENROUTER_SPEECH_URL', handler);

    expect(handler).toBeGreaterThan(-1);
    // The early cache lookup may start alongside the profile query, but only
    // for an authenticated caller, and its result is read after the rollout.
    expect(earlyLookup).toBeGreaterThan(auth);
    expect(source.slice(handler, earlyLookup)).toContain("mode === 'exam' || rollout !== 'off'");
    expect(rollout).toBeGreaterThan(earlyLookup);
    expect(readLookup).toBeGreaterThan(rollout);
    expect(quota).toBeGreaterThan(readLookup);
    expect(burst).toBeGreaterThan(cacheHit);
    expect(quota).toBeGreaterThan(burst);
    expect(source.slice(cacheHit, quota)).toContain("mode === 'exam' ? RATE_LIMITS.AI_FUNCTION");
    expect(gemini).toBeGreaterThan(quota);
    expect(openRouter).toBeGreaterThan(quota);
    // Shares the synthesizeSpeech TTS quota instead of opening a new, unmetered one.
    expect(source).toContain("'synthesizeSpeech',\n      'tts',");
  });
});
