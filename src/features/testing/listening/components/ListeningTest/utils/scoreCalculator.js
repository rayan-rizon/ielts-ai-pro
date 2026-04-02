/**
 * Listening Test Score Calculator
 *
 * Handles IELTS Listening test scoring with support for various question types.
 * Answer validation is delegated to the shared utility for performance and consistency.
 */

import { normalizeAnswer, isAnswerCorrect } from '@/lib/ieltsAnswerValidation';

// Re-export for backward compatibility
export { normalizeAnswer, isAnswerCorrect };

/**
 * Calculate IELTS listening band score from raw score (scaled to 40 questions)
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total number of questions
 * @returns {number} IELTS band score (1.0-9.0)
 */
export const calculateListeningBandScore = (correct, total) => {
  if (total === 0 || correct < 1) return 0;

  // Official IELTS Listening Band Score Calculator (Academic & General Training)
  // Based on raw score scaled to 40
  const rawScore40 = (correct / total) * 40;

  if (rawScore40 >= 39) return 9.0;
  if (rawScore40 >= 37) return 8.5;
  if (rawScore40 >= 35) return 8.0;
  if (rawScore40 >= 32) return 7.5;
  if (rawScore40 >= 30) return 7.0;
  if (rawScore40 >= 26) return 6.5;
  if (rawScore40 >= 23) return 6.0;
  if (rawScore40 >= 18) return 5.5;
  if (rawScore40 >= 16) return 5.0;
  if (rawScore40 >= 13) return 4.5;
  if (rawScore40 >= 11) return 4.0;
  if (rawScore40 >= 10) return 3.5;
  if (rawScore40 >= 6) return 3.0;
  if (rawScore40 >= 4) return 2.5;
  if (rawScore40 >= 2) return 2.0;
  if (rawScore40 >= 1) return 1.0;
  return 0;
};

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
export const calculateListeningTestResults = (questions, answers, displaySections = []) => {
  let correctCount = 0;
  const answersMap = {};

  questions.forEach((q) => {
    const questionNum = q._displayStartNumber || q.question_number;
    const size = q._displaySize || 1;

    // --- GAP FILL, NOTES, SENTENCE COMPLETION ---
    if (
      q.type === 'gap_fill' ||
      q.type === 'notes_completion' ||
      q.type === 'sentence_completion'
    ) {
      // Determine the expected answer keys
      const answerKeys = q.gap_fill?.answers ? Object.keys(q.gap_fill.answers) : [];

      // If we have explicit answer keys, iterate them
      if (answerKeys.length > 0) {
        answerKeys.forEach((key) => {
          const userAnswer = answers[`${q.id}_${key}`] || '';
          const correct = q.gap_fill.answers[key] || '';
          const isCorrect = isAnswerCorrect(userAnswer, correct);

          if (isCorrect) correctCount++;

          const displayNum = parseInt(questionNum) + parseInt(key);
          answersMap[`${q.id}_${key}`] = {
            questionNumber: displayNum,
            userAnswer: userAnswer,
            correctAnswer: correct,
            isCorrect: isCorrect,
          };
        });
      } else {
        // FALLBACK: If structure is missing but we know the size, assume linear numbering
        // This prevents "0 questions" count
        for (let i = 0; i < size; i++) {
          const key = i.toString(); // Guessing key format 0, 1, 2...
          // Try multiple key formats for user answers just in case
          const userAnswer = answers[`${q.id}_${key}`] || answers[`${q.id}_${i + 1}`] || '';
          const displayNum = parseInt(questionNum) + i;

          answersMap[`${q.id}_${key}`] = {
            questionNumber: displayNum,
            userAnswer: userAnswer,
            correctAnswer: '—', // Cannot determine without data
            isCorrect: false,
          };
        }
      }
    }
    // --- FLOWCHART ---
    else if (q.type === 'flowchart') {
      const fc = q.flowchart;
      const fcAnswers = fc?.answers || {};
      const steps = fc?.steps || [];

      // Count total gaps in all steps
      let totalGaps = 0;
      steps.forEach((step) => {
        const gapCount = (step.text?.match(/\[gap\]/g) || []).length;
        totalGaps += gapCount || step.gap_numbers?.length || 0;
      });

      // Use explicit answers if available
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
            userAnswer: userAnswer,
            correctAnswer: correct,
            isCorrect: isCorrect,
          };
        });
      } else if (totalGaps > 0) {
        // Fallback: iterate through gaps sequentially
        for (let i = 0; i < totalGaps; i++) {
          const userAnswer = answers[`${q.id}_${i}`] || '';
          const displayNum = parseInt(questionNum) + i;

          answersMap[`${q.id}_${i}`] = {
            questionNumber: displayNum,
            userAnswer: userAnswer,
            correctAnswer: '—',
            isCorrect: false,
          };
        }
      } else {
        // Absolute fallback using size
        for (let i = 0; i < size; i++) {
          answersMap[`${q.id}_${i}`] = {
            questionNumber: parseInt(questionNum) + i,
            userAnswer: '',
            correctAnswer: '—',
            isCorrect: false,
          };
        }
      }
    }
    // --- TABLE COMPLETION ---
    else if (q.type === 'table_completion') {
      const tableRows = q.table_data?.table_rows || q.table_data?.rows || [];

      // Try to find explicit blank definitions first
      const blanks = q.table_data?.blank_positions || q.table_data?.blanks || [];
      const sortedBlanks = [...blanks].sort((a, b) => (a.blankNumber || 0) - (b.blankNumber || 0));

      let gapIndex = 0;
      tableRows.forEach((row, _rIdx) => {
        row.forEach((cell, _cIdx) => {
          const cellStr = String(cell || '');
          const cellMatches = cellStr.match(/\[gap\]|__BLANK__|__BLANK_\d+__/gi) || [];

          cellMatches.forEach(() => {
            const ansKey = `${q.id}_${gapIndex}`;
            const userAnswer = answers[ansKey] || '';

            const blankMeta = sortedBlanks[gapIndex];
            // If blankMeta has answer, use it. Else check q.table_data.answers array
            const correctAns = blankMeta?.answer || q.table_data?.answers?.[gapIndex] || '';

            const isCorrect = isAnswerCorrect(userAnswer, correctAns);
            if (isCorrect) correctCount++;

            const displayNum = parseInt(questionNum) + gapIndex;
            answersMap[ansKey] = {
              questionNumber: displayNum,
              userAnswer: userAnswer,
              correctAnswer: correctAns,
              isCorrect: isCorrect,
            };
            gapIndex++;
          });
        });
      });

      // If we found NO gaps by iterating cells but size > 1, something likely failed in parsing.
      // Force population to ensure counts are right.
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
    }
    // --- MATCHING FEATURES ---
    else if (q.type === 'matching_features') {
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
            userAnswer: userAnswer,
            correctAnswer: correctAns,
            isCorrect: isCorrect,
          };
        });
      } else {
        // Fallback if questions array is missing
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
    }
    // --- MAP LABELING ---
    else if (q.type === 'map_labeling') {
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
            userAnswer: userAnswer,
            correctAnswer: correctAns,
            isCorrect: isCorrect,
          };
        });
      } else {
        // Fallback
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
    }
    // --- MULTIPLE CHOICE (MULTI) ---
    else if (q.type === 'multiple_choice' && q.allow_multiple) {
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

      const correctAnswers = Array.isArray(rawCorrect)
        ? rawCorrect.map((a) => normalizeAnswer(a))
        : [];
      const userAnswers = Array.isArray(userAns) ? userAns.map((a) => normalizeAnswer(a)) : [];

      // Use size if available, fallback to correct answers length, then 2 default
      const slotCount = size;

      const matchedCorrectAnswers = new Set();
      userAnswers.forEach((userSelection) => {
        if (correctAnswers.includes(userSelection) && !matchedCorrectAnswers.has(userSelection)) {
          matchedCorrectAnswers.add(userSelection);
        }
      });

      correctCount += matchedCorrectAnswers.size;

      for (let idx = 0; idx < slotCount; idx++) {
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
    }
    // --- SINGLE ANSWER (DEFAULT) ---
    else {
      const userAnswer = answers[q.id] || '';
      // If explicit correct answer exists
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
          isCorrect: isCorrect,
        };
      }
      // Fallback for known unknowns - still count it!
      else {
        answersMap[q.id] = {
          questionNumber: `${q._displayStartNumber}`,
          userAnswer: userAnswer || '',
          correctAnswer: '—',
          isCorrect: false,
        };
      }
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
    errorPatterns,
  };
};
