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

  it('repairs non-monotonic compact timestamps like the malformed part 1 transcript', () => {
    const srt = [
      '1',
      '00:01:00,740 --> 00:02:00,740',
      'Part 1',
      '',
      '2',
      '00:03:30,000 --> 00:07:40,000',
      'You will hear a woman asking a friend for restaurant recommendations.',
      '',
      '3',
      '00:08:50,000 --> 00:12:990',
      'First, you have some time to look at questions 1 to 4.',
      '',
      '4',
      '00:33:680 --> 00:37:480',
      'Now listen carefully and answer questions 1 to 4.',
      '',
      '5',
      '00:58:400 --> 00:59:480',
      'We had a great time there.',
      '',
      '6',
      '01:00:300 --> 01:01:680',
      'Everyone really enjoyed it.',
      '',
      '7',
      '01:02:300 --> 01:04:300',
      "SPEAKER 1: Where is it again? I can't remember.",
    ].join('\n');

    const segments = parseSrt(srt);

    expect(segments[0].start).toBeLessThan(10);
    expect(segments[0].end).toBeLessThan(10);
    expect(segments[1].start).toBeLessThan(10);
    expect(segments[1].end).toBeLessThan(10);
    expect(segments[2].start).toBeLessThan(15);
    expect(segments[2].end).toBeCloseTo(12.99, 3);
    expect(segments[0].start).toBeLessThan(segments[1].start);
    expect(segments[1].start).toBeLessThan(segments[2].start);
    expect(segments[5].start).toBeCloseTo(60.3, 3);
    expect(segments[5].end).toBeCloseTo(61.68, 3);
    expect(segments[6].start).toBeCloseTo(62.3, 3);
    expect(segments[6].end).toBeCloseTo(64.3, 3);
    expect(findActiveSegment(segments, 60.5)).toBe(5);
    expect(findActiveSegment(segments, 62.5)).toBe(6);
  });

  it('clamps malformed two-part end timestamps like the provided part 2 transcript', () => {
    const srt = [
      '1',
      '03:43,900 --> 03:46,100',
      'A gift for a friend perhaps.',
      '',
      '2',
      '03:47,100 --> 33:52,700',
      "Like nearly everyone who comes here, I'm sure this is the first time you will have tried the art.",
      '',
      '3',
      '03:53,200 --> 03:55,400',
      "So we'll keep things simple today.",
    ].join('\n');

    const segments = parseSrt(srt);

    expect(segments[1].start).toBeCloseTo(227.1, 3);
    expect(segments[1].end).toBeCloseTo(233.2, 3);
    expect(findActiveSegment(segments, 229.5)).toBe(1);
    expect(findActiveSegment(segments, 233.5)).toBe(2);
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
