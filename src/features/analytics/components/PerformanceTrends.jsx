import React from 'react';
import { motion } from 'framer-motion';
import { ITEM_VARIANTS } from '../constants';
import RecentPracticeHistory from './RecentPracticeHistory';
import ProgressTrendCard from './PerformanceTrends/ProgressTrendCard';
import ModuleMasteryCard from './PerformanceTrends/ModuleMasteryCard';
import QuestionSuccessCard from './PerformanceTrends/QuestionSuccessCard';
import SmartFeedbackCard from './PerformanceTrends/SmartFeedbackCard';

export default function PerformanceTrends({
  stats,
  radarData,
  chartData,
  isPremium,
  activeTab,
  setActiveTab,
  tabs,
  onTabKeyDown,
  tabsRef,
  user,
}) {
  if (!stats || !chartData) return null;

  return (
    <div className="space-y-6 lg:space-y-8" data-oid="ez4903f">
      {/* Side-by-side Progress Trend & Recent Practice History */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid="7-3vqly">
            <ProgressTrendCard
              chartData={chartData}
              isPremium={isPremium}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabs={tabs}
              onTabKeyDown={onTabKeyDown}
              tabsRef={tabsRef}
            />
          </motion.div>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <RecentPracticeHistory sessions={chartData.recentPractice || []} user={user} />
        </div>
      </div>

      <motion.div variants={ITEM_VARIANTS} data-oid="1atf515">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6" data-oid="pj.2q8p">
          {/* Module skill progress radar */}
          <ModuleMasteryCard radarData={radarData} />

          {/* Question Types */}
          <QuestionSuccessCard stats={stats} />

          {/* Deep Insights (Pro) */}
          <SmartFeedbackCard stats={stats} isPremium={isPremium} />
        </div>
      </motion.div>
    </div>
  );
}
