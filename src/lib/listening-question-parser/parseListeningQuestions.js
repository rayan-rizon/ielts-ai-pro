/**
 * Bulk IELTS listening question parser internals.
 */
import { LINE_SPLIT_REGEX, RANGE_REGEX, SINGLE_QUESTION_REGEX } from './constants';
import { parseBlock } from './parseBlock';

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
