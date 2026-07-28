export const ANALYSIS_SCHEMA_VERSION = 2;

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
