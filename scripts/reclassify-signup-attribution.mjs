// Read-only by default. Run after deploying the channel UI; --apply requires a private backup directory.
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { classifyChannel, getAIProvider } from '../src/lib/attribution.js';

dotenv.config({ quiet: true });
const apply = process.argv.includes('--apply');
const backupArg = process.argv.find((arg) => arg.startsWith('--backup-dir='));
if (apply && !backupArg) throw new Error('--apply requires --backup-dir=/private/absolute/path');
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const fields = [
  'signup_channel',
  'signup_utm_source',
  'signup_utm_medium',
  'signup_utm_campaign',
  'signup_utm_content',
  'signup_utm_term',
  'signup_referrer',
  'signup_landing_page',
  'signup_gclid',
  'signup_fbclid',
];
const rows = [];
for (let offset = 0; ; offset += 1000) {
  const { data, error } = await client
    .from('users')
    .select(['id', 'role', ...fields].join(','))
    .order('id')
    .range(offset, offset + 999);
  if (error) throw error;
  rows.push(...data.filter((row) => row.role !== 'admin'));
  if (data.length < 1000) break;
}
const corrections = rows.flatMap((row) => {
  const evidence = Object.fromEntries(fields.map((field) => [field.slice(7), row[field]]));
  // A missing source stays missing. Never manufacture evidence or backfill from login provider.
  if (
    !['utm_source', 'utm_medium', 'utm_campaign', 'referrer', 'gclid', 'fbclid'].some(
      (key) => evidence[key]
    )
  )
    return [];
  const channel = classifyChannel(evidence);
  const source =
    row.signup_utm_source || (channel === 'ai_referral' ? getAIProvider(evidence) : null);
  if (channel === row.signup_channel && source === row.signup_utm_source) return [];
  return [{ before: row, after: { signup_channel: channel, signup_utm_source: source } }];
});
console.log(
  JSON.stringify(
    {
      mode: apply ? 'apply' : 'dry-run',
      scanned: rows.length,
      corrections: corrections.length,
      transitions: corrections.reduce((counts, item) => {
        const key = `${item.before.signup_channel || 'unknown'} -> ${item.after.signup_channel}`;
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {}),
    },
    null,
    2
  )
);
if (apply) {
  const directory = backupArg.slice('--backup-dir='.length);
  if (!path.isAbsolute(directory)) throw new Error('Backup directory must be absolute');
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const file = path.join(
    directory,
    `signup-attribution-${new Date().toISOString().replaceAll(':', '-')}.json`
  );
  fs.writeFileSync(file, JSON.stringify(corrections, null, 2), { flag: 'wx', mode: 0o600 });
  let updated = 0;
  for (const { before, after } of corrections) {
    let query = client.from('users').update(after).eq('id', before.id);
    // Compare every original field: skip any record changed since the read/backup.
    for (const field of fields)
      query = before[field] == null ? query.is(field, null) : query.eq(field, before[field]);
    const { data, error } = await query.select('id');
    if (error) throw error;
    if (data.length !== 1)
      throw new Error('Concurrent attribution update detected; stopped. Rerun the dry-run.');
    const { data: verified, error: readError } = await client
      .from('users')
      .select('signup_channel,signup_utm_source')
      .eq('id', before.id)
      .single();
    if (
      readError ||
      verified.signup_channel !== after.signup_channel ||
      verified.signup_utm_source !== after.signup_utm_source
    ) {
      throw new Error('Post-update verification failed; stopped. Consult the private backup.');
    }
    updated++;
  }
  console.log(JSON.stringify({ updated, verified: updated, backup: file }));
}
