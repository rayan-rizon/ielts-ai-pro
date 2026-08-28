import { useCallback, useRef } from 'react';

import {
  buildCueCardTopic,
  formatIeltsQuestion,
  getQuestionLines,
  PART_TWO_PREP_MESSAGE,
} from '../utils/speakingTestUtils';

export default function useMoveToNextSpeakingPart(options) {
  const optionsRef = useRef(options);
  const transitionIdRef = useRef(0);
  optionsRef.current = options;
  return useCallback(() => {
    const transitionId = ++transitionIdRef.current;
    return moveToNextSpeakingPart(optionsRef.current, () => {
      return (
        transitionIdRef.current === transitionId &&
        optionsRef.current.isMountedRef?.current !== false
      );
    });
  }, []);
}

async function moveToNextSpeakingPart(context, isTransitionCurrent = () => true) {
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
    startPartTwoPreparation({ ...transitionContext, isTransitionCurrent });
    return;
  }
  startDiscussionPart({ ...transitionContext, isTransitionCurrent });
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
  setIsPart2Intro,
  setIsPart2Prep,
  setPrepTimeLeft,
  speakText,
  isTransitionCurrent,
}) {
  setIsPart2Intro(true);
  setIsPart2Prep(false);
  setPrepTimeLeft(60);

  const cueCardTopic = buildCueCardTopic(nextPart);
  const message = PART_TWO_PREP_MESSAGE;

  setCueCardTopic(null);
  setConversation([{ speaker: 'ai', text: message }]);
  saveNextPartProgress({
    currentConversation,
    currentPartNumber,
    nextAllPartsConversation,
    nextPartNumber,
    nextConversation: [{ speaker: 'ai', text: message }],
    saveSessionProgress,
    session,
    contentData: {
      isPart2Intro: true,
      isPart2Prep: false,
      prepTimeLeft: null,
      cueCardTopic: null,
    },
  });

  void finishPartTwoIntroduction({
    cueCardTopic,
    currentConversation,
    currentPartNumber,
    nextAllPartsConversation,
    nextPartNumber,
    saveSessionProgress,
    session,
    setCueCardTopic,
    setIsPart2Intro,
    setIsPart2Prep,
    setPrepTimeLeft,
    speakText,
    isTransitionCurrent,
  });
}

async function finishPartTwoIntroduction({
  cueCardTopic,
  currentConversation,
  currentPartNumber,
  nextAllPartsConversation,
  nextPartNumber,
  saveSessionProgress,
  session,
  setCueCardTopic,
  setIsPart2Intro,
  setIsPart2Prep,
  setPrepTimeLeft,
  speakText,
  isTransitionCurrent,
}) {
  await Promise.resolve(speakText(PART_TWO_PREP_MESSAGE));
  if (!isTransitionCurrent()) return;
  setCueCardTopic(cueCardTopic);
  setPrepTimeLeft(60);
  setIsPart2Intro(false);
  setIsPart2Prep(true);
  saveNextPartProgress({
    currentConversation,
    currentPartNumber,
    nextAllPartsConversation,
    nextPartNumber,
    nextConversation: [{ speaker: 'ai', text: PART_TWO_PREP_MESSAGE }],
    saveSessionProgress,
    session,
    contentData: {
      isPart2Intro: false,
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
  isTransitionCurrent,
}) {
  const message = `Excellent! Now let's move on to Part ${nextPartNumber}: "${nextPart.title}". Listen to the question, then your microphone will start automatically.`;

  const questionLines = getQuestionLines(nextPart.questions);
  const firstQuestion = questionLines.length > 0 ? formatIeltsQuestion(questionLines[0]) : null;
  setConversation([{ speaker: 'ai', text: message }]);
  setCurrentQuestionIndex(0);
  void speakDiscussionStart({
    firstQuestion,
    message,
    requestAutoStart,
    setConversation,
    speakText,
    isTransitionCurrent,
  });

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
      isPart2Intro: false,
      prepTimeLeft: null,
      cueCardTopic: null,
    },
  });
}

async function speakDiscussionStart({
  firstQuestion,
  message,
  requestAutoStart,
  setConversation,
  speakText,
  isTransitionCurrent,
}) {
  await speakText(message);
  if (!isTransitionCurrent()) return;
  if (firstQuestion) {
    setConversation((current) =>
      current.some((entry) => entry.speaker === 'ai' && entry.text === firstQuestion)
        ? current
        : [...current, { speaker: 'ai', text: firstQuestion }]
    );
    await speakText(firstQuestion);
    if (!isTransitionCurrent()) return;
  }
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
