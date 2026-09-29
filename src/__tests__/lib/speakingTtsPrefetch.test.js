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
  normalizeSpeakingTtsText,
  prefetchSpeakingTts,
  requestSpeakingTts,
  resetSpeakingTtsRoutingForTests,
  setSpeakingTtsProfile,
} from '@/features/testing/speaking/utils/speakingTtsPrefetch';
import { playInitialGreeting } from '@/features/testing/speaking/hooks/useStartSpeakingTest';
import {
  getSpeakingVoice,
  SPEAKING_EXAMINER_VOICES,
} from '@/features/testing/speaking/utils/speakingAccents';

describe('speaking TTS prefetch cache', () => {
  beforeEach(() => {
    resetSpeakingTtsRoutingForTests();
    setSpeakingTtsProfile('practice');
    vi.stubEnv('VITE_PRACTICE_TTS', 'off');
    invoke.mockReset();
    callEdgeFunctionStream.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it('shares one Edge invocation between prefetch and playback', async () => {
    let resolveRequest;
    invoke.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    prefetchSpeakingTts('What do you do?');
    const playbackRequest = requestSpeakingTts('What do you do?');

    expect(invoke).toHaveBeenCalledTimes(1);
    resolveRequest({
      data: { success: true, audioUrl: 'data:audio/mp3;base64,test' },
      error: null,
    });
    await expect(playbackRequest).resolves.toMatchObject({ data: { success: true } });
    await requestSpeakingTts('What do you do?');
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('shares a Gemini exam cache request between prefetch and playback', async () => {
    setSpeakingTtsProfile('exam');
    let resolveRequest;
    callEdgeFunctionStream.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    prefetchSpeakingTts('What do you do?');
    const playback = requestSpeakingTts('What do you do?');
    expect(callEdgeFunctionStream).toHaveBeenCalledTimes(1);
    resolveRequest(
      new Response(
        JSON.stringify({
          success: true,
          cached: true,
          audioUrl: 'https://media.ieltsai.pro/exam-voice.wav',
          model: 'google/gemini-3.8-flash-lite-tts',
          voice: 'Sulafat',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    );
    await expect(playback).resolves.toMatchObject({ data: { cached: true } });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('normalizes equivalent IELTS question notation to the same cache key', async () => {
    invoke.mockResolvedValue({
      data: { success: true, audioUrl: 'data:audio/mp3;base64,test' },
      error: null,
    });

    await requestSpeakingTts('[Why / Why not?]');
    await requestSpeakingTts('Why, or why not?');

    expect(normalizeSpeakingTtsText('[Why / Why not?]')).toBe('Why, or why not?');
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('uses four distinct Gemini exam voices and keeps British female as the default', () => {
    expect(SPEAKING_EXAMINER_VOICES.map((voice) => voice.geminiVoice)).toEqual([
      'Sulafat',
      'en-gb-tutor-14',
      'en-au-tutor-5',
      'despina',
    ]);
    expect(SPEAKING_EXAMINER_VOICES).toHaveLength(4);
    expect(getSpeakingVoice()).toMatchObject({
      id: 'british-female',
      name: 'Sulafat',
      geminiVoice: 'Sulafat',
    });
    expect(getSpeakingVoice('australian-female').id).toBe('australian-male');
    expect(getSpeakingVoice('american-male').id).toBe('american-female');
  });

  it('does not retain failed or graceful-fallback responses', async () => {
    invoke.mockResolvedValueOnce({ data: { fallback: true }, error: null }).mockResolvedValueOnce({
      data: { success: true, audioUrl: 'data:audio/mp3;base64,retry' },
      error: null,
    });

    await requestSpeakingTts('Retry me.');
    await requestSpeakingTts('Retry me.');

    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('routes initial greeting and question prefetches through the shared request cache', () => {
    const startSource = readFileSync(
      resolve(process.cwd(), 'src/features/testing/speaking/hooks/useStartSpeakingTest.js'),
      'utf8'
    );

    expect(startSource).toContain('prefetchSpeakingTts(greeting)');
    expect(startSource).toContain('prefetchSpeakingTts(firstQuestion)');
    expect(startSource).toContain('setSpeakingTtsProfile(speakingMode)');
  });

  it('reuses prefetched announcement and question audio when the test starts', async () => {
    invoke.mockResolvedValue({
      data: { success: true, audioUrl: 'data:audio/mp3;base64,cached' },
      error: null,
    });
    const greeting = 'Welcome to the speaking test.';
    const question = 'Do you work or study?';
    prefetchSpeakingTts(greeting);
    prefetchSpeakingTts(question);

    await playInitialGreeting({
      allParts: { 1: { questions: question } },
      firstQuestionInsertedRef: { current: false },
      pendingGreetingRef: { current: { greeting, partNumber: 1 } },
      requestAutoStart: vi.fn(),
      setConversation: vi.fn(),
      setCurrentQuestionIndex: vi.fn(),
      setTestStarted: vi.fn(),
      speakText: requestSpeakingTts,
    });

    // One synthesis request per unique phrase: start playback consumes the
    // prefetched promises and cannot double-charge the provider path.
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
