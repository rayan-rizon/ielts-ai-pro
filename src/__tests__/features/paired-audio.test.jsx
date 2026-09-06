import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { PairedContext } from '@/features/testing/paired/PairedContext';
import { usePairedAudio } from '@/features/testing/paired/usePairedAudio';
import { useListeningTestStore } from '@/features/testing/listening/store/useListeningTestStore';

describe('paired Listening recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useListeningTestStore.getState().setActivePart(0);
  });
  afterEach(() => vi.useRealTimers());
  function setup(seconds, blocked = false) {
    const media = Object.assign(new EventTarget(), {
      currentTime: 0,
      readyState: 4,
      playbackRate: 1.5,
      paused: true,
      play: blocked
        ? vi.fn().mockRejectedValue(new Error('gesture required'))
        : vi.fn().mockResolvedValue(),
      pause: vi.fn(),
    });
    const ref = { current: media };
    const start = Date.parse('2026-09-01T00:00:00Z');
    const context = {
      now: () => start + seconds * 1000,
      act: vi.fn().mockResolvedValue({}),
      room: {
        id: 'room',
        state: 'running',
        started_at: new Date(start).toISOString(),
        audio_durations: [100, 200, 300, 400],
        audio_sources: ['one', 'two', 'three', 'four'],
        own: {},
      },
    };
    const wrapper = ({ children }) => (
      <PairedContext.Provider value={context}>{children}</PairedContext.Provider>
    );
    const hook = renderHook(() => usePairedAudio(ref, 'two'), { wrapper });
    return { hook, media, context };
  }
  it('rejoins the correct part and offset at normal speed', async () => {
    const { hook, media, context } = setup(150);
    await act(async () => {
      await Promise.resolve();
    });
    expect(useListeningTestStore.getState().activePart).toBe(1);
    expect(media.currentTime).toBe(50);
    expect(media.playbackRate).toBe(1);
    expect(media.play).toHaveBeenCalled();
    expect(context.act).toHaveBeenCalledWith('interrupted');
    expect(hook.result.current.interrupted).toBe(true);
  });
  it('offers an explicit recovery action when autoplay is blocked', async () => {
    const { hook, media } = setup(150, true);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(hook.result.current.blocked).toBe(true);
    media.play.mockResolvedValue();
    await act(async () => {
      hook.result.current.enable();
      await Promise.resolve();
    });
    expect(hook.result.current.blocked).toBe(false);
  });
  it('stops playback for the shared review interval', () => {
    const { media } = setup(1000);
    expect(media.pause).toHaveBeenCalled();
    expect(media.play).not.toHaveBeenCalled();
  });
});
