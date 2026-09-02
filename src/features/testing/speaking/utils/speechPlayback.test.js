import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isSpeechPlaybackUnlocked,
  onSpeechPlaybackUnlocked,
  resetSpeechPlaybackForTests,
  unlockSpeechPlayback,
} from './speechPlayback';

class FakeAudio {
  constructor() {
    this.src = '';
    this.played = 0;
  }

  play() {
    this.played += 1;
    return Promise.resolve();
  }

  pause() {}
  setAttribute() {}
  removeAttribute() {}
  load() {}
}

afterEach(() => {
  resetSpeechPlaybackForTests();
  vi.unstubAllGlobals();
});

describe('examiner speech playback unlock', () => {
  it('holds an utterance requested before any interaction and releases it on unlock', () => {
    vi.stubGlobal('Audio', FakeAudio);
    const speakOnResume = vi.fn();

    // A resumed session asks for the examiner's last question during page load.
    expect(isSpeechPlaybackUnlocked()).toBe(false);
    onSpeechPlaybackUnlocked(speakOnResume);
    expect(speakOnResume).not.toHaveBeenCalled();

    unlockSpeechPlayback();

    expect(isSpeechPlaybackUnlocked()).toBe(true);
    expect(speakOnResume).toHaveBeenCalledOnce();
  });

  it('runs immediately once playback is already permitted', () => {
    vi.stubGlobal('Audio', FakeAudio);
    unlockSpeechPlayback();

    const speak = vi.fn();
    onSpeechPlaybackUnlocked(speak);
    expect(speak).toHaveBeenCalledOnce();
  });

  it('unlocks only once no matter how many interactions arrive', () => {
    vi.stubGlobal('Audio', FakeAudio);
    unlockSpeechPlayback();
    const listener = vi.fn();
    onSpeechPlaybackUnlocked(listener);
    unlockSpeechPlayback();

    expect(listener).toHaveBeenCalledOnce();
  });
});
