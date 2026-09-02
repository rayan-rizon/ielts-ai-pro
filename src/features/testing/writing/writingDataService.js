import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Taken counts + meta mergers (pure)
// ---------------------------------------------------------------------------

function mergeTakenCounts(existing, freshRows) {
  const result = { ...existing };
  freshRows.forEach((item) => {
    if (item.passage_id) result[item.passage_id] = item.taken_count;
  });
  return result;
}

function mergeTestMeta(existingDurs, existingWLimits, testsData) {
  const durs = { ...existingDurs };
  const wLimits = { ...existingWLimits };
  testsData.forEach((test) => {
    durs[test.id] = test.duration_minutes || (test.test_type === 'task1' ? 20 : 40);
    wLimits[test.id] = test.word_limit || (test.test_type === 'task1' ? 150 : 250);
  });
  return { durs, wLimits };
}

function mergeSessions(existingSessions, freshSessions) {
  const newIds = new Set(freshSessions.map((s) => s.passage_id));
  return [...(existingSessions || []).filter((s) => !newIds.has(s.passage_id)), ...freshSessions];
}

// ---------------------------------------------------------------------------
// Supabase fetchers
// ---------------------------------------------------------------------------

async function fetchPassages(offset, pageSize) {
  return supabase
    .from('passages')
    .select(
      'id, title, is_official_cambridge, cambridge_year, cambridge_test_number, test_type, test_format, is_active, total_questions, created_at, duration_minutes',
      { count: 'exact' }
    )
    .eq('test_type', 'writing')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
}

function getPassageIds(testsData) {
  return testsData ? testsData.map((t) => t.id) : [];
}

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function safeObject(obj) {
  return obj && typeof obj === 'object' ? obj : {};
}

async function fetchUserSessions(user, passageIds) {
  if (!user || passageIds.length === 0) return [];
  const { data, error } = await supabase
    .from('test_sessions')
    .select('id, passage_id, is_completed, score, content_data, created_at, completed_at')
    .eq('user_id', user.id)
    .eq('test_type', 'writing')
    .in('passage_id', passageIds)
    .order('created_at', { ascending: false });
  return !error && data ? data : [];
}

// ---------------------------------------------------------------------------
function getExistingField(existingData, field) {
  return existingData ? existingData[field] : null;
}

function mergeAllPassages(existingData, testsData) {
  return existingData ? [...existingData.passages, ...safeArray(testsData)] : safeArray(testsData);
}

function mergeAllSessions(existingData, writingSessions) {
  return existingData ? mergeSessions(existingData.sessions, writingSessions) : writingSessions;
}

export async function fetchWritingData(user, page = 1, pageSize = 32, existingData = null) {
  const offset = (page - 1) * pageSize;

  const {
    data: testsData,
    count: totalCount,
    error: passageError,
  } = await fetchPassages(offset, pageSize);
  if (passageError) {
    console.error('Error fetching passages:', passageError);
  }

  const takenCountsResult = await supabase.rpc('get_test_taken_counts', { type_filter: 'writing' });
  const passageIds = getPassageIds(testsData);
  const writingSessions = await fetchUserSessions(user, passageIds);

  const prevCounts = getExistingField(existingData, 'testCounts');
  const takenData = takenCountsResult ? takenCountsResult.data : null;
  const testCounts = mergeTakenCounts(safeObject(prevCounts), safeArray(takenData));

  const prevDurs = getExistingField(existingData, 'durations');
  const prevWLimits = getExistingField(existingData, 'wordLimits');
  const { durs, wLimits } = mergeTestMeta(
    safeObject(prevDurs),
    safeObject(prevWLimits),
    safeArray(testsData)
  );

  const allPassages = mergeAllPassages(existingData, testsData);
  const allSessions = mergeAllSessions(existingData, writingSessions);

  const total = totalCount || 0;
  return {
    passages: allPassages,
    sessions: allSessions,
    testCounts,
    durations: durs,
    wordLimits: wLimits,
    currentUser: user,
    totalCount: total,
    currentPage: page,
    hasMore: allPassages.length < total,
  };
}
