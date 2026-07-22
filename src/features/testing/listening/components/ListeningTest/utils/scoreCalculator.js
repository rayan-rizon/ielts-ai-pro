/**
 * Listening Test Score Calculator
 *
 * Handles IELTS Listening test scoring with support for various question types.
 * Answer validation is delegated to the shared utility for performance and consistency.
 */

import { normalizeAnswer, isAnswerCorrect } from '@/lib/ieltsAnswerValidation';
import { calculateListeningBandScore as calculateListeningBandScoreFromRaw } from '@/lib/ieltsBandScore';

// Re-export for backward compatibility
export { normalizeAnswer, isAnswerCorrect };

/**
 * Calculate IELTS listening band score from raw score (scaled to 40 questions)
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total number of questions
 * @returns {number} IELTS band score (1.0-9.0)
 */
export const calculateListeningBandScore = calculateListeningBandScoreFromRaw;

/**
 * Calculate complete listening test results
 * @param {Array} questions - Questions with computed numbers
 * @param {Object} answers - User answers map
 * @param {Array} displaySections - Test sections (for section stats)
 * @returns {Object} Complete test results object
 */
/**
 * Calculate complete listening test results
 * @param {Array} questions - Questions with computed numbers
 * @param {Object} answers - User answers map
 * @param {Array} displaySections - Test sections (for section stats)
 * @returns {Object} Complete test results object
 */
function scoreGapFill(q, answers, answersMap, questionNum, size) {
  let correctCount = 0;
  const answerKeys = q.gap_fill?.answers ? Object.keys(q.gap_fill.answers) : [];

  if (answerKeys.length > 0) {
    answerKeys.forEach((key) => {
      const userAnswer = answers[`${q.id}_${key}`] || '';
      const correct = q.gap_fill.answers[key] || '';
      const isCorrect = isAnswerCorrect(userAnswer, correct);

      if (isCorrect) correctCount++;

      const displayNum = parseInt(questionNum) + parseInt(key);
      answersMap[`${q.id}_${key}`] = {
        questionNumber: displayNum,
        userAnswer,
        correctAnswer: correct,
        isCorrect,
      };
    });
  } else {
    for (let i = 0; i < size; i++) {
      const key = i.toString();
      const userAnswer = answers[`${q.id}_${key}`] || answers[`${q.id}_${i + 1}`] || '';
      const displayNum = parseInt(questionNum) + i;

      answersMap[`${q.id}_${key}`] = {
        questionNumber: displayNum,
        userAnswer,
        correctAnswer: '—',
        isCorrect: false,
      };
    }
  }
  return correctCount;
}

function scoreFlowchart(q, answers, answersMap, questionNum, size) {
  let correctCount = 0;
  const fc = q.flowchart;
  const fcAnswers = fc?.answers || {};
  const steps = fc?.steps || [];

  let totalGaps = 0;
  steps.forEach((step) => {
    const gapCount = (step.text?.match(/\[gap\]/g) || []).length;
    totalGaps += gapCount || step.gap_numbers?.length || 0;
  });

  const answerKeys = Object.keys(fcAnswers);
  if (answerKeys.length > 0) {
    answerKeys.forEach((key) => {
      const gapIdx = parseInt(key);
      const userAnswer = answers[`${q.id}_${gapIdx}`] || '';
      const correct = fcAnswers[key] || '';
      const isCorrect = isAnswerCorrect(userAnswer, correct);

      if (isCorrect) correctCount++;

      const displayNum = parseInt(questionNum) + gapIdx;
      answersMap[`${q.id}_${gapIdx}`] = {
        questionNumber: displayNum,
        userAnswer,
        correctAnswer: correct,
        isCorrect,
      };
    });
  } else if (totalGaps > 0) {
    for (let i = 0; i < totalGaps; i++) {
      const userAnswer = answers[`${q.id}_${i}`] || '';
      const displayNum = parseInt(questionNum) + i;

      answersMap[`${q.id}_${i}`] = {
        questionNumber: displayNum,
        userAnswer,
        correctAnswer: '—',
        isCorrect: false,
      };
    }
  } else {
    for (let i = 0; i < size; i++) {
      answersMap[`${q.id}_${i}`] = {
        questionNumber: parseInt(questionNum) + i,
        userAnswer: '',
        correctAnswer: '—',
        isCorrect: false,
      };
    }
  }
  return correctCount;
}

function scoreTableCompletion(q, answers, answersMap, questionNum, size) {
  let correctCount = 0;
  const tableRows = q.table_data?.table_rows || q.table_data?.rows || [];
  const blanks = q.table_data?.blank_positions || q.table_data?.blanks || [];
  const sortedBlanks = [...blanks].sort((a, b) => (a.blankNumber || 0) - (b.blankNumber || 0));

  let gapIndex = 0;
  tableRows.forEach((row) => {
    row.forEach((cell) => {
      const cellStr = String(cell || '');
      const cellMatches = cellStr.match(/\[gap\]|__BLANK__|__BLANK_\d+__/gi) || [];

      cellMatches.forEach(() => {
        const ansKey = `${q.id}_${gapIndex}`;
        const userAnswer = answers[ansKey] || '';
        const blankMeta = sortedBlanks[gapIndex];
        const correctAns = blankMeta?.answer || q.table_data?.answers?.[gapIndex] || '';

        const isCorrect = isAnswerCorrect(userAnswer, correctAns);
        if (isCorrect) correctCount++;

        const displayNum = parseInt(questionNum) + gapIndex;
        answersMap[ansKey] = {
          questionNumber: displayNum,
          userAnswer,
          correctAnswer: correctAns,
          isCorrect,
        };
        gapIndex++;
      });
    });
  });

  if (gapIndex === 0 && size > 0) {
    for (let i = 0; i < size; i++) {
      const dummyKey = `${q.id}_${i}`;
      answersMap[dummyKey] = {
        questionNumber: parseInt(questionNum) + i,
        userAnswer: '',
        correctAnswer: '—',
        isCorrect: false,
      };
    }
  }
  return correctCount;
}

function scoreMatchingFeatures(q, answers, answersMap, questionNum, size) {
  let correctCount = 0;
  const subQuestions = q.matching_features?.questions || [];

  if (subQuestions.length > 0) {
    subQuestions.forEach((subQ, idx) => {
      const qId = subQ.id || `${q.id}_${idx}`;
      const userAnswer = answers[qId] || '';
      const correctAns = subQ.answer || q.matching_features?.answers?.[qId] || '';

      const isCorrect = isAnswerCorrect(userAnswer, correctAns);
      if (isCorrect) correctCount++;

      const displayNum = parseInt(questionNum) + idx;
      answersMap[qId] = {
        questionNumber: displayNum,
        userAnswer,
        correctAnswer: correctAns,
        isCorrect,
      };
    });
  } else {
    for (let i = 0; i < size; i++) {
      const dummyKey = `${q.id}_${i}`;
      answersMap[dummyKey] = {
        questionNumber: parseInt(questionNum) + i,
        userAnswer: '',
        correctAnswer: '—',
        isCorrect: false,
      };
    }
  }
  return correctCount;
}

function scoreMapLabeling(q, answers, answersMap, questionNum, size) {
  let correctCount = 0;
  const subQuestions = q.map_labeling?.questions || [];
  if (subQuestions.length > 0) {
    subQuestions.forEach((subQ, idx) => {
      const qNum = subQ.questionNumber || questionNum + idx;
      const qId = `map_${q.id}_${qNum}`;
      const userAnswer = answers[qId] || '';
      const correctAns = subQ.answer || '';

      const isCorrect = isAnswerCorrect(userAnswer, correctAns);
      if (isCorrect) correctCount++;

      answersMap[qId] = {
        questionNumber: qNum,
        userAnswer,
        correctAnswer: correctAns,
        isCorrect,
      };
    });
  } else {
    for (let i = 0; i < size; i++) {
      const dummyKey = `map_${q.id}_${parseInt(questionNum) + i}`;
      answersMap[dummyKey] = {
        questionNumber: parseInt(questionNum) + i,
        userAnswer: '',
        correctAnswer: '—',
        isCorrect: false,
      };
    }
  }
  return correctCount;
}

function scoreMultipleChoiceMulti(q, answers, answersMap, size) {
  let correctCount = 0;
  const userAns = answers[q.id] || [];
  let rawCorrect = q.correct_answer;

  if (typeof rawCorrect === 'string') {
    try {
      const parsed = JSON.parse(rawCorrect);
      if (Array.isArray(parsed)) rawCorrect = parsed;
      else rawCorrect = rawCorrect.split(',');
    } catch {
      rawCorrect = rawCorrect.split(',');
    }
  }

  const correctAnswers = Array.isArray(rawCorrect) ? rawCorrect.map((a) => normalizeAnswer(a)) : [];
  const userAnswers = Array.isArray(userAns) ? userAns.map((a) => normalizeAnswer(a)) : [];

  const matchedCorrectAnswers = new Set();
  userAnswers.forEach((userSelection) => {
    if (correctAnswers.includes(userSelection) && !matchedCorrectAnswers.has(userSelection)) {
      matchedCorrectAnswers.add(userSelection);
    }
  });

  correctCount += matchedCorrectAnswers.size;

  for (let idx = 0; idx < size; idx++) {
    const correctAns = correctAnswers[idx] || '';
    const wasMatched = matchedCorrectAnswers.has(correctAns);

    let userDisplay = '(not selected)';
    if (wasMatched) {
      userDisplay = correctAns.toUpperCase();
    } else if (userAnswers[idx]) {
      userDisplay = userAnswers[idx].toUpperCase();
    }

    const displayNum = q._displayStartNumber + idx;
    answersMap[`${q.id}_option_${idx}`] = {
      questionNumber: displayNum,
      userAnswer: userDisplay,
      correctAnswer: correctAns ? correctAns.toUpperCase() : '—',
      isCorrect: wasMatched,
    };
  }
  return correctCount;
}

function scoreSingleQuestion(q, answers, answersMap) {
  let correctCount = 0;
  const userAnswer = answers[q.id] || '';

  if (q.correct_answer) {
    const isCorrect = isAnswerCorrect(userAnswer, q.correct_answer);
    if (isCorrect) correctCount++;

    answersMap[q.id] = {
      questionNumber:
        q._displaySize > 1
          ? `${q._displayStartNumber}-${q._displayEndNumber}`
          : `${q._displayStartNumber}`,
      userAnswer: Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer,
      correctAnswer: Array.isArray(q.correct_answer)
        ? q.correct_answer.join(', ')
        : q.correct_answer,
      isCorrect,
    };
  } else {
    answersMap[q.id] = {
      questionNumber: `${q._displayStartNumber}`,
      userAnswer: userAnswer || '',
      correctAnswer: '—',
      isCorrect: false,
    };
  }
  return correctCount;
}

export const calculateListeningTestResults = (questions, answers, displaySections = []) => {
  let correctCount = 0;
  const answersMap = {};

  questions.forEach((q) => {
    const questionNum = q._displayStartNumber || q.question_number;
    const size = q._displaySize || 1;

    if (
      q.type === 'gap_fill' ||
      q.type === 'notes_completion' ||
      q.type === 'sentence_completion'
    ) {
      correctCount += scoreGapFill(q, answers, answersMap, questionNum, size);
    } else if (q.type === 'flowchart') {
      correctCount += scoreFlowchart(q, answers, answersMap, questionNum, size);
    } else if (q.type === 'table_completion') {
      correctCount += scoreTableCompletion(q, answers, answersMap, questionNum, size);
    } else if (q.type === 'matching_features') {
      correctCount += scoreMatchingFeatures(q, answers, answersMap, questionNum, size);
    } else if (q.type === 'map_labeling') {
      correctCount += scoreMapLabeling(q, answers, answersMap, questionNum, size);
    } else if (q.type === 'multiple_choice' && q.allow_multiple) {
      correctCount += scoreMultipleChoiceMulti(q, answers, answersMap, size);
    } else {
      correctCount += scoreSingleQuestion(q, answers, answersMap);
    }
  });

  const totalScoredItems = Object.keys(answersMap).length;
  const percentage = totalScoredItems > 0 ? (correctCount / totalScoredItems) * 100 : 0;
  const bandScore = calculateListeningBandScore(correctCount, totalScoredItems);

  // Section Stats
  const sectionStats = displaySections.map((section, idx) => {
    const sectionNum = section.section_number || idx + 1;
    const sectionQuestions = questions.filter((q) => {
      if (section.id && q.section_id === section.id) return true;
      if (q.section !== undefined && parseInt(q.section) === sectionNum) return true;
      if (q.part_number === sectionNum) return true;
      return false;
    });

    let sectionCorrect = 0;
    let sectionTotal = 0;

    sectionQuestions.forEach((q) => {
      const qKeys = Object.keys(answersMap).filter(
        (key) =>
          key === String(q.id) || key.startsWith(`${q.id}_`) || key.startsWith(`map_${q.id}_`)
      );

      // If keys found, use them
      if (qKeys.length > 0) {
        qKeys.forEach((key) => {
          sectionTotal++;
          if (answersMap[key].isCorrect) sectionCorrect++;
        });
      } else {
        // FALLBACK: If we couldn't map answers but we know the question exists
        // We should add its size to the total so denominator is correct
        // (Though correct will be 0)
        sectionTotal += q._displaySize || 1;
      }
    });

    return {
      title: section.title || `Part ${idx + 1}`,
      correct: sectionCorrect,
      total: sectionTotal,
      percentage: sectionTotal > 0 ? Math.round((sectionCorrect / sectionTotal) * 100) : 0,
    };
  });

  // Type Stats
  const typeStats = {};
  questions.forEach((q) => {
    const type = q.type || 'unknown';
    if (!typeStats[type]) {
      typeStats[type] = { correct: 0, total: 0 };
    }

    const qKeys = Object.keys(answersMap).filter(
      (key) => key === String(q.id) || key.startsWith(`${q.id}_`) || key.startsWith(`map_${q.id}_`)
    );

    if (qKeys.length > 0) {
      qKeys.forEach((key) => {
        typeStats[type].total++;
        if (answersMap[key].isCorrect) typeStats[type].correct++;
      });
    } else {
      // Fallback for denominator
      typeStats[type].total += q._displaySize || 1;
    }
  });

  // Calculate errorPatterns for cognitive insights
  const unansweredCount = Object.values(answersMap).filter(
    (entry) => !entry.userAnswer || entry.userAnswer === '' || entry.userAnswer === '(not selected)'
  ).length;

  // Get trouble types sorted by accuracy (worst first)
  const troubleTypes = Object.entries(typeStats)
    .map(([type, stats]) => ({
      type,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map((t) => t.type);

  // Calculate confidence index (based on completion rate)
  const answeredCount = totalScoredItems - unansweredCount;
  const confidenceIndex =
    totalScoredItems > 0 ? Math.round((answeredCount / totalScoredItems) * 100) : 0;

  const errorPatterns = {
    unansweredCount,
    troubleTypes,
    nearMissCount: 0, // Not tracked in listening
    changedAnswers: 0, // Not tracked
    totalAnswerChanges: 0, // Not tracked
    confidenceIndex,
    indecisionScore: 0, // Not tracked
  };

  const responseDetails = questions.flatMap((question) => {
    const type = question.type || 'unknown';
    const sectionIndex = Math.max(
      0,
      displaySections.findIndex((section, index) => {
        const sectionNumber = Number(section.section_number || index + 1);
        return (
          (section.id && question.section_id === section.id) ||
          Number(question.section) === sectionNumber ||
          Number(question.part_number) === sectionNumber
        );
      })
    );
    const questionId = String(question.id);
    const keys = Object.keys(answersMap).filter(
      (key) =>
        key === questionId ||
        key.startsWith(`${questionId}_`) ||
        key.startsWith(`map_${questionId}_`)
    );

    return keys.map((key) => ({
      questionId: key,
      questionNumber: answersMap[key].questionNumber,
      type,
      sectionIndex,
      userAnswer: answersMap[key].userAnswer,
      correctAnswer: answersMap[key].correctAnswer,
      isCorrect: answersMap[key].isCorrect,
    }));
  });

  return {
    correctAnswers: correctCount,
    totalQuestions:
      totalScoredItems > 0
        ? totalScoredItems
        : questions.reduce((acc, q) => acc + (q._displaySize || 1), 0),
    percentage: Math.round(percentage),
    bandScore,
    sectionStats,
    typeStats,
    answersMap,
    responseDetails,
    errorPatterns,
  };
};
