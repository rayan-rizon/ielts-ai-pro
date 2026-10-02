import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasValidAudioDurations,
  loadAudioDuration,
  recoverListeningExamTiming,
} from '@/features/testing/listening/components/ListeningTest/utils/examAudio';
import { getExamRemainingSeconds } from '@/features/testing/shared/testMode';

describe('Listening exam audio timing', () => {
  let audioElements;
  beforeEach(() => {
    vi.useFakeTimers();
    audioElements = [];
    vi.stubGlobal(
      'Audio',
      class {
        duration = NaN;
        removeAttribute = vi.fn();
        load = vi.fn(() => {
          this.duration = NaN;
        });
        constructor() {
          audioElements.push(this);
        }
      }
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('captures duration before cleanup resets the media element', async () => {
    const promise = loadAudioDuration('/part-1.mp3');
    const audio = audioElements[0];
    audio.duration = 643.2;
    audio.onloadedmetadata();
    expect(audio.duration).toBeNaN();
    await expect(promise).resolves.toBe(644);
    expect(audio.onloadedmetadata).toBeNull();
  });

  it('waits for a finite duration instead of serializing NaN or Infinity as null', async () => {
    const promise = loadAudioDuration('/part-1.mp3');
    const audio = audioElements[0];
    audio.duration = Infinity;
    audio.onloadedmetadata();
    expect(audio.load).not.toHaveBeenCalled();
    audio.duration = 450;
    audio.ondurationchange();
    await expect(promise).resolves.toBe(450);
  });

  it('rejects unavailable metadata and cleans up on timeout', async () => {
    const promise = loadAudioDuration('/part-1.mp3');
    const assertion = expect(promise).rejects.toThrow(/duration/);
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
    expect(audioElements[0].onloadedmetadata).toBeNull();
  });

  it('rejects zero, null, missing, and non-finite stored durations', () => {
    for (const durations of [
      [null, null, null, null],
      [1, 2, 3, 0],
      [1, 2, 3, NaN],
      [1, 2, 3, Infinity],
      [],
      [1, 2, 3],
    ]) {
      expect(hasValidAudioDurations(durations, 4)).toBe(false);
    }
  });

  it('recovers a broken attempt without changing its start or answers', async () => {
    const start = '2026-10-03T00:00:00Z';
    const original = {
      id: 'existing-attempt',
      created_at: start,
      user_responses: { q1: 'answer' },
      content_data: { audio_durations: [null, null, null, null], duration_seconds: null },
    };
    const promise = recoverListeningExamTiming(original, {
      content: [1, 2, 3, 4].map((part) => ({ audio_url: `/part-${part}.mp3` })),
    });
    for (const [index, audio] of audioElements.entries()) {
      audio.duration = [644, 425, 520, 453][index];
      audio.onloadedmetadata();
    }
    const recovered = await promise;
    expect(recovered.content_data.audio_durations).toEqual([644, 425, 520, 453]);
    expect(recovered.content_data.duration_seconds).toBe(2162);
    expect(recovered.created_at).toBe(start);
    expect(recovered.user_responses).toBe(original.user_responses);
    expect(original.content_data.duration_seconds).toBeNull();
    expect(getExamRemainingSeconds(recovered, 2162, Date.parse(start) + 15000)).toBe(2147);
  });

  it('uses valid saved durations without refetching audio', async () => {
    const session = {
      content_data: { audio_durations: [600, 400, 500, 450], duration_seconds: null },
    };
    const recovered = await recoverListeningExamTiming(session, { content: [{}, {}, {}, {}] });
    expect(recovered.content_data.duration_seconds).toBe(2070);
    expect(audioElements).toHaveLength(0);
  });
});
