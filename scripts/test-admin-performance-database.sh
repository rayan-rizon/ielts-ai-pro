#!/usr/bin/env bash
# Socket-only, disposable PostgreSQL. Does not connect to Supabase.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
pg_bin="${POSTGRES_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
scratch="$(mktemp -d /tmp/ielts-admin-performance.XXXXXX)"
cleanup() { "$pg_bin/pg_ctl" -D "$scratch/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$scratch"; }
trap cleanup EXIT
mkdir "$scratch/socket"
"$pg_bin/initdb" -D "$scratch/data" -A trust --no-locale >"$scratch/init.log"
"$pg_bin/pg_ctl" -D "$scratch/data" -l "$scratch/server.log" -o "-p 54441 -k $scratch/socket -c listen_addresses=''" start >/dev/null
performance_migration="$(find "$repo_root/supabase/migrations" -name '*_admin_panel_read_performance.sql')"
"$pg_bin/psql" -h "$scratch/socket" -p 54441 -d postgres -v ON_ERROR_STOP=1 -q \
 -f "$repo_root/supabase/tests/admin_performance/bootstrap.sql" \
 -f "$repo_root/supabase/tests/admin_performance/baseline.sql" \
 -f "$performance_migration" \
 -f "$repo_root/supabase/tests/admin_performance/assertions.sql"
