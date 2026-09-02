/**
 * Bulk IELTS reading question parser internals.
 */
export const detectType = (instructions, lines, range) => {
  const lower = instructions.toLowerCase();

  // DEBUG: Log what we're analyzing
  console.log('[detectType] Range:', range?.start, '-', range?.end);
  console.log('[detectType] Instructions (first 150 chars):', instructions.substring(0, 150));

  // ============================================================
  // PRIORITY 1: COMPLETION TYPES (Notes, Summary, Table, Sentence)
  // ============================================================

  // ============================================================
  // PRIORITY 1: DEFINITIVE KEYWORD MATCHES & STRUCTURED TABLES
  // ============================================================

  // Table completion - Check this early as it's often misidentified as notes
  const hasPipes = lines.some((l) => l.trim().startsWith('|') && l.includes('|'));
  const hasProcedureAim = lines.some(
    (l) => l.toLowerCase().includes('procedure:') || l.toLowerCase().includes('aim:')
  );
  // Look for repeating labels followed by colon (list-based table)
  const labels = lines.map((l) => l.trim().match(/^([^:]{3,25}):/)?.[1]).filter(Boolean);
  const uniqueLabels = [...new Set(labels)];
  const hasRepeatingLabels = labels.length > uniqueLabels.length && uniqueLabels.length >= 2;

  if (lower.includes('complete the table') || hasPipes || hasProcedureAim || hasRepeatingLabels) {
    console.log('[detectType] → table_completion');
    return 'table_completion';
  }

  // Summary completion with word box -> matching_features
  // Fix: Ensure we don't catch "boxes" from answer sheet instruction
  // Fix: If it says "from the passage", it's definitely not a defined list/box type
  const isFromPassage = lower.includes('from the passage') || lower.includes('from the text');
  if (
    lower.includes('summary') &&
    (lower.includes('list of') ||
      (lower.includes('box') && !lower.includes('boxes')) ||
      lower.includes('a-h')) &&
    !isFromPassage
  ) {
    console.log('[detectType] → matching_features (summary with box)');
    return 'matching_features';
  }

  // Headings matching -> matching_features
  if (lower.includes('heading') || lower.includes('list of headings')) {
    console.log('[detectType] → matching_features (headings)');
    return 'matching_features';
  }

  // Flow-chart completion must be distinguished from structured notes.
  if (
    lower.includes('complete the flowchart') ||
    lower.includes('complete the flow-chart') ||
    lower.includes('complete the flow chart') ||
    lines.some((line) => /[↓→]|[-=]>/.test(line))
  ) {
    console.log('[detectType] → flowchart');
    return 'flowchart';
  }

  // Explicit instruction for notes
  if (lower.includes('complete the notes')) {
    console.log('[detectType] → notes_completion (explicit instruction)');
    return 'notes_completion';
  }

  // ============================================================
  // PRIORITY 2: MULTI-SELECT MCQ (Choose TWO/THREE letters)
  // ============================================================
  const isMultiSelectMCQMatch =
    lower.match(/choose\s+(two|three|2|3)\s+letters?/i) ||
    lines.some(
      (l) => l.toLowerCase().includes('which two') || l.toLowerCase().includes('which three')
    );

  if (isMultiSelectMCQMatch) {
    console.log('[detectType] → multiple_choice (Multi-select detected)');
    return 'multiple_choice';
  }

  // Matching Sentence Endings -> matching_features
  // e.g. "Complete each sentence with the correct ending, A-G below."
  if (
    (lower.includes('complete each sentence') || lower.includes('complete the sentences')) &&
    (lower.includes('correct ending') ||
      (lower.includes('letter') && lower.includes('a-')) ||
      lower.includes('list of'))
  ) {
    console.log('[detectType] → matching_features (sentence endings)');
    return 'matching_features';
  }

  // Sentence completion: "35. Some text _____" format
  if (
    (lower.includes('complete the sentences') || lower.includes('complete each sentence')) &&
    (lower.includes('word') || lower.includes('number'))
  ) {
    console.log('[detectType] → short_answer (sentence completion)');
    return 'short_answer';
  }

  // Fallback check for structured notes with bullets and gaps
  const hasBulletLines = lines.some((l) => l.trim().match(/^[●•–-]\s/));
  const hasGapMarkers = lines.some((l) => /\[\d+\]/.test(l) || /_{3,}/.test(l));
  const hasNumberedBlanks = lines.some(
    (l) => l.match(/\d+[.)].*_{3,}/) || l.match(/_{3,}.*\d+[.)]/)
  );

  if ((hasBulletLines && hasGapMarkers) || hasNumberedBlanks) {
    console.log('[detectType] → notes_completion (has bullets/gaps fallback)');
    return 'notes_completion';
  }

  // Summary without box (fill in blanks from passage)
  if (lower.includes('complete the summary') || (lower.includes('summary') && hasGapMarkers)) {
    console.log('[detectType] → notes_completion (summary completion)');
    return 'notes_completion';
  }

  // ============================================================
  // PRIORITY 2: TRUE/FALSE/NOT GIVEN and YES/NO/NOT GIVEN
  // ============================================================

  const combinedText = (instructions + ' ' + lines.join(' ')).toLowerCase();

  if (
    (lower.includes('true') && lower.includes('false') && lower.includes('not given')) ||
    lower.includes('statements agree with the information') ||
    (combinedText.includes('true') && combinedText.includes('false') && combinedText.includes('not given'))
  ) {
    console.log('[detectType] → true_false_not_given');
    return 'true_false_not_given';
  }

  if (
    (lower.includes('yes') && lower.includes('no') && lower.includes('not given')) ||
    (lower.includes('views') && lower.includes('writer')) ||
    lower.includes('claims of the writer') ||
    (combinedText.includes('yes') && combinedText.includes('no') && combinedText.includes('not given'))
  ) {
    console.log('[detectType] → yes_no_not_given');
    return 'yes_no_not_given';
  }

  // ============================================================
  // PRIORITY 3: MATCHING TYPES (Headings, Features, Sections, Paragraphs)
  // ============================================================

  // Headings matching
  if (lower.includes('heading') || lower.includes('list of headings')) {
    console.log('[detectType] → matching_features (headings)');
    return 'matching_features';
  }

  // Section/Paragraph matching with letter range (e.g., "A-G", "A-I")
  // Pattern: sections A-G, paragraph A-H, correct letter, A-G
  const letterRangePattern = /([A-Z])\s*[-–—]\s*([A-Z])/i;
  const hasLetterRange = letterRangePattern.test(instructions);
  const hasSectionOrParagraphContext =
    lower.includes('section') ||
    lower.includes('paragraph') ||
    lower.includes('which section') ||
    lower.includes('which paragraph');

  if (hasLetterRange && hasSectionOrParagraphContext) {
    console.log('[detectType] → matching_features (section/paragraph with range)');
    return 'matching_features';
  }

  // "Write the correct letter, A-G" pattern for matching
  if (hasLetterRange && lower.includes('correct letter')) {
    // Check if this is MCQ (options listed per question) or Matching (shared options)
    // MCQ typically has 4 options (A-D), Matching typically has more (A-G, A-I)
    const rangeMatch = instructions.match(letterRangePattern);
    if (rangeMatch) {
      const startCode = rangeMatch[1].toUpperCase().charCodeAt(0);
      const endCode = rangeMatch[2].toUpperCase().charCodeAt(0);
      const optionCount = endCode - startCode + 1;

      // If more than 4 options, likely matching; if 4 or fewer, could be MCQ
      // Also check if questions have individual options listed
      const questionsHaveOwnOptions = lines.some((l, i) => {
        const trimmed = l.trim();
        const isNumberedQ = /^\d+[.)]\s/.test(trimmed);
        if (isNumberedQ && i + 1 < lines.length) {
          // Check if next lines are options A., B., C., D.
          const nextLine = lines[i + 1]?.trim() || '';
          return /^[A-D][.)]\s/.test(nextLine);
        }
        return false;
      });

      if (optionCount > 4 || !questionsHaveOwnOptions) {
        console.log('[detectType] → matching_features (correct letter with range > 4)');
        return 'matching_features';
      }
    }
  }

  // Feature matching
  if (lower.includes('match') || lower.includes('match each') || lower.includes('correct ending')) {
    console.log('[detectType] → matching_features (match/ending)');
    return 'matching_features';
  }

  // ============================================================
  // PRIORITY 4: MULTIPLE CHOICE
  // ============================================================

  // Check if questions have their own options listed (A., B., C., D.)
  const hasPerQuestionOptions = lines.some((l) => {
    const trimmed = l.trim();
    // Look for option pattern after a numbered question
    return /^[A-D][.)]\s+.+/.test(trimmed) && trimmed.length > 5;
  });

  if (lower.includes('choose the correct letter') || lower.includes('correct letter, a, b, c')) {
    console.log('[detectType] → multiple_choice');
    return 'multiple_choice';
  }

  if (hasPerQuestionOptions) {
    console.log('[detectType] → multiple_choice (has per-question options)');
    return 'multiple_choice';
  }

  // ============================================================
  // FALLBACK: Default to multiple_choice
  // ============================================================
  console.log('[detectType] → multiple_choice (fallback)');
  return 'multiple_choice';
};

export const isMatchingType = (type) => ['matching_headings', 'matching_features'].includes(type);

// --- Parsers ---
