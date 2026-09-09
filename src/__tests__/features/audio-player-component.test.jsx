import React, { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AudioPlayer from '@/features/testing/listening/components/ListeningTest/components/AudioPlayer';

describe('AudioPlayer Component', () => {
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

  it('renders playback controls and handles play/pause toggle in standard mode', async () => {
    let isPaused = true;
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
      isPaused = false;
      return Promise.resolve();
    });
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
      isPaused = true;
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
      get: () => isPaused,
      configurable: true,
    });
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});

    render(<AudioPlayer src="/test-audio.mp3" />);

    const playButton = screen.getByRole('button', { name: 'Play audio' });
    expect(playButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(playButton);
    });
    expect(playSpy).toHaveBeenCalledTimes(1);

    const pauseButton = screen.getByRole('button', { name: 'Pause audio' });
    expect(pauseButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(pauseButton);
    });
    expect(pauseSpy).toHaveBeenCalledTimes(1);
  });

  it('skips forward and backward by 10 seconds', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    const onTimeUpdate = vi.fn();

    const { container } = render(<AudioPlayer src="/test-audio.mp3" onTimeUpdate={onTimeUpdate} />);
    const audioElement = container.querySelector('audio');
    expect(audioElement).toBeInTheDocument();

    let currentTime = 20;
    Object.defineProperty(audioElement, 'duration', { value: 60, configurable: true });
    Object.defineProperty(audioElement, 'currentTime', {
      get: () => currentTime,
      set: (val) => {
        currentTime = val;
      },
      configurable: true,
    });

    // Notify AudioPlayer of loaded metadata so duration state updates
    act(() => {
      fireEvent.loadedMetadata(audioElement);
    });

    const forwardButton = screen.getByRole('button', { name: 'Seek forward 10 seconds' });
    fireEvent.click(forwardButton);
    expect(audioElement.currentTime).toBe(30);
    expect(onTimeUpdate).toHaveBeenCalledWith(30);

    const backButton = screen.getByRole('button', { name: 'Seek backward 10 seconds' });
    fireEvent.click(backButton);
    expect(audioElement.currentTime).toBe(20);
    expect(onTimeUpdate).toHaveBeenCalledWith(20);
  });

  it('exposes imperative controls (seek, play, pause, getCurrentTime) through forwarded ref', async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});

    const playerRef = createRef();
    const onTimeUpdate = vi.fn();

    const { container } = render(
      <AudioPlayer ref={playerRef} src="/test-audio.mp3" onTimeUpdate={onTimeUpdate} />
    );
    const audioElement = container.querySelector('audio');
    Object.defineProperty(audioElement, 'duration', { value: 120, writable: true });
    Object.defineProperty(audioElement, 'currentTime', { value: 0, writable: true });

    await act(async () => {
      playerRef.current.play();
    });
    expect(playSpy).toHaveBeenCalled();

    act(() => {
      playerRef.current.seek(45);
    });
    expect(audioElement.currentTime).toBe(45);
    expect(playerRef.current.getCurrentTime()).toBe(45);
    expect(onTimeUpdate).toHaveBeenCalledWith(45);

    act(() => {
      playerRef.current.pause();
    });
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('renders exam mode specific controls (progress bar, volume slider)', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});

    render(<AudioPlayer src="/test-audio.mp3" examMode />);

    expect(screen.getByRole('button', { name: 'Start audio' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Audio progress' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
  });

  it('updates playback rate when selected in standard mode', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    const { container } = render(<AudioPlayer src="/test-audio.mp3" />);
    const audioElement = container.querySelector('audio');

    const rateSelects = screen.getAllByRole('combobox', { name: 'Audio playback speed' });
    fireEvent.change(rateSelects[0], { target: { value: '1.25' } });

    expect(audioElement.playbackRate).toBe(1.25);
  });
});
