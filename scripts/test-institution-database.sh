#!/usr/bin/env bash
# Starts an isolated, socket-only PostgreSQL cluster; never connects to the linked project.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
pg_bin="${POSTGRES_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
if [[ ! -x "$pg_bin/initdb" ]]; then pg_bin="$(dirname "$(command -v initdb)")"; fi
scratch="$(mktemp -d /tmp/ielts-institution-tests.XXXXXX)"
cleanup() { "$pg_bin/pg_ctl" -D "$scratch/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$scratch"; }
trap cleanup EXIT
mkdir "$scratch/socket"
"$pg_bin/initdb" -D "$scratch/data" -A trust --no-locale >"$scratch/init.log"
"$pg_bin/pg_ctl" -D "$scratch/data" -l "$scratch/server.log" -o "-p 54439 -k $scratch/socket -c listen_addresses=''" start >/dev/null
# Load the real deployed quota function bodies so the migration rewrite is exercised.
python3 - "$repo_root" "$scratch/quotas.sql" <<'PYCODE'
import pathlib, re, sys
root=pathlib.Path(sys.argv[1]); source=(root/'supabase/migrations/20260927100000_exam_pass_paid_access_expiry.sql').read_text()
parts=[]
for name in ['check_user_rate_limit','reserve_ai_api_usage','current_subscription_tier']:
    start=source.index('CREATE OR REPLACE FUNCTION public.'+name+'(')
    end=source.index('$$;', start)+3
    parts.append(source[start:end])
objective=(root/'supabase/migrations/20260923111404_reading_listening_start_limits.sql').read_text()
start=objective.index('create function objective_private.test_start_status('); end=objective.index('end $$;',start)+8
parts.append(objective[start:end])
pathlib.Path(sys.argv[2]).write_text('\n'.join(parts))
PYCODE
"$pg_bin/psql" -h "$scratch/socket" -p 54439 -d postgres -v ON_ERROR_STOP=1 -q \
 -f "$repo_root/supabase/tests/institution/bootstrap.sql" \
 -f "$scratch/quotas.sql" \
 -f "$repo_root/supabase/migrations/20261002214310_institution_subscriptions.sql" \
 -f "$repo_root/supabase/migrations/20261002215002_institution_foreign_key_indexes.sql" \
 -f "$repo_root/supabase/migrations/20261003000022_institution_applications.sql" \
 -f "$repo_root/supabase/tests/institution/storage-bootstrap.sql" \
 -f "$repo_root/supabase/migrations/20261015130423_institution_dashboard_branding.sql" \
 -f "$repo_root/supabase/tests/institution/lifecycle.sql" \
 -f "$repo_root/supabase/tests/institution/branding.sql" \
 -f "$repo_root/supabase/tests/institution/applications.sql"
python3 "$repo_root/supabase/tests/institution/concurrency.py" "$pg_bin/psql" "$scratch/socket"
echo 'Institution database integration checks passed.'
