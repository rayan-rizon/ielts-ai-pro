import { useMemo } from 'react';
import { getPassageQuestions, calculateInitialQuestionCounter } from './passageFilter';
import { buildAnswerEntriesForQuestion } from './entryBuilders';

export { checkAnswer, resolveCorrectAnswer, formatAnswerValue } from './answerResolver';
export {
  getPassageQuestions,
  countQuestionBlanks,
  calculateInitialQuestionCounter,
} from './passageFilter';
export { buildAnswerEntriesForQuestion } from './entryBuilders';

export function useReadingTestSheetEntries(allQuestions, testData, currentPassageIndex) {
  return useMemo(() => {
    const passageQuestions = getPassageQuestions(allQuestions, testData, currentPassageIndex);
    if (!passageQuestions.length) return [];

    let questionCounter = calculateInitialQuestionCounter(
      allQuestions,
      testData,
      currentPassageIndex
    );
    const allEntries = [];

    passageQuestions.forEach((q) => {
      const baseQuestionNumber = q.question_number || q.question_start || questionCounter + 1;
      const questionEntries = buildAnswerEntriesForQuestion(q, baseQuestionNumber);
      allEntries.push(...questionEntries);
      questionCounter += questionEntries.length;
    });

    return allEntries;
  }, [allQuestions, testData, currentPassageIndex]);
}
