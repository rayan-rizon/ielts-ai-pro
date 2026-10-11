import { supabase } from '@/lib/supabase';

/**
 * Practice progress for one speaking report — which plan days were ticked
 * and the latest self-check for each re-answered question.
 *
 * Stored on the session row under content_data.reportPractice so it follows
 * the learner across devices without a new table. Only that key is merged;
 * the rest of content_data is read fresh and written back untouched.
 */

export const EMPTY_PRACTICE = Object.freeze({ days: {}, reanswers: {} });

export function normalizePractice(value) {
  return {
    days: value?.days && typeof value.days === 'object' ? value.days : {},
    reanswers: value?.reanswers && typeof value.reanswers === 'object' ? value.reanswers : {},
  };
}

export async function savePracticeState(sessionId, practice) {
  if (!sessionId) return false;
  const { data: current, error: readError } = await supabase
    .from('test_sessions')
    .select('content_data')
    .eq('id', sessionId)
    .single();
  if (readError) throw readError;

  const { error: updateError } = await supabase
    .from('test_sessions')
    .update({
      content_data: { ...current?.content_data, reportPractice: normalizePractice(practice) },
    })
    .eq('id', sessionId);
  if (updateError) throw updateError;
  return true;
}

/** Local calendar day, so a tick made at 11 pm counts for today, not tomorrow (UTC). */
export function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** The seven days of the plan, starting on the day the report was made. */
export function planWeek(startDate) {
  const start = new Date(startDate);
  const base = Number.isNaN(start.getTime()) ? new Date() : start;
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(base);
    day.setDate(base.getDate() + index);
    return {
      key: localDayKey(day),
      short: day.toLocaleDateString('en-GB', { weekday: 'narrow' }),
      label: day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }),
    };
  });
}
