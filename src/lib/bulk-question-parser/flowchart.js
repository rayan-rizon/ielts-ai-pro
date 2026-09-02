/**
 * Parse reading flow-chart completion blocks into the shared flowchart shape.
 */

const ARROW_PATTERN = /^(?:[↓→↘↗➔➡➜➤➥➦➧➨➩➪➫➬➭➮➯➲➳➴]|[-=]>+|\||[Vv])$/;
const NUMBERED_BLANK_PATTERN = /(?:\[(\d+)\]|\b(\d+)[.)]?)\s*_{2,}/g;

const isArrow = (line) => ARROW_PATTERN.test(line.trim());

const normalizeStep = (text, fallbackNumber) => {
  const gapNumbers = [];
  let nextFallback = fallbackNumber;

  let normalizedText = text.replace(NUMBERED_BLANK_PATTERN, (_match, bracketed, inline) => {
    gapNumbers.push(parseInt(bracketed || inline));
    return '[gap]';
  });

  normalizedText = normalizedText.replace(/\[gap\]|_{3,}/g, () => {
    const gapNumber = gapNumbers[nextFallback - fallbackNumber] || nextFallback;
    if (!gapNumbers.includes(gapNumber)) gapNumbers.push(gapNumber);
    nextFallback++;
    return '[gap]';
  });

  return {
    text: normalizedText.trim(),
    gapNumbers,
  };
};

export const parseFlowchart = (lines, instructions, range) => {
  const contentLines = lines.map((line) => line.trim()).filter(Boolean);
  const hasArrows = contentLines.some(isArrow);
  const firstLine = contentLines[0] || '';
  const firstLineHasBlank = /(?:\[\d+\]|\b\d+[.)]?)\s*_{2,}|\[gap\]|_{3,}/.test(firstLine);
  const boxTitle =
    hasArrows && firstLine && !firstLineHasBlank && !isArrow(firstLine) ? firstLine : '';
  const stepLines = boxTitle ? contentLines.slice(1) : contentLines;
  const rawSteps = [];
  let currentStep = [];

  const pushStep = () => {
    const text = currentStep.join('\n').trim();
    if (text) rawSteps.push(text);
    currentStep = [];
  };

  stepLines.forEach((line) => {
    if (isArrow(line)) {
      pushStep();
    } else {
      currentStep.push(line);
    }
  });
  pushStep();

  let nextGapNumber = range?.start || 1;
  const steps = rawSteps.map((rawStep, index) => {
    const normalized = normalizeStep(rawStep, nextGapNumber);
    if (normalized.gapNumbers.length > 0) {
      nextGapNumber = Math.max(nextGapNumber, ...normalized.gapNumbers) + 1;
    }

    return {
      id: `flow_${range?.start || 1}_${index}`,
      text: normalized.text,
      type: 'box',
      gap_numbers: normalized.gapNumbers,
    };
  });

  return [
    {
      question_number: range?.start || 1,
      question_text: boxTitle || 'Flow chart',
      type: 'flowchart',
      group_instructions: instructions,
      options: [],
      correct_answer: '',
      flowchart: {
        box_title: boxTitle,
        style: 'ABC',
        answer_mode: 'input',
        steps,
        options: [],
        answers: {},
      },
    },
  ];
};
