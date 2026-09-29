import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke } },
}));

import {
  normalizeSpeakingTtsText,
  prefetchSpeakingTts,
  requestSpeakingTts,
  resetSpeakingTtsRoutingForTests,
  setSpeakingTtsVoice,
} from '@/features/testing/speaking/utils/speakingTtsPrefetch';
import { playInitialGreeting } from '@/features/testing/speaking/hooks/useStartSpeakingTest';

describe('speaking TTS prefetch cache', () => {
  beforeEach(() => {
    resetSpeakingTtsRoutingForTests();
    vi.stubEnv('VITE_EXAM_TTS', 'off');
    invoke.mockReset();
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

  it('uses distinct regional female and male voices and separates their cache keys', async () => {
    invoke.mockResolvedValue({
      data: { success: true, audioUrl: 'data:audio/mp3;base64,test' },
      error: null,
    });
    await requestSpeakingTts('Good morning.');
    setSpeakingTtsVoice('british-male');
    await requestSpeakingTts('Good morning.');
    setSpeakingTtsVoice('australian-female');
    await requestSpeakingTts('Good morning.');
    setSpeakingTtsVoice('australian-male');
    await requestSpeakingTts('Good morning.');
    setSpeakingTtsVoice('american-female');
    await requestSpeakingTts('Good morning.');
    setSpeakingTtsVoice('american-male');
    await requestSpeakingTts('Good morning.');
    expect(invoke.mock.calls.map(([, { body }]) => body.voice)).toEqual([
      'en-GB-Neural2-C',
      'en-GB-Neural2-D',
      'en-AU-Neural2-A',
      'en-AU-Neural2-B',
      'en-US-Neural2-C',
      'en-US-Neural2-D',
    ]);
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
