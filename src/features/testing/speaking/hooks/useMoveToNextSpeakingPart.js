import { useCallback } from 'react';

import {
  buildCueCardTopic,
  formatIeltsQuestion,
  getQuestionLines,
  PART_TWO_PREP_MESSAGE,
} from '../utils/speakingTestUtils';

export default function useMoveToNextSpeakingPart({
  allParts,
  allPartsConversation,
  conversation,
  currentPartNumber,
  requestFinalEvaluation,
  saveSessionProgress,
  session,
  setAllPartsConversation,
  setConversation,
  setCueCardTopic,
  setCurrentPartNumber,
  setCurrentQuestionIndex,
  setIsPart2Prep,
  setIsPartComplete,
  setPrepTimeLeft,
  setTimeLeft,
  speakText,
  timerExpiredRef,
}) {
  return useCallback(async () => {
    const currentConversation = conversation.filter((entry) => !entry.isLoading);
    const nextAllPartsConversation = {
      ...allPartsConversation,
      [currentPartNumber]: currentConversation,
    };

    setAllPartsConversation(nextAllPartsConversation);

    const nextPartNumber = currentPartNumber + 1;
    const nextPart = allParts[nextPartNumber];

    if (!nextPart) {
      await requestFinalEvaluation(nextAllPartsConversation);
      return;
    }

    resetPartState({
      nextPart,
      nextPartNumber,
      setCurrentPartNumber,
      setCurrentQuestionIndex,
      setIsPartComplete,
      setTimeLeft,
      timerExpiredRef,
    });

    if (nextPartNumber === 2) {
      startPartTwoPreparation({
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
      });
      return;
    }

    startDiscussionPart({
      currentConversation,
      currentPartNumber,
      nextAllPartsConversation,
      nextPart,
      nextPartNumber,
      saveSessionProgress,
      session,
      setConversation,
      setCurrentQuestionIndex,
      speakText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPartNumber,
    conversation,
    allPartsConversation,
    allParts,
    speakText,
    saveSessionProgress,
    requestFinalEvaluation,
    session?.content_data,
  ]);
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
  saveSessionProgress,
  session,
  setConversation,
  setCurrentQuestionIndex,
  speakText,
}) {
  const message = `Excellent! Now let's move on to Part ${nextPartNumber}: "${nextPart.title}". Take a moment to prepare, then click the microphone when you're ready.`;
  const messagePromise = speakText(message);
  setConversation([{ speaker: 'ai', text: message }]);

  const questionLines = getQuestionLines(nextPart.questions);
  const firstQuestion = questionLines.length > 0 ? formatIeltsQuestion(questionLines[0]) : null;
  if (questionLines.length > 0) {
    messagePromise.then(() => {
      setConversation((prev) => [...prev, { speaker: 'ai', text: firstQuestion }]);
      speakText(firstQuestion);
      setCurrentQuestionIndex(0);
    });
  }

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
