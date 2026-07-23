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
  speakText,
}) {
  return useCallback(() => {
    setIsPart2Prep(false);
    setCueCardTopic(null);

    const message =
      'Alright, your preparation time is up. Please start speaking now. Remember, you should talk for 1 to 2 minutes.';
    const messagePromise = speakText(message);
    setConversation([{ speaker: 'ai', text: message }]);

    const questionLines = getQuestionLines(currentPart?.questions);
    const firstQuestion = questionLines.length > 0 ? formatIeltsQuestion(questionLines[0]) : null;
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

    if (questionLines.length > 0) {
      messagePromise.then(() => {
        setConversation((prev) => [...prev, { speaker: 'ai', text: firstQuestion }]);
        speakText(firstQuestion);
        setCurrentQuestionIndex(0);
      });
    }
  }, [
    currentPart?.questions,
    setConversation,
    setCueCardTopic,
    setCurrentQuestionIndex,
    setIsPart2Prep,
    saveSessionProgress,
    session?.content_data,
    speakText,
  ]);
}
