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
  },
  grammar_verb_forms: {
    shortLabel: 'Verb forms',
    transferHint: 'Match tense, aspect, voice, and verb patterns to the IELTS task.',
  },
  grammar_agreement_number: {
    shortLabel: 'Agreement & number',
    transferHint: 'Control subjects, quantities, and countable or uncountable nouns.',
  },
  grammar_articles_determiners: {
    shortLabel: 'Articles & determiners',
    transferHint: 'Use a, an, the, and zero article precisely in IELTS contexts.',
  },
  grammar_clause_control: {
    shortLabel: 'Clause control',
    transferHint: 'Compare, concede, explain, and qualify ideas with controlled clauses.',
  },
  grammar_word_forms: {
    shortLabel: 'Word forms',
    transferHint: 'Choose accurate noun, verb, adjective, and adverb forms.',
  },
};

export const EVIDENCE_META = {
  diagnostic: {
    label: 'Diagnostic',
    description: 'Not enough observations to identify a pattern.',
    className:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
  },
  early: {
    label: 'Early',
    description: 'A tentative practice suggestion based on limited evidence.',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200',
  },
  measured: {
    label: 'Measured',
    description: 'A recurring pattern supported by sufficient observations.',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200',
  },
};

export const TRANSFER_PROMPTS = {
  writing:
    'Write a 120–160 word Academic IELTS paragraph. For Task 1, compare two important features from a chart or process. For Task 2, state one position and support it with a reason and example.',
  speaking:
    'Choose one of your existing IELTS Speaking responses. Feedback will use only the saved transcript and the selected grammar targets.',
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
