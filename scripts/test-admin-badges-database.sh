#!/usr/bin/env bash
# Socket-only isolated PostgreSQL; never connects to the linked project.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
pg_bin="${POSTGRES_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
if [[ ! -x "$pg_bin/initdb" ]]; then pg_bin="$(dirname "$(command -v initdb)")"; fi
scratch="$(mktemp -d /tmp/ielts-admin-badge-tests.XXXXXX)"
cleanup() { "$pg_bin/pg_ctl" -D "$scratch/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$scratch"; }
trap cleanup EXIT
mkdir "$scratch/socket"
"$pg_bin/initdb" -D "$scratch/data" -A trust --no-locale >"$scratch/init.log"
"$pg_bin/pg_ctl" -D "$scratch/data" -l "$scratch/server.log" -o "-p 54440 -k $scratch/socket -c listen_addresses=''" start >/dev/null
badge_migration="$(find "$repo_root/supabase/migrations" -name '*_admin_sidebar_badge_summary.sql')"
"$pg_bin/psql" -h "$scratch/socket" -p 54440 -d postgres -v ON_ERROR_STOP=1 -q \
 -f "$repo_root/supabase/tests/admin_badges/bootstrap.sql" \
 -f "$badge_migration" \
 -f "$repo_root/supabase/tests/admin_badges/lifecycle.sql"
