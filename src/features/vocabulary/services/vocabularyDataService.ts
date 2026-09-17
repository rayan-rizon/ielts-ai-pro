import { VocabularyItem } from './VocabularyItem';
import { supabase } from '@/lib/supabase';

export const VOCABULARY_LIST_FIELDS =
  'id, word, definition, example, example_sentence, source, times_reviewed, last_reviewed, next_review_date, mastery_level, ease_factor, interval_days, created_at, user_id, created_by';

export const ITEMS_PER_PAGE = 50;

export async function fetchVocabularyItems(userId: string) {
  try {
    const res = await VocabularyItem.list(
      { user_id: userId },
      '-created_at',
      100,
      1,
      ITEMS_PER_PAGE,
      VOCABULARY_LIST_FIELDS
    );
    if (res && 'data' in res) return { items: res.data, count: res.count || res.data.length };
    if (Array.isArray(res)) return { items: res, count: res.length };
    return { items: [], count: 0 };
  } catch (err) {
    console.error('Failed to load vocabulary items:', err);
    return { items: [], count: 0 };
  }
}

export async function fetchDueItems(allItems: any[]) {
  const isReviewable = (item: any) =>
    typeof item?.definition === 'string' &&
    Boolean(item.definition.trim()) &&
    !/^(saved ielts vocabulary word|no definition)$/i.test(item.definition.trim());
  try {
    const res = await supabase.rpc('get_due_vocabulary', { p_limit: 50 });
    const hasData = Array.isArray(res.data) && res.data.length > 0;
    if (hasData) {
      return res.data.filter(isReviewable);
    }
  } catch {
    console.warn('[Vocab] RPC unavailable, calculating client-side');
  }

  // Fallback: Calculate client-side
  const now = new Date();
  return allItems.filter(
    (item) =>
      isReviewable(item) && (!item.next_review_date || new Date(item.next_review_date) <= now)
  );
}

const countConsecutiveDays = (reviewDates: string[], startIndex: number) => {
  let streak = 1;
  for (let i = startIndex + 1; i < reviewDates.length; i++) {
    const prevDate = new Date(reviewDates[i - 1]).getTime();
    const currDate = new Date(reviewDates[i]).getTime();
    const diffDays = (prevDate - currDate) / (1000 * 3600 * 24);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
};

export const calculateStats = (allVocabulary: any[]) => {
  const masteredWords = allVocabulary.filter((item) => (item.mastery_level || 0) >= 4).length;

  const reviewDates = [
    ...new Set(
      allVocabulary
        .filter((item) => item?.last_reviewed)
        .map((item) => new Date(item.last_reviewed).toDateString())
    ),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  if (reviewDates.length > 0) {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (reviewDates[0] === today || reviewDates[0] === yesterday) {
      streak = countConsecutiveDays(reviewDates, 0);
    }
  }

  const retentionRate =
    allVocabulary.length > 0 ? Math.round((masteredWords / allVocabulary.length) * 100) : 0;

  return {
    totalWords: allVocabulary.length,
    masteredWords,
    streak,
    retention: retentionRate,
  };
};
