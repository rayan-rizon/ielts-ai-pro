/**
 * Bulk IELTS reading question parser internals.
 */
import { formatIeltsInstructions, RANGE_REGEX, SINGLE_QUESTION_REGEX } from './constants';
import { detectType, isMatchingType } from './typeDetection';
import { parseMatchingQuestions } from './matching';
import { parseNotesCompletion } from './notesCompletion';
import { parseShortAnswer } from './shortAnswer';
import { parseTableCompletion } from './tableCompletion';
import { parseFlowchart } from './flowchart';

export const parseBlock = (block) => {
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

  if (type === 'flowchart') {
    return parseFlowchart(questionLines, instructions, block.range);
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
      if (currentQ) {
        currentQ.question_text = cleanQuestionText(currentQ.question_text, type);
        questions.push(currentQ);
      }

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
        question_text: cleanQuestionText(numMatch[2], type),
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
      } else if (
        (type === 'true_false_not_given' || type === 'yes_no_not_given') &&
        isTfngOptionLine(line)
      ) {
        // Skip standalone TRUE / FALSE / NOT GIVEN or YES / NO / NOT GIVEN option lines
        continue;
      } else {
        currentQ.question_text += ' ' + line;
      }
    }
  }

  if (currentQ) {
    currentQ.question_text = cleanQuestionText(currentQ.question_text, type);
    questions.push(currentQ);
  }
  return questions;
};

/**
 * Detects standalone True/False/Not Given or Yes/No/Not Given option lines.
 */
export const isTfngOptionLine = (line) => {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Single option line: e.g. "TRUE", "FALSE", "NOT GIVEN", "YES", "NO", "True.", "(NOT GIVEN)"
  if (/^(?:[([{\s]*)(?:TRUE|FALSE|NOT\s+GIVEN|YES|NO)(?:[\])}\s.]*)$/i.test(trimmed)) {
    return true;
  }

  // Combined option group line: e.g. "TRUE / FALSE / NOT GIVEN", "YES/NO/NOT GIVEN", "[TRUE / FALSE / NOT GIVEN]"
  if (/^(?:[([{\s]*)(?:TRUE|FALSE|NOT\s+GIVEN|YES|NO|\/|\s|-)+(?:[\])}\s.]*)$/i.test(trimmed)) {
    if (/\b(?:TRUE|FALSE|NOT\s+GIVEN|YES|NO)\b/i.test(trimmed)) {
      return true;
    }
  }

  return false;
};

/**
 * Clean question text by stripping option labels (TRUE, FALSE, NOT GIVEN, YES, NO)
 * that may have been pasted inline or appended at the end of statement questions.
 */
export const cleanQuestionText = (text, type) => {
  if (!text) return '';
  let cleaned = text.trim();

  if (type === 'true_false_not_given' || type === 'yes_no_not_given') {
    // 1. Remove trailing bracketed/parenthesized option groups
    // e.g., "[TRUE / FALSE / NOT GIVEN]", "(TRUE/FALSE/NOT GIVEN)"
    cleaned = cleaned.replace(/[\s(-]*[[(]\s*(?:TRUE|FALSE|NOT\s+GIVEN|YES|NO|\/|\s|-)+\s*[\])][\s.]*$/gi, '');

    // 2. Remove trailing sequence of 2+ option keywords, preserving sentence-ending punctuation
    // e.g. "Statement. TRUE FALSE NOT GIVEN" -> "Statement."
    cleaned = cleaned.replace(/(?<=[.!?])[\s,.-/]+(?:TRUE|FALSE|NOT\s+GIVEN|YES|NO)(?:[\s,.-/]+(?:TRUE|FALSE|NOT\s+GIVEN|YES|NO))+[\s,.-/]*$/gi, '');
    cleaned = cleaned.replace(/[\s,-/]+(?:TRUE|FALSE|NOT\s+GIVEN|YES|NO)(?:[\s,-/]+(?:TRUE|FALSE|NOT\s+GIVEN|YES|NO))+[\s,.-/]*$/gi, '');

    // 3. Remove trailing single option keyword if preceded by sentence ending punctuation
    cleaned = cleaned.replace(/(?<=[.!?])\s*(?:TRUE|FALSE|NOT\s+GIVEN|YES|NO)[\s.]*$/gi, '');
  }

  return cleaned.trim();
};

// --- Pattern Matchers ---

/**
 * Intelligent question type detection based on instructions and content patterns.
 * Priority order matters - more specific patterns checked first.
 */
