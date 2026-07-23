import { supabase } from '@/lib/supabase';
import { normalizeStudyAvailability } from '../../supabase/functions/_shared/learningPathV2';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export async function fetchRecentResultSessions({ userId, testType, sessionId }) {
  if (!userId || !testType) return [];

  let query = supabase
    .from('test_sessions')
    .select('id, score, completed_at, created_at, content_data')
    .eq('user_id', userId)
    .eq('test_type', testType)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false, nullsFirst: false })
    .limit(5);

  if (sessionId) query = query.neq('id', sessionId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function buildSchedule(plan, testType, sessionId, availability) {
  const weeklySchedule = {};
  const selectedDays = new Set(Object.keys(availability.days || {}));
  const scheduledDates = [];
  for (let offset = 0; offset < 56 && scheduledDates.length < plan.length; offset += 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const dayName = DAY_NAMES[date.getDay()];
    if (selectedDays.has(dayName)) scheduledDates.push({ date, dayName });
  }
  const activities = plan.map((item, index) => {
    const { date, dayName } = scheduledDates[index];
    const dailyLimit = Number(availability.days[dayName] || 30);
    const task = {
      activity_key: `result:${sessionId}:day:${item.day}`,
      title: item.title,
      description: `Day ${item.day}: ${item.skill}`,
      module: testType,
      estimated_time: Math.max(20, Math.min(60, dailyLimit, Number(item.minutes || 30))),
      priority: index < 3 ? 'high' : 'medium',
      activity_type: item.kind,
      skill_targets: [item.skill],
      reason: `This task responds directly to evidence from the saved ${testType} result.`,
      success_criterion: 'Complete the task, review each error, and record the outcome.',
      evidence: { source_session_id: sessionId, class: 'result_recovery' },
      routing: { route: testType, mode: 'recovery' },
    };
    weeklySchedule[dayName] = [task];
    return {
      ...task,
      scheduled_day: dayName,
      scheduled_date: date.toISOString().slice(0, 10),
    };
  });

  return { weeklySchedule, activities };
}

export async function saveResultFocusPlan({ sessionId, testType, plan, targetBand }) {
  if (!sessionId) throw new Error('This legacy result cannot be saved as a learning path.');
  if (!Array.isArray(plan) || plan.length !== 7) {
    throw new Error('A complete seven-day plan is required.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users')
    .select('study_availability, study_hours_goal')
    .eq('auth_id', user?.id)
    .maybeSingle();
  const availability = normalizeStudyAvailability(
    profile?.study_availability,
    Number(profile?.study_hours_goal || 10),
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const { activities } = buildSchedule(plan, testType, sessionId, availability);
  const { data, error } = await supabase.rpc('save_result_focus_plan', {
    p_source_session_id: sessionId,
    p_path_data: {
      source: 'result_deep_analysis',
      source_session_id: sessionId,
      module: testType,
      target_band: targetBand,
      generated_at: new Date().toISOString(),
      generation_trigger: 'result_recovery',
      recovery_activity_count: activities.length,
    },
    p_activities: activities,
  });

  if (error) throw error;
  return data;
}
