import React from 'react';
import { motion } from 'framer-motion';
import { HeroScoreCard } from './HeroScoreCard';
import { TargetMilestoneCard } from './TargetMilestoneCard';
import { MarkLossCard } from './MarkLossCard';
import { AnswerKeySection } from './AnswerKeySection';

/**
 * Overview owns "what happened": the score, the gap to the next band, where the
 * marks went, and which questions they were.
 *
 * It used to carry two separate attribution cards — "Accuracy by question type"
 * and "Passage performance" — which the Analysis tab then restated as a type
 * loss grid and a card titled, identically, "Passage performance". Attribution
 * now lives here once, in `MarkLossCard`, which cross-tabulates the two so a
 * learner can see whether a weak type is weak everywhere or only in one
 * passage. The Analysis tab moved on to why the marks were lost.
 */
export const OverviewTab = ({
  testResults,
  _getAssessmentMessage,
  onReviewAnswers,
  testType,
  onNavigateToQuestion,
}) => {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="p-2.5 sm:p-3 max-w-[1400px] mx-auto space-y-2.5"
    >
      {/* Standing: the score, and what it would take to move it. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <HeroScoreCard testResults={testResults} />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <TargetMilestoneCard
            testResults={testResults}
            onReviewAnswers={onReviewAnswers}
            testType={testType}
          />
        </div>
      </div>

      {/* Attribution: every lost mark, by type and by section, in one place. */}
      <MarkLossCard
        testResults={testResults}
        testType={testType}
        onReviewAnswers={onReviewAnswers}
      />

      {/* Detail: the questions themselves. */}
      <AnswerKeySection
        testResults={testResults}
        onNavigateToQuestion={onNavigateToQuestion}
        onReviewAnswers={onReviewAnswers}
      />
    </motion.div>
  );
};

export default OverviewTab;
