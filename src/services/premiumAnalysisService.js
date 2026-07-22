import { supabase } from '@/lib/supabase';

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

function buildSchedule(plan, testType, sessionId) {
  const weeklySchedule = {};
  const activities = plan.map((item, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const dayName = DAY_NAMES[date.getDay()];
    const task = {
      activity_key: `result:${sessionId}:day:${item.day}`,
      title: item.title,
      description: `Day ${item.day}: ${item.skill}`,
      module: testType,
      estimated_time: item.minutes,
      priority: index < 3 ? 'high' : 'medium',
      activity_type: item.kind,
      skill_targets: [item.skill],
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

  const { weeklySchedule, activities } = buildSchedule(plan, testType, sessionId);
  const { data, error } = await supabase.rpc('save_result_focus_plan', {
    p_source_session_id: sessionId,
    p_path_data: {
      source: 'result_deep_analysis',
      source_session_id: sessionId,
      module: testType,
      target_band: targetBand,
      generated_at: new Date().toISOString(),
      weekly_schedule: weeklySchedule,
    },
    p_activities: activities,
  });

  if (error) throw error;
  return data;
}
