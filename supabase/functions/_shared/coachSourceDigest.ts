// Turns one completed test session into the compact, structured context Ava reasons
// over. The old approach sliced the first 3,000 characters of the raw `content_data`
// JSON, which for Reading and Listening was mostly timing arrays and for Writing was
// cut mid-essay. This keeps the facts a learner actually asks about, "why was Q12
// wrong?" or "what did the feedback say about my conclusion?", and drops the rest.
//
// Everything here is read from the learner's own completed session or from the
// already-reviewed answer key, so it adds no AI cost and invents nothing.

const OBJECTIVE_MODULES = new Set(['reading', 'listening']);
const MAX_MISSES = 8;
const MAX_MISSES_WITH_FOCUS = 4;

export type SourceQuestionRow = {
  question_number: number | null;
  question_count?: number | null;
  question_text?: string | null;
  group_instructions?: string | null;
  type?: string | null;
  options?: unknown;
  explanation?: string | null;
  explanation_data?: any;
};

const clean = (value: unknown, max: number) =>
  String(value ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const finite = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean')
    return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const isObject = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** `{ [key]: value }` when there is a value to report, otherwise nothing. */
const optional = (key: string, value: unknown) =>
  value === undefined || value === null || value === '' ? {} : { [key]: value };

const listOf = (value: unknown, max: number): any[] =>
  Array.isArray(value) ? value.slice(0, max) : [];

const cleanedStrings = (value: unknown, max: number, length: number) =>
  listOf(value, max).map((item) => clean(item, length));

/** A short, cleaned `{ key: text }` copy of an object of notes, or undefined. */
function cleanedNotes(value: unknown, max: number, length: number) {
  if (!isObject(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, max)
      .map(([key, note]) => [clean(key, 40), clean(note, length)])
  );
}

function answerText(value: unknown, max = 90): string | null {
  if (value === null || value === undefined) return null;
  let text: string;
  if (Array.isArray(value)) text = value.map((item) => answerText(item, 40)).join(', ');
  else text = isObject(value) ? JSON.stringify(value) : String(value);
  return clean(text, max) || null;
}

function optionLabels(options: unknown): string[] {
  return listOf(options, 6)
    .map((option: any) =>
      clean(typeof option === 'string' ? option : (option?.text ?? option?.label ?? ''), 70)
    )
    .filter(Boolean);
}

const textOrNull = (value: unknown) => (typeof value === 'string' ? value : null);

/** Per-question explanation, which is stored either flat or under `blanks[number]`. */
function explanationFor(row: SourceQuestionRow | undefined, number: number) {
  const data = row?.explanation_data;
  if (!isObject(data)) return null;
  const isThisQuestion = Number(row?.question_number) === number || !data.blanks;
  const entry = data.blanks?.[String(number)] ?? (isThisQuestion ? data : null);
  if (!isObject(entry)) return null;
  return {
    why: textOrNull(entry.why_correct),
    trap: textOrNull(entry.trap),
    highlight: textOrNull(entry.passage_highlight),
    tempting: textOrNull(entry.tempting_answer),
  };
}

function rowFor(rows: SourceQuestionRow[], number: number) {
  return rows.find((row) => {
    const start = Number(row.question_number);
    const count = Math.max(1, Number(row.question_count) || 1);
    return Number.isFinite(start) && number >= start && number < start + count;
  });
}

type Limits = { text: number; why: number; highlight: number };

function explanationFields(
  explanation: ReturnType<typeof explanationFor>,
  row: SourceQuestionRow | undefined,
  limits: Limits
) {
  const why = explanation?.why ? explanation.why : row?.explanation;
  return {
    ...optional('whyCorrect', why && clean(why, limits.why)),
    ...optional('trap', explanation?.trap && clean(explanation.trap, 160)),
    ...optional('temptingAnswer', explanation?.tempting && clean(explanation.tempting, 60)),
    ...optional(
      'passageHighlight',
      explanation?.highlight && clean(explanation.highlight, limits.highlight)
    ),
  };
}

function describeQuestion(detail: any, rows: SourceQuestionRow[], limits: Limits) {
  const number = Number(detail?.questionNumber);
  const row = rowFor(rows, number);
  const questionText = row?.question_text || row?.group_instructions;
  const options = optionLabels(row?.options);
  return {
    number,
    type: clean(detail?.questionType || detail?.type || row?.type || 'unknown', 40),
    ...optional('question', questionText && clean(questionText, limits.text)),
    ...(options.length ? { options } : {}),
    yourAnswer: answerText(detail?.userAnswer),
    correctAnswer: answerText(detail?.correctAnswer),
    flagged: detail?.wasFlagged === true,
    ...explanationFields(explanationFor(row, number), row, limits),
  };
}

function weakestTypes(content: any) {
  return Object.entries(content.typeStats || {})
    .map(([type, stat]: [string, any]) => ({
      type: clean(type, 40),
      correct: finite(stat?.correct) ?? 0,
      total: finite(stat?.total) ?? 0,
    }))
    .filter((stat) => stat.total > 0)
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total)
    .slice(0, 8);
}

/** The focus question gets more room; the remaining misses make way for it. */
function focusFields(details: any[], rows: SourceQuestionRow[], focusQuestion: number | null) {
  if (focusQuestion == null) return { focusDetail: null, fields: {} };
  const focusDetail = details.find((d) => Number(d?.questionNumber) === focusQuestion) || null;
  if (!focusDetail)
    return {
      focusDetail,
      fields: { focusQuestionNote: `Question ${focusQuestion} is not on record for this result.` },
    };
  const limits = { text: 420, why: 420, highlight: 360 };
  return { focusDetail, fields: { focusQuestion: describeQuestion(focusDetail, rows, limits) } };
}

/**
 * Older results saved only the raw answers, keyed by question id, with no grading detail.
 * Say so rather than reporting "0 wrong" for a result that plainly had mistakes.
 */
function gradingSummary(content: any, details: any[], wrong: any[]) {
  const detailAvailable = details.length > 0;
  const fallback = (value: number) => (detailAvailable ? value : null);
  return {
    detailAvailable,
    total: finite(content.totalQuestions) ?? fallback(details.length),
    correct: finite(content.correctAnswers) ?? fallback(details.filter((d) => d?.isCorrect).length),
    missesTotal: fallback(wrong.length),
    ...(detailAvailable
      ? {}
      : {
          note: 'Per-question detail was not saved for this older result, so individual mistakes are unknown.',
        }),
  };
}

function objectiveDigest(session: any, rows: SourceQuestionRow[], focusQuestion: number | null) {
  const content = session.content_data || {};
  const details: any[] = listOf(content.responseDetails, Infinity);
  const wrong = details.filter((detail) => detail?.isCorrect === false);
  const { focusDetail, fields } = focusFields(details, rows, focusQuestion);
  const misses = wrong
    .filter((detail) => detail !== focusDetail)
    .sort((a, b) => Number(a.questionNumber) - Number(b.questionNumber))
    .slice(0, focusDetail ? MAX_MISSES_WITH_FOCUS : MAX_MISSES)
    .map((detail) => describeQuestion(detail, rows, { text: 200, why: 220, highlight: 180 }));
  const seconds = finite(content.timeMetrics?.totalTimeSpent ?? session.actual_duration_seconds);
  const grading = gradingSummary(content, details, wrong);
  return {
    kind: 'objective' as const,
    module: clean(session.test_type, 20).toLowerCase(),
    mode: clean(session.test_mode || 'practice', 20),
    band: finite(session.score ?? session.band_score),
    correct: grading.correct,
    total: grading.total,
    unanswered: wrong.filter((detail) => answerText(detail?.userAnswer) === null).length,
    minutesSpent: seconds == null ? null : Math.round(seconds / 60),
    changedAnswers: finite(content.changedAnswersCount),
    weakestTypes: weakestTypes(content),
    detailAvailable: grading.detailAvailable,
    ...optional('note', grading.note),
    missesTotal: grading.missesTotal,
    misses,
    ...fields,
  };
}

function writingTask(task: 'Task 1' | 'Task 2', feedback: any, response: any) {
  const text = task === 'Task 1' ? response?.task1_response : response?.task2_response;
  const scores = isObject(feedback.criteriaScores)
    ? Object.fromEntries(
        Object.entries(feedback.criteriaScores)
          .slice(0, 4)
          .map(([key, value]) => [clean(key, 40), finite(value)])
      )
    : undefined;
  return {
    task,
    band: finite(feedback.overallBand ?? feedback.overall_band ?? feedback.band_score),
    criteria: scores,
    notes: cleanedNotes(feedback.criterionNotes, 4, 160),
    strengths: cleanedStrings(feedback.strengths, 3, 120),
    priorities: listOf(feedback.priorities, 3).map((item: any) => ({
      criterion: clean(item?.criterion, 40),
      issue: clean(item?.issue, 150),
      action: clean(item?.action, 170),
    })),
    corrections: listOf(feedback.corrections, 4).map((item: any) => ({
      original: clean(item?.original, 100),
      correction: clean(item?.correction, 100),
      why: clean(item?.explanation, 120),
    })),
    learnerResponse: typeof text === 'string' ? clean(text, 1_100) : undefined,
  };
}

function writingDigest(session: any) {
  const feedbacks = isObject(session.content_data?.ai_feedbacks)
    ? session.content_data.ai_feedbacks
    : {};
  const response = Array.isArray(session.user_responses) ? session.user_responses[0] : null;
  const tasks = (['Task 1', 'Task 2'] as const)
    .filter((task) => isObject(feedbacks[task]))
    .map((task) => writingTask(task, feedbacks[task], response));
  return {
    kind: 'writing' as const,
    module: 'writing',
    mode: clean(session.test_mode || 'practice', 20),
    band: finite(session.score ?? session.band_score),
    tasks,
  };
}

function speakingParts(partScores: unknown) {
  if (!isObject(partScores)) return {};
  return Object.fromEntries(
    Object.entries(partScores)
      .slice(0, 3)
      .map(([key, part]: [string, any]) => [
        clean(key, 10),
        { band: finite(part?.band), observation: clean(part?.keyObservation, 200) },
      ])
  );
}

function speakingDigest(session: any) {
  const evaluation = isObject(session.content_data?.finalEvaluation)
    ? session.content_data.finalEvaluation
    : {};
  return {
    kind: 'speaking' as const,
    module: 'speaking',
    mode: clean(session.test_mode || 'practice', 20),
    band: finite(session.score ?? session.band_score),
    criteria: {
      fluency: finite(evaluation.fluency),
      lexical: finite(evaluation.lexical),
      grammar: finite(evaluation.grammar),
      pronunciation: finite(evaluation.pronunciation),
    },
    notes: cleanedNotes(evaluation.criterionNotes, 4, 180),
    parts: speakingParts(evaluation.partScores),
    strengths: cleanedStrings(evaluation.strengths, 3, 120),
    improvements: listOf(evaluation.improvements, 3).map((item: any) => ({
      area: clean(item?.area, 60),
      tip: clean(item?.tip, 170),
    })),
  };
}

export type SourceDigest = ReturnType<
  typeof objectiveDigest | typeof writingDigest | typeof speakingDigest
>;

export function buildSourceDigest({
  session,
  questions = [],
  focusQuestion = null,
}: {
  session: any;
  questions?: SourceQuestionRow[];
  focusQuestion?: number | null;
}): SourceDigest | null {
  if (!session) return null;
  const module = String(session.test_type || '').toLowerCase();
  if (OBJECTIVE_MODULES.has(module)) return objectiveDigest(session, questions, focusQuestion);
  if (module === 'writing') return writingDigest(session);
  if (module === 'speaking') return speakingDigest(session);
  return null;
}

/** Whether a source needs the answer-key rows (question text, options, explanations). */
export function sourceNeedsQuestionRows(session: any) {
  return OBJECTIVE_MODULES.has(String(session?.test_type || '').toLowerCase());
}

/**
 * A deterministic, AI-free summary the app can show before the learner asks anything,
 * plus suggested questions that point at the real misses. Replaces a per-result
 * "debrief" model call: everything here is already measured.
 */
type Fact = { label: string; value: string };
type Suggestion = { message: string; questionNumber?: number };
type PreviewParts = { facts: Fact[]; suggestions: Suggestion[] };

const spaced = (type: string) => type.replace(/_/g, ' ');

function objectivePreview(digest: any): PreviewParts {
  const facts: Fact[] = [];
  const suggestions: Suggestion[] = [];
  const weakest = digest.weakestTypes?.find((item: any) => item.correct < item.total);
  const first = digest.focusQuestion || digest.misses?.[0];
  if (digest.total) facts.push({ label: 'Correct', value: `${digest.correct}/${digest.total}` });
  if (digest.unanswered) facts.push({ label: 'Unanswered', value: String(digest.unanswered) });
  if (weakest)
    facts.push({
      label: 'Weakest type',
      value: `${spaced(weakest.type)} ${weakest.correct}/${weakest.total}`,
    });
  if (digest.minutesSpent) facts.push({ label: 'Time', value: `${digest.minutesSpent} min` });
  if (first)
    suggestions.push({
      message: `Why was my answer to question ${first.number} wrong?`,
      questionNumber: first.number,
    });
  if (weakest)
    suggestions.push({ message: `How do I get better at ${spaced(weakest.type)} questions?` });
  if ((digest.missesTotal ?? 0) > 1)
    suggestions.push({ message: 'What mistakes do my wrong answers have in common?' });
  return { facts, suggestions };
}

function writingPreview(digest: any): PreviewParts {
  const facts: Fact[] = [];
  const task = digest.tasks?.[0];
  const topPriority = task?.priorities?.[0];
  if (task?.band != null) facts.push({ label: task.task, value: String(task.band) });
  if (topPriority) facts.push({ label: 'Top priority', value: topPriority.criterion });
  const suggestions: Suggestion[] = [
    { message: 'What is the one change that would raise my Writing band most?' },
  ];
  if (task?.corrections?.length)
    suggestions.push({ message: 'Explain the corrections in my Writing feedback.' });
  return { facts, suggestions };
}

function speakingPreview(digest: any): PreviewParts {
  const scored = Object.entries(digest.criteria || {}).filter(
    ([, value]) => value != null
  ) as Array<[string, number]>;
  const lowest = scored.sort((a, b) => a[1] - b[1])[0];
  return {
    facts: lowest ? [{ label: 'Lowest criterion', value: `${lowest[0]} ${lowest[1]}` }] : [],
    suggestions: [{ message: 'What should I practise to improve my Speaking criteria?' }],
  };
}

const PREVIEW_BY_KIND: Record<string, (digest: any) => PreviewParts> = {
  objective: objectivePreview,
  writing: writingPreview,
  speaking: speakingPreview,
};

export function buildSourcePreview(digest: any) {
  if (!digest) return null;
  const moduleName = String(digest.module || '');
  const title = `${moduleName.charAt(0).toUpperCase()}${moduleName.slice(1)} result`;
  const band: Fact[] = digest.band != null ? [{ label: 'Band', value: String(digest.band) }] : [];
  const parts = PREVIEW_BY_KIND[digest.kind]?.(digest) ?? { facts: [], suggestions: [] };
  return {
    title,
    facts: [...band, ...parts.facts].slice(0, 5),
    suggestions: parts.suggestions.slice(0, 3),
  };
}

/** Progressively smaller copies of a digest, for staying inside the prompt token budget. */
export function shrinkSourceDigest(digest: any, level: 1 | 2) {
  if (!digest) return digest;
  const copy = JSON.parse(JSON.stringify(digest));
  if (Array.isArray(copy.misses)) copy.misses = copy.misses.slice(0, level === 1 ? 3 : 0);
  if (Array.isArray(copy.tasks)) {
    copy.tasks = copy.tasks.map((task: any) => ({
      ...task,
      corrections: (task.corrections || []).slice(0, level === 1 ? 2 : 0),
      learnerResponse:
        level === 1 && typeof task.learnerResponse === 'string'
          ? task.learnerResponse.slice(0, 500)
          : undefined,
    }));
  }
  return copy;
}
