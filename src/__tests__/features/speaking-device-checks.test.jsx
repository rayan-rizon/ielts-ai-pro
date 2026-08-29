import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import InitialWelcomeScreen from '@/features/testing/speaking/components/InitialWelcomeScreen';
import { isSpeakingV2Available } from '@/features/testing/speaking/utils/speakingV2';

const stopTrack = vi.fn();

class FakeOscillator {
  frequency = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };

  connect() {}
  start() {}

  stop() {
    queueMicrotask(() => this.onended?.());
  }
}

class FakeGain {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };

  connect() {}
}

class FakeAnalyser {
  fftSize = 512;
  smoothingTimeConstant = 0;

  getByteTimeDomainData(samples) {
    samples.fill(150);
  }
}

class FakeAudioContext {
  currentTime = 0;
  destination = {};

  createOscillator() {
    return new FakeOscillator();
  }

  createGain() {
    return new FakeGain();
  }

  createAnalyser() {
    return new FakeAnalyser();
  }

  createMediaStreamSource() {
    return { connect: vi.fn() };
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

describe('speaking device readiness checks', () => {
  beforeEach(() => {
    stopTrack.mockClear();
    vi.stubGlobal('AudioContext', FakeAudioContext);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('plays a local speaker test tone', async () => {
    render(<InitialWelcomeScreen partNumber={1} title="Introduction & Interview" />);

    fireEvent.click(screen.getByRole('button', { name: 'Test speakers' }));

    expect(await screen.findByText('Test sound played')).toBeInTheDocument();
  });

  it('requests the microphone and confirms detected voice input', async () => {
    vi.useFakeTimers();
    render(<InitialWelcomeScreen partNumber={1} title="Introduction & Interview" />);

    fireEvent.click(screen.getByRole('button', { name: 'Test microphone' }));
    expect(screen.getByText('Listening…')).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(screen.getByText('Microphone works')).toBeInTheDocument();
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('cancels microphone sampling and releases the stream on unmount', async () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <InitialWelcomeScreen partNumber={1} title="Introduction & Interview" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Test microphone' }));
    await act(async () => Promise.resolve());
    unmount();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(stopTrack).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('lets an internal learner choose Exam or Practice before starting', () => {
    const setSpeakingMode = vi.fn();
    render(
      <InitialWelcomeScreen
        partNumber={1}
        title="Introduction & Interview"
        speakingMode="exam"
        setSpeakingMode={setSpeakingMode}
        speakingV2Available
      />
    );

    expect(screen.getByRole('button', { name: /exam/i })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /practice/i }));
    expect(setSpeakingMode).toHaveBeenCalledWith('practice');
  });

  it('uses the server-authoritative speaking implementation for every learner', () => {
    expect(isSpeakingV2Available({ role: 'free', subscription_tier: 'free' })).toBe(true);
    expect(isSpeakingV2Available({ role: 'admin', subscription_tier: 'premium' })).toBe(true);
  });
});
