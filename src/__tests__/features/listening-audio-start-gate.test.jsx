import React, { createRef } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AudioPlayer from '@/features/testing/listening/components/ListeningTest/components/AudioPlayer';

describe('Listening audio start gate', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not play audio until the learner starts the test', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const ref = createRef();
    const { rerender } = render(
      <AudioPlayer ref={ref} src="/listening-audio.mp3" isAwaitingStart />
    );

    await act(async () => {
      ref.current.play();
    });
    expect(play).not.toHaveBeenCalled();

    rerender(<AudioPlayer ref={ref} src="/listening-audio.mp3" isAwaitingStart={false} />);
    await act(async () => {
      ref.current.play();
    });
    expect(play).toHaveBeenCalledTimes(1);
  });
});
