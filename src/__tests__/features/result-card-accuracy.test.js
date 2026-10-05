import { describe, expect, it } from 'vitest';

import { calculateListeningTestResults } from '@/features/testing/listening/components/ListeningTest/utils/scoreCalculator';
import { computeQuestionNumbers } from '@/features/testing/listening/components/ListeningTest/utils/questionProcessing';
import { calculateTestResults } from '@/features/testing/reading/components/ReadingTest/utils/scoreCalculator';
import { percentOf } from '@/features/testing/shared/utils/resultEvidence';
import { normalizeTestResults } from '@/components/results/test-results-modal/normalizeTestResults';
import { deriveResultStats } from '@/components/results/test-results-modal/resultStats';
import { deriveMarkLoss } from '@/components/results/test-results-modal/resultInsights';
import { calculateErrorPatterns } from '@/services/testMetricsService';

const GAP_ID = '11111111-1111-4111-8111-111111111111';
const MATCH_ID = '22222222-2222-4222-8222-222222222222';
const MCQ_ID = '33333333-3333-4333-8333-333333333333';
const PART_TWO_ID = '44444444-4444-4444-8444-444444444444';

const sum = (values) => values.reduce((total, value) => total + value, 0);
const typeCorrect = (result) => sum(Object.values(result.typeStats).map((stat) => stat.correct));
const sectionCorrect = (result) => sum(result.sectionStats.map((stat) => stat.correct));

function listeningPaper() {
  const questions = computeQuestionNumbers([
    {
      id: GAP_ID,
      type: 'gap_fill',
      section: 1,
      question_number: 1,
      gap_fill: { text: 'One [gap] two [gap]', answers: { 0: 'river', 1: 'bridge' } },
    },
    {
      id: MATCH_ID,
      type: 'matching_features',
      section: 1,
      question_number: 3,
      // Sub-question ids in the library are not prefixed with the question id.
      matching_features: {
        questions: [
          { id: 'mq_3', answer: 'A', questionNumber: 3 },
          { id: 'q2', answer: 'B', questionNumber: 4 },
        ],
      },
    },
    {
      id: MCQ_ID,
      type: 'multiple_choice',
      section: 2,
      question_number: 5,
      allow_multiple: true,
      question_count: 2,
      correct_answer: '["A","C"]',
    },
    {
      id: PART_TWO_ID,
      type: 'multiple_choice',
      section: 2,
      question_number: 7,
      correct_answer: 'B',
    },
  ]);
  const sections = [
    { section_number: 1, title: 'Part 1' },
    { section_number: 2, title: 'Part 2' },
  ];
  return { questions, sections };
}

function gradeListening(answers) {
  const { questions, sections } = listeningPaper();
  return calculateListeningTestResults(questions, answers, sections);
}

/** The shape stored before matching-features items were attributed. */
function asLegacyListeningRecord(result) {
  const isMatching = (key) => key === 'mq_3' || key === 'q2';
  const matchingCorrect = ['mq_3', 'q2'].filter((key) => result.answersMap[key].isCorrect).length;
  return {
    ...result,
    correctAnswersMap: result.answersMap,
    answersMap: undefined,
    typeStats: {
      ...result.typeStats,
      matching_features: { ...result.typeStats.matching_features, correct: 0 },
    },
    sectionStats: result.sectionStats.map((stat, index) =>
      index === 0 ? { ...stat, correct: stat.correct - matchingCorrect } : stat
    ),
    responseDetails: result.responseDetails.filter((detail) => !isMatching(detail.questionId)),
  };
}

describe('listening result breakdowns', () => {
  const answers = {
    [`${GAP_ID}_0`]: 'river',
    [`${GAP_ID}_1`]: 'tunnel',
    mq_3: 'A',
    q2: 'B',
    [MCQ_ID]: ['C', 'D'],
    [PART_TWO_ID]: 'B',
  };

  it('attributes matching-features items to their type, part and per-question record', () => {
    const result = gradeListening(answers);

    expect(result.correctAnswers).toBe(5);
    expect(result.totalQuestions).toBe(7);
    expect(result.typeStats.matching_features).toEqual({ correct: 2, total: 2 });
    expect(typeCorrect(result)).toBe(result.correctAnswers);
    expect(sectionCorrect(result)).toBe(result.correctAnswers);
    expect(result.sectionStats.map((stat) => [stat.correct, stat.total])).toEqual([
      [3, 4],
      [2, 3],
    ]);
    expect(result.responseDetails).toHaveLength(result.totalQuestions);
    expect(result.responseDetails.find((detail) => detail.questionId === 'q2')).toMatchObject({
      type: 'matching_features',
      sectionIndex: 0,
      isCorrect: true,
    });
  });

  it('shows each choose-two row with a distinct pick and never hides a wrong one', () => {
    const rows = (picks) => {
      const map = gradeListening({ [MCQ_ID]: picks }).answersMap;
      return [0, 1].map((index) => [
        map[`${MCQ_ID}_option_${index}`].userAnswer,
        map[`${MCQ_ID}_option_${index}`].isCorrect,
      ]);
    };

    expect(rows(['C', 'D'])).toEqual([
      ['D', false],
      ['C', true],
    ]);
    expect(rows(['C'])).toEqual([
      ['(not selected)', false],
      ['C', true],
    ]);
    expect(rows(['A', 'C'])).toEqual([
      ['A', true],
      ['C', true],
    ]);
  });

  it('repairs a stored result that dropped matching-features items, exactly', () => {
    const fresh = gradeListening(answers);
    const repaired = normalizeTestResults(asLegacyListeningRecord(fresh), 'listening');

    expect(repaired.typeStats.matching_features.correct).toBe(2);
    expect(repaired.sectionStats.map((stat) => stat.correct)).toEqual(
      fresh.sectionStats.map((stat) => stat.correct)
    );
    expect(repaired.responseDetails).toHaveLength(fresh.totalQuestions);
    expect(deriveMarkLoss(repaired, 'listening').totalLost).toBe(
      repaired.totalQuestions - repaired.correctAnswers
    );
    // Applying the repair twice changes nothing.
    expect(normalizeTestResults(repaired, 'listening').typeStats).toEqual(repaired.typeStats);
  });

  it('repairs a stored result without per-question records using part ranges', () => {
    const fresh = gradeListening(answers);
    const legacy = { ...asLegacyListeningRecord(fresh), responseDetails: undefined };
    const repaired = normalizeTestResults(legacy, 'listening');

    expect(repaired.typeStats.matching_features.correct).toBe(2);
    expect(sectionCorrect(repaired)).toBe(repaired.correctAnswers);
    expect(repaired.responseDetails).toBeUndefined();
  });

  it('leaves a stored result alone when the gap does not match exactly', () => {
    const fresh = gradeListening(answers);
    const legacy = { ...asLegacyListeningRecord(fresh), correctAnswers: fresh.correctAnswers + 1 };
    const normalized = normalizeTestResults(legacy, 'listening');

    expect(normalized.typeStats.matching_features.correct).toBe(0);
    expect(normalized.responseDetails).toHaveLength(legacy.responseDetails.length);
  });

  it('does not touch a freshly graded result', () => {
    const fresh = gradeListening(answers);
    const normalized = normalizeTestResults(fresh, 'listening');

    expect(normalized.typeStats).toEqual(
      Object.fromEntries(
        Object.entries(fresh.typeStats).map(([type, stat]) => [
          type,
          { ...stat, percentage: percentOf(stat.correct, stat.total) },
        ])
      )
    );
    expect(normalized.responseDetails).toBe(fresh.responseDetails);
  });
});

describe('result card answer map', () => {
  const readingRecord = (entries, extra = {}) => ({
    totalQuestions: entries.length,
    correctAnswers: entries.filter((entry) => entry.isCorrect === true).length,
    correctAnswersMap: Object.fromEntries(
      entries.map((entry, index) => [`q_${index}`, { questionNumber: index + 1, ...entry }])
    ),
    ...extra,
  });

  it('counts blank reading answers (isCorrect null or empty) as skipped', () => {
    const stats = deriveResultStats(
      readingRecord([
        { userAnswer: 'river', isCorrect: true },
        { userAnswer: 'lake', isCorrect: false },
        { userAnswer: '', isCorrect: null },
        { userAnswer: '', isCorrect: '' },
      ])
    );

    expect(stats.isComplete).toBe(true);
    expect([stats.correct, stats.wrong, stats.skipped]).toEqual([1, 1, 2]);
  });

  it('combines several records that share one question number', () => {
    const stats = deriveResultStats({
      totalQuestions: 2,
      correctAnswers: 0,
      correctAnswersMap: {
        a: { questionNumber: 1, userAnswer: 'x', isCorrect: true },
        b: { questionNumber: 1, userAnswer: '', isCorrect: null },
        c: { questionNumber: 2, userAnswer: '', isCorrect: null },
        d: { questionNumber: 2, userAnswer: '', isCorrect: null },
      },
    });

    expect(stats.questions.map((question) => question.status)).toEqual(['wrong', 'skipped']);
    expect([stats.correct, stats.wrong, stats.skipped]).toEqual([0, 1, 1]);
  });

  it('falls back to the aggregate when the grid disagrees with the score', () => {
    const stats = deriveResultStats(
      readingRecord(
        [
          { userAnswer: 'a', isCorrect: false },
          { userAnswer: '', isCorrect: null },
        ],
        { correctAnswers: 1, unanswered: 1 }
      )
    );

    expect(stats.isComplete).toBe(false);
    expect(stats.correct + stats.wrong + stats.skipped).toBe(stats.total);
  });
});

describe('reading scoring details', () => {
  it('counts a choose-two question as two answered or unanswered questions', () => {
    const questions = [
      {
        id: MCQ_ID,
        type: 'multiple_choice',
        section: 1,
        question_number: 1,
        question_count: 2,
        allow_multiple: true,
        correct_answer: 'A, C',
      },
      {
        id: GAP_ID,
        type: 'true_false_not_given',
        section: 1,
        question_number: 3,
        correct_answer: 'TRUE',
      },
    ];
    const unanswered = (answers) => {
      const result = calculateTestResults(questions, answers, []);
      expect(result.totalQuestions).toBe(3);
      return calculateErrorPatterns(
        answers,
        result.correctAnswersMap,
        result.totalQuestions,
        result.typeStats
      ).unansweredCount;
    };

    expect(unanswered({ [MCQ_ID]: ['A', 'C'], [GAP_ID]: 'TRUE' })).toBe(0);
    expect(unanswered({ [MCQ_ID]: ['A'], [GAP_ID]: 'TRUE' })).toBe(1);
    expect(unanswered({})).toBe(3);
  });

  it('marks a two-blank sentence wrong per question when only one blank is right', () => {
    const question = {
      id: GAP_ID,
      type: 'sentence_completion',
      question_number: 4,
      question_text: 'The _____ crossed the _____.',
      correct_answers: ['farmer', 'river'],
    };
    const result = calculateTestResults([question], {
      [`${GAP_ID}_blank_1`]: 'farmer',
      [`${GAP_ID}_blank_2`]: 'road',
    });

    expect(result.correctAnswers).toBe(0);
    expect(result.userResponses).toHaveLength(1);
    expect(result.userResponses[0].isCorrect).toBe(false);
  });

  it('never awards a blank answer against a missing key', () => {
    const question = {
      id: MATCH_ID,
      type: 'matching_headings',
      question_number: 1,
      matching_data: { paragraphs: [{ label: 'A', correct_heading: '' }] },
    };
    expect(calculateTestResults([question], {}).correctAnswers).toBe(0);
  });
});

describe('percentages', () => {
  it('rounds exact halves up', () => {
    expect(percentOf(23, 40)).toBe(58);
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(5, 0)).toBe(0);
    expect(
      normalizeTestResults({ correctAnswers: 23, totalQuestions: 40 }, 'reading').percentage
    ).toBe(58);
  });
});
