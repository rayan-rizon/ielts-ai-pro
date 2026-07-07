import React from 'react';
import { motion } from 'framer-motion';
import { BandScoreHero } from './BandScoreHero';
import { QuickStatsGrid } from './QuickStatsGrid';
import { GuidanceMilestones } from './GuidanceMilestones';
import { PassagePerformanceSection } from './PassagePerformanceSection';
import { AnswerKeySection } from './AnswerKeySection';

export const OverviewTab = ({
  testResults,
  getAssessmentMessage,
  onReviewAnswers,
  testType,
  onNavigateToQuestion,
}) => {
  const wrongCount = Math.max(
    0,
    testResults.totalQuestions - testResults.correctAnswers - (testResults.unanswered || 0)
  );
  const unansweredCount = testResults.unanswered || 0;

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="p-4 lg:p-6 space-y-5"
      data-oid="qsbm9v."
    >
      {/* 1. Band Score Hero */}
      <BandScoreHero testResults={testResults} getAssessmentMessage={getAssessmentMessage} />

      {/* 2. Quick Stats Grid */}
      <QuickStatsGrid
        testResults={testResults}
        wrongCount={wrongCount}
        unansweredCount={unansweredCount}
      />

      {/* 3. Guidance & Milestones Grid */}
      <GuidanceMilestones testResults={testResults} testType={testType} />

      {/* 4. Passage Performance Section */}
      <PassagePerformanceSection testResults={testResults} testType={testType} />

      {/* 5. Quick Answer Key Map */}
      <AnswerKeySection
        testResults={testResults}
        onNavigateToQuestion={onNavigateToQuestion}
        onReviewAnswers={onReviewAnswers}
      />
    </motion.div>
  );
};
