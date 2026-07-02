/**
 * Bulk IELTS listening question parser internals.
 */
import {
  formatIeltsInstructions,
  NOTES_TITLE_REGEX,
  RANGE_REGEX,
  SINGLE_QUESTION_REGEX,
} from './constants';
import { parseFlowchart } from './flowchart';
import { parseMapLabeling } from './mapLabeling';
import { parseMatchingFeatures } from './matchingFeatures';
import { parseMCQ } from './mcq';
import { parseNotesCompletion } from './notesCompletion';
import { parseTableCompletion } from './tableCompletion';

export const parseBlock = (block) => {
  const lines = block.raw;
  if (!lines.length) return [];

  const range = block.range;
  let instructions = '';
  let title = '';
  let contentLines = [];
  let isTable = false;

  // Extract instructions (lines after header, before content)
  // Instructions typically start with "Complete", "Choose", "Write", etc.
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip the header line
    if (line.match(RANGE_REGEX) || line.match(SINGLE_QUESTION_REGEX)) {
      continue;
    }

    // Check for NOTES_TITLE, FORM_TITLE, or TABLE_TITLE marker
    const titleMatch = line.match(NOTES_TITLE_REGEX);
    if (titleMatch) {
      title = titleMatch[1].trim();
      contentStartIndex = i + 1;
      // If it's a TABLE_TITLE, mark as table
      if (line.toUpperCase().includes('TABLE_TITLE')) {
        isTable = true;
      }
      break; // Title marks start of content area
    }

    // Instructions lines (before actual content)
    // For MCQ: "Choose TWO letters, A-E." is the instruction
    // "Which TWO characteristics..." is the QUESTION TEXT, not instruction
    const isChooseInstruction = line.toLowerCase().startsWith('choose');
    const hasChooseInstructions = instructions.toLowerCase().includes('choose');

    // If we already have a "choose" instruction, treat "which/what" lines as content (question text)
    if (
      hasChooseInstructions &&
      (line.toLowerCase().startsWith('which') || line.toLowerCase().startsWith('what'))
    ) {
      // This is the question text, not an instruction - mark as content start
      contentStartIndex = i;
      break;
    }

    if (
      line.toLowerCase().startsWith('complete') ||
      isChooseInstruction ||
      line.toLowerCase().startsWith('write') ||
      line.toLowerCase().startsWith('read') ||
      line.toLowerCase().startsWith('label') ||
      // Only treat which/what as instruction if we don't have choose instruction yet
      (!hasChooseInstructions &&
        (line.toLowerCase().startsWith('what') || line.toLowerCase().startsWith('which')))
    ) {
      instructions += (instructions ? '\n\n' : '') + line;
      contentStartIndex = i + 1;
      continue;
    }

    // Detect table by markdown table syntax
    if (line.startsWith('|') && line.includes('|')) {
      isTable = true;
      contentStartIndex = i;
      break;
    }

    // Detect content by bullet points or blanks
    if (
      line.startsWith('-') ||
      line.startsWith('•') ||
      line.startsWith('*') ||
      (line.includes('[') && line.includes(']')) ||
      line.match(/^\d+\s*[:.)]\s*.+/)
    ) {
      contentStartIndex = i;
      break;
    }

    // Detect option lines like "A ancient forts" or "A. ancient forts" or "Plans A..."
    if (line.match(/^([A-Z][.).\s]\s*[a-zA-Z]|(?:Plans|Choices|Options|List|Features)\s+[A-Z])/i)) {
      // Look back to include the box title (e.g., "Features") if present
      const prevLine = lines[i - 1]?.trim();
      if (prevLine && prevLine.length < 50 && !prevLine.match(/^(.+|[A-I])[.).]/i)) {
        contentStartIndex = i - 1;
      } else {
        contentStartIndex = i;
      }
      break;
    }

    // Detect numbered question lines like "11 The idea..." or "Facilities 16..."
    if (
      line.match(/^(\d+[.)]?\s+.+|(?:Facilities|Statements|Questions|Descriptions)\s+\d+[.)]?\s+)/i)
    ) {
      // Look back to include any title header (e.g., "New city developments")
      const prevLine = lines[i - 1]?.trim();
      if (
        prevLine &&
        prevLine.length < 80 &&
        prevLine.length > 2 &&
        !prevLine.toLowerCase().includes('choose') &&
        !prevLine.toLowerCase().includes('write') &&
        !prevLine.match(/^[A-G][.).]/i) &&
        !prevLine.match(/^\d+[.)]/)
      ) {
        contentStartIndex = i - 1;
      } else {
        contentStartIndex = i;
      }
      break;
    }

    // If line doesn't match known patterns but isn't empty, it might be the title
    if (!title && line.length < 80 && !line.startsWith('Example')) {
      // Could be a title line without [NOTES_TITLE:] marker
      // Check if next significant line has content markers
      // Relaxed check: Allow Example lines to follow specific title candidates
      const nextSignificant = lines.slice(i + 1).find((l) => l.trim());

      if (
        nextSignificant &&
        (nextSignificant.trim().startsWith('-') ||
          nextSignificant.trim().startsWith('•') ||
          nextSignificant.toLowerCase().startsWith('example') || // Title can be followed by Example
          (nextSignificant.includes('[') && nextSignificant.includes('_____')))
      ) {
        title = line.replace(/\*\*/g, '').trim();
        contentStartIndex = i + 1;
        break; // Assume title marks transition to content
      }
    }
  }

  // Get content lines
  contentLines = lines.slice(contentStartIndex);

  // Removed strict filter for "Example" lines to allow them to appear in content
  // contentLines = contentLines.filter(line => ...);

  console.log('[parseBlock] Range:', range, 'Title:', title, 'IsTable:', isTable);
  console.log('[parseBlock] Instructions:', instructions.substring(0, 100));
  console.log('[parseBlock] Content lines:', contentLines.length);

  const lowerInstr = instructions.toLowerCase();

  // Check if content has bullet points with gaps - indicator of notes completion
  const hasBulletGaps = contentLines.some((l) => {
    const trimmed = l.trim();
    return (
      (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) &&
      trimmed.match(/(\[\d+\])?\s*_+/)
    );
  });

  // Check if content has matching features structure:
  // 1. Separate option letters (A Moondancer, B Echo)
  // 2. Numbered statements with gaps (16 It has... [16]_____)
  // Both must be present for matching features
  const hasMatchingStructure = (() => {
    let foundOptions = false;
    let foundNumberedStatementGaps = false;

    for (const line of contentLines) {
      const trimmed = line.trim();
      // Option line: "A Moondancer" or "Plans A..."
      if (
        (trimmed.match(/^[A-Z][.).\s]\s*[A-Za-z]/) ||
          trimmed.match(/^(?:Plans|Choices|Options|List|Features)\s+[A-Z]/i)) &&
        !trimmed.match(/^\d/)
      ) {
        foundOptions = true;
      }
      // Numbered statement: "16 It has..." or "Facilities 16..."
      if (
        trimmed.match(
          /(?:\d+[.)]?\s+.+(\[\d+\]\s*_+|_+)|(?:Facilities|Statements|Questions|Descriptions)\s+\d+)/i
        )
      ) {
        foundNumberedStatementGaps = true;
      }
    }
    return foundOptions && foundNumberedStatementGaps;
  })();

  // Detect Map/Diagram Labeling: "label the map", "label the diagram", "label the plan"
  // Must be checked BEFORE matching features since map labeling has similar structure
  const isMapLabeling =
    lowerInstr.includes('label the map') ||
    lowerInstr.includes('label the diagram') ||
    lowerInstr.includes('label the plan') ||
    lowerInstr.includes('label the picture') ||
    lowerInstr.includes('label the floor plan');

  // Detect Matching Features: requires explicit keywords OR full matching structure
  // NOT triggered by just having [N]_____ patterns (notes also have those)
  // NOT triggered if already detected as map labeling
  const isMatchingFeatures =
    !hasBulletGaps &&
    !isMapLabeling &&
    (lowerInstr.includes('box') ||
      lowerInstr.includes('list of') ||
      (lowerInstr.includes('match') && !lowerInstr.includes('complete')) ||
      lowerInstr.includes('next to questions') ||
      hasMatchingStructure);

  // Detect MCQ: "Choose TWO letters" or similar patterns
  // Only if NOT already detected as matching features
  // Check for option lines like "A Children make up..." or "A. Children make up..." in content
  // Also handles format without separator: "A Some rooms now have a different use."
  const hasOptionLines = contentLines.some((l) => {
    const trimmed = l.trim();
    // Match: A Something... OR A. Something... OR A) Something...
    return trimmed.match(/^[A-G](?:[.)\s]|$)/) && trimmed.length > 2;
  });

  // Check if there's a question text (Which TWO..., What TWO...) before options
  const hasQuestionText = contentLines.some((l) => {
    const trimmed = l.trim().toLowerCase();
    return (
      (trimmed.startsWith('which') || trimmed.startsWith('what')) && !trimmed.match(/^[a-g][.)\s]/)
    );
  });

  const isMCQ =
    !isMatchingFeatures &&
    !isMapLabeling &&
    ((lowerInstr.includes('choose') && lowerInstr.match(/letters?[\s,]+[a-z][\s.-]*[a-z]/i)) ||
      (lowerInstr.includes('choose') && lowerInstr.includes('correct')) ||
      (lowerInstr.includes('which') && hasOptionLines) ||
      (hasQuestionText && hasOptionLines) ||
      hasOptionLines); // If we have A., B., C. options, it's likely MCQ

  // Detect Flowchart: "flowchart" in instructions, title or arrows in content
  const blockText = (instructions + ' ' + title).toLowerCase();
  const isFlowchart =
    blockText.includes('flowchart') ||
    blockText.includes('flow-chart') ||
    (blockText.includes('flow') && blockText.includes('chart')) ||
    contentLines.some(
      (l) => l.includes('↓') || l.includes('→') || l.includes('->') || l.includes('=>')
    );

  // Route to appropriate parser
  const formattedInstructions = formatIeltsInstructions(instructions);

  if (isTable) {
    return parseTableCompletion(contentLines, formattedInstructions, range, title);
  } else if (isMapLabeling) {
    return parseMapLabeling(contentLines, formattedInstructions, range, title);
  } else if (isFlowchart) {
    return parseFlowchart(contentLines, formattedInstructions, range, title);
  } else if (isMatchingFeatures) {
    return parseMatchingFeatures(contentLines, formattedInstructions, range, title);
  } else if (isMCQ) {
    return parseMCQ(contentLines, formattedInstructions, range, title);
  } else {
    return parseNotesCompletion(contentLines, formattedInstructions, range, title);
  }
};
