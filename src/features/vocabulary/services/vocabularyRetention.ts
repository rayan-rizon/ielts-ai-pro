import { supabase } from '@/lib/supabase';

export type RetentionPeriod = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'allTime';

export interface VocabularyReviewEvent {
  id: string;
  quality: number;
  reviewed_at: string;
}

export const RETENTION_PERIODS: Array<{ value: RetentionPeriod; label: string }> = [
  { value: 'thisWeek', label: 'This week' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'allTime', label: 'All time' },
];

const startOfLocalWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getRetentionPeriodRange = (period: RetentionPeriod, now = new Date()) => {
  if (period === 'allTime') return {};

  if (period === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  const thisWeekStart = startOfLocalWeek(now);
  if (period === 'lastWeek') {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - 7);
    return { start, end: thisWeekStart };
  }

  const end = new Date(thisWeekStart);
  end.setDate(end.getDate() + 7);
  return { start: thisWeekStart, end };
};

export const calculateRetentionProgress = (
  events: Array<Pick<VocabularyReviewEvent, 'quality'>>
) => {
  const reviewed = events.length;
  const retained = events.filter((event) => event.quality >= 3).length;
  const forgotten = reviewed - retained;

  return {
    reviewed,
    retained,
    forgotten,
    retention: reviewed > 0 ? Math.round((retained / reviewed) * 100) : 0,
  };
};

export const getRetentionMessage = (retention: number, reviewed: number) => {
  if (reviewed === 0) return 'Complete a review session to see your retention here.';
  if (retention >= 80) return 'Strong recall. Your review routine is working well.';
  if (retention >= 60) return 'You’re retaining words effectively. Keep up the daily consistency!';
  return 'A few more focused reviews will help these words stick.';
};

export async function fetchVocabularyReviewEvents(userId: string, period: RetentionPeriod) {
  const { start, end } = getRetentionPeriodRange(period);
  const pageSize = 1000;
  const events: VocabularyReviewEvent[] = [];

  for (let page = 0; ; page += 1) {
    let query = supabase
      .from('vocabulary_review_events')
      .select('id, quality, reviewed_at')
      .eq('user_id', userId)
      .order('reviewed_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (start) query = query.gte('reviewed_at', start.toISOString());
    if (end) query = query.lt('reviewed_at', end.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    const pageEvents = (data || []) as VocabularyReviewEvent[];
    events.push(...pageEvents);
    if (pageEvents.length < pageSize) return events;
  }
}

export async function recordVocabularyReviewEvent({
  userId,
  vocabularyItemId,
  quality,
}: {
  userId: string;
  vocabularyItemId: string;
  quality: number;
}) {
  const { data, error } = await supabase
    .from('vocabulary_review_events')
    .insert({
      user_id: userId,
      vocabulary_item_id: vocabularyItemId,
      quality,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function completeVocabularyLearningActivity(
  activityId: string,
  reviewedCount: number
) {
  if (!activityId) return;
  const completedAt = new Date().toISOString();
  const { error } = await supabase
    .from('learning_path_activities')
    .update({
      is_completed: true,
      completed_at: completedAt,
      completion_source: 'vocabulary_review',
      outcome_score: reviewedCount,
      outcome_data: {
        verified: true,
        reviewed_count: reviewedCount,
        completed_at: completedAt,
      },
    })
    .eq('id', activityId)
    .eq('completion_policy', 'verified');

  if (error) throw error;
}
