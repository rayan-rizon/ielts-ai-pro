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

    expect(screen.getByRole('button', { name: 'Exam' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /practice/i }));
    expect(setSpeakingMode).toHaveBeenCalledWith('practice');
  });

  it('renders both practice and exam modes within the unified stage card without layout shift', () => {
    const { rerender } = render(
      <InitialWelcomeScreen
        partNumber={1}
        title="Introduction & Interview"
        speakingMode="practice"
        speakingV2Available
      />
    );

    expect(screen.getByRole('group', { name: 'Practice mode' })).toBeInTheDocument();
    expect(screen.getByText('Live voice coaching')).toBeInTheDocument();
    expect(screen.getByText('Instant vocabulary hints')).toBeInTheDocument();
    expect(screen.getByText('Hands-free flow with pause')).toBeInTheDocument();

    rerender(
      <InitialWelcomeScreen
        partNumber={1}
        title="Introduction & Interview"
        speakingMode="exam"
        speakingV2Available
        examinerVoice="british-female"
      />
    );

    expect(screen.getByRole('group', { name: 'Exam mode' })).toBeInTheDocument();
    expect(screen.getByText('Choose your examiner voice')).toBeInTheDocument();
    expect(screen.getByText('4 voices')).toBeInTheDocument();
  });

  it('selects and previews the exam accent from the welcome screen', () => {
    const onExaminerVoiceChange = vi.fn();
    const onVoicePreview = vi.fn();
    const { rerender } = render(
      <InitialWelcomeScreen
        partNumber={1}
        title="Introduction & Interview"
        speakingMode="exam"
        examinerVoice="british-female"
        onExaminerVoiceChange={onExaminerVoiceChange}
        onVoicePreview={onVoicePreview}
      />
    );

    expect(screen.getByText('4 voices')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Select Harper/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Select Ethan/i })).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Select Noah, Australian male examiner voice' })
    );
    expect(onExaminerVoiceChange).toHaveBeenCalledWith('australian-male');
    rerender(
      <InitialWelcomeScreen
        partNumber={1}
        title="Introduction & Interview"
        speakingMode="exam"
        examinerVoice="australian-male"
        onExaminerVoiceChange={onExaminerVoiceChange}
        onVoicePreview={onVoicePreview}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview Noah voice' }));
    expect(onVoicePreview).toHaveBeenCalledWith(
      'australian-male',
      expect.stringContaining('Good morning')
    );
  });

  it('uses the server-authoritative speaking implementation for every learner', () => {
    expect(isSpeakingV2Available({ role: 'free', subscription_tier: 'free' })).toBe(true);
    expect(isSpeakingV2Available({ role: 'admin', subscription_tier: 'premium' })).toBe(true);
  });
});
