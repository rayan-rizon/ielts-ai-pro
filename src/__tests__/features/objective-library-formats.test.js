import { describe, expect, it } from 'vitest';
import { scoreQuestion } from '../../../supabase/functions/_shared/objective-scoring/reading.js';

describe('existing library answer formats', () => {
  it('scores slash-separated letters as two distinct MCQ answers', () => {
    const q = {
      id: 'q',
      type: 'multiple_choice',
      question_number: 21,
      question_count: 2,
      allow_multiple: true,
      correct_answer: 'B/C',
    };
    expect(scoreQuestion(q, { q: ['C', 'B'] })).toMatchObject({ correct: 2, total: 2 });
    expect(scoreQuestion(q, { q: ['B', 'B'] })).toMatchObject({ correct: 1, total: 2 });
  });
  it('uses stored comma-separated parts for two blanks in one numbered answer', () => {
    const q = {
      id: 'q',
      type: 'short_answer',
      question_number: 23,
      question_count: 1,
      question_text: 'They brought _____ and _____.',
      correct_answer: 'paper,pencils',
    };
    expect(scoreQuestion(q, { q_blank_1: 'paper', q_blank_2: 'pencils' })).toMatchObject({
      correct: 1,
      total: 1,
    });
    expect(scoreQuestion(q, { q_blank_1: 'paper', q_blank_2: 'wrong' })).toMatchObject({
      correct: 0,
      total: 1,
    });
  });
});
