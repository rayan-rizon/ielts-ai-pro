/**
 * Bulk IELTS listening question parser internals.
 */
import { BLANK_PATTERN, TABLE_SEPARATOR_REGEX } from './constants';

export const parseTableCompletion = (lines, instructions, range, title) => {
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
