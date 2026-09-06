export const ANALYSIS_SCHEMA_VERSION = 2;

const toQuestionNumber = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const responseStatus = (response) => {
  if (response?.isCorrect === true) return 'correct';
  const answer = response?.userAnswer;
  const isBlank =
    answer == null ||
    answer === '' ||
    answer === '(not selected)' ||
    (Array.isArray(answer) && answer.length === 0);
  if (isBlank) return 'skipped';
  if (response?.isCorrect === false) return 'wrong';
  return null;
};

function collectCanonicalResponses(result) {
  const byQuestion = new Map();
  const record = (response) => {
    const questionNumber = toQuestionNumber(response?.questionNumber);
    const status = responseStatus(response);
    if (questionNumber === null || status === null) return;
    byQuestion.set(questionNumber, { ...response, questionNumber, status });
  };

  if (result?.correctAnswersMap && typeof result.correctAnswersMap === 'object') {
    Object.values(result.correctAnswersMap).forEach(record);
  }
  if (result?.answersMap && typeof result.answersMap === 'object') {
    Object.values(result.answersMap).forEach(record);
  }
  if (Array.isArray(result?.userResponses)) result.userResponses.forEach(record);
  if (Array.isArray(result?.responseDetails)) result.responseDetails.forEach(record);

  const responses = [...byQuestion.values()].sort((a, b) => a.questionNumber - b.questionNumber);
  if (
    !responses.length ||
    responses.some((response, index) => response.questionNumber !== index + 1)
  ) {
    return null;
  }
  return responses;
}

function rebuildTypeStats(responses) {
  const stats = {};
  responses.forEach((response) => {
    const type = response.questionType || response.type || 'unknown';
    if (!stats[type]) stats[type] = { correct: 0, total: 0 };
    stats[type].total += 1;
    if (response.status === 'correct') stats[type].correct += 1;
  });
  return stats;
}

function rebuildSectionStats(responses, existingStats) {
  const bySection = new Map();
  responses.forEach((response) => {
    const rawIndex = Number(response.sectionIndex);
    const sectionIndex = Number.isInteger(rawIndex) && rawIndex >= 0 ? rawIndex : 0;
    const current = bySection.get(sectionIndex) || { correct: 0, total: 0 };
    current.total += 1;
    if (response.status === 'correct') current.correct += 1;
    bySection.set(sectionIndex, current);
  });

  return [...bySection.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, stat]) => ({
      ...(Array.isArray(existingStats) ? existingStats[index] : null),
      correct: stat.correct,
      total: stat.total,
      percentage: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
    }));
}

function scaleDuplicatedStat(stat, multiplier) {
  const correct = Number(stat?.correct);
  const total = Number(stat?.total);
  if (
    !Number.isInteger(correct) ||
    !Number.isInteger(total) ||
    correct % multiplier !== 0 ||
    total % multiplier !== 0
  ) {
    return stat;
  }

  const scaledCorrect = correct / multiplier;
  const scaledTotal = total / multiplier;
  return {
    ...stat,
    correct: scaledCorrect,
    total: scaledTotal,
    percentage: scaledTotal > 0 ? Math.round((scaledCorrect / scaledTotal) * 100) : 0,
  };
}

function reconcileTypeStats(result, responses, multiplier) {
  if (responses.every((response) => response.questionType || response.type)) {
    return rebuildTypeStats(responses);
  }
  return Object.fromEntries(
    Object.entries(result.typeStats || {}).map(([type, stat]) => [
      type,
      scaleDuplicatedStat(stat, multiplier),
    ])
  );
}

function reconcileSectionStats(result, responses, multiplier) {
  const hasSectionMetadata = responses.every((response) => {
    const index = Number(response.sectionIndex);
    return Number.isInteger(index) && index >= 0;
  });
  if (hasSectionMetadata) return rebuildSectionStats(responses, result.sectionStats);
  return Array.isArray(result.sectionStats)
    ? result.sectionStats.map((stat) => scaleDuplicatedStat(stat, multiplier))
    : [];
}

/**
 * Repairs the narrow legacy corruption where every aggregate was counted twice
 * while the persisted per-question evidence still contains one complete paper.
 * Evidence is trusted only when it forms a contiguous 1..N sequence and the
 * stored totals are an exact integer multiple, so partial legacy data is left
 * untouched rather than guessed.
 */
export function reconcileObjectiveResultEvidence(result, testType = 'reading') {
  if (!result || !['reading', 'listening'].includes(String(testType).toLowerCase())) return result;

  const responses = collectCanonicalResponses(result);
  if (!responses) return result;

  const storedTotal = Number(result.totalQuestions);
  const storedCorrect = Number(result.correctAnswers);
  const evidenceTotal = responses.length;
  const evidenceCorrect = responses.filter((response) => response.status === 'correct').length;
  const multiplier = storedTotal / evidenceTotal;
  const isExactDuplicate =
    Number.isInteger(multiplier) &&
    multiplier > 1 &&
    Number.isFinite(storedCorrect) &&
    storedCorrect === evidenceCorrect * multiplier;

  if (!isExactDuplicate) return result;

  const unanswered = responses.filter((response) => response.status === 'skipped').length;

  return {
    ...result,
    totalQuestions: evidenceTotal,
    correctAnswers: evidenceCorrect,
    percentage: Math.round((evidenceCorrect / evidenceTotal) * 100),
    unanswered,
    errorPatterns: { ...(result.errorPatterns || {}), unansweredCount: unanswered },
    typeStats: reconcileTypeStats(result, responses, multiplier),
    sectionStats: reconcileSectionStats(result, responses, multiplier),
  };
}

/** Normalize both historical answer arrays and current answer-map persistence. */
export function normalizePersistedAnswers(rawResponses) {
  if (!rawResponses || typeof rawResponses !== 'object') return {};
  if (!Array.isArray(rawResponses)) return { ...rawResponses };

  return rawResponses.reduce((answers, response) => {
    const questionId = response?.question_id || response?.questionId;
    const userAnswer =
      response?.user_answer !== undefined ? response.user_answer : response?.userAnswer;
    if (questionId && userAnswer !== undefined) answers[questionId] = userAnswer;
    return answers;
  }, {});
}

function normalizeFlaggedQuestionIds(flaggedQuestions) {
  if (flaggedQuestions == null) return null;

  const values =
    flaggedQuestions instanceof Set
      ? Array.from(flaggedQuestions)
      : Array.isArray(flaggedQuestions)
        ? flaggedQuestions
        : [];

  return new Set(values.map((value) => String(value)));
}

/**
 * Adds the shared analytics contract without removing the legacy fields consumed
 * by historical result views.
 */
export function standardizeResponseDetails(responseDetails, flaggedQuestions = null) {
  const flaggedIds = normalizeFlaggedQuestionIds(flaggedQuestions);

  return (Array.isArray(responseDetails) ? responseDetails : []).map((detail) => {
    const questionId = String(detail?.questionId ?? '');
    const sectionIndex = Number(detail?.sectionIndex);
    const questionType = detail?.questionType || detail?.type || 'unknown';
    const sectionOrPart =
      detail?.sectionOrPart ??
      (Number.isFinite(sectionIndex) && sectionIndex >= 0 ? sectionIndex + 1 : null);

    return {
      ...detail,
      questionId,
      questionType,
      sectionOrPart,
      wasFlagged: flaggedIds === null ? null : flaggedIds.has(questionId),
    };
  });
}
