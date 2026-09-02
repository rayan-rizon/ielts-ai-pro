import { describe, expect, it } from 'vitest';

import {
  findActiveSegment,
  isSilenceSegment,
  normalizeSrtContent,
  parsePlainTranscript,
  parseSrt,
  resolveTranscriptSpeakers,
} from '@/utils/parseSrt';

describe('parseSrt', () => {
  it('repairs split end timestamps without displaying them as transcript text', () => {
    const malformedSrt = [
      '4',
      '00:58:300 --> 1',
      '00:58:900',
      'Good morning.',
      '',
      '5',
      '00:59:100 --> 1',
      '01:01:900',
      "I'm doing a survey of shoppers in Broad Beach.",
    ].join('\n');

    expect(normalizeSrtContent(malformedSrt)).toContain('00:58:300 --> 00:58:900');

    const segments = parseSrt(malformedSrt);

    expect(segments).toEqual([
      { id: 4, start: 58.3, end: 58.9, speaker: null, text: 'Good morning.' },
      {
        id: 5,
        start: 59.1,
        end: 61.9,
        speaker: null,
        text: "I'm doing a survey of shoppers in Broad Beach.",
      },
    ]);
    expect(segments.map((segment) => segment.text).join(' ')).not.toMatch(/\d{2}:\d{2}:\d{3}/);
  });

  it('leaves valid SRT and plain transcript text unchanged during normalization', () => {
    const validSrt = ['1', '00:00:01,000 --> 00:00:03,000', 'First sentence.'].join('\n');
    const plainTranscript = 'Part 1. Listen carefully and answer questions 1 to 6.';

    expect(normalizeSrtContent(validSrt)).toBe(validSrt);
    expect(normalizeSrtContent(plainTranscript)).toBe(plainTranscript);
  });

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

  it('treats a third colon field over 59 as milliseconds, not seconds', () => {
    const srt = [
      '1',
      '00:01:400 --> 00:02:200',
      'Part one.',
      '',
      '2',
      '00:58:700 --> 01:02:400',
      'The conversation begins.',
      '',
      '3',
      '10:02:400 --> 10:05:900',
      'The compact minute field continues correctly.',
    ].join('\n');

    const segments = parseSrt(srt);

    expect(segments).toEqual([
      { id: 1, start: 1.4, end: 2.2, speaker: null, text: 'Part one.' },
      {
        id: 2,
        start: 58.7,
        end: 62.4,
        speaker: null,
        text: 'The conversation begins.',
      },
      {
        id: 3,
        start: 62.4,
        end: 65.9,
        speaker: null,
        text: 'The compact minute field continues correctly.',
      },
    ]);
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

  it('parses blankless SRT with mixed two-part and three-part timestamps', () => {
    const srt = [
      '1',
      '00:00:04,90 --> 00:07,90',
      'You will hear a university lecture.',
      '2',
      '00:07,90 --> 00:10,700',
      'known as the Spirit Bear.',
      '3',
      '00:12,10 --> 00:16,600',
      'First, you have some time to look at questions 31 to 40.',
    ].join('\n');

    const segments = parseSrt(srt);

    expect(segments).toHaveLength(3);
    expect(segments.map((segment) => segment.text)).toEqual([
      'You will hear a university lecture.',
      'known as the Spirit Bear.',
      'First, you have some time to look at questions 31 to 40.',
    ]);
    expect(segments[2].start).toBeCloseTo(12.1, 3);
  });

  it('parses image-style transcripts without inventing timestamps', () => {
    const transcript = [
      'Job Details',
      '',
      'ANNOUNCER: Part 1. You will hear a telephone conversation.',
      '',
      'JULIE: Hello?',
      'GREG: Is that Julie Davison?',
    ].join('\n');

    expect(parsePlainTranscript(transcript)).toEqual([
      {
        id: 1,
        start: null,
        end: null,
        speaker: 'ANNOUNCER',
        text: 'Part 1. You will hear a telephone conversation.',
      },
      { id: 2, start: null, end: null, speaker: 'JULIE', text: 'Hello?' },
      { id: 3, start: null, end: null, speaker: 'GREG', text: 'Is that Julie Davison?' },
    ]);
  });

  it('recognizes silence placeholders and propagates explicit speakers safely', () => {
    const segments = [
      { id: 1, start: 1, end: 2, speaker: null, text: 'You will hear two students.' },
      { id: 2, start: 2.2, end: 3, speaker: null, text: 'First, you have some time.' },
      { id: 3, start: 8, end: 9, speaker: 'MIA', text: 'Are we ready?' },
      { id: 4, start: 9.1, end: 10, speaker: null, text: 'We should begin.' },
    ];

    expect(isSilenceSegment('[Silence]')).toBe(true);
    expect(resolveTranscriptSpeakers(segments).map((segment) => segment.speaker)).toEqual([
      'ANNOUNCER',
      'ANNOUNCER',
      'MIA',
      'MIA',
    ]);
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
