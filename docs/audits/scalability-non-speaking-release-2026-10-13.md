# Non-Speaking scalability release — 13 October 2026

The release reduces learner-history payloads and adds durable Writing processing without changing grading prompts, providers, seeds, scoring escalation, calibration, output budgets, or Speaking functions.

## Why Writing takes time

The preceding seven-day live sample contained 45 measured Writing reviews: mean provider processing 17,586 ms, maximum 41,606 ms. Twelve primary-provider reviews used one pass (mean 12,331 ms), twenty used two (16,192 ms), eleven used three (25,176 ms); two used fallback (21,320 ms). These are observed groups, not a controlled experiment or a guaranteed latency reduction.

The second marker checks borderline/rounding-edge scores, and the third resolves significant disagreement. All rules remain unchanged. Queues improve recovery and regulate concurrency; they do not accelerate the model. New telemetry records each marking pass's elapsed time, outcome/failure reason and fallback elapsed time separately.

## Changes

- Reading/Listening cards request one latest attempt per current-page passage, with deterministic date/ID ordering, paired-room identity and answer-count progress. Full responses are fetched by the existing resume/review routes.
- Analytics uses authenticated cursor pagination and smaller evidence projections. Complete historical attempts and all metrics remain available, including legacy evidence repair. Full result reports load when opened, with retry/error states. Grammar totals are calculated in Postgres for the selected timeframe, including All time, without a REST row cap.
- Writing jobs use pgmq 1.5.1. Queue messages contain job identifiers; input/results live in an inaccessible private schema. Submission reserves existing learner quota atomically, deduplicates by the unchanged evaluator fingerprint and recovers finalized reports. No access token is stored in a job.
- Two database-backed worker slots bound Writing concurrency. Visibility/worker leases outlast the Free-plan worker duration. Transient failures get at most two retries; invalid input/auth is terminal. A finalized report is recovered before another paid call. Completion tokens fence late workers.
- Browser polling uses the authenticated job-status RPC with backoff and optional session-storage identifiers. Network interruption preserves recovery. Completed task feedback can be saved into the submitting session only while its evaluation-generation timestamp still matches. The existing final weighted score/XP flow remains authoritative.
- Other text-AI routes have a shared eight-lease pool and two simultaneous leases per route/user. Existing legacy burst limits now use an atomic database counter. History/bootstrap/status operations bypass provider admission. Request-local verified identity avoids a second Auth request; release failures cannot discard a completed response.
- Added indexes cover latest-per-passage reads, analytics cursors, quota idempotency and the job reservation foreign key.

## Free-plan constraints

[Supabase pricing](https://supabase.com/pricing) currently includes a 500 MB database and 500,000 Edge invocations on Free. [Edge limits](https://supabase.com/docs/guides/functions/limits) cap Free workers at 150 seconds. [Queues](https://supabase.com/docs/guides/queues) uses the project's Postgres resources; it is not additional compute capacity.

No paid plan, external queue service or subscription was provisioned. Recovery checks queue visibility before dispatch, so an empty queue creates zero worker invocations. At most two worker launches are reserved concurrently. Finished input payloads are cleared immediately, completed/failed job records expire after one day, and expired burst windows/leases are pruned. R2 lifecycle expiration remains the backstop for abandoned Task 1 images.

## Verification

- Full Vitest: 393 files, 3,051 tests passed. Moved Writing source-contract tests follow the extracted handler.
- Real isolated PostgreSQL plus pinned upstream pgmq: ownership, latest-only projection, cursor ties, exact Grammar totals, duplicate quota integration, retry, stale completion fencing, late-session generation rejection, finalized crash recovery and parallel admission checks passed. Twenty concurrent burst requests admitted exactly three; sixteen lease requests admitted eight; ten identical submissions created one job and one quota reservation.
- The local test fixture stubs the existing quota policy; it verifies integration, not every subscription rule. Existing quota/calibration/provider regression tests and the live reservation/finalization definitions remain the policy evidence.
- Deno type checks and worker/admission tests passed. Grading prompt template literals match the baseline byte for byte; the model registry and provider settings are unchanged.
- Production build, Cloudflare routing/cache/security checks, frontend lint and TypeScript checks passed.
- Live authenticated SQL checks passed: own-user access, cross-user denial, exact completed-attempt counts, metadata-only cards and Grammar totals. pgmq enabled, two slots configured, zero idle dispatch, private tables/worker RPCs inaccessible to browser roles. The new missing-FK-index advisory was resolved.

Production release and browser/job observations are recorded separately after deployment. A logical concurrency test does not establish the site's maximum concurrent-user capacity. All-time analytics still processes every compact evidence row to preserve exact historical charts and drilldowns; this release does not replace it with approximate samples.

## Rollback

Restore the preceding Cloudflare version and the seven preceding text-AI function sources from Git if a regression appears. Keep the new private job/status/worker infrastructure until submitted jobs have drained: it is additive, and dropping it would strand existing browser polls. Existing synchronous callers remain supported. Do not drop queues with pending messages or remove quota reservations. Keep daily cleanup enabled while the private tables remain.

Unrelated Sidebar edits and the pre-existing untracked Deno lockfile are excluded from the release. Task-owned local PostgreSQL instances, temporary provider source, deployment/test logs and the release checkout are removed after verification.
