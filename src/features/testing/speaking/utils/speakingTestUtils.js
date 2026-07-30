const FALLBACK_CUE_CARD_POINTS = [
  'What it is',
  'When it happened',
  'Who was involved',
  'Why it was important to you',
];

const DEV_FOLLOW_UP_RESPONSES = [
  "That's very interesting. Can you tell me more about that?",
  'I see. And how does that make you feel?',
  'Good. Now, let me ask you about something else.',
  'Thank you for sharing that. What would you say is the most important aspect?',
  "Excellent response. Let's continue with the next question.",
];

const EXAMINER_ACKNOWLEDGEMENTS = {
  1: ['Thank you.', 'I see.', 'All right.', 'Thank you for that.'],
  2: ['Thank you for your response.'],
  3: ['Thank you.', 'That is an interesting point.', 'I see.', 'Thank you for explaining that.'],
};

export const PART_TWO_PREP_MESSAGE =
  "Now it's time for Part 2, the Individual Long Turn. I'm going to give you a topic and I'd like you to talk about it for 1 to 2 minutes. Before you talk, you'll have one minute to think about what you're going to say. Here's your topic card.";

export function formatIeltsQuestion(text = '') {
  return String(text || '')
    .replace(/\[\s*Why\s*\/\s*Why\s*not\s*\?*\]/gi, '(Why or why not?)')
    .replace(/\(\s*Why\s*\/\s*Why\s*not\s*\?*\)/gi, '(Why or why not?)')
    .replace(/Why\s*\/\s*Why\s*not/gi, 'Why or why not');
}

export function getQuestionLines(questions = '') {
  return String(questions || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildInitialSpeakingConversation({ greeting, currentPart }) {
  const firstQuestion =
    getQuestionLines(currentPart?.questions)[0] || "Let's begin. Can you tell me about yourself?";

  return [
    ...(greeting ? [{ speaker: 'ai', text: greeting }] : []),
    { speaker: 'ai', text: formatIeltsQuestion(firstQuestion) },
  ];
}

export function buildSpeakingResumeState({
  conversation,
  currentQuestionIndex,
  currentPart,
  isPart2Prep = false,
}) {
  const savedConversation = normalizeSavedConversation(conversation);
  const questionLines = getQuestionLines(currentPart?.questions).map(formatIeltsQuestion);
  const indexState = normalizeResumeQuestionIndex(currentQuestionIndex, questionLines.length);

  if (isPart2Prep) {
    return buildPartTwoPrepResumeState(savedConversation, indexState.wasNormalized);
  }

  const repair = buildQuestionResumeRepair({
    savedConversation,
    questionLines,
    normalizedQuestionIndex: indexState.value,
  });

  return {
    conversation: repair.conversation,
    currentQuestionIndex: repair.questionIndex,
    ...(repair.resumePrompt ? { resumePrompt: repair.resumePrompt } : {}),
    ...(repair.isPartComplete ? { isPartComplete: true } : {}),
    repaired:
      repair.wasChanged ||
      indexState.wasNormalized ||
      savedConversation.length !== (Array.isArray(conversation) ? conversation.length : 0),
  };
}

function normalizeSavedConversation(conversation) {
  if (!Array.isArray(conversation)) return [];

  return conversation.filter(
    (entry) =>
      entry &&
      !entry.isLoading &&
      (entry.speaker === 'ai' || entry.speaker === 'user') &&
      typeof entry.text === 'string' &&
      entry.text.trim()
  );
}

function normalizeResumeQuestionIndex(currentQuestionIndex, questionCount) {
  const parsed = Number(currentQuestionIndex);
  const isValid = Number.isInteger(parsed) && parsed >= 0;
  const value = isValid ? Math.min(parsed, Math.max(questionCount - 1, 0)) : 0;
  return { value, wasNormalized: !isValid || value !== parsed };
}

function buildPartTwoPrepResumeState(savedConversation, questionIndexWasNormalized) {
  const conversation =
    savedConversation.length > 0
      ? savedConversation
      : [{ speaker: 'ai', text: PART_TWO_PREP_MESSAGE }];

  return {
    conversation,
    currentQuestionIndex: 0,
    repaired: conversation.length !== savedConversation.length || questionIndexWasNormalized,
  };
}

function buildQuestionResumeRepair({ savedConversation, questionLines, normalizedQuestionIndex }) {
  const questionState = inferResumeQuestionState({
    savedConversation,
    questionLines,
    normalizedQuestionIndex,
  });
  const currentQuestion =
    questionLines[questionState.questionIndex] ||
    questionLines[0] ||
    "Let's continue with your speaking test.";
  const alreadyContainsCurrentQuestion = hasExaminerQuestion(savedConversation, currentQuestion);
  const resumePrompt = shouldRestoreResumePrompt({
    savedConversation,
    currentQuestion,
    alreadyContainsCurrentQuestion,
    questionState,
  });
  const conversation = resumePrompt
    ? [...savedConversation, { speaker: 'ai', text: currentQuestion }]
    : savedConversation;

  return {
    conversation,
    questionIndex: questionState.questionIndex,
    resumePrompt,
    isPartComplete: questionState.isPartComplete,
    wasChanged:
      conversation.length !== savedConversation.length ||
      questionState.questionIndex !== normalizedQuestionIndex ||
      questionState.isPartComplete,
  };
}

function inferResumeQuestionState({ savedConversation, questionLines, normalizedQuestionIndex }) {
  const answerNeedsFollowUp = savedConversation.at(-1)?.speaker === 'user';
  const lastAskedQuestionIndex = findLastAskedQuestionIndex(savedConversation, questionLines);
  const canAdvanceFromAnswer = answerNeedsFollowUp && lastAskedQuestionIndex >= 0;
  const inferredQuestionIndex = canAdvanceFromAnswer
    ? lastAskedQuestionIndex + 1
    : normalizedQuestionIndex;
  const isPartComplete =
    answerNeedsFollowUp &&
    questionLines.length > 0 &&
    inferredQuestionIndex >= questionLines.length;
  const questionIndex = isPartComplete
    ? normalizedQuestionIndex
    : Math.min(
        Math.max(normalizedQuestionIndex, inferredQuestionIndex),
        Math.max(questionLines.length - 1, 0)
      );

  return { answerNeedsFollowUp, isPartComplete, questionIndex };
}

function shouldRestoreResumePrompt({
  savedConversation,
  currentQuestion,
  alreadyContainsCurrentQuestion,
  questionState,
}) {
  if (questionState.isPartComplete || alreadyContainsCurrentQuestion) return null;

  const needsPrompt =
    savedConversation.length === 0 ||
    questionState.answerNeedsFollowUp ||
    !hasUserResponse(savedConversation);
  return needsPrompt ? currentQuestion : null;
}

function hasExaminerQuestion(conversation, question) {
  return conversation.some(
    (entry) => entry.speaker === 'ai' && formatIeltsQuestion(entry.text).trim() === question
  );
}

function hasUserResponse(conversation) {
  return conversation.some((entry) => entry.speaker === 'user');
}

function findLastAskedQuestionIndex(conversation, questionLines) {
  for (let entryIndex = conversation.length - 1; entryIndex >= 0; entryIndex -= 1) {
    const entry = conversation[entryIndex];
    if (entry?.speaker !== 'ai') continue;

    const examinerText = formatIeltsQuestion(entry.text).trim();
    const questionIndex = questionLines.findLastIndex(
      (question) => examinerText === question || examinerText.endsWith(question)
    );
    if (questionIndex >= 0) return questionIndex;
  }

  return -1;
}

export function buildConversationHistory(conversation = []) {
  return conversation
    .filter((entry) => !entry.isLoading)
    .map((entry) => ({
      speaker: entry.speaker === 'ai' ? 'model' : 'user',
      text: entry.text,
    }));
}

export function isTranscriptError(transcript) {
  return (
    !transcript ||
    transcript.includes('(Unable to transcribe') ||
    transcript.includes('(Audio received but transcription failed)') ||
    transcript.includes('(Inaudible)')
  );
}

export function buildPartContexts(allParts = {}) {
  return Object.fromEntries(
    Object.entries(allParts).map(([part, data]) => [
      part,
      { title: data?.title || '', questions: data?.questions || '' },
    ])
  );
}

function extractQuestionText(question) {
  if (typeof question === 'string') return question;
  return question?.text || question?.question;
}

function parseCueCardJson(questionsText) {
  try {
    const parsed = JSON.parse(questionsText);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(extractQuestionText).filter(Boolean);
  } catch {
    return null;
  }
}

function resolveCueCardBullets(questionsText) {
  const jsonBullets = parseCueCardJson(questionsText);
  return jsonBullets || getQuestionLines(questionsText);
}

export function buildCueCardTopic(part) {
  const topicText = part?.title || 'Describe a topic';
  const questionsText = part?.questions || '';
  const bulletPoints = resolveCueCardBullets(questionsText);

  return {
    title: topicText,
    bulletPoints: bulletPoints.length > 0 ? bulletPoints : FALLBACK_CUE_CARD_POINTS,
  };
}

export function buildExpectedExaminerResponse({
  currentPartNumber,
  currentQuestionIndex,
  nextQuestion,
  isLastQuestion,
}) {
  if (isLastQuestion) {
    const farewells = {
      1: 'Thank you. That concludes Part 1 of the speaking test.',
      2: 'Thank you for your response. That brings us to the end of Part 2.',
      3: 'Thank you very much. That concludes the speaking test.',
    };
    return farewells[currentPartNumber] || `Thank you. That concludes Part ${currentPartNumber}.`;
  }

  const options = EXAMINER_ACKNOWLEDGEMENTS[currentPartNumber] || EXAMINER_ACKNOWLEDGEMENTS[1];
  const acknowledgement = options[Math.abs(currentQuestionIndex) % options.length];
  const cleanQuestion = formatIeltsQuestion(nextQuestion || '').trim();
  return cleanQuestion ? `${acknowledgement} ${cleanQuestion}` : acknowledgement;
}

function getDevFollowUp({ isLastQuestion, nextQuestion, currentQuestionIndex, currentPartNumber }) {
  if (isLastQuestion) {
    return `That concludes Part ${currentPartNumber}. Well done! You've completed this section.`;
  }

  const ack = DEV_FOLLOW_UP_RESPONSES[currentQuestionIndex % DEV_FOLLOW_UP_RESPONSES.length];
  return nextQuestion ? `${ack} ${nextQuestion}` : ack;
}

function buildDevEvaluation(isLastQuestion) {
  if (!isLastQuestion) return null;

  return {
    fluency: 6.5,
    lexical: 6.5,
    grammar: 6.5,
    pronunciation: 6.5,
    overallBand: 6.5,
    isFallback: true,
    feedback: 'Mock evaluation for local development.',
    strengths: ['Good attempt at practicing'],
    improvements: ['Deploy to production for accurate evaluation'],
  };
}

export function buildLocalDevSpeakingResponse({
  currentPart,
  currentPartNumber,
  currentQuestionIndex,
}) {
  const questionLines = getQuestionLines(currentPart?.questions);
  const actualTotalQuestions = questionLines.length || 4;
  const isLastQuestion = currentQuestionIndex >= actualTotalQuestions - 1;
  const nextQuestion = isLastQuestion ? null : questionLines[currentQuestionIndex + 1] || null;
  const followUp = getDevFollowUp({
    isLastQuestion,
    nextQuestion,
    currentQuestionIndex,
    currentPartNumber,
  });

  return {
    success: true,
    userTranscript: '(Your response was recorded)',
    examinerResponse: followUp,
    nextQuestionIndex: isLastQuestion ? -1 : currentQuestionIndex + 1,
    isPartComplete: isLastQuestion,
    totalQuestions: actualTotalQuestions,
    evaluation: buildDevEvaluation(isLastQuestion),
  };
}

const getPartNumberFromEvaluationKey = (key, fallbackIndex) => {
  const matchedPart = String(key).match(/(?:part)?[_\s-]*([1-3])$/i);
  if (matchedPart) return Number(matchedPart[1]);
  return fallbackIndex + 1;
};

const getEvaluationEntries = (evaluations) => {
  if (Array.isArray(evaluations))
    return evaluations.map((evaluation, index) => [index + 1, evaluation]);
  if (evaluations && typeof evaluations === 'object') return Object.entries(evaluations);
  return [];
};

const buildHistoricalPartScores = (entries) => {
  const partScores = {};

  entries.forEach(([key, evaluation], index) => {
    const partNumber = getPartNumberFromEvaluationKey(key, index);
    if (!evaluation || partNumber < 1 || partNumber > 3 || partScores[`part${partNumber}`]) return;

    const band = Number(evaluation.overallBand);
    if (!Number.isFinite(band)) return;

    partScores[`part${partNumber}`] = {
      band,
      keyObservation: evaluation.feedback || '',
    };
  });

  return partScores;
};

export function buildAverageSpeakingEvaluation(evaluations = []) {
  const evaluationEntries = getEvaluationEntries(evaluations);
  const validEvaluations = evaluationEntries.map(([, evaluation]) => evaluation).filter(Boolean);
  if (validEvaluations.length === 0) return null;

  const average = (field) =>
    validEvaluations.reduce((total, evaluation) => total + (Number(evaluation?.[field]) || 0), 0) /
    validEvaluations.length;

  return {
    fluency: average('fluency'),
    lexical: average('lexical'),
    grammar: average('grammar'),
    pronunciation: average('pronunciation'),
    overallBand: average('overallBand'),
    feedback: validEvaluations[validEvaluations.length - 1]?.feedback || '',
    strengths: validEvaluations.flatMap((evaluation) => evaluation.strengths || []).slice(0, 3),
    improvements: validEvaluations
      .flatMap((evaluation) => evaluation.improvements || [])
      .slice(0, 3),
    partScores: buildHistoricalPartScores(evaluationEntries),
  };
}

export function buildLegacySpeakingEvaluation(score) {
  const band = Number(score) || 0;
  return {
    overallBand: band,
    fluency: null,
    lexical: null,
    grammar: null,
    pronunciation: null,
    assessmentStatus: 'legacy',
    feedback: 'Detailed criterion breakdown was not saved for this session.',
    strengths: [],
    improvements: [],
    partScores: {},
  };
}
