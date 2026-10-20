export const GRAMMAR_SKILL_CODES = [
  'grammar_sentence_boundaries',
  'grammar_verb_forms',
  'grammar_agreement_number',
  'grammar_articles_determiners',
  'grammar_clause_control',
  'grammar_word_forms',
];

export const GRAMMAR_SKILL_META = {
  grammar_sentence_boundaries: {
    shortLabel: 'Sentence boundaries',
    transferHint: 'Build complete comparisons and arguments without fragments or run-ons.',
    accent: 'violet',
    guideOutcome: 'Build complete ideas and connect them without fragments or run-on sentences.',
  },
  grammar_verb_forms: {
    shortLabel: 'Verb forms',
    transferHint: 'Match tense, aspect, voice, and verb patterns to the IELTS task.',
    accent: 'blue',
    guideOutcome: 'Choose tense, voice, and verb patterns from the time and meaning of the task.',
  },
  grammar_agreement_number: {
    shortLabel: 'Agreement & number',
    transferHint: 'Control subjects, quantities, and countable or uncountable nouns.',
    accent: 'emerald',
    guideOutcome: 'Match the real subject to its verb and control countable and mass nouns.',
  },
  grammar_articles_determiners: {
    shortLabel: 'Articles & determiners',
    transferHint: 'Use a, an, the, and zero article precisely in IELTS contexts.',
    accent: 'orange',
    guideOutcome: 'Choose articles from meaning: general or specific, introduced or already known.',
  },
  grammar_clause_control: {
    shortLabel: 'Clause control',
    transferHint: 'Compare, concede, explain, and qualify ideas with controlled clauses.',
    accent: 'cyan',
    guideOutcome: 'Choose a clear relationship before joining or qualifying IELTS ideas.',
  },
  grammar_word_forms: {
    shortLabel: 'Word forms',
    transferHint: 'Choose accurate noun, verb, adjective, and adverb forms.',
    accent: 'pink',
    guideOutcome: 'Use sentence position and meaning to select the right form from a word family.',
  },
};

export const QUESTION_FORMAT_META = {
  form_selection: {
    label: 'Choose the missing form',
    instruction: 'Choose the option that completes the sentence.',
    responseHint: 'Select one answer.',
  },
  error_correction: {
    label: 'Repair the sentence',
    instruction: 'Correct the grammar. Change only what is needed.',
    responseHint: 'Write the complete corrected sentence.',
  },
  sentence_completion: {
    label: 'Complete the sentence',
    instruction: 'Type the missing word or phrase.',
    responseHint: 'Enter only the missing part.',
  },
  meaning_preserving_transformation: {
    label: 'Choose the accurate version',
    instruction: 'Choose the accurate sentence with the same meaning.',
    responseHint: 'Select one answer.',
  },
};

export const EVIDENCE_META = {
  diagnostic: {
    label: 'Not enough answers',
    description: 'Answer a few more questions to see a reliable result.',
    className:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
  },
  early: {
    label: 'Early result',
    description: 'Based on only a few answers, so treat it as a first guide.',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200',
  },
  measured: {
    label: 'Reliable result',
    description: 'A steady pattern across enough answers.',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200',
  },
};

export function evidenceMeta(value) {
  return EVIDENCE_META[value] || EVIDENCE_META.diagnostic;
}

export function skillLabel(skillCode) {
  return (
    GRAMMAR_SKILL_META[skillCode]?.shortLabel ||
    String(skillCode || '')
      .replace(/^grammar_/, '')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function skillMeta(skillCode) {
  return GRAMMAR_SKILL_META[skillCode] || {};
}

export function questionFormatMeta(questionFormat) {
  return (
    QUESTION_FORMAT_META[questionFormat] || {
      label: 'Grammar question',
      instruction: 'Choose or write the grammatically accurate answer.',
      responseHint: 'Give one answer.',
    }
  );
}

function stripLegacyPrompt(prompt) {
  const value = String(prompt || '').trim();
  const curlyQuote = value.match(/“([^”]+)”\s*$/);
  if (curlyQuote?.[1]) return curlyQuote[1].trim();
  const straightQuote = value.match(/"([^"]+)"\s*$/);
  if (straightQuote?.[1]) return straightQuote[1].trim();
  return value;
}

export function grammarQuestionPresentation(item) {
  const format = questionFormatMeta(item?.questionFormat);
  const hasOptions = Array.isArray(item?.options) && item.options.length > 0;
  return {
    ...format,
    instruction:
      hasOptions && ['sentence_completion', 'error_correction'].includes(item?.questionFormat)
        ? 'Choose the option that completes the sentence.'
        : format.instruction,
    responseHint: hasOptions ? 'Select one answer.' : format.responseHint,
    sentence: stripLegacyPrompt(item?.prompt),
  };
}

export function grammarContextPresentation(academicContext) {
  const context = academicContext || {};
  const module = String(context.module || '').toLowerCase();
  const task = String(context.task || '').toLowerCase();
  const moduleLabel =
    module === 'writing' ? 'Writing' : module === 'speaking' ? 'Speaking' : 'IELTS';
  const taskLabel = task
    ? task
        .replace('_', ' ')
        .replace(/\btask\b/i, 'Task')
        .replace(/\bpart\b/i, 'Part')
        .replace(/\b\d+\b/, (value) => value)
    : '';
  const scenario = String(context.scenario || '')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    moduleLabel,
    taskLabel,
    scenario,
    shortLabel: [moduleLabel, taskLabel].filter(Boolean).join(' · '),
  };
}
