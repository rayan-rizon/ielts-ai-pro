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

export function buildAverageSpeakingEvaluation(evaluations = []) {
  const validEvaluations = evaluations.filter(Boolean);
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
