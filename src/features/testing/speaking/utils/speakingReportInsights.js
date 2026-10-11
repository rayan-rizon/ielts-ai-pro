import { SPEAKING_DRILLS, describeSound, soundPairsFor } from './speakingDrillLibrary';

/**
 * Deterministic analysis behind the speaking report.
 *
 * Everything here runs in the browser on data the session already holds: the
 * saved conversation (with each answer's recorded duration), the band
 * evaluation, the deep-dive feedback and the Azure pronunciation samples.
 * Nothing calls a model. A number is shown only when it was measured; when it
 * was not, these helpers return null and the UI says so instead of showing 0.
 */

const INVALID_RESPONSES = [
  /^\s*$/,
  /^\s*\.\.\.\s*$/,
  /^\s*\(inaudible\)\s*$/i,
  /^\s*\(audio received but transcription failed\)\s*$/i,
  /^\s*\(unable to transcribe.*\)\s*$/i,
  /^\s*\(failed to transcribe\)\s*$/i,
  /^\s*\(your response was recorded\)\s*$/i,
];

const PROCEDURAL_EXAMINER = [
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

const ACKNOWLEDGEMENT =
  /^(thank you( very much| for that| for your response| for explaining that)?|i see|all right|alright|okay|ok|that is an interesting point|that's an interesting point)[.!,]?\s+/i;

export const LENGTH_TARGETS = {
  1: { seconds: 20, words: 35, label: '20 s or more', short: '20 s+' },
  2: { seconds: 90, words: 160, label: '1:30 to 2:00', short: '1:30–2:00' },
  3: { seconds: 40, words: 70, label: '40 s or more', short: '40 s+' },
};

/** What each IELTS criterion means, in plain words. */
export const CRITERION_HELP = {
  fluency: 'Speaking smoothly and joining your ideas clearly',
  lexical: 'Using the right words, and a good range of them',
  grammar: 'Using correct sentences, both simple and longer ones',
  pronunciation: 'How clear and easy to understand you sound',
};

export const CRITERION_LABELS = {
  fluency: 'Fluency and coherence',
  lexical: 'Vocabulary',
  grammar: 'Grammar',
  pronunciation: 'Pronunciation',
};

export const ISSUE_LABELS = {
  too_short: 'Short',
  no_reason: 'No reason',
  no_example: 'No example',
  off_topic: 'Off topic',
  grammar: 'Grammar',
  vocabulary: 'Word choice',
};

const STOPWORDS = new Set(
  `about after again also always because been before being both could didn does doing dont
  each even every from going have having here just know like make many more most much myself
  never only other really should some such than that thats their them then there these they
  thing things think this those though through very want well were what when where which while
  will with would your yeah actually maybe usually sometimes because`
    .split(/\s+/)
    .filter(Boolean)
);

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const countWords = (text) =>
  String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const validDuration = (value) => {
  const ms = Number(value);
  return Number.isFinite(ms) && ms >= 1000 && ms <= 5 * 60 * 1000 ? ms : null;
};

const isMeaningfulAnswer = (entry) =>
  entry?.speaker === 'user' &&
  !entry.isLoading &&
  !entry.error &&
  typeof entry.text === 'string' &&
  !INVALID_RESPONSES.some((pattern) => pattern.test(entry.text));

function questionFromExaminer(text) {
  let question = text;
  let previous;
  do {
    previous = question;
    question = question.replace(ACKNOWLEDGEMENT, '').trim();
  } while (question && question !== previous);
  return question.slice(0, 240);
}

/**
 * Pairs every meaningful candidate answer with the examiner line before it.
 * Consecutive recordings for one question (a Part 2 talk split by a pause)
 * are merged into a single answer.
 */
export function extractAnswers(allPartsConversation = {}, { partTwoTopic } = {}) {
  const answers = [];

  for (const part of [1, 2, 3]) {
    const raw = allPartsConversation?.[part] ?? allPartsConversation?.[String(part)];
    const entries = Array.isArray(raw) ? raw : [];
    let question = '';
    let openAnswer = null;
    let number = 0;

    for (const entry of entries) {
      if (!entry || entry.isLoading || typeof entry.text !== 'string') continue;
      const text = entry.text.replace(/\s+/g, ' ').trim();
      if (!text) continue;

      if (entry.speaker === 'user') {
        if (!isMeaningfulAnswer(entry)) continue;
        const durationMs = validDuration(entry.durationMs);
        if (openAnswer) {
          openAnswer.text = `${openAnswer.text} ${text}`;
          openAnswer.words = countWords(openAnswer.text);
          openAnswer.durationMs =
            openAnswer.durationMs != null && durationMs != null
              ? openAnswer.durationMs + durationMs
              : null;
          continue;
        }
        number += 1;
        const isLongTurn = part === 2 && number === 1;
        openAnswer = {
          id: `p${part}-q${number}`,
          part,
          number,
          isLongTurn,
          question: question || (isLongTurn ? partTwoTopic || 'Your Part 2 talk' : ''),
          text,
          words: countWords(text),
          durationMs,
          feedback: null,
        };
        answers.push(openAnswer);
      } else if (!PROCEDURAL_EXAMINER.some((pattern) => pattern.test(text))) {
        question = questionFromExaminer(text);
        openAnswer = null;
      } else {
        openAnswer = null;
      }
    }
  }

  return answers;
}

/**
 * Attaches deep-dive feedback to the answers it describes. The deep dive's
 * candidateAnswer is verified server-side to be verbatim transcript, so a
 * substring match is reliable; order within the part is the fallback.
 */
export function attachFeedback(answers, questions) {
  const result = answers.map((answer) => ({ ...answer }));
  if (!Array.isArray(questions) || questions.length === 0) return result;

  const used = new Set();
  questions.forEach((item, index) => {
    const needle = normalize(item.candidateAnswer);
    const inPart = result.filter((answer) => answer.part === item.part && !used.has(answer.id));
    const match =
      inPart.find((answer) => needle && normalize(answer.text).includes(needle)) ||
      inPart.find((answer) => needle && needle.includes(normalize(answer.text))) ||
      inPart[0];

    if (match) {
      used.add(match.id);
      match.feedback = item;
      if (item.question) match.question = item.question;
      return;
    }

    const number = result.filter((answer) => answer.part === item.part).length + 1;
    result.push({
      id: `p${item.part}-f${index}`,
      part: item.part,
      number,
      isLongTurn: item.part === 2 && number === 1,
      question: item.question || '',
      text: item.candidateAnswer,
      words: countWords(item.candidateAnswer),
      durationMs: null,
      feedback: item,
    });
    used.add(`p${item.part}-f${index}`);
  });

  return result.sort((a, b) => a.part - b.part || a.number - b.number);
}

/** Time when every answer has a recorded duration, otherwise word counts. */
export function lengthBasis(answers) {
  return answers.length > 0 && answers.every((answer) => answer.durationMs != null)
    ? 'time'
    : 'words';
}

export const targetFor = (answer) =>
  LENGTH_TARGETS[answer.isLongTurn ? 2 : answer.part === 3 ? 3 : 1];

export function lengthRatio(answer, basis) {
  const target = targetFor(answer);
  if (basis === 'time') {
    return answer.durationMs == null ? null : answer.durationMs / 1000 / target.seconds;
  }
  return answer.words / target.words;
}

export function lengthStatus(answer, basis) {
  const ratio = lengthRatio(answer, basis);
  if (ratio == null) return 'unknown';
  if (ratio >= 1) return 'ok';
  return ratio >= 0.6 ? 'short' : 'very-short';
}

export function formatSeconds(ms) {
  if (ms == null) return '—';
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total} s`;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function collectAzureSamples(allPartsPronunciation) {
  if (!allPartsPronunciation || typeof allPartsPronunciation !== 'object') return [];
  return Object.values(allPartsPronunciation)
    .flatMap((samples) => (Array.isArray(samples) ? samples : []))
    .filter((sample) => sample?.provider === 'azure-speech');
}

export function buildDelivery(answers, allPartsPronunciation) {
  const timed = answers.filter((answer) => answer.durationMs != null);
  const allTimed = answers.length > 0 && timed.length === answers.length;
  const timedMs = timed.reduce((sum, answer) => sum + answer.durationMs, 0);
  const timedWords = timed.reduce((sum, answer) => sum + answer.words, 0);
  const rawPace = timedMs >= 30_000 ? timedWords / (timedMs / 60_000) : null;
  const accuracy = collectAzureSamples(allPartsPronunciation)
    .map((sample) => Number(sample?.providerScores?.accuracy))
    .filter(Number.isFinite);

  return {
    answerCount: answers.length,
    words: answers.reduce((sum, answer) => sum + answer.words, 0),
    speakingMs: allTimed ? timedMs : null,
    wordsPerMinute: rawPace != null && rawPace >= 40 && rawPace <= 220 ? Math.round(rawPace) : null,
    clarity:
      accuracy.length > 0
        ? Math.round(accuracy.reduce((sum, value) => sum + value, 0) / accuracy.length)
        : null,
  };
}

const REASON_PATTERN =
  /\b(because|since|as a result|so that|that's why|that is why|the reason|mainly|due to)\b/i;
const EXAMPLE_PATTERN =
  /\b(for example|for instance|such as|like when|once|last (week|month|year|time|summer|winter)|when i was|i remember|the other day)\b/i;

const hasGrammarErrors = (answer) => (answer.feedback?.grammaticalErrors?.length || 0) > 0;
const hasDrift = (answer) => {
  const drift = answer.feedback?.topicDrift;
  return typeof drift === 'string' && drift.trim() && drift.trim().toLowerCase() !== 'null';
};

/**
 * Issues for one answer. Length is measured, so it overrides whatever the
 * model inferred about length; the other tags come from the deep dive.
 */
export function answerIssues(answer, basis) {
  const issues = new Set();
  const tagged = answer.feedback?.issue;
  if (tagged && tagged !== 'none' && tagged !== 'too_short' && ISSUE_LABELS[tagged]) {
    issues.add(tagged);
  }
  const status = lengthStatus(answer, basis);
  if (status === 'short' || status === 'very-short') issues.add('too_short');
  if (hasGrammarErrors(answer)) issues.add('grammar');
  if (hasDrift(answer)) issues.add('off_topic');
  return [...issues];
}

export function buildCriteriaList(finalEvaluation = {}) {
  const hasPronunciation = Number.isFinite(Number(finalEvaluation.pronunciation));
  return Object.entries(CRITERION_LABELS)
    .map(([key, label]) => {
      const value = finalEvaluation[key];
      return {
        key,
        label,
        value: value != null && Number.isFinite(Number(value)) ? Number(value) : null,
      };
    })
    .filter((criterion) => criterion.key !== 'pronunciation' || hasPronunciation);
}

/** The lowest criterion, or `{ level: true }` when all four are equal. */
export function findHoldingBack(criteria) {
  const scored = criteria.filter((criterion) => criterion.value != null);
  if (scored.length < 2) return null;
  const min = Math.min(...scored.map((criterion) => criterion.value));
  const max = Math.max(...scored.map((criterion) => criterion.value));
  if (min === max) return { level: true, value: min };
  return { level: false, ...scored.find((criterion) => criterion.value === min) };
}

const plural = (count, word, pluralWord = `${word}s`) =>
  `${count} ${count === 1 ? word : pluralWord}`;

const FIXES = {
  off_topic: {
    title: 'Answer the exact question first',
    body: 'Start your answer with the key words from the question. Then add more about that same point. If you talk about something else, your score goes down, even if your English is good.',
    criterion: 'fluency',
    drill: 'question_keywords',
  },
  too_short: {
    title: 'Make your answers longer',
    body: 'Give your answer. Then say why. Then give an example from your life. Try to speak for about 20 seconds in Part 1, about 2 minutes in Part 2, and 40 seconds or more in Part 3.',
    criterion: 'fluency',
    drill: 'answer_reason_example',
  },
  grammar: {
    title: 'Fix the mistakes you repeat',
    body: 'Your mistakes and their corrections are under each answer. Say each correct sentence out loud a few times. Mistakes you make again and again lower your score the most.',
    criterion: 'grammar',
    drill: 'fix_my_mistakes',
  },
  no_reason: {
    title: 'Give a reason every time',
    body: 'After your answer, say why. Use words like “because…” or “the reason is…”. A short answer with no reason gives the examiner very little to score.',
    criterion: 'fluency',
    drill: 'answer_reason_example',
  },
  no_example: {
    title: 'Add one real example',
    body: 'After your reason, add a real example from your life: a place, a time or a person. Real details help you get a higher band.',
    criterion: 'fluency',
    drill: 'answer_reason_example',
  },
  vocabulary: {
    title: 'Use more exact words',
    body: 'Words like “good”, “nice” and “thing” are too general. Use the exact word you mean. The stronger answers below show you how.',
    criterion: 'lexical',
    drill: 'topic_words',
  },
  pronunciation: {
    title: 'Say some sounds more clearly',
    body: 'A few sounds made some words hard to understand. Practise them with pairs of similar words, then in full sentences.',
    criterion: 'pronunciation',
    drill: 'sound_pairs',
  },
};

function pickExample(candidates, issue) {
  if (candidates.length === 0) return null;
  const withStronger = candidates.filter((answer) => answer.feedback?.suggestedAnswer);
  const pool = withStronger.length > 0 ? withStronger : candidates;
  if (issue === 'too_short') {
    return [...pool].sort((a, b) => a.words - b.words)[0];
  }
  if (issue === 'grammar') {
    return [...pool].sort(
      (a, b) =>
        (b.feedback?.grammaticalErrors?.length || 0) - (a.feedback?.grammaticalErrors?.length || 0)
    )[0];
  }
  return pool[0];
}

/**
 * The single most useful thing to work on next, with the answer that shows it.
 * Ordered by what costs the most marks for the least effort to fix.
 */
export function deriveTopFix({ answers, basis, criteria, sounds = [], improvements = [] }) {
  const total = answers.length;
  if (total === 0) return null;

  const byIssue = {};
  answers.forEach((answer) => {
    answerIssues(answer, basis).forEach((issue) => {
      (byIssue[issue] ||= []).push(answer);
    });
  });
  const count = (issue) => byIssue[issue]?.length || 0;
  const grammarTotal = answers.reduce(
    (sum, answer) => sum + (answer.feedback?.grammaticalErrors?.length || 0),
    0
  );
  const holding = findHoldingBack(criteria);
  const lowest = holding && !holding.level ? holding.key : null;

  const evidence = {
    off_topic: () => `${plural(count('off_topic'), 'answer')} did not answer the exact question.`,
    too_short: () =>
      `${count('too_short')} of your ${total} answers were shorter than the target${
        basis === 'words' ? ' for their part (measured in words)' : ''
      }.`,
    grammar: () =>
      `${plural(grammarTotal, 'correction')} across ${plural(count('grammar'), 'answer')}.`,
    no_reason: () => `${plural(count('no_reason'), 'answer')} gave no reason.`,
    no_example: () => `${plural(count('no_example'), 'answer')} had no example.`,
    vocabulary: () => `${plural(count('vocabulary'), 'answer')} used very general words.`,
    pronunciation: () =>
      `Sounds to work on: ${sounds.slice(0, 2).map(describeSound).join(' and ')}.`,
  };

  const rules = [
    ['off_topic', count('off_topic') >= 2 || count('off_topic') / total >= 0.25],
    ['too_short', count('too_short') / total >= 0.4],
    ['grammar', grammarTotal >= 3 || (lowest === 'grammar' && grammarTotal >= 1)],
    ['no_reason', count('no_reason') / total >= 0.3],
    ['no_example', count('no_example') / total >= 0.3],
    [
      'vocabulary',
      count('vocabulary') / total >= 0.3 || (lowest === 'lexical' && count('vocabulary') > 0),
    ],
    ['pronunciation', lowest === 'pronunciation' && sounds.length > 0],
    ['too_short', count('too_short') > 0],
    ['grammar', grammarTotal > 0],
  ];

  const hit = rules.find(([, applies]) => applies);
  if (hit) {
    const [issue] = hit;
    return {
      issue,
      ...FIXES[issue],
      evidence: evidence[issue](),
      answer: issue === 'pronunciation' ? null : pickExample(byIssue[issue] || [], issue),
    };
  }

  const fallback = improvements.find((item) => item?.title && item?.content);
  if (!fallback) return null;
  return {
    issue: 'general',
    title: fallback.title,
    body: fallback.content,
    criterion: lowest || 'fluency',
    evidence: lowest ? `${CRITERION_LABELS[lowest]} is your lowest score.` : '',
    drill: lowest === 'lexical' ? 'paraphrase_repeats' : 'linking_phrases',
    answer: null,
  };
}

/** The content word a candidate leaned on most, if they leaned on one. */
export function findRepeatedWord(answers) {
  const counts = new Map();
  answers.forEach((answer) => {
    normalize(answer.text)
      .split(' ')
      .filter((word) => word.length >= 4 && !STOPWORDS.has(word.replace(/'/g, '')))
      .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  });
  const [word, times] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return word && times >= 4 ? { word, times } : null;
}

/**
 * Three drills, most important first. The first always backs the #1 fix;
 * the rest come from other measured weaknesses, so the plan covers more
 * than one criterion when the evidence supports it.
 */
export function selectPracticeDrills({ answers, basis, criteria, delivery, sounds = [], topFix }) {
  const picks = [];
  const add = (id, reason, extra = {}) => {
    if (!SPEAKING_DRILLS[id] || picks.some((pick) => pick.id === id)) return;
    picks.push({ ...SPEAKING_DRILLS[id], reason, ...extra });
  };

  const holding = findHoldingBack(criteria);
  const lowest = holding && !holding.level ? holding.key : null;
  const longTurn = answers.find((answer) => answer.isLongTurn);
  const shortIn = (part) =>
    answers.filter(
      (answer) => answer.part === part && !answer.isLongTurn && lengthStatus(answer, basis) !== 'ok'
    );
  const pairs = soundPairsFor(sounds);
  const repeated = findRepeatedWord(answers);
  const grammarTotal = answers.reduce(
    (sum, answer) => sum + (answer.feedback?.grammaticalErrors?.length || 0),
    0
  );

  if (topFix?.drill) add(topFix.drill, 'Practises your next step every day.');

  if (
    longTurn &&
    lengthStatus(longTurn, basis) !== 'ok' &&
    lengthStatus(longTurn, basis) !== 'unknown'
  ) {
    add(
      'part2_full_turn',
      basis === 'time'
        ? `Your Part 2 talk was ${formatSeconds(longTurn.durationMs)}. Try for 1:30 to 2:00.`
        : `Your Part 2 talk was only ${longTurn.words} words.`
    );
  }
  const shortPart3 = shortIn(3);
  if (shortPart3.length >= 2) {
    add('part3_opinion_turn', `${shortPart3.length} Part 3 answers were too short.`);
  }
  if (grammarTotal > 0)
    add('fix_my_mistakes', `${plural(grammarTotal, 'correction')} in your answers.`);
  if (pairs.length > 0) {
    add(
      'sound_pairs',
      `Practise ${pairs.map((pair) => describeSound(pair.sound)).join(' and ')}.`,
      {
        pairs,
      }
    );
  }
  if (repeated) add('paraphrase_repeats', `You said “${repeated.word}” ${repeated.times} times.`);
  if (lowest === 'lexical') add('topic_words', 'Vocabulary is your lowest score.');
  if (
    delivery?.wordsPerMinute != null &&
    (delivery.wordsPerMinute < 90 || delivery.wordsPerMinute > 180)
  ) {
    add(
      'steady_pace',
      `You said ${delivery.wordsPerMinute} words a minute. About 110 to 150 sounds natural.`
    );
  }
  if (lowest === 'pronunciation') add('shadow_stronger', 'Pronunciation is your lowest score.');
  if (lowest === 'fluency') add('linking_phrases', 'Fluency and coherence is your lowest score.');

  add('linking_phrases', 'Linking phrases help in every part of the test.');
  add('shadow_stronger', 'Helps you sound more natural.');

  // The two most important drills, then the strongest drill for a criterion
  // they don't cover, so the week works on more than one thing when the
  // evidence supports it.
  const [lead, next, ...rest] = picks;
  if (!lead) return [];
  if (!next) return [lead];
  const covered = new Set([lead.criterion, next.criterion]);
  const third = rest.find((pick) => !covered.has(pick.criterion)) || rest[0];
  return third ? [lead, next, third] : [lead, next];
}

/**
 * Splits an answer into plain text and marked spans: grammar corrections from
 * the deep dive and words Azure flagged as unclear.
 */
export function markAnswer(text, { errors = [], flaggedWords = [] } = {}) {
  const source = String(text || '');
  const lower = source.toLowerCase();
  const ranges = [];

  errors.forEach((error) => {
    const needle = String(error?.incorrect || '')
      .toLowerCase()
      .trim();
    if (!needle) return;
    let from = 0;
    while (from < lower.length) {
      const at = lower.indexOf(needle, from);
      if (at === -1) break;
      const end = at + needle.length;
      if (!ranges.some((range) => at < range.end && end > range.start)) {
        ranges.push({ start: at, end, kind: 'error', error });
        break;
      }
      from = end;
    }
  });

  flaggedWords.forEach((flag) => {
    const word = String(flag?.word || '').trim();
    if (!word) return;
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;
    while ((match = pattern.exec(source))) {
      const start = match.index;
      const end = start + match[0].length;
      if (!ranges.some((range) => start < range.end && end > range.start)) {
        ranges.push({ start, end, kind: 'word', flag });
      }
    }
  });

  ranges.sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;
  ranges.forEach((range) => {
    if (range.start > cursor)
      segments.push({ kind: 'text', text: source.slice(cursor, range.start) });
    segments.push({ ...range, text: source.slice(range.start, range.end) });
    cursor = range.end;
  });
  if (cursor < source.length) segments.push({ kind: 'text', text: source.slice(cursor) });
  return segments;
}

/** Azure word issues grouped by part, for marking answers in that part. */
export function flaggedWordsByPart(allPartsPronunciation) {
  const byPart = {};
  if (!allPartsPronunciation || typeof allPartsPronunciation !== 'object') return byPart;
  Object.entries(allPartsPronunciation).forEach(([part, samples]) => {
    if (!Array.isArray(samples)) return;
    const seen = new Set();
    byPart[Number(part)] = samples
      .flatMap((sample) =>
        Array.isArray(sample?.wordLevelFeedback) ? sample.wordLevelFeedback : []
      )
      .filter((item) => {
        const key = String(item?.word || '').toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  });
  return byPart;
}

const contentWords = (text) =>
  new Set(
    normalize(text)
      .split(' ')
      .filter((word) => word.length >= 4 && !STOPWORDS.has(word.replace(/'/g, '')))
  );

/**
 * Quick self-check for a re-answer. These are plain heuristics, labelled as
 * such in the UI: they look for the behaviour the fix asked for, not a band.
 */
export function checkRehearsal({ answer, issues = [], transcript = '', seconds = 0 }) {
  const target = targetFor(answer);
  const words = countWords(transcript);
  const hasTranscript = words > 0;
  const checks = [];
  const lengthPass = seconds >= target.seconds;

  checks.push({
    id: 'length',
    label: `Length: ${formatSeconds(seconds * 1000)}`,
    detail: `Target ${target.label}`,
    pass: lengthPass,
  });

  if (!hasTranscript) return { checks, words, hasTranscript };

  const wantsDevelopment =
    issues.includes('too_short') || issues.includes('no_reason') || issues.includes('no_example');
  if (wantsDevelopment || issues.length === 0) {
    checks.push({
      id: 'reason',
      label: 'Gave a reason',
      detail: 'because, since, the reason is…',
      pass: REASON_PATTERN.test(transcript),
    });
    checks.push({
      id: 'example',
      label: 'Gave an example',
      detail: 'for example, once, last year…',
      pass: EXAMPLE_PATTERN.test(transcript),
    });
  }

  if (issues.includes('off_topic')) {
    const questionWords = contentWords(answer.question);
    const overlap = [...contentWords(transcript)].filter((word) => questionWords.has(word));
    checks.push({
      id: 'topic',
      label: 'Used words from the question',
      detail: overlap.length ? overlap.slice(0, 3).join(', ') : 'none found',
      pass: overlap.length >= 1,
    });
  }

  if (issues.includes('grammar')) {
    const said = normalize(transcript);
    const repeated = (answer.feedback?.grammaticalErrors || []).filter((error) => {
      const wrong = normalize(error.incorrect);
      return wrong && said.includes(wrong);
    });
    checks.push({
      id: 'grammar',
      label: 'Didn’t repeat your mistakes',
      detail: repeated.length ? `“${repeated[0].incorrect}” again` : 'none repeated',
      pass: repeated.length === 0,
    });
  }

  return { checks, words, hasTranscript };
}
