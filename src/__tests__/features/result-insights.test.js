import { describe, expect, it } from 'vitest';
import {
  deriveBehaviour,
  deriveMarkLoss,
  deriveSectionFlow,
  confidenceReading,
  indecisionReading,
  paceTone,
  sectionNoun,
} from '@/components/results/test-results-modal/resultInsights';
import { deriveResultStats } from '@/components/results/test-results-modal/resultStats';

/**
 * A reading paper where the losses are deliberately lopsided: every Note
 * Completion mistake sits in Passage 1, so the cross-tab has something real to
 * find that neither a type-only nor a section-only view could surface.
 */
const readingResult = {
  bandScore: 5.5,
  correctAnswers: 7,
  totalQuestions: 10,
  unanswered: 1,
  typeStats: {
    note_completion: { correct: 3, total: 6 },
    multiple_choice: { correct: 4, total: 4 },
  },
  sectionStats: [
    { correct: 3, total: 5 },
    { correct: 4, total: 5 },
  ],
  passageTimes: { 0: 1500, 1: 1020 },
  answerChangeCounts: { q1: 2, q3: 1, 'correct-0': 1 },
  errorPatterns: {
    confidenceIndex: 72,
    indecisionScore: 33,
    nearMissCount: 2,
    unansweredCount: 1,
  },
  responseDetails: [
    {
      questionId: 'q1',
      questionNumber: 1,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: 'enviroment',
      correctAnswer: 'environment',
      isCorrect: false,
      wasFlagged: true,
    },
    {
      questionId: 'q2',
      questionNumber: 2,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: '',
      correctAnswer: 'river',
      isCorrect: null,
      wasFlagged: false,
    },
    {
      questionId: 'q3',
      questionNumber: 3,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: 'hill',
      correctAnswer: 'mountain',
      isCorrect: false,
      wasFlagged: true,
    },
    ...Array.from({ length: 7 }, (_, index) => ({
      questionId: `correct-${index}`,
      questionNumber: index + 4,
      type: index < 3 ? 'note_completion' : 'multiple_choice',
      sectionIndex: index < 2 ? 0 : 1,
      userAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      wasFlagged: false,
    })),
  ],
};

describe('result insights — mark attribution', () => {
  it('ranks question types by marks lost rather than by percentage', () => {
    const loss = deriveMarkLoss(readingResult, 'reading');

    // Note Completion cost 3 marks at 50%; Multiple Choice cost nothing at 100%.
    // The old overview card sorted on accuracy alone, which could float a
    // two-mark type above one that cost far more.
    expect(loss.types.map((entry) => entry.type)).toEqual(['note_completion', 'multiple_choice']);
    expect(loss.types[0]).toMatchObject({ total: 6, correct: 3, lost: 3, accuracy: 50 });
    expect(loss.types[1]).toMatchObject({ total: 4, correct: 4, lost: 0, accuracy: 100 });
  });

  it('agrees with the authoritative aggregate on how many marks were lost', () => {
    const loss = deriveMarkLoss(readingResult, 'reading');
    const stats = deriveResultStats(readingResult);

    expect(loss.totalLost).toBe(3);
    expect(loss.totalLost).toBe(stats.total - stats.correct);
  });

  it('cross-tabulates each type against the section its marks were lost in', () => {
    const loss = deriveMarkLoss(readingResult, 'reading');
    const notes = loss.types.find((entry) => entry.type === 'note_completion');

    expect(loss.hasSectionAttribution).toBe(true);
    // All three Note Completion losses were in Passage 1.
    expect(notes.bySection).toEqual([3, 0]);
    expect(notes.worstSection).toBe(0);
    // A type that lost nothing must not be pointed at a section.
    expect(loss.types.find((entry) => entry.type === 'multiple_choice').worstSection).toBeNull();
  });

  it('refuses section attribution when per-question records do not cover the paper', () => {
    const partial = {
      ...readingResult,
      responseDetails: readingResult.responseDetails.slice(0, 3),
    };
    expect(deriveMarkLoss(partial, 'reading').hasSectionAttribution).toBe(false);
  });

  it('labels sections by module', () => {
    expect(deriveMarkLoss(readingResult, 'reading').sections[0].label).toBe('Passage 1');
    expect(deriveMarkLoss(readingResult, 'listening').sections[0].label).toBe('Part 1');
    expect(sectionNoun('listening')).toBe('Part');
  });
});

describe('result insights — how the paper unfolded', () => {
  it('measures reading pace against the 20-minute passage budget', () => {
    const flow = deriveSectionFlow(readingResult, 'reading');

    expect(flow.hasTiming).toBe(true);
    expect(flow.sections[0].seconds).toBe(1500);
    expect(flow.sections[0].overBudgetSeconds).toBe(300); // 25m against a 20m budget
    expect(flow.sections[1].overBudgetSeconds).toBe(-180); // 17m — 3m spare
    // Five minutes over is still recoverable inside the hour, so it warns.
    // Past that the overrun starts eating another passage's budget.
    expect(paceTone(flow.sections[0].overBudgetSeconds)).toBe('warn');
    expect(paceTone(flow.sections[1].overBudgetSeconds)).toBe('ok');
    expect(paceTone(301)).toBe('fault');
    expect(paceTone(null)).toBe('neutral');
    expect(flow.slowest.index).toBe(0);
  });

  it('never invents timing for listening, which is paced by the audio', () => {
    const flow = deriveSectionFlow({ ...readingResult }, 'listening');
    expect(flow.hasTiming).toBe(false);
    expect(flow.sections.every((section) => section.seconds === null)).toBe(true);
  });

  it('reports the drop-off from the strongest section to the last one', () => {
    const flow = deriveSectionFlow(readingResult, 'reading');
    // Passage 1 = 60%, Passage 2 = 80%. Best is the last, so no fatigue.
    expect(flow.dropOff.best.accuracy).toBe(80);
    expect(flow.dropOff.weakest.accuracy).toBe(60);
    expect(flow.dropOff.fatigue).toBe(0);
    expect(flow.dropOff.firstToLast).toBe(20);
  });

  it('measures fatigue as the fall from the best section to the final one', () => {
    const fading = deriveSectionFlow(
      {
        sectionStats: [
          { correct: 9, total: 10 },
          { correct: 7, total: 10 },
          { correct: 4, total: 10 },
        ],
      },
      'reading'
    );

    expect(fading.dropOff.fatigue).toBe(50); // 90% best → 40% last
    expect(fading.dropOff.firstToLast).toBe(-50);
  });
});

describe('result insights — how the learner worked', () => {
  it('surfaces the answer-change and flag signals the result already stored', () => {
    const behaviour = deriveBehaviour(readingResult, {
      nearMiss: 1,
      changedWrong: 1,
      skipped: 1,
      otherWrong: 1,
      total: 4,
    });

    expect(behaviour.available).toBe(true);
    expect(behaviour.confidence).toBe(72);
    expect(behaviour.indecision).toBe(33);
    expect(behaviour.questionsChanged).toBe(3);
    expect(behaviour.totalChanges).toBe(4);
    // q1 and q3 were changed and still ended up wrong; 'correct-0' was changed
    // and ended up right.
    expect(behaviour.changedAndLost).toBe(2);
    expect(behaviour.flaggedCount).toBe(2);
    expect(behaviour.flaggedLost).toBe(2);
  });

  it('prefers the strict free-text near-miss count over the looser stored one', () => {
    const strict = deriveBehaviour(readingResult, { nearMiss: 1, skipped: 1 });
    expect(strict.nearMiss).toBe(1);
    expect(strict.nearMissStrict).toBe(true);

    // Without buckets it falls back to the stored count rather than showing nothing.
    const fallback = deriveBehaviour(readingResult, null);
    expect(fallback.nearMiss).toBe(2);
    expect(fallback.nearMissStrict).toBe(false);
  });

  it('reports "not recorded" rather than a confident zero on older results', () => {
    expect(deriveBehaviour({ totalQuestions: 10 }, null).available).toBe(false);

    // A result that predates flag capture leaves wasFlagged null throughout.
    const noFlags = deriveBehaviour(
      {
        answerChangeCounts: { a: 1 },
        responseDetails: [{ questionId: 'a', isCorrect: false, wasFlagged: null }],
      },
      null
    );
    expect(noFlags.available).toBe(true);
    expect(noFlags.hasFlagData).toBe(false);
    expect(noFlags.flaggedCount).toBeNull();
  });

  it('reads the confidence and indecision heuristics in plain language', () => {
    expect(confidenceReading(92).tone).toBe('ok');
    expect(confidenceReading(72).tone).toBe('warn');
    expect(confidenceReading(30).tone).toBe('fault');
    expect(confidenceReading(undefined)).toBeNull();

    expect(indecisionReading(0).tone).toBe('ok');
    expect(indecisionReading(85).tone).toBe('fault');
  });
});
