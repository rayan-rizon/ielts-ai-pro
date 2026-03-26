/**
 * Listening Question Parser
 *
 * A separate parser for listening tests that handles:
 * - Notes/Form Completion with titles and bullet points
 * - Table Completion with markdown tables
 * - Multiple choice questions
 * - Matching questions
 *
 * Format expected:
 * ### Questions 1-6
 * Complete the notes below.
 * Write ONE WORD for each answer.
 *
 * [NOTES_TITLE: SELF-DRIVE TOURS IN THE USA]
 * - Address: 24 [1]_____ Road
 * - Heard about company from: [2]_____
 */

/**
 * Helper to automatically format IELTS instructions with bolding on constraints
 * and ensuring proper line breaks.
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

  // First, normalize mashed instructions onto separate lines
  // e.g. "Complete the notes below. Write ONE WORD..." -> "Complete the notes below.\n\nWrite ONE WORD..."
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

  return formatted;
};

// Question range pattern: "### Questions 1-6" or "Questions 1 and 6" or "Questions 1 to 6"
const RANGE_REGEX = /^(?:###\s*)?Questions?\s+(\d+)\s*(?:[-–—]|and|&|,|to)\s*(\d+)/i;

// Single question pattern: "### Question 1" (without a range)
const SINGLE_QUESTION_REGEX = /^(?:###\s*)?Question\s+(\d+)(?!\s*(?:[-–—]|and|&|,|to)\s*\d+)/i;

// Notes title pattern: [NOTES_TITLE: Some Title]
const NOTES_TITLE_REGEX = /^\[(?:NOTES|FORM|TABLE)_TITLE:\s*(.+?)\]$/i;

// Table header separator pattern: |---|---|
const TABLE_SEPARATOR_REGEX = /^\s*\|?\s*[:\-]+(?:\s*\|\s*[:\-]+)+\s*\|?\s*$/;

// Blank pattern: [1]_____ or [1]
const BLANK_PATTERN = /\[(\d+)\]\s*_*/g;
const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Main parser entry point for listening questions
 * @param {string} text - The raw markdown text
 * @param {string} targetSection - e.g., "Part 1"
 */
export const parseListeningQuestions = (text, targetSection = '') => {
  if (!text || !text.trim()) return [];

  const lines = text.split(LINE_SPLIT_REGEX);
  const blocks = [];
  let currentBlock = { raw: [], range: null };

  // Split into blocks based on "### Questions X-Y" headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    const rangeMatch = trimmedLine.match(RANGE_REGEX);
    const singleMatch = trimmedLine.match(SINGLE_QUESTION_REGEX);

    if (rangeMatch || singleMatch) {
      // Push previous block if it has content
      if (currentBlock.raw.length > 0 || currentBlock.range) {
        blocks.push(currentBlock);
      }

      if (rangeMatch) {
        currentBlock = {
          range: { start: parseInt(rangeMatch[1]), end: parseInt(rangeMatch[2]) },
          raw: [line],
          startIndex: i,
        };
      } else {
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

  console.log(
    '[listeningQuestionParser] Blocks detected:',
    blocks.map((b) => ({
      range: b.range,
      lineCount: b.raw.length,
      firstLine: b.raw[0]?.substring(0, 60),
    }))
  );

  // Process each block
  let allQuestions = [];
  blocks.forEach((block) => {
    if (!block.range) return; // Skip blocks without a question range

    const parsed = parseBlock(block);
    allQuestions = [...allQuestions, ...parsed];
  });

  return allQuestions.map((q) => ({
    ...q,
    section: targetSection,
  }));
};

/**
 * Parse a single block of questions
 */
const parseBlock = (block) => {
  const lines = block.raw;
  if (!lines.length) return [];

  const range = block.range;
  let instructions = '';
  let title = '';
  let contentLines = [];
  let isTable = false;

  // Extract instructions (lines after header, before content)
  // Instructions typically start with "Complete", "Choose", "Write", etc.
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip the header line
    if (line.match(RANGE_REGEX) || line.match(SINGLE_QUESTION_REGEX)) {
      continue;
    }

    // Check for NOTES_TITLE, FORM_TITLE, or TABLE_TITLE marker
    const titleMatch = line.match(NOTES_TITLE_REGEX);
    if (titleMatch) {
      title = titleMatch[1].trim();
      contentStartIndex = i + 1;
      // If it's a TABLE_TITLE, mark as table
      if (line.toUpperCase().includes('TABLE_TITLE')) {
        isTable = true;
      }
      break; // Title marks start of content area
    }

    // Instructions lines (before actual content)
    // For MCQ: "Choose TWO letters, A-E." is the instruction
    // "Which TWO characteristics..." is the QUESTION TEXT, not instruction
    const isChooseInstruction = line.toLowerCase().startsWith('choose');
    const hasChooseInstructions = instructions.toLowerCase().includes('choose');

    // If we already have a "choose" instruction, treat "which/what" lines as content (question text)
    if (
      hasChooseInstructions &&
      (line.toLowerCase().startsWith('which') || line.toLowerCase().startsWith('what'))
    ) {
      // This is the question text, not an instruction - mark as content start
      contentStartIndex = i;
      break;
    }

    if (
      line.toLowerCase().startsWith('complete') ||
      isChooseInstruction ||
      line.toLowerCase().startsWith('write') ||
      line.toLowerCase().startsWith('read') ||
      line.toLowerCase().startsWith('label') ||
      // Only treat which/what as instruction if we don't have choose instruction yet
      (!hasChooseInstructions &&
        (line.toLowerCase().startsWith('what') || line.toLowerCase().startsWith('which')))
    ) {
      instructions += (instructions ? '\n\n' : '') + line;
      contentStartIndex = i + 1;
      continue;
    }

    // Detect table by markdown table syntax
    if (line.startsWith('|') && line.includes('|')) {
      isTable = true;
      contentStartIndex = i;
      break;
    }

    // Detect content by bullet points or blanks
    if (
      line.startsWith('-') ||
      line.startsWith('•') ||
      line.startsWith('*') ||
      (line.includes('[') && line.includes(']')) ||
      line.match(/^\d+\s*[:.)]\s*.+/)
    ) {
      contentStartIndex = i;
      break;
    }

    // Detect option lines like "A ancient forts" or "A. ancient forts" or "Plans A..."
    if (line.match(/^([A-Z][.).\s]\s*[a-zA-Z]|(?:Plans|Choices|Options|List|Features)\s+[A-Z])/i)) {
      // Look back to include the box title (e.g., "Features") if present
      const prevLine = lines[i - 1]?.trim();
      if (prevLine && prevLine.length < 50 && !prevLine.match(/^(.+|[A-I])[.).]/i)) {
        contentStartIndex = i - 1;
      } else {
        contentStartIndex = i;
      }
      break;
    }

    // Detect numbered question lines like "11 The idea..." or "Facilities 16..."
    if (
      line.match(/^(\d+[.)]?\s+.+|(?:Facilities|Statements|Questions|Descriptions)\s+\d+[.)]?\s+)/i)
    ) {
      // Look back to include any title header (e.g., "New city developments")
      const prevLine = lines[i - 1]?.trim();
      if (
        prevLine &&
        prevLine.length < 80 &&
        prevLine.length > 2 &&
        !prevLine.toLowerCase().includes('choose') &&
        !prevLine.toLowerCase().includes('write') &&
        !prevLine.match(/^[A-G][.).]/i) &&
        !prevLine.match(/^\d+[.)]/)
      ) {
        contentStartIndex = i - 1;
      } else {
        contentStartIndex = i;
      }
      break;
    }

    // If line doesn't match known patterns but isn't empty, it might be the title
    if (!title && line.length < 80 && !line.startsWith('Example')) {
      // Could be a title line without [NOTES_TITLE:] marker
      // Check if next significant line has content markers
      // Relaxed check: Allow Example lines to follow specific title candidates
      const nextSignificant = lines.slice(i + 1).find((l) => l.trim());

      if (
        nextSignificant &&
        (nextSignificant.trim().startsWith('-') ||
          nextSignificant.trim().startsWith('•') ||
          nextSignificant.toLowerCase().startsWith('example') || // Title can be followed by Example
          (nextSignificant.includes('[') && nextSignificant.includes('_____')))
      ) {
        title = line.replace(/\*\*/g, '').trim();
        contentStartIndex = i + 1;
        break; // Assume title marks transition to content
      }
    }
  }

  // Get content lines
  contentLines = lines.slice(contentStartIndex);

  // Removed strict filter for "Example" lines to allow them to appear in content
  // contentLines = contentLines.filter(line => ...);

  console.log('[parseBlock] Range:', range, 'Title:', title, 'IsTable:', isTable);
  console.log('[parseBlock] Instructions:', instructions.substring(0, 100));
  console.log('[parseBlock] Content lines:', contentLines.length);

  const lowerInstr = instructions.toLowerCase();

  // Check if content has bullet points with gaps - indicator of notes completion
  const hasBulletGaps = contentLines.some((l) => {
    const trimmed = l.trim();
    return (
      (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) &&
      trimmed.match(/(\[\d+\])?\s*_+/)
    );
  });

  // Check if content has matching features structure:
  // 1. Separate option letters (A Moondancer, B Echo)
  // 2. Numbered statements with gaps (16 It has... [16]_____)
  // Both must be present for matching features
  const hasMatchingStructure = (() => {
    let foundOptions = false;
    let foundNumberedStatementGaps = false;

    for (const line of contentLines) {
      const trimmed = line.trim();
      // Option line: "A Moondancer" or "Plans A..."
      if (
        (trimmed.match(/^[A-Z][.).\s]\s*[A-Za-z]/) ||
          trimmed.match(/^(?:Plans|Choices|Options|List|Features)\s+[A-Z]/i)) &&
        !trimmed.match(/^\d/)
      ) {
        foundOptions = true;
      }
      // Numbered statement: "16 It has..." or "Facilities 16..."
      if (
        trimmed.match(
          /(?:\d+[.)]?\s+.+(\[\d+\]\s*_+|_+)|(?:Facilities|Statements|Questions|Descriptions)\s+\d+)/i
        )
      ) {
        foundNumberedStatementGaps = true;
      }
    }
    return foundOptions && foundNumberedStatementGaps;
  })();

  // Detect Map/Diagram Labeling: "label the map", "label the diagram", "label the plan"
  // Must be checked BEFORE matching features since map labeling has similar structure
  const isMapLabeling =
    lowerInstr.includes('label the map') ||
    lowerInstr.includes('label the diagram') ||
    lowerInstr.includes('label the plan') ||
    lowerInstr.includes('label the picture') ||
    lowerInstr.includes('label the floor plan');

  // Detect Matching Features: requires explicit keywords OR full matching structure
  // NOT triggered by just having [N]_____ patterns (notes also have those)
  // NOT triggered if already detected as map labeling
  const isMatchingFeatures =
    !hasBulletGaps &&
    !isMapLabeling &&
    (lowerInstr.includes('box') ||
      lowerInstr.includes('list of') ||
      (lowerInstr.includes('match') && !lowerInstr.includes('complete')) ||
      lowerInstr.includes('next to questions') ||
      hasMatchingStructure);

  // Detect MCQ: "Choose TWO letters" or similar patterns
  // Only if NOT already detected as matching features
  // Check for option lines like "A Children make up..." or "A. Children make up..." in content
  // Also handles format without separator: "A Some rooms now have a different use."
  const hasOptionLines = contentLines.some((l) => {
    const trimmed = l.trim();
    // Match: A Something... OR A. Something... OR A) Something...
    return trimmed.match(/^[A-G](?:[.)\s]|$)/) && trimmed.length > 2;
  });

  // Check if there's a question text (Which TWO..., What TWO...) before options
  const hasQuestionText = contentLines.some((l) => {
    const trimmed = l.trim().toLowerCase();
    return (
      (trimmed.startsWith('which') || trimmed.startsWith('what')) && !trimmed.match(/^[a-g][.)\s]/)
    );
  });

  const isMCQ =
    !isMatchingFeatures &&
    !isMapLabeling &&
    ((lowerInstr.includes('choose') && lowerInstr.match(/letters?[\s,]+[a-z][\s.-]*[a-z]/i)) ||
      (lowerInstr.includes('choose') && lowerInstr.includes('correct')) ||
      (lowerInstr.includes('which') && hasOptionLines) ||
      (hasQuestionText && hasOptionLines) ||
      hasOptionLines); // If we have A., B., C. options, it's likely MCQ

  // Detect Flowchart: "flowchart" in instructions, title or arrows in content
  const blockText = (instructions + ' ' + title).toLowerCase();
  const isFlowchart =
    blockText.includes('flowchart') ||
    blockText.includes('flow-chart') ||
    (blockText.includes('flow') && blockText.includes('chart')) ||
    contentLines.some(
      (l) => l.includes('↓') || l.includes('→') || l.includes('->') || l.includes('=>')
    );

  // Route to appropriate parser
  const formattedInstructions = formatIeltsInstructions(instructions);

  if (isTable) {
    return parseTableCompletion(contentLines, formattedInstructions, range, title);
  } else if (isMapLabeling) {
    return parseMapLabeling(contentLines, formattedInstructions, range, title);
  } else if (isFlowchart) {
    return parseFlowchart(contentLines, formattedInstructions, range, title);
  } else if (isMatchingFeatures) {
    return parseMatchingFeatures(contentLines, formattedInstructions, range, title);
  } else if (isMCQ) {
    return parseMCQ(contentLines, formattedInstructions, range, title);
  } else {
    return parseNotesCompletion(contentLines, formattedInstructions, range, title);
  }
};

const parseFlowchart = (lines, instructions, range, title) => {
  const options = [];
  const steps = [];
  let currentStepText = '';
  let boxTitle = title || '';

  // 1. Detect letters/options (A-G)
  const optionLines = lines.filter((l) => l.trim().match(/^[A-Z][.).\s]\s*[a-zA-Z]/i));
  optionLines.forEach((l) => {
    const match = l.trim().match(/^([A-Z])[.).\s]\s*(.+)/i);
    if (match) {
      options.push(match[2].trim());
    }
  });

  // 2. Extract steps and handle arrows
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || optionLines.includes(line)) return;

    // Check for arrow markers: ↓, →, ->, =>, etc.
    const isArrow =
      trimmed.match(/^[↓→↘↗➔➡➜➔➤➥➦➧➨➩➪➫➬➭➮➯➲➳➴➲]$/) ||
      trimmed.match(/^[-=]>+$/) ||
      trimmed === '|' ||
      trimmed === 'V' ||
      trimmed === 'v';

    if (isArrow) {
      if (currentStepText) {
        const text = currentStepText.trim();
        const stepGapNumbers = [];
        text.replace(BLANK_PATTERN, (m, num) => {
          stepGapNumbers.push(parseInt(num));
          return '[gap]';
        });

        steps.push({
          id: `fs_${Date.now()}_${steps.length}`,
          text: text.replace(BLANK_PATTERN, '[gap]'),
          type: 'box',
          gap_numbers: stepGapNumbers,
        });
        currentStepText = '';
      }
      return;
    }

    // Capture text for the current step
    // If we're starting a new step and the line is a bullet, we might want to clean it or preserve it
    currentStepText += (currentStepText ? '\n' : '') + trimmed;
  });

  // Push final step if exists
  if (currentStepText) {
    const text = currentStepText.trim();
    const stepGapNumbers = [];
    text.replace(BLANK_PATTERN, (m, num) => {
      stepGapNumbers.push(parseInt(num));
      return '[gap]';
    });

    steps.push({
      id: `fs_${Date.now()}_${steps.length}`,
      text: text.replace(BLANK_PATTERN, '[gap]'),
      type: 'box',
      gap_numbers: stepGapNumbers,
    });
  }

  // Fallback: If no steps were parsed but we have content
  if (steps.length === 0 && lines.length > 0) {
    // Treat each line that has gaps as a step
    lines.forEach((l) => {
      const t = l.trim();
      const stepGapNumbers = [];
      const hasGaps = t.match(/\[\d+\]/);

      if (hasGaps) {
        t.replace(BLANK_PATTERN, (m, num) => {
          stepGapNumbers.push(parseInt(num));
          return '[gap]';
        });

        steps.push({
          id: `fs_fallback_${Date.now()}_${steps.length}`,
          text: t.replace(BLANK_PATTERN, '[gap]'),
          type: 'box',
          gap_numbers: stepGapNumbers,
        });
      }
    });
  }

  return [
    {
      question_number: range.start,
      question_text: boxTitle || 'Flowchart',
      type: 'flowchart',
      group_instructions: instructions,
      flowchart: {
        box_title: boxTitle,
        style: 'ABC',
        answer_mode: options.length > 0 ? 'dropdown' : 'input',
        steps: steps,
        options: options,
        answers: {},
      },
    },
  ];
};

/**
 * Parse Matching Features questions
 * Separates options (A, B, C...) from Questions (15, 16...)
 */
const parseMatchingFeatures = (lines, instructions, range, title) => {
  const options = [];
  const questions = [];
  let boxTitle = '';
  let questionsTitle = '';

  // Line-by-line parsing for better handling of structured input
  const seenLetters = new Set();
  const seenQ = new Set();

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Remove markdown bold markers
    line = line.replace(/\*\*/g, '');

    // 1. Check for Option matches
    const optionMatch = line.match(/^([A-Z])[.).\s]\s*(.+)/i);
    // 2. Check for Question matches
    const questionMatch = line.match(/^(\d+)\s*[.)]?\s*(.+)/);

    if (optionMatch) {
      const letter = optionMatch[1].toUpperCase();
      const text = optionMatch[2].trim().replace(/[.;,]+$/, '');

      // Only add if we haven't seen this letter AND the text doesn't look like a question number
      if (!seenLetters.has(letter) && !text.match(/^\d+\s/) && text.length > 1) {
        options.push(text);
        seenLetters.add(letter);
      }
      continue;
    }

    if (questionMatch) {
      const num = parseInt(questionMatch[1]);
      if (num >= range.start && num <= range.end && !seenQ.has(num)) {
        let qText = questionMatch[2].trim();
        // Clean up question text
        qText = qText.replace(/(\[\d+\]\s*_*|_+)/g, '').trim();
        qText = qText.replace(/[.…_]+$/, '').trim();

        if (qText.length > 0) {
          questions.push({
            questionNumber: num,
            text: qText,
          });
          seenQ.add(num);
        }
      }
      continue;
    }

    // 3. Relaxed Title Detection: standalone line that isn't an option or question
    // If we haven't found options yet, assume it's the box title
    if (seenLetters.size === 0 && !boxTitle && line.length > 3) {
      let cleaned = line
        .replace(/\s+below\.?$/i, '')
        .replace(/[.:]+$/, '')
        .trim();

      // Convert ALL CAPS to Title Case
      if (cleaned === cleaned.toUpperCase() && cleaned.length > 5) {
        cleaned = cleaned
          .toLowerCase()
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      boxTitle = cleaned;
      continue;
    }

    // If we have options but haven't found questions yet, assume it's the questions title
    if (seenLetters.size > 0 && seenQ.size === 0 && !questionsTitle && line.length > 3) {
      questionsTitle = line;
      continue;
    }
  }

  // Fallback 1: If questions were missed, generate placeholders
  if (questions.length === 0) {
    for (let i = range.start; i <= range.end; i++) {
      questions.push({ questionNumber: i, text: `Item ${i}` });
    }
  }

  // Fallback 2: If options were missed, try to extract from instructions
  if (options.length === 0) {
    const instRangeMatch = instructions.match(/letters?\s*,?\s*([A-Z])\s*[-–]\s*([A-Z])/i);
    if (instRangeMatch) {
      const startChar = instRangeMatch[1].toUpperCase().charCodeAt(0);
      const endChar = instRangeMatch[2].toUpperCase().charCodeAt(0);
      for (let code = startChar; code <= endChar; code++) {
        options.push('');
      }
    } else {
      // Default to A, B, C if all else fails
      options.push('A', 'B', 'C');
    }
  }

  return [
    {
      question_number: range.start,
      question_text: questionsTitle || title || 'Matching Features',
      mcq_title: questionsTitle || title || '',
      type: 'matching_features',
      group_instructions: instructions,
      matching_features: {
        style: 'ABC',
        mode: 'list',
        box_title: boxTitle || '',
        questions_title: questionsTitle || '',
        options: options,
        questions: questions.map((q) => ({
          id: `mq_${q.questionNumber}`,
          questionNumber: q.questionNumber,
          text: q.text,
          answer: '',
        })),
        answers: {},
      },
    },
  ];
};

/**
 * Parse Map/Diagram Labeling questions
 * Similar to matching features but for map/diagram/plan labeling
 * Extracts letter options (A-I) from instructions and question items from content
 */
const parseMapLabeling = (lines, instructions, range, title) => {
  const options = [];
  const questions = [];

  // Extract letter options from instructions (e.g., "Write the correct letter A-I")
  const rangeMatch = instructions.match(/letters?.+([A-Z]).*[-–].*([A-Z])/i);
  if (rangeMatch) {
    const startChar = rangeMatch[1].toUpperCase().charCodeAt(0);
    const endChar = rangeMatch[2].toUpperCase().charCodeAt(0);
    for (let code = startChar; code <= endChar; code++) {
      options.push(String.fromCharCode(code));
    }
  }

  // Fallback: try "A, B, C or D" format
  if (options.length === 0) {
    const listMatch = instructions.match(/letters?.+([A-Z](?:.*,.*[A-Z])*).+or.+([A-Z])/i);
    if (listMatch) {
      const letters = listMatch[1].split(',').map((l) => l.trim().toUpperCase());
      letters.push(listMatch[2].toUpperCase());
      letters.forEach((letter) => {
        if (!options.includes(letter)) options.push(letter);
      });
    }
  }

  // Extract questions from numbered lines or bullet points with numbers
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Match formats:
    // 1. "17 box office [17]_____"
    // 2. "- 17 box office [17]_____"
    // 3. "17) box office"
    // 4. "17. box office"
    let questionMatch = trimmed.match(/^(\d+)[.)]\s*(.*)/);

    // Also try bullet point format: "- 17 box office..."
    if (!questionMatch) {
      questionMatch = trimmed.match(/^[-•●*]\s*(\d+)\s+(.+)/);
    }

    // Also try plain number start: "17 box office..."
    if (!questionMatch) {
      questionMatch = trimmed.match(/^(\d+)\s+(.+)/);
    }

    if (questionMatch) {
      const qNum = parseInt(questionMatch[1]);
      if (qNum >= range.start && qNum <= range.end) {
        // Clean up question text (remove [N]_____ patterns)
        let qText = questionMatch[2].trim();
        qText = qText.replace(/(\[\d+\]\s*_+|_+)/g, '').trim();
        qText = qText.replace(/[.…_]+$/, '').trim();

        questions.push({
          id: `map_${qNum}`,
          questionNumber: qNum,
          text: qText,
          answer: '',
        });
      }
    }
  });

  return [
    {
      question_number: range.start,
      question_text: 'Map Labeling',
      type: 'map_labeling',
      group_instructions: instructions,
      map_labeling: {
        options: options,
        questions: questions,
        image_url: '', // Can be filled in by admin
        answers: {},
      },
    },
  ];
};

/**
 * Parse Notes/Form Completion questions
 * Converts [N]_____ patterns to [gap] markers
 * Detects and preserves section headers (like "Personal Assessment")
 */
const parseNotesCompletion = (lines, instructions, range, title) => {
  let structuredText = '';
  let gapCount = 0;
  const gapNumbers = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]; // Use let for modification

    // Handle "Example" lines: merge with next line and style
    if (line.trim().toLowerCase() === 'example') {
      const nextLine = lines[i + 1];
      if (nextLine) {
        // Merge and style: <span class="..."> (Example) </span> Content
        // We use standard Tailwind classes. The renderer must allow these classes or at least the span.
        // Based on ListeningTest.jsx, it renders HTML, so classes should pass through if not stripped.
        // We use 'text-slate-500 italic' for the muted look.
        line = `<span class="text-slate-500 italic mr-2">(Example)</span> ${nextLine}`;
        i++; // Skip next line since we merged it
      }
    }

    let processedLine = line;
    const trimmedLine = line.trim();

    // Convert [N]_____ to [gap] and track the gap numbers
    processedLine = processedLine.replace(BLANK_PATTERN, (match, num) => {
      gapNumbers.push(parseInt(num));
      gapCount++;
      return '[gap]';
    });

    // Detect section headers: short lines that aren't bullets or gaps
    // Examples: "Personal Assessment", "Types of membership"
    const isBulletPoint = trimmedLine.match(/^[-•●]./);
    const hasGap = trimmedLine.includes('[gap]') || trimmedLine.includes('_____');
    const isShortLine = trimmedLine.length > 0 && trimmedLine.length < 50; // Increased length (was 40)

    // Header detection logic
    // We shouldn't treat our newly formatted HTML Example line as a header
    const isHtmlExample = processedLine.includes('<span');
    const looksLikeHeader = isShortLine && !isBulletPoint && !hasGap && !isHtmlExample;

    if (looksLikeHeader) {
      // Wrap section headers in ** for bold rendering
      processedLine = `**${trimmedLine}**`;
    }

    // Keep blank lines for structure - use newline separator for proper rendering
    structuredText += processedLine + '\n';
  }

  // Trim trailing newlines but keep internal structure
  structuredText = structuredText.replace(/\n$/, '');

  console.log('[parseNotesCompletion] Gaps found:', gapNumbers);

  // Return a single question object representing the entire notes completion block
  return [
    {
      question_number: range.start,
      question_text: instructions || 'Complete the notes below.',
      type: 'notes_completion',
      group_instructions: instructions,
      gap_fill: {
        title: title,
        text: structuredText, // Use 'text' for compatibility with GapFillContent
        box_title: title,
        answers: {},
        gap_count: gapCount,
        gap_numbers: gapNumbers, // Store original gap numbers for answer mapping
      },
      correct_answer: '',
      options: [],
    },
  ];
};

/**
 * Parse Multiple Choice questions
 * Extracts question text and option letters A-E
 * Properly handles multi-select questions (Choose TWO letters, etc.)
 */
const parseMCQ = (lines, instructions, range, title) => {
  // Detect if multi-select (Choose TWO letters, etc.) from instructions
  // Strip ** markers before matching to ensure formatter don't break detection
  const cleanInstructions = instructions.replace(/\*\*/g, '');
  const countMatch = cleanInstructions.match(
    /choose\s+(two|three|four|five|six|2|3|4|5|6)\s+letters?/i
  );
  const isMultiSelect = !!countMatch;
  const questionCount = countMatch
    ? countMatch[1].match(/two|2/i)
      ? 2
      : countMatch[1].match(/three|3/i)
        ? 3
        : countMatch[1].match(/four|4/i)
          ? 4
          : countMatch[1].match(/five|5/i)
            ? 5
            : 6
    : 1;

  // Check if lines contain explicit numbering matching the range
  // Also check for combined patterns like "21-22" or "21&22"
  const rangeNumbers = new Set();
  for (let i = range.start; i <= range.end; i++) rangeNumbers.add(i);

  // Check for combined number patterns: "21-22 Which TWO..." or "21&22 What..."
  const combinedPatterns = [];
  const singlePatterns = [];

  lines.forEach((l) => {
    const trimmed = l.trim();
    // Match combined: "21-22 Text" or "21–22 Text" (en-dash) or "21&22 Text"
    const combinedMatch = trimmed.match(/^(\d+)\s*[-–&]\s*(\d+)[\s.)]+(.+)/);
    if (combinedMatch) {
      const start = parseInt(combinedMatch[1]);
      const end = parseInt(combinedMatch[2]);
      if (rangeNumbers.has(start) || rangeNumbers.has(end)) {
        combinedPatterns.push({
          start,
          end,
          text: combinedMatch[3].trim(),
          line: trimmed,
        });
      }
    } else {
      // Match single: "21." or "21)" or "21 What" (number followed by delimiter or space+letter)
      const singleMatch = trimmed.match(/^(\d+)(?:[.)]\s*|\s+)(.+)/);
      if (singleMatch && rangeNumbers.has(parseInt(singleMatch[1]))) {
        singlePatterns.push({
          num: parseInt(singleMatch[1]),
          text: singleMatch[2].trim(),
          line: trimmed,
        });
      }
    }
  });

  // If we have combined patterns AND it's a multi-select question, use those
  const useCombined = combinedPatterns.length > 0 && isMultiSelect;

  // Find MCQ title (header before first numbered question)
  let mcqTitle = title || '';
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Check if this line is a numbered question
    const isNumbered = trimmed.match(/^\d+[\s.)]+/) || trimmed.match(/^\d+\s*[-–&]\s*\d+/);
    if (isNumbered) break; // Stop at first question

    // Check if this is an option line
    const isOption = trimmed.match(/^[A-G](?:[.)\s]+)/i);
    if (isOption) continue;

    // This could be a title - must be short-ish and appear before questions
    if (
      trimmed.length < 80 &&
      !trimmed.toLowerCase().includes('choose') &&
      !trimmed.toLowerCase().includes('letters')
    ) {
      mcqTitle = trimmed;
    }
  }

  if (useCombined) {
    // Multi-select mode: Parse combined patterns like "21-22 Which TWO..."
    const questions = [];

    for (const pattern of combinedPatterns) {
      const options = [];

      // Find options for this question - they come after the question line
      let foundQuestion = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed === pattern.line) {
          foundQuestion = true;
          continue;
        }

        if (foundQuestion) {
          // Match options: "A. Text" or "A) Text" or "A Text"
          const optionMatch = trimmed.match(/^([A-G])(?:[.)\s]+)(.+)/i);
          if (optionMatch) {
            options.push(`${optionMatch[1].toUpperCase()}. ${optionMatch[2].trim()}`);
          } else if (
            trimmed.match(/^\d+\s*[-–&]?\s*\d*[\s.)]/) &&
            !trimmed.startsWith(pattern.start.toString())
          ) {
            // We've hit another question, stop collecting options
            break;
          }
        }
      }

      // Clean the question text - remove duplicate instruction patterns
      let cleanText = pattern.text;
      cleanText = cleanText.replace(
        /^Choose\s+(TWO|THREE|FOUR|FIVE)\s+letters[.,\s]+[A-Z][-–][A-Z][.,\s]*/i,
        ''
      );
      cleanText = cleanText.replace(/^[.,\s]+/, '').trim();

      questions.push({
        question_number: pattern.start,
        question_text: cleanText || pattern.text,
        type: 'multiple_choice',
        options: options,
        allow_multiple: true,
        question_count: pattern.end - pattern.start + 1,
        group_instructions: instructions,
        _displayStartNumber: pattern.start,
        _displayEndNumber: pattern.end,
        _displaySize: pattern.end - pattern.start + 1,
      });
    }

    // Attach mcq_title to first question
    if (questions.length > 0 && mcqTitle) {
      questions[0].mcq_title = mcqTitle;
    }

    return questions;
  } else if (singlePatterns.length > 0 && !isMultiSelect) {
    // Single-select mode: Multiple separate MCQ questions
    const questions = [];
    let currentQ = null;

    const finalizeQuestion = () => {
      if (currentQ) {
        questions.push(currentQ);
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Match single numbered question
      const numberMatch = trimmed.match(/^(\d+)[.)\s]+(.+)/);
      if (numberMatch && rangeNumbers.has(parseInt(numberMatch[1]))) {
        finalizeQuestion();
        currentQ = {
          question_number: parseInt(numberMatch[1]),
          question_text: numberMatch[2].trim(),
          type: 'multiple_choice',
          options: [],
          allow_multiple: false,
          group_instructions: instructions,
        };
      } else if (currentQ) {
        // Add to current question (option or text continuation)
        const optionMatch = trimmed.match(/^([A-G])(?:[.)\s]+)(.+)/i);
        if (optionMatch) {
          currentQ.options.push(`${optionMatch[1].toUpperCase()}. ${optionMatch[2].trim()}`);
        } else {
          currentQ.question_text += ' ' + trimmed;
        }
      }
    }
    finalizeQuestion();

    // Attach mcq_title to first question
    if (questions.length > 0 && mcqTitle) {
      questions[0].mcq_title = mcqTitle;
    }

    return questions;
  } else {
    // Fallback: Single question block (no numbered lines in content)
    let questionText = '';
    const options = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip combined patterns like "21-22" at start
      if (trimmed.match(/^\d+\s*[-–&]\s*\d+/)) {
        const textMatch = trimmed.match(/^\d+\s*[-–&]\s*\d+[\s.)+]+(.+)/);
        if (textMatch && !questionText) {
          questionText = textMatch[1].trim();
        }
        continue;
      }

      // Match options
      const optionMatch = trimmed.match(/^([A-G])(?:[.)\s]+)(.+)/i);
      if (optionMatch) {
        options.push(`${optionMatch[1].toUpperCase()}. ${optionMatch[2].trim()}`);
      } else if (!questionText && !trimmed.match(/^[a-g][.)]?$/i)) {
        questionText = trimmed;
      } else if (questionText) {
        questionText += ' ' + trimmed;
      }
    }

    // Clean the question text
    let cleanText = questionText || '';
    cleanText = cleanText.replace(
      /^Choose\s+(TWO|THREE|FOUR|FIVE)\s+letters[.,\s]+[A-Z][-–][A-Z][.,\s]*/i,
      ''
    );
    cleanText = cleanText.replace(/^[.,\s]+/, '').trim();

    console.log(
      '[parseMCQ] Single Q:',
      cleanText,
      'Options:',
      options.length,
      'MultiSelect:',
      isMultiSelect
    );

    return [
      {
        question_number: range.start,
        question_text: cleanText || instructions,
        type: 'multiple_choice',
        group_instructions: instructions,
        mcq_title: mcqTitle,
        options: options,
        allow_multiple: isMultiSelect,
        question_count: isMultiSelect ? questionCount : 1,
        _displayStartNumber: range.start,
        _displayEndNumber: isMultiSelect ? range.start + questionCount - 1 : range.start,
        _displaySize: isMultiSelect ? questionCount : 1,
        correct_answer: '', // Admin will fill
      },
    ];
  }
};

/**
 * Parse Table Completion questions
 * Parses markdown tables and extracts blanks
 */
const parseTableCompletion = (lines, instructions, range, title) => {
  const tableLines = lines.filter((l) => l.trim().startsWith('|'));

  if (tableLines.length < 2) {
    console.warn('[parseTableCompletion] Not enough table lines');
    return [];
  }

  let headers = [];
  let rows = [];
  const blanks = [];
  const gapNumbers = [];
  let bodyStartIndex = 0;

  // Parse table row
  const parseRow = (line) => {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  };

  // First line is header
  headers = parseRow(tableLines[0]);

  // Check if second line is separator (|---|---|)
  if (tableLines[1] && TABLE_SEPARATOR_REGEX.test(tableLines[1].trim())) {
    bodyStartIndex = 2;
  } else {
    bodyStartIndex = 1;
  }

  // Parse body rows
  for (let i = bodyStartIndex; i < tableLines.length; i++) {
    const rowContent = parseRow(tableLines[i]);

    // Ensure row has same cols as header
    while (rowContent.length < headers.length) rowContent.push('');

    // Process cells for blanks
    const processedRow = rowContent.map((cell, cIdx) => {
      // Replace [N]_____ with __BLANK_N__ marker
      const processed = cell.replace(BLANK_PATTERN, (match, numStr) => {
        const num = parseInt(numStr);
        gapNumbers.push(num);

        // Track blank position
        const rowIdx = i - bodyStartIndex;
        blanks.push({
          blankNumber: num,
          row: rowIdx,
          col: cIdx,
          answer: '',
          id: `${rowIdx}_${cIdx}_${num}`,
        });

        return `__BLANK_${num}__`;
      });

      return processed;
    });

    rows.push(processedRow);
  }

  // Sort blanks by number
  blanks.sort((a, b) => a.blankNumber - b.blankNumber);
  const firstBlank = blanks[0];
  const qNum = firstBlank ? firstBlank.blankNumber : range.start;

  console.log('[parseTableCompletion] Headers:', headers);
  console.log('[parseTableCompletion] Rows:', rows.length, 'Blanks:', blanks.length);

  return [
    {
      question_number: qNum,
      question_text: title || 'Complete the table',
      type: 'table_completion',
      group_instructions: instructions,
      table_data: {
        title: title,
        box_title: title,
        table_headers: headers, // Use table_headers for UI compatibility
        table_rows: rows, // Use table_rows for UI compatibility
        blank_positions: blanks, // Use blank_positions for UI compatibility
        blanks_count: blanks.length,
        gap_numbers: gapNumbers,
      },
      correct_answer: '',
      options: [],
    },
  ];
};

/**
 * Parse Answer List for listening questions
 * Handles multiple formats:
 * - Simple: "1. answer" or "1 answer"
 * - Combined questions: "21&22 B, D" -> 21=B, 22=D
 * - Alternative answers: "33 sugar / sugars" -> stores "sugar / sugars" (ALL alternatives preserved)
 *
 * IMPORTANT: Alternatives are preserved using " / " separator for IELTS-standard grading
 */
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
