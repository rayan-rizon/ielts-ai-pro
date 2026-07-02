/**
 * Bulk IELTS listening question parser internals.
 */
import { BLANK_PATTERN } from './constants';

export const parseNotesCompletion = (lines, instructions, range, title) => {
  let structuredText = '';
  let gapCount = 0;
  const gapNumbers = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]; // Use let for modification

    // Handle "Example" lines: merge with next line and style
    if (line.trim().toLowerCase() === 'example') {
      const nextLine = lines[i + 1];
      if (nextLine) {
        // Merge and style: <span class="..."> (Example) </span> Content
        // We use standard Tailwind classes. The renderer must allow these classes or at least the span.
        // Based on ListeningTest.jsx, it renders HTML, so classes should pass through if not stripped.
        // We use 'text-slate-500 italic' for the muted look.
        line = `<span class="text-slate-500 italic mr-2">(Example)</span> ${nextLine}`;
        i++; // Skip next line since we merged it
      }
    }

    let processedLine = line;
    const trimmedLine = line.trim();

    // Convert [N]_____ to [gap] and track the gap numbers
    processedLine = processedLine.replace(BLANK_PATTERN, (match, num) => {
      gapNumbers.push(parseInt(num));
      gapCount++;
      return '[gap]';
    });

    // Detect section headers: short lines that aren't bullets or gaps
    // Examples: "Personal Assessment", "Types of membership"
    const isBulletPoint = trimmedLine.match(/^[-•●]./);
    const hasGap = trimmedLine.includes('[gap]') || trimmedLine.includes('_____');
    const isShortLine = trimmedLine.length > 0 && trimmedLine.length < 50; // Increased length (was 40)

    // Header detection logic
    // We shouldn't treat our newly formatted HTML Example line as a header
    const isHtmlExample = processedLine.includes('<span');
    const looksLikeHeader = isShortLine && !isBulletPoint && !hasGap && !isHtmlExample;

    if (looksLikeHeader) {
      // Wrap section headers in ** for bold rendering
      processedLine = `**${trimmedLine}**`;
    }

    // Keep blank lines for structure - use newline separator for proper rendering
    structuredText += processedLine + '\n';
  }

  // Trim trailing newlines but keep internal structure
  structuredText = structuredText.replace(/\n$/, '');

  console.log('[parseNotesCompletion] Gaps found:', gapNumbers);

  // Return a single question object representing the entire notes completion block
  return [
    {
      question_number: range.start,
      question_text: instructions || 'Complete the notes below.',
      type: 'notes_completion',
      group_instructions: instructions,
      gap_fill: {
        title: title,
        text: structuredText, // Use 'text' for compatibility with GapFillContent
        box_title: title,
        answers: {},
        gap_count: gapCount,
        gap_numbers: gapNumbers, // Store original gap numbers for answer mapping
      },
      correct_answer: '',
      options: [],
    },
  ];
};

/**
 * Parse Multiple Choice questions
 * Extracts question text and option letters A-E
 * Properly handles multi-select questions (Choose TWO letters, etc.)
 */
