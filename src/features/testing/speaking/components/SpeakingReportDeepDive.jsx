import React, { useState } from 'react';
import DeepDiveLoading from './DeepDiveLoading';
import DeepDivePartSection from './DeepDivePartSection';
import { DeepDiveHeader, DeepDiveErrorState, DeepDiveEmptyPrompt } from './DeepDiveStatusSections';

function useDeepDiveExpansion() {
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const toggleExpandAll = (hasFeedback) => {
    if (!hasFeedback) return;
    setIsAllExpanded((prev) => !prev);
    setExpandedQuestion(null);
  };

  const toggleQuestion = (globalIdx) => {
    if (isAllExpanded) {
      setIsAllExpanded(false);
      setExpandedQuestion(globalIdx);
    } else {
      setExpandedQuestion((prev) => (prev === globalIdx ? null : globalIdx));
    }
  };

  return { expandedQuestion, isAllExpanded, toggleExpandAll, toggleQuestion };
}

function DeepDiveContent({ detailedFeedback, isAllExpanded, expandedQuestion, onToggleQuestion }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000">
      {[1, 2, 3].map((partNumber) => (
        <DeepDivePartSection
          key={partNumber}
          partNumber={partNumber}
          partQuestions={detailedFeedback.filter((q) => q.part === partNumber)}
          detailedFeedback={detailedFeedback}
          isAllExpanded={isAllExpanded}
          expandedQuestion={expandedQuestion}
          onToggleQuestion={onToggleQuestion}
        />
      ))}
    </div>
  );
}

export default function SpeakingReportDeepDive({
  detailedFeedback,
  isGeneratingDetailed,
  deepDiveError,
  handleRetryDeepDive,
}) {
  const { expandedQuestion, isAllExpanded, toggleExpandAll, toggleQuestion } =
    useDeepDiveExpansion();

  const showError = deepDiveError && !isGeneratingDetailed && !detailedFeedback;
  const showEmptyPrompt = !deepDiveError && !isGeneratingDetailed && !detailedFeedback;

  return (
    <div className="mt-10 mb-6">
      <DeepDiveHeader
        detailedFeedback={detailedFeedback}
        isAllExpanded={isAllExpanded}
        onToggleExpandAll={() => toggleExpandAll(!!detailedFeedback)}
      />

      {isGeneratingDetailed && <DeepDiveLoading />}
      {showError && <DeepDiveErrorState onRetry={handleRetryDeepDive} />}
      {showEmptyPrompt && <DeepDiveEmptyPrompt onGenerate={handleRetryDeepDive} />}

      {detailedFeedback && (
        <DeepDiveContent
          detailedFeedback={detailedFeedback}
          isAllExpanded={isAllExpanded}
          expandedQuestion={expandedQuestion}
          onToggleQuestion={toggleQuestion}
        />
      )}
    </div>
  );
}
