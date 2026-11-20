import { supabase } from '@/lib/supabase';

const CATALOGUE_COLUMNS =
  'id,title,is_official_cambridge,cambridge_year,cambridge_test_number,test_type,test_format,is_active,total_questions,created_at,duration_minutes,access_tier';
const CATALOGUE_BATCH = 500;

function catalogueQuery(testType, columns, options) {
  return supabase
    .from('library_passages')
    .select(columns, options)
    .eq('test_type', testType)
    .eq('is_active', true)
    .order('created_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true });
}

async function newestFreeIds(testType, freeLimit) {
  const ids = new Set();

  for (let offset = 0; offset < freeLimit; offset += CATALOGUE_BATCH) {
    const end = Math.min(offset + CATALOGUE_BATCH, freeLimit);
    const { data, error } = await catalogueQuery(testType, 'id')
      .eq('access_tier', 'free')
      .range(offset, end - 1);
    if (error) throw error;
    for (const paper of data) ids.add(paper.id);
    if (data.length < end - offset) break;
  }

  return ids;
}

async function fetchStarterPage(testType, offset, end, freeLimit) {
  if (offset >= freeLimit) return { data: [], totalCount: 0 };

  const { data, count, error } = await catalogueQuery(testType, CATALOGUE_COLUMNS, {
    count: 'exact',
  })
    .eq('access_tier', 'free')
    .range(offset, Math.min(end, freeLimit) - 1);
  if (error) throw error;
  return {
    data: data.map((test) => ({ ...test, free_starter: true })),
    totalCount: Math.min(count ?? 0, freeLimit),
  };
}

export async function fetchObjectiveCatalogue(
  testType,
  { page, pageSize, starterOnly, freeLimit }
) {
  const offset = (page - 1) * pageSize;
  const end = offset + pageSize;
  if (starterOnly) return fetchStarterPage(testType, offset, end, freeLimit);

  const [result, starterIds] = await Promise.all([
    catalogueQuery(testType, CATALOGUE_COLUMNS, { count: 'exact' }).range(offset, end - 1),
    freeLimit >= 0 ? newestFreeIds(testType, freeLimit) : null,
  ]);
  if (result.error) throw result.error;
  const tests = result.data ?? [];
  const data = starterIds
    ? tests.map((test) => ({ ...test, free_starter: starterIds.has(test.id) }))
    : tests;
  return { data, totalCount: result.count ?? 0 };
}
