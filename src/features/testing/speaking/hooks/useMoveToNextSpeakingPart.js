import { useCallback, useRef } from 'react';

import {
  buildCueCardTopic,
  formatIeltsQuestion,
  getQuestionLines,
  PART_TWO_PREP_MESSAGE,
} from '../utils/speakingTestUtils';

export default function useMoveToNextSpeakingPart(options) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  return useCallback(() => moveToNextSpeakingPart(optionsRef.current), []);
}

async function moveToNextSpeakingPart(context) {
  const currentConversation = context.conversation.filter((entry) => !entry.isLoading);
  const nextAllPartsConversation = {
    ...context.allPartsConversation,
    [context.currentPartNumber]: currentConversation,
  };
  context.setAllPartsConversation(nextAllPartsConversation);

  const nextPartNumber = context.currentPartNumber + 1;
  const nextPart = context.allParts[nextPartNumber];
  if (!nextPart) {
    await context.requestFinalEvaluation(nextAllPartsConversation);
    return;
  }

  resetPartState({ ...context, nextPart, nextPartNumber });
  const transitionContext = {
    ...context,
    currentConversation,
    nextAllPartsConversation,
    nextPart,
    nextPartNumber,
  };
  if (nextPartNumber === 2) {
    startPartTwoPreparation(transitionContext);
    return;
  }
  startDiscussionPart(transitionContext);
}

function resetPartState({
  nextPart,
  nextPartNumber,
  setCurrentPartNumber,
  setCurrentQuestionIndex,
  setIsPartComplete,
  setTimeLeft,
  timerExpiredRef,
}) {
  setCurrentPartNumber(nextPartNumber);
  setTimeLeft(nextPart.duration * 60);
  setCurrentQuestionIndex(0);
  setIsPartComplete(false);
  timerExpiredRef.current = false;
}

function startPartTwoPreparation({
  currentConversation,
  currentPartNumber,
  nextAllPartsConversation,
  nextPart,
  nextPartNumber,
  saveSessionProgress,
  session,
  setConversation,
  setCueCardTopic,
  setIsPart2Prep,
  setPrepTimeLeft,
  speakText,
}) {
  setIsPart2Prep(true);
  setPrepTimeLeft(60);

  const cueCardTopic = buildCueCardTopic(nextPart);
  const message = PART_TWO_PREP_MESSAGE;

  setCueCardTopic(cueCardTopic);
  setConversation([{ speaker: 'ai', text: message }]);
  speakText(message);
  saveNextPartProgress({
    currentConversation,
    currentPartNumber,
    nextAllPartsConversation,
    nextPartNumber,
    nextConversation: [{ speaker: 'ai', text: message }],
    saveSessionProgress,
    session,
    contentData: {
      isPart2Prep: true,
      prepTimeLeft: 60,
      cueCardTopic,
    },
  });
}

function startDiscussionPart({
  currentConversation,
  currentPartNumber,
  nextAllPartsConversation,
  nextPart,
  nextPartNumber,
  requestAutoStart,
  saveSessionProgress,
  session,
  setConversation,
  setCurrentQuestionIndex,
  speakText,
}) {
  const message = `Excellent! Now let's move on to Part ${nextPartNumber}: "${nextPart.title}". Listen to the question, then your microphone will start automatically.`;

  const questionLines = getQuestionLines(nextPart.questions);
  const firstQuestion = questionLines.length > 0 ? formatIeltsQuestion(questionLines[0]) : null;
  setConversation([
    { speaker: 'ai', text: message },
    ...(firstQuestion ? [{ speaker: 'ai', text: firstQuestion }] : []),
  ]);
  setCurrentQuestionIndex(0);
  void speakDiscussionStart({ firstQuestion, message, requestAutoStart, speakText });

  saveNextPartProgress({
    currentConversation,
    currentPartNumber,
    nextAllPartsConversation,
    nextPartNumber,
    nextConversation: [
      { speaker: 'ai', text: message },
      ...(firstQuestion ? [{ speaker: 'ai', text: firstQuestion }] : []),
    ],
    saveSessionProgress,
    session,
    contentData: {
      isPart2Prep: false,
      prepTimeLeft: null,
      cueCardTopic: null,
    },
  });
}

async function speakDiscussionStart({ firstQuestion, message, requestAutoStart, speakText }) {
  await speakText(message);
  if (firstQuestion) await speakText(firstQuestion);
  requestAutoStart?.();
}

function saveNextPartProgress({
  currentConversation,
  currentPartNumber,
  nextAllPartsConversation,
  nextPartNumber,
  nextConversation,
  saveSessionProgress,
  session,
  contentData = {},
}) {
  saveSessionProgress({
    answers: { conversation: nextConversation, currentQuestionIndex: 0 },
    content_data: {
      ...session?.content_data,
      currentPart: nextPartNumber,
      allPartsConversation: {
        ...nextAllPartsConversation,
        [currentPartNumber]: currentConversation,
      },
      isPartComplete: false,
      ...contentData,
    },
  });
}
