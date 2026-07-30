import { useCallback } from 'react';

import { formatIeltsQuestion, getQuestionLines } from '../utils/speakingTestUtils';

export default function useStartPartTwoSpeaking({
  currentPart,
  setConversation,
  setCueCardTopic,
  setCurrentQuestionIndex,
  setIsPart2Prep,
  saveSessionProgress,
  session,
  requestAutoStart,
  speakText,
}) {
  return useCallback(() => {
    setIsPart2Prep(false);
    setCueCardTopic(null);

    const message =
      'Alright, your preparation time is up. Please start speaking now. Remember, you should talk for 1 to 2 minutes.';
    const questionLines = getQuestionLines(currentPart?.questions);
    const firstQuestion = questionLines.length > 0 ? formatIeltsQuestion(questionLines[0]) : null;
    setConversation([{ speaker: 'ai', text: message }]);
    void speakPartTwoStart({
      firstQuestion,
      message,
      requestAutoStart,
      setConversation,
      speakText,
    });

    saveSessionProgress({
      answers: {
        conversation: [
          { speaker: 'ai', text: message },
          ...(firstQuestion ? [{ speaker: 'ai', text: firstQuestion }] : []),
        ],
        currentQuestionIndex: 0,
      },
      content_data: {
        ...session?.content_data,
        currentPart: 2,
        isPart2Prep: false,
        prepTimeLeft: null,
        cueCardTopic: null,
      },
    });

    setCurrentQuestionIndex(0);
  }, [
    currentPart?.questions,
    setConversation,
    setCueCardTopic,
    setCurrentQuestionIndex,
    setIsPart2Prep,
    saveSessionProgress,
    session?.content_data,
    requestAutoStart,
    speakText,
  ]);
}

async function speakPartTwoStart({
  firstQuestion,
  message,
  requestAutoStart,
  setConversation,
  speakText,
}) {
  await speakText(message);
  if (firstQuestion) {
    setConversation((current) =>
      current.some((entry) => entry.speaker === 'ai' && entry.text === firstQuestion)
        ? current
        : [...current, { speaker: 'ai', text: firstQuestion }]
    );
    await speakText(firstQuestion);
  }
  requestAutoStart?.();
}
