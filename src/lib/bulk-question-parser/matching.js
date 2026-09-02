/**
 * Bulk IELTS reading question parser internals.
 */
export const parseMatchingQuestions = (lines, instructions, type, startNum) => {
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
