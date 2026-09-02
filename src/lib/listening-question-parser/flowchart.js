/**
 * Bulk IELTS listening question parser internals.
 */
import { BLANK_PATTERN } from './constants';

export const parseFlowchart = (lines, instructions, range, title) => {
  const options = [];
  const steps = [];
  let currentStepText = '';
  let boxTitle = title || '';

  // 1. Detect letters/options (A-G)
  const optionLines = lines.filter((l) => l.trim().match(/^[A-Z][.).\s]\s*[a-zA-Z]/i));
  optionLines.forEach((l) => {
    const match = l.trim().match(/^([A-Z])[.).\s]\s*(.+)/i);
    if (match) {
      options.push(match[2].trim());
    }
  });

  // 2. Extract steps and handle arrows
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || optionLines.includes(line)) return;

    // Check for arrow markers: ↓, →, ->, =>, etc.
    const isArrow =
      trimmed.match(/^[↓→↘↗➔➡➜➔➤➥➦➧➨➩➪➫➬➭➮➯➲➳➴➲]$/) ||
      trimmed.match(/^[-=]>+$/) ||
      trimmed === '|' ||
      trimmed === 'V' ||
      trimmed === 'v';

    if (isArrow) {
      if (currentStepText) {
        const text = currentStepText.trim();
        const stepGapNumbers = [];
        text.replace(BLANK_PATTERN, (m, num) => {
          stepGapNumbers.push(parseInt(num));
          return '[gap]';
        });

        steps.push({
          id: `fs_${Date.now()}_${steps.length}`,
          text: text.replace(BLANK_PATTERN, '[gap]'),
          type: 'box',
          gap_numbers: stepGapNumbers,
        });
        currentStepText = '';
      }
      return;
    }

    // Capture text for the current step
    // If we're starting a new step and the line is a bullet, we might want to clean it or preserve it
    currentStepText += (currentStepText ? '\n' : '') + trimmed;
  });

  // Push final step if exists
  if (currentStepText) {
    const text = currentStepText.trim();
    const stepGapNumbers = [];
    text.replace(BLANK_PATTERN, (m, num) => {
      stepGapNumbers.push(parseInt(num));
      return '[gap]';
    });

    steps.push({
      id: `fs_${Date.now()}_${steps.length}`,
      text: text.replace(BLANK_PATTERN, '[gap]'),
      type: 'box',
      gap_numbers: stepGapNumbers,
    });
  }

  // Fallback: If no steps were parsed but we have content
  if (steps.length === 0 && lines.length > 0) {
    // Treat each line that has gaps as a step
    lines.forEach((l) => {
      const t = l.trim();
      const stepGapNumbers = [];
      const hasGaps = t.match(/\[\d+\]/);

      if (hasGaps) {
        t.replace(BLANK_PATTERN, (m, num) => {
          stepGapNumbers.push(parseInt(num));
          return '[gap]';
        });

        steps.push({
          id: `fs_fallback_${Date.now()}_${steps.length}`,
          text: t.replace(BLANK_PATTERN, '[gap]'),
          type: 'box',
          gap_numbers: stepGapNumbers,
        });
      }
    });
  }

  return [
    {
      question_number: range.start,
      question_text: boxTitle || 'Flowchart',
      type: 'flowchart',
      group_instructions: instructions,
      flowchart: {
        box_title: boxTitle,
        style: 'ABC',
        answer_mode: options.length > 0 ? 'dropdown' : 'input',
        steps: steps,
        options: options,
        answers: {},
      },
    },
  ];
};

/**
 * Parse Matching Features questions
 * Separates options (A, B, C...) from Questions (15, 16...)
 */
