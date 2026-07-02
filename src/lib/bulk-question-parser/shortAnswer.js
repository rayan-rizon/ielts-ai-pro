/**
 * Bulk IELTS reading question parser internals.
 */
export const parseShortAnswer = (lines, instructions, type, _startNum) => {
  const questions = [];
  let title = '';
  let questionStartIndex = 0;

  // DEBUG logging
  console.log('[parseShortAnswer] Lines:', lines.slice(0, 5));
  console.log('[parseShortAnswer] Instructions:', instructions.substring(0, 100));

  // 1. Look for title line - check BOTH lines array AND instructions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if it's a numbered question (e.g., "19. The most...")
    if (line.match(/^\d+[.)]/)) {
      questionStartIndex = i;
      break;
    }

    // Check if it's a potential title (ends with ? or is a short header-like text)
    if (
      line.endsWith('?') ||
      (line.length < 80 &&
        line.length > 5 &&
        !line.includes('___') &&
        !line.match(/^\d+[.)]/) &&
        !line.toLowerCase().startsWith('complete'))
    ) {
      title = line;
      console.log('[parseShortAnswer] Found title in lines:', title);
    }
  }

  // Also check instructions if we didn't find a title in lines
  if (!title) {
    const instrLines = instructions.split('.');
    for (const line of instrLines) {
      const trimmed = line.trim();
      if (trimmed.endsWith('?') && !trimmed.match(/^\d+[.)]/)) {
        title = trimmed;
        console.log('[parseShortAnswer] Found title in instructions:', title);
        break;
      }
    }
  }

  // 2. Parse each numbered question
  for (let i = questionStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const numMatch = line.match(/^(\d+)[.)]\s*(.*)/);
    if (numMatch) {
      const qNum = parseInt(numMatch[1]);
      let qText = numMatch[2].trim();

      // Replace underscores with [N] markers for the gap
      // This allows the renderer to show input fields inline
      qText = qText.replace(/_{3,}/g, `[${qNum}]`);

      questions.push({
        question_number: qNum,
        question_text: qText,
        type: 'short_answer',
        group_instructions: instructions,
        options: [],
        correct_answer: '',
        // Store structured text for rendering with inline gaps
        gap_fill: {
          title: title || null,
          structured_text: qText,
          gap_count: 1,
        },
      });
    }
  }

  console.log('[parseShortAnswer] Parsed', questions.length, 'questions with title:', title);

  return questions;
};

/**
 * Parse Notes Completion - Structured notes with bullets, title, and inline gaps
 * Input formats supported:
 * 1. Structured bullets with ● and – markers
 * 2. Numbered blanks like "9. _____ attached to hull by wires"
 * 3. Blanks in middle/end like "legs are placed into _____"
 *
 * Output: Single question with gap_fill.structured_text containing formatted content
 * Each numbered item becomes a bullet point with [N] placeholder for the input
 */
