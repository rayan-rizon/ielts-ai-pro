import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260908214032_correct_latest_session_progress_count.sql'
  ),
  'utf8'
);

describe('get_user_latest_sessions repair', () => {
  it('derives progress from saved answers instead of a removed table column', () => {
    expect(migration).not.toContain('ts.progress_percentage');
    expect(migration).not.toContain('jsonb_object_length');
    expect(migration).toContain('from jsonb_object_keys(ts.user_responses)');
    expect(migration).toContain("ts.content_data ->> 'total_questions'");
  });

  it('keeps cross-user access behind the shared authorization check', () => {
    expect(migration).toContain('if not public.can_access_user_id(p_user_id) then');
    expect(migration).toContain("errcode = '42501'");
  });

  it('does not expose the function to signed-out callers', () => {
    expect(migration).toMatch(
      /get_user_latest_sessions\(uuid, text, uuid\)[\s\S]*from public, anon;[\s\S]*to authenticated, service_role;/
    );
  });
});
