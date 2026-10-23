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

function answerText(value: unknown, max = 90): string | null {
  if (value === null || value === undefined) return null;
  const text = Array.isArray(value)
    ? value.map((item) => answerText(item, 40)).join(', ')
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
  const cleaned = clean(text, max);
  return cleaned || null;
}

function optionLabels(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options
    .slice(0, 6)
    .map((option: any) =>
      clean(typeof option === 'string' ? option : (option?.text ?? option?.label ?? ''), 70)
    )
    .filter(Boolean);
}

/** Per-question explanation, which is stored either flat or under `blanks[number]`. */
function explanationFor(row: SourceQuestionRow | undefined, number: number) {
  const data = row?.explanation_data;
  if (!data || typeof data !== 'object') return null;
  const entry =
    data.blanks?.[String(number)] ??
    (Number(row?.question_number) === number || !data.blanks ? data : null);
  if (!entry || typeof entry !== 'object') return null;
  return {
    why: typeof entry.why_correct === 'string' ? entry.why_correct : null,
    trap: typeof entry.trap === 'string' ? entry.trap : null,
    highlight: typeof entry.passage_highlight === 'string' ? entry.passage_highlight : null,
    tempting: typeof entry.tempting_answer === 'string' ? entry.tempting_answer : null,
  };
}

function rowFor(rows: SourceQuestionRow[], number: number) {
  return rows.find((row) => {
    const start = Number(row.question_number);
    const count = Math.max(1, Number(row.question_count) || 1);
    return Number.isFinite(start) && number >= start && number < start + count;
  });
}

function describeQuestion(
  detail: any,
  rows: SourceQuestionRow[],
  limits: { text: number; why: number; highlight: number }
) {
  const number = Number(detail?.questionNumber);
  const row = rowFor(rows, number);
  const explanation = explanationFor(row, number);
  const options = optionLabels(row?.options);
  return {
    number,
    type: clean(detail?.questionType || detail?.type || row?.type || 'unknown', 40),
    ...(row?.question_text || row?.group_instructions
      ? { question: clean(row?.question_text || row?.group_instructions, limits.text) }
      : {}),
    ...(options.length ? { options } : {}),
    yourAnswer: answerText(detail?.userAnswer),
    correctAnswer: answerText(detail?.correctAnswer),
    flagged: detail?.wasFlagged === true,
    ...(explanation?.why ? { whyCorrect: clean(explanation.why, limits.why) } : {}),
    ...(explanation?.trap ? { trap: clean(explanation.trap, 160) } : {}),
    ...(explanation?.tempting ? { temptingAnswer: clean(explanation.tempting, 60) } : {}),
    ...(explanation?.highlight
      ? { passageHighlight: clean(explanation.highlight, limits.highlight) }
      : {}),
    ...(!explanation?.why && row?.explanation
      ? { whyCorrect: clean(row.explanation, limits.why) }
      : {}),
  };
}

function objectiveDigest(session: any, rows: SourceQuestionRow[], focusQuestion: number | null) {
  const content = session.content_data || {};
  const details: any[] = Array.isArray(content.responseDetails) ? content.responseDetails : [];
  const typeStats = Object.entries(content.typeStats || {})
    .map(([type, stat]: [string, any]) => ({
      type: clean(type, 40),
      correct: finite(stat?.correct) ?? 0,
      total: finite(stat?.total) ?? 0,
    }))
    .filter((stat) => stat.total > 0)
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total)
    .slice(0, 8);

  const wrong = details.filter((detail) => detail?.isCorrect === false);
  const unanswered = wrong.filter((detail) => answerText(detail?.userAnswer) === null).length;
  const focusDetail =
    focusQuestion == null
      ? null
      : details.find((detail) => Number(detail?.questionNumber) === focusQuestion) || null;
  const missLimit = focusDetail ? MAX_MISSES_WITH_FOCUS : MAX_MISSES;
  const misses = wrong
    .filter((detail) => detail !== focusDetail)
    .sort((a, b) => Number(a.questionNumber) - Number(b.questionNumber))
    .slice(0, missLimit)
    .map((detail) => describeQuestion(detail, rows, { text: 200, why: 220, highlight: 180 }));

  // Older results saved only the raw answers, keyed by question id, with no grading detail.
  // Say so rather than reporting "0 wrong" for a result that plainly had mistakes.
  const detailAvailable = details.length > 0;
  const totalQuestions =
    finite(content.totalQuestions) ?? (detailAvailable ? details.length : null);
  const correctAnswers =
    finite(content.correctAnswers) ??
    (detailAvailable ? details.filter((d) => d?.isCorrect).length : null);
  const seconds = finite(content.timeMetrics?.totalTimeSpent ?? session.actual_duration_seconds);
  return {
    kind: 'objective' as const,
    module: clean(session.test_type, 20).toLowerCase(),
    mode: clean(session.test_mode || 'practice', 20),
    band: finite(session.score ?? session.band_score),
    correct: correctAnswers,
    total: totalQuestions,
    unanswered,
    minutesSpent: seconds == null ? null : Math.round(seconds / 60),
    changedAnswers: finite(content.changedAnswersCount),
    weakestTypes: typeStats,
    detailAvailable,
    ...(detailAvailable
      ? {}
      : {
          note: 'Per-question detail was not saved for this older result, so individual mistakes are unknown.',
        }),
    missesTotal: detailAvailable ? wrong.length : null,
    misses,
    ...(focusDetail
      ? {
          focusQuestion: describeQuestion(focusDetail, rows, {
            text: 420,
            why: 420,
            highlight: 360,
          }),
        }
      : focusQuestion != null
        ? {
            focusQuestionNote: `Question ${focusQuestion} is not on record for this result.`,
          }
        : {}),
  };
}

function writingDigest(session: any) {
  const content = session.content_data || {};
  const feedbacks =
    content.ai_feedbacks && typeof content.ai_feedbacks === 'object' ? content.ai_feedbacks : {};
  const response = Array.isArray(session.user_responses) ? session.user_responses[0] : null;
  const tasks = (['Task 1', 'Task 2'] as const)
    .map((task) => {
      const feedback = feedbacks[task];
      if (!feedback || typeof feedback !== 'object') return null;
      const text = task === 'Task 1' ? response?.task1_response : response?.task2_response;
      const notes =
        feedback.criterionNotes && typeof feedback.criterionNotes === 'object'
          ? Object.fromEntries(
              Object.entries(feedback.criterionNotes)
                .slice(0, 4)
                .map(([key, note]) => [clean(key, 40), clean(note, 160)])
            )
          : undefined;
      return {
        task,
        band: finite(feedback.overallBand ?? feedback.overall_band ?? feedback.band_score),
        criteria:
          feedback.criteriaScores && typeof feedback.criteriaScores === 'object'
            ? Object.fromEntries(
                Object.entries(feedback.criteriaScores)
                  .slice(0, 4)
                  .map(([key, value]) => [clean(key, 40), finite(value)])
              )
            : undefined,
        notes,
        strengths: (Array.isArray(feedback.strengths) ? feedback.strengths : [])
          .slice(0, 3)
          .map((item: unknown) => clean(item, 120)),
        priorities: (Array.isArray(feedback.priorities) ? feedback.priorities : [])
          .slice(0, 3)
          .map((item: any) => ({
            criterion: clean(item?.criterion, 40),
            issue: clean(item?.issue, 150),
            action: clean(item?.action, 170),
          })),
        corrections: (Array.isArray(feedback.corrections) ? feedback.corrections : [])
          .slice(0, 4)
          .map((item: any) => ({
            original: clean(item?.original, 100),
            correction: clean(item?.correction, 100),
            why: clean(item?.explanation, 120),
          })),
        learnerResponse: typeof text === 'string' ? clean(text, 1_100) : undefined,
      };
    })
    .filter(Boolean);
  return {
    kind: 'writing' as const,
    module: 'writing',
    mode: clean(session.test_mode || 'practice', 20),
    band: finite(session.score ?? session.band_score),
    tasks,
  };
}

function speakingDigest(session: any) {
  const content = session.content_data || {};
  const evaluation =
    content.finalEvaluation && typeof content.finalEvaluation === 'object'
      ? content.finalEvaluation
      : {};
  const parts =
    evaluation.partScores && typeof evaluation.partScores === 'object' ? evaluation.partScores : {};
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
    notes:
      evaluation.criterionNotes && typeof evaluation.criterionNotes === 'object'
        ? Object.fromEntries(
            Object.entries(evaluation.criterionNotes)
              .slice(0, 4)
              .map(([key, note]) => [clean(key, 40), clean(note, 180)])
          )
        : undefined,
    parts: Object.fromEntries(
      Object.entries(parts)
        .slice(0, 3)
        .map(([key, part]: [string, any]) => [
          clean(key, 10),
          { band: finite(part?.band), observation: clean(part?.keyObservation, 200) },
        ])
    ),
    strengths: (Array.isArray(evaluation.strengths) ? evaluation.strengths : [])
      .slice(0, 3)
      .map((item: unknown) => clean(item, 120)),
    improvements: (Array.isArray(evaluation.improvements) ? evaluation.improvements : [])
      .slice(0, 3)
      .map((item: any) => ({ area: clean(item?.area, 60), tip: clean(item?.tip, 170) })),
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
export function buildSourcePreview(digest: any) {
  if (!digest) return null;
  const facts: Array<{ label: string; value: string }> = [];
  const suggestions: Array<{ message: string; questionNumber?: number }> = [];
  const moduleName = String(digest.module || '');
  const title = `${moduleName.charAt(0).toUpperCase()}${moduleName.slice(1)} result`;

  if (digest.band != null) facts.push({ label: 'Band', value: String(digest.band) });
  if (digest.kind === 'objective') {
    if (digest.total) facts.push({ label: 'Correct', value: `${digest.correct}/${digest.total}` });
    if (digest.unanswered) facts.push({ label: 'Unanswered', value: String(digest.unanswered) });
    const weakest = digest.weakestTypes?.find((item: any) => item.correct < item.total);
    if (weakest)
      facts.push({
        label: 'Weakest type',
        value: `${weakest.type.replace(/_/g, ' ')} ${weakest.correct}/${weakest.total}`,
      });
    if (digest.minutesSpent) facts.push({ label: 'Time', value: `${digest.minutesSpent} min` });
    const first = digest.focusQuestion || digest.misses?.[0];
    if (first)
      suggestions.push({
        message: `Why was my answer to question ${first.number} wrong?`,
        questionNumber: first.number,
      });
    if (weakest)
      suggestions.push({
        message: `How do I get better at ${weakest.type.replace(/_/g, ' ')} questions?`,
      });
    if ((digest.missesTotal ?? 0) > 1)
      suggestions.push({ message: 'What mistakes do my wrong answers have in common?' });
  } else if (digest.kind === 'writing') {
    const task = digest.tasks?.[0];
    const weakest = task?.priorities?.[0];
    if (task?.band != null) facts.push({ label: task.task, value: String(task.band) });
    if (weakest) facts.push({ label: 'Top priority', value: weakest.criterion });
    suggestions.push({ message: 'What is the one change that would raise my Writing band most?' });
    if (task?.corrections?.length)
      suggestions.push({ message: 'Explain the corrections in my Writing feedback.' });
  } else if (digest.kind === 'speaking') {
    const entries = Object.entries(digest.criteria || {}).filter(([, v]) => v != null) as Array<
      [string, number]
    >;
    entries.sort((a, b) => a[1] - b[1]);
    if (entries[0])
      facts.push({ label: 'Lowest criterion', value: `${entries[0][0]} ${entries[0][1]}` });
    suggestions.push({ message: 'What should I practise to improve my Speaking criteria?' });
  }
  return { title, facts: facts.slice(0, 5), suggestions: suggestions.slice(0, 3) };
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
