import { describe, expect, it } from 'vitest';

import { findActiveSegment, parseSrt } from '@/utils/parseSrt';

describe('parseSrt', () => {
  it('clamps malformed overlapping cue windows to the next segment start', () => {
    const srt = [
      '1',
      '00:56,800 --> 10:0,900',
      'As many of you may know, the idea for these initiatives came from you, the public.',
      '',
      '2',
      '01:00,900 --> 01:07,300',
      'In extensive consultation exercise which the city council conducted last year.',
      '',
      '3',
      '01:07,300 --> 01:10,000',
      'And they have been realized using money from the SWRDC.',
    ].join('\n');

    const segments = parseSrt(srt);

    expect(segments).toHaveLength(3);
    expect(segments[0].start).toBeCloseTo(56.8, 3);
    expect(segments[0].end).toBeCloseTo(60.9, 3);
    expect(segments[1].start).toBeCloseTo(60.9, 3);
    expect(segments[1].end).toBeCloseTo(67.3, 3);
    expect(segments[2].start).toBeCloseTo(67.3, 3);
    expect(segments[2].end).toBeCloseTo(70, 3);
    expect(segments[0].end).toBeLessThanOrEqual(segments[1].start);
    expect(segments[1].end).toBeLessThanOrEqual(segments[2].start);
  });

  it('keeps well-formed cue timings unchanged', () => {
    const srt = [
      '1',
      '00:00:01,000 --> 00:00:03,000',
      'First sentence.',
      '',
      '2',
      '00:00:04,000 --> 00:00:05,500',
      'Second sentence.',
      '',
      '3',
      '00:00:06,000 --> 00:00:07,000',
      'Third sentence.',
    ].join('\n');

    const segments = parseSrt(srt);

    expect(segments).toEqual([
      { id: 1, start: 1, end: 3, speaker: null, text: 'First sentence.' },
      { id: 2, start: 4, end: 5.5, speaker: null, text: 'Second sentence.' },
      { id: 3, start: 6, end: 7, speaker: null, text: 'Third sentence.' },
    ]);
  });

  it('uses a 3-second fallback for the final segment when its end is invalid', () => {
    const srt = [
      '1',
      '00:00:01,000 --> 00:00:03,000',
      'First sentence.',
      '',
      '2',
      '00:00:05,000 --> 00:00:05,000',
      'Last sentence.',
    ].join('\n');

    const segments = parseSrt(srt);

    expect(segments[1].start).toBe(5);
    expect(segments[1].end).toBe(8);
  });
});

describe('findActiveSegment', () => {
  it('prefers the most recent segment when malformed windows overlap', () => {
    const segments = [
      { start: 56.8, end: 600.9 },
      { start: 60.9, end: 67.3 },
      { start: 67.3, end: 70.0 },
    ];

    expect(findActiveSegment(segments, 61)).toBe(1);
    expect(findActiveSegment(segments, 68)).toBe(2);
  });

  it('preserves normal active-segment matching for well-formed cues', () => {
    const segments = [
      { start: 1, end: 3 },
      { start: 4, end: 5.5 },
      { start: 6, end: 7 },
    ];

    expect(findActiveSegment(segments, 4.2)).toBe(1);
  });
});
