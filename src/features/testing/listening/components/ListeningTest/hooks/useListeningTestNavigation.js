import React, { useEffect, useCallback } from 'react';
import { calculateListeningStats } from '../utils/listeningStats';

export function useListeningTestNavigation({
  testData,
  questionsWithNumbers,
  activePart,
  answers,
  isFinished,
  dispatch,
  ACTIONS,
  showAnswerSheet,
  setShowAnswerSheet,
}) {
  // Computed Sections
  const displaySections = React.useMemo(() => {
    return Array.isArray(testData?.content)
      ? testData.content
      : testData?.audio_url
        ? [testData]
        : [];
  }, [testData]);

  const currentSection = React.useMemo(() => {
    return displaySections[activePart] || {};
  }, [displaySections, activePart]);

  // Section Questions Logic
  const sectionQuestions = React.useMemo(() => {
    if (!questionsWithNumbers) return [];
    return questionsWithNumbers.filter((q) => {
      const sectionNum = currentSection.section_number || activePart + 1;
      if (q.section !== undefined) return parseInt(q.section) === sectionNum;
      if (q.part_number !== undefined) return q.part_number === sectionNum;
      return activePart === 0;
    });
  }, [questionsWithNumbers, currentSection, activePart]);

  // Question Groups Memo
  const questionGroups = React.useMemo(() => {
    return sectionQuestions.reduce((groups, q) => {
      const lastGroup = groups[groups.length - 1];
      const currentInstr = q.group_instructions || '';
      const hasTitle = !!q.mcq_title;

      const isSameInstruction = (lastGroup?.instructions || '') === currentInstr;
      const canMergeGroup = Boolean(lastGroup && isSameInstruction && !hasTitle);

      if (canMergeGroup) {
        lastGroup.questions.push(q);
      } else {
        groups.push({
          instructions: currentInstr,
          mcq_title: q.mcq_title || '',
          questions: [q],
        });
      }
      return groups;
    }, []);
  }, [sectionQuestions]);

  // Click outside answer sheet
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isInline = isFinished && !isMobile;
    if (!showAnswerSheet || isInline) return;

    const handleClickOutside = (event) => {
      if (
        event.target.closest('#listening-answer-sheet') === null &&
        event.target.closest('#answer-sheet-toggle') === null
      ) {
        setShowAnswerSheet(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAnswerSheet, isFinished]);

  const handleNavigateToQuestion = useCallback(
    (questionNumber) => {
      dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: false });

      const targetQuestion = (questionsWithNumbers || []).find((q) => {
        return (
          questionNumber >= (q._displayStartNumber || 0) &&
          questionNumber <= (q._displayEndNumber || q._displayStartNumber || 0)
        );
      });

      if (targetQuestion) {
        const partIndex = displaySections.findIndex((sec, idx) => {
          const sectionNum = sec.section_number || idx + 1;
          if (targetQuestion.section !== undefined)
            return parseInt(targetQuestion.section) === sectionNum;
          if (targetQuestion.part_number !== undefined)
            return targetQuestion.part_number === sectionNum;
          return idx === 0;
        });

        if (partIndex !== -1 && partIndex !== activePart) {
          dispatch({ type: ACTIONS.SET_ACTIVE_PART, payload: partIndex });
        }

        setTimeout(() => {
          const el = document.getElementById(`question-${targetQuestion.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    },
    [dispatch, ACTIONS, questionsWithNumbers, displaySections, activePart]
  );

  // Stats for progress bar
  const stats = React.useMemo(
    () => calculateListeningStats(displaySections, questionsWithNumbers, answers),
    [displaySections, questionsWithNumbers, answers]
  );

  return {
    displaySections,
    currentSection,
    sectionQuestions,
    questionGroups,
    stats,
    handleNavigateToQuestion,
  };
}
