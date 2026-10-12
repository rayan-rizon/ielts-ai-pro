# Scalability fixes: implementation and verification

Date: 13 October 2026, Asia/Dhaka.

## Implementation snapshot (before the requested release)

Three additive/compatible migrations were applied successfully to live IELTS Ai
Pro Supabase (`zvrmvycajimjxghrnpgy`). At completion of implementation, frontend
changes were local, tested, and built; frontend deployment, commit, and push
had not yet been performed. The subsequent release was authorized separately.
Unrelated working-tree changes were preserved, including the existing maintenance
fixes. Those gates were included in regression testing, not discarded.

Local migration versions match the confirmed live ledger: `20261012204757`,
`20261012204906`, and `20261012204910`, avoiding a duplicate CLI application.

## Implemented

- Dashboard validation now reads a private, indexed timezone registry. All
  1,194 existing timezone names and the supplied -> saved -> UTC fallback remain.
  Only the two lookup references were changed; the migration aborts on unexpected
  source drift and preserves the existing function ACL and analytics body.
- Activity RPC updates at most once per five minutes, except first activity on a
  new Dhaka day and clock-rollback recovery. Ownership checks and the atomic
  daily-history trigger remain. Client heartbeats coalesce and share successful
  timestamps across tabs. Profile initialization explicitly retries after the
  profile exists, avoiding a cached successful no-op before signup completes.
  Latest-seen analytics now has up to five-minute precision; daily-active history
  still records the new day immediately.
- Settings refreshes share an in-flight request and use a five-second cooldown
  for focus/visibility events. Cross-tab storage events adopt the published data
  without a request fan-out; identical results are not republished. Admin refresh
  bypasses cooldown and queues a fresh read behind an older request. Initial
  maintenance gating still waits for this tab's own request; visible polling
  remains 30 seconds.
- Blog indexes fetch metadata without article bodies. Detail pages still fetch
  full content. Upstream fetches have a 15-second timeout; failed responses use
  `no-store` rather than the successful page's CDN cache policy.
- Autosave deduplicates acknowledged snapshots including meaningful metadata,
  excluding only `last_saved_at`. Timer checkpoints, notes and highlights are
  saved even with unchanged answers. Existing navigation/submission serialization
  remains; online recovery reads the newest state rather than replaying an old
  failed snapshot. First unacknowledged manual flushes still persist.
- Admin history uses a metadata-only RPC, 25 rows per page, a maximum of 50,
  deterministic `(created_at,id)` cursors, and a normalized oldest key for nullable
  dates. Lifetime averages/counts/module summaries are computed separately from
  pagination. Authorization uses the existing `is_admin()` check; anonymous
  execution is denied. Added a matching cursor index. Resume/detail methods were
  not narrowed. The page guards against late results for a different user.
- Nagad checks use bounded backoff, stop in hidden tabs, and reconcile on return.
  The two-minute checking window and authoritative payment state remain.
- Added nine validated FK indexes on small Coach relations (2–136 live rows at
  inspection), including cascade/set-null paths. Lock waiting and statement
  execution are bounded in that migration. Pinned the three Writing coaching
  functions' search paths; their relations were already schema-qualified.
  SECURITY INVOKER and existing grants were preserved.

## Evidence

### Live PostgreSQL

A fresh full dashboard SQL probe on the same selected learner measured 77.534 ms
before and 30.914 ms after, including the audit's actor-selection CTE. Returned
JSON matched exactly. The previous day's ~774 ms standalone timezone lookup is
not the baseline for this new comparison; cache/load conditions differ. Neither
number is browser latency, a population percentile, or a capacity guarantee.

Live registry and catalog counts both equal 1,194. Authenticated roles cannot
access the private registry schema; anonymous roles cannot execute the dashboard.
Live admin history returned 25 metadata-only rows, a next cursor, and a lifetime
completed count of 154 for the inspected learner. No private IDs/content were
retained in this report.

Supabase advisors after migration no longer report the nine uncovered FKs or the
three mutable search paths. Informational notices remain: a private registry has
RLS with no public policies; the new admin RPC is an intentionally privileged
endpoint protected by the admin check; new indexes can be reported unused until
their workloads run. These are not reasons to broaden access or delete indexes.
Existing leaderboard/view-counter and other privileged RPC exposures still need
case-specific review; the audit counts alone do not establish vulnerabilities.

### Live public API, candidate projection

Four read-only anon requests fetched the same 80 published blogs, alternating
the old full-body and new metadata projections:

| Projection   | JSON bytes | Request 1 | Request 2 |
| ------------ | ---------: | --------: | --------: |
| Full content |    856,170 |  2,381 ms |  5,637 ms |
| Metadata     |     76,528 |    556 ms |    699 ms |

Bytes decreased by ~91.1%. These are small samples from the audit host. They
validate the projection and transfer reduction, not an established frontend
p95 improvement. The live frontend still uses the old source until deployed.

### Local verification

- 12 focused Vitest files / 109 tests passed, including maintenance, dashboard,
  blog rendering, settings concurrency, activity midnight/account isolation,
  autosave serialization/deduplication/offline recovery, admin history and Nagad.
- TypeScript `tsc --noEmit` passed. Edited JS/JSX lint has no errors; an existing
  unused `articleCategory` warning remains in the blog renderer. The repository's
  ESLint configuration does not type-check TS files; TypeScript covers them.
- Production build succeeded; Cloudflare package cache/security tests passed,
  including credential bypass and private API boundaries with mocked providers.
- The local production-route preview rendered the blog list and a full article
  with its table of contents/body (21 headings), using the live public catalog.
  This is local rendering evidence, not production frontend deployment proof.
- Isolated PostgreSQL/PGlite verification executed the migrations and compared
  ten old/new dashboard outputs. It covered whitelist/ACLs, six deterministic
  activity timestamp cases, the actual daily-history trigger, unauthorized calls,
  tied/null-date pagination over 60 rows, lifetime summaries, limit clamping,
  a DST boundary, actual Writing trigger/claim bodies and the nine FK indexes.
  Dashboard duration/abandonment helpers were synthetic fixture functions; the
  live same-learner output comparison supplies additional production evidence.

To rerun the isolated database verification without changing project dependencies:

```sh
npm install --prefix /tmp/ielts-scalability-verification --no-package-lock --ignore-scripts @electric-sql/pglite@0.3.14
node scripts/verify-scalability-database.mjs /tmp/ielts-scalability-verification/node_modules/@electric-sql/pglite/dist/index.js
```

## Rollback and remaining measurements

`supabase/rollback/20261013_scalability_core.sql` restores the exact pre-release
dashboard and activity definitions. Keep the additive private registry/admin RPC
while any new frontend may depend on them. Indexes and pinned search paths can
remain during a frontend rollback; their behavior is compatible with old clients.
Refresh the timezone registry through a reviewed migration after PostgreSQL/tzdata
upgrades, matching it to the server's current names.

Writing already has deployed fingerprint/quota reservation, cached feedback,
duplicate recovery and provider timeouts; Speaking has turn revisions/idempotency.
No unproven model/fallback changes or queue rewrite were introduced. Durable
Writing jobs remain a separate architecture enhancement requiring worker/queue
failure testing, rather than a demonstrated missing-idempotency fix.

No 50/200/500-user production load tests, peak CPU/IO measurements, or new frontend
production p95 measurements were performed. After frontend release, compare
matched usage-normalized windows and verify CDN publish/unpublish invalidation,
request counts, loss-free resume, quota accuracy, and real-user Bangladesh latency.
