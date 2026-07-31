import React from 'react';
import { motion } from 'framer-motion';
import { ITEM_VARIANTS } from '../constants';
import RecentPracticeHistory from './RecentPracticeHistory';
import ProgressTrendCard from './PerformanceTrends/ProgressTrendCard';
import QuestionSuccessCard from './PerformanceTrends/QuestionSuccessCard';
import SmartFeedbackCard from './PerformanceTrends/SmartFeedbackCard';
import ErrorAudit from './ErrorAudit';

export default function PerformanceTrends({
  stats,
  chartData,
  isPremium,
  activeTab,
  setActiveTab,
  tabs,
  onTabKeyDown,
  tabsRef,
  user,
  onDrilldown,
}) {
  if (!stats || !chartData) return null;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Side-by-side Progress Trend & Recent Practice History */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <motion.div variants={ITEM_VARIANTS} className="h-full">
            <ProgressTrendCard
              chartData={chartData}
              isPremium={isPremium}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabs={tabs}
              onTabKeyDown={onTabKeyDown}
              tabsRef={tabsRef}
              targetScore={stats?.targetScore}
            />
          </motion.div>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <RecentPracticeHistory sessions={chartData.recentPractice || []} user={user} />
        </div>
      </div>

      {/* 3 Cards in a Row: Question Success Rate, Smart Feedback, Answer Analysis */}
      <motion.div variants={ITEM_VARIANTS}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Question Types */}
          <QuestionSuccessCard stats={stats} />

          {/* Smart Feedback */}
          <SmartFeedbackCard stats={stats} isPremium={isPremium} />

          {/* Answer Analysis */}
          <ErrorAudit
            data={stats?.enhancedMetrics?.errorAuditData}
            sessionReferences={stats?.enhancedMetrics?.sessionReferences}
            onDrilldown={onDrilldown}
          />
        </div>
      </motion.div>
    </div>
  );
}
