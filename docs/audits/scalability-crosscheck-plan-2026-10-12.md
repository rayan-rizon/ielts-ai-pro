# IELTS AI Pro: scalability crosscheck and implementation plan

Audit date: 12 October 2026, Asia/Dhaka. Read-only production investigation.
Project: `zvrmvycajimjxghrnpgy` (IELTS Ai Pro), PostgreSQL 17, us-east-2.

Implementation follow-up (13 October): see
[fixes and verification](scalability-fixes-verification-2026-10-13.md) for the
applied database migrations, tested frontend changes and remaining measurements.

## Decision

Keep Supabase. First remove the measured dashboard timezone lookup cost,
reduce redundant settings/activity requests, and fix the blog index projection.
Investigate the public Resources API latency separately before attributing it
to missing indexes. Extend existing Writing safeguards into a durable workflow
only after the smaller changes and failure-recovery verification.

## Evidence and boundaries

Compared the full referenced conversation `6acc2bf4-9584-83ec-b570-41f2d35ddfda`
with current working-tree source, Git HEAD, live function definitions, deployed
Writing Edge Function source, live indexes/policies/advisors, cron history,
direct SQL plans, and a fresh rolling 24-hour API/Edge log window.

Graphify was queried first; its graph uses older node identifiers, so source
and deployed database definitions were used to confirm findings.

Production frontend bundle/browser behavior, historical peak CPU/IO, provider
limits, and authenticated end-to-end load capacity were not measured. Local
dirty maintenance changes are present; Git HEAD polls settings every 120 seconds,
while the working tree polls every 30 seconds. Neither is proof of the currently
served browser bundle. No production configuration, schema, function, or source
implementation was changed during this audit.

Fresh database snapshot: 168,750,227 bytes (~160.9 MiB), 18 connections against
`max_connections=60`, 1 active connection including the inspection, 97 public
tables. This is a point-in-time observation, not peak capacity or available
application connection budget. Largest approximate live-row count was
`skill_proficiency` 19,906; `test_sessions` was 2,240. Cumulative counters reset
at different times; `pg_stat_statements` reset on 16 January 2026. Do not use its
old average timings as a current-code benchmark.

### Fresh API observations

The rolling window shifts as queries run. Counts are approximate snapshots;
compare normalized sessions and identical windows during implementation.
Timing is the gateway `x_envoy_upstream_service_time`, not browser latency
and not isolated SQL execution. OPTIONS requests are excluded below.

| Request                      | Count | Mean upstream ms | p95 upstream ms |
| ---------------------------- | ----: | ---------------: | --------------: |
| system_settings GET          | 4,179 |             53.0 |           209.1 |
| update_user_last_active POST | 1,820 |             72.0 |           296.6 |
| test_sessions PATCH          | 1,026 |            119.1 |           343.2 |
| test_sessions GET            |   431 |             83.2 |           317.5 |
| resources GET                |   889 |          1,135.4 |         9,450.6 |
| get_dashboard_stats POST     |    86 |            895.4 |         1,376.5 |

### What the earlier audit gets right, and what changes

1. **Dashboard timezone lookup: confirmed.** Live `get_dashboard_stats(text)`
   validates the supplied timezone and, on fallback, the saved timezone with
   `pg_timezone_names`. Direct `EXPLAIN ANALYZE` took 774.230 ms, filtering 1,193
   other rows. Direct `now() AT TIME ZONE 'Asia/Dhaka'` took 2.001 ms. These are
   individual probes, not whole-RPC before/after results. All dashboard aggregate
   costs still need profiling after removing validation overhead.
2. **Resources requests: stronger latency signal, uncertain root cause.**
   Anon requests dominated (754, mean ~1,296 ms, p95 ~9,567 ms), while authenticated
   requests were faster (134, mean ~237 ms). Query mix differs; this does not
   demonstrate that the role itself causes latency. The unbounded full-content
   blog list had 105 requests, mean ~3,498 ms and p95 ~12,345 ms. A privileged SQL
   plan for that selection took 0.360 ms, but did not reproduce RLS, PostgREST
   JSON serialization, network transfer, pool waiting, or full TOAST extraction.
   Do not call the database query the proven cause of the 9-second API tail.
3. **Existing Resources optimization was understated.** `useResources` already
   has a 5-minute stale time, pagination, and excludes content by default;
   dashboard study resources have a 15-minute stale time. `api/blog.js` bypasses
   that client cache and fetches full `ARTICLE_FIELDS`, including `content`, for
   the index without a limit. There are 80 published blogs, totaling 771,006
   content bytes before JSON/transport overhead. It already sets 5-minute CDN
   caching and stale-while-revalidate; verify actual deployed HIT/MISS behavior.
4. **Settings deduplication: confirmed source gap.** `SystemSetting.getAll()`
   selects all rows. Refresh has no shared in-flight promise/cooldown. Local
   focus, visibility, polling, and storage events can converge on refreshes;
   receiving a cache storage event triggers another network fetch rather than
   adopting the published result. Preserve maintenance freshness and initial
   gating while reducing this fan-out.
5. **Activity writes: confirmed.** The client calls on authentication/focus
   events without throttling. The live RPC unconditionally updates both
   `last_active` and `updated_at`; a trigger also maintains daily activity history.
6. **Autosave: partly corrected.** Forced saves bypass the answer-change check
   and the legacy branch sends merged `content_data`. But ordinary saves have
   an in-flight guard, and manual `saveNow()` calls are serialized and wait for
   the active save. Do not describe serialization as wholly missing. Reading/
   Listening server-scored saves use `objectiveRequest`, and paired sessions
   save every 5 seconds; optimize these paths separately.
7. **Large session lists: confirmed narrower scope.** Generic `TestSession.list`
   defaults to 10,000 and `*`; `AdminUserDetails.jsx` calls it with those defaults
   and calculates performance on the client. The learner dashboard already
   requests only 20 recent sessions. Preserve lifetime statistics when paginating
   the admin list by moving its summaries into an authorized aggregate RPC.
8. **Writing protections already exist, including in deployment.** The live
   `generateDetailedFeedback` has input-fingerprint quota reservations,
   already-reserved recovery, feedback caching, finalization, and AbortController
   timeouts. The browser additionally claims evaluation status and recovers stale
   pending evaluations. Durable job execution and bounded worker concurrency are
   extensions to these mechanisms, not a replacement for absent safeguards.
9. **Speaking errors need interpretation.** The fresh sample had 76 POSTs:
   45 returned 200, 31 returned 410. Source returns 410 for expired sessions;
   investigate client retry/expiry behavior, not a supposed 41% server-error rate.
   Speaking already passes revision and idempotency keys for turns.
10. **Nagad polling exists but is lower priority.** Fixed 3-second polling for
    up to 40 checks is confirmed. Fresh status-call sample is small. Checkout had
    one 503 among eight requests; remaining non-200 statuses were 4xx and need
    reason-specific interpretation.

Fresh Writing sample: 6 detailed-feedback POSTs, mean ~21.55 seconds, p95 ~40.01
seconds, all 200. Small sample: no reliable population percentile or concurrency
capacity inference. Reading Assistant had 114 POSTs, p95 ~6.18 seconds. Separate
provider generation, retrieval, validation/calibration passes, quota SQL, and
persisting results before choosing a model or reducing accuracy checks.

### Database advisories and scheduled work

- 9 uncovered foreign keys: Coach messages/user, proposals/conversation/message,
  activity links/conversation/source-session/completed-session, private exercise
  answers/user, and private operations/conversation. Confirm query/delete paths
  and table volume before adding covering indexes.
- Existing dashboard indexes already cover `(user_id,is_completed,completed_at)`
  and user/completed/score access; avoid duplicate speculative indexes.
- 63 unused-index notices are not authorization to delete indexes.
- 37 RLS-without-policy notices include intentional private/server-only tables.
- 3 mutable search paths: `validate_writing_coaching_insert`,
  `claim_writing_transformation`, `claim_writing_revision_check`.
- 2 anon-callable SECURITY DEFINER functions: `get_leaderboard` and
  `increment_resource_view`; 108 authenticated-callable functions. These counts
  are exposure review candidates, not demonstrated authorization vulnerabilities.
- The three minute jobs each had 1,440 successful executions and mean runtimes
  ~16–26 ms. This does not support disabling them as a current bottleneck.

References: [query optimization](https://supabase.com/docs/guides/database/query-optimization),
[missing FK indexes](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys),
[mutable search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable),
[RPC exposure](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[Queues](https://supabase.com/docs/guides/queues).

## Implementation order and acceptance gates

Targets below are proposed acceptance criteria, not measured improvements or
capacity guarantees. Ship independently so a regression can be traced and rolled back.

### Phase 0: baseline and reproduction

- Record browser dashboard p50/p95, each request's duration/bytes, and requests per
  visible user-minute. Segment API logs by endpoint, query shape, role, time bucket,
  and status. Record CPU/IO, pool wait, active connections, and real errors.
- Reproduce public blog API latency with the same anon projection, both cold and
  warm, and from the frontend hosting region and Bangladesh. Capture server fetch
  timing, JSON bytes, cache status, and correlated database activity. Use bounded
  read-only probes; do not run load tests against production.

### Phase 1: first release, highest confidence

**A. Dashboard timezone validation (P0).**
Replace per-request enumeration with an indexed private timezone registry,
seeded from the server timezone names in a migration, using exact-name matching
and existing supplied -> saved -> UTC precedence. Define refresh on PostgreSQL/
tzdata upgrades. Keep security/execute permissions unchanged. Alternatively,
benchmark guarded direct conversion, but test its accepted names versus the
existing whitelist before choosing it.

Preserve DST day boundaries, invalid/empty inputs, saved-timezone fallback,
streaks, abandoned-session exclusion, measured duration, and activity deduplication.
Target timezone validation <5 ms and dashboard upstream p95 <300 ms under the
same low-load environment. Benchmark full authenticated RPC, not just a lookup;
profile remaining aggregates if the end-to-end target is missed.

**B. Settings request coordination (P1, next to the maintenance change).**
Centralize public settings access; share an in-flight request and a short freshness
cooldown across focus/visibility events. Consume validated, versioned cross-tab
results, with a polling-leader lease/fallback if multiple visible tabs are common.
Keep a manual forced refresh after admin saves and immediate checks of scheduled
maintenance boundaries. Split maintenance/banner from unrelated settings; expose
only the public keys through any shared endpoint. Start with browser coordination;
add shared public caching only after its invalidation/freshness contract is tested.

Acceptance: no duplicate concurrent reads; storage publication does not cause
another fetch in every tab; maintenance activation reaches open sessions within
30 seconds; initial gate and admin recovery still work; closed leader recovers.

**C. Blog index projection and cache investigation (P1).**
Give `api/blog.js` an index-only column projection excluding article content.
Keep full content only for the detail page; preserve filters, category counts,
pagination, SEO/structured data, related posts, and publication scheduling.
Initially 80 small metadata rows may be adequate; add bounded server pagination
as the catalog grows without changing totals to page-local counts.

Acceptance: index requests contain no article body; compare bytes before/after;
verify deployed CDN HIT/MISS plus publish/unpublish invalidation. Add a bounded
upstream timeout and safe uncached failure response. Investigate pool/API tail
latency if still present. A fast privileged SQL plan alone does not pass this gate.

### Phase 2: writes and bounded histories

**D. Activity throttle (P1).** Client throttle per authenticated user, shared
across tabs; server conditional update, initially at most once per ~5 minutes.
Always allow first activity of a new Asia/Dhaka day even within the throttle.
Retain ownership checks and daily-history capture. Document latest-seen precision
for analytics and retention automation. Compare actual writes per active user,
not raw request totals; verify midnight and sign-in/account-switch behavior.

**E. Autosave (P1).** Preserve existing queues and submission flush guarantees.
Track dirty answers plus meaningful metadata; exclude `last_saved_at` from dirty
comparison, but preserve elapsed-time checkpoints even with unchanged answers.
Coalesce retries to the newest revision and verify recovery cannot overwrite newer
state. Test offline -> online, multiple tabs, navigation, submit during a save,
hidden-tab events, and paired/server-scored branches. Split immutable content
from progress only if measured payload/WAL costs justify a separate migration;
do not make it a prerequisite for basic deduplication. Browser unload async writes
are not guaranteed durability; retain a recoverable draft strategy.

**F. Session history (P1).** Add an explicit bounded metadata history method,
stable `(created_at,id)` cursor, and separately fetch full details for resume.
Move AdminUserDetails lifetime summaries to an authorized aggregate RPC before
switching that caller. Target 25–50 metadata rows per page, zero large content
fields in list responses, accurate all-history summaries, and full resume fidelity.

### Phase 3: AI lifecycle and targeted hardening

**G. Writing durable jobs (P1, architectural work).** Preserve evaluator accuracy
and the current fingerprint/quota ledger. Persist submission/task/version and job
identity before execution; atomically reserve quota and enqueue; return a job ID
promptly. Use a durable queue with leased workers, bounded concurrency, capped
retry/backoff, terminal failure handling, and server-owned status. Store task
results, fence stale workers, and recover results across page reloads. Associate
quota settlement/release with the existing reservation exactly once; workers and
queue delivery remain at-least-once. A provider call can repeat after a crash unless
the provider offers idempotency: track that residual cost risk explicitly.

Acceptance: duplicate submit shares the job; duplicate delivery does not double
settle quota; crash after provider success/persist/settlement is recoverable;
late results cannot replace a newer essay/version; no permanently pending jobs.
Use mocked providers for concurrency/chaos tests, then a small capped real sample.
Model/fallback/output-budget changes must update `aiModelRegistry.ts` together.

Keep live Speaking turns synchronous/streaming; investigate expired-session client
behavior first. Only post-session final evaluations are candidates for this queue.

**H. Indexes/security (parallel release work after triage).** Add only validated
Coach FK indexes; pin search paths with schema-qualified dependencies and test
permissions. Review high-risk quota/payment/admin RPC ownership checks and bounds
before broad privilege changes. Preserve intentional server-only deny-by-default
tables. Escalate any confirmed authorization defect ahead of performance releases.
Rerun advisors; do not aim to remove every informational notice.

**I. Nagad (P2).** Keep a quick initial status check, then bounded backoff and
hidden-tab pause; reconcile on return using the authoritative server status.
Maintain webhook/reconciler recovery and payment correctness.

## Release and capacity verification

Apply additive migrations to staging first, then independently release A–C,
D–F, and G–I with rollback artifacts. Retain old RPC definitions; feature-flag
client request coordination. Shadow old/new dashboard outputs using synthetic
learners before replacing the function. Preserve unrelated dirty work.

Run representative staging scenarios at 50, 200, then 500 concurrent sessions
with realistic request rates, think time, session ages, and data cardinality.
Separate dashboard, long-running exam autosave, submission/resume, and mocked AI
load. Stop/escalate when error rate, queue wait, CPU/IO, or p95 violates agreed
limits; these test levels are not a promise that the app supports 500 users.

Compare matched before/after windows normalized by usage. Verify Bangladesh
browser latency, error classification, cache invalidation, no lost answers,
correct quota/payment state, and regression-free dashboard statistics. Decide
compute/region/replica changes only from those measurements. No migration away
from Supabase, Redis deployment, or blanket table partitioning is justified by
the evidence collected here.
