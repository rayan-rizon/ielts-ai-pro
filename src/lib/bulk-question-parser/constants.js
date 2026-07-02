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
export const RANGE_REGEX = /^(?:###\s*)?Questions?\s+(\d+)\s*(?:[-–—]|and|&|,|to)\s*(\d+)/i;

// Single question pattern: "Question 26" (without a range, not followed by dash/number)
export const SINGLE_QUESTION_REGEX = /^(?:\*\*|###)?\s*Question\s+(\d+)(?!\s*[-–—]\s*\d+)/i;
export const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Helper to automatically format IELTS instructions with bolding on constraints.
 */
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
