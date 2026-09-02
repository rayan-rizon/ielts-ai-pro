import { describe, expect, it } from 'vitest';
import { calculateTestResults } from '@/features/testing/reading/components/ReadingTest/utils/scoreCalculator';
import { calculateListeningTestResults } from '@/features/testing/listening/components/ListeningTest/utils/scoreCalculator';

describe('persistable result response details', () => {
  it('normalizes Reading question metadata with final scoring outcome', () => {
    const result = calculateTestResults(
      [
        {
          id: 'reading-q1',
          question_number: 1,
          type: 'multiple_choice',
          section: 1,
          correct_answer: 'B',
        },
      ],
      { 'reading-q1': 'A' },
      [{ id: 'passage-1', section_number: 1 }],
      new Set(['reading-q1'])
    );

    expect(result.responseDetails).toEqual([
      expect.objectContaining({
        questionId: 'reading-q1',
        questionNumber: 1,
        type: 'multiple_choice',
        questionType: 'multiple_choice',
        sectionIndex: 0,
        sectionOrPart: 1,
        userAnswer: 'A',
        correctAnswer: 'B',
        isCorrect: false,
        wasFlagged: true,
      }),
    ]);
  });

  it('normalizes Listening question metadata without timing claims', () => {
    const result = calculateListeningTestResults(
      [
        {
          id: 'listening-q1',
          type: 'multiple_choice',
          part_number: 1,
          _displayStartNumber: 1,
          _displaySize: 1,
          correct_answer: 'C',
        },
      ],
      { 'listening-q1': 'C' },
      [{ id: 'part-1', section_number: 1 }],
      new Set()
    );

    expect(result.responseDetails).toEqual([
      expect.objectContaining({
        questionId: 'listening-q1',
        questionNumber: '1',
        type: 'multiple_choice',
        questionType: 'multiple_choice',
        sectionIndex: 0,
        sectionOrPart: 1,
        userAnswer: 'C',
        correctAnswer: 'C',
        isCorrect: true,
        wasFlagged: false,
      }),
    ]);
  });

  it('marks review evidence unavailable for legacy scoring calls without flag state', () => {
    const result = calculateTestResults(
      [
        {
          id: 'legacy-q1',
          question_number: 1,
          type: 'multiple_choice',
          section: 1,
          correct_answer: 'A',
        },
      ],
      { 'legacy-q1': 'A' },
      [{ id: 'passage-1', section_number: 1 }]
    );

    expect(result.responseDetails[0].wasFlagged).toBeNull();
  });
});
