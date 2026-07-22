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

/**
 * Score a single question and return scoring details
 * @param {Object} question - Question object
 * @param {Object} answers - User answers map { questionId: answer }
 * @returns {{ total: number, correct: number, details: Array }} Scoring result
 */
function scoreTableQuestion(q, answers, result) {
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
      const inlineMatches = cellStr.match(/__BLANK_(\d+)__/g);
      if (inlineMatches) {
        inlineMatches.forEach((match) => {
          const patternNum = parseInt(match.match(/__BLANK_(\d+)__/)[1]);
          let blankMeta = blanksMetadata.find((b) => b.blankNumber === patternNum);
          if (!blankMeta && sortedBlanks[patternNum - 1]) blankMeta = sortedBlanks[patternNum - 1];
          if (!blankMeta && sortedBlanks[absoluteIdx]) blankMeta = sortedBlanks[absoluteIdx];
          const actualQuestionNumber = blankMeta?.blankNumber || patternNum;

          allGaps.push({
            blankNum: actualQuestionNumber,
            absoluteIdx,
            answerKey: `${q.id}_${absoluteIdx}`,
            correctAnswer: blankMeta?.answer || blankMeta?.correct_answer || '',
          });
          absoluteIdx++;
        });
      }

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

  const groupedByBlankNum = {};
  allGaps.forEach((gap) => {
    if (!groupedByBlankNum[gap.blankNum]) {
      groupedByBlankNum[gap.blankNum] = { blankNum: gap.blankNum, gaps: [], correctAnswers: [] };
    }
    groupedByBlankNum[gap.blankNum].gaps.push(gap);
  });

  Object.values(groupedByBlankNum).forEach((group) => {
    result.total++;
    const correctAnswerStr = group.gaps[0]?.correctAnswer || '';
    const userAnswers = group.gaps
      .map((gap) => (answers[gap.answerKey] || '').trim())
      .filter(Boolean);
    const hasMultipleInputs = group.gaps.length > 1;
    const isQuestionAnswered = userAnswers.length > 0;
    let isCorrect = null;

    if (!isQuestionAnswered) {
      isCorrect = null;
    } else if (hasMultipleInputs) {
      const correctAnswerParts = correctAnswerStr
        .split(/,\s*/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (userAnswers.length < correctAnswerParts.length) {
        isCorrect = false;
      } else if (correctAnswerParts.length === group.gaps.length) {
        const allPartsCorrect = userAnswers.every((userAns, idx) =>
          isAnswerCorrect(userAns, correctAnswerParts[idx] || correctAnswerParts[0])
        );
        const orderIndependent =
          correctAnswerParts.every((correctPart) =>
            userAnswers.some((userAns) => isAnswerCorrect(userAns, correctPart))
          ) && userAnswers.length === correctAnswerParts.length;

        isCorrect = allPartsCorrect || orderIndependent;
      } else {
        isCorrect = false;
      }
    } else {
      isCorrect = userAnswers.some((userAns) => isAnswerCorrect(userAns, correctAnswerStr));
    }

    if (isCorrect === true) result.correct++;

    const correctAnswerParts = correctAnswerStr
      .split(/,\s*/)
      .map((p) => p.trim())
      .filter(Boolean);

    group.gaps.forEach((gap, idx) => {
      const userAns = (answers[gap.answerKey] || '').trim();
      const isInputEmpty = userAns === '';
      let inputIsCorrect = isCorrect;
      if (isInputEmpty) {
        inputIsCorrect = null;
      } else if (hasMultipleInputs && correctAnswerParts.length > idx) {
        inputIsCorrect = isAnswerCorrect(userAns, correctAnswerParts[idx]);
      } else if (!hasMultipleInputs) {
        inputIsCorrect = isAnswerCorrect(userAns, correctAnswerStr);
      }

      result.details.push({
        questionId: gap.answerKey,
        questionNumber: group.blankNum,
        userAnswer: userAns,
        correctAnswer: gap.correctAnswer || group.gaps[0]?.correctAnswer || '',
        isCorrect: inputIsCorrect,
        isQuestionCorrect: isCorrect,
        isInputEmpty,
        isGroupedQuestion: group.gaps.length > 1,
        groupIndex: idx,
        groupSize: group.gaps.length,
      });
    });
  });

  return result;
}

function scoreMatchingHeadingsQuestion(q, answers, result) {
  q.matching_data.paragraphs.forEach((para) => {
    result.total++;
    const answerKey = `${q.id}_${para.label}`;
    const userAnswer = normalizeAnswer(answers[answerKey]);
    const correctAnswer = para.correct_heading || '';
    const isCorrect = userAnswer === normalizeAnswer(correctAnswer);

    if (isCorrect) result.correct++;
    result.details.push({
      questionId: answerKey,
      questionNumber: para.label,
      userAnswer: (answers[answerKey] || '').trim(),
      correctAnswer,
      isCorrect,
    });
  });
  return result;
}

function scoreMatchingQuestion(q, answers, result) {
  q.options.forEach((option, idx) => {
    result.total++;
    const letter = String.fromCharCode(65 + idx);
    const answerKey = `${q.id}_${letter}`;
    const userAnswer = normalizeAnswer(answers[answerKey]);
    const correctAnswer = q.correct_answers?.[letter] || '';
    const isCorrect = userAnswer === normalizeAnswer(correctAnswer);

    if (isCorrect) result.correct++;
    result.details.push({
      questionId: answerKey,
      questionNumber: `${q.question_number || '•'}${letter.toLowerCase()}`,
      userAnswer: (answers[answerKey] || '').trim(),
      correctAnswer,
      isCorrect,
    });
  });
  return result;
}

function scoreMatchingFeaturesQuestion(q, answers, result) {
  if (q.matching_features.mode === 'paragraph' && q.matching_features.answers) {
    Object.entries(q.matching_features.answers).forEach(([qNum, correctAns]) => {
      result.total++;
      const answerKey = `${q.id}_${qNum}`;
      const userAnswer = normalizeAnswer(answers[answerKey]);
      const isCorrect = userAnswer === normalizeAnswer(correctAns);

      if (isCorrect) result.correct++;
      result.details.push({
        questionId: answerKey,
        questionNumber: qNum,
        userAnswer: (answers[answerKey] || '').trim(),
        correctAnswer: correctAns || '',
        isCorrect,
      });
    });
  } else if (q.matching_features.questions) {
    q.matching_features.questions.forEach((mfq, idx) => {
      result.total++;
      const answerKey = `${q.id}_${mfq.id || idx}`;
      const userAnswer = normalizeAnswer(answers[answerKey]);
      const correctAnswer = mfq.answer || mfq.correct_answer || '';
      const isCorrect = userAnswer === normalizeAnswer(correctAnswer);

      if (isCorrect) result.correct++;
      result.details.push({
        questionId: answerKey,
        questionNumber:
          mfq.questionNumber || (q.question_number ? parseInt(q.question_number) + idx : idx + 1),
        userAnswer: (answers[answerKey] || '').trim(),
        correctAnswer,
        isCorrect,
      });
    });
  }
  return result;
}

function scoreNotesCompletionQuestion(q, answers, result) {
  const text = q.gap_fill.structured_text || '';
  const gapMatches = Array.from(text.matchAll(/\[(\d+)\]/g));

  if (gapMatches.length > 0) {
    gapMatches.forEach((match) => {
      result.total++;
      const gapNum = parseInt(match[1]);
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
  } else {
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
        questionNumber: q.question_number ? parseInt(String(q.question_number)) + i : i + 1,
        userAnswer: userAns,
        correctAnswer,
        isCorrect,
      });
    }
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

function scoreSentenceCompletionQuestion(q, answers, result) {
  const text = q.question_text || '';
  const blankCount = (text.match(/_____/g) || []).length || 1;

  let isSingleQuestion = false;
  if (q.question_number) {
    const qNumStr = String(q.question_number);
    const isRange = qNumStr.match(/(\d+)\s*-\s*(\d+)/);
    if (!isRange && qNumStr.match(/\d+/)) {
      isSingleQuestion = true;
    }
  }

  if (blankCount > 1) {
    if (isSingleQuestion) {
      result.total++;
      let correctBlanks = 0;

      for (let i = 0; i < blankCount; i++) {
        const answerKey = `${q.id}_blank_${i + 1}`;
        const correctAnswer = q.correct_answers?.[i] || '';
        if (isAnswerCorrect(answers[answerKey], correctAnswer)) {
          correctBlanks++;
        }

        result.details.push({
          questionId: answerKey,
          questionNumber: q.question_number,
          userAnswer: (answers[answerKey] || '').trim(),
          correctAnswer,
          isCorrect: isAnswerCorrect(answers[answerKey], correctAnswer),
        });
      }

      if (correctBlanks === blankCount) {
        result.correct++;
      }
    } else {
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
    return result;
  }
  return null;
}

function scoreMultiSelectMCQQuestion(q, answers, result) {
  let questionCount = 1;
  if (q.question_count) {
    questionCount = parseInt(String(q.question_count));
  } else if (q.question_number) {
    const qNumStr = String(q.question_number);
    const rangeMatch = qNumStr.match(/(\d+)\s*[-–—]\s*(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      questionCount = Math.max(1, end - start + 1);
    }
  } else if (q.allow_multiple) {
    questionCount = 2;
  }

  if (questionCount > 1) {
    result.total += questionCount;

    let userAnswers = [];
    const rawAnswer = answers[q.id];
    if (Array.isArray(rawAnswer)) {
      userAnswers = rawAnswer.map((a) => normalizeAnswer(a));
    } else if (rawAnswer) {
      let parsed = rawAnswer;
      try {
        if (typeof rawAnswer === 'string' && rawAnswer.trim().startsWith('[')) {
          parsed = JSON.parse(rawAnswer);
        }
      } catch {
        // Keep as string
      }

      if (Array.isArray(parsed)) {
        userAnswers = parsed.map((a) => normalizeAnswer(a));
      } else {
        userAnswers = String(rawAnswer)
          .split(/[,;]/)
          .map((a) => normalizeAnswer(a.trim()))
          .filter(Boolean);
      }
    }

    let correctAnswers = [];
    if (Array.isArray(q.correct_answer)) {
      correctAnswers = q.correct_answer.map((a) => normalizeAnswer(a));
    } else if (q.correct_answer) {
      let parsed = q.correct_answer;
      try {
        if (typeof q.correct_answer === 'string' && q.correct_answer.trim().startsWith('[')) {
          parsed = JSON.parse(q.correct_answer);
        }
      } catch {
        // Keep as string
      }

      if (Array.isArray(parsed)) {
        correctAnswers = parsed.map((a) => normalizeAnswer(a));
      } else {
        correctAnswers = String(q.correct_answer)
          .split(/[,;]/)
          .map((a) => normalizeAnswer(a.trim()))
          .filter(Boolean);
      }
    }

    const baseNum = q.question_number
      ? parseInt(String(q.question_number).match(/\d+/)?.[0]) || 1
      : 1;

    for (let i = 0; i < questionCount; i++) {
      const userAns = userAnswers[i] || '';
      const correctAns = correctAnswers[i] || '';
      const isCorrect = Boolean(userAns && correctAns && userAns === correctAns);

      if (isCorrect) result.correct++;
      result.details.push({
        questionId: `${q.id}_multi_${i}`,
        questionNumber: baseNum + i,
        userAnswer: userAnswers[i] || '',
        correctAnswer: correctAnswers[i] || '',
        isCorrect,
      });
    }
    return result;
  }
  return null;
}

export const scoreQuestion = (question, answers) => {
  const result = { total: 0, correct: 0, details: [] };
  const q = question;

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
    const scResult = scoreSentenceCompletionQuestion(q, answers, result);
    if (scResult) return scResult;
  }
  if (q.type === 'multiple_choice') {
    const mcqResult = scoreMultiSelectMCQQuestion(q, answers, result);
    if (mcqResult) return mcqResult;
  }

  // Standard single-answer question (MCQ, T/F/NG, Y/N/NG, etc.)
  result.total++;
  const userAnswer = (answers[q.id] || '').trim();
  const correctAnswer = q.correct_answer || '';
  const isCorrect = userAnswer === '' ? null : isAnswerCorrect(userAnswer, correctAnswer);

  if (isCorrect === true) result.correct++;
  result.details.push({
    questionId: q.id,
    questionNumber: q.question_number || '•',
    userAnswer,
    correctAnswer,
    isCorrect,
  });

  return result;
};

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

  // Score each question
  questions.forEach((q) => {
    const result = scoreQuestion(q, answers);
    const qType = q.type || 'multiple_choice';
    const parsedSection = Number.parseInt(String(q.section || '').match(/\d+/)?.[0], 10);
    const sectionIndex =
      sections.length <= 1
        ? 0
        : Math.max(
            0,
            sections.findIndex((section, index) => {
              const sectionNumber = Number(section.section_number || index + 1);
              return (
                (section.id && q.section_id === section.id) ||
                (Number.isFinite(parsedSection) && parsedSection === sectionNumber)
              );
            })
          );

    totalCorrect += result.correct;
    totalQuestions += result.total;

    // Aggregate type stats
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

  // Calculate percentage and band score
  const percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const bandScore = calculateBandScore(totalCorrect, totalQuestions);

  // Calculate section stats if sections provided
  const sectionStats = sections.map((section, idx) => {
    const sectionNum = section.section_number || idx + 1;

    // Find questions for this section
    const sectionQuestions = questions.filter((q) => {
      if (sections.length === 1) return true;
      if (q.section) {
        const parsed = parseInt(q.section.toString().match(/\d+/)?.[0]);
        return !isNaN(parsed) && parsed === sectionNum;
      }
      return false;
    });

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

  // Build answers map for answer sheet (keeps per-input details for UI validation)
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

  // Build userResponses with ONE entry per unique questionNumber
  // This is critical for the Quick Answer Key which iterates 1-40
  const questionNumberMap = new Map();

  allDetails.forEach((d) => {
    const qNum = d.questionNumber;
    const existing = questionNumberMap.get(qNum);

    if (!existing) {
      // First entry for this question number
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
      // Additional input for a grouped question - aggregate
      existing.allInputs.push({ userAnswer: d.userAnswer, isCorrect: d.isCorrect });
      // Combine user answers for display
      if (d.userAnswer) {
        existing.userAnswer = existing.userAnswer
          ? `${existing.userAnswer}, ${d.userAnswer}`
          : d.userAnswer;
      }
      // The isCorrect for the question is from isQuestionCorrect (already set)
    }
  });

  // Convert to array sorted by questionNumber
  const userResponses = Array.from(questionNumberMap.values()).sort((a, b) => {
    // Handle numeric and string question numbers
    const numA =
      typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(a.questionNumber) || 0;
    const numB =
      typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(b.questionNumber) || 0;
    return numA - numB;
  });

  return {
    correctAnswers: totalCorrect,
    totalQuestions,
    percentage: Math.round(percentage),
    bandScore,
    typeStats,
    sectionStats,
    correctAnswersMap,
    userResponses,
    responseDetails: allDetails.map((detail) => ({
      questionId: detail.questionId,
      questionNumber: detail.questionNumber,
      type: detail.type,
      sectionIndex: detail.sectionIndex,
      userAnswer: detail.userAnswer,
      correctAnswer: detail.correctAnswer,
      isCorrect: detail.isQuestionCorrect ?? detail.isCorrect,
    })),
  };
};
