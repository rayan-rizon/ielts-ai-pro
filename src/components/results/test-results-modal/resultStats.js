/**
 * Single source of truth for every number the results modal renders.
 *
 * Before this, the hero card computed `mistakes = total - correct - unanswered`
 * from the aggregate, while the answer-key grid independently classified each
 * question and counted its own totals — and its fallback for a question with no
 * response record was `'wrong'`. The two could (and did) disagree on screen:
 * the hero could say "8 mistakes" while the filter tab said "Incorrect (11)".
 * Everything now derives from one pass so the modal can only tell one story.
 */

import { percentOf } from '@/features/testing/shared/utils/resultEvidence';

export const STATUS = {
  correct: 'correct',
  wrong: 'wrong',
  skipped: 'skipped',
  unknown: 'unknown',
};

const isBlankAnswer = (answer) =>
  answer == null ||
  answer === '' ||
  answer === '(not selected)' ||
  (Array.isArray(answer) && answer.length === 0) ||
  (typeof answer === 'string' && answer.trim() === '');

function statusFromResponse(resp) {
  if (!resp) return null;
  if (resp.isCorrect === true) return STATUS.correct;
  // A blank answer that did not score is a skip whatever the grader stored
  // alongside it: reading writes `isCorrect: null` for "not attempted", and
  // older multi-select records wrote `''`. Treating those as unknown left the
  // grid incomplete for most reading papers and pushed counts onto a fallback.
  if (isBlankAnswer(resp.userAnswer)) return STATUS.skipped;
  if (resp.isCorrect === false) return resp.isSkipped ? STATUS.skipped : STATUS.wrong;
  return null;
}

/**
 * Several records can share one question number (each input of a grouped
 * table gap, each blank of a two-blank sentence). The question only earned its
 * mark when every part did, and was only skipped when every part was blank.
 */
function combineStatuses(statuses) {
  if (statuses.every((status) => status === STATUS.correct)) return STATUS.correct;
  if (statuses.every((status) => status === STATUS.skipped)) return STATUS.skipped;
  return STATUS.wrong;
}

/**
 * Builds a questionNumber -> status lookup from whichever per-question source
 * the test type provides. Reading groups answers under `correctAnswersMap`,
 * listening keeps them in `answersMap`; both expose the same fields.
 */
function buildStatusLookup(testResults) {
  const byQuestion = new Map();

  const map = testResults?.correctAnswersMap || testResults?.answersMap;
  if (map && typeof map === 'object') {
    Object.values(map).forEach((entry) => {
      const status = statusFromResponse(entry);
      if (!status || entry?.questionNumber == null) return;
      const key = String(entry.questionNumber);
      byQuestion.set(key, [...(byQuestion.get(key) || []), status]);
    });
  }

  const lookup = new Map(
    [...byQuestion.entries()].map(([key, statuses]) => [key, combineStatuses(statuses)])
  );

  // User responses are already one record per question and the more direct
  // signal, so they are applied last and win.
  if (Array.isArray(testResults?.userResponses)) {
    testResults.userResponses.forEach((entry) => {
      const status = statusFromResponse(entry);
      if (!status || entry?.questionNumber == null) return;
      lookup.set(String(entry.questionNumber), status);
    });
  }

  return lookup;
}

/**
 * Derives the full result picture.
 *
 * `correctAnswers` / `totalQuestions` on the normalised results are the
 * authoritative aggregate (they drive the band score), so headline counts are
 * always reconciled against them. Per-question detail is only trusted for the
 * grid, and only when it actually covers every question — otherwise the
 * uncovered ones are marked `unknown` rather than being guessed as wrong.
 */
export function deriveResultStats(testResults) {
  const total = Math.max(0, Number(testResults?.totalQuestions) || 0);
  const correct = Math.min(total, Math.max(0, Number(testResults?.correctAnswers) || 0));

  const lookup = buildStatusLookup(testResults);
  const questions = Array.from({ length: total }, (_, i) => {
    const qNum = i + 1;
    return { qNum, status: lookup.get(String(qNum)) || STATUS.unknown };
  });

  const covered = questions.filter((q) => q.status !== STATUS.unknown);
  const gridCorrect = questions.filter((q) => q.status === STATUS.correct).length;
  // The grid is only trusted when it covers every question *and* agrees with
  // the authoritative score; otherwise its wrong/skipped split could not add
  // up to the headline total.
  const isComplete = total > 0 && covered.length === total && gridCorrect === correct;

  let wrong;
  let skipped;

  if (isComplete) {
    wrong = questions.filter((q) => q.status === STATUS.wrong).length;
    skipped = questions.filter((q) => q.status === STATUS.skipped).length;
  } else {
    // Fall back to the aggregate. `unanswered` is already clamped by
    // normalizeTestResults to never exceed the number of non-correct answers.
    skipped = Math.min(
      Math.max(0, total - correct),
      Math.max(0, Number(testResults?.unanswered) || 0)
    );
    wrong = Math.max(0, total - correct - skipped);
  }

  return {
    total,
    correct,
    wrong,
    skipped,
    accuracy: percentOf(correct, total),
    questions,
    /** True when every question has a known status — the grid is exhaustive. */
    isComplete,
  };
}

/** Seconds actually spent, or null when the session never recorded it. */
export function resolveTimeSpent(testResults) {
  const seconds = Number(testResults?.timeMetrics?.totalTimeSpent);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Maps an accuracy percentage onto the panel signal tokens. Colour carries
 * meaning here — a weak question type has to *look* weak, which the previous
 * single-colour indigo bars could not express.
 */
export function accuracyTone(accuracy) {
  if (accuracy >= 80) return 'ok';
  if (accuracy >= 50) return 'warn';
  return 'fault';
}

export const BAND_DESCRIPTORS = [
  [9, 'Expert user'],
  [8, 'Very good user'],
  [7, 'Good user'],
  [6, 'Competent user'],
  [5, 'Modest user'],
  [4, 'Limited user'],
  [3, 'Extremely limited'],
  [2, 'Intermittent user'],
];

export function bandDescriptor(score) {
  const n = Number(score) || 0;
  const hit = BAND_DESCRIPTORS.find(([floor]) => n >= floor);
  return hit ? hit[1] : 'Initial level';
}
