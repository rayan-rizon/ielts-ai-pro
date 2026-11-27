/*
 * `users.settings` holds several independent choices (default test mode, report
 * language, practice added to the study plan). `upsert_user_profile` ignores the
 * column, so it is written directly; row-level security limits that to the
 * learner's own row.
 *
 * Every write goes through here: it reads the stored value first and changes
 * only the keys it is given, so one choice never wipes another.
 */

const asObject = (value) => (value && typeof value === 'object' ? value : {});

async function ownRow(client) {
  const db = client ?? (await (await import('@/lib/supabase')).getSupabaseClient());
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error('Sign in again to save your settings.');

  const { data: row, error } = await db
    .from('users')
    .select('settings')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return { db, authId: user.id, settings: asObject(row?.settings) };
}

export async function readOwnSettings({ client } = {}) {
  return (await ownRow(client)).settings;
}

async function write(patch, client) {
  const { db, authId, settings } = await ownRow(client);
  const changes = typeof patch === 'function' ? patch(settings) : patch;
  const { data, error } = await db
    .from('users')
    .update({ settings: { ...settings, ...changes }, updated_at: new Date().toISOString() })
    .eq('auth_id', authId)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Your change was not saved. Please try again.');

  window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: data }));
  return data;
}

// One write at a time: two saves reading the same value would drop one change.
let queue = Promise.resolve();

/**
 * Merges `patch` (keys, or a function of the stored settings returning keys)
 * into the learner's settings and returns the saved profile row.
 */
export function mergeOwnSettings(patch, { client } = {}) {
  const saved = queue.then(() => write(patch, client));
  queue = saved.catch(() => {});
  return saved;
}
