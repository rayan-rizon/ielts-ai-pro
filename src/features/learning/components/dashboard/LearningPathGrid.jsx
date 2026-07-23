import React from 'react';
import { m } from 'framer-motion';
import CoachBrief from './CoachBrief';
import WeekSchedule from './WeekSchedule';
import BandGapBreakdown from './BandGapBreakdown';
import ReviewQueue from './ReviewQueue';
import RecommendedPractice from './RecommendedPractice';
import MistakeAnalysis from './MistakeAnalysis';
import WeakSkillSpotlight from './WeakSkillSpotlight';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

export function LearningPathGrid({
  isLoading,
  dailyFocus,
  stats,
  targetBand,
  daysLeft,
  completedCount,
  totalActivities,
  dueReviewSkills,
  completionPercent,
  timerState,
  handleTimerToggle,
  handleRefreshDaily,
  todaysTasks,
  handleSelectToday,
  handleStartTopTask,
  selectedDayIndex,
  setSelectedDayIndex,
  currentDayTasks,
  activityByKey,
  handleTaskToggle,
  handleQuickComplete,
  skillIndex,
  bandGaps,
  learningPath,
  mistakePatterns,
  spotlightSkills,
}) {
  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-max items-start">
      <m.div
        variants={itemVariants}
        className="col-span-12 lg:col-span-8 self-stretch flex flex-col"
      >
        <CoachBrief
          dailyFocus={dailyFocus}
          loading={isLoading}
          hasHistory={(stats?.totalTests || 0) > 0}
          targetBand={targetBand}
          daysLeft={daysLeft}
          completedCount={completedCount}
          totalActivities={totalActivities}
          dueReviewCount={dueReviewSkills.length}
          completionPercent={completionPercent}
          timerState={timerState}
          onTimerToggle={handleTimerToggle}
          onRefresh={handleRefreshDaily}
          todaysTasks={todaysTasks}
          onSelectToday={handleSelectToday}
          onStartTopTask={handleStartTopTask}
        />
      </m.div>

      <m.div variants={itemVariants} className="col-span-12 lg:col-span-8 space-y-4">
        <WeekSchedule
          selectedDayIndex={selectedDayIndex}
          setSelectedDayIndex={setSelectedDayIndex}
          currentTasks={currentDayTasks}
          activityByKey={activityByKey}
          onToggleTask={handleTaskToggle}
          onQuickComplete={handleQuickComplete}
          skillIndex={skillIndex}
          className="p-3 sm:p-4 md:p-5"
          loading={isLoading}
        />
        <BandGapBreakdown
          bandGaps={bandGaps}
          targetBand={targetBand}
          className="p-3 sm:p-4 md:p-5"
          loading={isLoading}
        />
      </m.div>

      <m.div variants={itemVariants} className="col-span-12 lg:col-span-4 space-y-4">
        <ReviewQueue
          dueReviewSkills={dueReviewSkills}
          setSelectedDayIndex={setSelectedDayIndex}
          className="p-3 sm:p-4 md:p-5"
          loading={isLoading}
        />
        <RecommendedPractice
          learningPath={learningPath}
          className="p-3 sm:p-4 md:p-5"
          loading={isLoading}
          compact={true}
        />
        <MistakeAnalysis
          mistakePatterns={mistakePatterns.slice(0, 2)}
          onSelectToday={handleSelectToday}
          className="p-3 sm:p-4 md:p-5"
          loading={isLoading}
        />
      </m.div>

      {(isLoading || spotlightSkills.length > 0) && (
        <m.div variants={itemVariants} className="col-span-12">
          <WeakSkillSpotlight
            spotlightSkills={spotlightSkills}
            className="p-3 sm:p-4 md:p-6"
            loading={isLoading}
          />
        </m.div>
      )}
    </div>
  );
}
