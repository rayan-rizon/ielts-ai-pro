import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Pure merge helpers
// ---------------------------------------------------------------------------

function mergeTakenCounts(existing, freshRows) {
  const result = { ...existing };
  freshRows.forEach((item) => {
    if (item.passage_id) result[item.passage_id] = item.taken_count;
  });
  return result;
}

function mergeTestMeta(existingQCounts, existingDurs, testsData) {
  const qCounts = { ...existingQCounts };
  const durs = { ...existingDurs };
  testsData.forEach((test) => {
    qCounts[test.id] = test.total_questions || 3;
    durs[test.id] = test.duration_minutes || 15;
  });
  return { qCounts, durs };
}

function deduplicateSessions(sessionsData) {
  const byPassage = {};
  // sessionsData is already sorted by created_at desc
  sessionsData.forEach((s) => {
    const passageId = s.passage_id || s.content_data?.passage_id || s.content_data?.id;
    if (passageId && !byPassage[passageId]) {
      byPassage[passageId] = {
        id: s.id,
        passage_id: passageId,
        is_completed: s.is_completed,
        score: s.score,
        content_data: s.content_data || {},
        test_type: 'speaking',
        created_at: s.created_at,
      };
    }
  });
  return byPassage;
}

function mergeSessions(existingSessions, freshByPassage) {
  const freshArr = Object.values(freshByPassage);
  const newIds = new Set(freshArr.map((s) => s.passage_id));
  return [...(existingSessions || []).filter((s) => !newIds.has(s.passage_id)), ...freshArr];
}

// ---------------------------------------------------------------------------
// Supabase fetchers
// ---------------------------------------------------------------------------

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function safeObject(obj) {
  return obj && typeof obj === 'object' ? obj : {};
}

async function fetchPassages(offset, pageSize) {
  return supabase
    .from('passages')
    .select(
      'id, title, is_official_cambridge, cambridge_year, cambridge_test_number, test_type, test_format, is_active, total_questions, created_at, duration_minutes',
      { count: 'exact' }
    )
    .eq('test_type', 'speaking')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
}

async function fetchUserSessions(user, passageIds) {
  if (!user || passageIds.length === 0) return [];
  const { data, error } = await supabase
    .from('test_sessions')
    .select('id, passage_id, is_completed, score, content_data, created_at, completed_at')
    .eq('user_id', user.id)
    .eq('test_type', 'speaking')
    .in('passage_id', passageIds)
    .order('created_at', { ascending: false });
  return !error && data ? data : [];
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

function getExistingField(existingData, field) {
  return existingData ? existingData[field] : null;
}

function mergeAllPassages(existingData, testsData) {
  return existingData ? [...existingData.passages, ...safeArray(testsData)] : safeArray(testsData);
}

export async function fetchSpeakingData(user, page = 1, pageSize = 32, existingData = null) {
  const offset = (page - 1) * pageSize;

  const {
    data: testsData,
    count: totalCount,
    error: passageError,
  } = await fetchPassages(offset, pageSize);
  if (passageError) {
    console.error('Error fetching passages:', passageError);
  }

  const takenCountsResult = await supabase.rpc('get_test_taken_counts', {
    type_filter: 'speaking',
  });
  const passageIds = testsData ? testsData.map((t) => t.id) : [];
  const sessionsData = await fetchUserSessions(user, passageIds);
  const sessionsByPassage = deduplicateSessions(sessionsData);

  const prevCounts = getExistingField(existingData, 'testCounts');
  const takenData = takenCountsResult ? takenCountsResult.data : null;
  const testCounts = mergeTakenCounts(safeObject(prevCounts), safeArray(takenData));

  const prevQCounts = getExistingField(existingData, 'questionCounts');
  const prevDurs = getExistingField(existingData, 'durations');
  const { qCounts, durs } = mergeTestMeta(
    safeObject(prevQCounts),
    safeObject(prevDurs),
    safeArray(testsData)
  );

  const allPassages = mergeAllPassages(existingData, testsData);
  const allSessions = mergeSessions(getExistingField(existingData, 'sessions'), sessionsByPassage);

  const total = totalCount || 0;
  return {
    passages: allPassages,
    sessions: allSessions,
    testCounts,
    questionCounts: qCounts,
    durations: durs,
    currentUser: user,
    totalCount: total,
    currentPage: page,
    hasMore: allPassages.length < total,
  };
}
