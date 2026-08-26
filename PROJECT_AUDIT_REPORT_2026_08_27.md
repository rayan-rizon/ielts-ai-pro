# IELTS AI Pro — Audit Verification and Remediation Report

**Review date:** August 27, 2026
**Scope:** Claims in the supplied August 27 audit, checked against the current repository, selected production database invariants, regression tests, a production build, the locally rendered Writing Checker, and the resulting production release.
**Release state:** Production migration, six affected Supabase Edge Functions, and the Vercel frontend are deployed. The reviewed changes are committed and pushed. Authenticated provider-backed smoke tests remain intentionally unrun in this pass to avoid consuming learner quota or creating paid AI calls.

## Executive conclusion

The supplied audit was useful as a lead list, but its risk score and several “verified” statements were not evidence-backed. Of 23 claims:

- 6 required code or migration changes.
- 3 described intentional safety or consistency choices rather than defects.
- 5 were stale, false, or materially overstated.
- 5 were maintenance observations or unproven performance claims.
- 4 positive claims were supported in part, but some were too broad to certify repository-wide.

The confirmed issues have narrow fixes and regression coverage. The authorized production release is complete; authenticated provider-backed smoke tests remain a separate evidence class and are not represented as passed here.

## Verification matrix

| ID  | Original claim                                                         | Verified status                                                         | Resolution                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Promo uses are always counted twice                                    | **Partly stale; legacy hazard confirmed**                               | Current redemption increments once and stores no `promo_id`, so new redemptions do not hit the webhook increment. Older pending discount data could still contain a promo ID. The applied migration removes all webhook-side promo increments; redemption is the only capacity-accounting boundary.                                                |
| 2.2 | Duplicate AI requests can call providers twice                         | **Confirmed**                                                           | Every stable-idempotency caller now stops active duplicates. Completed speaking, deep-dive, turn, and adaptive-plan responses are stored with the reservation and returned on retry. Failed or abandoned reservations receive a controlled retry lease. Speaking session-start, final evaluation, deep dive, and turn work now use separate keys.  |
| 2.3 | `saveNow()` can drop the latest edit while autosave is active          | **Confirmed for forced/manual flushes; final-submit impact overstated** | `saveNow()` now waits until the active save chain drains, then reads and persists the latest answers. A concurrent regression test covers the exact race. Final submission paths already persisted their authoritative result separately.                                                                                                          |
| 2.4 | Clearing the offline retry queue at completion loses submitted answers | **Intentional invariant**                                               | Reading, Listening, and Writing completion write the current authoritative answers before marking the session complete. Retrying an older queued snapshot afterward would risk overwriting final data. Queue clearing remains.                                                                                                                     |
| 2.5 | Autosave updating zero completed rows is a defect                      | **Intentional invariant**                                               | The `is_completed = false` predicate prevents a late autosave from overwriting a final result. It is not treated as an error.                                                                                                                                                                                                                      |
| 2.6 | Points cap has an exploitable TOCTOU race                              | **Unsupported**                                                         | The authoritative award RPC takes a per-user advisory transaction lock and is service-role only. No bypassing production caller was found.                                                                                                                                                                                                         |
| 3.1 | R2 uploads can exhaust Edge Function memory                            | **Risk confirmed; crash estimate unproven**                             | The full `file.arrayBuffer()` copy was removed; only 16 signature bytes are buffered and the `File` body is passed to S3. Authentication and authorization occur before multipart parsing. Admin uploads remain capped at 50 MB. The Writing Checker gets a user-scoped, image-only 8 MB path, correcting the prior admin-only learner regression. |
| 3.2 | `is_admin()` has an unsafe mutable search path                         | **Stale / already fixed**                                               | The latest local definition and the live database both report an empty search path.                                                                                                                                                                                                                                                                |
| 3.3 | Missing unique idempotency index permits parallel duplicates           | **Overstated**                                                          | The transaction advisory lock serializes the authoritative user/feature reservation boundary, and the live aggregate check found zero duplicate key groups. A unique expression index is not required and would complicate legitimate failed-request retries. Lease/retry behavior is fixed in the RPC instead.                                    |
| 3.4 | In-memory rate limiting resets on cold starts                          | **Intentional first-line control**                                      | The local bucket is documented as a burst damper. Database quota reservation remains authoritative for AI cost boundaries.                                                                                                                                                                                                                         |
| 3.5 | Mixed pinned Deno standard-library versions are nondeterministic       | **Maintenance observation**                                             | Versions are individually pinned, so builds are deterministic. Consolidation can be scheduled separately; a bulk runtime rewrite was not justified during a live-site audit.                                                                                                                                                                       |
| 4.1 | Two React Query providers wrap application routes                      | **Confirmed and fixed**                                                 | `RouteProviders` is now a composition seam only; `RootProviders` owns the single query client/cache.                                                                                                                                                                                                                                               |
| 4.2 | `useDashboardData` return identity causes rerender problems            | **Unproven**                                                            | The only current consumer destructures returned fields, and no effect/callback depends on the entire result object. No profiler evidence supports a production defect.                                                                                                                                                                             |
| 4.3 | Learning/Grammar mutations must be optimistic                          | **Intentional consistency-first design**                                | These RPC-backed mutations invalidate and refetch server-authoritative state. Optimistic rollback would add cross-entity inconsistency risk; its absence is not a correctness defect.                                                                                                                                                              |
| 4.4 | Quill is not isolated into the editor vendor chunk                     | **Confirmed and fixed**                                                 | Both `react-quill-new` and `/quill/` match the editor chunk rule. The production build emitted a dedicated `editor-vendor` bundle.                                                                                                                                                                                                                 |
| 4.5 | The Learner Panel design system is fully compliant                     | **False as a repository-wide certification**                            | Legacy blur/shadow/glow patterns still exist outside the narrowly reviewed surfaces. No unrelated visual sweep was made under this audit.                                                                                                                                                                                                          |
| 5.1 | Speaking anti-truncation safeguards exist                              | **Supported by source and tests**                                       | The shared audio context, noise-floor logic, and transcript recovery paths remain covered. No live microphone/provider session was performed in this pass.                                                                                                                                                                                         |
| 5.2 | TTS background upload lacks fallback logging                           | **Stale / already fixed**                                               | The current function guards `waitUntil` and logs both unsupported-runtime and rejected-upload cases.                                                                                                                                                                                                                                               |
| 5.3 | Web Speech is segmented to avoid long utterance stalls                 | **Supported by source and tests**                                       | Sentence-level playback segmentation remains present.                                                                                                                                                                                                                                                                                              |
| 5.4 | Every AI route follows one universal fallback chain                    | **False; registry source-of-truth is valid**                            | The registry is authoritative, but routing is intentionally route-specific. Writing, Speaking, Grammar, and learning-path routes do not share one universal chain.                                                                                                                                                                                 |
| 6.1 | Every dynamic HTML render is sanitized                                 | **Partly supported, too broad to certify**                              | Existing sanitizer contracts and XSS tests pass, including Blog and test renderers. The original report did not provide a complete source-to-render inventory proving the universal statement.                                                                                                                                                     |
| 6.2 | All admin boundaries and MFA contracts are verified                    | **Partly supported, too broad to certify**                              | Frontend gating, database `is_admin()` hardening, and existing admin security tests pass. This pass did not perform every authenticated admin flow.                                                                                                                                                                                                |
| 6.3 | Meta/geo host and purchase payload gating is present                   | **Verified**                                                            | Source and regression tests confirm measured-host and purchase value/currency validation.                                                                                                                                                                                                                                                          |

## Implemented local remediation

### AI idempotency and recovery

- Active/completed reservation keys no longer reach paid providers twice.
- Finalized responses are recoverable after a lost HTTP response.
- Failed reservations can retry immediately; abandoned `reserved` rows can retry after a 15-minute lease.
- Speaking start, turn, final evaluation, and deep-dive keys are distinct.
- Grammar transfer retains its persisted-attempt recovery path.

### Upload safety and Writing Checker compatibility

- Authentication and permission checks run before multipart parsing.
- Writing Checker uploads accept only PNG, JPEG, and WebP, are capped at 8 MB, and use a user-specific R2 prefix.
- Admin uploads retain the existing 50 MB media/PDF boundary.
- Only the first 16 bytes are copied for magic-byte checks; the full file is no longer duplicated in isolate memory.

Hosted Supabase Edge Functions have a 256 MB memory limit, and one worker may serve multiple requests. This makes eliminating the second full-file allocation a concrete safety improvement while retaining server-side content validation. See [Supabase Edge Function limits](https://supabase.com/docs/guides/functions/limits).

### Frontend correctness and bundling

- Manual autosave flushes serialize behind active saves and persist the newest snapshot.
- The nested React Query provider was removed.
- Quill and `react-quill-new` now build into `editor-vendor`.

## Verification evidence

- Focused post-fix tests: **30/30 passed** across autosave serialization, database contracts, speaking reservations, adaptive learning, and Grammar transfer.
- Full unit/integration suite: **1,241/1,241 passed across 170 files**.
- Production frontend build: **passed**; `editor-vendor` was emitted.
- Local rendered browser check: Writing Checker loaded, demo/validation interactions worked, Task 1 exposed an enabled `image/png,image/jpeg,image/webp` upload input, and no console errors were recorded.
- Live read-only database check: `is_admin()` uses an empty search path; zero duplicate idempotency-key groups; zero stale reserved rows; 16 failed idempotent rows available to benefit from the new retry rule; no unique idempotency index.
- Supabase migration `20260826224039_fix_audit_concurrency_and_idempotency` applied successfully. The remote migration ledger records version `20260826224039`; post-apply queries confirmed the empty function search paths, 15-minute retry lease, idempotency state handling, and removal of checkout-side promo increments.
- Supabase Edge Functions deployed successfully with JWT verification preserved: `evaluateGrammarTransfer` v8, `evaluateSpeakingTest` v51, `generateAdaptiveLearningPath` v3, `generateDetailedSpeakingFeedback` v18, `processSpeakingSession` v50, and `r2-upload` v12.
- Vercel production deployment `dpl_4YsNqbnuFLwBVaXTQEum9kyLDDN7` reached **Ready** and aliases `https://ieltsai.pro` and `https://www.ieltsai.pro` were assigned.
- Supabase CLI dry-run remains blocked by pre-existing remote/local migration-history divergence; it was not used to rewrite or repair unrelated history.
- Independent delegated security review could not run because the workspace had no delegation credits. A separate local boundary pass was completed instead, including response-loss recovery and Writing Checker upload compatibility.

## Release boundary

The following evidence boundary remains open and must not be inferred from deployment status:

1. Perform authenticated production smoke tests for Writing Task 1 upload, speaking retry recovery, deep-dive retry recovery, and promo checkout when a test account and provider-call budget are available.
2. Re-run those smoke tests after any provider or billing configuration change.

The migration, Edge Function deployment, frontend deployment, commit, and push have completed without rewriting unrelated migration history.

No claim in this report treats local tests, database inspection, deployment, or authenticated-browser behavior as interchangeable evidence.
