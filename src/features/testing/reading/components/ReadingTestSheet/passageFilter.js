function matchesSection(q, currentSectionNum) {
  const identifier = q.section;
  if (!identifier) return false;

  const parsedSection = parseInt(identifier.toString().match(/\d+/)?.[0]);
  if (!isNaN(parsedSection) && parsedSection === currentSectionNum) {
    return true;
  }

  const lowerStr = identifier.toString().toLowerCase();
  return (
    lowerStr.includes(`passage ${currentSectionNum}`) ||
    lowerStr.includes(`section ${currentSectionNum}`)
  );
}

export function getPassageQuestions(allQuestions, testData, currentPassageIndex) {
  if (!testData || !allQuestions) return [];

  const currentPassage =
    (testData.sections && testData.sections[currentPassageIndex]) ||
    (testData.passages && testData.passages[currentPassageIndex]);

  if (!currentPassage) return [];

  const currentSectionNum = currentPassage.section_number || currentPassageIndex + 1;
  const hasMultipleSections = testData.sections && testData.sections.length > 1;

  return allQuestions
    .filter((q) => {
      if (q.passage_id === currentPassage.id) return true;
      if (hasMultipleSections && q.section) {
        return parseInt(q.section) === parseInt(currentSectionNum);
      }
      if (q.passage_id === testData.id) return true;
      if (!hasMultipleSections) return true;
      return matchesSection(q, currentSectionNum);
    })
    .sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
}

export function countQuestionBlanks(q) {
  if (q.type === 'table_completion') {
    const blanks = q.table_data?.blanks || q.table_data?.blank_positions || [];
    return blanks.length;
  }
  if (q.type === 'matching_headings') {
    return (q.matching_data?.paragraphs || []).length;
  }
  if (q.type === 'matching') {
    return (q.options || []).length;
  }
  if (q.type === 'matching_features') {
    if (q.matching_features?.mode === 'paragraph') {
      const text = q.matching_features.text || '';
      const gaps = (text.match(/\[\d+\]/g) || []).length;
      return Math.max(gaps, 1);
    }
    return (q.matching_features?.questions || []).length;
  }
  if (q.type === 'notes_completion' || q.type === 'note_completion') {
    const text = q.gap_fill?.structured_text || '';
    const gaps = (text.match(/\[\d+\]/g) || []).length;
    return Math.max(gaps, 1);
  }
  if ((q.type === 'flowchart' || q.type === 'flow_chart_completion') && q.flowchart?.steps) {
    const gaps = q.flowchart.steps.reduce(
      (total, step) => total + (step.text?.match(/\[gap\]/g) || []).length,
      0
    );
    return Math.max(gaps, 1);
  }
  if (
    [
      'sentence_completion',
      'summary_completion',
      'flow_chart_completion',
      'diagram_completion',
      'short_answer',
    ].includes(q.type)
  ) {
    const blanks = ((q.question_text || q.text || '')?.match(/_____/g) || []).length;
    return Math.max(blanks, 1);
  }
  return 1;
}

export function calculateInitialQuestionCounter(allQuestions, testData, currentPassageIndex) {
  if (!testData.sections || testData.sections.length <= 1) return 0;
  let counter = 0;

  for (let i = 0; i < currentPassageIndex; i++) {
    const sectionNum = testData.sections[i].section_number || i + 1;
    const sectionQuestions = allQuestions.filter(
      (q) => q.section && parseInt(q.section) === parseInt(sectionNum)
    );
    counter += sectionQuestions.reduce((acc, q) => acc + countQuestionBlanks(q), 0);
  }

  return counter;
}
