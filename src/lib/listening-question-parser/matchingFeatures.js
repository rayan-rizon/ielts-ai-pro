/**
 * Bulk IELTS listening question parser internals.
 */
export const parseMatchingFeatures = (lines, instructions, range, title) => {
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
