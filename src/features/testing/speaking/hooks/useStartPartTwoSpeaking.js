import { useCallback } from 'react';

import { formatIeltsQuestion, getQuestionLines } from '../utils/speakingTestUtils';

export default function useStartPartTwoSpeaking({
  currentPart,
  setConversation,
  setCueCardTopic,
  setCurrentQuestionIndex,
  setIsPart2Prep,
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
    if (questionLines.length > 0) {
      messagePromise.then(() => {
        const firstQuestion = formatIeltsQuestion(questionLines[0]);
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
    speakText,
  ]);
}
