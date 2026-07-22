import { useMemo } from 'react';
import { getDaysLeft } from '@/features/learning/utils/learningUtils';
import { dayNames, getTodayIndex } from '@/features/learning/hooks/useLearningPathData';
import { calculateBandGaps, buildMistakePatterns } from '@/features/learning/utils/learningUtils';

function useSkillsData(skillMap) {
  const allSkills = useMemo(() => {
    if (!skillMap?.byModule) return [];
    return Object.values(skillMap.byModule).flat();
  }, [skillMap]);

  const skillIndex = useMemo(() => {
    const idx = {};
    allSkills.forEach((s) => {
      idx[s.skill_code] = s;
    });
    return idx;
  }, [allSkills]);

  const spotlightSkills = useMemo(() => {
    return allSkills
      .filter((s) => s.mastery < 0.7 && !s.is_due)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3);
  }, [allSkills]);

  const dueReviewSkills = useMemo(() => {
    return allSkills
      .filter((s) => s.is_due)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 5);
  }, [allSkills]);

  return { allSkills, skillIndex, spotlightSkills, dueReviewSkills };
}

function calculateScheduleTasks(learningPath) {
  const ws = learningPath?.weekly_schedule || learningPath?.schedule;
  if (!ws) return [];
  if (Array.isArray(ws)) return ws;
  return dayNames.map((day) => ({ tasks: ws[day] || [] }));
}

function getTodaysTasks(scheduleTasks) {
  const todayIdx = getTodayIndex();
  const day = dayNames[todayIdx];
  const tasks = scheduleTasks[todayIdx]?.tasks || [];
  return { day, tasks };
}

function getPriorityLabel(priority) {
  if (priority === 'high') return 'highest-priority';
  if (priority === 'low') return 'reinforcement';
  return 'core';
}

function getModuleLabel(moduleStr) {
  if (!moduleStr) return 'General';
  return moduleStr.charAt(0).toUpperCase() + moduleStr.slice(1);
}

function getTaskObj(firstTask) {
  if (typeof firstTask === 'string') return { title: firstTask, module: 'general' };
  return firstTask;
}

function calculateDailyFocus(todaysTasks) {
  const tasks = todaysTasks?.tasks;
  if (!tasks || tasks.length === 0) return null;

  const taskObj = getTaskObj(tasks[0]);
  const moduleLabel = getModuleLabel(taskObj.module);
  const priorityLabel = getPriorityLabel(taskObj.priority);

  const generatedReason = `Your ${priorityLabel} ${moduleLabel} focus for today based on your weakest skills.`;
  return {
    primary_module: taskObj.module,
    ai_reason: taskObj.description || generatedReason,
    task: taskObj,
  };
}

function calculateCompletion(scheduleTasks, activityByKey) {
  let total = 0;
  let completed = 0;
  scheduleTasks.forEach((day, dIdx) => {
    (day.tasks || []).forEach((task, tIdx) => {
      total++;
      const key =
        typeof task === 'object' && task?.activity_key
          ? task.activity_key
          : `${dayNames[dIdx]}_${tIdx}`;
      if (activityByKey?.[key]?.is_completed) completed++;
    });
  });
  return {
    completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    totalActivities: total,
    completedCount: completed,
  };
}

function useScheduleData(learningPath, activityByKey) {
  const scheduleTasks = useMemo(() => calculateScheduleTasks(learningPath), [learningPath]);
  const todaysTasks = useMemo(() => getTodaysTasks(scheduleTasks), [scheduleTasks]);
  const dailyFocus = useMemo(() => calculateDailyFocus(todaysTasks), [todaysTasks]);
  const completionData = useMemo(
    () => calculateCompletion(scheduleTasks, activityByKey),
    [scheduleTasks, activityByKey]
  );

  return {
    scheduleTasks,
    todaysTasks,
    dailyFocus,
    ...completionData,
  };
}

export function useLearningPathDerivedData({ user, stats, skillMap, learningPath, activityByKey }) {
  const targetBand = Number(user?.target_band_score) || 7.0;
  const daysLeft = useMemo(() => getDaysLeft(user?.test_date), [user?.test_date]);
  const bandGaps = useMemo(() => calculateBandGaps(stats, targetBand), [stats, targetBand]);
  const mistakePatterns = useMemo(() => buildMistakePatterns(stats?.sessions), [stats?.sessions]);

  const dateLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const skillsData = useSkillsData(skillMap);
  const scheduleData = useScheduleData(learningPath, activityByKey);

  return {
    targetBand,
    daysLeft,
    bandGaps,
    mistakePatterns,
    dateLabel,
    ...skillsData,
    ...scheduleData,
  };
}
