export function isNonEmptyAnswer(val) {
  if (val === undefined || val === null || val === '') return false;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

export function countMcqAnswered(q, answers, size) {
  const ans = answers[q.id];
  if (q.allow_multiple) {
    return Array.isArray(ans) && ans.length > 0 ? Math.min(ans.length, size) : 0;
  }
  return isNonEmptyAnswer(ans) ? 1 : 0;
}

export function countIndexedAnswered(qId, size, answers) {
  let count = 0;
  for (let i = 0; i < size; i++) {
    if (isNonEmptyAnswer(answers[`${qId}_${i}`])) {
      count += 1;
    }
  }
  return count;
}

export function countAnsweredBlanksForQuestion(q, answers, answerKeys) {
  const size = q._displaySize || 1;

  // 1. Multiple Choice
  if (q.type === 'multiple_choice') {
    return countMcqAnswered(q, answers, size);
  }

  // 2. Questions with explicit subquestion items (Matching Features, Map Labeling, Diagram Completion, etc.)
  const subQuestions =
    q.matching_features?.questions ||
    q.map_labeling?.questions ||
    q.diagram_data?.questions ||
    q.diagram_completion?.questions ||
    (Array.isArray(q.questions) ? q.questions : null);

  if (Array.isArray(subQuestions) && subQuestions.length > 0) {
    let count = 0;
    const startNum = q._displayStartNumber || q.question_number || 1;

    subQuestions.forEach((subQ, idx) => {
      const qNum = subQ.questionNumber || startNum + idx;
      // Possible keys in answers for this subquestion
      const possibleKeys = [
        subQ.id,
        String(qNum),
        `${q.id}_${idx}`,
        `${q.id}_${subQ.id}`,
        `map_${q.id}_${qNum}`,
        `${q.id}_${qNum}`,
        `q_${qNum}`,
      ].filter(Boolean);

      const isAnswered = possibleKeys.some((k) => isNonEmptyAnswer(answers[k]));
      if (isAnswered) {
        count += 1;
      }
    });

    return Math.min(count, size);
  }

  // 3. Gap Fill, Table Completion, Flowchart or General Questions
  const indexedCount = countIndexedAnswered(q.id, size, answers);

  // Check direct answer on q.id
  const directAnswered = isNonEmptyAnswer(answers[q.id]) ? 1 : 0;

  // Check prefix matching (e.g. q.id_r0_c1 or q.id_0 or map_q.id_15)
  const qIdPrefix = `${q.id}_`;
  const matchingPrefixKeysCount = answerKeys.filter(
    (k) =>
      (k === q.id || k.startsWith(qIdPrefix) || k.startsWith(`map_${q.id}_`)) &&
      isNonEmptyAnswer(answers[k])
  ).length;

  // Also check explicit question number keys (e.g., answers["15"], answers["16"]...)
  let numberRangeCount = 0;
  if (q._displayStartNumber && size > 1) {
    const start = q._displayStartNumber;
    const end = q._displayEndNumber || start + size - 1;
    for (let num = start; num <= end; num++) {
      if (isNonEmptyAnswer(answers[String(num)]) || isNonEmptyAnswer(answers[`q_${num}`])) {
        numberRangeCount += 1;
      }
    }
  }

  const totalFound = Math.max(
    indexedCount + directAnswered,
    matchingPrefixKeysCount,
    numberRangeCount
  );
  return Math.min(totalFound, size);
}

export function isQuestionInSection(q, secNum, isFirstSection) {
  if (q.section !== undefined) return parseInt(q.section) === secNum || q.section == secNum;
  if (q.part_number !== undefined) return q.part_number === secNum || q.part_number == secNum;
  return isFirstSection;
}

export function calculateListeningStats(displaySections, questionsWithNumbers, answers) {
  const answerKeys = Object.keys(answers || {});

  const results = displaySections.map((sec, idx) => {
    const secNum = sec.section_number || idx + 1;
    const qInSec = (questionsWithNumbers || []).filter((q) =>
      isQuestionInSection(q, secNum, idx === 0)
    );

    const totalBlanks = qInSec.reduce((acc, q) => acc + (q._displaySize || 1), 0);
    let answeredBlanks = 0;

    qInSec.forEach((q) => {
      answeredBlanks += countAnsweredBlanksForQuestion(q, answers, answerKeys);
    });

    const validAnswered = Math.min(answeredBlanks, totalBlanks);
    return {
      sectionIndex: idx,
      idx,
      totalQuestions: totalBlanks,
      sQCount: totalBlanks,
      answeredQuestions: validAnswered,
      sAnswered: validAnswered,
      isComplete: totalBlanks > 0 && validAnswered >= totalBlanks,
    };
  });

  const totalQuestions = results.reduce((acc, r) => acc + r.totalQuestions, 0);
  const totalAnswered = results.reduce((acc, r) => acc + r.answeredQuestions, 0);
  const overallPercentage =
    totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  return {
    results,
    totalQuestions,
    totalQ: totalQuestions,
    totalAnswered,
    totalAns: totalAnswered,
    overallPercentage,
  };
}
