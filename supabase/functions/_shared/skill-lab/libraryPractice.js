import { calculateTestResults } from '../objective-scoring/reading.js';
import { calculateListeningTestResults } from '../objective-scoring/listening.js';
import { computeQuestionNumbers } from '../objective-scoring/questionProcessing.js';
import { PRACTICE_LISTENING_KEEP, withoutSolutions } from '../objective-scoring/paired.js';

const SUPPORTED_MODULES = new Set(['reading', 'listening']);

function resolveReadingMatchingType(instructions) {
  if (/list of headings|correct heading|suitable heading/i.test(instructions)) {
    return 'matching_headings';
  }
  if (/which (?:paragraph|section) contains|match.*information.*paragraph/i.test(instructions)) {
    return 'matching_information';
  }
  return 'matching_features';
}

function resolveQuestionType(module, question) {
  const { type, matching_features } = question;
  if (type === 'matching_features' && matching_features?.mode === 'paragraph') {
    return 'summary_completion';
  }
  if (module === 'reading' && type === 'matching_features') {
    const instructions = `${question.group_instructions || ''} ${matching_features?.box_title || ''}`;
    return resolveReadingMatchingType(instructions);
  }
  return type;
}

// Keep pedagogically different matching tasks separate even in legacy storage.
export function questionFocus(module, question) {
  if (!SUPPORTED_MODULES.has(module)) return null;
  const type = resolveQuestionType(module, question);
  if (!type || type === 'static_text') return null;
  return `${module}:${type}`;
}

function listeningGapCategory(question) {
  const instructions = `${question.group_instructions || ''} ${question.mcq_title || ''}`;
  const match = /(?:complet|fill).{0,18}\b(notes?|forms?|sentences?|summar(?:y|ies))\b/i.exec(
    instructions
  );
  if (!match) return 'listening:gap_fill';
  const noun = match[1].toLowerCase().replace(/ies$/, 'y').replace(/s$/, '');
  return `listening:${noun}_completion`;
}

export function libraryGroupCategory(focus, questions = []) {
  if (!questions?.length) return focus;
  if (focus === 'listening:gap_fill') return listeningGapCategory(questions[0]);
  if (focus === 'listening:multiple_choice' && questions.every((q) => q.allow_multiple)) {
    return 'listening:multiple_choice_multiple';
  }
  return focus;
}

function computeGroupResults(module, questions, answers) {
  if (module === 'reading') {
    return calculateTestResults(questions, answers);
  }
  return calculateListeningTestResults(computeQuestionNumbers(questions), answers);
}

export function scoreLibraryGroup(module, questions, answers) {
  if (!SUPPORTED_MODULES.has(module)) throw new Error('Unsupported subject');
  const result = computeGroupResults(module, questions, answers);
  // A short group is not an IELTS band estimate.
  return {
    correct: result.correctAnswers,
    total: result.totalQuestions,
    responses: result.responseDetails,
    answers: result.correctAnswersMap || result.answersMap,
  };
}

function formatBlanksExplanation(blanks = {}) {
  return Object.entries(blanks)
    .filter(([, value]) => typeof value?.why_correct === 'string')
    .map(([number, value]) => `Question ${number}: ${value.why_correct}`)
    .join('\n\n');
}

export function savedLibraryExplanations(questions) {
  return questions.map((q) => ({
    id: q.id,
    text: q.explanation || formatBlanksExplanation(q.explanation_data?.blanks),
  }));
}

function extractNestedQuestions(question) {
  return (
    question.questions ||
    question.matching_features?.questions ||
    question.matching_data?.questions ||
    null
  );
}

function resolvePromptNumber(item, baseNumber, index) {
  const explicit = item.question_number ?? item.questionNumber ?? item.number;
  return explicit != null ? explicit : baseNumber + index;
}

function resolvePromptText(item, fallbackText) {
  return item.question_text || item.text || item.label || fallbackText || '';
}

function tutorQuestionPrompts(question) {
  const nested = extractNestedQuestions(question);
  if (Array.isArray(nested) && nested.length) {
    const baseNumber = Number(question.question_number || 1);
    return nested.map((item, index) => ({
      number: resolvePromptNumber(item, baseNumber, index),
      text: resolvePromptText(item, question.question_text),
    }));
  }
  return [
    {
      number: question.question_number,
      text: question.question_text || question.text || '',
    },
  ];
}

function tutorExplanationMap(text) {
  const source = String(text || '').trim();
  const matches = [
    ...source.matchAll(
      /(?:^|\n+)\s*Question\s+(\d+)\s*:\s*([\s\S]*?)(?=(?:\n+\s*Question\s+\d+\s*:)|$)/gi
    ),
  ];
  return new Map(matches.map((match) => [Number(match[1]), match[2].trim()]));
}

function tutorAnswerText(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(' / ');
  return value == null || String(value).trim() === '' ? 'Not answered' : String(value).trim();
}

function buildAnswerReviewItem({
  answer,
  question,
  prompts,
  explanationMap,
  explanationText,
  singleAnswer,
}) {
  const questionNumber = Number(answer.questionNumber ?? question.question_number);
  const prompt =
    prompts.find((item) => Number(item.number) === questionNumber)?.text ||
    question.question_text ||
    '';
  const verifiedExplanation =
    explanationMap.get(questionNumber) || (singleAnswer ? explanationText : '');

  return {
    question_number: questionNumber,
    question: String(prompt).slice(0, 400),
    student_answer: tutorAnswerText(answer.userAnswer),
    correct_answer: tutorAnswerText(answer.correctAnswer),
    is_correct: Boolean(answer.isCorrect),
    verified_explanation: String(verifiedExplanation).slice(0, 700),
  };
}

function extractQuestionAnswerReview(question, answersMap, explanations) {
  const answerEntries = Object.entries(answersMap).filter(
    ([id]) => id === question.id || id.startsWith(`${question.id}_`)
  );
  const prompts = tutorQuestionPrompts(question);
  const explanationText = explanations.find((item) => item.id === question.id)?.text || '';
  const explanationMap = tutorExplanationMap(explanationText);
  const singleAnswer = answerEntries.length === 1;

  return answerEntries.map(([, answer]) =>
    buildAnswerReviewItem({
      answer,
      question,
      prompts,
      explanationMap,
      explanationText,
      singleAnswer,
    })
  );
}

function findFirstProp(objList, prop, fallback = null) {
  for (const obj of objList) {
    if (obj && obj[prop] != null) return obj[prop];
  }
  return fallback;
}

function extractReviewSource(session, review) {
  const targets = [review?.source, review, session?.source];
  return {
    title: findFirstProp(targets, 'title', ''),
    section: findFirstProp(targets, 'section', null),
  };
}

function formatProgressHistory(previousProgress) {
  return (Array.isArray(previousProgress) ? previousProgress : []).slice(0, 5).map((item) => ({
    completed_at: item.completed_at,
    correct: item.correct,
    total: item.total,
    familiarity: item.familiarity,
    next_review_at: item.next_review_at,
  }));
}

function resolveReviewSession(session) {
  if (session?.completed_at && session?.result) return session;
  return session?.mistake || null;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Keep the AI prompt useful even when a source passage is large. The teacher
 * receives only server-verified answer review data, short source metadata and
 * relevant progress. The full passage and hidden independent answer keys are
 * deliberately excluded.
 */
export function buildLibraryTutorContext(session, previousProgress = []) {
  const review = resolveReviewSession(session);
  const questions = ensureArray(review?.questions);
  const explanations = ensureArray(review?.explanations);
  const answersMap = review?.result?.answers || {};
  const focus = session?.focus;

  const answerReview = questions.flatMap((q) =>
    extractQuestionAnswerReview(q, answersMap, explanations)
  );

  return {
    focus,
    stage: session?.stage,
    source: extractReviewSource(session, review),
    teaching_tips: practiceTips(focus).slice(0, 3),
    answer_review: answerReview.slice(0, 8),
    previous_progress: formatProgressHistory(previousProgress),
  };
}

// Fail closed: unknown nested fields never cross the independent-practice boundary.
// Renderers may receive only these content fields; keys are retained in private snapshots.
const publicFields = new Set([
  'id',
  'passage_id',
  'question_text',
  'type',
  'options',
  'section',
  'part_number',
  'question_number',
  'question_count',
  'group_instructions',
  'allow_multiple',
  'mcq_title',
  'matching_data',
  'matching_features',
  'table_data',
  'gap_fill',
  'flowchart',
  'map_labeling',
  'static_text',
  'paragraphs',
  'label',
  'text',
  'title',
  'headings',
  'questions',
  'mode',
  'style',
  'box_title',
  'questions_title',
  'content',
  'rows',
  'headers',
  'blanks',
  'blank_positions',
  'blankNumber',
  'row',
  'col',
  'steps',
  'gap_numbers',
  'nodes',
  'edges',
  'image_url',
  'image',
  'number',
  'content_items',
  '_displayStartNumber',
  '_displaySize',
  '_displayEndNumber',
  'questionNumber',
  'value',
  'answer_mode',
  'structured_text',
  'gap_count',
  'table_rows',
  'table_headers',
  'blanks_count',
]);

export function publicPracticeContent(value) {
  if (Array.isArray(value)) return value.map(publicPracticeContent);
  if (typeof value === 'string') return value.replace(/\[\/?answer\b[^\]]*\]/gi, '');
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => publicFields.has(key))
      .map(([key, child]) => [key, publicPracticeContent(child)])
  );
}

const INVALID_TITLE_PATTERN =
  /^(?:(?:reading\s+)?passage(?:\s+\d+)?|part\s*(?:\d+|[ivx]+)|[A-G])$/i;

function cleanPassageTitle(value) {
  if (typeof value !== 'string') return null;
  const title = value
    .replace(/\\n/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*[*_]+|[*_]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!title || INVALID_TITLE_PATTERN.test(title)) return null;
  return title;
}

function findExplicitTitle(section) {
  const explicit = [
    section?.passage_name,
    section?.passageName,
    section?.passage_title,
    section?.passageTitle,
    section?.title,
  ];
  for (const value of explicit) {
    const title = cleanPassageTitle(value);
    if (title) return title;
  }
  return null;
}

const TITLE_PATTERNS = [
  /^\s*\[center\]\s*([\s\S]*?)\s*\[\/center\]/i,
  /^\s*<h[1-6][^>]*>\s*([\s\S]*?)\s*<\/h[1-6]>/i,
  /^\s*\[(?:heading|title)\]\s*([\s\S]*?)\s*\[\/(?:heading|title)\]/i,
];

function findMarkedTitle(source) {
  for (const pattern of TITLE_PATTERNS) {
    const match = source.match(pattern)?.[1];
    const title = cleanPassageTitle(match);
    if (title) return title;
  }
  return null;
}

function findBoldTitle(source) {
  const firstLine = source.split(/\n+/).find((line) => line.trim());
  if (/^\s*\*\*[^*]+\*\*\s*$/.test(firstLine || '')) {
    return cleanPassageTitle(firstLine.replace(/^\s*\*\*|\*\*\s*$/g, ''));
  }
  return null;
}

/**
 * Passage titles live in the section object for library tests. Older records
 * sometimes omit that field but include the title in the first centred or
 * heading line of the original passage, so use that only as a fallback.
 */
export function derivePassageTitle(section, content) {
  const explicitTitle = findExplicitTitle(section);
  if (explicitTitle) return explicitTitle;

  const source = String(content || '')
    .replace(/\\n/g, '\n')
    .trim();

  return findMarkedTitle(source) || findBoldTitle(source) || null;
}

function parseSectionContent(content, sectionNumber) {
  let sections;
  try {
    sections = typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    /* Original plain passage. */
  }
  if (!Array.isArray(sections)) {
    return { section: null, content: content || '' };
  }
  const section = sections.find((s, i) => Number(s.section_number || i + 1) === sectionNumber);
  return { section, content: section?.content || '' };
}

function resolveAudioScope(audio, sectionAudio) {
  if (!audio) return null;
  return sectionAudio ? 'section' : 'full_test';
}

function resolveAudioDuration(section, passage, audio) {
  if (section?.duration_minutes) return section.duration_minutes;
  if (audio && audio === passage.audio_url) return passage.duration_minutes;
  return null;
}

function resolveListeningAudio(passage, section) {
  if (passage.test_type !== 'listening') return { audio: null, audioScope: null, duration: null };
  const sectionAudio = section?.audio_url || section?.audioUrl || null;
  const audio = sectionAudio || passage.audio_url || null;
  return {
    audio,
    audioScope: resolveAudioScope(audio, sectionAudio),
    duration: resolveAudioDuration(section, passage, audio),
  };
}

function resolveReadingContent(passage, content) {
  if (passage.test_type !== 'reading' || typeof content !== 'string') return '';
  return publicPracticeContent(content).replace(/\\n/g, '\n');
}

/**
 * The audioscript of one Listening part, as practice mode on the test page shows
 * it: answer marks are stripped and answer evidence is never included. It stays
 * out of the stored snapshot, whose hash decides whether a set is new.
 */
export function libraryListeningScript(passage, sectionNumber) {
  const { section } = parseSectionContent(passage.content, Number(sectionNumber || 1));
  return withoutSolutions(
    { srt_content: section?.srt_content || '', transcript: section?.transcript || '' },
    PRACTICE_LISTENING_KEEP
  );
}

// Keep only the original section needed by this group. Never serialize embedded
// question groups (which contain answer keys) as passage text.
export function libraryGroupSource(passage, questions) {
  const sectionNumber = Number(questions[0]?.section || questions[0]?.part_number || 1);
  const { section, content } = parseSectionContent(passage.content, sectionNumber);
  const { audio, audioScope, duration } = resolveListeningAudio(passage, section);

  return {
    id: passage.id,
    title: passage.title,
    passage_title: derivePassageTitle(section, content),
    section: sectionNumber,
    content: resolveReadingContent(passage, content),
    audio_url: audio,
    audio_scope: audioScope,
    duration_minutes: duration,
  };
}

const SUPPORTED_READING_TYPES = new Set([
  'matching_headings',
  'matching_features',
  'matching',
  'multiple_choice',
  'true_false_not_given',
  'yes_no_not_given',
  'notes_completion',
  'short_answer',
  'table_completion',
  'flowchart',
]);

const SUPPORTED_LISTENING_TYPES = new Set([
  'matching_features',
  'multiple_choice',
  'gap_fill',
  'map_labeling',
  'table_completion',
  'flowchart',
]);

const STRUCTURED_PRACTICE_TYPES = new Set([
  'gap_fill',
  'map_labeling',
  'notes_completion',
  'table_completion',
  'flowchart',
]);

const REQUIRED_PRACTICE_CONTENT = {
  gap_fill: (q) => q.gap_fill?.text || q.gap_fill?.content,
  map_labeling: (q) => q.map_labeling?.image_url && q.map_labeling?.questions?.length,
  table_completion: (q) => q.table_data?.rows?.length || q.table_data?.table_rows?.length,
  flowchart: (q) => q.flowchart?.steps?.length,
  notes_completion: (q) => q.gap_fill?.structured_text,
  short_answer: (q) => q.question_text?.trim(),
};

function canRenderPracticeQuestion(module, question) {
  if (!isQuestionTypeSupported(module, question.type)) return false;
  const requiredContent = REQUIRED_PRACTICE_CONTENT[question.type];
  return !requiredContent || Boolean(requiredContent(question));
}

function isQuestionTypeSupported(testType, type) {
  return testType === 'reading'
    ? SUPPORTED_READING_TYPES.has(type)
    : SUPPORTED_LISTENING_TYPES.has(type);
}

function questionSection(question) {
  return question.section || question.part_number || 1;
}

// Importers disagree on `mcq_title`: some put it on the first question of a set
// only, some repeat it on every question, some leave an empty string. A set
// therefore runs until the heading CHANGES, and a blank heading is no heading.
// Instructions often continue with the question text after the first line
// ("Choose TWO letters, A-E.\nWhich TWO ..."), so only the first line identifies
// the task. Keep this in step with the `titled` CTEs in the dashboard-groups SQL.
function instructionKey(testType, question) {
  const text = String(question.group_instructions || '')
    .replace(/\\n/g, '\n')
    .trim();
  // Reading sets open with a "Questions 1-5" range line, so they keep the full text.
  return testType === 'listening' ? text.split('\n')[0].trim() : text;
}

function orderedPassageQuestions(passage, questions) {
  return questions
    .filter((question) => question.passage_id === passage.id)
    .sort(
      (a, b) =>
        Number(questionSection(a)) - Number(questionSection(b)) ||
        (a.question_number || 0) - (b.question_number || 0)
    );
}

// Returns the run number a question belongs to, advancing it when the heading changes.
function headingRun(headings, scope, rawHeading) {
  const heading = String(rawHeading || '').trim();
  const state = headings.get(scope) || { title: '', run: 0 };
  if (heading && heading !== state.title) {
    state.title = heading;
    state.run += 1;
  }
  headings.set(scope, state);
  return state.run;
}

function groupQuestionsByBucket(passage, questions) {
  const buckets = new Map();
  const headings = new Map();
  for (const question of orderedPassageQuestions(passage, questions)) {
    const focus = questionFocus(passage.test_type, question);
    if (!focus) continue;
    // The imported block already represents a complete task, with its own numbered inputs.
    const instructions = STRUCTURED_PRACTICE_TYPES.has(question.type)
      ? question.id
      : instructionKey(passage.test_type, question);
    const scope = [questionSection(question), focus, instructions];
    const key = `${scope.join('|')}|${headingRun(headings, scope.join('|'), question.mcq_title)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(question);
  }
  return buckets;
}

function hasCompleteAnswerKeys(keys) {
  return (
    keys.length > 0 &&
    keys.every(
      (k) =>
        k.correctAnswer != null && String(k.correctAnswer).trim() !== '' && k.correctAnswer !== '—'
    )
  );
}

function resolveGroupExclusion(hasContext, hasKeys, supported) {
  if (!hasContext) return 'Missing original passage or audio';
  if (!hasKeys) return 'Incomplete answer key';
  if (!supported) return 'Question display requires validation';
  return null;
}

function determineGroupEligibility(passage, source, keys, rows) {
  const hasContext =
    passage.test_type === 'reading' ? Boolean(source.content.trim()) : Boolean(source.audio_url);
  const hasKeys = hasCompleteAnswerKeys(keys);
  const supported = rows.every((q) => canRenderPracticeQuestion(passage.test_type, q));
  const eligible = hasContext && hasKeys && supported;
  const exclusion = resolveGroupExclusion(hasContext, hasKeys, supported);

  return { eligible, exclusion };
}

export function buildLibraryGroups(passage, questions) {
  if (!passage?.is_active || !SUPPORTED_MODULES.has(passage.test_type)) return [];
  const buckets = groupQuestionsByBucket(passage, questions);

  return [...buckets.values()].map((rows) => {
    rows.sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
    const score = scoreLibraryGroup(passage.test_type, rows, {});
    const keys = Object.values(score.answers || {});
    const source = libraryGroupSource(passage, rows);
    const { eligible, exclusion } = determineGroupEligibility(passage, source, keys, rows);
    const focus = questionFocus(passage.test_type, rows[0]);

    return {
      id: `${passage.id}:${rows[0].id}`,
      sourceId: passage.id,
      title: passage.title,
      focus,
      category: libraryGroupCategory(focus, rows),
      accessTier: passage.access_tier,
      questions: rows,
      source,
      total: score.total,
      eligible,
      exclusion,
    };
  });
}

export function publicLibraryQuestions(module, questions = []) {
  return (questions || []).map((question) => {
    const safe = publicPracticeContent(question);
    if (!STRUCTURED_PRACTICE_TYPES.has(question.type) && question.type !== 'short_answer')
      return safe;
    const base = Number(question.question_number) || 1;
    const items = Object.entries(scoreLibraryGroup(module, [question], {}).answers);
    return {
      ...safe,
      _displayStartNumber: base,
      practice_items: items.map(([id, item]) => ({
        id,
        number:
          module === 'listening' && question.type !== 'map_labeling'
            ? base + Number(item.questionNumber) - 1
            : item.questionNumber,
      })),
    };
  });
}

function isValidAttempt(a) {
  return Boolean(a.focus && a.sessionId && a.groupId);
}

function isValidResponse(r) {
  return Boolean(r.questionId && typeof r.isCorrect === 'boolean');
}

const BLANK_ANSWERS = new Set(['', '(not selected)']);

// A test score rightly marks a blank as wrong. Practice advice must not: the
// learner never tried it, so it says nothing about what they find hard.
function isAnswered(response) {
  if (response.isCorrect === true || !('userAnswer' in response)) return true;
  return !BLANK_ANSWERS.has(String(response.userAnswer ?? '').trim());
}

const answeredResponses = (row) => (row.responses || []).filter(isAnswered);

const questionKey = (row, response) => `${row.sourceId}:${response.questionId}`;

/** Marks what each practice attempt had already shown the learner before it. */
function markPriorExposure(attempts) {
  const answeredBefore = new Set();
  const finishedSets = new Set();
  return [...attempts]
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
    .map((row) => {
      // A finished set reveals every answer, including those left blank.
      const wholeSet = Boolean(row.practice) && finishedSets.has(row.groupId);
      const given = answeredResponses(row);
      const repeats = row.practice
        ? given.filter((r) => wholeSet || answeredBefore.has(questionKey(row, r)))
        : [];
      given.forEach((r) => answeredBefore.add(questionKey(row, r)));
      if (row.practice) finishedSets.add(row.groupId);
      return { ...row, seen: new Set(repeats.map((r) => r.questionId)) };
    });
}

const countableResponses = (row) =>
  answeredResponses(row).filter((r) => isValidResponse(r) && !row.seen.has(r.questionId));

function processAttemptResponses(row, seen, state) {
  for (const answer of countableResponses(row)) {
    const key = questionKey(row, answer);
    if (seen.has(key)) continue;
    seen.add(key);
    state.counted.add(row);
    state.total++;
    if (answer.isCorrect) {
      state.correct++;
    } else {
      state.errorGroups.add(row.groupId);
      state.errorSessions.add(row.sessionId);
      state.mistakes.push({
        sessionId: row.sessionId,
        practice: Boolean(row.practice),
        groupId: row.groupId,
        sourceId: row.sourceId,
        questionId: answer.questionId,
        completedAt: row.completedAt,
      });
    }
  }
}

function filterEligibleAttemptRows(rows) {
  return rows.filter((row) => !row.assisted && countableResponses(row).length > 0).slice(0, 5);
}

function isRepeatedDifficulty(state, accuracy) {
  return (
    state.errorGroups.size >= 2 &&
    state.errorSessions.size >= 2 &&
    state.total >= 5 &&
    accuracy < 0.7
  );
}

function aggregateFocusPerformance(rows) {
  const seen = new Set();
  const state = {
    correct: 0,
    total: 0,
    errorGroups: new Set(),
    errorSessions: new Set(),
    mistakes: [],
    counted: new Set(),
  };

  const eligibleRows = filterEligibleAttemptRows(rows);
  for (const row of eligibleRows) {
    processAttemptResponses(row, seen, state);
  }

  const accuracy = state.total ? state.correct / state.total : null;
  const repeatedDifficulty = isRepeatedDifficulty(state, accuracy);

  return {
    correct: state.correct,
    total: state.total,
    accuracy,
    mistakes: state.mistakes,
    repeatedDifficulty,
    counted: state.counted,
  };
}

/** Why a result is or is not behind the suggestion. */
function resolveRowStatus(row, counted) {
  if (counted.has(row)) return 'counted';
  if (!answeredResponses(row).length) return 'blank';
  if (row.assisted) return 'assisted';
  if (row.seen.size && !countableResponses(row).length) return 'repeat';
  return 'older';
}

function summariseRow(row, counted) {
  const responses = row.responses || [];
  const total = row.total ?? responses.length;
  return {
    row,
    total,
    correct: row.correct ?? responses.filter((r) => r.isCorrect === true).length,
    answered: Math.min(answeredResponses(row).length, total),
    status: resolveRowStatus(row, counted),
  };
}

/** One entry per sitting: a full test often holds several sets of the same type. */
function recentSittings(rows, counted) {
  const sittings = new Map();
  for (const part of rows.map((row) => summariseRow(row, counted))) {
    const sitting = sittings.get(part.row.sessionId);
    if (!sitting) {
      sittings.set(part.row.sessionId, part);
      continue;
    }
    sitting.total += part.total;
    sitting.correct += part.correct;
    sitting.answered += part.answered;
    if (part.status === 'counted') sitting.status = 'counted';
  }
  return [...sittings.values()].slice(0, 5);
}

// Only the latest real attempt decides: practising again is the review.
function isDueForReview(rows, nowTime) {
  const latest = rows.find((row) => answeredResponses(row).length);
  return Boolean(latest?.nextReviewAt) && Date.parse(latest.nextReviewAt) <= nowTime;
}

function resolveAttemptKind(a) {
  if (!a.practice) return 'Full test';
  if (a.repeated) return 'Repeated questions';
  if (a.assisted) return 'With help';
  if (a.familiar) return 'Familiar passage or audio';
  return 'New questions';
}

function resolveNeedLabel(repeatedDifficulty, mistakesCount) {
  if (repeatedDifficulty) return 'A repeated difficulty';
  if (mistakesCount > 0) return 'Worth practising';
  return 'Keep practising';
}

function resolveNeedPriority(repeatedDifficulty, due, mistakesCount) {
  if (repeatedDifficulty) return 0;
  if (due) return 1;
  if (mistakesCount > 0) return 2;
  return 3;
}

function comparePracticeNeeds(a, b) {
  return (
    a.priority - b.priority ||
    (a.accuracy ?? 1) - (b.accuracy ?? 1) ||
    Date.parse(b.latestAt) - Date.parse(a.latestAt) ||
    a.focus.localeCompare(b.focus)
  );
}

function isAttemptWithinWindow(attempt, cutoff, nowTime) {
  const ts = Date.parse(attempt.completedAt);
  return Boolean(attempt.completedAt && Number.isFinite(ts) && ts >= cutoff && ts <= nowTime);
}

function groupAttemptsByFocus(attempts, cutoff, nowTime) {
  const byFocus = new Map();
  const ordered = attempts
    .filter((a) => isAttemptWithinWindow(a, cutoff, nowTime))
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));

  for (const attempt of ordered) {
    if (!isValidAttempt(attempt)) continue;
    if (!byFocus.has(attempt.focus)) byFocus.set(attempt.focus, []);
    const rows = byFocus.get(attempt.focus);
    const isDuplicate = rows.some(
      (a) => a.sessionId === attempt.sessionId && a.groupId === attempt.groupId
    );
    if (!isDuplicate) rows.push(attempt);
  }
  return byFocus;
}

/** The mistake to revisit. Never one whose passage or audio is about to be practised. */
export function pickPracticeMistake(mistakes, sourceId, sessionId) {
  return mistakes?.find(
    (mistake) => mistake.sourceId !== sourceId && (!sessionId || mistake.sessionId === sessionId)
  );
}

export function rankPracticeNeeds(attempts, now = new Date()) {
  const nowTime = now.getTime();
  const cutoff = nowTime - 90 * 86400000;
  // A test group nobody answered is not something the learner did.
  const tried = markPriorExposure(attempts).filter(
    (row) => row.practice || answeredResponses(row).length
  );
  const byFocus = groupAttemptsByFocus(tried, cutoff, nowTime);

  return [...byFocus.entries()]
    .map(([focus, rows]) => {
      const stats = aggregateFocusPerformance(rows);
      const due = isDueForReview(rows, nowTime);
      const sittings = recentSittings(rows, stats.counted);
      const label = resolveNeedLabel(stats.repeatedDifficulty, stats.mistakes.length);
      const priority = resolveNeedPriority(stats.repeatedDifficulty, due, stats.mistakes.length);

      return {
        focus,
        correct: stats.correct,
        total: stats.total,
        accuracy: stats.accuracy,
        mistakes: stats.mistakes,
        repeatedDifficulty: stats.repeatedDifficulty,
        due,
        label,
        priority,
        latestAt: rows[0].completedAt,
        sources: sittings.map(({ row }) => ({
          sessionId: row.sessionId,
          sourceId: row.sourceId,
          title: row.title,
          completedAt: row.completedAt,
          practice: Boolean(row.practice),
        })),
        history: sittings.map(({ row, correct, total, answered, status }) => ({
          correct,
          total,
          answered,
          status,
          completedAt: row.completedAt,
          kind: resolveAttemptKind(row),
        })),
      };
    })
    .sort(comparePracticeNeeds);
}

const FAMILIARITY_RANKS = { new: 0, familiar: 1, repeated: 2 };

function compareFamiliarity(a, b) {
  return (
    FAMILIARITY_RANKS[a.familiarity] - FAMILIARITY_RANKS[b.familiarity] || a.id.localeCompare(b.id)
  );
}

function resolveFamiliarity(id, sourceId, seenGroups, seenSources) {
  if (seenGroups.has(id)) return 'repeated';
  if (seenSources.has(sourceId)) return 'familiar';
  return 'new';
}

export function chooseLibraryGroups(groups, exposures, focus) {
  const seenGroups = new Set(exposures.map((e) => e.groupId));
  const seenSources = new Set(exposures.map((e) => e.sourceId));
  return groups
    .filter((g) => g.focus === focus && g.eligible)
    .map((g) => ({
      ...g,
      familiarity: resolveFamiliarity(g.id, g.sourceId, seenGroups, seenSources),
    }))
    .sort(compareFamiliarity);
}

const GENERAL_TIPS = [
  'Read the instructions and any answer limits carefully.',
  'Find or listen for the meaning, rather than just a repeated word.',
  'Check your answer against the original passage or audio.',
];

const TIPS_BY_TYPE = {
  note_completion: ['Use the note headings to predict what each missing word describes.'],
  notes_completion: ['Use the note headings to predict what each missing word describes.'],
  form_completion: [
    'Decide if each field needs a name, number, date, or other detail before listening.',
  ],
  sentence_completion: ['Read the whole sentence and predict the word form that fits the gap.'],
  table_completion: ['Use the row and column headings to work out what each missing cell needs.'],
  flowchart: ['Follow the arrows and predict the next step before filling each gap.'],
  map_labeling: ['Locate the starting point and orientation of the map before listening.'],
  short_answer: ['Find the exact detail the question asks for and check the word limit.'],
  multiple_choice_multiple: ['Check how many answers to choose before comparing the options.'],
  true_false_not_given: [
    'Find the part of the passage that discusses the statement. Check its whole meaning.',
    'Choose False or No only when the passage says the opposite. Missing information means Not Given.',
    'Watch words such as all, only and first. Use the passage, not what you already know.',
  ],
  yes_no_not_given: [
    'Find the part of the passage that discusses the statement. Check its whole meaning.',
    'Choose False or No only when the passage says the opposite. Missing information means Not Given.',
    'Watch words such as all, only and first. Use the passage, not what you already know.',
  ],
  summary_completion: [
    'Read the summary first and work out what each gap needs: a person, a thing or an action.',
    'Find the same idea in the passage, even when different words are used.',
    'Read the completed sentence again. Check both its meaning and grammar, and follow the answer instructions.',
  ],
  matching_headings: [
    'Read the whole paragraph and describe its main idea in a few words.',
    'Choose a heading that covers the paragraph, not just one detail.',
    'Check the closest alternative and explain why it fits less well.',
  ],
  matching_information: [
    'Identify the specific information each statement asks you to find.',
    'Look for the same meaning expressed in different words.',
    'Check the instructions to see whether a paragraph can be used more than once.',
  ],
  matching_features: [
    'Read the options and identify what makes each one different.',
    'Follow who or what each statement refers to, including corrections.',
    'Check the meaning of the full statement before choosing a match.',
  ],
  matching: [
    'Read the options and identify what makes each one different.',
    'Follow who or what each statement refers to, including corrections.',
    'Check the meaning of the full statement before choosing a match.',
  ],
};

function resolveMultipleChoiceTips(focus) {
  if (focus.startsWith('listening:')) {
    return [
      'Read the question and compare the options before the relevant part of the recording.',
      'An option may be mentioned and then rejected. Follow the speaker’s final meaning.',
      'Choose the requested number of answers. A repeated word alone does not make an option correct.',
    ];
  }
  return [
    'Read what the question asks before comparing its options.',
    'Find the relevant passage and check each option against the whole meaning.',
    'Reject options that add unsupported details. Choose only the number of answers requested.',
  ];
}

export function practiceTips(focus) {
  const type = focus.split(':')[1];
  if (type === 'multiple_choice') {
    return resolveMultipleChoiceTips(focus);
  }
  return TIPS_BY_TYPE[type] || GENERAL_TIPS;
}
