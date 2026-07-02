export const formatIeltsInstructions = (text) => {
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
export const RANGE_REGEX = /^(?:###\s*)?Questions?\s+(\d+)\s*(?:[-–—]|and|&|,|to)\s*(\d+)/i;

// Single question pattern: "### Question 1" (without a range)
export const SINGLE_QUESTION_REGEX =
  /^(?:###\s*)?Question\s+(\d+)(?!\s*(?:[-–—]|and|&|,|to)\s*\d+)/i;

// Notes title pattern: [NOTES_TITLE: Some Title]
export const NOTES_TITLE_REGEX = /^\[(?:NOTES|FORM|TABLE)_TITLE:\s*(.+?)\]$/i;

// Table header separator pattern: |---|---|
export const TABLE_SEPARATOR_REGEX = /^\s*\|?\s*[:\-]+(?:\s*\|\s*[:\-]+)+\s*\|?\s*$/;

// Blank pattern: [1]_____ or [1]
export const BLANK_PATTERN = /\[(\d+)\]\s*_*/g;
export const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Main parser entry point for listening questions
 * @param {string} text - The raw markdown text
 * @param {string} targetSection - e.g., "Part 1"
 */
