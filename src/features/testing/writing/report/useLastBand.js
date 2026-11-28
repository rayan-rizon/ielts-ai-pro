/** The band this task got on the learner's previous reviewed attempt. */
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { lastBandIn } from './resultFacts';

const NONE = [];

async function fetchEarlierBands({ userId, sessionId, markedAt }) {
  const { data, error } = await supabase
    .from('test_sessions')
    .select('evaluated_at, task1:content_data->task1Band, task2:content_data->task2Band')
    // Staff can read other learners' rows, so the owner is named explicitly.
    .eq('user_id', userId)
    .eq('test_type', 'writing')
    .eq('evaluation_status', 'complete')
    .neq('id', sessionId)
    .lt('evaluated_at', markedAt)
    .order('evaluated_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || NONE;
}

export function useLastBand({ userId, sessionId, markedAt, taskType }) {
  const [rows, setRows] = useState(NONE);
  useEffect(() => {
    setRows(NONE);
    if (![userId, sessionId, markedAt].every(Boolean)) return undefined;
    let active = true;
    fetchEarlierBands({ userId, sessionId, markedAt })
      .then((found) => active && setRows(found))
      // The comparison is an extra; the report stands without it.
      .catch((error) => console.warn('[Writing] No earlier band:', error?.message));
    return () => {
      active = false;
    };
  }, [userId, sessionId, markedAt]);
  return lastBandIn(rows, taskType);
}
