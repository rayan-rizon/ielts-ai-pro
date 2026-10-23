import { describe, expect, it } from 'vitest';

import {
  buildSourceDigest,
  buildSourcePreview,
  shrinkSourceDigest,
  sourceNeedsQuestionRows,
} from '../../../supabase/functions/_shared/coachSourceDigest';
import { buildLearnerEvidence } from '../../../supabase/functions/_shared/learnerEvidence';
import { estimateCoachInputTokens } from '../../../supabase/functions/_shared/aiCoach';

const readingSession = {
  id: 'c1f2a3b4-0000-4000-8000-000000000001',
  test_type: 'reading',
  test_mode: 'practice',
  score: 6.5,
  is_completed: true,
  actual_duration_seconds: 2_700,
  content_data: {
    totalQuestions: 6,
    correctAnswers: 3,
    changedAnswersCount: 2,
    typeStats: {
      true_false_not_given: { correct: 0, total: 3 },
      multiple_choice: { correct: 2, total: 2 },
      sentence_completion: { correct: 1, total: 1 },
    },
    responseDetails: [
      {
        questionNumber: 1,
        type: 'multiple_choice',
        userAnswer: 'B',
        correctAnswer: 'B',
        isCorrect: true,
      },
      {
        questionNumber: 2,
        type: 'multiple_choice',
        userAnswer: 'C',
        correctAnswer: 'C',
        isCorrect: true,
      },
      {
        questionNumber: 3,
        type: 'true_false_not_given',
        userAnswer: 'TRUE',
        correctAnswer: 'NOT GIVEN',
        isCorrect: false,
        wasFlagged: true,
      },
      {
        questionNumber: 4,
        type: 'true_false_not_given',
        userAnswer: null,
        correctAnswer: 'FALSE',
        isCorrect: false,
      },
      {
        questionNumber: 5,
        type: 'true_false_not_given',
        userAnswer: 'FALSE',
        correctAnswer: 'TRUE',
        isCorrect: false,
      },
      {
        questionNumber: 6,
        type: 'sentence_completion',
        userAnswer: 'rivers',
        correctAnswer: 'rivers',
        isCorrect: true,
      },
    ],
    // Large noise the old 3,000-character slice used to spend its budget on.
    passageTimes: Array.from({ length: 200 }, (_, index) => ({ index, seconds: 12 })),
  },
};

const questionRows = [
  {
    question_number: 3,
    question_count: 3,
    question_text: 'Do the following statements agree with the passage?',
    type: 'true_false_not_given',
    options: null,
    explanation_data: {
      blanks: {
        '3': {
          why_correct: 'The passage never states who funded the study, so it is NOT GIVEN.',
          trap: 'Assuming the university funded it.',
          passage_highlight: 'The study was carried out at the university.',
          tempting_answer: 'TRUE',
        },
        '5': { why_correct: 'The writer says the opposite in paragraph D.' },
      },
    },
  },
];

describe('objective source digest', () => {
  const digest: any = buildSourceDigest({ session: readingSession, questions: questionRows });

  it('summarises the result and ranks the weakest question types first', () => {
    expect(digest).toMatchObject({
      kind: 'objective',
      module: 'reading',
      band: 6.5,
      correct: 3,
      total: 6,
      unanswered: 1,
      minutesSpent: 45,
      changedAnswers: 2,
      missesTotal: 3,
    });
    expect(digest.weakestTypes[0]).toEqual({ type: 'true_false_not_given', correct: 0, total: 3 });
  });

  it('lists each miss with the answers and the reviewed explanation', () => {
    const q3 = digest.misses.find((item: any) => item.number === 3);
    expect(q3).toMatchObject({
      type: 'true_false_not_given',
      yourAnswer: 'TRUE',
      correctAnswer: 'NOT GIVEN',
      flagged: true,
      whyCorrect: expect.stringContaining('NOT GIVEN'),
      trap: 'Assuming the university funded it.',
      temptingAnswer: 'TRUE',
    });
    const q4 = digest.misses.find((item: any) => item.number === 4);
    expect(q4.yourAnswer).toBeNull();
    const q5 = digest.misses.find((item: any) => item.number === 5);
    expect(q5.whyCorrect).toContain('paragraph D');
  });

  it('is far smaller than the raw JSON slice it replaces', () => {
    const tokens = estimateCoachInputTokens(JSON.stringify(digest));
    expect(tokens).toBeLessThan(900);
    expect(JSON.stringify(digest)).not.toContain('passageTimes');
  });

  it('puts a requested question first with more detail and fewer other misses', () => {
    const focused: any = buildSourceDigest({
      session: readingSession,
      questions: questionRows,
      focusQuestion: 5,
    });
    expect(focused.focusQuestion).toMatchObject({
      number: 5,
      yourAnswer: 'FALSE',
      correctAnswer: 'TRUE',
    });
    expect(focused.misses.some((item: any) => item.number === 5)).toBe(false);
  });

  it('explains a question the learner got right when they ask about it', () => {
    const focused: any = buildSourceDigest({
      session: readingSession,
      questions: [],
      focusQuestion: 1,
    });
    expect(focused.focusQuestion).toMatchObject({ number: 1, yourAnswer: 'B', correctAnswer: 'B' });
  });

  it('says so when the requested question is not on record', () => {
    const focused: any = buildSourceDigest({
      session: readingSession,
      questions: [],
      focusQuestion: 40,
    });
    expect(focused.focusQuestion).toBeUndefined();
    expect(focused.focusQuestionNote).toContain('Question 40');
  });

  it('still works without the answer key rows', () => {
    const bare: any = buildSourceDigest({ session: readingSession, questions: [] });
    expect(bare.misses).toHaveLength(3);
    expect(bare.misses[0].whyCorrect).toBeUndefined();
  });

  it('caps the number of misses and strips markup from stored text', () => {
    const many = {
      ...readingSession,
      content_data: {
        ...readingSession.content_data,
        responseDetails: Array.from({ length: 30 }, (_, index) => ({
          questionNumber: index + 1,
          type: 'gap_fill',
          userAnswer: '<b>wrong</b>',
          correctAnswer: 'right',
          isCorrect: false,
        })),
      },
    };
    const capped: any = buildSourceDigest({ session: many, questions: [] });
    expect(capped.misses).toHaveLength(8);
    expect(capped.missesTotal).toBe(30);
    expect(capped.misses[0].yourAnswer).toBe('wrong');
  });

  it('does not call an older result mistake-free when no per-question detail was saved', () => {
    const legacy: any = buildSourceDigest({
      session: {
        test_type: 'reading',
        test_mode: 'mock',
        score: 4.5,
        // Older saves kept only raw answers keyed by question id.
        content_data: { time_remaining: 120, highlights: [] },
        user_responses: { 'f0f0f0f0-0000-4000-8000-000000000001': 'C. something' },
      },
    });
    expect(legacy).toMatchObject({
      band: 4.5,
      detailAvailable: false,
      correct: null,
      total: null,
      missesTotal: null,
      misses: [],
    });
    expect(legacy.note).toContain('not saved');
    const preview = buildSourcePreview(legacy)!;
    expect(preview.facts).toEqual([{ label: 'Band', value: '4.5' }]);
    expect(preview.suggestions).toEqual([]);
  });

  it('uses saved totals when only the per-question detail is missing', () => {
    const partial: any = buildSourceDigest({
      session: { ...readingSession, content_data: { totalQuestions: 40, correctAnswers: 30 } },
    });
    expect(partial).toMatchObject({
      correct: 30,
      total: 40,
      detailAvailable: false,
      missesTotal: null,
    });
  });

  it('knows which modules need the answer key', () => {
    expect(sourceNeedsQuestionRows({ test_type: 'Reading' })).toBe(true);
    expect(sourceNeedsQuestionRows({ test_type: 'listening' })).toBe(true);
    expect(sourceNeedsQuestionRows({ test_type: 'writing' })).toBe(false);
  });
});

describe('writing and speaking digests', () => {
  const writing = {
    id: 'w1',
    test_type: 'writing',
    test_mode: 'practice',
    score: 6,
    user_responses: [{ task2_response: 'Some people believe ... '.repeat(200) }],
    content_data: {
      ai_feedbacks: {
        'Task 2': {
          overallBand: 6,
          criteriaScores: {
            TaskResponse: 6,
            CoherenceAndCohesion: 6,
            LexicalResource: 6.5,
            GrammaticalRangeAndAccuracy: 5.5,
          },
          criterionNotes: { TaskResponse: 'Both views covered but the opinion is unclear.' },
          strengths: ['Clear paragraphing'],
          priorities: [
            {
              criterion: 'GrammaticalRangeAndAccuracy',
              issue: 'Tense slips',
              action: 'Check verb tense in each clause.',
            },
          ],
          corrections: [
            { original: 'He go', correction: 'He goes', explanation: 'Subject-verb agreement' },
          ],
        },
      },
    },
  };

  it('keeps the feedback and a trimmed copy of the learner’s answer', () => {
    const digest: any = buildSourceDigest({ session: writing });
    expect(digest.kind).toBe('writing');
    expect(digest.tasks).toHaveLength(1);
    expect(digest.tasks[0]).toMatchObject({
      task: 'Task 2',
      band: 6,
      strengths: ['Clear paragraphing'],
    });
    expect(digest.tasks[0].learnerResponse.length).toBeLessThanOrEqual(1_100);
    expect(digest.tasks[0].corrections[0]).toMatchObject({
      original: 'He go',
      correction: 'He goes',
    });
  });

  it('digests a speaking evaluation', () => {
    const digest: any = buildSourceDigest({
      session: {
        test_type: 'speaking',
        score: 6.5,
        content_data: {
          finalEvaluation: {
            fluency: 6,
            lexical: 7,
            grammar: 6.5,
            pronunciation: null,
            criterionNotes: { fluency: 'Frequent pauses before abstract answers.' },
            partScores: { part1: { band: 7, keyObservation: 'Natural.' } },
            strengths: ['Good range'],
            improvements: [{ area: 'Fluency', tip: 'Use fillers to buy time.' }],
          },
        },
      },
    });
    expect(digest.criteria).toEqual({ fluency: 6, lexical: 7, grammar: 6.5, pronunciation: null });
    expect(digest.improvements[0].area).toBe('Fluency');
  });

  it('returns null for an unknown module or no session', () => {
    expect(buildSourceDigest({ session: { test_type: 'grammar' } })).toBeNull();
    expect(buildSourceDigest({ session: null })).toBeNull();
  });
});

describe('digest shrinking and preview', () => {
  const digest: any = buildSourceDigest({ session: readingSession, questions: questionRows });

  it('shrinks in two steps without mutating the original', () => {
    const once = shrinkSourceDigest(digest, 1);
    const twice = shrinkSourceDigest(digest, 2);
    expect(once.misses).toHaveLength(3);
    expect(twice.misses).toHaveLength(0);
    expect(digest.misses.length).toBeGreaterThan(0);
    expect(shrinkSourceDigest(null, 1)).toBeNull();
  });

  it('builds a deterministic preview with a suggestion for a real miss', () => {
    const preview = buildSourcePreview(digest)!;
    expect(preview.title).toBe('Reading result');
    expect(preview.facts).toEqual(
      expect.arrayContaining([
        { label: 'Band', value: '6.5' },
        { label: 'Correct', value: '3/6' },
        { label: 'Weakest type', value: 'true false not given 0/3' },
      ])
    );
    expect(preview.suggestions[0]).toEqual({
      message: 'Why was my answer to question 3 wrong?',
      questionNumber: 3,
    });
    expect(preview.suggestions.length).toBeLessThanOrEqual(3);
    expect(buildSourcePreview(null)).toBeNull();
  });
});

describe('learner evidence with a digest', () => {
  it('carries the digest on the source instead of a raw slice', () => {
    const digest = buildSourceDigest({ session: readingSession, questions: questionRows });
    const context = buildLearnerEvidence({
      profile: { subscription_tier: 'free' },
      sessions: [],
      skills: [],
      grammarAttempts: [],
      vocabularyItems: [],
      vocabularyReviews: [],
      activities: [],
      sourceSession: readingSession,
      sourceDigest: digest,
    });
    expect(context.source?.digest).toBe(digest);
    expect((context.source as any).excerpt).toBeUndefined();
  });

  it('adds chat drills as a tentative signal only when the learner has done some', () => {
    const base = {
      profile: { subscription_tier: 'free' },
      sessions: [],
      skills: [],
      grammarAttempts: [],
      vocabularyItems: [],
      vocabularyReviews: [],
      activities: [],
    };
    const none = buildLearnerEvidence({ ...base, coachPractice: { total: 0, correct: 0 } });
    expect(none.evidence.find((item: any) => item.id === 'coach:practice')).toBeUndefined();
    const some = buildLearnerEvidence({
      ...base,
      coachPractice: { total: 4, correct: 3, missedPrompts: ['Choose the correct article.'] },
    });
    expect(some.evidence.find((item: any) => item.id === 'coach:practice')).toMatchObject({
      category: 'coach_practice',
      confidence: 'tentative',
      value: { correct: 3, total: 4, missedPrompts: ['Choose the correct article.'] },
    });
  });
});
