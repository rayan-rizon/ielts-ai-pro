import { renderHook, act } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAudioElement = {
  src: '',
  currentTime: 0,
  duration: 10,
  volume: 1,
  paused: false,
  play: vi.fn().mockImplementation(function () {
    this.onplay?.();
    return Promise.resolve();
  }),
  pause: vi.fn(),
  setAttribute: vi.fn(),
};

const { streamPlayer } = vi.hoisted(() => ({ streamPlayer: { current: null } }));

vi.mock('@/features/testing/speaking/utils/pcmStreamPlayer', () => ({
  getActivePcmPlayer: vi.fn(() => streamPlayer.current),
  playPcmStream: vi.fn((options) => {
    let resolveDone;
    const player = {
      done: new Promise((resolve) => {
        resolveDone = resolve;
      }),
      stop: vi.fn(),
      finish: vi.fn(() => resolveDone()),
      options,
    };
    options.onPlaybackActive?.();
    streamPlayer.current = player;
    return player;
  }),
}));

vi.mock('@/features/testing/speaking/utils/speechPlayback', () => ({
  getPlaybackAudio: vi.fn(() => mockAudioElement),
  getPlaybackAudioContext: vi.fn(() => ({ state: 'running' })),
  isSpeechPlaybackUnlocked: vi.fn(() => true),
  onSpeechPlaybackUnlocked: vi.fn((cb) => cb()),
  releasePlaybackAudio: vi.fn(),
  unlockSpeechPlayback: vi.fn(),
}));

vi.mock('@/features/testing/speaking/utils/speakingTtsPrefetch', () => ({
  normalizeSpeakingTtsText: vi.fn((t) => t),
  requestSpeakingTts: vi.fn().mockResolvedValue({
    data: { success: true, audioUrl: 'https://example.com/audio.mp3' },
    error: null,
  }),
}));

import useSpeechSynthesis from '@/features/testing/speaking/hooks/useSpeechSynthesis';
import { requestSpeakingTts } from '@/features/testing/speaking/utils/speakingTtsPrefetch';
import { releasePlaybackAudio } from '@/features/testing/speaking/utils/speechPlayback';

describe('useSpeechSynthesis hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with expected default values', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isTTSLoading).toBe(false);
    expect(result.current.activeSpeechText).toBe('');
    expect(result.current.isPlaybackActive).toBe(false);
    expect(result.current.speechProgress).toBeNull();
    expect(result.current.isMuted).toBe(false);
    expect(typeof result.current.speakText).toBe('function');
    expect(typeof result.current.cancelCurrentAudio).toBe('function');
    expect(typeof result.current.setIsMuted).toBe('function');
  });

  it('updates muted state correctly', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.setIsMuted(true);
    });

    expect(result.current.isMuted).toBe(true);
  });

  it('keeps examiner playback alive through the room cleanup effect on rerender', async () => {
    const cleanup = vi.fn();
    const { result, rerender } = renderHook(() => {
      const speech = useSpeechSynthesis();
      const { cancelCurrentAudio } = speech;
      // Same cleanup dependency as useSpeakingSessionEffects in the live room.
      useEffect(
        () => () => {
          cleanup();
          cancelCurrentAudio();
        },
        [cancelCurrentAudio]
      );
      return speech;
    });
    let completion;
    await act(async () => {
      completion = result.current.speakText('How often do you go shopping?');
      await Promise.resolve();
      await Promise.resolve();
    });
    rerender();
    expect(cleanup).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(true);
    expect(result.current.isPlaybackActive).toBe(true);
    await act(async () => {
      mockAudioElement.onended?.();
      await completion;
    });
  });

  it('resets state when cancelCurrentAudio is invoked', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.cancelCurrentAudio();
    });

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isTTSLoading).toBe(false);
    expect(result.current.activeSpeechText).toBe('');
    expect(result.current.isPlaybackActive).toBe(false);
    expect(result.current.speechProgress).toBeNull();
  });

  it('releases the active audio source when the examiner is interrupted', async () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    await act(async () => {
      void result.current.speakText('Tell me about your hometown.');
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.isPlaybackActive).toBe(true);
    act(() => result.current.cancelCurrentAudio());
    expect(releasePlaybackAudio).toHaveBeenCalledTimes(1);
    expect(result.current.isSpeaking).toBe(false);
  });

  it('triggers Google TTS on speakText call and completes playback', async () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    await act(async () => {
      const speakPromise = result.current.speakText('Hello, this is a speaking test.');
      // Wait for edge request to settle and audio element to receive src
      await vi.waitFor(() => {
        expect(requestSpeakingTts).toHaveBeenCalledWith('Hello, this is a speaking test.');
      });
      // Simulate playback finish
      mockAudioElement.onended?.();
      await speakPromise;
    });

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.activeSpeechText).toBe('');
  });

  it('settles the pending speech when the learner barges in, so the next step runs', async () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    let completion;
    await act(async () => {
      completion = result.current.speakText('You said there is many people.');
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.isPlaybackActive).toBe(true);

    let settled = false;
    await act(async () => {
      result.current.interruptCurrentAudio();
      await completion;
      settled = true;
    });

    expect(settled).toBe(true);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isPlaybackActive).toBe(false);
  });

  it('plays a streamed practice reply and lets the learner interrupt it', async () => {
    const pcm = await import('@/features/testing/speaking/utils/pcmStreamPlayer');
    requestSpeakingTts.mockResolvedValueOnce({
      data: { success: true, stream: new ReadableStream(), sampleRate: 24000 },
      error: null,
    });
    const { result } = renderHook(() => useSpeechSynthesis());

    let completion;
    await act(async () => {
      completion = result.current.speakText('Nice answer. Next question.');
      await vi.waitFor(() => expect(pcm.playPcmStream).toHaveBeenCalledTimes(1));
    });
    expect(pcm.playPcmStream.mock.calls[0][0]).toMatchObject({
      sampleRate: 24000,
      text: 'Nice answer. Next question.',
    });
    expect(result.current.isPlaybackActive).toBe(true);

    await act(async () => {
      result.current.interruptCurrentAudio();
      await completion;
    });
    expect(streamPlayer.current.finish).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
    streamPlayer.current = null;
  });
});
