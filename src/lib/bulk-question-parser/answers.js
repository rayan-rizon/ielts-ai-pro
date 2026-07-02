/**
 * Bulk IELTS reading question parser internals.
 */
export const parseAnswerList = (text) => {
  if (!text) return {};
  const map = {};

  // Use a regex to find all "Number followed by separator" patterns
  // This helps find multiple answers on one line: "1. A 2. B 3. C" or "1 A 2 B"
  // Look for a number at starts or after whitespace, then a separator (. or ) or space), then content
  const matches = [...text.matchAll(/(?:^|\s)(\d+)[.)\s]\s*/g)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const num = parseInt(match[1]);
    const startPos = match.index + match[0].length;
    const nextMatch = matches[i + 1];
    const endPos = nextMatch ? nextMatch.index : text.length;

    let rawAns = text.substring(startPos, endPos).trim();
    if (!rawAns) continue;

    // Normalize
    let ans = normalizeAnswer(rawAns);
    if (ans) {
      map[num] = ans;
    }
  }

  return map;
};

const normalizeAnswer = (raw) => {
  if (!raw) return '';
  let ans = raw.trim();

  // 1. Boolean normalization (TRUE, FALSE, YES, NO, NOT GIVEN)
  // Handles "True.", "False", "NOT GIVEN."
  const boolMatch = ans.match(/^(true|false|yes|no|not given)([.)\s]|$)/i);
  if (boolMatch) {
    return boolMatch[1].toUpperCase();
  }

  // 2. MCQ / Matching Letter normalization (A, B, C...)
  // Handles "A.", "A)", "A choice text", "A"
  const letterMatch = ans.match(/^([A-G])(?:[.)\s]|$)/i);
  if (letterMatch) {
    return letterMatch[1].toUpperCase();
  }

  // 3. Roman Numeral normalization (i, ii, iii...)
  // Handles "i.", "iv)", "viii"
  const romanMatch = ans.match(/^([ivx][ivx]*)(?:[.)\s]|$)/i);
  if (romanMatch) {
    return romanMatch[1].toLowerCase();
  }

  // 4. Multi-select "A, B" or "A B"
  if (ans.includes(',') || ans.match(/^[A-G]\s+[A-G](\s+[A-G])*$/i)) {
    const parts = ans.split(/[\s,]+/).map((s) => s.trim().toUpperCase());
    if (parts.length > 0 && parts.every((p) => /^[A-G]$/.test(p))) {
      return [...new Set(parts)].sort().join(', ');
    }
  }

  // 5. Fallback - keep as is but remove trailing period
  return ans.replace(/\.$/, '');
};

/**
 * Merge logic
 */
export const mergeAnswers = (questions, answerMap) => {
  return questions.map((q) => {
    // Special handling for Table Completion
    if (q.type === 'table_completion' && q.table_data?.blank_positions) {
      const updatedBlanks = q.table_data.blank_positions.map((blank) => {
        const ans = answerMap[blank.blankNumber];
        if (ans) {
          return { ...blank, answer: ans };
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

    // Special handling for Matching Features
    if (q.type === 'matching_features') {
      // LIST MODE
      if (q.matching_features?.mode === 'list' && q.matching_features.questions) {
        const baseNum = q.question_number || 1;

        const updatedQuestions = q.matching_features.questions.map((mq, idx) => {
          const qNum = mq.questionNumber || mq.question_number || baseNum + idx;
          const ans = answerMap[qNum];
          if (ans) {
            return { ...mq, answer: ans, questionNumber: qNum };
          }
          return { ...mq, questionNumber: qNum };
        });

        return {
          ...q,
          matching_features: {
            ...q.matching_features,
            questions: updatedQuestions,
          },
        };
      }

      // PARAGRAPH MODE
      if (q.matching_features?.mode === 'paragraph') {
        const existingAnswers = q.matching_features.answers || {};
        const newAnswers = { ...existingAnswers };

        // Parse text to find all gap numbers [27]
        const text = q.matching_features.text || '';
        const gapMatches = [...text.matchAll(/\[(\d+)\]/g)];

        for (const match of gapMatches) {
          const num = parseInt(match[1]);
          if (answerMap[num]) {
            newAnswers[num] = answerMap[num];
          }
        }

        return {
          ...q,
          matching_features: {
            ...q.matching_features,
            answers: newAnswers,
          },
        };
      }
    }

    // Special handling for Notes Completion
    if (q.type === 'notes_completion' || q.type === 'note_completion') {
      const existingAnswers = q.gap_fill?.answers || {};
      const newAnswers = { ...existingAnswers };

      // Parse text to find all gap numbers [27]
      const text = q.gap_fill?.structured_text || '';
      const gapMatches = [...text.matchAll(/\[(\d+)\]/g)];

      for (const match of gapMatches) {
        const num = parseInt(match[1]);
        if (answerMap[num]) {
          newAnswers[num] = answerMap[num];
        }
      }

      return {
        ...q,
        gap_fill: {
          ...q.gap_fill,
          answers: newAnswers,
        },
      };
    }

    // Standard Question Answer Mapping (including Multi-select MCQ range aggregation)
    const isMultiSelectMCQ =
      q.type === 'multiple_choice' && (q.allow_multiple || (q.question_count || 1) > 1);

    if (isMultiSelectMCQ) {
      const count = parseInt(q.question_count || 1);
      const start = q.question_number;
      const collectedLetters = [];

      for (let i = 0; i < count; i++) {
        const val = answerMap[start + i];
        if (val) {
          if (typeof val === 'string' && val.includes(',')) {
            val.split(',').forEach((p) => collectedLetters.push(p.trim().toUpperCase()));
          } else {
            collectedLetters.push(String(val).trim().toUpperCase());
          }
        }
      }

      if (collectedLetters.length > 0) {
        const uniqueLetters = [...new Set(collectedLetters)].sort();
        // Map letters to full options if available
        const finalOptions = uniqueLetters.map((letter) => {
          if (q.options?.length > 0 && /^[A-G]$/.test(letter)) {
            const fullOption = q.options.find((opt) => opt.toUpperCase().startsWith(`${letter}.`));
            return fullOption || letter;
          }
          return letter;
        });

        return { ...q, correct_answer: finalOptions.join(', ') };
      }
    }

    const ans = answerMap[q.question_number];
    if (ans) {
      // MCQ Logic: Resolve letter (A) to full option string (A. Something)
      if (q.type === 'multiple_choice' && q.options?.length > 0) {
        const letter = String(ans).trim().toUpperCase();
        if (/^[A-G]$/.test(letter)) {
          const fullOption = q.options.find((opt) => opt.toUpperCase().startsWith(`${letter}.`));
          if (fullOption) {
            return { ...q, correct_answer: fullOption };
          }
        }
      }

      // Standard normalization
      const finalAns = Array.isArray(ans) ? ans.join(', ') : ans;
      return { ...q, correct_answer: String(finalAns) };
    }
    return q;
  });
};

/**
 * Validation
 */
