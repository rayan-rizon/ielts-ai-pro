/**
 * Bulk IELTS reading question parser internals.
 */
export const validateBulkData = (questions) => {
  const errors = [];
  const suggestions = [];

  // 1. Flatten all question numbers
  let allitems = [];

  questions.forEach((q) => {
    if (q.type === 'matching_features') {
      if (q.matching_features?.mode === 'paragraph') {
        // PARAGRAPH MODE VALIDATION
        // Extract all [N] from text
        const text = q.matching_features.text || '';
        const matches = text.matchAll(/\[(\d+)\]/g);
        const answers = q.matching_features.answers || {};

        for (const match of matches) {
          const num = parseInt(match[1]);
          allitems.push({
            number: num,
            id: q.id,
            hasAnswer: !!answers[num],
            isSubItem: true,
          });
        }
      } else if (q.matching_features?.questions) {
        // LIST MODE VALIDATION
        q.matching_features.questions.forEach((mq) => {
          allitems.push({
            number: mq.questionNumber,
            id: q.id, // Link to parent ID for highlighting
            hasAnswer: !!mq.answer,
            isSubItem: true,
          });
        });
      }
    } else if (
      (q.type === 'notes_completion' || q.type === 'note_completion') &&
      q.gap_fill?.structured_text
    ) {
      const text = q.gap_fill.structured_text;
      const matches = text.matchAll(/\[(\d+)\]/g);
      const answers = q.gap_fill.answers || {};

      for (const match of matches) {
        const num = parseInt(match[1]);
        allitems.push({
          number: num,
          id: q.id,
          hasAnswer: !!answers[num],
          isSubItem: true,
        });
      }
    } else if (q.type === 'table_completion' && q.table_data?.blank_positions) {
      q.table_data.blank_positions.forEach((bq) => {
        allitems.push({
          number: bq.blankNumber,
          id: q.id,
          hasAnswer: !!bq.answer,
          isSubItem: true,
        });
      });
    } else if (q.type === 'flowchart' && q.flowchart?.steps) {
      let gapIndex = 0;
      q.flowchart.steps.forEach((step) => {
        const gapCount = (step.text?.match(/\[gap\]/g) || []).length;
        for (let i = 0; i < gapCount; i++) {
          const number = step.gap_numbers?.[i] ?? Number(q.question_number || 1) + gapIndex;
          allitems.push({
            number,
            id: q.id,
            hasAnswer: !!q.flowchart.answers?.[gapIndex],
            isSubItem: true,
          });
          gapIndex++;
        }
      });
    } else {
      allitems.push({
        number: q.question_number,
        id: q.id,
        hasAnswer: !!q.correct_answer,
        isSubItem: false,
      });
    }
  });

  // Sort by number
  const sorted = allitems.sort((a, b) => a.number - b.number);

  if (sorted.length === 0) return { errors, suggestions };

  // 2. Check Sequence
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
        ids: [sorted[i].id, sorted[i + 1].id], // distinct IDs if possible, but might be same parent
      });
    }
  }

  // 3. Check Missing Answers
  sorted.forEach((item) => {
    if (!item.hasAnswer) {
      suggestions.push({
        type: 'info',
        msg: `Question ${item.number} has no answer.`,
        id: item.id,
      });
    }
  });

  // Deduplicate suggestions (e.g. if multiple missing answers in same block, might spam? or separate msgs ok?)
  // Current UI renders tooltips per ID. If one ID has multiple msgs, it's fine.

  return { errors, suggestions };
};
