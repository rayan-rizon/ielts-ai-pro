/**
 * Bulk IELTS listening question parser internals.
 */
import { LINE_SPLIT_REGEX } from './constants';

export const parseListeningAnswerList = (text) => {
  if (!text) return {};

  const map = {};
  const lines = text.split(LINE_SPLIT_REGEX);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Pattern 1: Combined questions "21&22 B, D" or "21 & 22 B, D"
    const combinedMatch = trimmed.match(/^(\d+)\s*[&,]\s*(\d+)\s+(.+)/);
    if (combinedMatch) {
      const num1 = parseInt(combinedMatch[1]);
      const num2 = parseInt(combinedMatch[2]);
      const answersStr = combinedMatch[3].trim();

      // Split answers by comma (but NOT by slash - that's alternatives)
      // For "B, D" format
      const answers = answersStr.split(/,\s*/).filter((a) => a.trim());

      if (answers.length >= 1) {
        map[num1] = answers[0].trim();
      }
      if (answers.length >= 2) {
        map[num2] = answers[1].trim();
      }
      return;
    }

    // Pattern 2: Simple format "1. answer" or "1) answer" or "1: answer" or "1 answer"
    const simpleMatch = trimmed.match(/^(\d+)[.):\s]\s*(.+)/);
    if (simpleMatch) {
      const num = parseInt(simpleMatch[1]);
      let rawAns = simpleMatch[2].trim();

      // Normalize alternative format: "emotions/ feelings" -> "emotions / feelings"
      // This ensures consistent " / " separator for grading
      rawAns = rawAns.replace(/\s*\/\s*/g, ' / ');

      map[num] = rawAns;
      return;
    }

    // Pattern 3: Just "number answer" with no delimiter
    const noDelimMatch = trimmed.match(/^(\d+)\s+(.+)/);
    if (noDelimMatch) {
      const num = parseInt(noDelimMatch[1]);
      let rawAns = noDelimMatch[2].trim();

      // Normalize alternative format
      rawAns = rawAns.replace(/\s*\/\s*/g, ' / ');

      map[num] = rawAns;
    }
  });

  return map;
};

/**
 * Merge answers into parsed questions
 */
export const mergeListeningAnswers = (questions, answerMap) => {
  return questions.map((q) => {
    // Handle Notes Completion / Gap Fill
    if ((q.type === 'notes_completion' || q.type === 'gap_fill') && q.gap_fill) {
      const gf = q.gap_fill;
      const newAnswers = { ...(gf.answers || {}) };

      // Count gaps from text
      const gapCount = (gf.text?.match(/\[gap\]/gi) || []).length || gf.question_count || 0;

      // If gap_numbers exists (from parser), use it
      // Otherwise, calculate from question_number + index
      if (gf.gap_numbers && gf.gap_numbers.length > 0) {
        gf.gap_numbers.forEach((originalNum, idx) => {
          if (answerMap[originalNum]) {
            newAnswers[idx] = answerMap[originalNum];
          }
        });
      } else if (q.question_number && gapCount > 0) {
        // Calculate gap numbers based on question_number
        for (let idx = 0; idx < gapCount; idx++) {
          const expectedNum = q.question_number + idx;
          if (answerMap[expectedNum]) {
            newAnswers[idx] = answerMap[expectedNum];
          }
        }
      }

      return {
        ...q,
        gap_fill: {
          ...gf,
          answers: newAnswers,
        },
      };
    }

    // Handle Table Completion
    if (q.type === 'table_completion' && q.table_data?.blank_positions) {
      const startNum = q.question_number || 1;
      const updatedBlanks = q.table_data.blank_positions.map((blank, idx) => {
        // Use explicit blankNumber or calculate from parent
        const blankNum = blank.blankNumber || startNum + idx;
        if (blankNum && answerMap[blankNum]) {
          return { ...blank, answer: answerMap[blankNum] };
        }
        return blank;
      });

      return {
        ...q,
        table_data: {
          ...q.table_data,
          blank_positions: updatedBlanks,
        },
      };
    }

    // Handle Matching Features
    if (q.type === 'matching_features' && q.matching_features) {
      const mf = q.matching_features;

      // Questions mode: update each question's answer
      if (mf.questions && Array.isArray(mf.questions)) {
        const startNum = q.question_number || 1;
        const updatedQuestions = mf.questions.map((qItem, idx) => {
          // Use explicit questionNumber if available, otherwise calculate from parent
          const qNum = qItem.questionNumber || qItem.question_number || startNum + idx;
          if (qNum && answerMap[qNum]) {
            return { ...qItem, answer: answerMap[qNum] };
          }
          return qItem;
        });

        return {
          ...q,
          matching_features: {
            ...mf,
            questions: updatedQuestions,
          },
        };
      }

      // Paragraph mode: update answers object
      if (mf.mode === 'paragraph' && mf.text) {
        const newAnswers = { ...(mf.answers || {}) };
        // Find all [N] markers in text
        const markers = mf.text.match(/\[(\d+)\]/g) || [];
        markers.forEach((marker) => {
          const num = parseInt(marker.replace(/[^\d]/g, ''));
          if (answerMap[num]) {
            newAnswers[num] = answerMap[num];
          }
        });

        return {
          ...q,
          matching_features: {
            ...mf,
            answers: newAnswers,
          },
        };
      }
    }

    // Handle Flowchart
    if (q.type === 'flowchart' && q.flowchart) {
      const fc = q.flowchart;
      if (fc.steps && Array.isArray(fc.steps)) {
        const newAnswers = { ...(fc.answers || {}) };

        // Collect explicit gap_numbers from steps (if parsed from text with [21], [22] markers)
        const allGapNumbers = [];
        fc.steps.forEach((step) => {
          if (step.gap_numbers && step.gap_numbers.length > 0) {
            allGapNumbers.push(...step.gap_numbers);
          }
        });

        // Count total gaps across all steps
        let totalGapCount = 0;
        fc.steps.forEach((step) => {
          const gapCountInStep = (step.text?.match(/\[gap\]/gi) || []).length;
          totalGapCount += Math.max(step.gap_numbers?.length || 0, gapCountInStep);
        });

        // Match answers using relative 1-based numbering (1, 2, 3...)
        // This works regardless of where the flowchart appears in the test
        for (let gapIdx = 0; gapIdx < totalGapCount; gapIdx++) {
          const explicitNum = allGapNumbers[gapIdx];
          const relativeNum = gapIdx + 1;

          // Try explicit gap_number first, then fall back to relative numbering
          const answer = answerMap[explicitNum] || answerMap[relativeNum];
          if (answer) {
            newAnswers[gapIdx] = answer;
          }
        }

        return {
          ...q,
          flowchart: {
            ...fc,
            answers: newAnswers,
          },
          correct_answer: Object.values(newAnswers).join(', '),
        };
      }
    }

    // Handle Map Labeling
    if (q.type === 'map_labeling' && q.map_labeling) {
      const ml = q.map_labeling;

      if (ml.questions && Array.isArray(ml.questions)) {
        const startNum = q.question_number || 1;
        const updatedQuestions = ml.questions.map((qItem, idx) => {
          // Explicit question number or calculate from parent
          const qNum = qItem.questionNumber || qItem.question_number || startNum + idx;
          if (qNum && answerMap[qNum]) {
            return { ...qItem, answer: answerMap[qNum], correct_answer: answerMap[qNum] };
          }
          return qItem;
        });

        return {
          ...q,
          map_labeling: {
            ...ml,
            questions: updatedQuestions,
          },
        };
      }
    }

    // Handle MCQ with multi-select (allow_multiple)
    if (q.type === 'multiple_choice' && q.allow_multiple) {
      const startNum = q.question_number;
      const count = q.question_count || 2;
      const answers = [];

      for (let i = 0; i < count; i++) {
        const num = startNum + i;
        if (answerMap[num]) {
          answers.push(answerMap[num]);
        }
      }

      if (answers.length > 0) {
        // Convert letter answers to actual options if needed
        const mappedAnswers = answers.map((ans) => matchLetterToOption(ans, q.options));
        return { ...q, correct_answer: mappedAnswers };
      }
    }

    // Handle standard single-answer types (MCQ single, short_answer, sentence_completion)
    const qNum = q.question_number;
    if (qNum && answerMap[qNum]) {
      const rawAnswer = answerMap[qNum];

      // For MCQ, try to match letter to actual option
      if (q.type === 'multiple_choice' && q.options && q.options.length > 0) {
        const matchedAnswer = matchLetterToOption(rawAnswer, q.options);
        return { ...q, correct_answer: matchedAnswer };
      }

      // For other types, use raw answer
      return { ...q, correct_answer: rawAnswer };
    }

    return q;
  });
};

/**
 * Helper: Match a letter answer (A, B, C, D) to the actual option from options array
 * Returns the matching option or the original answer if no match found
 */
const matchLetterToOption = (answer, options) => {
  if (!answer || !options || options.length === 0) return answer;

  const upperAnswer = answer.toString().toUpperCase().trim();

  // If answer is a single letter A-Z
  if (/^[A-Z]$/.test(upperAnswer)) {
    const letterIndex = upperAnswer.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.

    // First, check if there's an option at that index
    if (letterIndex >= 0 && letterIndex < options.length) {
      const option = options[letterIndex];
      // Return the option if it exists and is not empty
      if (option && option.trim()) {
        return option;
      }
    }

    // Second, try to find an option that starts with this letter
    const matchingOption = options.find((opt) => {
      if (!opt) return false;
      const optUpper = opt.toString().toUpperCase().trim();
      // Match "A", "A.", "A)", "A:" prefixes
      return (
        optUpper.startsWith(upperAnswer + '.') ||
        optUpper.startsWith(upperAnswer + ')') ||
        optUpper.startsWith(upperAnswer + ':') ||
        optUpper.startsWith(upperAnswer + ' ') ||
        optUpper === upperAnswer
      );
    });

    if (matchingOption) {
      return matchingOption;
    }
  }

  // If answer already matches an option exactly, return it
  if (options.includes(answer)) {
    return answer;
  }

  // No match found, return original (might be a direct text answer)
  return answer;
};

/**
 * Validate listening bulk data
 */
