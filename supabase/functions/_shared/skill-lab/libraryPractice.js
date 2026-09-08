import { calculateTestResults } from '../objective-scoring/reading.js';
import { calculateListeningTestResults } from '../objective-scoring/listening.js';
import { computeQuestionNumbers } from '../objective-scoring/questionProcessing.js';

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
]);

const SUPPORTED_LISTENING_TYPES = new Set(['matching_features', 'multiple_choice']);

function isQuestionTypeSupported(testType, type) {
  return testType === 'reading'
    ? SUPPORTED_READING_TYPES.has(type)
    : SUPPORTED_LISTENING_TYPES.has(type);
}

function buildBucketKey(question) {
  return [
    question.section || question.part_number || 1,
    question.focus,
    question.group_instructions || '',
    question.mcq_title || '',
  ].join('|');
}

function groupQuestionsByBucket(passage, questions) {
  const buckets = new Map();
  for (const question of questions) {
    if (question.passage_id !== passage.id) continue;
    const focus = questionFocus(passage.test_type, question);
    if (!focus) continue;
    const key = buildBucketKey({ ...question, focus });
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
  const supported = rows.every((q) => isQuestionTypeSupported(passage.test_type, q.type));
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

    return {
      id: `${passage.id}:${rows[0].id}`,
      sourceId: passage.id,
      title: passage.title,
      focus: questionFocus(passage.test_type, rows[0]),
      accessTier: passage.access_tier,
      questions: rows,
      source,
      total: score.total,
      eligible,
      exclusion,
    };
  });
}

function isValidAttempt(a) {
  return Boolean(a.focus && a.sessionId && a.groupId);
}

function isIndependentAttempt(row) {
  return !row.assisted && !row.repeated && !row.familiar;
}

function isValidResponse(r) {
  return Boolean(r.questionId && typeof r.isCorrect === 'boolean');
}

function hasValidResponses(row) {
  return (row.responses || []).some(isValidResponse);
}

function processAttemptResponses(row, seen, state) {
  for (const answer of row.responses || []) {
    if (!isValidResponse(answer)) continue;
    const key = `${row.sourceId}:${answer.questionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
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
  const eligible = [];
  for (const row of rows) {
    if (!isIndependentAttempt(row)) continue;
    if (!hasValidResponses(row)) continue;
    eligible.push(row);
    if (eligible.length >= 5) break;
  }
  return eligible;
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
  };
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

export function rankPracticeNeeds(attempts, now = new Date()) {
  const nowTime = now.getTime();
  const cutoff = nowTime - 90 * 86400000;
  const byFocus = groupAttemptsByFocus(attempts, cutoff, nowTime);

  return [...byFocus.entries()]
    .map(([focus, rows]) => {
      const stats = aggregateFocusPerformance(rows);
      const due = rows.some((a) => a.nextReviewAt && Date.parse(a.nextReviewAt) <= nowTime);
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
        sources: rows.slice(0, 5).map((a) => ({
          sessionId: a.sessionId,
          sourceId: a.sourceId,
          title: a.title,
          completedAt: a.completedAt,
          practice: Boolean(a.practice),
        })),
        history: rows.slice(0, 5).map((a) => ({
          correct: a.correct,
          total: a.total,
          completedAt: a.completedAt,
          kind: resolveAttemptKind(a),
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
