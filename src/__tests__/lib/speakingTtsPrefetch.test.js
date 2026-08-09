import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke } },
}));

import {
  clearSpeakingTtsRequestCache,
  normalizeSpeakingTtsText,
  prefetchSpeakingTts,
  requestSpeakingTts,
} from '@/features/testing/speaking/utils/speakingTtsPrefetch';

describe('speaking TTS prefetch cache', () => {
  beforeEach(() => {
    clearSpeakingTtsRequestCache();
    invoke.mockReset();
  });

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

  it('does not retain failed or graceful-fallback responses', async () => {
    invoke.mockResolvedValueOnce({ data: { fallback: true }, error: null }).mockResolvedValueOnce({
      data: { success: true, audioUrl: 'data:audio/mp3;base64,retry' },
      error: null,
    });

    await requestSpeakingTts('Retry me.');
    await requestSpeakingTts('Retry me.');

    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
