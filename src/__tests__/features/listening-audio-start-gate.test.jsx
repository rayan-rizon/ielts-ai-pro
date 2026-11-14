import React, { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('turns an unsupported media rejection into a visible recovery state', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValue(new DOMException('No supported source', 'NotSupportedError'));
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

    render(<AudioPlayer src="/listening-audio.mp3" />);

    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be played/i);
  });
  it('lets an interrupted exam recording resume from its current position', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
      fireEvent.play(this);
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const { container } = render(<AudioPlayer src="/part-4.mp3" examMode />);
    const audio = container.querySelector('audio');

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Start audio' })));
    audio.currentTime = 123;
    fireEvent.timeUpdate(audio);
    fireEvent.pause(audio);

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Resume audio' })));
    expect(audio.currentTime).toBe(123);
    expect(screen.queryByRole('button', { name: 'Resume audio' })).not.toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: /seek|progress/i })).not.toBeInTheDocument();
  });

  it('keeps recovery available when the browser initially rejects resume', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new DOMException('Gesture required', 'NotAllowedError'))
      .mockImplementation(function () {
        fireEvent.play(this);
        return Promise.resolve();
      });
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    const { container } = render(<AudioPlayer src="/part-4.mp3" examMode />);
    const audio = container.querySelector('audio');
    audio.currentTime = 123;
    fireEvent.timeUpdate(audio);

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Resume audio' })));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume audio' })).toBeEnabled();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Resume audio' })));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(audio.currentTime).toBe(123);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('does not offer resume after the exam enters review', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const { container } = render(<AudioPlayer src="/part-4.mp3" examMode examReview />);
    const audio = container.querySelector('audio');
    audio.currentTime = 463;
    fireEvent.timeUpdate(audio);
    fireEvent.pause(audio);
    expect(screen.getByText('Audio complete')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /start audio|resume audio/i })
    ).not.toBeInTheDocument();
  });
});
