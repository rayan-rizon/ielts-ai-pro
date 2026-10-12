import React from 'react';
import DeepDivePopover from '@/features/testing/reading/components/DeepDivePopover';

export default function InlineDeepDive({
  isFinished,
  explanationData,
  keyNumber,
  itemKey,
  openDeepDive,
  setOpenDeepDive,
  questionType,
  userAnswer,
}) {
  if (!isFinished || !explanationData) return null;
  const actualKey = explanationData.blanks?.[keyNumber] ? keyNumber : null;
  if (!actualKey && explanationData.blanks) return null;

  return (
    <DeepDivePopover
      explanationData={explanationData}
      userAnswer={userAnswer}
      isOpen={openDeepDive === itemKey}
      onToggle={() => setOpenDeepDive?.(openDeepDive === itemKey ? null : itemKey)}
      questionType={questionType}
      blankKey={actualKey}
      questionNumber={keyNumber}
      inline={true}
    />
  );
}
