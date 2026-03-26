/**
 * Bulk Question Import Parser Strategy
 *
 * 1. Pre-process text to normalize line endings and spacing
 * 2. Split text into blocks based on "Questions X-Y" or "Question X" pattern
 * 3. For each block:
 *    - Extract instructions
 *    - Identify question type from instructions
 *    - Split block into individual question lines
 *    - Parse each line based on identified type
 * 4. Post-process to link groups and validate numbers
 */

// Questions pattern: "Questions 1-5" or "Questions 1–5" or "Question 1-5" or "Questions 27-30"
// Also matches "Questions 25 and 26" for multi-select MCQ
// Question range pattern: "Questions 1-6" or "Questions 1 and 6" or "Questions 1 to 6"
const RANGE_REGEX = /^(?:###\s*)?Questions?\s+(\d+)\s*(?:[-–—]|and|&|,|to)\s*(\d+)/i;

// Single question pattern: "Question 26" (without a range, not followed by dash/number)
const SINGLE_QUESTION_REGEX = /^(?:\*\*|###)?\s*Question\s+(\d+)(?!\s*[-–—]\s*\d+)/i;
const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Helper to automatically format IELTS instructions with bolding on constraints.
 */
const formatIeltsInstructions = (text) => {
  if (!text) return '';

  // 1. Bold word/letter count constraints
  const constraintPatterns = [
    /\bNO\s+MORE\s+THAN\s+(?:ONE|TWO|THREE|\d+)\s+WORDS?(?:\s+AND\/OR\s+A\s+NUMBER)?\b/gi,
    /\bONE\s+WORD(?: ONLY)?(?:\s+AND\/OR\s+A\s+NUMBER)?\b/gi,
    /\bTWO\s+WORDS(?:\s+AND\/OR\s+A\s+NUMBER)?\b/gi,
    /\bTHREE\s+WORDS(?:\s+AND\/OR\s+A\s+NUMBER)?\b/gi,
    /\b(?:ONE|TWO|THREE|FOUR|FIVE|\d+)\s+LETTERS?(?:\s+ONLY)?\b/gi,
  ];

  let formatted = text;

  // Split mashed instructions onto separate lines if they appear together
  formatted = formatted.replace(/([.!?])\s+(Write|Choose|Complete|Read|Label)\b/g, '$1\n\n$2');

  constraintPatterns.forEach((pattern) => {
    formatted = formatted.replace(pattern, (match) => {
      // Avoid double bolding
      if (match.trim().startsWith('**') && match.trim().endsWith('**')) return match;
      return `**${match}**`;
    });
  });

  // 2. Bold letters in "A, B or C" or "A-G" type patterns
  // Matches "correct letter, A, B or C" or "correct letter A-G"
  formatted = formatted.replace(
    /(correct letter[s]?,?\s+)([A-I])\s*,\s*([A-I])\s+or\s+([A-I])/gi,
    '$1**$2**, **$3** or **$4**'
  );
  formatted = formatted.replace(
    /(correct letter[s]?,?\s+)([A-I])\s+or\s+([A-I])/gi,
    '$1**$2** or **$3**'
  );
  formatted = formatted.replace(/(correct letter[s]?,?\s+)([A-I]\s*[-–—]\s*[A-I])/gi, '$1**$2**');

  // Also catch standalone "letter A-G" or "letters A-G"
  formatted = formatted.replace(/(letter[s]?,?\s+)\b([A-I]\s*[-–—]\s*[A-I])\b/gi, '$1**$2**');

  // 3. Bold/Italicize NB
  formatted = formatted.replace(/\b(NB)\b/g, '***$1***');

  // 4. Format T/F/NG and Y/N/NG list to match standard IELTS layout
  // Add line break before the choice keywords if they follow "choose"
  formatted = formatted.replace(/(choose)\s+(TRUE|YES)\b/gi, '$1\n\n$2');

  const tfngPatterns = [
    {
      regex: /\bTRUE\s+if the statement agrees with the information\b/gi,
      replacement:
        '**TRUE** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; *if the statement agrees with the information*',
    },
    {
      regex: /\bFALSE\s+if the statement contradicts the information\b/gi,
      replacement:
        '**FALSE** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; *if the statement contradicts the information*',
    },
    {
      regex: /\bNOT GIVEN\s+if there is no information on this\b/gi,
      replacement: '**NOT GIVEN** &nbsp; *if there is no information on this*',
    },
    {
      regex: /\bYES\s+if the statement agrees with the (?:views|claims) of the writer\b/gi,
      replacement:
        '**YES** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; *if the statement agrees with the claims of the writer*',
    },
    {
      regex: /\bNO\s+if the statement contradicts the (?:views|claims) of the writer\b/gi,
      replacement:
        '**NO** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; *if the statement contradicts the claims of the writer*',
    },
    {
      regex: /\bNOT GIVEN\s+if it is impossible to say what the writer thinks about this\b/gi,
      replacement:
        '**NOT GIVEN** &nbsp; *if it is impossible to say what the writer thinks about this*',
    },
  ];

  tfngPatterns.forEach(({ regex, replacement }) => {
    // Check if the pattern exists mashed together with others or as a single line
    formatted = formatted.replace(regex, (match) => `\n\n${replacement}`);
  });

  return formatted;
};

/**
 * Main parser entry point
 * @param {string} text - The raw text from the textarea
 * @param {string} targetSection - "Passage 1", "Part 2", etc. (for metadata)
 */
export const parseBulkQuestions = (text, targetSection = '') => {
  if (!text || !text.trim()) return [];

  const lines = text.split(LINE_SPLIT_REGEX);
  const blocks = [];
  let currentBlock = { raw: [], range: null };

  // 1. First pass: chunk into blocks based on "Questions X-Y" or "Question X"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const rangeMatch = line.match(RANGE_REGEX);
    const singleMatch = line.match(SINGLE_QUESTION_REGEX);

    if (rangeMatch || singleMatch) {
      // If we have an existing block accumulating, push it
      if (currentBlock.range || currentBlock.raw.length > 0) {
        blocks.push(currentBlock);
      }

      if (rangeMatch) {
        // Start new block with range
        currentBlock = {
          range: { start: parseInt(rangeMatch[1]), end: parseInt(rangeMatch[2]) },
          raw: [line], // Include the header line
          startIndex: i,
        };
      } else {
        // Single question - start new block with single number
        currentBlock = {
          range: { start: parseInt(singleMatch[1]), end: parseInt(singleMatch[1]) },
          raw: [line],
          startIndex: i,
        };
      }
    } else {
      currentBlock.raw.push(line);
    }
  }
  // Push final block
  if (currentBlock.raw.length > 0) {
    blocks.push(currentBlock);
  }

  // DEBUG: Log blocks for troubleshooting
  console.log(
    '[bulkQuestionParser] Blocks detected:',
    blocks.map((b) => ({
      range: b.range,
      lineCount: b.raw.length,
      firstLine: b.raw[0]?.substring(0, 50),
    }))
  );

  // 2. Process each block
  let allQuestions = [];

  blocks.forEach((block) => {
    // If block has no range detected but contains lines like "1. ..." assume it's a block
    // Or if it's the preamble instructions

    const parsed = parseBlock(block);
    allQuestions = [...allQuestions, ...parsed];
  });

  // 3. Normalize and validate
  return allQuestions.map((q) => ({
    ...q,
    section: targetSection,
  }));
};

const parseBlock = (block) => {
  const lines = block.raw;
  if (!lines.length) return [];

  // Extract instructions (usually lines after "Questions X-Y" and before first numbered question)
  let instructions = '';
  let questionLines = [];
  let type = 'multiple_choice'; // Default

  // Find where questions start (look for "1." or "27." pattern matching range start)
  let qStartIndex = -1;
  const rangeStart = block.range ? block.range.start : 1;

  // Heuristic: Find first line starting with "${rangeStart}." or containing "[${rangeStart}]"
  // OR for notes completion: find first bullet point or title-like line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.match(RANGE_REGEX)) continue;

    // Skip typical instruction lines
    if (
      line.toLowerCase().startsWith('complete') ||
      line.toLowerCase().startsWith('choose') ||
      line.toLowerCase().startsWith('write') ||
      line.toLowerCase().startsWith('read')
    ) {
      continue;
    }

    // Match "27." at start OR "[27]" anywhere OR "27." followed by space/underscores anywhere
    const startPattern = new RegExp(`(^|\\s)(\\[${rangeStart}\\]|${rangeStart}\\.)`);
    if (line.match(startPattern)) {
      qStartIndex = i;
      break;
    }

    // For notes completion: detect start of content by bullet points or short title lines
    // Bullets: ●, •, –, - at start of line
    if (line.match(/^[●•– -]\s/) || line.match(/^.+[●•– -]\s/)) {
      // This is a bullet - the previous non-empty line might be the title
      // Go back to find the title
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = lines[j].trim();
        if (
          prevLine &&
          !prevLine.toLowerCase().startsWith('complete') &&
          !prevLine.toLowerCase().startsWith('choose') &&
          !prevLine.toLowerCase().startsWith('write') &&
          !prevLine.match(RANGE_REGEX)
        ) {
          qStartIndex = j; // Start from the title
          break;
        }
      }
      if (qStartIndex === -1) qStartIndex = i; // Just start from the bullet if no title found
      break;
    }

    // List-based Table Detection (Procedure: / Aim: / Generic Labels)
    const isProcedureAim =
      line.toLowerCase().startsWith('procedure:') || line.toLowerCase().startsWith('aim:');

    // Check for generic "Label: Value" pattern as a table start
    const genericLabelMatch = line.match(/^([^:]{3,25}):/);
    const isGenericLabel = genericLabelMatch && !line.match(/\d+[.)]/); // Not a numbered line

    if (isProcedureAim || isGenericLabel) {
      // Find the title (usually the short line before)
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = lines[j].trim();
        if (
          prevLine &&
          !prevLine.toLowerCase().startsWith('complete') &&
          !prevLine.toLowerCase().startsWith('choose') &&
          !prevLine.toLowerCase().startsWith('write') &&
          !prevLine.match(RANGE_REGEX)
        ) {
          qStartIndex = j;
          break;
        }
      }
      if (qStartIndex === -1) qStartIndex = i;
      break;
    }

    // Short title-like line (not an instruction, not a bullet, not too long)
    if (line.length < 80 && !line.includes('___') && !line.match(/^[a-z]/)) {
      // Check if next line is a bullet or has gaps or list-table markers
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim().toLowerCase();
        if (
          nextLine.match(/^[●•– -]\s/) ||
          nextLine.includes('___') ||
          nextLine.startsWith('procedure:') ||
          nextLine.startsWith('aim:')
        ) {
          qStartIndex = i; // This is the title
          break;
        }
      }
    }

    // MCQ Detection: Line starting with "Which" followed by options (A. text, B. text, or A text, B text)
    if (line.toLowerCase().startsWith('which ')) {
      // Check if upcoming lines are options A, B, C, D, E
      let hasOptions = false;
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const optLine = lines[j].trim();
        // Match "A.", "A)", "A " (letter followed by . or ) or space then more text)
        if (/^[A-E](?:[.)]|\s+\S)/i.test(optLine)) {
          hasOptions = true;
          break;
        }
      }
      if (hasOptions) {
        qStartIndex = i;
        break;
      }
    }
  }

  if (qStartIndex > -1) {
    const headerLine = lines.find(
      (line) => line.match(RANGE_REGEX) || line.match(SINGLE_QUESTION_REGEX)
    );
    // Include all lines before qStartIndex as instruction lines
    const instructionLines = lines.slice(0, qStartIndex);
    const combinedLines = headerLine
      ? [headerLine, '', ...instructionLines.filter((line) => line !== headerLine)]
      : instructionLines;
    instructions = combinedLines.join('\n').trim();
    questionLines = lines.slice(qStartIndex);
  } else {
    // Fallback: If we can't find a clear start, collect all lines until we hit options
    // This handles multi-select MCQ where there's no numbered question
    const allInstructionLines = [];
    let splitIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Stop when we hit the actual question content (starting with "Which" or options)
      // Options: "A." or "A)" or "A " followed by more text
      if (line.toLowerCase().startsWith('which ') || /^[A-E](?:[.)]|\s+\S)/i.test(line)) {
        splitIndex = i;
        break;
      }
      allInstructionLines.push(lines[i]);
    }

    if (splitIndex > 0) {
      instructions = formatIeltsInstructions(allInstructionLines.join('\n').trim());
      questionLines = lines.slice(splitIndex);
    } else {
      instructions = formatIeltsInstructions(lines[0]);
      questionLines = lines.slice(1);
    }
  }

  // Final pass for instructions from qStartIndex logic
  if (qStartIndex > -1) {
    instructions = formatIeltsInstructions(instructions);
  }

  // Detect Type
  type = detectType(instructions, questionLines, block.range);

  // 1. Check for multi-select MCQ ("Choose TWO letters", "Which TWO actions")
  // These often have a range (10-11) but no individual numbered questions.
  const isMultiSelectMCQMatch =
    instructions.match(/choose\s+(two|three|four|five|2|3|4|5)\s+letters?/i) ||
    questionLines.some(
      (l) =>
        l.toLowerCase().includes('which two') ||
        l.toLowerCase().includes('which three') ||
        l.toLowerCase().includes('which four')
    );

  if (isMultiSelectMCQMatch) {
    // Force type to multiple_choice for the specialized parser
    console.log('[parseBlock] Multi-select MCQ detected, using specialized parser');

    // Parse as a single multi-select MCQ question
    let questionCount = 2;
    const countMatch = instructions.match(/choose\s+(two|three|four|five|2|3|4|5)\s+letters?/i);

    if (countMatch) {
      const countStr = countMatch[1].toLowerCase();
      if (countStr === 'two' || countStr === '2') questionCount = 2;
      else if (countStr === 'three' || countStr === '3') questionCount = 3;
      else if (countStr === 'four' || countStr === '4') questionCount = 4;
      else if (countStr === 'five' || countStr === '5') questionCount = 5;
    } else {
      const qLineWithCount = questionLines.find(
        (l) =>
          l.toLowerCase().includes('which two') ||
          l.toLowerCase().includes('which three') ||
          l.toLowerCase().includes('which four')
      );
      if (qLineWithCount?.toLowerCase().includes('three')) questionCount = 3;
      else if (qLineWithCount?.toLowerCase().includes('four')) questionCount = 4;
    }

    let questionText = '';
    const options = [];

    for (const line of questionLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^\d+\.\s*$/.test(trimmed)) continue;

      const optMatch = trimmed.match(/^([A-G])(?:[.)]|\s+)\s*(.+)/i);
      if (optMatch) {
        const letter = optMatch[1].toUpperCase();
        const text = optMatch[2].trim();
        if (text) {
          options.push(`${letter}. ${text}`);
          continue;
        }
      }

      if (trimmed.endsWith('?')) {
        questionText = trimmed;
      } else if (!questionText && trimmed.length > 20) {
        questionText = trimmed;
      }
    }

    if (options.length > 0) {
      return [
        {
          question_number: rangeStart,
          question_text: questionText || 'Which of the following...',
          type: 'multiple_choice',
          group_instructions: instructions,
          options: options,
          correct_answer: '',
          allow_multiple: true,
          question_count: questionCount,
        },
      ];
    }
  }

  // 2. Route to specialized parsers for other types
  if (isMatchingType(type)) {
    return parseMatchingQuestions(questionLines, instructions, type, rangeStart);
  }

  if (type === 'table_completion') {
    return parseTableCompletion(questionLines, instructions, rangeStart);
  }

  if (type === 'short_answer' || type === 'summary_completion') {
    return parseShortAnswer(questionLines, instructions, type, rangeStart);
  }

  if (type === 'notes_completion') {
    return parseNotesCompletion(questionLines, instructions, rangeStart, block.range);
  }

  // 3. Fallback: Standard line-by-line processing
  const questions = [];
  let currentQ = null;
  let nextNum = rangeStart;

  for (let i = 0; i < questionLines.length; i++) {
    const line = questionLines[i].trim();
    if (!line) continue;

    const numMatch = line.match(/^(\d+)[.)]\s*(.*)/);

    if (numMatch) {
      if (currentQ) questions.push(currentQ);

      let qNum = parseInt(numMatch[1]);
      if (questions.length === 0 && qNum === 1 && nextNum > 1) {
        qNum = nextNum;
      } else if (questions.length > 0) {
        const lastNum = questions[questions.length - 1].question_number;
        if (qNum <= lastNum) {
          qNum = lastNum + 1;
        }
      }

      currentQ = {
        question_number: qNum,
        question_text: numMatch[2],
        type: type,
        group_instructions: instructions,
        options: [],
        correct_answer: '',
      };
    } else if (currentQ) {
      const optionMatch = line.match(/^([A-G])(?:[.)]\s*|\s+)(.+)/i);
      if (
        optionMatch &&
        (type === 'multiple_choice' || type === 'matching_features' || type === 'matching')
      ) {
        const letter = optionMatch[1].toUpperCase();
        const text = optionMatch[2].trim();
        if (text) {
          currentQ.options.push(`${letter}. ${text}`);
        }
      } else {
        currentQ.question_text += ' ' + line;
      }
    }
  }

  if (currentQ) questions.push(currentQ);
  return questions;
};

// --- Pattern Matchers ---

/**
 * Intelligent question type detection based on instructions and content patterns.
 * Priority order matters - more specific patterns checked first.
 */
const detectType = (instructions, lines, range) => {
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

  // Explicit instruction for notes/flow
  if (lower.includes('complete the notes') || lower.includes('complete the flow')) {
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

  if (lower.includes('true') && lower.includes('false') && lower.includes('not given')) {
    console.log('[detectType] → true_false_not_given');
    return 'true_false_not_given';
  }

  if (
    (lower.includes('yes') && lower.includes('no') && lower.includes('not given')) ||
    (lower.includes('views') && lower.includes('writer'))
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

const isMatchingType = (type) => ['matching_headings', 'matching_features'].includes(type);

// --- Parsers ---

const parseMatchingQuestions = (lines, instructions, type, startNum) => {
  // Matching Features / Headings / Summary with Box
  // We want to aggregate these into a SINGLE question object of type 'matching_features'

  // 1. Identify Parse Mode: List vs Paragraph
  // If lines contain "A. xxx" pattern AND we have gap markers "[27]" OR "27. _____" in other lines, it's PARAGRAPH mode.
  // Also check instructions for gaps (common in Summary Completion where text is part of the instructions block)

  const gapRegex = /\[\d+\]|(\d+)(?:[.)]|\s+)\s*_{2,}/;
  const hasGapMarkers = lines.some((l) => gapRegex.test(l));
  const instructionHasGaps = gapRegex.test(instructions);

  const optionPattern = /^(?:\(|\[)?([A-Z]|i+)[).]?\s+(.+)/i;
  const optionLines = lines.filter((l) => optionPattern.test(l.trim()));
  const isParagraphMode = (hasGapMarkers || instructionHasGaps) && optionLines.length > 0;

  if (isParagraphMode) {
    // --- PARAGRAPH MODE PARSING ---
    const options = [];
    const textLines = [];
    let style = 'ABC';
    let finalInstructions = instructions;

    // RECOVERY: If lines don't have gaps but instructions do, extract text from instructions
    if (!hasGapMarkers && instructionHasGaps) {
      // Split instructions into "real instructions" and "paragraph text"
      // Heuristic: Instructions usually end with "... on your answer sheet."
      // Find the last occurrence of standard instruction phrases
      const splitRegex = /(?:Write|Choose).+(?:box|answer sheet).*$/gim;
      let lastMatch;
      let match;
      while ((match = splitRegex.exec(instructions)) !== null) {
        lastMatch = match;
      }

      if (lastMatch) {
        const splitIndex = lastMatch.index + lastMatch[0].length;
        finalInstructions = instructions.substring(0, splitIndex).trim();
        const extractedText = instructions.substring(splitIndex).trim();
        if (extractedText) {
          textLines.push(...extractedText.split('\n'));
        }
      } else {
        // Fallback: Use the whole instruction block as text if separation fails
        // but try to keep the first line as instruction if it looks like one
        const instrLines = instructions.split('\n');
        if (instrLines.length > 1 && /complete/i.test(instrLines[0])) {
          finalInstructions = instrLines[0];
          textLines.push(...instrLines.slice(1));
        }
      }
    }

    let romanCount = 0;
    let letterCount = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const romanMatch = trimmed.match(/^([ivx]+)[).]?\s*(.*)/i);
      const letterMatch = trimmed.match(/^[[(]?([A-Z])[).]?\s+(.+)/i);

      // Heuristic to distinguish "A. " option from "A " at start of sentence?
      if (romanMatch) {
        options.push(romanMatch[2].trim());
        romanCount++;
      } else if (letterMatch) {
        // If the line is long or contains a gap, it's probably part of the text, not an option
        if (trimmed.length < 60 && !trimmed.includes('[')) {
          options.push(letterMatch[2].trim());
          letterCount++;
        } else {
          textLines.push(line);
        }
      } else {
        textLines.push(line);
      }
    });

    if (textLines.length === 0) {
      // Fallback: maybe all thought to be options?
    }

    if (romanCount > letterCount) style = 'ROMAN';

    // 3. Extract Title (often a short line before text begins or the first line of text if it's a title)
    let summaryTitle = ''; // Was boxTitle, but now we want it for the summary text
    let finalLines = [...textLines];
    if (textLines.length > 0) {
      const firstLine = textLines[0].trim();
      // If first line is short and doesn't contain a gap, it's likely a title
      if (firstLine.length < 60 && !firstLine.includes('[') && !firstLine.includes('_')) {
        summaryTitle = firstLine;
        finalLines = textLines.slice(1); // Remove title line from text content
        console.log('[parseMatchingQuestions] Extracted title for summary:', summaryTitle);
      }
    }

    const rawText = finalLines.join('\n\n');
    const cleanedText = rawText
      .replace(/(\d+)(?:[:.]|\s+)\s*_{2,}/g, '[$1]') // Match "27. _____" or "27: _____" or "27 _____"
      .replace(/\[(\d+)\]\s*_{2,}/g, '[$1]') // Match "[27] _____"
      .replace(/_{3,}/g, '___') // Standardize other underscores
      .replace(/\[(\d+)\]/g, '[$1]'); // Ensure format

    // Extract Question Number (startNum) from the first gap found
    const firstGapMatch = cleanedText.match(/\[(\d+)\]/);
    const qNum = firstGapMatch ? parseInt(firstGapMatch[1]) : startNum;

    return [
      {
        question_number: qNum,
        question_text: 'Complete the summary',
        type: 'matching_features',
        group_instructions: finalInstructions,
        matching_features: {
          style: style,
          mode: 'paragraph',
          box_title: '', // Keep box title empty for cleaner UI (options list)
          questions_title: summaryTitle, // Display extracted title above the summary text
          text: cleanedText,
          options: options,
          answers: {}, // filled by merge
        },
      },
    ];
  } else {
    // --- LIST MODE PARSING (Improved for "List of Headings" format) ---

    // 1. Extract Questions (The numbered parts) and Options from lines
    const questions = [];
    let options = [];
    let romanCount = 0;
    let letterCount = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check for numbered question first (e.g., "14. Paragraph A")
      const numMatch = trimmed.match(/^(\d+)[.)]\s*(.*)/);
      if (numMatch) {
        questions.push({
          question_number: parseInt(numMatch[1]),
          text: numMatch[2].trim(),
          correct_answer: '',
        });
        return;
      }

      // Check for Roman numeral options (i-ix for headings)
      const romanMatch = trimmed.match(/^([ivx]+)(?:[).]?\s+|\s+)(.*)/i);
      if (romanMatch && romanMatch[2]) {
        const optionText = romanMatch[2].trim();
        // Validate it looks like an option and not a word starting with I/V/X
        if (optionText.length > 0 && !trimmed.match(/^(Instructions|Information|If|In|It)\b/i)) {
          options.push(optionText);
          romanCount++;
          return;
        }
      }

      // Check for letter options (A-G for matching features)
      const letterMatch = trimmed.match(/^[[(]?([A-Z])(?:[).]?\s+|\s+)(.*)/i);
      if (letterMatch && !trimmed.startsWith('Question') && letterMatch[2]) {
        const optionText = letterMatch[2].trim();
        const isCommonInstruction = /^(Answer|All|At|As|About|After|Although)\b/i.test(trimmed);
        if (optionText.length > 0 && !isCommonInstruction) {
          options.push(optionText);
          letterCount++;
          return;
        }
      }
    });

    // If no options found in lines, check instructions
    if (options.length === 0) {
      const instructionLines = instructions.split(/\r?\n/);
      instructionLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Skip "List of..." header
        if (/^list.+of.+/i.test(trimmed)) return;
        // Skip example lines
        if (/^example.*(answer)?/i.test(trimmed)) return;

        const romanMatch = trimmed.match(/^([ivx]+)(?:[).]?\s+|\s+)(.*)/i);
        if (romanMatch && romanMatch[2]) {
          const optionText = romanMatch[2].trim();
          if (optionText.length > 0 && !trimmed.match(/^(Instructions|Information|If|In|It)\b/i)) {
            options.push(optionText);
            romanCount++;
            return;
          }
        }

        const letterMatch = trimmed.match(/^[[(]?([A-Z])(?:[).]?\s+|\s+)(.*)/i);
        if (letterMatch && !trimmed.startsWith('Question') && letterMatch[2]) {
          const optionText = letterMatch[2].trim();
          const isCommonInstruction = /^(Answer|All|At|As|About|After|Although)\b/i.test(trimmed);
          if (optionText.length > 0 && !isCommonInstruction) {
            options.push(optionText);
            letterCount++;
          }
        }
      });
    }

    if (questions.length === 0) return [];

    // 2. Check for SECTION/PARAGRAPH MATCHING - these have auto-generated options
    // Look for patterns like "A-G", "A–H", "sections A-G", "paragraph A-I"
    const letterRangeMatch = instructions.match(/([A-Z])[\s,]*[-–—]\s*([A-Z])/i);

    let style = romanCount > letterCount ? 'ROMAN' : 'ABC';
    let mode = 'list';

    // Auto-generate options if we found a letter range and no options were extracted
    if (letterRangeMatch && options.length === 0) {
      console.log(
        '[parseMatchingQuestions] Auto-generating options from range:',
        letterRangeMatch[0]
      );
      const startLetter = letterRangeMatch[1].toUpperCase();
      let endLetter = letterRangeMatch[2].toUpperCase();
      // Handle A-I vs A-l (lowercase L looks like I) - normalize to I
      if (endLetter === 'L') endLetter = 'I';

      const startCode = startLetter.charCodeAt(0);
      const endCode = endLetter.charCodeAt(0);

      for (let code = startCode; code <= endCode; code++) {
        options.push('');
      }
      style = 'ABC';
    }

    // Clean up instructions (remove option lines)
    let cleanInstructions = instructions
      .split(/\r?\n/)
      .filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        // Remove "List of..." header lines
        if (/^list\s+of\s+/i.test(trimmed)) return false;
        // Remove example lines
        if (/^example.*(answer)?/i.test(trimmed)) return false;
        // Remove paragraph headings pattern
        if (/^paragraph.+[a-z].+[ivx]+$/i.test(trimmed)) return false;
        // Remove Roman numeral option lines: "i Text", "ii Text", "iii. Text", etc.
        if (/^[ivx]+(?:[).]\s*|\s+)\S/i.test(trimmed)) return false;
        // Remove single letter option lines: "A Text", "A. Text", "B) Text", etc.
        if (/^[A-Z](?:[).]\s*|\s+)\S/i.test(trimmed)) return false;
        return true;
      })
      .join('\n')
      .trim();

    // Extract Box Title - Default to empty unless explicitly found
    let boxTitle = '';

    const cleanTitleText = (text) => {
      if (!text) return '';
      let cleaned = text
        .replace(/\s+below\.?$/i, '') // Remove " below" or " below." at end
        .replace(/[.:]+$/, '') // Remove trailing colon or period
        .trim();

      // If it's ALL CAPS, convert to Title Case for better aesthetics
      if (cleaned === cleaned.toUpperCase() && cleaned.length > 5) {
        cleaned = cleaned
          .toLowerCase()
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return cleaned;
    };

    // Check instructions first
    const listHeaderMatch = instructions.match(/List\s+of\s+([^\n\r]+)/i);
    if (listHeaderMatch) {
      boxTitle = `List of ${cleanTitleText(listHeaderMatch[1])}`;
    } else {
      // Check content lines (often Matching Sentence Endings have the list header in the content)
      const contentListHeader = lines.find((l) => /List\s+of\s+/i.test(l));
      if (contentListHeader) {
        const match = contentListHeader.match(/List\s+of\s+([^\n\r]+)/i);
        if (match) boxTitle = `List of ${cleanTitleText(match[1])}`;
      }
    }

    // Fallback for Headings if still empty
    if (!boxTitle && romanCount > 0) {
      boxTitle = 'List of Headings';
    }

    const firstQ = questions[0];

    return [
      {
        question_number: firstQ.question_number,
        question_text: '',
        type: 'matching_features',
        group_instructions: cleanInstructions,
        matching_features: {
          style: style,
          mode: mode,
          box_title: boxTitle,
          options: options,
          questions: questions.map((q) => ({
            id: `mq${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            questionNumber: q.question_number,
            text: q.text,
            answer: '',
          })),
        },
      },
    ];
  }
};

/**
 * Parse Short Answer / Sentence Completion questions
 * These have numbered questions with blanks (_____) that need to become input fields
 * Format: "35. Some text _____ more text" or "35. Some text _____"
 */
const parseShortAnswer = (lines, instructions, type, _startNum) => {
  const questions = [];
  let title = '';
  let questionStartIndex = 0;

  // DEBUG logging
  console.log('[parseShortAnswer] Lines:', lines.slice(0, 5));
  console.log('[parseShortAnswer] Instructions:', instructions.substring(0, 100));

  // 1. Look for title line - check BOTH lines array AND instructions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if it's a numbered question (e.g., "19. The most...")
    if (line.match(/^\d+[.)]/)) {
      questionStartIndex = i;
      break;
    }

    // Check if it's a potential title (ends with ? or is a short header-like text)
    if (
      line.endsWith('?') ||
      (line.length < 80 &&
        line.length > 5 &&
        !line.includes('___') &&
        !line.match(/^\d+[.)]/) &&
        !line.toLowerCase().startsWith('complete'))
    ) {
      title = line;
      console.log('[parseShortAnswer] Found title in lines:', title);
    }
  }

  // Also check instructions if we didn't find a title in lines
  if (!title) {
    const instrLines = instructions.split('.');
    for (const line of instrLines) {
      const trimmed = line.trim();
      if (trimmed.endsWith('?') && !trimmed.match(/^\d+[.)]/)) {
        title = trimmed;
        console.log('[parseShortAnswer] Found title in instructions:', title);
        break;
      }
    }
  }

  // 2. Parse each numbered question
  for (let i = questionStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const numMatch = line.match(/^(\d+)[.)]\s*(.*)/);
    if (numMatch) {
      const qNum = parseInt(numMatch[1]);
      let qText = numMatch[2].trim();

      // Replace underscores with [N] markers for the gap
      // This allows the renderer to show input fields inline
      qText = qText.replace(/_{3,}/g, `[${qNum}]`);

      questions.push({
        question_number: qNum,
        question_text: qText,
        type: 'short_answer',
        group_instructions: instructions,
        options: [],
        correct_answer: '',
        // Store structured text for rendering with inline gaps
        gap_fill: {
          title: title || null,
          structured_text: qText,
          gap_count: 1,
        },
      });
    }
  }

  console.log('[parseShortAnswer] Parsed', questions.length, 'questions with title:', title);

  return questions;
};

/**
 * Parse Notes Completion - Structured notes with bullets, title, and inline gaps
 * Input formats supported:
 * 1. Structured bullets with ● and – markers
 * 2. Numbered blanks like "9. _____ attached to hull by wires"
 * 3. Blanks in middle/end like "legs are placed into _____"
 *
 * Output: Single question with gap_fill.structured_text containing formatted content
 * Each numbered item becomes a bullet point with [N] placeholder for the input
 */
const parseNotesCompletion = (lines, instructions, startNum, range) => {
  console.log('[parseNotesCompletion] Parsing', lines.length, 'lines');

  let title = '';
  const structuredLines = [];

  // Find title - typically the first SHORT line that's not a bullet or instruction
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip instructions that start with "Complete", "Choose", "Write"
    if (
      line.toLowerCase().startsWith('complete') ||
      line.toLowerCase().startsWith('choose') ||
      line.toLowerCase().startsWith('write')
    ) {
      continue;
    }

    // If line contains gaps or numbers with gaps, it's content not title
    if (line.includes('___') || line.match(/\d+\.\s*_{3,}/)) {
      break;
    }

    // If line starts with bullet, we're past the title
    if (line.match(/^[●•–-]\s/) || line.match(/^\d+[.)]/)) {
      break;
    }

    // Long lines (>80 chars) are likely paragraph content, not title
    if (line.length > 80) {
      break;
    }

    // Short non-bullet text could be a title - check for ALL CAPS or Title Case
    if (line.length < 80 && !line.includes('___')) {
      title = line;
      break;
    }
  }

  console.log('[parseNotesCompletion] Found title:', title);

  // Process all lines to convert gaps to [N] placeholders
  for (const rawLine of lines) {
    let line = rawLine;

    // Skip the title line if we found one
    if (title && line.trim() === title) continue;

    // Skip empty lines but preserve structure
    if (!line.trim()) {
      structuredLines.push('');
      continue;
    }

    // Skip instruction lines
    const lowerLine = line.toLowerCase().trim();
    if (
      lowerLine.startsWith('complete') ||
      lowerLine.startsWith('choose') ||
      lowerLine.startsWith('write') ||
      lowerLine.includes('no more than') ||
      lowerLine.includes('one word') ||
      lowerLine.includes('two words') ||
      lowerLine.includes('answer sheet')
    ) {
      continue;
    }

    // 1. Convert inline numbered gaps (common in paragraph summaries): "text 33. _____" or "text 33 _____"
    // This replaces "33. _____" or "33 _____" with "[33]"
    line = line.replace(/(\d+)(?:[.)]|\s+)\s*_{2,}/g, '[$1]');

    // 2. Convert numbered lines with a gap later in the line (common in sentence lists): "14. text _____"
    const numberedLineMatch = line.match(/^(\d+)[.)]\s*(.*)/);
    if (numberedLineMatch && line.includes('__')) {
      const num = numberedLineMatch[1];
      const content = numberedLineMatch[2];
      // Only replace if the gap hasn't been converted yet by the inline regex above
      if (!content.includes(`[${num}]`)) {
        line = `${num}. ${content.replace(/_{2,}/g, `[${num}]`)}`;
      }
    }

    // 3. Fallback: handle generic blanks in lines that we know belong to a question
    // but may not have a clear number associated on the same line (rare but for context)
    if (!line.includes('[') && line.includes('___')) {
      line = line.replace(/_{3,}/g, '___');
    }

    // Handle already-formatted [N] followed by underscores
    line = line.replace(/\[(\d+)\]\s*_{2,}/g, '[$1]');

    // SUBHEADING DETECTION
    // If line is short, doesn't start with bullet/number, has no gap, and isn't empty -> Bold it
    // Exclude instructions we might have missed
    const isBullet = /^[●•–-]/.test(line.trim());
    const hasGap = line.includes('[') || line.includes('___');
    const isNumbered = /^\d+[.)]/.test(line.trim());
    const isShort = line.length < 80;
    const isInstruction = /^(complete|choose|write|nb|note|no more than)/i.test(line.trim());

    if (
      isShort &&
      !isBullet &&
      !hasGap &&
      !isNumbered &&
      !isInstruction &&
      line.trim().length > 0
    ) {
      if (!line.includes('**')) {
        line = `**${line.trim()}**`;
      }
    }

    structuredLines.push(line);
  }

  // Recalculate gap count from final text
  const finalText = structuredLines.join('\n');

  // Deduplicate gap markers - extract unique gap numbers
  const gapNumbers = new Set();
  const gapMatches = finalText.matchAll(/\[(\d+)\]/g);
  for (const match of gapMatches) {
    gapNumbers.add(parseInt(match[1]));
  }
  const actualGaps = gapNumbers.size;

  console.log('[parseNotesCompletion] Processed text with', actualGaps, 'unique gaps');

  // Return single question with the full structured content
  return [
    {
      question_number: range?.start || startNum || 1,
      question_text: instructions,
      type: 'notes_completion',
      group_instructions: instructions,
      options: [],
      correct_answer: '',
      gap_fill: {
        title: title,
        structured_text: finalText,
        gap_count: actualGaps,
      },
    },
  ];
};

const parseTableCompletion = (lines, instructions, startNum) => {
  // 1. Identify Header Row and Body Rows
  const tableLines = lines.filter((l) => l.trim().startsWith('|'));
  const isProcedureAimTable =
    !tableLines.length &&
    lines.some((l) => l.toLowerCase().includes('procedure:') || l.toLowerCase().includes('aim:'));

  // List-based detection: "Label: Value" patterns
  const labelsFound = lines.map((l) => l.trim().match(/^([^:]{3,25}):/)?.[1]).filter(Boolean);
  const uniqueLabels = [...new Set(labelsFound)];
  const isListBasedTable =
    !tableLines.length &&
    !isProcedureAimTable &&
    labelsFound.length > uniqueLabels.length &&
    uniqueLabels.length >= 2;

  const isImplicitTable =
    !tableLines.length &&
    !isProcedureAimTable &&
    !isListBasedTable &&
    instructions.toLowerCase().includes('complete the table');

  if (!tableLines.length && !isProcedureAimTable && !isListBasedTable && !isImplicitTable)
    return [];

  let headers = [];
  let rows = [];
  const blanks = [];
  let currentGapNum = startNum;

  if (isImplicitTable || isListBasedTable || isProcedureAimTable) {
    // --- PSEUDO / IMPLICIT TABLE PARSING ---
    let title = '';

    if (isImplicitTable) {
      headers = ['', ''];
      let currentRow = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.toLowerCase().includes('questions') || line.toLowerCase().includes('answer sheet'))
          continue;

        const isPotentialLabel =
          line.length < 50 &&
          !line.includes('___') &&
          !line.includes('[') &&
          !/^[●•–-]/.test(line) &&
          !/^(complete|choose|write)/i.test(line);

        if (isPotentialLabel) {
          if (currentRow) rows.push(currentRow);
          currentRow = [line, ''];
        } else if (currentRow) {
          currentRow[1] += (currentRow[1] ? '\n' : '') + line;
        } else {
          // Content before first label? Start a row with empty label
          currentRow = ['', line];
        }
      }
      if (currentRow) rows.push(currentRow);
      rows = rows.filter((r) => r[0] || r[1]);
    } else {
      // --- PSEUDO-TABLE PARSING (PROCEDURE / AIM or Generic List) ---
      headers = isProcedureAimTable ? ['Procedure', 'Aim'] : uniqueLabels;
      let currentRow = headers.map(() => null);

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();
        if (!line) continue;

        const labelMatch = line.match(/^([^:]{3,25}):\s*(.*)/);
        if (labelMatch) {
          const label = labelMatch[1];
          const initialValue = labelMatch[2].trim();
          const headerIdx = headers.indexOf(label);

          if (headerIdx !== -1) {
            if (currentRow[headerIdx] !== null) {
              rows.push(currentRow.map((c) => c || ''));
              currentRow = headers.map(() => null);
            }

            let fullValue = initialValue;
            let nextLineIdx = i + 1;
            while (nextLineIdx < lines.length) {
              const nextLine = lines[nextLineIdx].trim();
              if (headers.some((h) => nextLine.startsWith(`${h}:`)) || !nextLine) break;
              fullValue += (fullValue ? '\n' : '') + nextLine;
              nextLineIdx++;
              i++;
            }
            currentRow[headerIdx] = fullValue;
          }
        } else if (
          !line.toLowerCase().startsWith('complete') &&
          !line.toLowerCase().startsWith('choose') &&
          !line.includes('___') &&
          !title
        ) {
          title = line;
        }
      }
      if (currentRow && (currentRow[0] !== null || currentRow[1] !== null)) {
        rows.push(currentRow.map((c) => c || ''));
      }
    }

    // Process rows for gaps common to both pseudo types
    rows = rows.map((row, rIdx) => {
      return row.map((cell, cIdx) => {
        return cell.replace(/_{3,}|(\d+)(?:[:.]|\s+)\s*_{2,}/g, (match, num) => {
          const gapNum = num ? parseInt(num) : currentGapNum++;
          blanks.push({
            blankNumber: gapNum,
            row: rIdx,
            col: cIdx,
            answer: '',
            id: `${rIdx}_${cIdx}_${gapNum}`,
          });
          return `__BLANK_${gapNum}__`;
        });
      });
    });

    return [
      {
        question_number:
          blanks.length > 0 ? Math.min(...blanks.map((b) => b.blankNumber)) : startNum,
        question_text: title || 'Table Completion',
        type: 'table_completion',
        group_instructions: instructions,
        table_data: {
          table_headers: headers,
          table_rows: rows,
          blank_positions: blanks,
          blanks_count: blanks.length,
        },
      },
    ];
  }

  // --- STANDARD MARKDOWN TABLE PARSING ---

  // Parse Header: First line starting with |
  // Assumption: First line is header, second is separator |---|
  let headerLine = tableLines[0];
  let bodyStartIndex = 1;

  // Remove leading/trailing pipes and split
  const parseRow = (line) => {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  };

  headers = parseRow(headerLine);

  // Check if second line is separator
  if (tableLines[1].includes('---')) {
    bodyStartIndex = 2;
  }

  // Parse Body
  for (let i = bodyStartIndex; i < tableLines.length; i++) {
    const rowContent = parseRow(tableLines[i]);

    // Ensure row has same cols as header (fill with empty if needed)
    while (rowContent.length < headers.length) rowContent.push('');

    // Process cells for blanks [10] -> __BLANK_10__
    const processedRow = rowContent.map((cell, cIdx) => {
      // Match [10], [11], etc.
      return cell.replace(/\[(\d+)\]/g, (match, numStr) => {
        const num = parseInt(numStr);

        // Add to blanks metadata
        // Note: TableBuilder needs row index relative to body
        const rowIdx = i - bodyStartIndex;

        blanks.push({
          blankNumber: num,
          row: rowIdx,
          col: cIdx,
          answer: '', // Will be filled by mergeAnswers later
          id: `${rowIdx}_${cIdx}_${num}`,
        });

        // Return internal placeholder
        return `__BLANK_${num}__`;
      });
    });

    rows.push(processedRow);
  }

  // Find first question number to link this block
  const firstBlank = blanks.sort((a, b) => a.blankNumber - b.blankNumber)[0];
  const qNum = firstBlank ? firstBlank.blankNumber : startNum;

  return [
    {
      question_number: qNum,
      question_text: 'Complete the table',
      type: 'table_completion',
      group_instructions: instructions,
      correct_answer: '', // Not used for table primarily
      table_data: {
        table_headers: headers,
        table_rows: rows,
        blank_positions: blanks,
        blanks_count: blanks.length,
        table_structure: instructions, // Store instructions here too?
      },
    },
  ];
};

/**
 * Parse Answer List (Paste 2)
 * text format: "1. True.2. False" or "1. A.2. B,C" or "1 A 2 B"
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
