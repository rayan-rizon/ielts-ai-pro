export const ANALYSIS_SCHEMA_VERSION = 2;

/**
 * Whole-number percentage. Multiplying before dividing keeps exact halves
 * exact: `(23 / 40) * 100` is 57.4999… in floating point and rounded to 57,
 * where `(23 * 100) / 40` is 57.5 and rounds to 58.
 */
export function percentOf(part, whole) {
  const p = Number(part);
  const w = Number(whole);
  if (!Number.isFinite(p) || !Number.isFinite(w) || w <= 0) return 0;
  return Math.round((p * 100) / w);
}

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
      percentage: percentOf(stat.correct, stat.total),
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
    percentage: percentOf(scaledCorrect, scaledTotal),
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
  const type = String(testType).toLowerCase();
  if (!result || !['reading', 'listening'].includes(type)) return result;

  const reconciled = reconcileDuplicatedAggregates(result);
  return type === 'listening' ? repairUnattributedListeningItems(reconciled) : reconciled;
}

function reconcileDuplicatedAggregates(result) {
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
    percentage: percentOf(evidenceCorrect, evidenceTotal),
    unanswered,
    errorPatterns: { ...(result.errorPatterns || {}), unansweredCount: unanswered },
    typeStats: reconcileTypeStats(result, responses, multiplier),
    sectionStats: reconcileSectionStats(result, responses, multiplier),
  };
}

// Every listening scorer keys its items by the question's UUID (`<id>`,
// `<id>_<n>`, `<id>_option_<n>`, `map_<id>_<n>`) except matching features,
// which uses the sub-question's own id (`mq_17`, `q1`, `mq1770221890756`, …).
const QUESTION_SCOPED_KEY =
  /^(?:map_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:_|$)/i;

const leadingNumber = (value) => {
  const match = String(value ?? '').match(/^\s*(\d+)/);
  return match ? Number(match[1]) : null;
};

const sumCorrect = (typeStats) =>
  Object.values(typeStats).reduce((sum, stat) => sum + (Number(stat?.correct) || 0), 0);

/** Question-number range each part covers; listening numbers run part by part. */
function sectionRanges(sectionStats) {
  let next = 1;
  return sectionStats.map((stat) => {
    const total = Number(stat?.total) || 0;
    const range = { from: next, to: next + total - 1 };
    next += total;
    return range;
  });
}

function sectionIndexForNumber(ranges, questionNumber) {
  const index = ranges.findIndex(
    (range) => questionNumber >= range.from && questionNumber <= range.to
  );
  return index === -1 ? null : index;
}

function detailsMatchRanges(details, ranges) {
  return details.every((detail) => {
    const number = leadingNumber(detail?.questionNumber);
    const index = Number(detail?.sectionIndex);
    if (number === null || !Number.isInteger(index)) return false;
    return sectionIndexForNumber(ranges, number) === index;
  });
}

function listeningTroubleTypes(typeStats) {
  return Object.entries(typeStats)
    .map(([type, stat]) => ({
      type,
      accuracy: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map((entry) => entry.type);
}

/**
 * Repairs listening results graded before matching-features items were
 * attributed to their question. Those items are keyed by the sub-question's
 * own id instead of `<questionId>_<n>`, so they counted towards the score but were missing from
 * `typeStats`, `sectionStats` and `responseDetails` — matching features always
 * read 0% and the per-section numbers fell short of the headline score.
 *
 * Applied only when the stored record proves the shape exactly: the orphaned
 * items carry no question UUID, and their correct answers are precisely the
 * gap between the type breakdown and the score. Section attribution also needs
 * the same exact gap in the section totals, and — when per-question records
 * exist — every one of them sitting inside its part's question range.
 * Anything else is returned unchanged rather than guessed at.
 */
function repairUnattributedListeningItems(result) {
  const answerMap = result.correctAnswersMap || result.answersMap;
  const typeStats = result.typeStats;
  const matchingStat = typeStats?.matching_features;
  if (!answerMap || typeof answerMap !== 'object' || !matchingStat) return result;

  const details = Array.isArray(result.responseDetails) ? result.responseDetails : [];
  const attributed = new Set(details.map((detail) => String(detail?.questionId)));
  const orphans = Object.entries(answerMap)
    .filter(([key]) => !QUESTION_SCOPED_KEY.test(key) && !attributed.has(key))
    .map(([key, entry]) => ({
      key,
      entry,
      questionNumber: toQuestionNumber(entry?.questionNumber),
    }));
  if (!orphans.length || orphans.some((orphan) => orphan.questionNumber === null)) return result;

  const orphanCorrect = orphans.filter((orphan) => orphan.entry?.isCorrect === true).length;
  const storedCorrect = Number(result.correctAnswers);
  const matchingCorrect = (Number(matchingStat.correct) || 0) + orphanCorrect;
  if (
    !Number.isFinite(storedCorrect) ||
    sumCorrect(typeStats) + orphanCorrect !== storedCorrect ||
    matchingCorrect > (Number(matchingStat.total) || 0)
  ) {
    return result;
  }

  const repairedTypeStats = {
    ...typeStats,
    matching_features: {
      ...matchingStat,
      correct: matchingCorrect,
      ...('percentage' in matchingStat
        ? { percentage: percentOf(matchingCorrect, matchingStat.total) }
        : {}),
    },
  };
  const repaired = { ...result, typeStats: repairedTypeStats };
  if (Array.isArray(result.errorPatterns?.troubleTypes)) {
    repaired.errorPatterns = {
      ...result.errorPatterns,
      troubleTypes: listeningTroubleTypes(repairedTypeStats),
    };
  }

  const sectionStats = Array.isArray(result.sectionStats) ? result.sectionStats : [];
  const ranges = sectionRanges(sectionStats);
  const sectionTotal = sectionStats.reduce((sum, stat) => sum + (Number(stat?.total) || 0), 0);
  const canAttributeSections =
    sectionStats.length > 0 &&
    sectionTotal === Number(result.totalQuestions) &&
    sumCorrect(sectionStats) + orphanCorrect === storedCorrect &&
    (details.length === 0 ||
      (details.length + orphans.length === sectionTotal && detailsMatchRanges(details, ranges))) &&
    orphans.every((orphan) => sectionIndexForNumber(ranges, orphan.questionNumber) !== null);
  if (!canAttributeSections) return repaired;

  const addedBySection = new Array(sectionStats.length).fill(0);
  const addedDetails = orphans.map((orphan) => {
    const sectionIndex = sectionIndexForNumber(ranges, orphan.questionNumber);
    if (orphan.entry?.isCorrect === true) addedBySection[sectionIndex] += 1;
    return {
      questionId: orphan.key,
      questionNumber: orphan.questionNumber,
      type: 'matching_features',
      questionType: 'matching_features',
      sectionIndex,
      sectionOrPart: sectionIndex + 1,
      userAnswer: orphan.entry?.userAnswer ?? '',
      correctAnswer: orphan.entry?.correctAnswer ?? '',
      isCorrect: orphan.entry?.isCorrect === true,
      wasFlagged: null,
    };
  });

  const repairedSections = sectionStats.map((stat, index) => {
    const correct = (Number(stat?.correct) || 0) + addedBySection[index];
    return { ...stat, correct, percentage: percentOf(correct, stat.total) };
  });
  if (repairedSections.some((stat) => stat.correct > (Number(stat.total) || 0))) return repaired;

  // Without stored per-question records there is nothing to complete, and a
  // partial list would read as the whole paper.
  if (details.length === 0) return { ...repaired, sectionStats: repairedSections };

  return {
    ...repaired,
    sectionStats: repairedSections,
    responseDetails: [...details, ...addedDetails].sort(
      (a, b) => (leadingNumber(a.questionNumber) ?? 0) - (leadingNumber(b.questionNumber) ?? 0)
    ),
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
