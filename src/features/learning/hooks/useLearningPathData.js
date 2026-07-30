import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';

// --- Constants ---
const EMPTY_OBJ = {};
const EMPTY_STATS = { moduleAverages: {}, moduleTrends: {}, totalTests: 0 };
const EMPTY_SKILL_MAP = { byModule: {}, totals: { skills: 0, due: 0 } };
const EMPTY_PATH_DATA = {
  path: null,
  pathId: null,
  completedActivities: EMPTY_OBJ,
  activityByKey: EMPTY_OBJ,
};

// --- Utility Functions ---

function humanizeLabel(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatSkillName(skillCode) {
  if (!skillCode) return '';
  const parts = String(skillCode).split('_').filter(Boolean);
  if (parts.length <= 1) return humanizeLabel(skillCode);
  return humanizeLabel(parts.slice(1).join(' '));
}

export function buildSkillTrendMap(sessions) {
  const map = {};
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  safeSessions.forEach((s) => {
    const testType = s?.test_type;
    const typeStats = s?.content_data?.typeStats;
    if (!testType || !typeStats || typeof typeStats !== 'object') return;

    Object.entries(typeStats).forEach(([typeKey, stats]) => {
      const total = Number(stats?.total || 0);
      const correct = Number(stats?.correct || 0);
      if (!Number.isFinite(total) || total <= 0) return;
      const accuracy = correct / total;
      const normalizedKey = String(typeKey).replace(/\s+/g, '_');
      const skillCode = `${testType}_${normalizedKey}`;
      if (!map[skillCode]) map[skillCode] = [];
      map[skillCode].push({ accuracy, total });
    });
  });

  const trendBySkill = {};
  Object.entries(map).forEach(([skillCode, points]) => {
    const recent = points.slice(0, 3);
    const previous = points.slice(3, 6);
    const wAvg = (arr) => {
      const denom = arr.reduce((sum, p) => sum + (p.total || 0), 0);
      if (!denom) return null;
      const num = arr.reduce((sum, p) => sum + (p.accuracy || 0) * (p.total || 0), 0);
      return num / denom;
    };
    const r = wAvg(recent);
    const p = wAvg(previous);
    if (r === null || p === null) {
      trendBySkill[skillCode] = 'stable';
      return;
    }
    const diff = r - p;
    trendBySkill[skillCode] = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'stable';
  });

  return trendBySkill;
}

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

// --- LocalStorage Cache Helpers ---
const CACHE_KEY_PREFIX = 'ielts_lp_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedLearningPath(userId) {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedLearningPath(userId, data) {
  try {
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${userId}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

// --- Fetcher Functions ---

async function fetchLearningPathData(userId) {
  if (!userId) return null;

  // Fetch Latest Path
  const { data: paths, error: pathError } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (pathError) throw pathError;

  const pathRecord = paths?.[0];
  if (!pathRecord) return { path: null, pathId: null, completedActivities: {}, activityByKey: {} };

  let pathData;
  try {
    pathData =
      typeof pathRecord.path_data === 'string'
        ? JSON.parse(pathRecord.path_data)
        : pathRecord.path_data;
  } catch (e) {
    console.error('Error parsing path_data:', e);
    pathData = null;
  }

  // Fetch activities for this path
  let { data: activities, error: activitiesError } = await supabase
    .from('learning_path_activities')
    .select(
      'id, activity_key, scheduled_day, scheduled_date, stage_key, completion_policy, requested_mode, evidence_key, is_completed, completed_at, outcome_score, outcome_band, outcome_accuracy, completion_source, outcome_data, title, description, module, estimated_minutes, priority, activity_type, skill_targets'
    )
    .eq('learning_path_id', pathRecord.id);

  // Keep the page usable during the schema-first rollout window. Older projects do not yet
  // expose scheduled_date, so retry with the V1 column set and let path_data supply dates.
  if (
    activitiesError &&
    /scheduled_date|stage_key|completion_policy|requested_mode|evidence_key/i.test(
      activitiesError.message || ''
    )
  ) {
    const legacyResult = await supabase
      .from('learning_path_activities')
      .select(
        'id, activity_key, scheduled_day, is_completed, completed_at, outcome_score, outcome_band, outcome_accuracy, completion_source, outcome_data, title, description, module, estimated_minutes, priority, activity_type, skill_targets'
      )
      .eq('learning_path_id', pathRecord.id);
    activities = (legacyResult.data || []).map((activity) => ({
      ...activity,
      scheduled_date: null,
    }));
    activitiesError = legacyResult.error;
  }

  if (activitiesError) throw activitiesError;

  const activityByKey = {};
  (activities || []).forEach((a) => {
    if (a?.activity_key) activityByKey[a.activity_key] = a;
  });

  const result = {
    path: pathData,
    pathId: pathRecord.id,
    completedActivities: pathRecord.activities_completed || {},
    activityByKey,
  };

  // Cache for faster subsequent loads
  setCachedLearningPath(userId, result);

  return result;
}

// Combined fetcher using single RPC call (requires migration to be applied)
async function fetchAllLearningPathData(userId) {
  if (!userId) {
    return {
      pathData: EMPTY_PATH_DATA,
      statsData: EMPTY_STATS,
      skillMap: EMPTY_SKILL_MAP,
    };
  }

  try {
    // Try combined RPC first (single network call)
    const { data, error } = await supabase.rpc('get_learning_path_data');

    if (error) {
      console.warn('Combined RPC not available, falling back to separate queries:', error.message);
      // Fallback to separate queries if RPC doesn't exist yet
      return null;
    }

    // Parse learning path data
    const lp = data?.learningPath;
    let pathData;
    try {
      pathData = lp && typeof lp.path_data === 'string' ? JSON.parse(lp.path_data) : lp?.path_data;
    } catch (e) {
      console.error('Error parsing RPC path_data:', e);
      pathData = null;
    }

    const { data: currentActivities } = lp?.id
      ? await supabase
          .from('learning_path_activities')
          .select(
            'id, activity_key, scheduled_day, scheduled_date, stage_key, completion_policy, requested_mode, evidence_key, is_completed, completed_at, outcome_score, outcome_band, outcome_accuracy, completion_source, outcome_data, title, description, module, estimated_minutes, priority, activity_type, skill_targets'
          )
          .eq('learning_path_id', lp.id)
      : { data: [] };
    const activityByKey = {};
    (currentActivities || data?.activities || []).forEach((a) => {
      if (a?.activity_key) activityByKey[a.activity_key] = a;
    });

    // Parse stats
    const statsData = {
      moduleAverages: data?.stats?.moduleAverages || {},
      moduleTrends: data?.stats?.moduleTrends || {},
      totalTests: data?.stats?.totalTests || 0,
      sessions: data?.stats?.sessions || [],
    };

    // Build skill map from proficiencies
    const { data: currentProficiencies } = await supabase
      .from('skill_proficiency')
      .select(
        'skill_code, module, mastery_probability, confidence_level, practice_count, correct_count, last_practiced_at, next_review_at, evidence_version'
      )
      .eq('user_id', userId)
      .order('mastery_probability', { ascending: true })
      .limit(100);
    const proficiencies = currentProficiencies || [];
    const trendBySkill = buildSkillTrendMap(statsData.sessions);
    const now = Date.now();
    const byModule = {};
    let dueCount = 0;

    proficiencies.forEach((p) => {
      const module = p?.module || 'reading';
      const isGeneratedCriterion =
        module === 'writing' ||
        module === 'speaking' ||
        /_(writing|speaking)$/i.test(String(p?.skill_code || ''));
      if (isGeneratedCriterion && p?.evidence_version !== '2026-07-29-v5') return;
      if (!byModule[module]) byModule[module] = [];
      const nextReviewAt = p?.next_review_at ? new Date(p.next_review_at).getTime() : null;
      const isDue = nextReviewAt !== null && Number.isFinite(nextReviewAt) && nextReviewAt <= now;
      if (isDue) dueCount += 1;

      const mastery = Number(p?.mastery_probability ?? 0.5);
      const confidence = Number(p?.confidence_level ?? 0);
      const practiceCount = Number(p?.practice_count ?? 0);
      const correctCount = Number(p?.correct_count ?? 0);
      const trend = trendBySkill[p.skill_code] || 'stable';
      const trendLabel = trend === 'up' ? 'improving' : trend === 'down' ? 'declining' : 'stable';
      const why = `${Math.round(mastery * 100)}% skill progress over ${practiceCount} answers, ${trendLabel}${isDue ? ', due now' : ''}`;

      byModule[module].push({
        skill_code: p.skill_code,
        module,
        skill_name: formatSkillName(p.skill_code),
        mastery,
        confidence,
        practice_count: practiceCount,
        correct_count: correctCount,
        last_practiced_at: p?.last_practiced_at || null,
        next_review_at: p?.next_review_at || null,
        trend,
        is_due: isDue,
        why,
      });
    });

    // Sort by mastery ascending
    Object.values(byModule).forEach((arr) => {
      arr.sort((a, b) => a.mastery - b.mastery || b.practice_count - a.practice_count);
    });

    const result = {
      pathData: {
        path: pathData,
        pathId: lp?.id || null,
        completedActivities: lp?.activities_completed || {},
        activityByKey,
      },
      statsData,
      skillMap: {
        byModule,
        totals: {
          skills: Object.values(byModule).reduce((sum, items) => sum + items.length, 0),
          due: dueCount,
        },
      },
    };

    // Cache for faster subsequent loads
    setCachedLearningPath(userId, result.pathData);

    return result;
  } catch (err) {
    console.warn('Error in fetchAllLearningPathData:', err);
    return null;
  }
}

async function fetchLearningStats(userId) {
  if (!userId) return { moduleAverages: {}, moduleTrends: {}, totalTests: 0 };

  const sessions = await TestSession.list(
    { user_id: userId, is_completed: true },
    '-completed_at',
    40
  );

  const mAvgs = {};
  const mTrends = {};

  ['reading', 'writing', 'listening', 'speaking'].forEach((type) => {
    const typeSessions = sessions.filter(
      (s) =>
        s.test_type === type &&
        Number.isFinite(Number(s.score)) &&
        Number(s.score) >= 0 &&
        Number(s.score) <= 9
    );
    if (typeSessions.length > 0) {
      mAvgs[type] =
        typeSessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / typeSessions.length;
      if (typeSessions.length >= 2) {
        const current = Number(typeSessions[0].score || 0);
        const prev = Number(typeSessions[1].score || 0);
        mTrends[type] = current > prev ? 'up' : current < prev ? 'down' : 'stable';
      }
    }
  });

  return {
    moduleAverages: mAvgs,
    moduleTrends: mTrends,
    totalTests: sessions.length,
    sessions, // Return sessions for skill trend calculation
  };
}

async function fetchSkillProficiencies(userId, sessions = []) {
  if (!userId) return { byModule: {}, totals: { skills: 0, due: 0 } };

  const { data: proficiencies } = await supabase
    .from('skill_proficiency')
    .select(
      'skill_code, module, mastery_probability, confidence_level, practice_count, correct_count, last_practiced_at, next_review_at, evidence_version'
    )
    .eq('user_id', userId)
    .order('mastery_probability', { ascending: true })
    .limit(100);

  const trendBySkill = buildSkillTrendMap(sessions);
  const now = Date.now();
  const byModule = {};
  let dueCount = 0;

  (proficiencies || []).forEach((p) => {
    const module = p?.module || 'reading';
    const isGeneratedCriterion =
      module === 'writing' ||
      module === 'speaking' ||
      /_(writing|speaking)$/i.test(String(p?.skill_code || ''));
    if (isGeneratedCriterion && p?.evidence_version !== '2026-07-29-v5') return;
    if (!byModule[module]) byModule[module] = [];
    const nextReviewAt = p?.next_review_at ? new Date(p.next_review_at).getTime() : null;
    const isDue = nextReviewAt !== null && Number.isFinite(nextReviewAt) && nextReviewAt <= now;
    if (isDue) dueCount += 1;

    const mastery = Number(p?.mastery_probability ?? 0.5);
    const confidence = Number(p?.confidence_level ?? 0);
    const practiceCount = Number(p?.practice_count ?? 0);
    const correctCount = Number(p?.correct_count ?? 0);
    const trend = trendBySkill[p.skill_code] || 'stable';
    const trendLabel = trend === 'up' ? 'improving' : trend === 'down' ? 'declining' : 'stable';
    const why = `${Math.round(mastery * 100)}% skill progress over ${practiceCount} answers, ${trendLabel}${isDue ? ', due now' : ''}`;

    byModule[module].push({
      skill_code: p.skill_code,
      module,
      skill_name: formatSkillName(p.skill_code),
      mastery,
      confidence,
      practice_count: practiceCount,
      correct_count: correctCount,
      last_practiced_at: p?.last_practiced_at || null,
      next_review_at: p?.next_review_at || null,
      trend,
      is_due: isDue,
      why,
    });
  });

  // Sort by mastery ascending
  Object.values(byModule).forEach((arr) => {
    arr.sort((a, b) => a.mastery - b.mastery || b.practice_count - a.practice_count);
  });

  return {
    byModule,
    totals: {
      skills: Object.values(byModule).reduce((sum, items) => sum + items.length, 0),
      due: dueCount,
    },
  };
}

// --- Main Hook ---

export function useLearningPathData(isPremium = true) {
  // Fetch user profile from AuthContext
  const { user, loading: userLoading } = useAuth();
  const queryClient = useQueryClient();

  const userId = user?.id;

  // Get cached data for instant initial render
  const cachedPathData = useMemo(() => getCachedLearningPath(userId), [userId]);

  // Try combined RPC first (single network call), fall back to separate queries
  const { data: combinedData, isLoading: combinedLoading } = useQuery({
    queryKey: ['learningPath', 'combined', userId || 'anonymous'],
    queryFn: () => fetchAllLearningPathData(userId),
    enabled: !!userId && isPremium,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry if RPC doesn't exist
  });

  // Fallback queries (only enabled if combined RPC failed/not available)
  const useFallback = combinedData === null;

  const { data: pathData, isLoading: pathLoading } = useQuery({
    queryKey: queryKeys.learningPath.latest(userId || 'anonymous'),
    queryFn: () => fetchLearningPathData(userId),
    enabled: !!userId && isPremium && useFallback,
    staleTime: 5 * 60 * 1000,
    initialData: useFallback ? cachedPathData : undefined,
    initialDataUpdatedAt:
      useFallback && cachedPathData ? Date.now() - (CACHE_TTL_MS - 60000) : undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['learningPath', 'stats', userId || 'anonymous'],
    queryFn: () => fetchLearningStats(userId),
    enabled: !!userId && isPremium && useFallback,
    staleTime: 5 * 60 * 1000,
  });

  const { data: skillMap, isLoading: skillsLoading } = useQuery({
    queryKey: ['learningPath', 'skills', userId || 'anonymous'],
    queryFn: () => fetchSkillProficiencies(userId, statsData?.sessions || []),
    enabled: !!userId && isPremium && useFallback && !!statsData,
    staleTime: 5 * 60 * 1000,
  });

  // Determine loading state based on which path is being used
  const isLoading =
    userLoading ||
    (isPremium &&
      (combinedLoading || (useFallback && (pathLoading || statsLoading || skillsLoading))));

  // Use combined data if available, otherwise fallback data
  const finalPathData = combinedData?.pathData || pathData;
  const finalStatsData = combinedData?.statsData || statsData;
  const finalSkillMap = combinedData?.skillMap || skillMap;
  const learningPathId = finalPathData?.pathId || null;

  // --- Toggle Activity Mutation ---
  const toggleActivityMutation = useMutation({
    mutationFn: async ({ activityKey, dayName, taskIdx, task, isCompleted, outcomeScore }) => {
      if (!userId || !learningPathId) throw new Error('No learning path found');

      const taskObj =
        typeof task === 'string' ? { title: task, module: 'general', estimated_time: 30 } : task;

      const payload = {
        learning_path_id: learningPathId,
        user_id: userId,
        activity_key: activityKey,
        scheduled_day: dayName,
        scheduled_date: taskObj.scheduled_date || null,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        outcome_score: outcomeScore ?? null,
        outcome_band: null,
        outcome_accuracy: null,
        completion_source: isCompleted ? 'manual' : null,
        stage_key: taskObj.stage_key || null,
        completion_policy: taskObj.completion_policy || 'self_reported',
        requested_mode: taskObj.requested_mode || taskObj.routing?.mode || null,
        evidence_key: taskObj.evidence_key || null,
        title: taskObj.title || `Task ${taskIdx + 1}`,
        module: taskObj.module || 'general',
        estimated_minutes: taskObj.estimated_time || 30,
        priority: typeof taskObj.priority === 'string' ? taskObj.priority : 'medium',
        activity_type: taskObj.activity_type || 'practice',
        skill_targets: taskObj.skill_targets || [],
      };

      const { error } = await supabase
        .from('learning_path_activities')
        .upsert(payload, { onConflict: 'learning_path_id,activity_key' });

      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      // Invalidate all learning path queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['learningPath'] });
    },
  });

  const rescheduleActivityMutation = useMutation({
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

  return {
    user: user || null,
    isLoading,
    learningPath: finalPathData?.path || null,
    learningPathId,
    completedActivities: finalPathData?.completedActivities || EMPTY_OBJ,
    activityByKey: finalPathData?.activityByKey || EMPTY_OBJ,
    stats: finalStatsData || EMPTY_STATS,
    skillMap: finalSkillMap || EMPTY_SKILL_MAP,
    toggleActivity: toggleActivityMutation.mutateAsync,
    rescheduleActivity: rescheduleActivityMutation.mutateAsync,
    isToggling: toggleActivityMutation.isPending,
    isRescheduling: rescheduleActivityMutation.isPending,
  };
}

export default useLearningPathData;
