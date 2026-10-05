/**
 * Listening Test Score Calculator
 *
 * Handles IELTS Listening test scoring with support for various question types.
 * Answer validation is delegated to the shared utility for performance and consistency.
 */

import { normalizeAnswer, isAnswerCorrect } from './answerValidation.js';
import { calculateListeningBandScore as calculateListeningBandScoreFromRaw } from './bandScore.js';
import { percentOf, standardizeResponseDetails } from './resultEvidence.js';

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
 * Helper to populate dummy empty answer placeholders when question sub-data is missing.
 */
function fillDummyAnswers({ q, answersMap, questionNum, size, keyPrefix = '' }) {
  const baseNum = parseInt(questionNum, 10) || 0;
  for (let i = 0; i < size; i++) {
    const key = keyPrefix ? `${keyPrefix}_${q.id}_${baseNum + i}` : `${q.id}_${i}`;
    answersMap[key] = {
      questionNumber: baseNum + i,
      userAnswer: '',
      correctAnswer: '—',
      isCorrect: false,
    };
  }
}

function scoreGapFillKeys({ q, answers, answersMap, answerKeys, baseNum }) {
  let correctCount = 0;
  answerKeys.forEach((key) => {
    const userAnswer = answers[`${q.id}_${key}`] || '';
    const correct = q.gap_fill.answers[key] || '';
    const isCorrect = isAnswerCorrect(userAnswer, correct);

    if (isCorrect) correctCount++;

    const displayNum = baseNum + parseInt(key, 10);
    answersMap[`${q.id}_${key}`] = {
      questionNumber: displayNum,
      userAnswer,
      correctAnswer: correct,
      isCorrect,
    };
  });
  return correctCount;
}

function scoreGapFillFallback({ q, answers, answersMap, baseNum, size }) {
  for (let i = 0; i < size; i++) {
    const key = i.toString();
    const userAnswer = answers[`${q.id}_${key}`] || answers[`${q.id}_${i + 1}`] || '';
    answersMap[`${q.id}_${key}`] = {
      questionNumber: baseNum + i,
      userAnswer,
      correctAnswer: '—',
      isCorrect: false,
    };
  }
  return 0;
}

/**
 * Score gap fill, notes completion, and sentence completion question types.
 */
function scoreGapFill({ q, answers, answersMap, questionNum, size }) {
  const answerKeys = q.gap_fill?.answers ? Object.keys(q.gap_fill.answers) : [];
  const baseNum = parseInt(questionNum, 10) || 0;

  if (answerKeys.length > 0) {
    return scoreGapFillKeys({ q, answers, answersMap, answerKeys, baseNum });
  }
  return scoreGapFillFallback({ q, answers, answersMap, baseNum, size });
}

function calculateTotalGaps(steps) {
  let totalGaps = 0;
  steps.forEach((step) => {
    const gapCount = (step.text?.match(/\[gap\]/g) || []).length;
    totalGaps += gapCount || step.gap_numbers?.length || 0;
  });
  return totalGaps;
}

function scoreFlowchartAnswers({ q, answers, answersMap, fcAnswers, baseNum }) {
  let correctCount = 0;
  Object.keys(fcAnswers).forEach((key) => {
    const gapIdx = parseInt(key, 10);
    const userAnswer = answers[`${q.id}_${gapIdx}`] || '';
    const correct = fcAnswers[key] || '';
    const isCorrect = isAnswerCorrect(userAnswer, correct);

    if (isCorrect) correctCount++;

    answersMap[`${q.id}_${gapIdx}`] = {
      questionNumber: baseNum + gapIdx,
      userAnswer,
      correctAnswer: correct,
      isCorrect,
    };
  });
  return correctCount;
}

function scoreFlowchartEmptyGaps({ q, answers, answersMap, totalGaps, baseNum }) {
  for (let i = 0; i < totalGaps; i++) {
    answersMap[`${q.id}_${i}`] = {
      questionNumber: baseNum + i,
      userAnswer: answers[`${q.id}_${i}`] || '',
      correctAnswer: '—',
      isCorrect: false,
    };
  }
}

/**
 * Score flowchart question type.
 */
function scoreFlowchart({ q, answers, answersMap, questionNum, size }) {
  const fc = q.flowchart;
  const fcAnswers = fc?.answers || {};
  const steps = fc?.steps || [];
  const baseNum = parseInt(questionNum, 10) || 0;
  const totalGaps = calculateTotalGaps(steps);

  const answerKeys = Object.keys(fcAnswers);
  if (answerKeys.length > 0) {
    return scoreFlowchartAnswers({ q, answers, answersMap, fcAnswers, baseNum });
  }
  if (totalGaps > 0) {
    scoreFlowchartEmptyGaps({ q, answers, answersMap, totalGaps, baseNum });
    return 0;
  }

  fillDummyAnswers({ q, answersMap, questionNum: baseNum, size });
  return 0;
}

function processSingleCellMatch(opts) {
  const { q, answers, answersMap, sortedBlanks, baseNum, gapIndex } = opts;
  const ansKey = `${q.id}_${gapIndex}`;
  const userAnswer = answers[ansKey] || '';
  const blankMeta = sortedBlanks[gapIndex];
  const correctAns = blankMeta?.answer || q.table_data?.answers?.[gapIndex] || '';

  const isCorrect = isAnswerCorrect(userAnswer, correctAns);

  answersMap[ansKey] = {
    questionNumber: baseNum + gapIndex,
    userAnswer,
    correctAnswer: correctAns,
    isCorrect,
  };
  return isCorrect ? 1 : 0;
}

function evaluateTableCellMatches({ q, answers, answersMap, sortedBlanks, baseNum }) {
  let correctCount = 0;
  let gapIndex = 0;
  const tableRows = q.table_data?.table_rows || q.table_data?.rows || [];

  tableRows.forEach((row) => {
    row.forEach((cell) => {
      const cellStr = String(cell || '');
      const cellMatches = cellStr.match(/\[gap\]|__BLANK__|__BLANK_\d+__/gi) || [];

      cellMatches.forEach(() => {
        correctCount += processSingleCellMatch({
          q,
          answers,
          answersMap,
          sortedBlanks,
          baseNum,
          gapIndex,
        });
        gapIndex++;
      });
    });
  });

  return { correctCount, gapIndex };
}

/**
 * Score table completion question type.
 */
function scoreTableCompletion({ q, answers, answersMap, questionNum, size }) {
  const blanks = q.table_data?.blank_positions || q.table_data?.blanks || [];
  const sortedBlanks = [...blanks].sort((a, b) => (a.blankNumber || 0) - (b.blankNumber || 0));
  const baseNum = parseInt(questionNum, 10) || 0;

  const { correctCount, gapIndex } = evaluateTableCellMatches({
    q,
    answers,
    answersMap,
    sortedBlanks,
    baseNum,
  });

  if (gapIndex === 0 && size > 0) {
    fillDummyAnswers({ q, answersMap, questionNum: baseNum, size });
  }
  return correctCount;
}

function scoreSubQuestionItem(opts) {
  const { subQ, idx, q, answers, answersMap, baseNum, keyPrefix } = opts;
  const qNum = subQ.questionNumber || baseNum + idx;
  const qId = keyPrefix ? `${keyPrefix}_${q.id}_${qNum}` : subQ.id || `${q.id}_${idx}`;
  const userAnswer = answers[qId] || '';
  const correctAns = subQ.answer || q.matching_features?.answers?.[qId] || '';

  const isCorrect = isAnswerCorrect(userAnswer, correctAns);
  answersMap[qId] = {
    questionNumber: qNum,
    userAnswer,
    correctAnswer: correctAns,
    isCorrect,
  };
  return isCorrect ? 1 : 0;
}

/**
 * Score matching features question type.
 */
function scoreMatchingFeatures({ q, answers, answersMap, questionNum, size }) {
  const subQuestions = q.matching_features?.questions || [];
  const baseNum = parseInt(questionNum, 10) || 0;

  if (subQuestions.length > 0) {
    let correctCount = 0;
    subQuestions.forEach((subQ, idx) => {
      correctCount += scoreSubQuestionItem({
        subQ,
        idx,
        q,
        answers,
        answersMap,
        baseNum,
        keyPrefix: '',
      });
    });
    return correctCount;
  }

  fillDummyAnswers({ q, answersMap, questionNum: baseNum, size });
  return 0;
}

/**
 * Score map labeling question type.
 */
function scoreMapLabeling({ q, answers, answersMap, questionNum, size }) {
  const subQuestions = q.map_labeling?.questions || [];
  const baseNum = parseInt(questionNum, 10) || 0;

  if (subQuestions.length > 0) {
    let correctCount = 0;
    subQuestions.forEach((subQ, idx) => {
      correctCount += scoreSubQuestionItem({
        subQ,
        idx,
        q,
        answers,
        answersMap,
        baseNum,
        keyPrefix: 'map',
      });
    });
    return correctCount;
  }

  fillDummyAnswers({ q, answersMap, questionNum: baseNum, size, keyPrefix: 'map' });
  return 0;
}

function parseMultiChoiceAnswerList(rawAnswer) {
  if (typeof rawAnswer === 'string') {
    try {
      const parsed = JSON.parse(rawAnswer);
      if (Array.isArray(parsed)) return parsed;
      return rawAnswer.split(',');
    } catch {
      return rawAnswer.split(',');
    }
  }
  return Array.isArray(rawAnswer) ? rawAnswer : [];
}

function scoreMultiOptionRow(opts) {
  const { idx, q, correctAnswers, matchedCorrectAnswers, unmatchedSelections, answersMap } = opts;
  const correctAns = correctAnswers[idx] || '';
  const wasMatched = matchedCorrectAnswers.has(correctAns);

  // A row the learner did not earn shows one of their *other* picks, so a
  // correct pick is never displayed twice and a wrong pick is never hidden.
  let userDisplay = '(not selected)';
  if (wasMatched) {
    userDisplay = correctAns.toUpperCase();
  } else if (unmatchedSelections.length > 0) {
    userDisplay = unmatchedSelections.shift().toUpperCase();
  }

  const displayNum = q._displayStartNumber + idx;
  answersMap[`${q.id}_option_${idx}`] = {
    questionNumber: displayNum,
    userAnswer: userDisplay,
    correctAnswer: correctAns ? correctAns.toUpperCase() : '—',
    isCorrect: wasMatched,
  };
}

/**
 * Score multiple choice question with multiple selections allowed.
 */
function scoreMultipleChoiceMulti({ q, answers, answersMap, size }) {
  const userAns = answers[q.id] || [];
  const rawCorrect = parseMultiChoiceAnswerList(q.correct_answer);

  const correctAnswers = rawCorrect.map((a) => normalizeAnswer(a));
  const userAnswers = Array.isArray(userAns) ? userAns.map((a) => normalizeAnswer(a)) : [];

  const matchedCorrectAnswers = new Set();
  userAnswers.forEach((userSelection) => {
    if (correctAnswers.includes(userSelection) && !matchedCorrectAnswers.has(userSelection)) {
      matchedCorrectAnswers.add(userSelection);
    }
  });

  const unmatchedSelections = [...new Set(userAnswers.filter(Boolean))].filter(
    (selection) => !matchedCorrectAnswers.has(selection)
  );

  for (let idx = 0; idx < size; idx++) {
    scoreMultiOptionRow({
      idx,
      q,
      correctAnswers,
      matchedCorrectAnswers,
      unmatchedSelections,
      answersMap,
    });
  }
  return matchedCorrectAnswers.size;
}

function formatSingleQuestionNumber(q) {
  return q._displaySize > 1
    ? `${q._displayStartNumber}-${q._displayEndNumber}`
    : `${q._displayStartNumber}`;
}

/**
 * Score single answer question.
 */
function scoreSingleQuestion({ q, answers, answersMap }) {
  const userAnswer = answers[q.id] || '';

  if (q.correct_answer) {
    const isCorrect = isAnswerCorrect(userAnswer, q.correct_answer);
    answersMap[q.id] = {
      questionNumber: formatSingleQuestionNumber(q),
      userAnswer: Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer,
      correctAnswer: Array.isArray(q.correct_answer)
        ? q.correct_answer.join(', ')
        : q.correct_answer,
      isCorrect,
    };
    return isCorrect ? 1 : 0;
  }

  answersMap[q.id] = {
    questionNumber: `${q._displayStartNumber}`,
    userAnswer: userAnswer || '',
    correctAnswer: '—',
    isCorrect: false,
  };
  return 0;
}

/**
 * Check if a question belongs to a test section.
 */
function isQuestionInSection(q, section, idx) {
  const sectionNum = Number(section.section_number || idx + 1);
  if (section.id && q.section_id === section.id) return true;
  if (q.section !== undefined && parseInt(q.section, 10) === sectionNum) return true;
  return Number(q.part_number) === sectionNum;
}

function dispatchQuestionScoring(ctx) {
  const { q } = ctx;
  const GAP_TYPES = ['gap_fill', 'notes_completion', 'sentence_completion'];

  if (GAP_TYPES.includes(q.type)) return scoreGapFill(ctx);
  if (q.type === 'flowchart') return scoreFlowchart(ctx);
  if (q.type === 'table_completion') return scoreTableCompletion(ctx);
  if (q.type === 'matching_features') return scoreMatchingFeatures(ctx);
  if (q.type === 'map_labeling') return scoreMapLabeling(ctx);
  if (q.type === 'multiple_choice' && q.allow_multiple) return scoreMultipleChoiceMulti(ctx);
  return scoreSingleQuestion(ctx);
}

function calculateSectionStats(displaySections, questions, answersMap, keysByQuestion) {
  return displaySections.map((section, idx) => {
    const sectionQuestions = questions.filter((q) => isQuestionInSection(q, section, idx));
    let sectionCorrect = 0;
    let sectionTotal = 0;

    sectionQuestions.forEach((q) => {
      const qKeys = keysByQuestion.get(q) || [];

      if (qKeys.length > 0) {
        qKeys.forEach((key) => {
          sectionTotal++;
          if (answersMap[key].isCorrect) sectionCorrect++;
        });
      } else {
        sectionTotal += q._displaySize || 1;
      }
    });

    return {
      title: section.title || `Part ${idx + 1}`,
      correct: sectionCorrect,
      total: sectionTotal,
      percentage: percentOf(sectionCorrect, sectionTotal),
    };
  });
}

function calculateTypeStats(questions, answersMap, keysByQuestion) {
  const typeStats = {};
  questions.forEach((q) => {
    const type = q.type || 'unknown';
    if (!typeStats[type]) {
      typeStats[type] = { correct: 0, total: 0 };
    }

    const qKeys = keysByQuestion.get(q) || [];

    if (qKeys.length > 0) {
      qKeys.forEach((key) => {
        typeStats[type].total++;
        if (answersMap[key].isCorrect) typeStats[type].correct++;
      });
    } else {
      typeStats[type].total += q._displaySize || 1;
    }
  });
  return typeStats;
}

function calculateErrorPatterns(answersMap, typeStats, totalScoredItems) {
  const unansweredCount = Object.values(answersMap).filter(
    (entry) => !entry.userAnswer || entry.userAnswer === '' || entry.userAnswer === '(not selected)'
  ).length;

  const troubleTypes = Object.entries(typeStats)
    .map(([type, stats]) => ({
      type,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map((t) => t.type);

  const answeredCount = totalScoredItems - unansweredCount;
  const confidenceIndex =
    totalScoredItems > 0 ? Math.round((answeredCount / totalScoredItems) * 100) : 0;

  return {
    unansweredCount,
    troubleTypes,
    nearMissCount: 0,
    changedAnswers: 0,
    totalAnswerChanges: 0,
    confidenceIndex,
    indecisionScore: 0,
  };
}

function buildResponseDetails(
  questions,
  displaySections,
  answersMap,
  keysByQuestion,
  flaggedQuestions
) {
  const details = questions.flatMap((question) => {
    const type = question.type || 'unknown';
    const sectionIndex = Math.max(
      0,
      displaySections.findIndex((section, index) => isQuestionInSection(question, section, index))
    );
    const keys = keysByQuestion.get(question) || [];

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

  return standardizeResponseDetails(details, flaggedQuestions);
}

/**
 * Calculate complete listening test results
 * @param {Array} questions - Questions with computed numbers
 * @param {Object} answers - User answers map
 * @param {Array} displaySections - Test sections (for section stats)
 * @returns {Object} Complete test results object
 */
export const calculateListeningTestResults = (
  questions,
  answers,
  displaySections = [],
  flaggedQuestions = null
) => {
  let correctCount = 0;
  const answersMap = {};
  // Each scorer appends its items to answersMap; record exactly which keys a
  // question produced. Matching-features items are keyed by their own ids
  // (e.g. `mq_17`), so attributing keys by a `${q.id}_` prefix silently
  // dropped them from the type, section and per-question breakdowns.
  const keysByQuestion = new Map();

  questions.forEach((q) => {
    const questionNum = q._displayStartNumber || q.question_number;
    const size = q._displaySize || 1;
    const ctx = { q, answers, answersMap, questionNum, size };
    const keyCountBefore = Object.keys(answersMap).length;
    correctCount += dispatchQuestionScoring(ctx);
    keysByQuestion.set(q, Object.keys(answersMap).slice(keyCountBefore));
  });

  const totalScoredItems = Object.keys(answersMap).length;
  const bandScore = calculateListeningBandScore(correctCount, totalScoredItems);

  const sectionStats = calculateSectionStats(
    displaySections,
    questions,
    answersMap,
    keysByQuestion
  );
  const typeStats = calculateTypeStats(questions, answersMap, keysByQuestion);
  const errorPatterns = calculateErrorPatterns(answersMap, typeStats, totalScoredItems);
  const responseDetails = buildResponseDetails(
    questions,
    displaySections,
    answersMap,
    keysByQuestion,
    flaggedQuestions
  );

  return {
    correctAnswers: correctCount,
    totalQuestions:
      totalScoredItems > 0
        ? totalScoredItems
        : questions.reduce((acc, q) => acc + (q._displaySize || 1), 0),
    percentage: percentOf(correctCount, totalScoredItems),
    bandScore,
    sectionStats,
    typeStats,
    answersMap,
    responseDetails,
    errorPatterns,
  };
};
