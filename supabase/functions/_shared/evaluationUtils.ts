import { splitFeedbackSentences } from './feedbackSentences.ts';

export const FEEDBACK_EVALUATOR_VERSION = '2026-07-29-v5';
export const WRITING_CALIBRATION_REVISION = 3;

const VALID_ANNOTATION_TYPES = new Set([
  'grammar',
  'spelling',
  'style',
  'vocabulary',
  'clarity',
  'positive',
]);

const VALID_ANNOTATION_SEVERITIES = new Set(['error', 'warning', 'suggestion', 'positive']);

const VALID_WRITING_CRITERIA = new Set([
  'Task Achievement',
  'Task Response',
  'Coherence & Cohesion',
  'Lexical Resource',
  'Grammar',
]);

const VALID_TASK_1_VISUAL_TYPES = new Set([
  'line graph',
  'bar chart',
  'pie chart',
  'table',
  'map',
  'process diagram',
  'mixed visuals',
  'not identifiable',
]);
const VALID_TASK_1_ALIGNMENTS = new Set(['aligned', 'partial', 'mismatched', 'uncertain']);

const INVALID_SPEAKING_RESPONSES = [
  /^\s*$/,
  /^\s*\.\.\.\s*$/,
  /^\s*\(inaudible\)\s*$/i,
  /^\s*\(audio received but transcription failed\)\s*$/i,
  /^\s*\(unable to transcribe.*\)\s*$/i,
  /^\s*\(your response was recorded\)\s*$/i,
];

const PROCEDURAL_EXAMINER_PATTERNS = [
  /^hello!? welcome to/i,
  /^now it'?s time for part/i,
  /^excellent!? now let'?s move on/i,
  /^alright,? your preparation time is up/i,
  /^thank you(?: very much)?\.? that concludes/i,
  /^thank you for your response\.? that brings us/i,
  /^that'?s all the time we have for part/i,
  /^i'?m sorry,? i didn'?t quite catch that/i,
  /^i didn'?t hear anything/i,
];

const UNSUPPORTED_AUDIO_CLAIM_PATTERN =
  /\b(pronunciation|intonation|word stress|connected speech|without pauses|speech rate|speaking pace|accent clarity|flow of speech|smooth delivery|spoken delivery|hesitation)\b/i;

export type SpeakingEntry = {
  speaker?: string;
  text?: string;
  error?: boolean;
  isLoading?: boolean;
};

export type SpeakingPartStats = {
  candidateWordCount: number;
  validResponseCount: number;
  unintelligibleResponseCount: number;
};

export type PronunciationEvidence = {
  score: number | null;
  sampleCount: number;
  partCount: number;
  summary: string;
  problematicSounds: string[];
  wordIssues: Array<{ word: string; issue: string; severity: string }>;
};

export function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function countWords(text: unknown): number {
  if (typeof text !== 'string') return 0;
  const normalized = text.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

export function escapePromptXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizeBandScore(value: unknown, allowZero = true): number | null {
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (typeof numeric !== 'number' || !Number.isFinite(numeric)) return null;
  if (!allowZero && numeric <= 0) return null;
  const clamped = Math.min(9, Math.max(allowZero ? 0 : 1, numeric));
  return Math.round(clamped * 2) / 2;
}

function cleanJsonMarkdown(text: string): string {
  let candidate = text.trim();
  if (candidate.startsWith('```')) {
    candidate = candidate.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return candidate;
}

function extractJsonObjectString(text: string): string {
  const candidate = cleanJsonMarkdown(text);
  const objectStart = candidate.indexOf('{');
  const objectEnd = candidate.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    return candidate.slice(objectStart, objectEnd + 1);
  }
  return candidate;
}

export function parseStructuredJson(text: unknown): Record<string, any> {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('AI response did not contain JSON');
  }

  const candidate = extractJsonObjectString(text);
  const parsed = JSON.parse(candidate);

  if (!isPlainObject(parsed)) {
    throw new Error('AI response JSON must be an object');
  }
  return parsed;
}

export function averageBandScores(values: unknown[]): number | null {
  const normalized = values.map((value) => normalizeBandScore(value));
  if (normalized.some((value) => value === null)) return null;
  const scores = normalized as number[];
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 2) / 2;
}

export const WRITING_CRITERION_KEYS = [
  'CoherenceAndCohesion',
  'LexicalResource',
  'GrammaticalRangeAndAccuracy',
] as const;

/**
 * Median of a numeric sample. For an even count this averages the two middle
 * values, which is what keeps a two-sample fallback from silently preferring
 * the lower draw.
 */
export function medianOfNumbers(values: number[]): number | null {
  const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (finite.length === 0) return null;
  const middle = Math.floor(finite.length / 2);
  return finite.length % 2 === 1 ? finite[middle] : (finite[middle - 1] + finite[middle]) / 2;
}

export const VALID_BAND_SECURITY = new Set(['secure', 'borderline']);

export type WritingConsensus = {
  criteriaScores: Record<string, number>;
  representativeIndex: number;
  agreement: {
    sampleCount: number;
    maxSpread: number;
    perCriterionSpread: Record<string, number>;
    confidence: 'high' | 'moderate' | 'low';
    escalated: boolean;
  };
};

/**
 * Would the reported overall band change if any single criterion moved by one
 * half band?
 *
 * The overall band is the mean of four criteria rounded to the nearest half, so
 * a mean sitting just under a rounding boundary is decided by the smallest
 * possible marking difference. A script in that position deserves a second
 * marker; a script sitting squarely inside a band does not.
 */
export function isRoundingEdge(criteriaScores: Record<string, number>): boolean {
  const scores = Object.values(criteriaScores).filter((score) => Number.isFinite(score));
  if (scores.length === 0) return false;
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const reported = Math.round(mean * 2) / 2;
  const step = 0.5 / scores.length;
  return (
    Math.round((mean + step) * 2) / 2 !== reported || Math.round((mean - step) * 2) / 2 !== reported
  );
}

/**
 * Decide whether one marking pass is enough.
 *
 * Marking every script several times is the accurate thing to do and the
 * wasteful thing to do: most scripts sit clearly inside a band and every pass
 * agrees, so the extra passes buy nothing but provider spend. IELTS itself
 * single-marks and escalates on doubt, and this mirrors that — a second opinion
 * is bought only where it can actually change the answer.
 *
 * Doubt has two sources, and either is enough to escalate:
 *  - the marker itself reported the script as borderline against the adjacent
 *    band on any criterion, which is the only signal that catches genuine
 *    disagreement about the script rather than about the arithmetic; and
 *  - the overall band sits on a rounding edge, where half a band on one
 *    criterion flips the number the learner is shown.
 */
export function needsSecondMarker(
  criteriaScores: Record<string, number>,
  bandSecurity: Record<string, string> | null | undefined
): boolean {
  if (bandSecurity && Object.values(bandSecurity).some((value) => value === 'borderline')) {
    return true;
  }
  return isRoundingEdge(criteriaScores);
}

export function normalizeBandSecurity(
  raw: unknown,
  criterionKeys: string[]
): Record<string, string> | null {
  if (!isPlainObject(raw)) return null;
  const normalized: Record<string, string> = {};
  for (const key of criterionKeys) {
    const value = raw[key];
    if (typeof value === 'string' && VALID_BAND_SECURITY.has(value)) {
      normalized[key] = value;
    }
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}

/**
 * Reconcile independent scoring passes over the same script into one band per
 * criterion.
 *
 * A single language-model pass is a draw from a distribution, not a reading of
 * a fixed value: the same essay could come back 7.5 on one pass and 8 on the
 * next, and a learner has no way to tell which draw they got. Real IELTS
 * handles this with double marking, so this does the same — score the script
 * several times independently, then take the per-criterion MEDIAN. The median
 * discards a single outlying pass entirely, where a mean would let it drag the
 * reported band, and it lands on a legal half band without extra rounding.
 *
 * The narrative is taken from whichever pass sits closest to the agreed scores
 * (smallest total absolute distance), so the written feedback a learner reads
 * always argues for the number printed beside it.
 */
export function buildWritingConsensus(
  samples: Array<Record<string, any>>,
  taskCriterionKey: string,
  options: { bandSecurity?: Record<string, string> | null } = {}
): WritingConsensus | null {
  const criterionKeys = [taskCriterionKey, ...WRITING_CRITERION_KEYS];

  const scored = samples
    .map((sample, index) => {
      const criteria = sample?.criteriaScores ?? {};
      const vector: Record<string, number> = {};
      for (const key of criterionKeys) {
        const band = normalizeBandScore(criteria[key]);
        if (band === null) return null;
        vector[key] = band;
      }
      return { index, vector };
    })
    .filter((entry): entry is { index: number; vector: Record<string, number> } => entry !== null);

  if (scored.length === 0) return null;

  const criteriaScores: Record<string, number> = {};
  const perCriterionSpread: Record<string, number> = {};
  for (const key of criterionKeys) {
    const values = scored.map((entry) => entry.vector[key]);
    // The median of half bands can land on a quarter when two passes disagree
    // by one band; normalizeBandScore pulls it back onto the IELTS scale.
    criteriaScores[key] = normalizeBandScore(medianOfNumbers(values)) as number;
    perCriterionSpread[key] = Math.max(...values) - Math.min(...values);
  }

  let representativeIndex = scored[0].index;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of scored) {
    const distance = criterionKeys.reduce(
      (sum, key) => sum + Math.abs(entry.vector[key] - criteriaScores[key]),
      0
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      representativeIndex = entry.index;
    }
  }

  const maxSpread = Math.max(...Object.values(perCriterionSpread));
  // A lone pass has no spread to measure, so its confidence comes from why it
  // was left unescalated: the marker found every criterion a secure fit and the
  // band was not resting on a rounding edge. Reporting that as 'high' on the
  // strength of a zero spread would be claiming agreement nobody tested.
  const confidence =
    scored.length === 1
      ? needsSecondMarker(criteriaScores, options.bandSecurity)
        ? 'low'
        : 'high'
      : maxSpread <= 0.5
        ? 'high'
        : maxSpread <= 1
          ? 'moderate'
          : 'low';

  return {
    criteriaScores,
    representativeIndex,
    agreement: {
      sampleCount: scored.length,
      maxSpread,
      perCriterionSpread,
      confidence,
      escalated: scored.length > 1,
    },
  };
}

function stringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, maxItems);
}

function compactFeedbackText(value: unknown, maxSentences = 1, maxChars = 160): string {
  if (typeof value !== 'string') return '';
  const normalized = value
    .trim()
    .replace(/^[`"'“”]+|[`"'“”]+$/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\s+/g, ' ');
  if (!normalized) return '';

  const sentences = splitFeedbackSentences(normalized);
  const selected = sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, maxSentences)
    .join(' ');

  if (selected.length <= maxChars) return selected;
  const clipped = selected.slice(0, maxChars - 3);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : clipped.length).trim()}...`;
}

function compactFeedbackKey(value: unknown): string {
  return compactFeedbackText(value, 1, 220)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function compactFeedbackList(value: unknown, maxItems: number, maxChars: number): string[] {
  const seen = new Set<string>();
  return stringArray(value, maxItems * 2)
    .map((item) => compactFeedbackText(item, 1, maxChars))
    .filter((item) => {
      const key = compactFeedbackKey(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxItems);
}

function exactSourceSubstring(sourceText: string, value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && sourceText.includes(value);
}

export function normalizeWritingEvaluation(
  raw: Record<string, any>,
  taskType: 'Task 1' | 'Task 2',
  sourceText: string,
  options: { consensus?: WritingConsensus | null } = {}
) {
  if (!isPlainObject(raw)) {
    throw new Error('Writing evaluation is not an object');
  }

  // When several independent passes scored this script, the agreed bands win
  // over whatever the pass that supplied the narrative happened to award.
  const criteria =
    options.consensus?.criteriaScores || raw.criteriaScores || raw.criteria_scores || {};
  const taskCriterionKey = taskType === 'Task 1' ? 'TaskAchievement' : 'TaskResponse';
  const taskCriterion = normalizeBandScore(
    criteria[taskCriterionKey] ??
      criteria.TaskAchievement ??
      criteria.TaskResponse ??
      criteria.task_achievement ??
      criteria.task_response ??
      criteria.TA ??
      criteria.TR
  );
  const coherence = normalizeBandScore(
    criteria.CoherenceAndCohesion ?? criteria['Coherence & Cohesion'] ?? criteria.CC
  );
  const lexical = normalizeBandScore(
    criteria.LexicalResource ?? criteria['Lexical Resource'] ?? criteria.LR
  );
  const grammar = normalizeBandScore(
    criteria.GrammaticalRangeAndAccuracy ??
      criteria['Grammatical Range & Accuracy'] ??
      criteria.GrammaticalRange ??
      criteria.GRA
  );

  if ([taskCriterion, coherence, lexical, grammar].some((score) => score === null)) {
    throw new Error('Writing evaluation is missing one or more criterion scores');
  }

  const criteriaScores = {
    [taskCriterionKey]: taskCriterion,
    CoherenceAndCohesion: coherence,
    LexicalResource: lexical,
    GrammaticalRangeAndAccuracy: grammar,
  };

  const annotations = Array.isArray(raw.annotations)
    ? raw.annotations
        .filter(
          (annotation: any) =>
            isPlainObject(annotation) &&
            exactSourceSubstring(sourceText, annotation.originalText) &&
            VALID_ANNOTATION_TYPES.has(annotation.type) &&
            VALID_ANNOTATION_SEVERITIES.has(annotation.severity) &&
            typeof annotation.suggestion === 'string' &&
            typeof annotation.explanation === 'string'
        )
        .map((annotation: any) => ({
          originalText: annotation.originalText,
          type: annotation.type,
          suggestion: compactFeedbackText(annotation.suggestion, 1, 90),
          replacementText:
            annotation.severity === 'error' &&
            ['grammar', 'spelling'].includes(annotation.type) &&
            sourceText.indexOf(annotation.originalText) ===
              sourceText.lastIndexOf(annotation.originalText) &&
            typeof annotation.replacementText === 'string' &&
            annotation.replacementText.trim() !== annotation.originalText.trim() &&
            !/^(?:avoid|use|add|specify|compare|explain|name|replace|consider|include|clarify)\b/i.test(
              annotation.replacementText.trim()
            )
              ? compactFeedbackText(annotation.replacementText, 1, 90)
              : '',
          explanation: compactFeedbackText(annotation.explanation, 1, 105),
          severity: annotation.severity,
        }))
        .slice(0, 10)
    : [];

  const suppliedCorrections = Array.isArray(raw.corrections)
    ? raw.corrections
        .filter(
          (correction: any) =>
            isPlainObject(correction) &&
            exactSourceSubstring(sourceText, correction.original) &&
            typeof correction.correction === 'string' &&
            correction.correction.trim().length > 0 &&
            correction.correction.trim() !== correction.original.trim() &&
            typeof correction.explanation === 'string'
        )
        .map((correction: any) => ({
          original: correction.original,
          correction: compactFeedbackText(correction.correction, 1, 90),
          explanation: compactFeedbackText(correction.explanation, 1, 105),
        }))
        .slice(0, 6)
    : [];

  // Suggestions are advice, never paste-ready corrections. Only an explicit,
  // validated replacement may appear in the correction comparison.
  const corrections = Array.isArray(raw.annotations)
    ? annotations
        .filter(
          (annotation: any) =>
            annotation.severity === 'error' &&
            annotation.replacementText &&
            annotation.replacementText.trim() !== annotation.originalText.trim()
        )
        .map((annotation: any) => ({
          original: annotation.originalText,
          correction: annotation.replacementText,
          explanation: annotation.explanation,
        }))
        .slice(0, 6)
    : suppliedCorrections;

  const vocabularyEnhancements = Array.isArray(
    raw.vocabularyEnhancements || raw.vocabulary_enhancements
  )
    ? (raw.vocabularyEnhancements || raw.vocabulary_enhancements)
        .filter(
          (item: any) =>
            isPlainObject(item) &&
            exactSourceSubstring(sourceText, item.original) &&
            Array.isArray(item.alternatives) &&
            item.alternatives.some(
              (alternative: unknown) =>
                typeof alternative === 'string' && alternative.trim().length > 0
            )
        )
        .map((item: any) => ({
          original: item.original,
          alternatives: stringArray(item.alternatives, 3),
          context: typeof item.context === 'string' ? item.context.trim() : '',
        }))
        .slice(0, 4)
    : [];

  const priorities = Array.isArray(raw.priorities)
    ? raw.priorities
        .filter(
          (priority: any) =>
            isPlainObject(priority) &&
            VALID_WRITING_CRITERIA.has(priority.criterion) &&
            typeof priority.issue === 'string' &&
            priority.issue.trim().length > 0 &&
            typeof priority.action === 'string' &&
            priority.action.trim().length > 0
        )
        .map((priority: any) => {
          const evidenceText =
            typeof priority.evidenceText === 'string' &&
            annotations.some((annotation: any) => annotation.originalText === priority.evidenceText)
              ? priority.evidenceText
              : null;

          return {
            criterion: priority.criterion,
            issue: compactFeedbackText(priority.issue, 1, 90),
            action: compactFeedbackText(priority.action, 1, 105),
            ...(evidenceText ? { evidenceText } : {}),
          };
        })
        .slice(0, 3)
    : [];

  const wordCount = countWords(sourceText);

  const rawTaskAnalysis = isPlainObject(raw.taskAnalysis) ? raw.taskAnalysis : null;
  const taskAnalysis =
    taskType === 'Task 1' && rawTaskAnalysis
      ? {
          visualType: VALID_TASK_1_VISUAL_TYPES.has(rawTaskAnalysis.visualType)
            ? rawTaskAnalysis.visualType
            : 'not identifiable',
          responseVisualType: VALID_TASK_1_VISUAL_TYPES.has(rawTaskAnalysis.responseVisualType)
            ? rawTaskAnalysis.responseVisualType
            : 'not identifiable',
          alignment: VALID_TASK_1_ALIGNMENTS.has(rawTaskAnalysis.alignment)
            ? rawTaskAnalysis.alignment
            : 'uncertain',
          visualReadable: rawTaskAnalysis.visualReadable === true,
          observedFeatures: compactFeedbackList(rawTaskAnalysis.observedFeatures, 3, 140),
          limitations: compactFeedbackText(rawTaskAnalysis.limitations, 1, 180),
        }
      : null;

  // The public Task 1 descriptor places a response that does not address the
  // required data/diagram at Band 3. Band 2 is reserved for barely related
  // content, so a wrong visual must not be automatically forced below Band 3.
  if (taskAnalysis?.alignment === 'mismatched') {
    criteriaScores[taskCriterionKey] = Math.min(3, criteriaScores[taskCriterionKey] ?? 3);
  }

  // Official 2023 public descriptors: responses of 20 words or fewer are rated
  // Band 1 on every criterion. Enforce deterministically — the model sometimes
  // second-guesses this rule.
  if (wordCount <= 20 && wordCount > 0) {
    criteriaScores[taskCriterionKey] = 1;
    criteriaScores.CoherenceAndCohesion = 1;
    criteriaScores.LexicalResource = 1;
    criteriaScores.GrammaticalRangeAndAccuracy = 1;
  }

  const minimumWords = taskType === 'Task 1' ? 150 : 250;
  const weaknesses = compactFeedbackList(raw.weaknesses, 4, 140);
  if (wordCount < minimumWords) {
    const deterministicLengthNote = `Response length: ${wordCount} words, below the ${minimumWords}-word minimum. This limits how fully the task can be addressed, but language criteria are still judged from the language actually demonstrated.`;
    if (!weaknesses.some((item) => /\bword(?:s| count| length)\b/i.test(item))) {
      weaknesses.unshift(deterministicLengthNote);
    }
  }

  return {
    // Official IELTS rounding: average of the four criteria, .25 → up to half
    // band, .75 → up to whole band (= round-half-up to nearest 0.5).
    overallBand: averageBandScores([
      criteriaScores[taskCriterionKey],
      criteriaScores.CoherenceAndCohesion,
      criteriaScores.LexicalResource,
      criteriaScores.GrammaticalRangeAndAccuracy,
    ]),
    criteriaScores,
    annotations,
    summary: compactFeedbackText(raw.summary, 1, 140),
    strengths: compactFeedbackList(raw.strengths, 3, 100),
    priorities,
    weaknesses,
    suggestions: compactFeedbackList(raw.suggestions, 4, 140),
    corrections,
    vocabularyEnhancements,
    wordCount,
    taskType,
    taskAnalysis,
    scoreAgreement: options.consensus?.agreement ?? null,
    writingCalibrationRevision: WRITING_CALIBRATION_REVISION,
    evaluationVersion: FEEDBACK_EVALUATOR_VERSION,
  };
}

function isValidUserEntry(entry: SpeakingEntry): boolean {
  return Boolean(entry && entry.speaker === 'user' && !entry.isLoading && !entry.error);
}

export function isMeaningfulSpeakingResponse(entry: SpeakingEntry): boolean {
  if (!isValidUserEntry(entry)) return false;
  const text = typeof entry.text === 'string' ? entry.text.trim() : '';
  return !INVALID_SPEAKING_RESPONSES.some((pattern) => pattern.test(text));
}

function isProceduralExaminerText(text: string): boolean {
  return PROCEDURAL_EXAMINER_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

function normalizePartContext(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim().slice(0, 4000);
  if (typeof value === 'object') {
    const context = value as Record<string, unknown>;
    return [context.title, context.questions]
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);
  }
  return '';
}

export function buildSpeakingTranscript(
  allPartsConversation: Record<string | number, SpeakingEntry[]>,
  partContexts: Record<string | number, unknown> = {}
) {
  let transcript = '';
  const partStats: Record<string, SpeakingPartStats> = {};
  const candidateSource: Record<string, string> = {};

  for (const part of [1, 2, 3]) {
    const entries = Array.isArray(allPartsConversation?.[part])
      ? allPartsConversation[part]
      : Array.isArray(allPartsConversation?.[String(part)])
        ? allPartsConversation[String(part)]
        : [];
    const context = normalizePartContext(partContexts?.[part] ?? partContexts?.[String(part)]);
    let candidateWordCount = 0;
    let validResponseCount = 0;
    let unintelligibleResponseCount = 0;
    const candidateResponses: string[] = [];
    const lines: string[] = [];

    if (context) lines.push(`<task_context>${escapePromptXml(context)}</task_context>`);

    for (const entry of entries) {
      if (!entry || entry.isLoading || typeof entry.text !== 'string') continue;
      const text = entry.text.replace(/\s+/g, ' ').trim();
      if (!text) continue;

      if (entry.speaker === 'user') {
        if (isMeaningfulSpeakingResponse(entry)) {
          candidateWordCount += countWords(text);
          validResponseCount += 1;
          candidateResponses.push(text);
          lines.push(`<utterance role="candidate">${escapePromptXml(text)}</utterance>`);
        } else {
          unintelligibleResponseCount += 1;
          lines.push('Candidate: [No intelligible response]');
        }
      } else if (!isProceduralExaminerText(text)) {
        lines.push(`<utterance role="examiner">${escapePromptXml(text)}</utterance>`);
      }
    }

    partStats[String(part)] = {
      candidateWordCount,
      validResponseCount,
      unintelligibleResponseCount,
    };
    candidateSource[String(part)] = candidateResponses.join('\n');
    transcript += `=== PART ${part} ===\n${lines.join('\n') || '[No response data]'}\n\n`;
  }

  return {
    transcript: transcript.trim(),
    partStats,
    candidateSource,
    totalCandidateWords: Object.values(partStats).reduce(
      (sum, stats) => sum + stats.candidateWordCount,
      0
    ),
  };
}

function isValidWordIssue(issue: any): issue is { word: string; issue: string; severity: string } {
  return (
    isPlainObject(issue) &&
    typeof issue.word === 'string' &&
    typeof issue.issue === 'string' &&
    typeof issue.severity === 'string'
  );
}

function processAudioSample(
  sample: any,
  part: string,
  state: {
    scores: number[];
    coveredParts: Set<string>;
    partScores: number[];
    fluencyNotes: string[];
    problematicSounds: Set<string>;
    wordIssues: Array<{ word: string; issue: string; severity: string }>;
  }
) {
  if (sample?.provider !== 'azure-speech') return;
  const score = normalizeBandScore(sample?.pronunciationScore, false);
  if (score !== null) {
    state.scores.push(score);
    state.partScores.push(score);
    state.coveredParts.add(part);
  }
  if (typeof sample?.fluencyNotes === 'string' && sample.fluencyNotes.trim()) {
    state.fluencyNotes.push(sample.fluencyNotes.trim());
  }
  if (Array.isArray(sample?.problematicSounds)) {
    for (const sound of sample.problematicSounds) {
      if (typeof sound === 'string' && sound.trim()) state.problematicSounds.add(sound.trim());
    }
  }
  if (Array.isArray(sample?.wordLevelFeedback)) {
    for (const issue of sample.wordLevelFeedback) {
      if (isValidWordIssue(issue)) {
        state.wordIssues.push({
          word: issue.word.trim(),
          issue: issue.issue.trim(),
          severity: issue.severity.trim(),
        });
      }
    }
  }
}

function processPronunciationPart(
  part: string,
  samples: any[],
  state: {
    scores: number[];
    coveredParts: Set<string>;
    summaryLines: string[];
    problematicSounds: Set<string>;
    wordIssues: Array<{ word: string; issue: string; severity: string }>;
  }
) {
  const partState = {
    scores: state.scores,
    coveredParts: state.coveredParts,
    partScores: [] as number[],
    fluencyNotes: [] as string[],
    problematicSounds: state.problematicSounds,
    wordIssues: state.wordIssues,
  };

  for (const sample of samples) {
    processAudioSample(sample, part, partState);
  }

  if (partState.partScores.length > 0) {
    state.summaryLines.push(
      `Part ${part}: ${partState.partScores.length} audio sample(s), average ${averageBandScores(partState.partScores)}/9.`
    );
    if (partState.fluencyNotes.length > 0) {
      state.summaryLines.push(
        `Part ${part} audio observations: ${partState.fluencyNotes.join('; ')}`
      );
    }
  }
}

export function aggregatePronunciationEvidence(
  allPartsPronunciation: Record<string | number, any[]> | null | undefined
): PronunciationEvidence {
  const state = {
    scores: [] as number[],
    coveredParts: new Set<string>(),
    summaryLines: [] as string[],
    problematicSounds: new Set<string>(),
    wordIssues: [] as Array<{ word: string; issue: string; severity: string }>,
  };

  if (isPlainObject(allPartsPronunciation)) {
    for (const [part, samples] of Object.entries(allPartsPronunciation)) {
      if (Array.isArray(samples)) {
        processPronunciationPart(part, samples, state);
      }
    }
  }

  const hasRepresentativeCoverage =
    state.scores.length >= 2 && state.coveredParts.has('1') && state.coveredParts.has('3');
  if (state.scores.length > 0 && !hasRepresentativeCoverage) {
    state.summaryLines.push(
      'Pronunciation remains unscored until valid audio samples cover both Part 1 and Part 3.'
    );
  }

  return {
    score: hasRepresentativeCoverage ? averageBandScores(state.scores) : null,
    sampleCount: state.scores.length,
    partCount: state.coveredParts.size,
    summary: state.summaryLines.join('\n'),
    problematicSounds: Array.from(state.problematicSounds).slice(0, 12),
    wordIssues: state.wordIssues.slice(0, 20),
  };
}

function removeUnsupportedAudioClaims(items: string[], hasAudioEvidence: boolean): string[] {
  if (hasAudioEvidence) return items;
  return items.filter((item) => !UNSUPPORTED_AUDIO_CLAIM_PATTERN.test(item));
}

function removeUnsupportedAudioSentences(value: unknown, hasAudioEvidence: boolean): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  if (hasAudioEvidence) return value.trim();
  return value
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !UNSUPPORTED_AUDIO_CLAIM_PATTERN.test(sentence))
    .join(' ')
    .trim();
}

function validateSpeakingCriteria(
  fluency: number | null,
  lexical: number | null,
  grammar: number | null
) {
  const scores = [fluency, lexical, grammar];
  const hasMissing = scores.some((s) => s === null);
  if (hasMissing) {
    throw new Error('Speaking evaluation is missing one or more language criterion scores');
  }
}

function calculateOverallBand(
  fluency: number,
  lexical: number,
  grammar: number,
  pronunciation: number | null
) {
  const transcriptOverallBand = averageBandScores([fluency, lexical, grammar]);
  const overallBand =
    pronunciation === null
      ? transcriptOverallBand
      : averageBandScores([fluency, lexical, grammar, pronunciation]);
  return { transcriptOverallBand, overallBand };
}

function buildPronunciationNote(
  pronunciationEvidence: PronunciationEvidence,
  hasPronunciationEvidence: boolean
): string {
  if (!hasPronunciationEvidence) return '';
  return `${pronunciationEvidence.sampleCount} short audio samples across ${pronunciationEvidence.partCount} parts were available. This is a provisional acoustic estimate, not an official IELTS mark.`;
}

function buildCriterionNotes(
  rawNotes: Record<string, any>,
  fluencyNote: string,
  pronunciationNote: string
) {
  return {
    fluency: compactFeedbackText(fluencyNote, 1, 155),
    lexical: compactFeedbackText(rawNotes.lexical, 1, 155),
    grammar: compactFeedbackText(rawNotes.grammar, 1, 155),
    pronunciation: pronunciationNote,
  };
}

function buildFeedbackText(rawFeedback: unknown, hasPronunciationEvidence: boolean): string {
  const cleaned = removeUnsupportedAudioSentences(rawFeedback, hasPronunciationEvidence);
  return compactFeedbackText(cleaned, 2, 220) || 'Speaking evaluation completed.';
}

export function normalizeSpeakingEvaluation(
  raw: Record<string, any>,
  partStats: Record<string, SpeakingPartStats>,
  pronunciationEvidence: PronunciationEvidence
) {
  if (!isPlainObject(raw)) {
    throw new Error('Speaking evaluation is not an object');
  }

  const fluency = normalizeBandScore(raw.fluency);
  const lexical = normalizeBandScore(raw.lexical);
  const grammar = normalizeBandScore(raw.grammar);
  validateSpeakingCriteria(fluency, lexical, grammar);

  const pronunciation = pronunciationEvidence.score;
  const hasPronunciationEvidence = pronunciation !== null;
  const { transcriptOverallBand, overallBand } = calculateOverallBand(
    fluency as number,
    lexical as number,
    grammar as number,
    pronunciation
  );

  const criterionNotes = raw.criterionNotes || {};
  const pronunciationNote = buildPronunciationNote(pronunciationEvidence, hasPronunciationEvidence);
  const fluencyNote = buildFluencyNote(criterionNotes.fluency, partStats, hasPronunciationEvidence);

  return {
    fluency,
    lexical,
    grammar,
    pronunciation,
    overallBand,
    provisionalOverallBand: transcriptOverallBand,
    assessmentStatus: hasPronunciationEvidence ? 'complete' : 'transcript',
    scoreBasis: hasPronunciationEvidence ? 'audio-and-transcript' : 'transcript',
    pronunciationEvidence: {
      sampleCount: pronunciationEvidence.sampleCount,
      partCount: pronunciationEvidence.partCount,
    },
    feedback: buildFeedbackText(raw.feedback, hasPronunciationEvidence),
    partScores: extractSpeakingPartScores(
      raw.partScores || {},
      partStats,
      hasPronunciationEvidence
    ),
    criterionNotes: buildCriterionNotes(criterionNotes, fluencyNote, pronunciationNote),
    strengths: removeUnsupportedAudioClaims(
      compactFeedbackList(raw.strengths, 3, 125),
      hasPronunciationEvidence
    ),
    improvements: extractSpeakingImprovements(raw.improvements, hasPronunciationEvidence),
    targetBandTips: compactFeedbackText(
      removeUnsupportedAudioSentences(raw.targetBandTips, hasPronunciationEvidence),
      1,
      190
    ),
    evaluationVersion: FEEDBACK_EVALUATOR_VERSION,
  };
}

function extractSpeakingPartScores(
  rawPartScores: Record<string, any>,
  partStats: Record<string, SpeakingPartStats>,
  hasPronunciationEvidence: boolean
) {
  const partScores: Record<string, { band: number | null; keyObservation: string }> = {};
  for (const part of [1, 2, 3]) {
    const key = `part${part}`;
    const stats = partStats[String(part)] || {
      candidateWordCount: 0,
      validResponseCount: 0,
      unintelligibleResponseCount: 0,
    };
    const rawPart = rawPartScores[key] || {};
    const rawObservation =
      typeof rawPart.keyObservation === 'string' ? rawPart.keyObservation.trim() : '';
    const keyObservation = removeUnsupportedAudioSentences(
      rawObservation,
      hasPronunciationEvidence
    );
    partScores[key] = {
      band:
        stats.validResponseCount === 0 ? null : normalizeBandScore(rawPart.band ?? rawPart.score),
      keyObservation:
        stats.validResponseCount === 0
          ? 'No intelligible response was available for this part.'
          : keyObservation
            ? keyObservation
            : `${stats.candidateWordCount} candidate words were available for assessment.`,
    };
  }
  return partScores;
}

function buildFluencyNote(
  rawFluencyNote: unknown,
  partStats: Record<string, SpeakingPartStats>,
  hasPronunciationEvidence: boolean
) {
  const note = removeUnsupportedAudioSentences(rawFluencyNote, hasPronunciationEvidence);
  if (note) return note;
  if (hasPronunciationEvidence) return '';

  const totalCandidateWords = Object.values(partStats).reduce(
    (sum, stats) => sum + stats.candidateWordCount,
    0
  );
  const totalValidResponses = Object.values(partStats).reduce(
    (sum, stats) => sum + stats.validResponseCount,
    0
  );
  return `Only transcript evidence was available: ${totalCandidateWords} words across ${totalValidResponses} developed response(s), scored from response development visible in the transcript.`;
}

function isSupportedImprovement(item: any, hasPronunciationEvidence: boolean): boolean {
  if (hasPronunciationEvidence) return true;
  return !UNSUPPORTED_AUDIO_CLAIM_PATTERN.test(`${item?.area || ''} ${item?.tip || ''}`);
}

function getImprovementArea(item: any): string {
  if (item?.criterion) return item.criterion;
  if (item?.area) return item.area;
  return 'Next step';
}

function getImprovementTip(item: any): any {
  if (item?.tip) return item.tip;
  if (item?.suggestion) return item.suggestion;
  if (item?.feedback) return item.feedback;
  return item;
}

function mapImprovement(item: any) {
  return {
    area: compactFeedbackText(getImprovementArea(item), 1, 32),
    tip: compactFeedbackText(getImprovementTip(item), 1, 170),
  };
}

function isValidImprovement(item: any): boolean {
  return Boolean(item.area && item.tip);
}

function filterUniqueImprovements(item: any, idx: number, items: any[]): boolean {
  const key = compactFeedbackKey(item.tip);
  return Boolean(
    key && items.findIndex((candidate) => compactFeedbackKey(candidate.tip) === key) === idx
  );
}

function extractSpeakingImprovements(rawImprovements: unknown, hasPronunciationEvidence: boolean) {
  if (!Array.isArray(rawImprovements)) return [];

  return rawImprovements
    .filter((item) => isSupportedImprovement(item, hasPronunciationEvidence))
    .map(mapImprovement)
    .filter(isValidImprovement)
    .filter(filterUniqueImprovements)
    .slice(0, 3);
}

export function normalizeDetailedSpeakingEvaluation(
  raw: unknown,
  candidateSource: Record<string, string>
) {
  if (!Array.isArray(raw)) {
    throw new Error('Detailed speaking evaluation is not an array');
  }

  return raw
    .filter((item) => isPlainObject(item))
    .map((item: any) => processDetailedSpeakingItem(item, candidateSource))
    .filter(Boolean);
}

function getStringOrDefault(value: unknown, defaultValue = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : defaultValue;
}

function processDetailedSpeakingItem(item: any, candidateSource: Record<string, string>) {
  const part = Number(item.part);
  const source = candidateSource[String(part)] || '';
  if (![1, 2, 3].includes(part) || !exactSourceSubstring(source, item.candidateAnswer)) {
    return null;
  }

  return {
    part,
    question: getStringOrDefault(item.question),
    candidateAnswer: item.candidateAnswer,
    grammaticalErrors: extractGrammaticalErrors(item.grammaticalErrors, item.candidateAnswer),
    topicDrift: getStringOrDefault(item.topicDrift, 'null'),
    suggestedAnswer: getStringOrDefault(item.suggestedAnswer),
    feedback: getStringOrDefault(item.feedback),
  };
}

/**
 * Contractions written without their apostrophe, which is what an ASR
 * transcript routinely contains. Expanded on both sides of a comparison so
 * "its faster" and "it's faster" reduce to the same thing.
 */
const CONTRACTION_EXPANSIONS: Record<string, string> = {
  im: 'i am',
  "i'm": 'i am',
  its: 'it is',
  "it's": 'it is',
  theres: 'there is',
  "there's": 'there is',
  thats: 'that is',
  "that's": 'that is',
  whats: 'what is',
  "what's": 'what is',
  ive: 'i have',
  "i've": 'i have',
  id: 'i would',
  "i'd": 'i would',
  theyre: 'they are',
  "they're": 'they are',
  youre: 'you are',
  "you're": 'you are',
  "we're": 'we are',
  dont: 'do not',
  "don't": 'do not',
  doesnt: 'does not',
  "doesn't": 'does not',
  didnt: 'did not',
  "didn't": 'did not',
  isnt: 'is not',
  "isn't": 'is not',
  arent: 'are not',
  "aren't": 'are not',
  wasnt: 'was not',
  "wasn't": 'was not',
  havent: 'have not',
  "haven't": 'have not',
  hasnt: 'has not',
  "hasn't": 'has not',
  cant: 'can not',
  "can't": 'can not',
  couldnt: 'could not',
  "couldn't": 'could not',
  wouldnt: 'would not',
  "wouldn't": 'would not',
  shouldnt: 'should not',
  "shouldn't": 'should not',
};

/**
 * Words a speech recogniser confuses acoustically. A "correction" that only
 * swaps one of these is the transcriber's mistake, not the candidate's, so the
 * route must never show it as the learner's grammar error. "were" is
 * deliberately absent: was/were is a real agreement error we must keep.
 */
const HOMOPHONE_GROUPS: string[][] = [
  ['by', 'buy', 'bye'],
  ['then', 'than'],
  ['to', 'too', 'two'],
  ['there', 'their'],
  ['hear', 'here'],
  ['of', 'off'],
  ['no', 'know'],
  ['week', 'weak'],
  ['right', 'write', 'rite'],
  ['past', 'passed'],
  ['effect', 'affect'],
  ['lose', 'loose'],
  ['quiet', 'quite'],
  ['whether', 'weather'],
  ['piece', 'peace'],
  ['sea', 'see'],
  ['son', 'sun'],
  ['one', 'won'],
  ['brake', 'break'],
  ['allowed', 'aloud'],
  ['accept', 'except'],
];

const HOMOPHONE_CANONICAL: Record<string, string> = Object.fromEntries(
  HOMOPHONE_GROUPS.flatMap((group) => group.map((word) => [word, group[0]]))
);

/**
 * Reduce a phrase to the form that survives transcription: lowercase, no
 * punctuation, contractions expanded, acoustically-confusable words collapsed
 * onto one spelling.
 */
function transcriptionInvariant(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .split(/\s+/)
    .flatMap((token) => {
      const bare = token.replace(/[^a-z']/g, '');
      const expanded = CONTRACTION_EXPANSIONS[bare];
      return (expanded ?? bare).split(' ');
    })
    .map((token) => token.replace(/'/g, ''))
    .filter(Boolean)
    .map((token) => HOMOPHONE_CANONICAL[token] ?? token)
    .join(' ');
}

/**
 * True when `correct` differs from `incorrect` only by things the candidate
 * never controlled — capitalisation, punctuation, a dropped apostrophe, or an
 * acoustically-confusable word. The deep-dive prompt forbids reporting these,
 * but models do it anyway on every run, so the contract is enforced here
 * rather than requested.
 */
export function isTranscriptionArtifact(incorrect: string, correct: string): boolean {
  const before = transcriptionInvariant(incorrect);
  const after = transcriptionInvariant(correct);
  return before.length > 0 && before === after;
}

function extractGrammaticalErrors(rawErrors: unknown, candidateAnswer: string) {
  if (!Array.isArray(rawErrors)) return [];

  return rawErrors
    .filter(
      (error: any) =>
        isPlainObject(error) &&
        exactSourceSubstring(candidateAnswer, error.incorrect) &&
        typeof error.correct === 'string' &&
        error.correct.trim().length > 0 &&
        error.correct.trim() !== error.incorrect.trim() &&
        // The transcript is ASR output. A "correction" that only restores an
        // apostrophe or swaps a homophone is the transcriber's error, and
        // showing it would tell the learner they made a mistake they did not.
        !isTranscriptionArtifact(error.incorrect, error.correct) &&
        typeof error.explanation === 'string'
    )
    .slice(0, 12);
}
