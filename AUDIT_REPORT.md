# IELTS AI Pro — Verified Audit and Remediation Ledger

**Verification date:** 2026-08-28

**Scope:** current local source, migration history, focused automated tests, and production-safe static review

**Evidence boundary:** this report does not treat local code, historical migrations, the live Supabase schema, and the deployed Vercel application as interchangeable evidence.

## Executive result

The previous report's claim that every issue was current and confirmed was inaccurate. Current-source review found a mixture of real defects, stale findings, false positives, intentional controls, and two architectural integrity risks that require server-authoritative grading rather than a superficial client patch.

This remediation pass also fixed the two reported Speaking-test regressions:

- The examiner transcript now continues revealing words when browser audio progress events stall at zero or are throttled until playback ends.
- Pausing the answer now pauses both the part timer and silence-based auto-send; resuming continues from the remaining time.

## Status definitions

- **Fixed now:** changed in this remediation pass and covered by focused checks.
- **Already fixed / stale:** the report described historical or superseded code.
- **False positive:** the stated vulnerable condition is not present in the effective migration/source chain.
- **Intentional / safe:** the behavior is deliberate and its security boundary is appropriate.
- **Open:** the risk is real and needs an authoritative server design; it must not be presented as closed.
- **Runtime review:** source evidence alone is insufficient; production query or deployment evidence is required.

## Finding ledger

| ID  | Previous claim                                                  | Current verdict                                    | Evidence and action                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Grammar-transfer XML delimiter breakout                         | **Fixed now**                                      | Learner task/submission values are XML-escaped before prompt interpolation. Regression contracts cover the shared escaping path.                                                                                                                                                                                                                                                                        |
| 1.2 | Unbounded and injectable Speaking transcript                    | **Bounded and hardened; residual resistance open** | The transcript already had a 20,000-character request cap, so “unbounded” was stale. Candidate/examiner turns, task context, and audio-note strings are XML-escaped. Evaluator rules now travel as provider system instructions where supported, while evidence remains in the user payload. No prompt-only control can make learner text authoritative; deterministic scoring checks remain essential. |
| 1.3 | Client-fabricated pronunciation metrics                         | **Partially hardened; open provenance boundary**   | The evaluation endpoint no longer accepts pronunciation metrics from the request body and instead reads the owned session record. This removes the direct override. However, the session content is still client-writable under finding 2.2, so protected server-side speech-evidence persistence is still required before calling pronunciation provenance authoritative.                              |
| 1.4 | Missing repair-chain token caps                                 | **Already fixed / stale**                          | Current AI route configuration and provider helpers apply bounded output budgets. No registry/model change was warranted.                                                                                                                                                                                                                                                                               |
| 2.1 | More than 50 unpinned `SECURITY DEFINER` functions              | **False positive against current migration chain** | The cited baseline declarations were cross-checked and pin their `search_path`; the public schema is not granted arbitrary create access. No speculative migration was added.                                                                                                                                                                                                                           |
| 2.2 | Users can forge completed test scores                           | **Open — high priority**                           | Current client-owned `test_sessions` updates permit browser-calculated scores. A proper fix requires server-side Reading/Listening answer grading plus restricted score/evaluation writes. Tightening RLS alone would break submissions, so no unsafe partial migration was applied.                                                                                                                    |
| 2.3 | Users can inflate XP through client-selected values/action keys | **Open — high priority**                           | JWT identity checks, deduplication, and daily caps reduce abuse but do not prove the underlying action. Points must be derived server-side from a verified completion/action record, ideally after 2.2 establishes authoritative test completion.                                                                                                                                                       |
| 2.4 | Public AI feedback cache reads                                  | **Already fixed / stale**                          | A later security migration removes the historical broad policy and limits access to privileged paths.                                                                                                                                                                                                                                                                                                   |
| 2.5 | Missing exact test-history composite index                      | **Runtime review; no change**                      | Related indexes already exist. Adding another index without live `EXPLAIN (ANALYZE, BUFFERS)` and `pg_stat_user_indexes` evidence could increase write cost without improving the query plan.                                                                                                                                                                                                           |
| 3.1 | Auth profile cache key mismatch                                 | **Fixed now**                                      | Cached profiles match the active auth identity using `auth_id`, with `id` retained as compatibility fallback.                                                                                                                                                                                                                                                                                           |
| 3.2 | `useDataQuery` blocks a new dependency key during revalidation  | **Fixed now**                                      | Revalidation ownership is tracked per cache key; an old in-flight key no longer blocks a new one.                                                                                                                                                                                                                                                                                                       |
| 3.3 | Concurrent manual autosaves race after waiting                  | **Fixed now**                                      | Manual flushes are serialized through a promise queue. A three-caller regression test verifies ordered writes.                                                                                                                                                                                                                                                                                          |
| 3.4 | Writing answer normalization is asymmetric                      | **Already fixed / stale**                          | Current normalization converts supported array/object forms into the same task-key representation before comparison.                                                                                                                                                                                                                                                                                    |
| 3.5 | Microphone sampling survives unmount                            | **Fixed now**                                      | Sampling accepts an `AbortSignal`, clears its timeout, stops tracks, and is aborted on unmount.                                                                                                                                                                                                                                                                                                         |
| 4.1 | Landing navbar eagerly preloads Framer Motion                   | **Fixed now**                                      | Navbar, desktop links, and mobile menu now use lightweight CSS transitions; `framer-vendor` is excluded from entry module preload.                                                                                                                                                                                                                                                                      |
| 4.2 | Writing provider causes a 1 Hz context cascade                  | **Fixed now**                                      | The redundant provider-level timer subscription/context was removed; timer consumers continue using the dedicated store selector.                                                                                                                                                                                                                                                                       |
| 5.1 | R2 object keys can collide                                      | **Fixed now; original verification was stale**     | The active source used `Date.now()`, despite the old report claiming it already used a UUID. Upload keys now use `crypto.randomUUID()`.                                                                                                                                                                                                                                                                 |
| 5.2 | Rich-text XSS / unsafe new-tab links                            | **Sanitization already present; hardened now**     | Audited rich-text sinks use the shared sanitizer or surface-specific sanitized formatting. The shared sanitizer now enforces `rel="noopener noreferrer"` for `_blank` links, with a regression test.                                                                                                                                                                                                    |
| 5.3 | Webhooks lack signature validation                              | **Intentional / safe**                             | Stripe verifies the raw request with the Stripe signing secret and uses idempotent handling; Resend uses the Svix verifier. Deployment-secret presence remains a live-environment check, not source proof.                                                                                                                                                                                              |

## Speaking regression root causes

### Examiner transcript streaming

The live transcript treated any finite audio progress value—including a value stuck at `0`—as a reliable progress source. Some browsers throttle playback progress events, so the fallback reveal clock was disabled and the UI remained on the first word until speech completed.

The renderer now combines:

1. audio-derived progress when it advances; and
2. a conservative word clock that remains active while the examiner is speaking.

The displayed word count uses the furthest safe progress from either source, preventing backward jumps and first-word freezes.

### Pause semantics

The pause control previously stopped only silence-based auto-send. The part countdown was a separate wall-clock effect and continued decrementing. The pause state is now passed into the countdown hook, which stops its interval while retaining the current remaining seconds and restarts from that remainder on resume. Labels and helper text now describe the real behavior.

## Verification performed

- Focused Vitest suite: **57/57 passed** across Speaking transcript/timers/controls, device cleanup, autosave serialization, data-query key changes, AI prompt escaping, and audit contracts.
- Full Vitest suite: **1,278/1,278 passed** across 175 test files.
- ESLint: **passed** with no errors.
- Production build: **passed**; generated entry HTML does not preload `framer-vendor`.
- Source-to-render trace completed for examiner speech progress, live transcript rendering, pause state, countdown ownership, and control copy.
- Current migration-chain static review completed for RLS, `SECURITY DEFINER` search paths, AI feedback cache access, and related indexes.
- Current official Supabase security guidance was checked for RLS grants and pinned `search_path` expectations.
- Public quick crawl: **76/C** over 25 sampled production pages. This confirms the current live baseline, including a 746 KB CSS asset and slow blog responses; it does not validate the unreleased Speaking patch.

The authenticated live browser session reached the Speaking library, proving the current deployed route and account session are available. End-to-end transcript/pause proof remains a post-deployment gate because production still serves the old bundle. Live Supabase migration status and deployed Vercel behavior must be reported separately; this remediation intentionally creates no database migration because no reviewed finding justified a safe one.

## Remaining production work

1. Design and test authoritative Reading/Listening submission endpoints that grade raw responses server-side, then restrict direct score/evaluation updates.
2. Derive XP from verified server actions rather than caller-supplied values.
3. Persist pronunciation/acoustic evidence in a server-protected record before using it as authoritative grading input.
4. Capture live query-plan/index evidence before adding any test-history index.
5. After release authorization, deploy the edge-function changes and frontend together, verify the live Speaking flow in an authenticated browser, and separately verify live Supabase migration/function state.

## Sign-off

This report is a current remediation ledger, not a blanket assurance. Items 2.2, 2.3, the protected provenance portion of 1.3, and residual semantic prompt-injection resistance in 1.2 remain explicitly open. No commit, push, deployment, or live migration is implied by local test results.
