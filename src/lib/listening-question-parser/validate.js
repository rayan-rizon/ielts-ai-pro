/**
 * Bulk IELTS listening question parser internals.
 */
export const validateListeningBulkData = (questions) => {
  const errors = [];
  const suggestions = [];

  // Extract all question numbers
  const allNumbers = [];

  questions.forEach((q) => {
    // Gap Fill / Notes Completion
    if ((q.type === 'notes_completion' || q.type === 'gap_fill') && q.gap_fill?.gap_numbers) {
      q.gap_fill.gap_numbers.forEach((num, idx) => {
        allNumbers.push({
          number: num,
          id: q.id,
          hasAnswer: !!q.gap_fill?.answers?.[idx],
        });
      });
    }
    // Table Completion
    else if (q.type === 'table_completion' && q.table_data?.blank_positions) {
      q.table_data.blank_positions.forEach((blank) => {
        allNumbers.push({
          number: blank.blankNumber,
          id: q.id,
          hasAnswer: !!blank.answer,
        });
      });
    }
    // Matching Features with questions array
    else if (q.type === 'matching_features' && q.matching_features?.questions) {
      q.matching_features.questions.forEach((qItem) => {
        const qNum = qItem.questionNumber || qItem.question_number;
        if (qNum) {
          allNumbers.push({
            number: qNum,
            id: q.id,
            hasAnswer: !!qItem.answer,
          });
        }
      });
    }
    // Matching Features paragraph mode
    else if (
      q.type === 'matching_features' &&
      q.matching_features?.mode === 'paragraph' &&
      q.matching_features?.text
    ) {
      const markers = q.matching_features.text.match(/\[(\d+)\]/g) || [];
      markers.forEach((marker) => {
        const num = parseInt(marker.replace(/[^\d]/g, ''));
        allNumbers.push({
          number: num,
          id: q.id,
          hasAnswer: !!q.matching_features?.answers?.[num],
        });
      });
    }
    // Flowchart
    else if (q.type === 'flowchart' && q.flowchart?.steps) {
      q.flowchart.steps.forEach((step) => {
        const stepNum = step.stepNumber || step.blank_number;
        if (stepNum) {
          allNumbers.push({
            number: stepNum,
            id: q.id,
            hasAnswer: !!step.answer,
          });
        }
      });
    }
    // Map Labeling
    else if (q.type === 'map_labeling' && q.map_labeling?.questions) {
      q.map_labeling.questions.forEach((qItem) => {
        const qNum = qItem.questionNumber || qItem.question_number;
        if (qNum) {
          allNumbers.push({
            number: qNum,
            id: q.id,
            hasAnswer: !!(qItem.answer || qItem.correct_answer),
          });
        }
      });
    }
    // MCQ multi-select
    else if (q.type === 'multiple_choice' && q.allow_multiple && q.question_number) {
      const count = q.question_count || 2;
      for (let i = 0; i < count; i++) {
        allNumbers.push({
          number: q.question_number + i,
          id: q.id,
          hasAnswer: Array.isArray(q.correct_answer) && q.correct_answer.length >= i + 1,
        });
      }
    }
    // Standard single-answer types
    else if (q.question_number) {
      allNumbers.push({
        number: q.question_number,
        id: q.id,
        hasAnswer: !!q.correct_answer,
      });
    }
  });

  // Sort by number
  const sorted = allNumbers.sort((a, b) => a.number - b.number);

  // Check for duplicates and gaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i].number;
    const next = sorted[i + 1].number;

    if (next === curr) {
      errors.push({
        type: 'error',
        msg: `Duplicate Question Number: ${curr}`,
        id: sorted[i + 1].id,
      });
    } else if (next !== curr + 1) {
      suggestions.push({
        type: 'warning',
        msg: `Gap in numbering: Questions jump from ${curr} to ${next}`,
        ids: [sorted[i].id, sorted[i + 1].id],
      });
    }
  }

  // Check missing answers
  sorted.forEach((item) => {
    if (!item.hasAnswer) {
      suggestions.push({
        type: 'info',
        msg: `Question ${item.number} has no answer.`,
        id: item.id,
      });
    }
  });

  return { errors, suggestions };
};
