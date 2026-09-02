/**
 * Bulk IELTS reading question parser internals.
 */
import { LINE_SPLIT_REGEX, RANGE_REGEX, SINGLE_QUESTION_REGEX } from './constants';
import { cleanQuestionText, parseBlock } from './parseBlock';

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
    question_text: cleanQuestionText(q.question_text, q.type),
    section: targetSection,
  }));
};
