import grammarWorkbookMarkdown from '../../../../IELTS Essential Grammar — Complete Guide & Practice.md?raw';

const UNIT_META = [
  {
    number: 1,
    slug: 'complete-sentences-and-clauses',
    title: 'Complete sentences and clauses',
    summary: 'Build complete IELTS sentences and repair fragments, run-ons, and weak clause joins.',
    skillCode: 'grammar_sentence_boundaries',
    kit: 'Sentence Foundations',
    minutes: 9,
  },
  {
    number: 2,
    slug: 'subject-verb-agreement',
    title: 'Subject–verb agreement',
    summary: 'Find the true subject in longer IELTS sentences and match it to the correct verb.',
    skillCode: 'grammar_agreement_number',
    kit: 'Sentence Foundations',
    minutes: 7,
  },
  {
    number: 3,
    slug: 'nouns-countability-and-quantity',
    title: 'Nouns, countability and quantity',
    summary:
      'Control countable and uncountable nouns, quantity words, and common academic plurals.',
    skillCode: 'grammar_agreement_number',
    kit: 'Sentence Foundations',
    minutes: 8,
  },
  {
    number: 4,
    slug: 'articles-a-an-the-and-zero',
    title: 'Articles: a, an, the and zero article',
    summary: 'Choose articles from meaning, specificity, and whether a noun is countable.',
    skillCode: 'grammar_articles_determiners',
    kit: 'Sentence Foundations',
    minutes: 8,
  },
  {
    number: 5,
    slug: 'pronouns-and-reference',
    title: 'Pronouns and clear reference',
    summary:
      'Make every pronoun and relative word point clearly to the right person, thing, or idea.',
    skillCode: 'grammar_clause_control',
    kit: 'Sentence Foundations',
    minutes: 7,
  },
  {
    number: 6,
    slug: 'essential-tense-control',
    title: 'Essential tense control',
    summary: 'Choose tense from the timeline in Task 1, Task 2, and Speaking answers.',
    skillCode: 'grammar_verb_forms',
    kit: 'Verbs & Time',
    minutes: 9,
  },
  {
    number: 7,
    slug: 'gerunds-and-infinitives',
    title: 'Gerunds and infinitives',
    summary: 'Use accurate verb patterns after common academic verbs, modals, and prepositions.',
    skillCode: 'grammar_verb_forms',
    kit: 'Verbs & Time',
    minutes: 8,
  },
  {
    number: 8,
    slug: 'modal-verbs-and-claim-strength',
    title: 'Modal verbs and claim strength',
    summary: 'Express possibility, recommendation, obligation, and cautious academic claims.',
    skillCode: 'grammar_verb_forms',
    kit: 'Verbs & Time',
    minutes: 7,
  },
  {
    number: 9,
    slug: 'coordination-and-parallel-structure',
    title: 'Coordination and parallel structure',
    summary: 'Join equal ideas and keep lists and paired structures grammatically balanced.',
    skillCode: 'grammar_sentence_boundaries',
    kit: 'Grammatical Range',
    minutes: 7,
  },
  {
    number: 10,
    slug: 'subordination-and-logical-relationships',
    title: 'Subordination and logical relationships',
    summary: 'Show reason, contrast, condition, time, and purpose with controlled clauses.',
    skillCode: 'grammar_clause_control',
    kit: 'Grammatical Range',
    minutes: 9,
  },
  {
    number: 11,
    slug: 'relative-clauses',
    title: 'Relative clauses',
    summary: 'Add defining or extra information accurately and use reduced clauses with care.',
    skillCode: 'grammar_clause_control',
    kit: 'Grammatical Range',
    minutes: 8,
  },
  {
    number: 12,
    slug: 'conditionals',
    title: 'Conditionals',
    summary: 'Build real, hypothetical, and past conditions without tense errors in the if-clause.',
    skillCode: 'grammar_clause_control',
    kit: 'Grammatical Range',
    minutes: 9,
  },
  {
    number: 13,
    slug: 'accurate-comparisons',
    title: 'Accurate comparisons',
    summary: 'Compare numbers, proportions, groups, and trends precisely in IELTS Task 1.',
    skillCode: 'grammar_agreement_number',
    kit: 'Grammatical Range',
    minutes: 7,
  },
  {
    number: 14,
    slug: 'passive-voice',
    title: 'Passive voice',
    summary: 'Keep attention on a process, result, or unknown actor without hiding responsibility.',
    skillCode: 'grammar_verb_forms',
    kit: 'Grammatical Range',
    minutes: 8,
  },
  {
    number: 15,
    slug: 'reported-views-and-reporting-verbs',
    title: 'Reported views and reporting verbs',
    summary: 'Present evidence and claims with accurate reporting structures and verb patterns.',
    skillCode: 'grammar_verb_forms',
    kit: 'Grammatical Range',
    minutes: 7,
  },
  {
    number: 16,
    slug: 'participle-clauses',
    title: 'Participle clauses',
    summary: 'Write concise academic sentences while avoiding unclear or dangling modifiers.',
    skillCode: 'grammar_clause_control',
    kit: 'Grammatical Range',
    minutes: 7,
  },
  {
    number: 17,
    slug: 'hedging-and-precision',
    title: 'Hedging and precision',
    summary: 'Replace unsupported certainty with accurate, defensible academic claims.',
    skillCode: 'grammar_clause_control',
    kit: 'IELTS Accuracy Clinic',
    minutes: 6,
  },
  {
    number: 18,
    slug: 'punctuation-for-grammar-accuracy',
    title: 'Punctuation for grammar accuracy',
    summary: 'Use full stops, commas, semicolons, and apostrophes to keep meaning controlled.',
    skillCode: 'grammar_sentence_boundaries',
    kit: 'IELTS Accuracy Clinic',
    minutes: 8,
  },
];

export const FREE_GRAMMAR_GUIDE_UNIT_COUNT = 3;

const KIT_META = [
  {
    slug: 'sentence-foundations',
    title: 'Sentence Foundations',
    eyebrow: 'Units 1–5',
    description:
      'Repair the high-frequency errors that hold back accuracy: sentence boundaries, agreement, nouns, articles, and reference.',
    skills: [
      'grammar_sentence_boundaries',
      'grammar_agreement_number',
      'grammar_articles_determiners',
      'grammar_clause_control',
    ],
    tone: 'violet',
  },
  {
    slug: 'verbs-and-time',
    title: 'Verbs & Time',
    eyebrow: 'Units 6–8',
    description:
      'Control timelines, verb patterns, and the strength of claims across Writing and Speaking.',
    skills: ['grammar_verb_forms'],
    tone: 'blue',
  },
  {
    slug: 'grammatical-range',
    title: 'Grammatical Range',
    eyebrow: 'Units 9–16',
    description:
      'Build complex grammar deliberately with coordination, clauses, comparisons, voice, and concise reporting.',
    skills: [
      'grammar_sentence_boundaries',
      'grammar_clause_control',
      'grammar_agreement_number',
      'grammar_verb_forms',
    ],
    tone: 'emerald',
  },
  {
    slug: 'ielts-accuracy',
    title: 'IELTS Accuracy Clinic',
    eyebrow: 'Units 17–18 + mixed review',
    description:
      'Refine cautious claims and punctuation, then check whether the patterns transfer into real IELTS sentences.',
    skills: [
      'grammar_sentence_boundaries',
      'grammar_verb_forms',
      'grammar_agreement_number',
      'grammar_articles_determiners',
      'grammar_clause_control',
      'grammar_word_forms',
    ],
    tone: 'amber',
  },
];

function extractUnit(number) {
  const match = grammarWorkbookMarkdown.match(
    new RegExp(
      `## Unit ${number}:?[^\\n]*\\n([\\s\\S]*?)(?=\\n## Unit \\d+:|\\n# Part|\\n# Answer key|$)`
    )
  );
  return match?.[1]?.trim() || '';
}

function extractAnswer(number) {
  const match = grammarWorkbookMarkdown.match(new RegExp(`^- Practice ${number}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim() || '';
}

function addPracticeSupport(unit) {
  const answer = extractAnswer(unit.number);
  let content = extractUnit(unit.number);

  if (unit.number === 17) {
    content += `

### Practice 17

Rewrite each claim so that it is precise and defensible.

1. Social media damages everyone’s mental health.
2. Online learning is always better than classroom learning.
3. This transport policy will completely solve congestion.

## Suggested answer principles

- Limit the group: **some users**, **some learners**, or **in many cities**.
- Choose a cautious verb: **may**, **could**, **tends to**, or **is likely to**.
- Add a condition when the result depends on implementation or context.
`;
  } else if (answer) {
    content += `

## Answer key

${answer}
`;
  }

  return content;
}

export const GRAMMAR_GUIDES = UNIT_META.map((unit, index, units) => ({
  id: `grammar-workbook-unit-${unit.number}`,
  slug: unit.slug,
  skill_code: unit.skillCode,
  title: unit.title,
  summary: unit.summary,
  content_markdown: addPracticeSupport(unit),
  estimated_minutes: unit.minutes,
  content_version: 3,
  unit_number: unit.number,
  kit: unit.kit,
  source: 'IELTS Essential Grammar — Complete Guide & Practice',
  access_tier: unit.number <= FREE_GRAMMAR_GUIDE_UNIT_COUNT ? 'free' : 'pro',
  is_workbook_guide: true,
  previous_slug: units[index - 1]?.slug || null,
  next_slug: units[index + 1]?.slug || null,
}));

export const GRAMMAR_GUIDE_KITS = KIT_META.map((kit) => {
  const guides = GRAMMAR_GUIDES.filter((guide) => guide.kit === kit.title);
  return {
    ...kit,
    access_tier: 'pro',
    guideCount: guides.length,
    minutes: guides.reduce((total, guide) => total + guide.estimated_minutes, 0),
    guideSlugs: guides.map((guide) => guide.slug),
  };
});

export const GRAMMAR_GUIDE_CATEGORIES = ['All guides', ...KIT_META.map((kit) => kit.title)];

export function getGrammarGuide(slug) {
  return GRAMMAR_GUIDES.find((guide) => guide.slug === slug || guide.id === slug) || null;
}

export function getGrammarGuideKit(slug) {
  return GRAMMAR_GUIDE_KITS.find((kit) => kit.slug === slug) || null;
}
