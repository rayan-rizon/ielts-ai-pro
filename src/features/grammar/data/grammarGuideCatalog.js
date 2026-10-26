import grammarWorkbookMarkdown from '../../../content/IELTS Essential Grammar — Complete Guide & Practice.md?raw';

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
    kit: 'IELTS Accuracy Lab',
    minutes: 6,
  },
  {
    number: 18,
    slug: 'punctuation-for-grammar-accuracy',
    title: 'Punctuation for grammar accuracy',
    summary: 'Use full stops, commas, semicolons, and apostrophes to keep meaning controlled.',
    skillCode: 'grammar_sentence_boundaries',
    kit: 'IELTS Accuracy Lab',
    minutes: 8,
  },
  {
    number: 19,
    slug: 'word-forms-and-word-families',
    title: 'Word forms and word families',
    summary: 'Choose the noun, verb, adjective, or adverb form that the sentence position needs.',
    skillCode: 'grammar_word_forms',
    kit: 'IELTS Accuracy Lab',
    minutes: 7,
  },
];

export const FREE_GRAMMAR_GUIDE_UNIT_COUNT = 3;

// ---------------------------------------------------------------------------
// Learning parts. "practice" parts launch a measured five-question set from the
// listed skills; "reference" parts hold guides that have no skill of their own.
// ---------------------------------------------------------------------------
const KIT_META = [
  {
    slug: 'start-here',
    kind: 'reference',
    title: 'Start here',
    eyebrow: 'New to Grammar Lab?',
    description: 'How the course works, how grammar is scored, and a quick check of where you are.',
    skills: [],
    tone: 'violet',
  },
  {
    slug: 'sentence-foundations',
    kind: 'practice',
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
    kind: 'practice',
    title: 'Verbs & Time',
    eyebrow: 'Units 6–8',
    description:
      'Control timelines, verb patterns, and the strength of claims across Writing and Speaking.',
    skills: ['grammar_verb_forms'],
    tone: 'blue',
  },
  {
    slug: 'grammatical-range',
    kind: 'practice',
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
    kind: 'practice',
    title: 'IELTS Accuracy Lab',
    eyebrow: 'Units 17–19 + mixed review',
    description:
      'Refine cautious claims, punctuation and word forms, then check that the patterns transfer into real IELTS sentences.',
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
  {
    slug: 'task-guides',
    kind: 'reference',
    title: 'Grammar by IELTS task',
    eyebrow: 'Task guides & tools',
    description:
      'The grammar that matters most in each Writing and Speaking task, a common-error table, and a four-week plan.',
    skills: [],
    tone: 'blue',
  },
];

// ---------------------------------------------------------------------------
// Workbook extraction
// ---------------------------------------------------------------------------
function sliceBetween(startMarker, endMarker) {
  const start = grammarWorkbookMarkdown.indexOf(startMarker);
  if (start === -1) return '';
  const from = start + startMarker.length;
  const end = endMarker ? grammarWorkbookMarkdown.indexOf(endMarker, from) : -1;
  return grammarWorkbookMarkdown.slice(from, end === -1 ? undefined : end).trim();
}

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

const asNumberedList = (items) => items.map((item, index) => `${index + 1}. ${item}`).join('\n');

// The workbook key sometimes gives only the changed phrase ("_useful advice_").
// A learner types a whole corrected sentence, so these units carry complete model
// sentences. " / " separates equally acceptable answers.
const MODEL_ANSWERS = {
  3: [
    '_The report provides useful advice._ / _The report provides several pieces of useful advice._',
    '_There were fewer accidents after the speed limit changed._',
    '_The researchers collected a lot of evidence._ / _The researchers collected many pieces of evidence._',
    '_One important criterion is affordability._',
    '_The company bought new equipment._',
  ],
  5: [
    '_Students who study abroad often become more independent._',
    '_The government changed the law, and the change made the government unpopular._ (Make clear who or what became unpopular.)',
    '_Companies should support employees whose jobs are affected by automation._',
    '_I visited a city where public transport is free._',
  ],
  7: [
    '_The policy aims to reduce traffic._',
    '_Governments should consider subsidising public transport._',
    '_Technology allows people to work remotely._',
    '_The authorities must protect personal data._',
    '_Cities can reduce pollution by investing in railways._',
  ],
  9: [
    '_Public transport is cheaper, safer and more environmentally friendly._',
    '_The scheme aims to create jobs, reduce poverty and improve health._',
    '_The policy not only reduced waste but also lowered household costs._',
  ],
  13: [
    '_The unemployment rate was lower in 2020._',
    '_There were fewer students in private schools._',
    '_Car ownership was twice as high as in 2000._ / _Car ownership was double the level in 2000._',
    '_The figure for France was higher than that for Germany._',
  ],
  15: [
    '_The report suggests that the government should increase taxes._',
    '_The law prevents companies from collecting data without consent._',
    '_Researchers attribute the decline to stricter regulation._',
    '_The policy allows residents to recycle household waste._',
  ],
  18: [
    '_Although the policy was unpopular, it reduced waste._',
    '_The city expanded rapidly; however, housing remained limited._ / _The city expanded rapidly. However, housing remained limited._',
    '_The government’s decision affected many companies._',
    '_Public transport, which is heavily subsidised, remains affordable._',
    '_The rising cost of food affects low-income households._',
  ],
};

const UNIT_17_PRACTICE = `

### Practice 17

Rewrite each claim so that it is precise and defensible.

1. Social media damages everyone’s mental health.
2. Online learning is always better than classroom learning.
3. This transport policy will completely solve congestion.

## Model answers

1. _Heavy social-media use may contribute to poor mental health in some users._
2. _Some students may benefit from the flexibility of online learning._
3. _This policy could help reduce congestion if it is properly enforced._

- Limit the group: **some users**, **some learners**, or **in many cities**.
- Choose a cautious verb: **may**, **could**, **tends to**, or **is likely to**.
- Add a condition when the result depends on implementation or context.
`;

const UNIT_19_CONTENT = `
A **word family** has several forms: _decide_ (verb), _decision_ (noun), _decisive_ (adjective), _decisively_ (adverb). Most word-form errors are real words in the wrong position, so check what the sentence needs before you choose.

### Let the position decide

- **Before a noun:** usually an adjective — _a significant increase_
- **After a verb of change:** often an adverb — _increased significantly_
- **As the subject or object:** usually a noun — _Accessibility may improve participation._
- **After a modal or to:** the base verb — _may benefit_, _aims to reduce_

### Common endings

| Word type | Common endings | Examples |
| --------- | -------------- | -------- |
| Noun | -tion, -ment, -ity, -ness, -ance | _decision, development, accessibility_ |
| Verb | -ise, -en, -ify | _organise, strengthen, simplify_ |
| Adjective | -ful, -ous, -al, -able, -ive, -ic | _useful, various, economic, reliable_ |
| Adverb | -ly | _significantly, gradually_ |

### Traps to avoid

- Incorrect: _The number increased significant._
- Correct: _The number increased significantly._
- Incorrect: _The economical growth of the region slowed._
- Correct: _The economic growth of the region slowed._
- Caution: _economic_ is about the economy; _economical_ means saving money.
- Incorrect: _The policy may benefits low-income households._
- Correct: _The policy may benefit low-income households._

### Practice 19

Choose the correct form: **noun, verb, adjective** or **adverb** as the sentence requires.

1. There was a **significant / significantly** increase in online sales.
2. Online sales increased **significant / significantly**.
3. Greater **accessible / accessibility** may improve participation.
4. Governments should **encourage / encouragement** recycling.
5. The **economic / economical** growth of the region has slowed.
6. Many students find online classes **convenience / convenient**.

## Answer key

1 significant; 2 significantly; 3 accessibility; 4 encourage; 5 economic; 6 convenient
`;

function addPracticeSupport(unit) {
  if (unit.number === 19) return UNIT_19_CONTENT.trim();

  let content = extractUnit(unit.number);

  if (unit.number === 17) return `${content}${UNIT_17_PRACTICE}`.trim();

  if (MODEL_ANSWERS[unit.number]) {
    return `${content}\n\n## Answer key\n\n${asNumberedList(MODEL_ANSWERS[unit.number])}\n`;
  }

  const answer = extractAnswer(unit.number);
  if (answer) {
    content += `\n\n## Answer key\n\n${answer}\n`;
  }
  return content;
}

// ---------------------------------------------------------------------------
// Guides that are not numbered units (all adapted from the same workbook)
// ---------------------------------------------------------------------------
function introSection() {
  return sliceBetween(
    '## How grammar affects the IELTS score',
    '## Start here: 15-minute diagnostic'
  )
    .replace(/<aside>\s*⚠️\s*/g, '')
    .replace(/<\/aside>/g, '')
    .replace('**Important:** ', '- Caution: ');
}

function diagnosticSentences() {
  return sliceBetween('Correct the sentences before reading the guide.', '**Score guide:**');
}

function diagnosticScoreGuide() {
  return `**Score guide:** ${sliceBetween('**Score guide:**', '\n---')
    .replace('**Score guide:**', '')
    .replace(' Answers appear near the end.', '')
    .trim()}`;
}

function diagnosticAnswers() {
  return sliceBetween('## Diagnostic\n', '## Units 1–5');
}

function buildStartHere() {
  return `
## The course in 60 seconds

Grammar Lab is a short course in the grammar that IELTS Writing and Speaking reward. You do not need to read everything at once. Work in three steps:

1. **Learn:** read one unit (6–9 minutes). Each has a rule, examples of right and wrong sentences, and an exercise.
2. **Practise:** answer five questions on that skill. You see the correct answer straight away, with the reason.
3. **Prove it:** write or speak in a normal IELTS test. Grammar Lab uses your result to choose what to practise next.

Not sure where to begin? Try the 12-sentence check below, then follow the score guide.

## How grammar affects your IELTS score

${introSection()}

### Practice: Quick level check

Correct each sentence before you read the units. Change only what is needed.

${diagnosticSentences()}

## Answer key

${diagnosticAnswers()}

${diagnosticScoreGuide()}
`.trim();
}

const MIXED_BODY_INTRO =
  'Use this review after Unit 19, or any time you want a realistic check. Work without looking back at the units, then compare your answers with the models. Where several answers are possible, the model is one good answer, not the only one.';

function buildMixedReview() {
  const practiceA = sliceBetween('## Practice A: Error correction', '## Practice B');
  const practiceB = sliceBetween('## Practice B: Sentence combining', '## Practice C');
  const speaking = sliceBetween('## Practice E: Speaking prompts', '\n---');
  const keyA = sliceBetween('## Mixed Practice A', '## Mixed Practice B');
  const keyB = sliceBetween('## Mixed Practice B — sample answers', '## Mixed Practice C');
  const modelD = sliceBetween('### Model upgrade', '## Practice E');
  const cloze = [
    'Between 2010 and 2015, the proportion of households using solar power **[blank]** (rise) from 8% to 18%.',
    'After 2015, the figure **[blank]** (remain) stable for two years.',
    'The figure remained stable for two years before **[blank]** (increase) sharply to 30% in 2020.',
    'By contrast, the figure for coal, which **[blank]** (stand) at 45% in 2010, declined steadily.',
    'The coal figure **[blank]** (fall) continuously throughout the period.',
    'By 2020, solar power **[blank]** (use) by a larger share of households than coal.',
  ];

  return `
${MIXED_BODY_INTRO}

### Practice A: Error correction

${practiceA.replace(/^Correct all errors\.\s*/, 'Correct all errors. Write the whole sentence.\n\n')}

### Practice B: Sentence combining

${practiceB}

### Practice C: Task 1 grammar cloze

Complete each blank with the correct form of the verb in brackets.

${asNumberedList(cloze)}

### Practice D: Task 2 paragraph upgrade

Rewrite this paragraph with accurate grammar and greater variety.

1. Cars cause pollution. Many people use cars. Public transport is not reliable. Government should improve it. People will use buses. Traffic will reduce. It is expensive. It is necessary.

### Speaking drills

${speaking.replace(/^Answer each/, 'Answer each')}

## Answers A: Error correction

${keyA}

## Answers B: Sentence combining

${keyB}

Other accurate combinations are fine. Check that your sentence is complete and keeps the original meaning.

## Answers C: Task 1 cloze

1. _rose_
2. _remained_
3. _increasing_
4. _stood_
5. _fell_
6. _was used_

## Answers D: Paragraph upgrade

1. ${modelD.replace(/\n+/g, ' ')}

Your version will be different. Check it for complete sentences, accurate verbs, and at least one reason, contrast or condition clause.
`.trim();
}

function buildTaskGuide(startMarker, endMarker, lead) {
  return `${lead}\n\n${sliceBetween(startMarker, endMarker)}`;
}

function buildReadingListening() {
  return `
Grammar helps you predict the missing word before you read or listen. Look at the words **before** the gap and decide what type of word fits.

| Words before the gap | What the answer probably is |
| -------------------- | --------------------------- |
| a / an | a singular countable noun, or an adjective + noun |
| many / several | a plural countable noun |
| much / less | an uncountable noun |
| to | a base verb |
| a preposition | a noun or an -ing form |
| has / have | a past participle |
| is / are | an adjective, noun, -ing form or past participle, depending on meaning |

### Two habits that protect marks

- Always obey the word limit.
- Copy spelling exactly. A correct word with a spelling error may lose the mark.
`.trim();
}

function buildErrorClinic() {
  return `
Scan this table before you write, and again when you edit. Each row shows a frequent IELTS error, the fix, and the reason.

${sliceBetween('# Part VI — Common error clinic', '\n---')}
`.trim();
}

function buildStudyPlan() {
  return sliceBetween('# A practical four-week study plan', null)
    .replace(/\n##\s*$/, '')
    .replace(
      /^/,
      'Follow this plan if you have about a month. It alternates learning, short daily output, and one weekly test.\n\n## Four weeks, week by week\n\n'
    )
    .trim();
}

const EXTRA_GUIDES = [
  {
    key: 'start',
    slug: 'start-here-how-grammar-lab-works',
    title: 'How Grammar Lab works',
    label: 'Start here',
    summary:
      'A two-minute orientation, how grammar is scored in IELTS, and a 12-sentence quick check.',
    kit: 'Start here',
    minutes: 6,
    access: 'free',
    markdown: buildStartHere,
  },
  {
    key: 'mixed',
    slug: 'mixed-ielts-review',
    title: 'Mixed IELTS review',
    label: 'Mixed review',
    summary:
      'Error correction, sentence combining, Task 1 cloze, paragraph upgrade and speaking drills.',
    kit: 'IELTS Accuracy Lab',
    minutes: 20,
    access: 'pro',
    markdown: buildMixedReview,
  },
  {
    key: 'task1',
    slug: 'grammar-for-writing-task-1',
    title: 'Grammar for Writing Task 1',
    label: 'Task guide',
    summary: 'Tense by date, comparison, change language, passive processes and approximation.',
    kit: 'Grammar by IELTS task',
    minutes: 5,
    access: 'pro',
    markdown: () =>
      buildTaskGuide(
        '## Writing Task 1 Academic: highest-value grammar',
        '## Writing Task 2: highest-value grammar',
        'Task 1 rewards accurate comparison and sensible tense choice. Check these six areas before you write, then compare your report with the model paragraph.'
      ),
  },
  {
    key: 'task2',
    slug: 'grammar-for-writing-task-2',
    title: 'Grammar for Writing Task 2',
    label: 'Task guide',
    summary: 'The sentence types a strong essay uses, with a model paragraph and a grammar map.',
    kit: 'Grammar by IELTS task',
    minutes: 5,
    access: 'pro',
    markdown: () =>
      buildTaskGuide(
        '## Writing Task 2: highest-value grammar',
        '## General Training Task 1: tone and grammar',
        'A strong Task 2 essay is accurate first and varied second. Use this checklist, then study how the model paragraph combines the structures.'
      ),
  },
  {
    key: 'gt1',
    slug: 'grammar-for-general-training-letters',
    title: 'Grammar for General Training letters',
    label: 'Task guide',
    summary: 'Match tone and grammar to purpose: requests, complaints, apologies and invitations.',
    kit: 'Grammar by IELTS task',
    minutes: 4,
    access: 'pro',
    markdown: () =>
      buildTaskGuide(
        '## General Training Task 1: tone and grammar',
        '## Speaking: flexible but natural grammar',
        'Letters are marked for tone as well as accuracy. Choose grammar that fits who you are writing to and why.'
      ),
  },
  {
    key: 'speaking',
    slug: 'grammar-for-speaking',
    title: 'Grammar for Speaking',
    label: 'Task guide',
    summary:
      'Flexible, natural grammar for Parts 1, 2 and 3, and why memorised sentences backfire.',
    kit: 'Grammar by IELTS task',
    minutes: 6,
    access: 'pro',
    markdown: () =>
      buildTaskGuide(
        '## Speaking: flexible but natural grammar',
        '## Reading and Listening',
        'Speaking is not a written essay. Natural, flexible grammar scores better than long memorised sentences.'
      ),
  },
  {
    key: 'rl',
    slug: 'grammar-for-reading-and-listening',
    title: 'Grammar for Reading and Listening',
    label: 'Task guide',
    summary: 'Use grammar to predict the form of a missing word before you find the answer.',
    kit: 'Grammar by IELTS task',
    minutes: 4,
    access: 'pro',
    markdown: buildReadingListening,
  },
  {
    key: 'clinic',
    slug: 'common-ielts-grammar-errors',
    title: 'Common error clinic',
    label: 'Reference',
    summary:
      'Fifteen frequent IELTS grammar errors with the fix and the reason, in one scannable table.',
    kit: 'Grammar by IELTS task',
    minutes: 6,
    access: 'pro',
    markdown: buildErrorClinic,
  },
  {
    key: 'plan',
    slug: 'four-week-grammar-study-plan',
    title: 'Four-week study plan and error log',
    label: 'Study plan',
    summary: 'A week-by-week plan and the error-log method for fixing the mistakes you repeat.',
    kit: 'Grammar by IELTS task',
    minutes: 5,
    access: 'free',
    markdown: buildStudyPlan,
  },
];

const SOURCE = 'IELTS Essential Grammar — Complete Guide & Practice';

const unitGuides = UNIT_META.map((unit) => ({
  slug: unit.slug,
  title: unit.title,
  summary: unit.summary,
  skill_code: unit.skillCode,
  content_markdown: addPracticeSupport(unit),
  estimated_minutes: unit.minutes,
  unit_number: unit.number,
  label: `Unit ${unit.number}`,
  kit: unit.kit,
  access_tier: unit.number <= FREE_GRAMMAR_GUIDE_UNIT_COUNT ? 'free' : 'pro',
}));

const extraGuides = EXTRA_GUIDES.map((guide) => ({
  slug: guide.slug,
  title: guide.title,
  summary: guide.summary,
  skill_code: guide.skillCode || null,
  content_markdown: guide.markdown(),
  estimated_minutes: guide.minutes,
  unit_number: null,
  label: guide.label,
  kit: guide.kit,
  access_tier: guide.access,
}));

// Reading order: orientation, the numbered units, the mixed review that closes
// them, then task guides and tools.
const byKey = (key) => extraGuides[EXTRA_GUIDES.findIndex((guide) => guide.key === key)];
const SEQUENCE = [
  byKey('start'),
  ...unitGuides,
  byKey('mixed'),
  byKey('task1'),
  byKey('task2'),
  byKey('gt1'),
  byKey('speaking'),
  byKey('rl'),
  byKey('clinic'),
  byKey('plan'),
];

export const GRAMMAR_UNIT_COUNT = UNIT_META.length;

export const GRAMMAR_GUIDES = SEQUENCE.map((guide, index, guides) => ({
  ...guide,
  id: guide.unit_number
    ? `grammar-workbook-unit-${guide.unit_number}`
    : `grammar-workbook-${guide.slug}`,
  content_version: 4,
  source: SOURCE,
  is_workbook_guide: true,
  previous_slug: guides[index - 1]?.slug || null,
  next_slug: guides[index + 1]?.slug || null,
}));

export const GRAMMAR_GUIDE_KITS = KIT_META.map((kit) => {
  const guides = GRAMMAR_GUIDES.filter((guide) => guide.kit === kit.title);
  return {
    ...kit,
    access_tier: guides.every((guide) => guide.access_tier === 'free') ? 'free' : 'pro',
    guideCount: guides.length,
    freeGuideCount: guides.filter((guide) => guide.access_tier === 'free').length,
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

/** Guides that teach a skill, in reading order. Used to point a learner back to a lesson. */
export function getGuidesForSkill(skillCode) {
  return GRAMMAR_GUIDES.filter((guide) => guide.unit_number && guide.skill_code === skillCode);
}
