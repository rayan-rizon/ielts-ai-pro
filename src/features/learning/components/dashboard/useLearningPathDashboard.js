import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User } from '@/entities';
import { buildActivityUrl } from '@/features/learning/utils/activityRoutes';
import { generateAdaptiveLearningPath } from '@/utils/api';
import {
  adaptLearningPathV1,
  aggregateReadiness,
  getWeeklyCapacity,
  normalizeStudyAvailability,
} from '../../../../../supabase/functions/_shared/learningPathV2';
import {
  buildFallbackTask,
  buildRoadmapViewModel,
  computeDashboardSnapshot,
  computeEvidence,
  computeSevenDays,
  getPathProgress,
  getPlanRefreshTrigger,
  rankBestNextTask,
} from './dashboardUtils';

export { computeSevenDays };

export function useLearningPathDashboard({
  user,
  learningPath,
  stats,
  skillMap,
  activityByKey,
  toggleActivity,
  rescheduleActivity,
  isLoading,
  navigate,
  previewMode = false,
}) {
  const queryClient = useQueryClient();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const automaticRequests = useRef(new Set());
  const recentReadiness = useMemo(
    () => aggregateReadiness(stats?.sessions || []),
    [stats?.sessions]
  );
  const hasTestEvidence = Object.values(recentReadiness.modules).some(
    (module) => module.sample_count > 0
  );

  const fallbackAvailability = useMemo(
    () =>
      normalizeStudyAvailability(
        user?.study_availability,
        Number(user?.study_hours_goal || 10),
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      ),
    [user?.study_availability, user?.study_hours_goal]
  );

  const [goalDraft, setGoalDraft] = useState(() => ({
    target_band_score: Number(user?.target_band_score || 7),
    test_date: user?.test_date ? String(user.test_date).slice(0, 10) : '',
    study_availability: fallbackAvailability,
  }));

  useEffect(() => {
    if (!customizeOpen) return;
    setGoalDraft({
      target_band_score: Number(user?.target_band_score || 7),
      test_date: user?.test_date ? String(user.test_date).slice(0, 10) : '',
      study_availability: fallbackAvailability,
    });
  }, [customizeOpen, fallbackAvailability, user?.target_band_score, user?.test_date]);

  const path = useMemo(() => adaptLearningPathV1(learningPath), [learningPath]);
  const evidence = useMemo(() => computeEvidence(path, skillMap), [path, skillMap]);
  const availability = path?.goal_snapshot?.study_availability || fallbackAvailability;
  const weeklyCapacity = getWeeklyCapacity(availability);

  const snapshot = useMemo(() => computeDashboardSnapshot(path, user, stats), [path, user, stats]);

  const sevenDays = useMemo(
    () => computeSevenDays(path, activityByKey, availability),
    [path, activityByKey, availability]
  );
  const refreshTrigger = useMemo(
    () =>
      getPlanRefreshTrigger({
        path,
        user,
        sessions: stats?.sessions,
        currentAvailability: fallbackAvailability,
        skillMap,
      }),
    [path, user, stats?.sessions, fallbackAvailability, skillMap]
  );
  const planUpdateAvailable = !previewMode && Boolean(refreshTrigger);

  useEffect(() => {
    if (previewMode || isLoading || !user?.id || refreshing || savingGoals || !hasTestEvidence)
      return;
    // One server check per visit covers corrected scores and vocabulary evidence
    // that the combined page RPC does not expose. Fingerprint hits use no AI.
    const visitKey = `${user.id}:evidence-check`;
    const requestKey = refreshTrigger
      ? `${user.id}:${path?.input_fingerprint || 'first'}:${refreshTrigger}`
      : visitKey;
    if (automaticRequests.current.has(requestKey)) return;
    automaticRequests.current.add(requestKey);
    automaticRequests.current.add(visitKey);
    setRefreshing(true);
    generateAdaptiveLearningPath({
      trigger: refreshTrigger || 'manual_refresh',
      timezone: fallbackAvailability.timezone,
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ['learningPath'] }))
      .catch((error) =>
        toast.error('Your plan could not be updated', {
          description: error?.message || 'Use Check for updates to retry.',
        })
      )
      .finally(() => setRefreshing(false));
  }, [
    previewMode,
    isLoading,
    user?.id,
    refreshing,
    savingGoals,
    refreshTrigger,
    path?.input_fingerprint,
    fallbackAvailability.timezone,
    queryClient,
    hasTestEvidence,
  ]);

  const today = sevenDays[0];

  const isLegacyPlan = path?.version === 1;

  // The stage view model is computed once here rather than inside the roadmap
  // panel, because the hero prints the same stage and the same percentage. Two
  // components deriving it separately is how they drifted apart before.
  const phases = useMemo(
    () =>
      buildRoadmapViewModel({
        roadmap: snapshot.roadmap,
        isLegacyPlan,
        readiness: snapshot.readiness,
        evidence,
        days: sevenDays,
        targetBand: snapshot.targetBand,
      }),
    [snapshot.roadmap, isLegacyPlan, snapshot.readiness, evidence, sevenDays, snapshot.targetBand]
  );
  const pathProgress = useMemo(() => getPathProgress(phases), [phases]);

  const scheduledTask = useMemo(
    () =>
      rankBestNextTask(sevenDays, {
        targetBand: snapshot.targetBand,
        daysLeft: snapshot.daysLeft,
        readiness: snapshot.readiness,
        evidence,
      }),
    [sevenDays, snapshot.targetBand, snapshot.daysLeft, snapshot.readiness, evidence]
  );

  // An empty schedule is not an empty page: fall back to the highest-value
  // unscheduled work so the hero's primary action is never a disabled button.
  const fallbackTask = useMemo(
    () =>
      scheduledTask
        ? null
        : buildFallbackTask({
            readiness: snapshot.readiness,
            evidence,
            targetBand: snapshot.targetBand,
          }),
    [scheduledTask, snapshot.readiness, evidence, snapshot.targetBand]
  );
  const primaryTask = scheduledTask || fallbackTask;

  // The hero ranks the best task across the whole week, so on a rest day it was
  // urging work the plan had deliberately not scheduled for today. Surface the
  // mismatch instead of hiding it — the plan's own rest day should still hold.
  const todayIsRestDay = Boolean(today && (today.tasks?.length ?? 0) === 0);
  const primaryTaskIsToday = Boolean(scheduledTask && scheduledTask.dayIndex === 0);
  const primaryTaskDayLabel =
    scheduledTask && !primaryTaskIsToday && scheduledTask.day?.date
      ? scheduledTask.day.date.toLocaleDateString(undefined, { weekday: 'long' })
      : '';
  const nextTasks = useMemo(
    () =>
      sevenDays
        .flatMap((day) => day.tasks.map((task) => ({ ...task, day })))
        .filter((task) => !task.is_completed)
        .filter((task) => task.activity_key !== primaryTask?.activity_key)
        .slice(0, 3),
    [sevenDays, primaryTask?.activity_key]
  );

  const startTask = (task) => {
    if (previewMode) {
      toast.success(`Preview: opening ${task?.title || 'task'}`);
      return;
    }
    navigate(buildActivityUrl(task));
  };

  const toggleTask = async (task) => {
    if (task?.completion_policy === 'verified') {
      if (!task.is_completed) startTask(task);
      else
        toast.info('This completion is verified', {
          description: 'It stays linked to the scored activity that completed it.',
        });
      return;
    }
    try {
      await toggleActivity({
        activityKey: task.activity_key,
        dayName: task.scheduled_day,
        taskIdx: 0,
        task,
        isCompleted: !task.is_completed,
        outcomeScore: task.outcome_score ?? null,
      });
      toast.success(task.is_completed ? 'Task reopened' : 'Task completed');
    } catch (error) {
      toast.error('Could not update this task', { description: error?.message });
    }
  };

  const rescheduleTask = async (task, nextDate) => {
    if (!task?.id || !nextDate) return;
    try {
      await rescheduleActivity({ activityId: task.id, scheduledDate: nextDate });
      toast.success('Task moved within your available study time');
    } catch (error) {
      toast.error('Could not reschedule this task', { description: error?.message });
    }
  };

  const refreshPlan = async () => {
    setRefreshing(true);
    try {
      if (previewMode) {
        toast.success('Preview plan is already current', {
          description: 'No AI request was sent.',
        });
        return;
      }
      // Only the server sees all grammar, vocabulary, and corrected score evidence.
      const result = await generateAdaptiveLearningPath({
        trigger: refreshTrigger || 'manual_refresh',
        timezone: fallbackAvailability.timezone,
      });
      await queryClient.invalidateQueries({ queryKey: ['learningPath'] });
      toast.success(
        result?.cached ? 'Your plan is already current' : 'Plan updated from your latest results',
        result?.cached
          ? { description: 'The saved plan was reused, so no AI summary was generated.' }
          : undefined
      );
    } catch (error) {
      toast.error('Could not refresh the plan', { description: error?.message });
    } finally {
      setRefreshing(false);
    }
  };

  const saveGoals = async () => {
    if (!Object.keys(goalDraft.study_availability?.days || {}).length) {
      toast.error('Choose at least one available study day');
      return;
    }
    setSavingGoals(true);
    try {
      if (previewMode) {
        setCustomizeOpen(false);
        toast.success('Preview goals updated');
        return;
      }
      const weeklyHours = Math.max(
        1,
        Math.round(getWeeklyCapacity(goalDraft.study_availability) / 60)
      );
      await User.updateMyUserData({
        target_band_score: Number(goalDraft.target_band_score),
        test_date: goalDraft.test_date || null,
        study_availability: goalDraft.study_availability,
        study_hours_goal: weeklyHours,
      });
      await generateAdaptiveLearningPath({ trigger: 'goal_changed' });
      await queryClient.invalidateQueries({ queryKey: ['learningPath'] });
      setCustomizeOpen(false);
      toast.success('Goals saved and the plan was recalculated');
    } catch (error) {
      toast.error('Could not save plan settings', { description: error?.message });
    } finally {
      setSavingGoals(false);
    }
  };

  return {
    hasTestEvidence,
    customizeOpen,
    setCustomizeOpen,
    savingGoals,
    refreshing,
    planUpdateAvailable,
    expandedTask,
    setExpandedTask,
    goalDraft,
    setGoalDraft,
    path,
    evidence,
    readiness: snapshot.readiness,
    roadmap: snapshot.roadmap,
    targetBand: snapshot.targetBand,
    examDate: snapshot.examDate,
    daysLeft: snapshot.daysLeft,
    examDatePassed: snapshot.examDatePassed,
    weeklyCapacity,
    sevenDays,
    today,
    phases,
    pathProgress,
    primaryTask,
    isFallbackTask: Boolean(fallbackTask),
    todayIsRestDay,
    primaryTaskIsToday,
    primaryTaskDayLabel,
    nextTasks,
    startTask,
    toggleTask,
    rescheduleTask,
    refreshPlan,
    saveGoals,
    isLegacyPlan,
  };
}
