/**
 * Bulk IELTS listening question parser internals.
 */
export const parseMCQ = (lines, instructions, range, title) => {
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
