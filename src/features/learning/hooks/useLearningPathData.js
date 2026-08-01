import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { upsertLearningPathActivity } from '@/features/learning/utils/activityPersistence';
import {
  EMPTY_PATH_DATA,
  EMPTY_SKILL_MAP,
  EMPTY_STATS,
  buildActivityPayload,
  buildLearningPathData,
  buildSkillTrendMap,
  formatSkillName,
} from './learningPathDataModel';

export { buildSkillTrendMap, formatSkillName };

export const dayNames = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
export const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

async function fetchLearningPathData(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.rpc('get_learning_path_data');
  if (error) throw error;
  return buildLearningPathData(data);
}

const useLearningPathQuery = (userId) =>
  useQuery({
    queryKey: ['learningPath', 'combined', userId ?? 'anonymous'],
    queryFn: () => fetchLearningPathData(userId),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

const useToggleActivity = ({ userId, learningPathId, queryClient }) =>
  useMutation({
    mutationFn: async (activity) => {
      if (!userId || !learningPathId) throw new Error('No learning path found');
      const payload = buildActivityPayload({ ...activity, learningPathId, userId });
      const { error } = await upsertLearningPathActivity(supabase, payload);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learningPath'] }),
  });

const useRescheduleActivity = (queryClient) =>
  useMutation({
    mutationFn: async ({ activityId, scheduledDate }) => {
      if (!activityId || !scheduledDate) throw new Error('Activity and date are required');
      const { data, error } = await supabase.rpc('reschedule_learning_path_activity', {
        p_activity_id: activityId,
        p_scheduled_date: scheduledDate,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learningPath'] }),
  });

export function useLearningPathData() {
  const { user, loading: userLoading } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const learningPathQuery = useLearningPathQuery(userId);
  const pathData = learningPathQuery.data?.pathData ?? EMPTY_PATH_DATA;
  const toggleActivityMutation = useToggleActivity({
    userId,
    learningPathId: pathData.pathId,
    queryClient,
  });
  const rescheduleActivityMutation = useRescheduleActivity(queryClient);

  return {
    user: user ?? null,
    isLoading: userLoading || (Boolean(userId) && learningPathQuery.isLoading),
    hasError: learningPathQuery.isError,
    errorMessage: learningPathQuery.error?.message ?? null,
    retry: learningPathQuery.refetch,
    learningPath: pathData.path,
    learningPathId: pathData.pathId,
    completedActivities: pathData.completedActivities,
    activityByKey: pathData.activityByKey,
    stats: learningPathQuery.data?.statsData ?? EMPTY_STATS,
    skillMap: learningPathQuery.data?.skillMap ?? EMPTY_SKILL_MAP,
    toggleActivity: toggleActivityMutation.mutateAsync,
    rescheduleActivity: rescheduleActivityMutation.mutateAsync,
    isToggling: toggleActivityMutation.isPending,
    isRescheduling: rescheduleActivityMutation.isPending,
  };
}

export default useLearningPathData;
