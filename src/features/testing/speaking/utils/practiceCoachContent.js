const COACHING_CONTENT = {
  answer_directly: {
    title: 'Lead with your answer',
    explanation: 'Make your position clear before you add any background or supporting detail.',
    nextStep: 'Start with: “I would say … because …”',
    pattern: 'Answer → reason → detail',
  },
  add_example: {
    title: 'Make it specific',
    explanation:
      'Your point is there. One real example will make it sound more natural and convincing.',
    nextStep: 'Add: “For example, … This showed me that …”',
    pattern: 'Point → example → result',
  },
  extend_reason: {
    title: 'Explain why it matters',
    explanation:
      'You have given a reason; now take it one step further so the examiner can hear your thinking.',
    nextStep: 'Continue with: “This matters to me because …”',
    pattern: 'Reason → why → personal impact',
  },
  develop_detail: {
    title: 'Turn the idea into a scene',
    explanation:
      'Your main point is clear. Add one memorable detail about the place, activity, person, or feeling.',
    nextStep: 'Continue with: “One moment I clearly remember is … because …”',
    pattern: 'Main point → vivid detail → why it mattered',
  },
  stay_on_topic: {
    title: 'Return to the question',
    explanation: 'Keep your next sentence connected to the exact topic the examiner asked about.',
    nextStep: 'Reset with: “To answer the question directly, I would say …”',
    pattern: 'Question → direct answer → support',
  },
  use_complete_sentence: {
    title: 'Build a complete response',
    explanation: 'Give the examiner a full thought, then support it with one reason or detail.',
    nextStep: 'Try: “I think … because … For example, …”',
    pattern: 'Complete thought → reason → example',
  },
};

const DEFAULT_CONTENT = {
  title: 'Build your next answer',
  explanation: 'Keep your response direct, specific, and connected to the question.',
  nextStep: 'Try: “I would say … because … For example, …”',
  pattern: 'Answer → reason → example',
};

export function getPracticeCoachContent({ code, evidenceQuote, partNumber } = {}) {
  const base = COACHING_CONTENT[code] || DEFAULT_CONTENT;
  const partPrefix = Number(partNumber) === 2 ? 'For your long turn: ' : '';

  return {
    ...base,
    explanation: `${partPrefix}${base.explanation}`,
    evidenceQuote:
      String(evidenceQuote || '')
        .trim()
        .slice(0, 180) || null,
  };
}
