import React from 'react';
import { motion } from 'framer-motion';
import { HeroScoreCard } from './HeroScoreCard';
import { TargetMilestoneCard } from './TargetMilestoneCard';
import { QuestionTypeBreakdown } from './QuestionTypeBreakdown';
import { PassageBreakdownCard } from './PassageBreakdownCard';
import { AnswerKeySection } from './AnswerKeySection';

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
      className="p-3 sm:p-4 max-w-[1400px] mx-auto space-y-3"
    >
      {/* Top Row: Hero Score Card (Left) + Path to Milestone Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
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

      {/* Middle Row: Question Type Breakdown */}
      <QuestionTypeBreakdown testResults={testResults} />

      {/* Bottom Row: Passage Breakdown (Left) + Answer Key Review Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <PassageBreakdownCard
            testResults={testResults}
            testType={testType}
            onReviewAnswers={onReviewAnswers}
          />
        </div>
        <div className="lg:col-span-7 flex flex-col">
          <AnswerKeySection
            testResults={testResults}
            onNavigateToQuestion={onNavigateToQuestion}
            onReviewAnswers={onReviewAnswers}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default OverviewTab;
