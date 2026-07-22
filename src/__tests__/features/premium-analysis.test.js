import { describe, expect, it } from 'vitest';
import {
  buildPremiumAnalysis,
  classifyTypeTrend,
  getTargetPlanner,
  isPossibleNearMiss,
} from '@/components/results/test-results-modal/premiumAnalysis';

const baseResult = {
  bandScore: 5,
  correctAnswers: 15,
  totalQuestions: 20,
  typeStats: {
    note_completion: { correct: 4, total: 8 },
    matching_features: { correct: 5, total: 7 },
    multiple_choice: { correct: 6, total: 5 },
  },
  sectionStats: [
    { correct: 8, total: 10 },
    { correct: 7, total: 10 },
  ],
  responseDetails: [
    {
      questionId: '1',
      questionNumber: 1,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: 'enviroment',
      correctAnswer: 'environment',
      isCorrect: false,
    },
    {
      questionId: '2',
      questionNumber: 2,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: 'forest',
      correctAnswer: 'trees',
      isCorrect: false,
    },
    {
      questionId: '3',
      questionNumber: 3,
      type: 'matching_features',
      sectionIndex: 1,
      userAnswer: '',
      correctAnswer: 'B',
      isCorrect: null,
    },
    {
      questionId: '4',
      questionNumber: 4,
      type: 'matching_features',
      sectionIndex: 1,
      userAnswer: 'A',
      correctAnswer: 'C',
      isCorrect: false,
    },
    {
      questionId: '5',
      questionNumber: 5,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: 'river',
      correctAnswer: 'river',
      isCorrect: true,
    },
  ],
  answerChangeCounts: { 2: 1 },
  passageTimes: { 0: 1100, 1: 1300 },
};

describe('premium result analysis', () => {
  it('keeps error buckets mutually exclusive and reconciled', () => {
    const analysis = buildPremiumAnalysis({ testResults: baseResult, testType: 'reading' });

    expect(analysis.errorBuckets).toMatchObject({
      nearMiss: 1,
      changedWrong: 1,
      skipped: 1,
      otherWrong: 1,
      total: 4,
    });
    expect(analysis.mistakeQueue.map((item) => item.questionNumber)).toEqual([1, 2, 3, 4]);
  });

  it('labels near misses as candidates without changing official scoring', () => {
    expect(isPossibleNearMiss('enviroment', 'environment')).toBe(true);
    expect(isPossibleNearMiss('forest', 'trees')).toBe(false);
  });

  it('uses module-specific thresholds and scales partial tests', () => {
    expect(getTargetPlanner(15, 20, 5, 6, 'reading')).toMatchObject({
      targetBand: 6,
      rawNeeded: 12,
      additionalCorrect: 0,
    });
    expect(getTargetPlanner(8, 20, 5, 5.5, 'listening')).toMatchObject({
      rawNeeded: 9,
      additionalCorrect: 1,
    });
  });

  it('requires enough historical evidence before calling a trend', () => {
    const entry = { type: 'note_completion', accuracy: 30 };
    expect(
      classifyTypeTrend(entry, [
        { content_data: { typeStats: { note_completion: { correct: 1, total: 4 } } } },
      ]).status
    ).toBe('limited');
    expect(
      classifyTypeTrend(entry, [
        { content_data: { typeStats: { note_completion: { correct: 2, total: 5 } } } },
        { content_data: { typeStats: { note_completion: { correct: 2, total: 5 } } } },
      ]).status
    ).toBe('recurring');
  });

  it('uses passage time only for Reading and part loss for Listening', () => {
    const reading = buildPremiumAnalysis({ testResults: baseResult, testType: 'reading' });
    const listening = buildPremiumAnalysis({ testResults: baseResult, testType: 'listening' });

    expect(reading.sectionStrategy[0]).toMatchObject({ seconds: 1100, paceDeltaSeconds: -100 });
    expect(listening.sectionStrategy[0]).toMatchObject({ seconds: null, paceDeltaSeconds: null });
  });

  it('creates a deterministic seven-day plan and honest legacy flags', () => {
    const analysis = buildPremiumAnalysis({
      testResults: { ...baseResult, responseDetails: undefined, correctAnswersMap: {} },
      testType: 'reading',
    });
    expect(analysis.plan).toHaveLength(7);
    expect(analysis.dataAvailability.hasResponseDetails).toBe(false);
    expect(analysis.dataAvailability.hasReliableBuckets).toBe(false);
  });

  it('handles all-skipped and perfect results without inventing recovery work', () => {
    const allSkipped = buildPremiumAnalysis({
      testResults: {
        bandScore: 0,
        correctAnswers: 0,
        totalQuestions: 4,
        typeStats: { note_completion: { correct: 0, total: 4 } },
        sectionStats: [{ correct: 0, total: 4 }],
        responseDetails: Array.from({ length: 4 }, (_, index) => ({
          questionId: String(index + 1),
          questionNumber: index + 1,
          type: 'note_completion',
          sectionIndex: 0,
          userAnswer: '',
          correctAnswer: 'answer',
          isCorrect: null,
        })),
      },
      testType: 'reading',
    });
    expect(allSkipped.errorBuckets).toMatchObject({ skipped: 4, total: 4 });
    expect(allSkipped.dataAvailability.hasReliableBuckets).toBe(true);

    const perfect = buildPremiumAnalysis({
      testResults: {
        bandScore: 9,
        correctAnswers: 40,
        totalQuestions: 40,
        typeStats: { multiple_choice: { correct: 40, total: 40 } },
        sectionStats: [{ correct: 40, total: 40 }],
        responseDetails: Array.from({ length: 40 }, (_, index) => ({
          questionId: String(index + 1),
          questionNumber: index + 1,
          type: 'multiple_choice',
          sectionIndex: 0,
          userAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
        })),
      },
      testType: 'listening',
    });
    expect(perfect.errorBuckets.total).toBe(0);
    expect(perfect.mistakeQueue).toHaveLength(0);
    expect(perfect.target).toMatchObject({ targetBand: 9, additionalCorrect: 0 });
  });

  it('keeps only the five most recent comparison sessions', () => {
    const sessions = Array.from({ length: 7 }, (_, index) => ({
      score: 4 + index * 0.5,
      completed_at: `2026-07-${String(20 - index).padStart(2, '0')}`,
      content_data: { typeStats: {} },
    }));
    const analysis = buildPremiumAnalysis({
      testResults: baseResult,
      testType: 'reading',
      recentSessions: sessions,
    });
    expect(analysis.history.scores).toHaveLength(5);
    expect(analysis.history.scores[0].score).toBe(4);
  });
});
