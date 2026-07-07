import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';
import useLearningPathData from '@/features/learning/hooks/useLearningPathData';
import { useLearningPathDerivedData } from '@/features/learning/hooks/useLearningPathDerivedData';
import DocumentHead from '@/components/shared/DocumentHead';

import {
  usePathStrategy,
  useTaskActions,
  usePathNavigation,
} from '@/features/learning/hooks/useLearningPathHandlers';

// Components
import { LearningPathHeader } from '@/features/learning/components/dashboard/LearningPathHeader';
import { LearningPathGrid } from '@/features/learning/components/dashboard/LearningPathGrid';

// --- Animation variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};

const LearningPath = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { learningPath, stats, skillMap, isLoading, activityByKey, toggleActivity } =
    useLearningPathData(true);

  const derivedData = useLearningPathDerivedData({
    user,
    stats,
    skillMap,
    learningPath,
    activityByKey,
  });
  const {
    targetBand,
    daysLeft,
    bandGaps,
    skillIndex,
    spotlightSkills,
    dueReviewSkills,
    mistakePatterns,
    scheduleTasks,
    todaysTasks,
    dailyFocus,
    completionPercent,
    totalActivities,
    completedCount,
    dateLabel,
  } = derivedData;

  const { isGenerating, handleUpdateStrategy } = usePathStrategy(queryClient);
  const { handleTaskToggle, handleQuickComplete } = useTaskActions(
    activityByKey,
    scheduleTasks,
    toggleActivity
  );
  const {
    selectedDayIndex,
    setSelectedDayIndex,
    timerState,
    handleTimerToggle,
    handleRefreshDaily,
    handleSelectToday,
    handleStartTopTask,
  } = usePathNavigation(navigate, dailyFocus);

  const currentDayTasks = useMemo(
    () => scheduleTasks[selectedDayIndex]?.tasks || [],
    [scheduleTasks, selectedDayIndex]
  );

  return (
    <>
      <DocumentHead
        title="AI Learning Path | IELTS Ai Pro"
        description="Your personalized AI-driven study plan to reach your target band score."
      />

      <div className="relative min-h-screen pb-20 bg-[#fafbff] dark:bg-[#060810] transition-colors duration-500 overflow-hidden isolate">
        <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)]" />
          <div className="absolute inset-x-0 top-0 h-[450px] bg-gradient-to-b from-violet-50/90 via-blue-50/40 to-transparent dark:from-violet-950/25 dark:via-blue-950/10" />
          <div className="absolute inset-x-0 top-[220px] h-[400px] bg-gradient-to-b from-transparent via-fuchsia-50/20 to-transparent dark:via-fuchsia-950/5" />
        </div>

        <m.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="py-4 px-3 sm:p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4 md:space-y-6 relative z-10"
        >
          <LearningPathHeader
            user={user}
            dateLabel={dateLabel}
            targetBand={targetBand}
            isLoading={isLoading}
            handleStartTopTask={handleStartTopTask}
            handleUpdateStrategy={handleUpdateStrategy}
            isGenerating={isGenerating}
            daysLeft={daysLeft}
            completedCount={completedCount}
            totalActivities={totalActivities}
            dueReviewSkills={dueReviewSkills}
          />

          <LearningPathGrid
            isLoading={isLoading}
            dailyFocus={dailyFocus}
            stats={stats}
            targetBand={targetBand}
            daysLeft={daysLeft}
            completedCount={completedCount}
            totalActivities={totalActivities}
            dueReviewSkills={dueReviewSkills}
            completionPercent={completionPercent}
            timerState={timerState}
            handleTimerToggle={handleTimerToggle}
            handleRefreshDaily={handleRefreshDaily}
            todaysTasks={todaysTasks}
            handleSelectToday={handleSelectToday}
            handleStartTopTask={handleStartTopTask}
            user={user}
            navigate={navigate}
            selectedDayIndex={selectedDayIndex}
            setSelectedDayIndex={setSelectedDayIndex}
            currentDayTasks={currentDayTasks}
            activityByKey={activityByKey}
            handleTaskToggle={handleTaskToggle}
            handleQuickComplete={handleQuickComplete}
            skillIndex={skillIndex}
            bandGaps={bandGaps}
            learningPath={learningPath}
            mistakePatterns={mistakePatterns}
            spotlightSkills={spotlightSkills}
          />
        </m.main>
      </div>
    </>
  );
};

export default LearningPath;
