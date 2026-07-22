/**
 * Centralized scoring calculator for IELTS reading tests.
 * Eliminates duplicated scoring logic across the codebase.
 */

import { normalizeAnswer, isAnswerCorrect } from '@/lib/ieltsAnswerValidation';
import { calculateReadingBandScore } from '@/lib/ieltsBandScore';

// Re-export for backward compatibility
export { normalizeAnswer, isAnswerCorrect };

/**
 * Calculate IELTS band score from raw score (scaled to 40 questions)
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total number of questions
 * @returns {number} IELTS band score (1.0-9.0)
 */
export const calculateBandScore = calculateReadingBandScore;

function findBlankMetadata(patternNum, absoluteIdx, blanksMetadata, sortedBlanks) {
  let blankMeta = blanksMetadata.find((b) => b.blankNumber === patternNum);
  if (!blankMeta && sortedBlanks[patternNum - 1]) blankMeta = sortedBlanks[patternNum - 1];
  if (!blankMeta && sortedBlanks[absoluteIdx]) blankMeta = sortedBlanks[absoluteIdx];
  return blankMeta;
}

function processInlineCellMatches(cellStr, blanksMetadata, sortedBlanks, absoluteIdx, qId, allGaps) {
  const inlineMatches = cellStr.match(/__BLANK_(\d+)__/g);
  if (!inlineMatches) return absoluteIdx;

  let currentIdx = absoluteIdx;
  inlineMatches.forEach((match) => {
    const patternNum = parseInt(match.match(/__BLANK_(\d+)__/)[1], 10);
    const blankMeta = findBlankMetadata(patternNum, currentIdx, blanksMetadata, sortedBlanks);
    const actualQuestionNumber = blankMeta?.blankNumber || patternNum;

    allGaps.push({
      blankNum: actualQuestionNumber,
      absoluteIdx: currentIdx,
      answerKey: `${qId}_${currentIdx}`,
      correctAnswer: blankMeta?.answer || blankMeta?.correct_answer || '',
    });
    currentIdx++;
  });
  return currentIdx;
}

/**
 * Extract table gap metadata from table rows and cells.
 */
function collectTableGaps(q) {
  const rows = q.table_data?.rows || [];
  const blanksMetadata = q.table_data?.blanks || q.table_data?.blank_positions || [];
  const sortedBlanks = [...blanksMetadata].sort(
    (a, b) => (a.blankNumber || 0) - (b.blankNumber || 0)
  );

  const allGaps = [];
  let absoluteIdx = 0;

  rows.forEach((row, rIdx) => {
    const cells = Array.isArray(row) ? row : [];
    cells.forEach((cell, cIdx) => {
      const cellStr = cell || '';
      absoluteIdx = processInlineCellMatches(cellStr, blanksMetadata, sortedBlanks, absoluteIdx, q.id, allGaps);

      const legacyBlank = blanksMetadata.find((b) => b.row === rIdx && b.col === cIdx);
      if (legacyBlank && !cellStr.includes('__BLANK_')) {
        const blankNum = legacyBlank.blankNumber || absoluteIdx + 1;
        allGaps.push({
          blankNum,
          absoluteIdx,
          answerKey: `${q.id}_${absoluteIdx}`,
          correctAnswer: legacyBlank.answer || legacyBlank.correct_answer || '',
        });
        absoluteIdx++;
      }
    });
  });

  return allGaps;
}

function checkMultiplePartAnswers(userAnswers, correctAnswerParts, groupGapsCount) {
  if (userAnswers.length < correctAnswerParts.length) return false;
  if (correctAnswerParts.length !== groupGapsCount) return false;

  const allPartsCorrect = userAnswers.every((userAns, idx) =>
    isAnswerCorrect(userAns, correctAnswerParts[idx] || correctAnswerParts[0])
  );
  const orderIndependent =
    correctAnswerParts.every((correctPart) =>
      userAnswers.some((userAns) => isAnswerCorrect(userAns, correctPart))
    ) && userAnswers.length === correctAnswerParts.length;

  return allPartsCorrect || orderIndependent;
}

/**
 * Evaluate accuracy for a group of table gap inputs.
 */
function evaluateTableGapGroup(group, answers) {
  const correctAnswerStr = group.gaps[0]?.correctAnswer || '';
  const userAnswers = group.gaps
    .map((gap) => (answers[gap.answerKey] || '').trim())
    .filter(Boolean);

  if (userAnswers.length === 0) return null;
  if (group.gaps.length <= 1) {
    return userAnswers.some((userAns) => isAnswerCorrect(userAns, correctAnswerStr));
  }

  const correctAnswerParts = correctAnswerStr
    .split(/,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  return checkMultiplePartAnswers(userAnswers, correctAnswerParts, group.gaps.length);
}

function evaluateGapInputStatus(userAns, isCorrect, hasMultipleInputs, correctAnswerParts, correctAnswerStr, idx) {
  if (userAns === '') return null;
  if (hasMultipleInputs && correctAnswerParts.length > idx) {
    return isAnswerCorrect(userAns, correctAnswerParts[idx]);
  }
  if (!hasMultipleInputs) {
    return isAnswerCorrect(userAns, correctAnswerStr);
  }
  return isCorrect;
}

/**
 * Score table completion question type.
 */
function scoreTableQuestion(q, answers, result) {
  const allGaps = collectTableGaps(q);
  const groupedByBlankNum = {};

  allGaps.forEach((gap) => {
    if (!groupedByBlankNum[gap.blankNum]) {
      groupedByBlankNum[gap.blankNum] = { blankNum: gap.blankNum, gaps: [] };
    }
    groupedByBlankNum[gap.blankNum].gaps.push(gap);
  });

  Object.values(groupedByBlankNum).forEach((group) => {
    result.total++;
    const isCorrect = evaluateTableGapGroup(group, answers);
    if (isCorrect === true) result.correct++;

    const correctAnswerStr = group.gaps[0]?.correctAnswer || '';
    const correctAnswerParts = correctAnswerStr
      .split(/,\s*/)
      .map((p) => p.trim())
      .filter(Boolean);
    const hasMultipleInputs = group.gaps.length > 1;

    group.gaps.forEach((gap, idx) => {
      const userAns = (answers[gap.answerKey] || '').trim();
      const inputIsCorrect = evaluateGapInputStatus(
        userAns,
        isCorrect,
        hasMultipleInputs,
        correctAnswerParts,
        correctAnswerStr,
        idx
      );

      result.details.push({
        questionId: gap.answerKey,
        questionNumber: group.blankNum,
        userAnswer: userAns,
        correctAnswer: gap.correctAnswer || correctAnswerStr,
        isCorrect: inputIsCorrect,
        isQuestionCorrect: isCorrect,
        isInputEmpty: userAns === '',
        isGroupedQuestion: hasMultipleInputs,
        groupIndex: idx,
        groupSize: group.gaps.length,
      });
    });
  });

  return result;
}

/**
 * Helper to record normalized single-answer option scores.
 */
function scoreNormalizedPair({ answerKey, questionNumber, rawUserAns, correctAnswer }, result) {
  result.total++;
  const userAnswer = normalizeAnswer(rawUserAns);
  const isCorrect = userAnswer === normalizeAnswer(correctAnswer);

  if (isCorrect) result.correct++;
  result.details.push({
    questionId: answerKey,
    questionNumber,
    userAnswer: (rawUserAns || '').trim(),
    correctAnswer,
    isCorrect,
  });
}

function scoreMatchingHeadingsQuestion(q, answers, result) {
  q.matching_data.paragraphs.forEach((para) => {
    const answerKey = `${q.id}_${para.label}`;
    scoreNormalizedPair(
      { answerKey, questionNumber: para.label, rawUserAns: answers[answerKey], correctAnswer: para.correct_heading || '' },
      result
    );
  });
  return result;
}

function scoreMatchingQuestion(q, answers, result) {
  q.options.forEach((option, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const answerKey = `${q.id}_${letter}`;
    const questionNumber = `${q.question_number || '•'}${letter.toLowerCase()}`;
    scoreNormalizedPair(
      { answerKey, questionNumber, rawUserAns: answers[answerKey], correctAnswer: q.correct_answers?.[letter] || '' },
      result
    );
  });
  return result;
}

function scoreMatchingFeaturesQuestion(q, answers, result) {
  if (q.matching_features.mode === 'paragraph' && q.matching_features.answers) {
    Object.entries(q.matching_features.answers).forEach(([qNum, correctAns]) => {
      const answerKey = `${q.id}_${qNum}`;
      scoreNormalizedPair(
        { answerKey, questionNumber: qNum, rawUserAns: answers[answerKey], correctAnswer: correctAns || '' },
        result
      );
    });
  } else if (q.matching_features.questions) {
    q.matching_features.questions.forEach((mfq, idx) => {
      const answerKey = `${q.id}_${mfq.id || idx}`;
      const qNum = mfq.questionNumber || (q.question_number ? parseInt(q.question_number, 10) + idx : idx + 1);
      const correctAnswer = mfq.answer || mfq.correct_answer || '';
      scoreNormalizedPair(
        { answerKey, questionNumber: qNum, rawUserAns: answers[answerKey], correctAnswer },
        result
      );
    });
  }
  return result;
}

function scoreNotesStructuredText(q, answers, gapMatches, result) {
  gapMatches.forEach((match) => {
    result.total++;
    const gapNum = parseInt(match[1], 10);
    const answerKey = `${q.id}_gap_${gapNum}`;
    const userAns = (answers[answerKey] || '').trim();
    const correctAnswer = q.gap_fill.answers?.[gapNum] || '';
    const isCorrect = userAns === '' ? null : isAnswerCorrect(userAns, correctAnswer);

    if (isCorrect === true) result.correct++;
    result.details.push({
      questionId: answerKey,
      questionNumber: gapNum,
      userAnswer: userAns,
      correctAnswer,
      isCorrect,
    });
  });
}

function scoreNotesFallbackGaps(q, answers, result) {
  const gapCount = q.gap_fill.gap_count || 1;
  for (let i = 0; i < gapCount; i++) {
    result.total++;
    const answerKey = `${q.id}_gap_${i + 1}`;
    const userAns = (answers[answerKey] || '').trim();
    const correctAnswer = q.gap_fill.answers?.[i + 1] || q.gap_fill.answers?.[i] || '';
    const isCorrect = userAns === '' ? null : isAnswerCorrect(userAns, correctAnswer);

    if (isCorrect === true) result.correct++;
    result.details.push({
      questionId: answerKey,
      questionNumber: q.question_number ? parseInt(String(q.question_number), 10) + i : i + 1,
      userAnswer: userAns,
      correctAnswer,
      isCorrect,
    });
  }
}

function scoreNotesCompletionQuestion(q, answers, result) {
  const text = q.gap_fill.structured_text || '';
  const gapMatches = Array.from(text.matchAll(/\[(\d+)\]/g));

  if (gapMatches.length > 0) {
    scoreNotesStructuredText(q, answers, gapMatches, result);
  } else {
    scoreNotesFallbackGaps(q, answers, result);
  }
  return result;
}

function scoreFlowchartQuestion(q, answers, result) {
  let gapIndex = 0;
  q.flowchart.steps.forEach((step) => {
    const gapCount = (step.text?.match(/\[gap\]/g) || []).length;
    for (let i = 0; i < gapCount; i++) {
      const gapNumber = step.gap_numbers?.[i] ?? Number(q.question_number || 1) + gapIndex;
      const answerKey = `${q.id}_gap_${gapNumber}`;
      const userAnswer = (answers[answerKey] || '').trim();
      const correctAnswer =
        q.flowchart.answers?.[gapIndex] ?? q.flowchart.answers?.[gapNumber] ?? '';
      const isCorrect = userAnswer === '' ? null : isAnswerCorrect(userAnswer, correctAnswer);

      result.total++;
      if (isCorrect === true) result.correct++;
      result.details.push({
        questionId: answerKey,
        questionNumber: gapNumber,
        userAnswer,
        correctAnswer,
        isCorrect,
      });
      gapIndex++;
    }
  });
  return result;
}

function scoreSentenceSingle(q, answers, blankCount, result) {
  result.total++;
  let correctBlanks = 0;

  for (let i = 0; i < blankCount; i++) {
    const answerKey = `${q.id}_blank_${i + 1}`;
    const correctAnswer = q.correct_answers?.[i] || '';
    const isCorrect = isAnswerCorrect(answers[answerKey], correctAnswer);
    if (isCorrect) correctBlanks++;

    result.details.push({
      questionId: answerKey,
      questionNumber: q.question_number,
      userAnswer: (answers[answerKey] || '').trim(),
      correctAnswer,
      isCorrect,
    });
  }

  if (correctBlanks === blankCount) result.correct++;
}

function scoreSentenceMulti(q, answers, blankCount, result) {
  for (let i = 0; i < blankCount; i++) {
    result.total++;
    const answerKey = `${q.id}_blank_${i + 1}`;
    const correctAnswer = q.correct_answers?.[i] || '';
    const isCorrect = isAnswerCorrect(answers[answerKey], correctAnswer);

    if (isCorrect) result.correct++;
    result.details.push({
      questionId: answerKey,
      questionNumber: q.question_number ? `${q.question_number}.${i + 1}` : i + 1,
      userAnswer: (answers[answerKey] || '').trim(),
      correctAnswer,
      isCorrect,
    });
  }
}

function scoreSentenceCompletionQuestion(q, answers, result) {
  const text = q.question_text || '';
  const blankCount = (text.match(/_____/g) || []).length || 1;
  if (blankCount <= 1) return null;

  const isSingleQuestion = Boolean(
    q.question_number &&
    !String(q.question_number).includes('-') &&
    String(q.question_number).match(/\d+/)
  );

  if (isSingleQuestion) {
    scoreSentenceSingle(q, answers, blankCount, result);
  } else {
    scoreSentenceMulti(q, answers, blankCount, result);
  }
  return result;
}

function parseMultiAnswers(rawAnswer) {
  if (!rawAnswer) return [];
  if (Array.isArray(rawAnswer)) return rawAnswer.map((a) => normalizeAnswer(a));

  let parsed = rawAnswer;
  try {
    if (typeof rawAnswer === 'string' && rawAnswer.trim().startsWith('[')) {
      parsed = JSON.parse(rawAnswer);
    }
  } catch {
    // Keep as string
  }

  if (Array.isArray(parsed)) return parsed.map((a) => normalizeAnswer(a));
  return String(rawAnswer)
    .split(/[,;]/)
    .map((a) => normalizeAnswer(a.trim()))
    .filter(Boolean);
}

function getMcqQuestionCount(q) {
  if (q.question_count) return parseInt(String(q.question_count), 10);
  if (q.question_number) {
    const rangeMatch = String(q.question_number).match(/(\d+)\s*[-–—]\s*(\d+)/);
    if (rangeMatch) {
      return Math.max(1, parseInt(rangeMatch[2], 10) - parseInt(rangeMatch[1], 10) + 1);
    }
  }
  if (q.allow_multiple) return 2;
  return 1;
}

function scoreMultiSelectMCQQuestion(q, answers, result) {
  const questionCount = getMcqQuestionCount(q);
  if (questionCount <= 1) return null;

  result.total += questionCount;
  const userAnswers = parseMultiAnswers(answers[q.id]);
  const correctAnswers = parseMultiAnswers(q.correct_answer);
  const baseNum = q.question_number
    ? parseInt(String(q.question_number).match(/\d+/)?.[0], 10) || 1
    : 1;

  for (let i = 0; i < questionCount; i++) {
    const userAns = userAnswers[i] || '';
    const correctAns = correctAnswers[i] || '';
    const isCorrect = Boolean(userAns && correctAns && userAns === correctAns);

    if (isCorrect) result.correct++;
    result.details.push({
      questionId: `${q.id}_multi_${i}`,
      questionNumber: baseNum + i,
      userAnswer: userAns,
      correctAnswer: correctAns,
      isCorrect,
    });
  }
  return result;
}

function scoreCustomTypeQuestion(q, answers, result) {
  if (q.type === 'table_completion' && q.table_data?.rows) {
    return scoreTableQuestion(q, answers, result);
  }
  if (q.type === 'matching_headings' && q.matching_data?.paragraphs) {
    return scoreMatchingHeadingsQuestion(q, answers, result);
  }
  if (q.type === 'matching' && q.options) {
    return scoreMatchingQuestion(q, answers, result);
  }
  if (q.type === 'matching_features' && q.matching_features) {
    return scoreMatchingFeaturesQuestion(q, answers, result);
  }
  if ((q.type === 'notes_completion' || q.type === 'note_completion') && q.gap_fill) {
    return scoreNotesCompletionQuestion(q, answers, result);
  }
  if ((q.type === 'flowchart' || q.type === 'flow_chart_completion') && q.flowchart?.steps) {
    return scoreFlowchartQuestion(q, answers, result);
  }
  if (['sentence_completion', 'summary_completion', 'short_answer'].includes(q.type)) {
    return scoreSentenceCompletionQuestion(q, answers, result);
  }
  if (q.type === 'multiple_choice') {
    return scoreMultiSelectMCQQuestion(q, answers, result);
  }
  return null;
}

export const scoreQuestion = (question, answers) => {
  const result = { total: 0, correct: 0, details: [] };
  const customResult = scoreCustomTypeQuestion(question, answers, result);
  if (customResult) return customResult;

  // Standard single-answer question (MCQ, T/F/NG, Y/N/NG, etc.)
  result.total++;
  const userAnswer = (answers[question.id] || '').trim();
  const correctAnswer = question.correct_answer || '';
  const isCorrect = userAnswer === '' ? null : isAnswerCorrect(userAnswer, correctAnswer);

  if (isCorrect === true) result.correct++;
  result.details.push({
    questionId: question.id,
    questionNumber: question.question_number || '•',
    userAnswer,
    correctAnswer,
    isCorrect,
  });

  return result;
};

function findSectionIndex(q, sections) {
  if (sections.length <= 1) return 0;
  const parsedSection = Number.parseInt(String(q.section || '').match(/\d+/)?.[0], 10);

  const foundIndex = sections.findIndex((section, index) => {
    const sectionNumber = Number(section.section_number || index + 1);
    return (
      (section.id && q.section_id === section.id) ||
      (Number.isFinite(parsedSection) && parsedSection === sectionNumber)
    );
  });

  return Math.max(0, foundIndex);
}

function isQuestionInReadingSection(q, sectionNum, sectionsLength) {
  if (sectionsLength === 1) return true;
  if (!q.section) return false;
  const parsed = parseInt(String(q.section).match(/\d+/)?.[0], 10);
  return !isNaN(parsed) && parsed === sectionNum;
}

function updateQuestionNumberEntry(existing, d) {
  existing.allInputs.push({ userAnswer: d.userAnswer, isCorrect: d.isCorrect });
  if (d.userAnswer) {
    existing.userAnswer = existing.userAnswer
      ? `${existing.userAnswer}, ${d.userAnswer}`
      : d.userAnswer;
  }
}

function aggregateUserResponses(allDetails) {
  const questionNumberMap = new Map();

  allDetails.forEach((d) => {
    const qNum = d.questionNumber;
    const existing = questionNumberMap.get(qNum);

    if (!existing) {
      questionNumberMap.set(qNum, {
        questionId: d.questionId,
        questionNumber: qNum,
        userAnswer: d.userAnswer,
        correctAnswer: d.correctAnswer,
        isCorrect: d.isQuestionCorrect !== undefined ? d.isQuestionCorrect : d.isCorrect,
        isGroupedQuestion: d.isGroupedQuestion || false,
        type: d.type,
        sectionIndex: d.sectionIndex,
        allInputs: [{ userAnswer: d.userAnswer, isCorrect: d.isCorrect }],
      });
    } else if (d.isGroupedQuestion) {
      updateQuestionNumberEntry(existing, d);
    }
  });

  return Array.from(questionNumberMap.values()).sort((a, b) => {
    const numA = typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(a.questionNumber, 10) || 0;
    const numB = typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(b.questionNumber, 10) || 0;
    return numA - numB;
  });
}

/**
 * Calculate complete test results
 * @param {Array} questions - All questions
 * @param {Object} answers - User answers map
 * @param {Array} sections - Test sections (for section stats)
 * @returns {Object} Complete test results object
 */
export const calculateTestResults = (questions, answers, sections = []) => {
  let totalCorrect = 0;
  let totalQuestions = 0;
  const typeStats = {};
  const allDetails = [];

  questions.forEach((q) => {
    const result = scoreQuestion(q, answers);
    const qType = q.type || 'multiple_choice';
    const sectionIndex = findSectionIndex(q, sections);

    totalCorrect += result.correct;
    totalQuestions += result.total;

    if (!typeStats[qType]) typeStats[qType] = { total: 0, correct: 0 };
    typeStats[qType].total += result.total;
    typeStats[qType].correct += result.correct;

    allDetails.push(
      ...result.details.map((detail) => ({
        ...detail,
        type: qType,
        sectionIndex,
      }))
    );
  });

  const percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const bandScore = calculateBandScore(totalCorrect, totalQuestions);

  const sectionStats = sections.map((section, idx) => {
    const sectionNum = section.section_number || idx + 1;
    const sectionQuestions = questions.filter((q) =>
      isQuestionInReadingSection(q, sectionNum, sections.length)
    );

    let sectionCorrect = 0;
    let sectionTotal = 0;

    sectionQuestions.forEach((q) => {
      const result = scoreQuestion(q, answers);
      sectionCorrect += result.correct;
      sectionTotal += result.total;
    });

    return {
      id: section.id || idx,
      title: section.title || `Passage ${idx + 1}`,
      correct: sectionCorrect,
      total: sectionTotal,
      percentage: sectionTotal > 0 ? Math.round((sectionCorrect / sectionTotal) * 100) : 0,
    };
  });

  const correctAnswersMap = {};
  allDetails.forEach((d) => {
    correctAnswersMap[d.questionId] = {
      questionNumber: d.questionNumber,
      userAnswer: d.userAnswer,
      correctAnswer: d.correctAnswer,
      isCorrect: d.isCorrect,
      type: d.type,
      sectionIndex: d.sectionIndex,
    };
  });

  const userResponses = aggregateUserResponses(allDetails);

  return {
    correctAnswers: totalCorrect,
    totalQuestions,
    percentage: Math.round(percentage),
    bandScore,
    typeStats,
    sectionStats,
    correctAnswersMap,
    userResponses,
    responseDetails: userResponses.map((detail) => ({
      questionId: detail.questionId,
      questionNumber: detail.questionNumber,
      type: detail.type,
      sectionIndex: detail.sectionIndex,
      userAnswer: detail.userAnswer,
      correctAnswer: detail.correctAnswer,
      isCorrect: detail.isCorrect,
    })),
  };
};
