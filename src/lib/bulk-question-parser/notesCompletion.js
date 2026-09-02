/**
 * Bulk IELTS reading question parser internals.
 */
export const parseNotesCompletion = (lines, instructions, startNum, range) => {
  console.log('[parseNotesCompletion] Parsing', lines.length, 'lines');

  let title = '';
  const structuredLines = [];

  // Find title - typically the first SHORT line that's not a bullet or instruction
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip instructions that start with "Complete", "Choose", "Write"
    if (
      line.toLowerCase().startsWith('complete') ||
      line.toLowerCase().startsWith('choose') ||
      line.toLowerCase().startsWith('write')
    ) {
      continue;
    }

    // If line contains gaps or numbers with gaps, it's content not title
    if (line.includes('___') || line.match(/\d+\.\s*_{3,}/)) {
      break;
    }

    // If line starts with bullet, we're past the title
    if (line.match(/^[●•–-]\s/) || line.match(/^\d+[.)]/)) {
      break;
    }

    // Long lines (>80 chars) are likely paragraph content, not title
    if (line.length > 80) {
      break;
    }

    // Short non-bullet text could be a title - check for ALL CAPS or Title Case
    if (line.length < 80 && !line.includes('___')) {
      title = line;
      break;
    }
  }

  console.log('[parseNotesCompletion] Found title:', title);

  // Process all lines to convert gaps to [N] placeholders
  for (const rawLine of lines) {
    let line = rawLine;

    // Skip the title line if we found one
    if (title && line.trim() === title) continue;

    // Skip empty lines but preserve structure
    if (!line.trim()) {
      structuredLines.push('');
      continue;
    }

    // Skip instruction lines
    const lowerLine = line.toLowerCase().trim();
    if (
      lowerLine.startsWith('complete') ||
      lowerLine.startsWith('choose') ||
      lowerLine.startsWith('write') ||
      lowerLine.includes('no more than') ||
      lowerLine.includes('one word') ||
      lowerLine.includes('two words') ||
      lowerLine.includes('answer sheet')
    ) {
      continue;
    }

    // 1. Convert inline numbered gaps (common in paragraph summaries): "text 33. _____" or "text 33 _____"
    // This replaces "33. _____" or "33 _____" with "[33]"
    line = line.replace(/(\d+)(?:[.)]|\s+)\s*_{2,}/g, '[$1]');

    // 2. Convert numbered lines with a gap later in the line (common in sentence lists): "14. text _____"
    const numberedLineMatch = line.match(/^(\d+)[.)]\s*(.*)/);
    if (numberedLineMatch && line.includes('__')) {
      const num = numberedLineMatch[1];
      const content = numberedLineMatch[2];
      // Only replace if the gap hasn't been converted yet by the inline regex above
      if (!content.includes(`[${num}]`)) {
        line = `${num}. ${content.replace(/_{2,}/g, `[${num}]`)}`;
      }
    }

    // 3. Fallback: handle generic blanks in lines that we know belong to a question
    // but may not have a clear number associated on the same line (rare but for context)
    if (!line.includes('[') && line.includes('___')) {
      line = line.replace(/_{3,}/g, '___');
    }

    // Handle already-formatted [N] followed by underscores
    line = line.replace(/\[(\d+)\]\s*_{2,}/g, '[$1]');

    // SUBHEADING DETECTION
    // If line is short, doesn't start with bullet/number, has no gap, and isn't empty -> Bold it
    // Exclude instructions we might have missed
    const isBullet = /^[●•–-]/.test(line.trim());
    const hasGap = line.includes('[') || line.includes('___');
    const isNumbered = /^\d+[.)]/.test(line.trim());
    const isShort = line.length < 80;
    const isInstruction = /^(complete|choose|write|nb|note|no more than)/i.test(line.trim());

    if (
      isShort &&
      !isBullet &&
      !hasGap &&
      !isNumbered &&
      !isInstruction &&
      line.trim().length > 0
    ) {
      if (!line.includes('**')) {
        line = `**${line.trim()}**`;
      }
    }

    structuredLines.push(line);
  }

  // Recalculate gap count from final text
  const finalText = structuredLines.join('\n');

  // Deduplicate gap markers - extract unique gap numbers
  const gapNumbers = new Set();
  const gapMatches = finalText.matchAll(/\[(\d+)\]/g);
  for (const match of gapMatches) {
    gapNumbers.add(parseInt(match[1]));
  }
  const actualGaps = gapNumbers.size;

  console.log('[parseNotesCompletion] Processed text with', actualGaps, 'unique gaps');

  // Return single question with the full structured content
  return [
    {
      question_number: range?.start || startNum || 1,
      question_text: instructions,
      type: 'notes_completion',
      group_instructions: instructions,
      options: [],
      correct_answer: '',
      gap_fill: {
        title: title,
        structured_text: finalText,
        gap_count: actualGaps,
      },
    },
  ];
};
