import { cleanFeedbackText } from './feedbackFormatting';
import { reportT } from '../report/reportStrings';

// Callers pass the learner's translator; English is the default everywhere.
const ENGLISH = reportT('en');

/**
 * Everything the Writing report shows, derived from one saved feedback object.
 * Pure functions only, so the panel and the PDF can share them and tests can
 * cover them without rendering.
 *
 * Wording is written for Band 4.5–6.5 learners: the four official criterion
 * names, each with a plain question as help, and no truncation anywhere.
 */

export const CRITERIA = [
  {
    id: 'task',
    keys: ['TaskAchievement', 'TaskResponse'],
    label: { 'Task 1': 'Task Achievement', 'Task 2': 'Task Response' },
    official: { 'Task 1': 'Task Achievement', 'Task 2': 'Task Response' },
    helpKey: { 'Task 1': 'helpTask1', 'Task 2': 'helpTask2' },
  },
  {
    id: 'organisation',
    keys: ['CoherenceAndCohesion'],
    label: 'Coherence and Cohesion',
    official: 'Coherence and Cohesion',
    helpKey: 'helpOrganisation',
  },
  {
    id: 'vocabulary',
    keys: ['LexicalResource'],
    label: 'Lexical Resource',
    official: 'Lexical Resource',
    helpKey: 'helpVocabulary',
  },
  {
    id: 'grammar',
    keys: ['GrammaticalRangeAndAccuracy'],
    label: 'Grammatical Range and Accuracy',
    official: 'Grammatical Range and Accuracy',
    helpKey: 'helpGrammar',
  },
];

const pick = (value, taskType) => (typeof value === 'object' ? value[taskType] : value);

export const taskTypeOf = (feedback) => (feedback?.taskType === 'Task 2' ? 'Task 2' : 'Task 1');

function scoreFor(criteriaScores, keys) {
  for (const key of keys) {
    const score = Number(criteriaScores?.[key]);
    if (Number.isFinite(score)) return score;
  }
  return null;
}

/** The four criteria with plain labels, the marker's reason (when saved) and the lowest flagged. */
export function buildCriteria(feedback, t = ENGLISH) {
  const taskType = taskTypeOf(feedback);
  const notes = feedback?.criterionNotes || {};
  const rows = CRITERIA.map((criterion) => ({
    id: criterion.id,
    label: pick(criterion.label, taskType),
    official: pick(criterion.official, taskType),
    help: t(pick(criterion.helpKey, taskType)),
    note: cleanFeedbackText(criterion.keys.map((key) => notes[key]).find(Boolean) || ''),
    score: scoreFor(feedback?.criteriaScores, criterion.keys),
  })).filter((row) => row.score != null);

  const scores = rows.map((row) => row.score);
  const min = Math.min(...scores);
  const allEqual = scores.length > 0 && scores.every((score) => score === scores[0]);
  return rows.map((row) => ({ ...row, isLowest: !allEqual && row.score === min }));
}

// The marker's priority labels, mapped to the four official criterion names.
const PRIORITY_LABELS = {
  'Task Achievement': 'Task Achievement',
  'Task Response': 'Task Response',
  'Coherence & Cohesion': 'Coherence and Cohesion',
  'Lexical Resource': 'Lexical Resource',
  Grammar: 'Grammatical Range and Accuracy',
  'Grammar & Accuracy': 'Grammatical Range and Accuracy',
};

export const plainCriterion = (label) => PRIORITY_LABELS[label] || cleanFeedbackText(label);

function legacyPriorities(feedback) {
  const weaknesses = Array.isArray(feedback?.weaknesses) ? feedback.weaknesses : [];
  const suggestions = Array.isArray(feedback?.suggestions) ? feedback.suggestions : [];
  return weaknesses
    .filter((issue) => !/\bword(?:s| count| length)\b/i.test(issue))
    .slice(0, 3)
    .map((issue, index) => ({
      criterion: '',
      issue,
      action: suggestions[index] || '',
    }));
}

/** Priorities in full, with the essay passage each one points at (when it has one). */
export function buildPriorities(feedback) {
  const source =
    Array.isArray(feedback?.priorities) && feedback.priorities.length
      ? feedback.priorities
      : legacyPriorities(feedback);
  return source
    .slice(0, 3)
    .map((priority) => ({
      criterion: plainCriterion(priority.criterion),
      issue: cleanFeedbackText(priority.issue, { dropHeading: true }),
      action: cleanFeedbackText(priority.action, { dropHeading: true }),
      evidenceText: cleanFeedbackText(priority.evidenceText) || null,
    }))
    .filter((priority) => priority.issue || priority.action);
}

export const minimumWordsFor = (taskType) => (taskType === 'Task 2' ? 250 : 150);

/**
 * The one thing to do next. Being under the word limit comes first, because it
 * caps the task score whatever else is fixed; otherwise it is the marker's
 * top priority.
 */
export function buildNextStep(feedback, priorities, t = ENGLISH) {
  const taskType = taskTypeOf(feedback);
  const taskLabel = pick(CRITERIA[0].label, taskType);
  const minimum = minimumWordsFor(taskType);
  const wordCount = Number(feedback?.wordCount);
  if (feedback?.isBelowMinimumWordCount && Number.isFinite(wordCount)) {
    return {
      kind: 'length',
      criterion: pick(CRITERIA[0].label, taskType),
      title: t('lengthTitle', { min: minimum }),
      body: t(taskType === 'Task 2' ? 'lengthBodyTask2' : 'lengthBodyTask1', {
        count: wordCount,
        min: minimum,
        criterion: taskLabel,
      }),
      evidenceText: null,
      rest: priorities,
    };
  }
  const [first, ...rest] = priorities;
  if (!first) return null;
  return {
    kind: 'priority',
    criterion: first.criterion,
    title: first.issue || first.action,
    body: first.issue ? first.action : '',
    evidenceText: first.evidenceText,
    rest,
  };
}

const MISTAKE_GROUPS = [
  {
    id: 'grammar',
    labelKey: 'groupGrammar',
    types: ['grammar', 'spelling'],
    skill: 'grammar',
  },
  { id: 'words', labelKey: 'groupWords', types: ['vocabulary', 'style'], skill: 'vocabulary' },
  { id: 'clarity', labelKey: 'groupClarity', types: ['clarity'], skill: null },
];

/**
 * Every fix, grouped so related ones sit together. A replacement is shown as
 * "you wrote → change to"; advice without a replacement is shown as advice,
 * never as text to paste in.
 */
export function buildMistakeGroups(feedback, t = ENGLISH) {
  const annotations = (Array.isArray(feedback?.annotations) ? feedback.annotations : []).filter(
    (annotation) =>
      annotation &&
      annotation.severity !== 'positive' &&
      annotation.type !== 'positive' &&
      cleanFeedbackText(annotation.originalText)
  );

  const items = annotations.length
    ? annotations.map((annotation) => ({
        type: annotation.type,
        original: cleanFeedbackText(annotation.originalText),
        replacement: cleanFeedbackText(annotation.replacementText),
        advice: annotation.replacementText ? '' : cleanFeedbackText(annotation.suggestion),
        explanation: cleanFeedbackText(annotation.explanation, { dropHeading: true }),
        annotation,
      }))
    : (Array.isArray(feedback?.corrections) ? feedback.corrections : []).map((item) => ({
        type: 'grammar',
        original: cleanFeedbackText(item.original),
        replacement: cleanFeedbackText(item.correction),
        advice: '',
        explanation: cleanFeedbackText(item.explanation, { dropHeading: true }),
        annotation: null,
      }));

  return MISTAKE_GROUPS.map((group) => ({
    ...group,
    label: t(group.labelKey),
    items: items.filter(
      (item) =>
        group.types.includes(item.type) ||
        (group.id === 'clarity' && !MISTAKE_GROUPS.some((g) => g.types.includes(item.type)))
    ),
  })).filter((group) => group.items.length > 0);
}

/**
 * Saved notes can lose an opening quote mark ("only 45% are…” makes…") when an
 * older server trimmed leading quotes. Put it back so the quote reads as one.
 */
export function restoreOpeningQuote(text) {
  const opens = (text.match(/“/g) || []).length;
  const closes = (text.match(/”/g) || []).length;
  return closes > opens &&
    text.indexOf('”') < (text.indexOf('“') === -1 ? Infinity : text.indexOf('“'))
    ? `“${text}`
    : text;
}

export function buildStrengths(feedback) {
  return (Array.isArray(feedback?.strengths) ? feedback.strengths : [])
    .map((item) => restoreOpeningQuote(cleanFeedbackText(item, { dropHeading: true })))
    .filter(Boolean)
    .slice(0, 3);
}

/** How the band was decided, in plain words. Silent for reports from before multi-marking. */
export function describeMarking(agreement, t = ENGLISH) {
  const passes = Number(agreement?.sampleCount);
  if (!Number.isFinite(passes) || passes < 1) return '';
  if (passes === 1) return t(agreement?.confidence === 'high' ? 'markedOnceSecure' : 'markedOnce');
  const spread = Number(agreement?.maxSpread) || 0;
  const key = spread === 0 ? 'markedAgreed' : spread <= 0.5 ? 'markedClose' : 'markedMiddle';
  return t(key, { count: passes });
}

export function combinedWritingBand(feedbacks) {
  const task1 = Number(feedbacks?.['Task 1']?.overallBand);
  const task2 = Number(feedbacks?.['Task 2']?.overallBand);
  if (task1 > 0 && task2 > 0) return Math.round(((task1 + task2 * 2) / 3) * 2) / 2;
  return null;
}

const FEATURE_STOPWORDS = new Set(
  'the and with from that this than then into over each both most more less shows show chart graph table diagram figure presents reports stage stages their there which while about between'.split(
    ' '
  )
);

const featureWords = (text) =>
  (
    String(text)
      .toLowerCase()
      .match(/[a-z]+|\d+/g) || []
  )
    .filter((word) => (word.length >= 4 || /^\d+$/.test(word)) && !FEATURE_STOPWORDS.has(word))
    .map((word) => word.slice(0, 5));

/**
 * Whether the answer seems to mention a feature the marker saw: most of the
 * feature's key words (matched on their first five letters, so "rises" finds
 * "rising") appear in the essay. A pointer for the learner, not a grade.
 */
export function featureMentioned(feature, essay) {
  const wanted = [...new Set(featureWords(feature))];
  if (wanted.length === 0) return false;
  const have = new Set(featureWords(essay));
  const found = wanted.filter((word) => have.has(word)).length;
  return found / wanted.length >= 0.5;
}

/** "a line graph", "an image", and plain words for the plural "mixed visuals". */
const visualPhrase = (type) => {
  if (!type) return 'the visual';
  if (type === 'mixed visuals') return 'more than one chart';
  return `${/^[aeiou]/i.test(type) ? 'an' : 'a'} ${type}`;
};

const knownVisual = (type) => (type && type !== 'not identifiable' ? type : null);

// Chart names stay in English in every language; only English needs an article.
const namedVisual = (type, t) => (t.language === 'en' ? visualPhrase(type) : type);

function chartVerdict(analysis, t) {
  const seen = knownVisual(analysis.visualType);
  const described = knownVisual(analysis.responseVisualType);
  if (analysis.visualReadable === false)
    return { status: 'unknown', message: t('chartUnreadable') };
  if (analysis.alignment === 'mismatched')
    return {
      status: 'fault',
      message: t('chartMismatch', {
        visual: namedVisual(seen, t),
        described: described ? namedVisual(described, t) : t('somethingElse'),
      }),
    };
  if (analysis.alignment === 'partial') return { status: 'warn', message: t('chartPartial') };
  if (analysis.alignment === 'uncertain')
    return { status: 'unknown', message: t('chartUncertain') };
  return {
    status: 'ok',
    message: seen ? t('chartOk', { visual: namedVisual(seen, t) }) : t('chartOkUnknown'),
  };
}

/**
 * What the marker saw in the Task 1 visual, and whether the answer matched it.
 * Null for Task 2 and for reports saved before chart analysis existed.
 */
export function buildChartCheck(feedback, t = ENGLISH) {
  const analysis = feedback?.taskAnalysis;
  const essayText = cleanFeedbackText(
    String(feedback?.originalSource || '').replace(/<[^>]*>/g, ' ')
  );
  if (taskTypeOf(feedback) !== 'Task 1' || !analysis) return null;

  const observed = Array.isArray(analysis.observedFeatures) ? analysis.observedFeatures : [];
  return {
    ...chartVerdict(analysis, t),
    features: observed
      .map((item, index) => ({
        english: cleanFeedbackText(item),
        shown: cleanFeedbackText(analysis.displayFeatures?.[index]),
      }))
      .filter((feature) => feature.english)
      .map(({ english, shown }) => ({
        text: shown || english,
        covered: featureMentioned(english, essayText),
      })),
    limitations: cleanFeedbackText(analysis.limitations),
  };
}
