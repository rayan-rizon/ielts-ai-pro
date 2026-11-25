import { describe, expect, it } from 'vitest';
import { unfinishedSnapshot } from '../../../supabase/functions/_shared/objective-scoring/paired.js';

const listening = {
  testData: {
    test_type: 'listening',
    transcript: 'Full audioscript',
    content: [
      {
        title: 'Part 1',
        audio_url: 'https://example.test/part1.mp3',
        srt_content: '1\n00:00:01,000 --> 00:00:02,000\nHello.',
        transcript: 'Hello.',
        transcript_highlights: [{ question_number: 1, phrase: 'Hello' }],
      },
    ],
  },
  questions: [{ id: 'q1', correct_answer: 'Hello', explanation: 'private' }],
};

describe('unfinished objective snapshots', () => {
  it('keeps the audioscript in practice Listening but not its answer evidence', () => {
    const safe = unfinishedSnapshot(listening, 'practice');
    expect(safe.testData.content[0].srt_content).toContain('Hello.');
    expect(safe.testData.content[0].transcript).toBe('Hello.');
    expect(safe.testData.transcript).toBe('Full audioscript');
    expect(safe.testData.content[0]).not.toHaveProperty('transcript_highlights');
    expect(safe.questions[0]).toEqual({ id: 'q1' });
  });

  it('keeps the audioscript back in a timed exam', () => {
    const safe = unfinishedSnapshot(listening, 'mock');
    expect(safe.testData.content[0]).not.toHaveProperty('srt_content');
    expect(safe.testData.content[0]).not.toHaveProperty('transcript');
    expect(safe.testData).not.toHaveProperty('transcript');
  });

  it('keeps it back when the mode is unknown', () => {
    expect(unfinishedSnapshot(listening, undefined).testData.content[0]).not.toHaveProperty(
      'srt_content'
    );
  });

  it('never keeps transcripts for Reading', () => {
    const reading = { testData: { test_type: 'reading', content: [{ transcript: 'x' }] } };
    expect(unfinishedSnapshot(reading, 'practice').testData.content[0]).toEqual({});
  });
});
