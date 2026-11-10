#!/usr/bin/env bash
# Socket-only isolated PostgreSQL, using the real baseline schema and function.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
pg_bin="${POSTGRES_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
scratch="$(mktemp -d /tmp/ielts-speaking-finalization.XXXXXX)"
cleanup() { "$pg_bin/pg_ctl" -D "$scratch/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$scratch"; }
trap cleanup EXIT
mkdir "$scratch/socket"
"$pg_bin/initdb" -D "$scratch/data" -A trust --no-locale >"$scratch/init.log"
"$pg_bin/pg_ctl" -D "$scratch/data" -l "$scratch/server.log" -o "-k $scratch/socket -c listen_addresses=''" start >/dev/null
node --input-type=module - "$repo_root" "$scratch" <<'JS'
import fs from 'node:fs';
const [root, scratch] = process.argv.slice(2);
const baseline = fs.readFileSync(`${root}/supabase/migrations/20260902120537_complete_project_baseline.sql`, 'utf8');
const tables = ['speaking_session_state', 'speaking_turns'].map(name =>
  baseline.match(new RegExp(`CREATE TABLE IF NOT EXISTS public.${name} \\([\\s\\S]*?\\n\\);`))[0]);
const fn = baseline.match(/CREATE OR REPLACE FUNCTION public.finalize_speaking_v2_turn\([\s\S]*?\n\$\$;/)[0];
const advance = baseline.match(/CREATE OR REPLACE FUNCTION public.advance_speaking_v2_part\([\s\S]*?\n\$\$;/)[0];
fs.writeFileSync(`${scratch}/bootstrap.sql`, `
create schema auth;
create role anon; create role authenticated; create role service_role;
create function auth.jwt() returns jsonb language sql as $$ select current_setting('request.jwt.claims', true)::jsonb $$;
create table users(id uuid primary key, auth_id uuid);
create table test_sessions(id uuid primary key);
create table passages(id uuid primary key);
create table questions(id uuid primary key);
${tables.join('\n')}
${fn}
${advance}
insert into users values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
insert into test_sessions values ('00000000-0000-0000-0000-000000000003');
insert into passages values ('00000000-0000-0000-0000-000000000004');
insert into speaking_session_state(test_session_id,user_id,passage_id,mode,turn_limit,audio_limit_ms,remaining_active_seconds)
values ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','practice',10,60000,480);
insert into speaking_turns(test_session_id,user_id,idempotency_key,sequence_number,revision_before,part_number,question_index,reservation_status)
values ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','regression-key-0001',1,0,1,0,'completed');
`);
JS
"$pg_bin/psql" -h "$scratch/socket" -d postgres -v ON_ERROR_STOP=1 -q -f "$scratch/bootstrap.sql"
if [[ "${1:-}" != "--baseline" ]]; then
  for migration in "$repo_root"/supabase/migrations/*_speaking_turn_finalization_reliability.sql; do
    "$pg_bin/psql" -h "$scratch/socket" -d postgres -v ON_ERROR_STOP=1 -q -f "$migration"
  done
fi
"$pg_bin/psql" -h "$scratch/socket" -d postgres -v ON_ERROR_STOP=1 -f "$repo_root/supabase/tests/speaking_finalization.sql"
