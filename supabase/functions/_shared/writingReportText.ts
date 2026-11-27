/**
 * The explanation text of a saved Writing report: what may be translated, how a
 * translation is checked, and how it is laid back over the report.
 *
 * Only explanations are translated. Essay quotes, corrections, model wording and
 * criterion labels stay in English, because the learner is examined in English
 * and the report logic matches on those fields.
 */
import { normalizeReportLanguage, type ReportLanguageCode } from './reportLanguages.ts';

export type ReportText = Record<string, string>;

const MAX_ITEMS = 90;
const MAX_ITEM_CHARS = 1_500;

// Legacy reports hide word-count weaknesses by matching the English wording.
export const WORD_COUNT_NOTE = /\bword(?:s| count| length)\b/i;

// Without a replacement, `suggestion` holds either advice or the corrected
// English itself. Only text that clearly opens as advice is safe to translate.
const ADVICE_START =
  /^(?:add|aim|avoid|be|break|change|check|choose|clarify|combine|compare|connect|consider|correct|delete|describe|develop|ensure|expand|explain|focus|give|group|highlight|include|insert|join|keep|link|make|mention|move|place|put|reduce|remove|rephrase|replace|report|rewrite|show|shorten|split|start|state|summari[sz]e|support|try|use(?!\s+of\b)|vary|write)\b/i;

const isAdvice = (value: string) =>
  ADVICE_START.test(value.trim()) && value.trim().split(/\s+/).length >= 4;

const list = (value: unknown): any[] => (Array.isArray(value) ? value : []);

function annotationFields(annotation: any, index: number): [string, unknown][] {
  const fields: [string, unknown][] = [
    [`annotations.${index}.explanation`, annotation?.explanation],
  ];
  const positive = annotation?.severity === 'positive' || annotation?.type === 'positive';
  if (!positive && !annotation?.replacementText && isAdvice(String(annotation?.suggestion || '')))
    fields.push([`annotations.${index}.suggestion`, annotation.suggestion]);
  return fields;
}

function reportFields(feedback: any): [string, unknown][] {
  const annotations = list(feedback.annotations);
  return [
    ['summary', feedback.summary],
    ...Object.entries(feedback.criterionNotes || {}).map(([key, note]): [string, unknown] => [
      `criterionNotes.${key}`,
      note,
    ]),
    ...list(feedback.priorities).flatMap((priority, index): [string, unknown][] => [
      [`priorities.${index}.issue`, priority?.issue],
      [`priorities.${index}.action`, priority?.action],
    ]),
    ...list(feedback.strengths).map((text, index): [string, unknown] => [
      `strengths.${index}`,
      text,
    ]),
    ...list(feedback.paragraphNotes).map((entry, index): [string, unknown] => [
      `paragraphNotes.${index}.note`,
      entry?.note,
    ]),
    ['taskAnalysis.limitations', feedback.taskAnalysis?.limitations],
    ...list(feedback.taskAnalysis?.observedFeatures).map((text, index): [string, unknown] => [
      `taskAnalysis.observedFeatures.${index}`,
      text,
    ]),
    // Older reports build their priorities and fixes from these three fields.
    ...(list(feedback.priorities).length
      ? []
      : [
          ...list(feedback.weaknesses).map((text, index): [string, unknown] => [
            `weaknesses.${index}`,
            WORD_COUNT_NOTE.test(String(text)) ? '' : text,
          ]),
          ...list(feedback.suggestions).map((text, index): [string, unknown] => [
            `suggestions.${index}`,
            text,
          ]),
        ]),
    ...annotations.flatMap(annotationFields),
    ...(annotations.length
      ? []
      : list(feedback.corrections).map((entry, index): [string, unknown] => [
          `corrections.${index}.explanation`,
          entry?.explanation,
        ])),
  ];
}

/** Every explanation in the report, keyed by its path in the saved feedback. */
export function collectReportText(feedback: unknown): ReportText {
  if (!feedback || typeof feedback !== 'object') return {};
  return Object.fromEntries(
    reportFields(feedback)
      .filter(
        (field): field is [string, string] =>
          typeof field[1] === 'string' &&
          field[1].trim().length > 0 &&
          field[1].length <= MAX_ITEM_CHARS
      )
      .slice(0, MAX_ITEMS)
  );
}

/**
 * A copy of the report with translated explanations. Paths that are not
 * explanation fields of this report are ignored.
 */
export function applyReportText<T>(feedback: T, translations: ReportText | null | undefined): T {
  const entries = Object.entries(translations || {});
  if (!feedback || !entries.length) return feedback;
  const allowed = collectReportText(feedback);
  // Saved feedback is plain JSON; this also runs on browsers without structuredClone.
  const copy: any = JSON.parse(JSON.stringify(feedback));
  for (const [path, text] of entries) {
    if (!(path in allowed) || !text) continue;
    if (path.startsWith('taskAnalysis.observedFeatures.')) {
      // Coverage is matched against the English essay, so the original stays.
      copy.taskAnalysis.displayFeatures ??= [];
      copy.taskAnalysis.displayFeatures[Number(path.split('.').pop())] = text;
      continue;
    }
    const keys = path.split('.');
    const last = keys.pop() as string;
    const parent = keys.reduce((node, key) => node[key], copy);
    parent[last] = text;
  }
  return copy;
}

const QUOTED = [
  /[“"]([^“”"\n]{1,80})[”"]/g,
  /‘([^‘’\n]{1,80})’(?![\p{L}\p{N}])/gu,
  /(?<![\p{L}\p{N}])'([^'\n]{1,60})'(?![\p{L}\p{N}])/gu,
];

// Only English quotes have to survive word for word.
const isEnglish = (part: string) => /[a-z]/i.test(part);

const quotedParts = (text: string) =>
  QUOTED.flatMap((pattern) =>
    Array.from(text.matchAll(pattern), (match) => match[1].trim())
  ).filter(isEnglish);

const PLACEHOLDER = /\[\[Q\d+\]\]/g;
const placeholdersIn = (text: string) => (text.match(PLACEHOLDER) || []).sort().join();
/** True when a translation kept every placeholder of the masked text. */
const keptPlaceholders = (masked: string, text: unknown): text is string =>
  typeof text === 'string' && placeholdersIn(text) === placeholdersIn(masked);

/**
 * Hides quoted English behind placeholders before translation, so the learner's
 * own words come back exactly. `restore` drops any field whose placeholders did
 * not all survive.
 */
export function maskQuotes(items: ReportText) {
  const quotes: string[] = [];
  const hide = (match: string, inner: string) =>
    isEnglish(inner) ? `[[Q${quotes.push(match) - 1}]]` : match;
  const masked: ReportText = Object.fromEntries(
    Object.entries(items).map(([key, text]) => [
      key,
      QUOTED.reduce((value, pattern) => value.replace(pattern, hide), text),
    ])
  );
  const restore = (translated: unknown): ReportText =>
    Object.fromEntries(
      Object.entries((translated || {}) as Record<string, unknown>).flatMap(([key, text]) => {
        if (!keptPlaceholders(masked[key] || '', text)) return [];
        return [[key, text.replace(PLACEHOLDER, (token) => quotes[Number(token.slice(3, -2))])]];
      })
    );
  return { masked, restore };
}

const SCRIPT: Partial<Record<ReportLanguageCode, RegExp>> = {
  bn: /\p{Script=Bengali}/u,
  hi: /\p{Script=Devanagari}/u,
  ru: /\p{Script=Cyrillic}/u,
  ur: /\p{Script=Arabic}/u,
  fa: /\p{Script=Arabic}/u,
};

function isSafeTranslation(source: string, translated: unknown, language: ReportLanguageCode) {
  if (typeof translated !== 'string' || !translated.trim()) return false;
  if (translated.length > Math.max(120, source.length * 4)) return false;
  const lowered = translated.toLowerCase();
  if (quotedParts(source).some((part) => !lowered.includes(part.toLowerCase()))) return false;
  // One or two words can legitimately stay as they are (a name, "Band 7").
  if (source.trim().split(/\s+/).length < 3) return true;
  const script = SCRIPT[language];
  return script ? script.test(translated) : translated.trim() !== source.trim();
}

/** Field by field: anything doubtful is dropped, and the learner sees the English. */
export function keepSafeTranslations(
  source: ReportText,
  translated: unknown,
  language: string
): ReportText {
  const code = normalizeReportLanguage(language);
  const candidate = (translated || {}) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key, text]) => isSafeTranslation(text, candidate[key], code))
      .map(([key]) => [key, (candidate[key] as string).trim()])
  );
}
