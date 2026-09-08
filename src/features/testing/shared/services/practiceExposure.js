import { supabase } from '@/lib/supabase';
import { PRACTICE_LIBRARY_ENABLED } from '@/features/skill-lab/skills';

export async function markPartlyPractised(tests, user) {
  if (!user || !PRACTICE_LIBRARY_ENABLED || !tests.length) return tests;
  const { data, error } = await supabase
    .from('practice_library_exposure')
    .select('source_id')
    .in(
      'source_id',
      tests.map((test) => test.id)
    );
  if (error) throw new Error('Your practice history could not be loaded. Please try again.');
  const sources = new Set((data || []).map((row) => row.source_id));
  return tests.map((test) => ({ ...test, partly_practised: sources.has(test.id) }));
}
