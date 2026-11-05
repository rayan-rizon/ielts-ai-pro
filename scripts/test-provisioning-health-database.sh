#!/usr/bin/env bash
# Socket-only disposable PostgreSQL. Never connects to the linked project.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
pg_bin="${POSTGRES_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
scratch="$(mktemp -d /tmp/ielts-provisioning-health.XXXXXX)"
cleanup() { "$pg_bin/pg_ctl" -D "$scratch/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$scratch"; }
trap cleanup EXIT
mkdir "$scratch/socket"
"$pg_bin/initdb" -D "$scratch/data" -A trust --no-locale >"$scratch/init.log"
"$pg_bin/pg_ctl" -D "$scratch/data" -l "$scratch/server.log" -o "-p 54442 -k $scratch/socket -c listen_addresses=''" start >/dev/null
"$pg_bin/psql" -h "$scratch/socket" -p 54442 -d postgres -v ON_ERROR_STOP=1 -q \
 -f "$repo_root/supabase/tests/provisioning_health/bootstrap.sql" \
 -f "$repo_root/supabase/migrations/20260922014842_ai_coach.sql" \
 -f "$repo_root/supabase/migrations/20260927021243_ai_coach_contextual_follow_ups.sql" \
 -c 'alter function public.get_platform_health(integer) rename to get_platform_health_core_v14;' \
 -f "$repo_root/supabase/migrations/20261105164214_reliable_auth_profile_provisioning.sql" \
 -f "$repo_root/supabase/migrations/20261105164228_ai_coach_diagnostics_and_bounded_health.sql" \
 -f "$repo_root/supabase/tests/provisioning_health/assertions.sql"
