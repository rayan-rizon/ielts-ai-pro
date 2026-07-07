import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { generateAdaptiveLearningPath } from '@/utils/api';
import { createPageUrl } from '@/utils';
import { getTodayIndex, dayNames } from './useLearningPathData';

export function usePathStrategy(queryClient) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUpdateStrategy = useCallback(async () => {
    setIsGenerating(true);
    try {
      await toast.promise(generateAdaptiveLearningPath(), {
        loading: 'Analyzing your recent performance…',
        success: 'Learning plan updated!',
        error: (err) =>
          err?.status === 403
            ? 'Pro or Premium subscription required'
            : 'Failed to update plan — please try again',
      });
      queryClient.invalidateQueries({ queryKey: ['learningPath'] });
    } catch (err) {
      console.error('Failed to refresh strategy:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [queryClient]);

  return { isGenerating, handleUpdateStrategy };
}

export function useTaskActions(activityByKey, scheduleTasks, toggleActivity) {
  const handleTaskToggle = useCallback(
    async (dayName, taskIdx) => {
      const activityKey = `${dayName}_${taskIdx}`;
      const existing = activityByKey[activityKey];
      const wasCompleted = !!existing?.is_completed;
      const dayIndex = dayNames.indexOf(dayName);
      const tasks = scheduleTasks[dayIndex]?.tasks || [];
      const task = tasks[taskIdx];

      try {
        await toggleActivity({
          activityKey,
          dayName,
          taskIdx,
          task,
          isCompleted: !wasCompleted,
          outcomeScore: existing?.outcome_score ?? null,
        });
        toast.success(wasCompleted ? 'Marked as incomplete' : 'Marked as complete! 🎉');
      } catch (err) {
        console.error('Failed to toggle activity:', err);
        toast.error('Could not update task — please try again.');
      }
    },
    [activityByKey, scheduleTasks, toggleActivity]
  );

  const handleQuickComplete = useCallback(
    async (dayName, taskIdx, task) => {
      const activityKey = `${dayName}_${taskIdx}`;
      try {
        await toggleActivity({
          activityKey,
          dayName,
          taskIdx,
          task,
          isCompleted: true,
          outcomeScore: null,
        });
        toast.success('Quick-completed! ✅');
      } catch (err) {
        console.error('Quick complete failed:', err);
        toast.error('Could not complete task — please try again.');
      }
    },
    [toggleActivity]
  );

  return { handleTaskToggle, handleQuickComplete };
}

export function usePathNavigation(navigate, dailyFocus) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(getTodayIndex());
  const [timerState, setTimerState] = useState({ running: false, secondsLeft: 25 * 60 });

  const handleTimerToggle = useCallback(() => {
    setTimerState((prev) => ({ ...prev, running: !prev.running }));
  }, []);

  const handleRefreshDaily = useCallback(() => {
    toast.info('Refreshed daily focus');
  }, []);

  const handleSelectToday = useCallback(() => {
    setSelectedDayIndex(getTodayIndex());
  }, []);

  const handleStartTopTask = useCallback(() => {
    const module = dailyFocus?.primary_module;
    if (module && module !== 'general') {
      navigate(createPageUrl(module.charAt(0).toUpperCase() + module.slice(1)));
      return;
    }
    handleSelectToday();
  }, [dailyFocus?.primary_module, handleSelectToday, navigate]);

  return {
    selectedDayIndex,
    setSelectedDayIndex,
    timerState,
    setTimerState,
    handleTimerToggle,
    handleRefreshDaily,
    handleSelectToday,
    handleStartTopTask,
  };
}
