# Admin panel read performance

Implemented and verified locally on 4 October 2026. The linked Supabase database
migration and `admin-payment-history` Edge Function are deployed. The frontend
changes are in this checkout and require a frontend deployment.

## Architecture

- Sidebar: one serialized, visibility-aware request stream for all four badges.
  See `sidebar-badges.md` for acknowledgement, backoff, and capped count semantics.
- Authorization: user ownership stays in RLS. Row-independent admin checks use
  scalar subqueries, evaluated once per statement. The existing configured MFA
  and recovery rules remain in `is_admin`; authorization is never cached across
  callers or requests. New bounded summaries check the current caller, use a
  fixed empty search path, and revoke anonymous execution.
- AI Usage: page/sort, lifetime totals/budget, and date-range charts have separate
  request lifecycles. Page changes fetch only one table RPC. Manual Refresh
  reloads all three groups. Superseded/unmounted responses cannot overwrite the
  current view. RPC errors remain errors rather than triggering truncated raw
  table fallbacks.
- AI SQL: endpoint breakdowns are calculated only for selected users; lifecycle,
  tracked provider cost, missing cost telemetry, and global ranking are preserved.
  Tied rows have a stable user ID order and out-of-range pages retain the total.
- Marketing: six datasets load for the initial Copilot tab, instead of thirteen.
  Other tab datasets load on demand and are reused within the mounted workspace.
  Refresh and mutations invalidate this cache. Requests are deduplicated while
  in flight. Missing data shows a loading/error state rather than false zeros.
  Campaign metrics are aggregated separately before joining, eliminating the
  deliveries × events × purchases multiplication. Campaigns with identical
  timestamps have a stable ID order. Prepare/send controls remain manual.
- Payments: manual history uses 50-row cursor pages, with SQL status/search
  filtering across the complete manual dataset. Stripe pages read at most 50
  raw Checkout Sessions and 50 paid invoices; institution payments use a 51-row
  lookahead. Provider cursors advance even when a raw page contains only excluded
  records. Each provider finishes independently. Filtering manual history does
  not refetch Stripe, and manual records can render while Stripe is loading.
  Retries retain the failed cursor and prior records. KPI labels explicitly refer
  to the loaded history, so a partial page cannot claim the full queue is clear.
- Renewal visibility: a renewal's original Checkout may be outside its current
  page. Distinct missing subscriptions are checked with concurrency capped at
  four. A worker holds up to 256 provenance results for five minutes. This cache
  holds no caller authorization. Existing paid IELTS provenance, test-promo and
  legacy test exclusions are preserved. Persisted payment transactions take
  precedence across pages; the bounded provider page checks for duplicates in
  the database. Approval, entitlement, billing and refund write paths are unchanged.
- Broadcasts: 25-row cursor pages include exact per-broadcast opens and global
  state/open totals calculated in SQL. Receipt rows are not downloaded to count
  them. Compose fields survive pagination. Errors retain previously loaded data.
- Referrals: total and top ten referrers are calculated across all records in SQL,
  replacing a ranking based on the first 100 referrals.
- Resources: normal lists remain small projections. Export alone fetches full
  content in 250-row ID cursor batches, including an insertion cutoff. Exports
  preserve article/vocabulary content and traverse beyond the API row limit.
- User/revenue analytics, resource lists, and feature request lists reject stale
  responses using the shared request lifecycle hook.

Cursor indexes support manual history (with and without status), broadcasts,
and institution billing history. Existing transaction/read receipt indexes
support the bounded duplicate and per-broadcast lookups.

## Verification

- 368 unit test files, 2,811 tests passed; production build, focused ESLint,
  `git diff --check`, and Edge Function type checking passed.
- Disposable PostgreSQL checks cover output parity, unused users, provider-cost
  lifecycle fields, ownership and write ownership, MFA/recovery, anonymous denial,
  105 payment records, 60 broadcasts, 1,501 receipts, and a referral leader beyond
  the previous 100-row sample. Badge database integration tests also pass.
- Migration application compared old/new results inside one repeatable-read
  transaction. All 967 user analytics records, AI aggregates, and Marketing metric
  values matched. Campaign ordering was canonicalized by ID for comparison because
  the old order was undefined for identical timestamps. No metric differences
  were permitted; an initial raw array-order mismatch rolled back automatically.
- Live role checks pass against the production authorization function. An
  uncommitted MFA configuration fixture exercised AAL1 denial; the entire test
  transaction rolled back. No business records were changed for these checks.
- Authenticated browser checks verify AI pagination (one RPC, no extra role reads),
  Marketing tab loading, manual payment status filtering (one RPC, no Stripe
  refetch), older Stripe cursor requests, broadcast loading, referral summary, and
  resource export data. The export response includes all 111 resources and all
  81 nonempty content fields. The in-app browser did not report a completed
  download event; the actual file-save step remains unconfirmed in that browser.

### Measured database execution

Five warmed post-change samples, excluding the first warmup:

| Operation                 |      Earlier audit sample | Post-change median |
| ------------------------- | ------------------------: | -----------------: |
| AI user page              |                  1,250 ms |           40.83 ms |
| AI lifetime totals        |                    623 ms |           61.65 ms |
| Authenticated usage count |                    501 ms |            1.77 ms |
| Marketing dashboard       | No comparable warm sample |            2.75 ms |

These are database execution times on the current dataset, not end-to-end page
latency or a capacity guarantee. Browser network latency is still part of page
load time. This work does not establish a dollar saving without billing and
traffic measurements.

## Scaling boundaries

Lifetime aggregates still scale with stored history; configuration lists are
loaded as complete small datasets. Resource exports keep their completed output
in browser memory, and payment search includes all manual records plus the Stripe
pages already loaded. Multiple admin tabs own separate badge streams. No large
concurrent-user or million-row load test was performed. Further growth should be
measured before adding maintained rollups, cross-tab polling coordination, or
streamed server exports; these introduce additional write and operational costs.

## Operations

Migrations:

- `20261003193239_admin_sidebar_badge_summary.sql`
- `20261003201132_admin_panel_read_performance.sql`

The second migration is additive apart from equivalent RLS expression/function
replacements and the coach-budget authorization guard. Existing old clients keep
working; legacy payment-history GET is supported. New clients omit absent nullable
GET cursor arguments so PostgREST applies SQL defaults instead of parsing the
literal text `null` as a timestamp.

No commit, push, or frontend deployment was performed. The database migration and
payment-history function are applied to the linked project. Production frontend
rollout is still required for the new UI request behavior.
