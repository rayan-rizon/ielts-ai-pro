/**
 * Bulk IELTS listening question parser internals.
 */
export const parseMapLabeling = (lines, instructions, range, _title) => {
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
