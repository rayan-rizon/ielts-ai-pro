import { calculateTestResults } from '../objective-scoring/reading.js';
import { calculateListeningTestResults } from '../objective-scoring/listening.js';
import { computeQuestionNumbers } from '../objective-scoring/questionProcessing.js';

// Keep pedagogically different matching tasks separate even in legacy storage.
export function questionFocus(module, question) {
  if (!['reading', 'listening'].includes(module)) return null;
  let type = question.type;
  // In the actual library paragraph mode is a summary with gaps, not paragraph matching.
  if (type === 'matching_features' && question.matching_features?.mode === 'paragraph')
    type = 'summary_completion';
  if (module === 'reading' && type === 'matching_features') {
    const instructions = `${question.group_instructions || ''} ${question.matching_features?.box_title || ''}`;
    if (/list of headings|correct heading|suitable heading/i.test(instructions))
      type = 'matching_headings';
    else if (
      /which (?:paragraph|section) contains|match.*information.*paragraph/i.test(instructions)
    )
      type = 'matching_information';
  }
  if (!type || type === 'static_text') return null;
  return `${module}:${type}`;
}

export function scoreLibraryGroup(module, questions, answers) {
  if (!['reading', 'listening'].includes(module)) throw new Error('Unsupported subject');
  const result =
    module === 'reading'
      ? calculateTestResults(questions, answers)
      : calculateListeningTestResults(computeQuestionNumbers(questions), answers);
  // A short group is not an IELTS band estimate.
  return {
    correct: result.correctAnswers,
    total: result.totalQuestions,
    responses: result.responseDetails,
    answers: result.correctAnswersMap || result.answersMap,
  };
}

export function savedLibraryExplanations(questions) {
  return questions.map((q) => ({
    id: q.id,
    text:
      q.explanation ||
      Object.entries(q.explanation_data?.blanks || {})
        .filter(([, value]) => typeof value?.why_correct === 'string')
        .map(([number, value]) => `Question ${number}: ${value.why_correct}`)
        .join('\n\n'),
  }));
}

function tutorQuestionPrompts(question) {
  const nested =
    question.questions ||
    question.matching_features?.questions ||
    question.matching_data?.questions;
  if (Array.isArray(nested) && nested.length) {
    return nested.map((item, index) => ({
      number:
        item.question_number ??
        item.questionNumber ??
        item.number ??
        Number(question.question_number || 1) + index,
      text: item.question_text || item.text || item.label || question.question_text || '',
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

/**
 * Keep the AI prompt useful even when a source passage is large. The teacher
 * receives only server-verified answer review data, short source metadata and
 * relevant progress. The full passage and hidden independent answer keys are
 * deliberately excluded.
 */
export function buildLibraryTutorContext(session, previousProgress = []) {
  const review = session?.completed_at && session?.result ? session : session?.mistake;
  const questions = Array.isArray(review?.questions) ? review.questions : [];
  const explanations = Array.isArray(review?.explanations) ? review.explanations : [];
  const answerReview = [];

  for (const question of questions) {
    const answerEntries = Object.entries(review?.result?.answers || {}).filter(
      ([id]) => id === question.id || id.startsWith(`${question.id}_`)
    );
    const prompts = tutorQuestionPrompts(question);
    const explanationText = explanations.find((item) => item.id === question.id)?.text || '';
    const explanationMap = tutorExplanationMap(explanationText);

    for (const [, answer] of answerEntries) {
      const questionNumber = Number(answer.questionNumber ?? question.question_number);
      const prompt =
        prompts.find((item) => Number(item.number) === questionNumber)?.text ||
        question.question_text ||
        '';
      const verifiedExplanation =
        explanationMap.get(questionNumber) || (answerEntries.length === 1 ? explanationText : '');
      answerReview.push({
        question_number: questionNumber,
        question: String(prompt).slice(0, 400),
        student_answer: tutorAnswerText(answer.userAnswer),
        correct_answer: tutorAnswerText(answer.correctAnswer),
        is_correct: Boolean(answer.isCorrect),
        verified_explanation: String(verifiedExplanation).slice(0, 700),
      });
    }
  }

  return {
    focus: session?.focus,
    stage: session?.stage,
    source: {
      title: review?.source?.title || review?.title || session?.source?.title || '',
      section: review?.source?.section || review?.section || session?.source?.section || null,
    },
    teaching_tips: practiceTips(session?.focus).slice(0, 3),
    answer_review: answerReview.slice(0, 8),
    previous_progress: (Array.isArray(previousProgress) ? previousProgress : [])
      .slice(0, 5)
      .map((item) => ({
        completed_at: item.completed_at,
        correct: item.correct,
        total: item.total,
        familiarity: item.familiarity,
        next_review_at: item.next_review_at,
      })),
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

function cleanPassageTitle(value) {
  if (typeof value !== 'string') return null;
  const title = value
    .replace(/\\n/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*[*_]+|[*_]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!title || /^(?:reading\s+)?passage(?:\s+\d+)?$/i.test(title)) return null;
  if (/^part\s*(?:\d+|[ivx]+)$/i.test(title)) return null;
  if (/^[A-G]$/i.test(title)) return null;
  return title;
}

/**
 * Passage titles live in the section object for library tests. Older records
 * sometimes omit that field but include the title in the first centred or
 * heading line of the original passage, so use that only as a fallback.
 */
export function derivePassageTitle(section, content) {
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

  const source = String(content || '')
    .replace(/\\n/g, '\n')
    .trim();
  const candidates = [
    source.match(/^\s*\[center\]\s*([\s\S]*?)\s*\[\/center\]/i)?.[1],
    source.match(/^\s*<h[1-6][^>]*>\s*([\s\S]*?)\s*<\/h[1-6]>/i)?.[1],
    source.match(/^\s*\[(?:heading|title)\]\s*([\s\S]*?)\s*\[\/(?:heading|title)\]/i)?.[1],
  ];
  for (const value of candidates) {
    const title = cleanPassageTitle(value);
    if (title) return title;
  }

  const firstLine = source.split(/\n+/).find((line) => line.trim());
  if (/^\s*\*\*[^*]+\*\*\s*$/.test(firstLine || '')) {
    return cleanPassageTitle(firstLine.replace(/^\s*\*\*|\*\*\s*$/g, ''));
  }
  return null;
}

// Keep only the original section needed by this group. Never serialize embedded
// question groups (which contain answer keys) as passage text.
export function libraryGroupSource(passage, questions) {
  const sectionNumber = Number(questions[0]?.section || questions[0]?.part_number || 1);
  let content = passage.content || '';
  let sections;
  try {
    sections = typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    /* Original plain passage. */
  }
  const section = Array.isArray(sections)
    ? sections.find((s, i) => Number(s.section_number || i + 1) === sectionNumber)
    : null;
  if (Array.isArray(sections)) content = section?.content || '';
  const audio =
    passage.test_type === 'listening'
      ? section?.audio_url || section?.audioUrl || passage.audio_url || null
      : null;
  return {
    id: passage.id,
    title: passage.title,
    passage_title: derivePassageTitle(section, content),
    section: sectionNumber,
    content:
      passage.test_type === 'reading' && typeof content === 'string'
        ? publicPracticeContent(content).replace(/\\n/g, '\n')
        : '',
    audio_url: audio,
    audio_scope: audio ? (section?.audio_url || section?.audioUrl ? 'section' : 'full_test') : null,
    duration_minutes:
      section?.duration_minutes || (audio === passage.audio_url ? passage.duration_minutes : null),
  };
}

export function buildLibraryGroups(passage, questions) {
  if (!passage?.is_active || !['reading', 'listening'].includes(passage.test_type)) return [];
  const buckets = new Map();
  for (const question of questions) {
    if (question.passage_id !== passage.id) continue;
    const focus = questionFocus(passage.test_type, question);
    if (!focus) continue;
    // Preserve whole shared option groups. Do not divide matching subquestions.
    const key = [
      question.section || question.part_number || 1,
      focus,
      question.group_instructions || '',
      question.mcq_title || '',
    ].join('|');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(question);
  }
  return [...buckets.values()].map((rows) => {
    rows.sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
    const score = scoreLibraryGroup(passage.test_type, rows, {});
    const keys = Object.values(score.answers || {});
    const source = libraryGroupSource(passage, rows);
    const hasContext =
      passage.test_type === 'reading' ? Boolean(source.content.trim()) : Boolean(source.audio_url);
    const hasKeys =
      keys.length > 0 &&
      keys.every(
        (k) =>
          k.correctAnswer != null &&
          String(k.correctAnswer).trim() !== '' &&
          k.correctAnswer !== '—'
      );
    const supported =
      passage.test_type === 'reading'
        ? rows.every((q) =>
            [
              'matching_headings',
              'matching_features',
              'matching',
              'multiple_choice',
              'true_false_not_given',
              'yes_no_not_given',
            ].includes(q.type)
          )
        : rows.every((q) => ['matching_features', 'multiple_choice'].includes(q.type));
    return {
      id: `${passage.id}:${rows[0].id}`,
      sourceId: passage.id,
      title: passage.title,
      focus: questionFocus(passage.test_type, rows[0]),
      accessTier: passage.access_tier,
      questions: rows,
      source,
      total: score.total,
      eligible: hasContext && hasKeys && supported,
      exclusion: !hasContext
        ? 'Missing original passage or audio'
        : !hasKeys
          ? 'Incomplete answer key'
          : !supported
            ? 'Question display requires validation'
            : null,
    };
  });
}

export function rankPracticeNeeds(attempts, now = new Date()) {
  const cutoff = now.getTime() - 90 * 86400000;
  const byFocus = new Map();
  const ordered = attempts
    .filter(
      (a) =>
        a.completedAt &&
        Number.isFinite(Date.parse(a.completedAt)) &&
        Date.parse(a.completedAt) >= cutoff &&
        Date.parse(a.completedAt) <= now.getTime()
    )
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  for (const attempt of ordered) {
    if (!attempt.focus || !attempt.sessionId || !attempt.groupId) continue;
    if (!byFocus.has(attempt.focus)) byFocus.set(attempt.focus, []);
    const rows = byFocus.get(attempt.focus);
    if (!rows.some((a) => a.sessionId === attempt.sessionId && a.groupId === attempt.groupId))
      rows.push(attempt);
  }
  return [...byFocus.entries()]
    .map(([focus, rows]) => {
      const seen = new Set();
      const errorGroups = new Set();
      const errorSessions = new Set();
      let correct = 0;
      let total = 0;
      const mistakes = [];
      let eligibleAttempts = 0;
      for (const row of rows) {
        if (row.assisted || row.repeated || row.familiar) continue;
        if (eligibleAttempts >= 5) break;
        if (!(row.responses || []).some((a) => a.questionId && typeof a.isCorrect === 'boolean'))
          continue;
        eligibleAttempts++;
        for (const answer of row.responses || []) {
          if (!answer.questionId || typeof answer.isCorrect !== 'boolean') continue;
          const key = `${row.sourceId}:${answer.questionId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          total++;
          if (answer.isCorrect) correct++;
          else {
            errorGroups.add(row.groupId);
            errorSessions.add(row.sessionId);
            mistakes.push({
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
      const accuracy = total ? correct / total : null;
      const repeatedDifficulty =
        errorGroups.size >= 2 && errorSessions.size >= 2 && total >= 5 && accuracy < 0.7;
      const due = rows.some((a) => a.nextReviewAt && Date.parse(a.nextReviewAt) <= now.getTime());
      return {
        focus,
        correct,
        total,
        accuracy,
        mistakes,
        repeatedDifficulty,
        due,
        label: repeatedDifficulty
          ? 'A repeated difficulty'
          : mistakes.length
            ? 'Worth practising'
            : 'Keep practising',
        priority: repeatedDifficulty ? 0 : due ? 1 : mistakes.length ? 2 : 3,
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
          // Legacy attempts come from a completed full test and do not have
          // Practice Lab familiarity flags. Keep that evidence honest instead
          // of presenting every result as a new question set.
          kind: !a.practice
            ? 'Full test'
            : a.repeated
              ? 'Repeated questions'
              : a.assisted
                ? 'With help'
                : a.familiar
                  ? 'Familiar passage or audio'
                  : 'New questions',
        })),
      };
    })
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        (a.accuracy ?? 1) - (b.accuracy ?? 1) ||
        Date.parse(b.latestAt) - Date.parse(a.latestAt) ||
        a.focus.localeCompare(b.focus)
    );
}

export function chooseLibraryGroups(groups, exposures, focus) {
  const seenGroups = new Set(exposures.map((e) => e.groupId));
  const seenSources = new Set(exposures.map((e) => e.sourceId));
  return groups
    .filter((g) => g.focus === focus && g.eligible)
    .map((g) => ({
      ...g,
      familiarity: seenGroups.has(g.id)
        ? 'repeated'
        : seenSources.has(g.sourceId)
          ? 'familiar'
          : 'new',
    }))
    .sort(
      (a, b) =>
        ({ new: 0, familiar: 1, repeated: 2 })[a.familiarity] -
          { new: 0, familiar: 1, repeated: 2 }[b.familiarity] || a.id.localeCompare(b.id)
    );
}

export function practiceTips(focus) {
  const type = focus.split(':')[1];
  if (['true_false_not_given', 'yes_no_not_given'].includes(type))
    return [
      'Find the part of the passage that discusses the statement. Check its whole meaning.',
      'Choose False or No only when the passage says the opposite. Missing information means Not Given.',
      'Watch words such as all, only and first. Use the passage, not what you already know.',
    ];
  if (type === 'summary_completion')
    return [
      'Read the summary first and work out what each gap needs: a person, a thing or an action.',
      'Find the same idea in the passage, even when different words are used.',
      'Read the completed sentence again. Check both its meaning and grammar, and follow the answer instructions.',
    ];
  if (type === 'multiple_choice')
    return focus.startsWith('listening:')
      ? [
          'Read the question and compare the options before the relevant part of the recording.',
          'An option may be mentioned and then rejected. Follow the speaker’s final meaning.',
          'Choose the requested number of answers. A repeated word alone does not make an option correct.',
        ]
      : [
          'Read what the question asks before comparing its options.',
          'Find the relevant passage and check each option against the whole meaning.',
          'Reject options that add unsupported details. Choose only the number of answers requested.',
        ];
  if (type === 'matching_headings')
    return [
      'Read the whole paragraph and describe its main idea in a few words.',
      'Choose a heading that covers the paragraph, not just one detail.',
      'Check the closest alternative and explain why it fits less well.',
    ];
  if (type === 'matching_information')
    return [
      'Identify the specific information each statement asks you to find.',
      'Look for the same meaning expressed in different words.',
      'Check the instructions to see whether a paragraph can be used more than once.',
    ];
  if (type === 'matching_features' || type === 'matching')
    return [
      'Read the options and identify what makes each one different.',
      'Follow who or what each statement refers to, including corrections.',
      'Check the meaning of the full statement before choosing a match.',
    ];
  return [
    'Read the instructions and any answer limits carefully.',
    'Find or listen for the meaning, rather than just a repeated word.',
    'Check your answer against the original passage or audio.',
  ];
}
