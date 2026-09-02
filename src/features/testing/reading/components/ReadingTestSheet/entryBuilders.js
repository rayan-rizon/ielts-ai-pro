function buildTableCompletionEntries(q) {
  if (!q.table_data?.rows) return [];
  let absoluteIdx = 0;
  const rows = q.table_data.rows;
  const blanksMetadata = q.table_data.blanks || q.table_data.blank_positions || [];
  const allGaps = [];

  rows.forEach((row, rIdx) => {
    const cells = Array.isArray(row) ? row : [];
    cells.forEach((cell, cIdx) => {
      const cellStr = cell || '';
      const inlineMatches = cellStr.match(/__BLANK_(\d+)__/g);
      if (inlineMatches) {
        inlineMatches.forEach((match) => {
          const blankNum = parseInt(match.match(/__BLANK_(\d+)__/)[1]);
          const blankMeta = blanksMetadata.find((b) => b.blankNumber === blankNum);
          allGaps.push({
            blankNum,
            absoluteIdx,
            correctAns:
              blankMeta?.answer ||
              q.correct_answers?.[absoluteIdx] ||
              q.table_data.answers?.[absoluteIdx],
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
          correctAns:
            legacyBlank.answer ||
            q.correct_answers?.[absoluteIdx] ||
            q.table_data.answers?.[absoluteIdx],
        });
        absoluteIdx++;
      }
    });
  });

  const seenBlankNums = new Set();
  const uniqueQuestions = [];
  allGaps.forEach((gap) => {
    if (!seenBlankNums.has(gap.blankNum)) {
      seenBlankNums.add(gap.blankNum);
      const gapsWithSameNum = allGaps.filter((g) => g.blankNum === gap.blankNum);
      uniqueQuestions.push({
        blankNum: gap.blankNum,
        subId: gapsWithSameNum[0].absoluteIdx,
        correctAns: gap.correctAns,
      });
    }
  });

  return uniqueQuestions.map((uq) => ({
    question: q,
    globalNum: uq.blankNum,
    subId: uq.subId,
    correctAnswer: uq.correctAns,
  }));
}

function buildMatchingHeadingsEntries(q, baseNum) {
  const items = q.matching_data?.paragraphs || q.questions || [];
  return items.map((item, idx) => ({
    question: q,
    globalNum: baseNum + idx,
    subId: item.id || idx,
  }));
}

function buildMatchingEntries(q, baseNum) {
  if (!q.options) return [];
  return q.options.map((opt, idx) => ({
    question: q,
    globalNum: baseNum + idx,
    subId: String.fromCharCode(65 + idx),
  }));
}

function buildFillInBlankEntries(q, baseNum) {
  const text = q.question_text || q.text || '';
  const blankCount = Math.max((text.match(/_____/g) || []).length, 1);
  const entries = [];
  for (let i = 0; i < blankCount; i++) {
    entries.push({
      question: q,
      globalNum: baseNum + i,
      subId: blankCount > 1 ? `blank_${i + 1}` : null,
      correctAnswer: q.correct_answer,
    });
  }
  return entries;
}

function buildNotesCompletionEntries(q, baseNum) {
  const text = q.gap_fill?.structured_text || '';
  const parts = text.split(/\[(\d+)\]/g);
  const entries = [];
  parts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      const gapNum = parseInt(part);
      const correctAns = q.gap_fill?.answers?.[gapNum];
      entries.push({
        question: q,
        globalNum: gapNum,
        subId: `gap_${gapNum}`,
        correctAnswer: correctAns,
      });
    }
  });
  if (entries.length === 0) {
    entries.push({ question: q, globalNum: baseNum });
  }
  return entries;
}

function buildFlowchartEntries(q, baseNum) {
  if (!q.flowchart?.steps) return [];
  let gapIndex = 0;
  const entries = [];
  q.flowchart.steps.forEach((step) => {
    const gapCount = (step.text?.match(/\[gap\]/g) || []).length;
    for (let i = 0; i < gapCount; i++) {
      const gapNumber = step.gap_numbers?.[i] ?? Number(baseNum) + gapIndex;
      const correctAnswer = q.flowchart.answers?.[gapIndex] ?? q.flowchart.answers?.[gapNumber];
      entries.push({
        question: q,
        globalNum: gapNumber,
        subId: `gap_${gapNumber}`,
        correctAnswer,
      });
      gapIndex++;
    }
  });
  return entries;
}

function parseMultipleChoiceAnswers(rawAnswers) {
  if (Array.isArray(rawAnswers)) return rawAnswers;
  if (typeof rawAnswers !== 'string') return [];

  try {
    const parsed = JSON.parse(rawAnswers);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Legacy imports may use a comma-separated answer string.
  }

  return rawAnswers.split(',').map((answer) => answer.trim());
}

function buildMultipleChoiceEntries(q, baseNum) {
  if (!q.allow_multiple || (q.question_count || 0) <= 1) {
    return [{ question: q, globalNum: baseNum }];
  }
  const correctAnswers = q.correct_answers || parseMultipleChoiceAnswers(q.correct_answer);
  const entries = [];
  for (let i = 0; i < q.question_count; i++) {
    entries.push({
      question: q,
      globalNum: baseNum + i,
      subId: i,
      correctAnswer: correctAnswers[i],
    });
  }
  return entries;
}

function buildMatchingFeaturesEntries(q, baseNum) {
  if (q.matching_features?.mode === 'paragraph') {
    const text = q.matching_features.text || '';
    const gapMatches = Array.from(text.matchAll(/\[(\d+)\]/g));
    if (gapMatches.length === 0) {
      return [{ question: q, globalNum: baseNum }];
    }
    return gapMatches.map((match) => {
      const placeholderNum = parseInt(match[1]);
      const correctAns = q.matching_features?.answers?.[placeholderNum];
      return {
        question: q,
        globalNum: placeholderNum,
        subId: placeholderNum,
        correctAnswer: correctAns,
      };
    });
  }
  const mQuestions = q.matching_features?.questions || [];
  if (mQuestions.length === 0) {
    return [{ question: q, globalNum: baseNum }];
  }
  return mQuestions.map((subQ, idx) => ({
    question: q,
    globalNum: baseNum + idx,
    subId: subQ.id,
    correctAnswer: subQ.answer,
  }));
}

function buildLegacyMatchingEntries(q, baseNum) {
  const items = q.matching_data?.paragraphs || q.questions || q.options || [];
  return items.map((item, idx) => {
    const correctAns = item?.answer || item?.correctAnswer || q.correct_answers?.[idx] || '';
    return {
      question: q,
      globalNum: baseNum + idx,
      subId: item?.id || idx,
      correctAnswer: correctAns,
    };
  });
}

export function buildAnswerEntriesForQuestion(q, baseQuestionNumber) {
  if (q.type === 'table_completion') return buildTableCompletionEntries(q);
  if (q.type === 'matching_headings' && (q.matching_data?.paragraphs || q.questions)) {
    return buildMatchingHeadingsEntries(q, baseQuestionNumber);
  }
  if (q.type === 'matching' && q.options) return buildMatchingEntries(q, baseQuestionNumber);
  if (
    [
      'sentence_completion',
      'summary_completion',
      'flow_chart_completion',
      'diagram_completion',
      'short_answer',
    ].includes(q.type) &&
    !(q.type === 'flow_chart_completion' && q.flowchart?.steps)
  ) {
    return buildFillInBlankEntries(q, baseQuestionNumber);
  }
  if (q.type === 'notes_completion' || q.type === 'note_completion') {
    return buildNotesCompletionEntries(q, baseQuestionNumber);
  }
  if ((q.type === 'flowchart' || q.type === 'flow_chart_completion') && q.flowchart?.steps) {
    return buildFlowchartEntries(q, baseQuestionNumber);
  }
  if (q.type === 'multiple_choice' && q.allow_multiple) {
    return buildMultipleChoiceEntries(q, baseQuestionNumber);
  }
  if (q.type === 'matching_features') return buildMatchingFeaturesEntries(q, baseQuestionNumber);
  if (q.type === 'matching_headings' || q.type === 'matching') {
    return buildLegacyMatchingEntries(q, baseQuestionNumber);
  }
  return [{ question: q, globalNum: baseQuestionNumber }];
}
