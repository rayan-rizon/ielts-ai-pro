/**
 * Centralized scoring calculator for IELTS reading tests.
 * Eliminates duplicated scoring logic across the codebase.
 */

import { getQuestionCount } from '@/lib/utils';
import { normalizeAnswer, isAnswerCorrect } from '@/lib/ieltsAnswerValidation';

// Re-export for backward compatibility
export { normalizeAnswer, isAnswerCorrect };

/**
 * Calculate IELTS band score from raw score (scaled to 40 questions)
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total number of questions
 * @returns {number} IELTS band score (1.0-9.0)
 */
export const calculateBandScore = (correct, total) => {
  if (total === 0 || correct < 1) return 0;

  const rawScore40 = (correct / total) * 40;

  if (rawScore40 >= 39) return 9.0;
  if (rawScore40 >= 37) return 8.5;
  if (rawScore40 >= 35) return 8.0;
  if (rawScore40 >= 33) return 7.5;
  if (rawScore40 >= 30) return 7.0;
  if (rawScore40 >= 27) return 6.5;
  if (rawScore40 >= 23) return 6.0;
  if (rawScore40 >= 19) return 5.5;
  if (rawScore40 >= 15) return 5.0;
  if (rawScore40 >= 13) return 4.5;
  if (rawScore40 >= 10) return 4.0;
  if (rawScore40 >= 8) return 3.5;
  if (rawScore40 >= 6) return 3.0;
  if (rawScore40 >= 4) return 2.5;
  if (rawScore40 >= 2) return 2.0;
  return 1.0;
};

/**
 * Score a single question and return scoring details
 * @param {Object} question - Question object
 * @param {Object} answers - User answers map { questionId: answer }
 * @returns {{ total: number, correct: number, details: Array }} Scoring result
 */
export const scoreQuestion = (question, answers) => {
  const result = { total: 0, correct: 0, details: [] };
  const q = question;

  // Table Completion
  // IMPORTANT: Multiple blanks with the same number (e.g., __BLANK_7__ and __BLANK_7__)
  // are treated as ONE question. User must enter all required parts correctly.
  if (q.type === 'table_completion' && q.table_data?.rows) {
    const rows = q.table_data.rows || [];
    const blanksMetadata = q.table_data.blanks || q.table_data.blank_positions || [];

    // Sort blanks by blankNumber to match in order when direct lookup fails
    const sortedBlanks = [...blanksMetadata].sort(
      (a, b) => (a.blankNumber || 0) - (b.blankNumber || 0)
    );

    // First pass: collect all gaps and their info
    const allGaps = [];
    let absoluteIdx = 0;

    rows.forEach((row, rIdx) => {
      const cells = Array.isArray(row) ? row : [];
      cells.forEach((cell, cIdx) => {
        const cellStr = cell || '';

        // Check for inline blanks (__BLANK_N__)
        const inlineMatches = cellStr.match(/__BLANK_(\d+)__/g);
        if (inlineMatches) {
          inlineMatches.forEach((match) => {
            const patternNum = parseInt(match.match(/__BLANK_(\d+)__/)[1]);

            // Try to find blankMeta by blankNumber first
            let blankMeta = blanksMetadata.find((b) => b.blankNumber === patternNum);

            // If not found, try matching by sorted index (pattern uses 1-based, index is 0-based)
            if (!blankMeta && sortedBlanks[patternNum - 1]) {
              blankMeta = sortedBlanks[patternNum - 1];
            }

            // If still not found, fall back to absoluteIdx
            if (!blankMeta && sortedBlanks[absoluteIdx]) {
              blankMeta = sortedBlanks[absoluteIdx];
            }

            // Use blankMeta.blankNumber as the ACTUAL question number
            const actualQuestionNumber = blankMeta?.blankNumber || patternNum;

            allGaps.push({
              blankNum: actualQuestionNumber, // Use actual question number, not pattern number
              absoluteIdx,
              answerKey: `${q.id}_${absoluteIdx}`,
              correctAnswer: blankMeta?.answer || blankMeta?.correct_answer || '',
            });
            absoluteIdx++;
          });
        }

        // Check for legacy position-based blanks (row/col match)
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

    // Second pass: group gaps by blankNum
    // Gaps with the same blankNum form ONE question
    const groupedByBlankNum = {};
    allGaps.forEach((gap) => {
      if (!groupedByBlankNum[gap.blankNum]) {
        groupedByBlankNum[gap.blankNum] = {
          blankNum: gap.blankNum,
          gaps: [],
          correctAnswers: [], // Will hold all acceptable answers for this question
        };
      }
      groupedByBlankNum[gap.blankNum].gaps.push(gap);
    });

    // Third pass: score each unique question (by blankNum)
    Object.values(groupedByBlankNum).forEach((group) => {
      result.total++;

      // Get the correct answer string (should be the same for all gaps in this group)
      const correctAnswerStr = group.gaps[0]?.correctAnswer || '';

      // Collect user answers for all inputs in this group
      const userAnswers = group.gaps
        .map((gap) => (answers[gap.answerKey] || '').trim())
        .filter((a) => a !== '');

      // Determine if this question has multiple input blanks (like question 7 with two inputs)
      const hasMultipleInputs = group.gaps.length > 1;

      // Track if the question was answered at all (any non-empty input)
      const isQuestionAnswered = userAnswers.length > 0;

      // isCorrect: true = correct, false = wrong, null = unanswered
      let isCorrect = null; // Default to unanswered

      if (!isQuestionAnswered) {
        // No inputs filled - question is unanswered
        isCorrect = null;
      } else if (hasMultipleInputs) {
        // Multiple inputs for one question (e.g., "leaves, bark" in two separate boxes)
        // The correct answer contains all required parts separated by comma or AND
        // Check if the user filled all inputs correctly

        // Parse the correct answer to get required parts
        // Handle formats like: "leaves, bark" or "leaves/bark" (all required)
        // vs "(its/huarango/the) branches" which is one answer with alternatives
        const correctAnswerParts = correctAnswerStr
          .split(/,\s*/)
          .map((p) => p.trim())
          .filter((p) => p);

        // If user didn't answer ALL required inputs, it's incorrect (but answered)
        if (userAnswers.length < correctAnswerParts.length) {
          isCorrect = false;
        } else if (correctAnswerParts.length === group.gaps.length) {
          // Each input has a corresponding correct answer part
          // Check if each user answer matches any acceptable variation of the corresponding correct part
          const allPartsCorrect = userAnswers.every((userAns, idx) => {
            const correctPart = correctAnswerParts[idx] || correctAnswerParts[0];
            return isAnswerCorrect(userAns, correctPart);
          });

          // Also check order-independent matching (user might enter in different order)
          const orderIndependent =
            correctAnswerParts.every((correctPart) =>
              userAnswers.some((userAns) => isAnswerCorrect(userAns, correctPart))
            ) && userAnswers.length === correctAnswerParts.length;

          isCorrect = allPartsCorrect || orderIndependent;
        } else {
          isCorrect = false;
        }
      } else {
        // Single input for this question
        // Use isAnswerCorrect to handle IELTS format like "(its/huarango/the) branches"
        isCorrect = userAnswers.some((userAns) => isAnswerCorrect(userAns, correctAnswerStr));
      }

      // Only count as correct if explicitly true (not null/unanswered)
      if (isCorrect === true) result.correct++;

      // Parse correct answer parts for multi-input questions to check individual inputs
      const correctAnswerParts = correctAnswerStr
        .split(/,\s*/)
        .map((p) => p.trim())
        .filter((p) => p);

      // Add detail entries for EACH input in the group so validationMap works for all of them
      // The question is counted once, but each input needs its own validation entry
      group.gaps.forEach((gap, idx) => {
        const userAns = (answers[gap.answerKey] || '').trim();
        const isInputEmpty = userAns === '';

        // For individual input correctness (used by validationMap for coloring):
        // - If input is empty, it should be treated as "unanswered" not "incorrect"
        // - For the UI, we use isCorrect only when the input has a value
        let inputIsCorrect = isCorrect;
        if (isInputEmpty) {
          // Empty input - not correct, but also not "wrong" - it's unanswered
          inputIsCorrect = null; // null indicates unanswered
        } else if (hasMultipleInputs && correctAnswerParts.length > idx) {
          // For multi-input, check if THIS specific input is correct
          inputIsCorrect = isAnswerCorrect(userAns, correctAnswerParts[idx]);
        } else if (!hasMultipleInputs) {
          // For single input, check against the full correct answer
          inputIsCorrect = isAnswerCorrect(userAns, correctAnswerStr);
        }

        result.details.push({
          questionId: gap.answerKey,
          questionNumber: group.blankNum,
          userAnswer: userAns,
          correctAnswer: gap.correctAnswer || group.gaps[0]?.correctAnswer || '',
          isCorrect: inputIsCorrect, // Per-input validation for coloring
          isQuestionCorrect: isCorrect, // Overall question correctness for scoring
          isInputEmpty, // Flag to indicate this specific input was not answered
          // Extra metadata for UI
          isGroupedQuestion: group.gaps.length > 1,
          groupIndex: idx,
          groupSize: group.gaps.length,
        });
      });
    });

    return result;
  }

  // Matching Headings
  if (q.type === 'matching_headings' && q.matching_data?.paragraphs) {
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

  // Matching Features
  if (q.type === 'matching' && q.options) {
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

  // Matching Features (different format)
  if (q.type === 'matching_features' && q.matching_features) {
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

  // Notes Completion
  if ((q.type === 'notes_completion' || q.type === 'note_completion') && q.gap_fill) {
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
      // Fallback for missing structured text markers
      const gapCount = q.gap_fill.gap_count || 1;
      for (let i = 0; i < gapCount; i++) {
        result.total++;
        const answerKey = `${q.id}_gap_${i + 1}`; // using gap_ instead of blank_ for consistency
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

  // Flow-chart Completion
  if ((q.type === 'flowchart' || q.type === 'flow_chart_completion') && q.flowchart?.steps) {
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

  // Completion types with multiple blanks
  if (['sentence_completion', 'summary_completion', 'short_answer'].includes(q.type)) {
    const text = q.question_text || '';
    const blankCount = (text.match(/_____/g) || []).length || 1;

    // Check if question has a single explicit number (e.g. "23")
    // If so, we treat it as ONE question (1 mark total), regardless of blank count.
    // Unless it is a range (e.g. "23-24").
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
        // CASE: Single Question with Multiple Blanks (e.g. Q23 has 2 gaps)
        // Treat as 1 Question. All blanks must be correct to get the point?
        // Or partial? Standard strict scoring: 1 mark = all correct.
        // However, to be generous given potential data ambiguity, let's say "Correct if >50% blanks are correct"?
        // No, standard is strict. BUT let's check correct answers.

        result.total++;
        let correctBlanks = 0;

        for (let i = 0; i < blankCount; i++) {
          const answerKey = `${q.id}_blank_${i + 1}`;
          const correctAnswer = q.correct_answers?.[i] || '';
          if (isAnswerCorrect(answers[answerKey], correctAnswer)) {
            correctBlanks++;
          }

          // Add details for each blank so user sees feedback
          result.details.push({
            questionId: answerKey,
            questionNumber: q.question_number, // Use same number for all
            userAnswer: (answers[answerKey] || '').trim(),
            correctAnswer,
            isCorrect: isAnswerCorrect(answers[answerKey], correctAnswer),
          });
        }

        // Award the single point if ALL blanks are correct (Strict)
        if (correctBlanks === blankCount) {
          result.correct++;
        }
      } else {
        // CASE: Multiple Blanks without single number (or range implied contextually)
        // Treat each blank as a question (Old behavior)
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
  }

  // Multi-select MCQ (e.g. "Choose TWO letters", questions 23-24)
  if (q.type === 'multiple_choice') {
    // Check for question_number range like "23-24" or explicit question_count
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
      // Fallback for allow_multiple without explicit count
      questionCount = 2;
    }

    if (questionCount > 1) {
      // Multi-select MCQ: treat as multiple questions
      result.total += questionCount;

      // Parse user's multi-select answers (could be array or comma-separated)
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
        } catch (e) {
          // Keep as string if parsing fails
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

      // Parse correct answers
      let correctAnswers = [];
      if (Array.isArray(q.correct_answer)) {
        correctAnswers = q.correct_answer.map((a) => normalizeAnswer(a));
      } else if (q.correct_answer) {
        let parsed = q.correct_answer;
        try {
          if (typeof q.correct_answer === 'string' && q.correct_answer.trim().startsWith('[')) {
            parsed = JSON.parse(q.correct_answer);
          }
        } catch (e) {
          // Keep as string if parsing fails
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

      // Score each expected answer slot
      const baseNum = q.question_number
        ? parseInt(String(q.question_number).match(/\d+/)?.[0]) || 1
        : 1;

      for (let i = 0; i < questionCount; i++) {
        const userAns = userAnswers[i] || '';
        const correctAns = correctAnswers[i] || '';
        const isCorrect = userAns && correctAns && userAns === correctAns;

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

    totalCorrect += result.correct;
    totalQuestions += result.total;

    // Aggregate type stats
    if (!typeStats[qType]) typeStats[qType] = { total: 0, correct: 0 };
    typeStats[qType].total += result.total;
    typeStats[qType].correct += result.correct;

    allDetails.push(...result.details);
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
  };
};
