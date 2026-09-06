export function computeQuestionNumbers(questions) {
  let currentNumber = 1;

  // Ensure questions are sorted before numbering
  const sorted = [...questions].sort((a, b) => {
    const sectionA = parseInt(String(a.section || a.part_number || 1));
    const sectionB = parseInt(String(b.section || b.part_number || 1));
    if (sectionA !== sectionB) return sectionA - sectionB;
    return (a.question_number || 0) - (b.question_number || 0);
  });

  return sorted.map((q) => {
    let size = 1;

    if (
      (q.type === 'gap_fill' ||
        q.type === 'notes_completion' ||
        q.type === 'sentence_completion') &&
      (q.gap_fill?.text || q.gap_fill?.content)
    ) {
      const text = q.gap_fill.text || q.gap_fill.content || '';
      const matches = text.match(/\[gap\]|__BLANK__|__BLANK_\d+__/g);
      size = matches ? matches.length : 1;
    } else if (q.type === 'table_completion' && q.table_data?.rows) {
      let tableGaps = 0;
      q.table_data.rows.forEach((row) => {
        row.forEach((cell) => {
          const cellStr = String(cell || '');
          const matches = cellStr.match(/\[gap\]|__BLANK__|__BLANK_\d+__/gi);
          if (matches) {
            tableGaps += matches.length;
          }
        });
      });
      size = tableGaps > 0 ? tableGaps : 1;
    } else if (q.type === 'flowchart' && q.flowchart?.steps) {
      let flowchartGaps = 0;
      q.flowchart.steps.forEach((step) => {
        const text = step.text || '';
        const matches = text.match(/\[gap\]|__BLANK__|__BLANK_\d+__/g);
        flowchartGaps += matches ? matches.length : 0;
      });
      size = flowchartGaps > 0 ? flowchartGaps : 1;
    } else if (q.type === 'multiple_choice' && q.allow_multiple) {
      const count = parseInt(q.question_count);
      if (!isNaN(count) && count > 1) {
        size = count;
      } else if (Array.isArray(q.correct_answer)) {
        size = q.correct_answer.length;
      } else {
        size = 2; // Default for double MCQ
      }
    } else if (q.type === 'matching_features') {
      if (q.matching_features?.mode === 'paragraph' && q.matching_features.text) {
        const matches = q.matching_features.text.match(/\[\d+\]/g);
        size = matches ? matches.length : 1;
      } else if (q.matching_features?.questions) {
        size = q.matching_features.questions.length;
      }
    } else if (q.type === 'map_labeling' && q.map_labeling?.questions) {
      size = q.map_labeling.questions.length;
    }

    const startNum = currentNumber;
    const endNum = currentNumber + size - 1;
    currentNumber += size;

    return {
      ...q,
      _displayStartNumber: startNum,
      _displayEndNumber: endNum,
      _displaySize: size,
    };
  });
}
