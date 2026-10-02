import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
export const HISTORY_CATEGORIES: Record<string, string[]> = {
  institution: ['create', 'update', 'invite_owner'],
  students: ['invite', 'accept', 'cancel', 'correct', 'extend', 'release', 'revoke'],
  pricing: ['pricing'],
  billing: ['quote', 'payment', 'refund', 'reconcile_refund', 'grant'],
};
export async function getInstitutionHistory(
  db: SupabaseClient,
  actor: string,
  input: Record<string, unknown>
) {
  const { data: profile, error: profileError } = await db
    .from('users')
    .select('role')
    .eq('auth_id', actor)
    .maybeSingle();
  if (profileError) throw profileError;
  if (profile?.role !== 'admin') throw new Error('Admin required');
  const id = String(input.institution_id || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw new Error('Invalid institution');
  const { data: institution, error: institutionError } = await db
    .from('institutions')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (institutionError) throw institutionError;
  if (!institution) throw new Error('Institution not found');
  const category = String(input.category || 'all');
  if (category !== 'all' && !HISTORY_CATEGORIES[category])
    throw new Error('Invalid history category');
  const cursor = input.cursor == null ? null : String(input.cursor);
  if (cursor && !/^\d{1,19}$/.test(cursor)) throw new Error('Invalid history cursor');
  const search = String(input.search || '').trim();
  if (search.length > 200) throw new Error('Search is too long');
  let query = db
    .from('institution_audit')
    .select('*')
    .eq('institution_id', id)
    .order('id', { ascending: false })
    .limit(26);
  if (cursor) query = query.lt('id', cursor);
  if (category !== 'all') query = query.in('action', HISTORY_CATEGORIES[category]);
  if (search) query = query.ilike('reason', `%${search.replace(/[\\%_]/g, '\\$&')}%`);
  const { data, error } = await query;
  if (error) throw error;
  const entries = (data || []).slice(0, 25);
  const ids = [...new Set(entries.map((row) => row.actor_auth_id).filter(Boolean))];
  let actors: Array<{
    auth_id: string;
    full_name: string | null;
    email: string | null;
    role: string;
  }> = [];
  if (ids.length) {
    const result = await db
      .from('users')
      .select('auth_id, full_name, email, role')
      .in('auth_id', ids);
    if (result.error) throw result.error;
    actors = result.data || [];
  }
  return {
    entries: entries.map((row) => ({
      ...row,
      actor: actors.find((person) => person.auth_id === row.actor_auth_id) || null,
    })),
    next_cursor: data && data.length > 25 ? String(entries[entries.length - 1].id) : null,
  };
}
