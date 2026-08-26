# IELTS AI Pro — Comprehensive Project Audit & Diagnostics Report

**Date of Audit:** August 27, 2026
**Audited Scope:** Entire Codebase (`src/`, `supabase/`, `api/`, `tests/`, configurations)
**Original methodology claim (not independently reproduced):** Multi-agent scan, 1,212 tests, ESLint, production build, and security/concurrency review. See the verification addendum for checks actually rerun.

---

## Verification addendum — August 27, 2026

This section supersedes the severity labels and remediation state in the original scan below. The original “53 findings” matrix is not reproducible from the report: it contains 30 numbered engineering findings plus grouped design/accessibility observations, and several conclusions confuse a code smell with an exploitable defect.

### Release record — August 27, 2026

The reviewed migration `20260826210712_harden_audit_confirmed_invariants.sql` was applied to the active IELTS Ai Pro Supabase project. A post-apply privilege check confirmed that authenticated users cannot read point-award events or execute the legacy `add_user_points` RPC, while the service role can execute the new bounded award RPC; the quota index is present. The affected Edge Functions, including the Stripe webhook with JWT verification intentionally disabled, were also deployed. The normal CLI migration push remains blocked by unrelated historical migration divergence, so this release applied only the reviewed migration and did not rewrite migration history.

| Finding | Verified status                              | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| :------ | :------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRIT-01 | **Partly stale; broader boundary confirmed** | The active client already used the atomic, auth-derived RPC, while the legacy Edge Function contained the reported RMW/ID mismatch. Direct authenticated RPC access could bypass Edge limits, so awards now pass through the protected function into a service-only, idempotent database award RPC with per-action and daily caps.                                                                                                                                                           |
| CRIT-02 | **Confirmed**                                | Promo redemption now locks the learner and promo rows before duplicate/capacity checks. Checkout no longer rejects a capacity slot already reserved by that learner. Released in the reviewed migration.                                                                                                                                                                                                                                                                                     |
| CRIT-03 | **Not a defect**                             | Failed provider calls are deliberately counted by the later authoritative quota migration to enforce cost/abuse limits. Refunding them would weaken the documented boundary.                                                                                                                                                                                                                                                                                                                 |
| CRIT-04 | **Confirmed**                                | Autosave now has a completion guard, clears queued retries, and restricts persistence to `is_completed = false`.                                                                                                                                                                                                                                                                                                                                                                             |
| CRIT-05 | **Confirmed**                                | Autosave comparison now normalizes generic answer maps deterministically instead of collapsing them to an empty value.                                                                                                                                                                                                                                                                                                                                                                       |
| CRIT-06 | **Overstated**                               | Cached profile data did not set the authenticated `user`, so protected children could not render as claimed. The cache can still cause a loading-state flicker; it now remains presentation-only until session validation completes.                                                                                                                                                                                                                                                         |
| CRIT-07 | **Confirmed**                                | Every top-level route now receives the global route `errorElement`.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| CRIT-08 | **Partly confirmed**                         | Webhook/client idempotency keys differed and event claiming occurred after side effects. Both paths now use `checkout_<session-id>`; the database claims/retries before side effects, exposes claimant state, and webhook failures return non-2xx so Stripe retries. Post-RPC email/marketing/analytics run only for the claimant. The claimed marketing-insert 500 was false because that insert’s returned error was previously ignored. Released in the reviewed migration and functions. |
| HIGH-01 | **Confirmed**                                | Media tracks remain alive until `MediaRecorder.onstop` has processed the final data slice.                                                                                                                                                                                                                                                                                                                                                                                                   |
| HIGH-02 | **Confirmed**                                | Speaking countdowns now derive remaining time from wall-clock deadlines.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| HIGH-03 | **Stale/dead path**                          | The imperative highlighter code exists but has no application call site. No production crash path was reproducible, so an invasive rewrite was not justified.                                                                                                                                                                                                                                                                                                                                |
| HIGH-04 | **Confirmed**                                | Writing now flushes the latest editor value on blur and unmount and cancels the pending debounce.                                                                                                                                                                                                                                                                                                                                                                                            |
| HIGH-05 | **Confirmed**                                | Markerless Listening flowcharts now offset answers from the question’s actual starting number.                                                                                                                                                                                                                                                                                                                                                                                               |
| HIGH-06 | **Confirmed, impact overstated**             | Equal settings no longer replace state, and normalized maintenance/announcement objects are memoized. The report did not prove that the entire tree rerendered.                                                                                                                                                                                                                                                                                                                              |
| HIGH-07 | **Unproven performance claim**               | The composite hooks intentionally expose the slices their consumers request; no profiler evidence of the claimed app-wide input lag was supplied. The unstable Writing dispatch provider value was memoized.                                                                                                                                                                                                                                                                                 |
| HIGH-08 | **Confirmed**                                | Blog detail fetches one full article and at most four lightweight related records.                                                                                                                                                                                                                                                                                                                                                                                                           |
| HIGH-09 | **Partly confirmed**                         | The upload route lacked authorization beyond authentication. It is now admin-only (matching every current call site), checks request length before multipart buffering, validates file signatures, rate-limits, and sanitizes names. The filename crash was stale because browser multipart blobs arrive as `File`.                                                                                                                                                                          |
| MED-01  | **Confirmed**                                | An already-expired resumed exam opens the time-up decision flow instead of auto-submitting. Active exams still expire normally.                                                                                                                                                                                                                                                                                                                                                              |
| MED-02  | **Confirmed**                                | Bulk answer splitting now requires line-leading, sequential question numbers; numeric answer content is covered by regression tests.                                                                                                                                                                                                                                                                                                                                                         |
| MED-03  | **Observation only**                         | Transcript time updates do rerender the transcript, but the report supplied no profiler evidence that paragraph memoization improves this small bounded surface.                                                                                                                                                                                                                                                                                                                             |
| MED-04  | **False**                                    | Analytics calculations use `content_data` for result/evaluation evidence; it is not fetched solely for counts and averages.                                                                                                                                                                                                                                                                                                                                                                  |
| MED-05  | **False/stale**                              | The named Vocabulary mutation hook manages local state and has no TanStack list cache to invalidate.                                                                                                                                                                                                                                                                                                                                                                                         |
| MED-06  | **Not exploitable as described**             | A mismatched fallback ACAO value does not grant an attacker origin access. Untrusted/missing origins now omit credentials and ACAO as defense-in-depth.                                                                                                                                                                                                                                                                                                                                      |
| MED-07  | **Confirmed**                                | Feed queries are capped at 50 records; sitemap and LLM index queries at 500.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| MED-08  | **Confirmed**                                | The matching partial composite quota index is included in the local migration.                                                                                                                                                                                                                                                                                                                                                                                                               |
| LOW-01  | **Confirmed**                                | Pricing uses the existing static pricing utility import.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| LOW-02  | **Confirmed**                                | Reconnection UI is emitted only after a real offline event.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| LOW-03  | **Stale**                                    | The Pricing request already sends `X-Requested-With`, which the shared CSRF validator accepts.                                                                                                                                                                                                                                                                                                                                                                                               |
| LOW-04  | **Confirmed**                                | XP notification timers are tracked, replaced safely, and cleared on reset/unmount.                                                                                                                                                                                                                                                                                                                                                                                                           |
| LOW-05  | **Overstated**                               | The named parser contained one production `console.log`, not 25; it was removed.                                                                                                                                                                                                                                                                                                                                                                                                             |

### UI, accessibility, and mobile verification

The five named legacy glass/glow surfaces were real and now use the Learner Panel primitives/hairline treatment. The named audio, exit, modal-close, and exam-input accessible-name gaps were real and are fixed. The Blog focus-ring claim was false because its focusable wrapper already supplies a visible `focus-within` ring. The named sub-44px controls are now at least 44px, and the Listening mobile action bar includes iOS safe-area padding.

### Verification evidence

- Full unit/integration suite: **1,227/1,227 passed across 168 files**.
- Focused regression suite: **29/29 passed** (autosave, network state, expired exam behavior, parser/scoring, speaking timers, MediaRecorder finalization).
- New database hardening contract suite: **6/6 passed**.
- Production build: **passed**.
- Changed-file ESLint: **no errors after corrections**; pre-existing warnings remain in legacy files.
- Local rendered browser check: public landing comparison panel has a 1px border, no backdrop filter, and no console errors; Blog rendered with an accessible named search field and no console errors.
- Production database privilege/index verification passed after the migration was applied. The behavior is additionally covered by source/contract tests.
- Authenticated deployed-browser behavior is not claimed by this local audit.

---

## Table of Contents

1. [Executive Summary & Severity Matrix](#1-executive-summary--severity-matrix)
2. [Critical Issues (P0) — Immediate Action Required](#2-critical-issues-p0--immediate-action-required)
3. [High Severity Issues (P1) — Performance & System Integrity](#3-high-severity-issues-p1--performance--system-integrity)
4. [Medium Severity Issues (P2) — Optimizations & Robustness](#4-medium-severity-issues-p2--optimizations--robustness)
5. [Low Severity Issues & Code Hygiene (P3)](#5-low-severity-issues--code-hygiene-p3)
6. [Design System & UI/UX Audit (Learner Panel & WCAG 2.1 AA)](#6-design-system--uiux-audit-learner-panel--wcag-21-aa)
7. [Prioritized Remediation Roadmap](#7-prioritized-remediation-roadmap)

---

## 1. Executive Summary & Severity Matrix

An exhaustive, multi-layered audit was performed on **IELTS AI Pro** across 4 primary architectural pillars:

1. **Backend, Database, Edge Functions & Serverless API**
2. **IELTS Core Test Engines & Audio/Speech Pipeline**
3. **Frontend Architecture, React Performance, Auth & State Management**
4. **UI/UX, Design System Tokens & WCAG 2.1 AA Accessibility**

### Findings Overview

```
┌─────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Architectural Pillar    │ Critical │   High   │  Medium  │   Low    │  Total   │
├─────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 1. Backend & DB         │    4     │    2     │    4     │    2     │    12    │
│ 2. Test Engines & Audio │    2     │    6     │    4     │    1     │    13    │
│ 3. Frontend & Auth      │    2     │    5     │    4     │    3     │    14    │
│ 4. Design & A11y        │    2     │    4     │    5     │    3     │    14    │
├─────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ TOTAL                   │   10     │   17     │   17     │    9     │    53    │
└─────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 2. Critical Issues (P0) — Immediate Action Required

### 🔴 [CRIT-01] Non-Atomic Read-Modify-Write & User ID Mismatch in `updateUserPoints`

- **Location:** [`supabase/functions/updateUserPoints/index.ts:74-93`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/functions/updateUserPoints/index.ts#L74-L93)
- **Category:** Concurrency / Race Condition / Data Loss
- **Root Cause:**
  1. `updateUserPoints` reads current points into JavaScript memory (`select('points')`), adds `pointsToAdd`, and executes an `update()` write. When a learner completes interactive exercises in rapid succession or triggers concurrent gamification hooks, concurrent requests read the same initial point balance, overwriting each other and silently dropping earned points.
  2. `user.id` from `supabase.auth.getUser(token)` is the `auth.users.id` (Auth UUID), whereas `user_points.user_id` is a foreign key referencing `public.users.id` (Profile UUID). Querying `.eq('user_id', user.id)` fails or targets the wrong entity.
  3. The database already contains a secure atomic RPC `add_user_points(p_points INT)` in [`supabase/migrations/20260217000000_fix_rpc_auth_and_leaderboard.sql`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/migrations/20260217000000_fix_rpc_auth_and_leaderboard.sql) which maps `auth.uid()` to `public.users.id` and performs `SET points = points + p_points`, but the Edge Function bypasses this RPC entirely.
- **Impact:** Permanent loss of gamification points and XP under concurrent activity; potential 404/foreign key runtime errors.
- **Remediation:**
  Refactor `updateUserPoints/index.ts` to call `add_user_points` RPC directly:
  ```typescript
  const { data: updatedPoints, error: rpcError } = await supabase.rpc('add_user_points', {
    p_points: pointsToAdd,
  });
  if (rpcError) throw rpcError;
  ```

---

### 🔴 [CRIT-02] Promo Code Over-Redemption Race Condition (Missing `FOR UPDATE` Locks)

- **Location:** [`supabase/migrations/20260819113000_fix_redeem_promo_code_column_protection.sql:39-89`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/migrations/20260819113000_fix_redeem_promo_code_column_protection.sql#L39-L89)
- **Category:** Concurrency / Double Spending / Financial Risk
- **Root Cause:**
  `redeem_promo_code(code_lookup text)` executes a non-locking `SELECT * INTO v_promo FROM public.promo_codes WHERE ... AND (max_uses IS NULL OR current_uses < max_uses)`.
  Under concurrent checkouts for a capped promo code (e.g. `max_uses = 1` or limited flash discounts), multiple transactions read `current_uses < max_uses` simultaneously before any transaction commits. All transactions succeed, applying discounts and incrementing `current_uses` beyond `max_uses`.
- **Impact:** Financial leakage via over-redemption of single-use or limited promotional coupons.
- **Remediation:**
  Acquire an exclusive row lock on the promo code and the user profile within the transaction:

  ```sql
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE upper(code) = upper(trim(code_lookup))
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
  FOR UPDATE;

  IF v_promo IS NULL OR (v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Promo code is invalid, expired, or fully claimed');
  END IF;
  ```

---

### 🔴 [CRIT-03] Failed AI Requests Permanently Deduct & Exhaust Learner Quotas

- **Location:** [`supabase/migrations/20260521183000_security_hotfix_rpc_rls.sql:163-205`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/migrations/20260521183000_security_hotfix_rpc_rls.sql#L163-L205) & [`supabase/migrations/20260801131058_harden_platform_health_contracts.sql:9-52`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/migrations/20260801131058_harden_platform_health_contracts.sql#L9-L52)
- **Category:** Quota Accounting / Billing Integrity / User Experience
- **Root Cause:**
  1. `reserve_ai_api_usage` inserts a record into `ai_api_usage` with `cached = false` and `request_metadata.reservationStatus = 'reserved'`.
  2. When an AI provider (OpenAI, Gemini, DeepSeek) encounters an upstream 5xx error, timeout, or malformed JSON, `_shared/security.ts` calls `finalizeApiUsage(..., 'failed')`, setting `request_metadata.reservationStatus = 'failed'`.
  3. However, `get_user_daily_usage` and `get_user_monthly_usage` compute usage with:
     ```sql
     SELECT count(*)::INTEGER FROM public.ai_api_usage
     WHERE user_id = p_user_id AND created_at >= current_date AND cached = FALSE;
     ```
     This query **does not filter out** failed requests or abandoned reservations.
- **Impact:** Failed AI evaluations permanently burn the student's daily/monthly limit. Free and Pro users receive false `429 Daily Limit Reached` errors without having received their evaluation.
- **Remediation:**
  Filter by reservation status in `get_user_daily_usage` and `get_user_monthly_usage`:
  ```sql
  SELECT count(*)::INTEGER INTO v_count
  FROM public.ai_api_usage
  WHERE user_id = p_user_id
    AND (p_endpoint IS NULL OR endpoint = p_endpoint)
    AND created_at >= current_date
    AND cached = FALSE
    AND (
      request_metadata->>'reservationStatus' = 'completed'
      OR (request_metadata->>'reservationStatus' = 'reserved' AND created_at >= now() - interval '5 minutes')
    );
  ```

---

### 🔴 [CRIT-04] Autosave Overwrites Final Completed Test Results & Metrics

- **Location:** [`src/hooks/useAutosave.ts:228-263`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/hooks/useAutosave.ts#L228-L263) vs [`src/features/testing/shared/services/TestSession.ts:171-181`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/shared/services/TestSession.ts#L171-L181)
- **Category:** Data Loss / Concurrency Race Condition
- **Root Cause:**
  When a candidate clicks Submit, `TestSession.complete()` writes extensive evaluation evidence (`sectionStats`, `correctAnswersMap`, `timeMetrics`, `responseDetails`) and marks `is_completed = true`.
  However, `useAutosave.ts` `saveWithRetry` updates `test_sessions` with in-progress `content_data: { time_remaining, last_saved_at }` without checking `.eq('is_completed', false)`. If an autosave was in flight, queued in `retryQueueRef`, or triggered on unmount/page navigation, it completes _after_ `TestSession.complete()`, permanently overwriting and destroying the completed test report and evaluation metrics.
- **Impact:** Completed test results revert to empty in-progress data; analytics and diagnostic reports break.
- **Remediation:**
  1. Add `.eq('is_completed', false)` to `saveWithRetry` in `useAutosave.ts`.
  2. Clear the retry queue and cancel pending retries when `isFinished` becomes true.

---

### 🔴 [CRIT-05] Reading & Listening Periodic Autosave Completely Broken by Normalizer

- **Location:** [`src/hooks/useAutosave.ts:112-154, 314-318`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/hooks/useAutosave.ts#L112-L154)
- **Category:** Logic Bug / Data Loss
- **Root Cause:**
  In `useAutosave.ts`, `normalizeAnswersForComparison` assumes answers are in Writing format (`task1_response`, `task2_response`, `response`). In Reading and Listening tests, `answers` is a key-value dictionary (`{ "q-1": "TRUE", "q-2": "NOT GIVEN" }`). Since none of the keys match Writing fields, `normalizeAnswersForComparison` **always** returns `{ task1: '', task2: '', response: '' }`.
  Consequently, `hasChanges(current, previous)` always returns `false` during periodic checks (`performSaveCheck(false)`).
- **Impact:** Periodic 30-second autosave **never runs** during Reading and Listening tests. If a learner stays on a single passage without navigating and experiences a browser tab crash or power loss, all answers entered during that period are lost.
- **Remediation:**
  Update `normalizeAnswersForComparison` to serialize generic key-value answer dictionaries:
  ```typescript
  if (typeof answers === 'object' && answers !== null && !Array.isArray(answers)) {
    const obj = answers as Record<string, unknown>;
    if ('Task 1' in obj || 'task1_response' in obj || 'Task 2' in obj || 'task2_response' in obj) {
      return {
        task1: (obj['Task 1'] as string) || (obj.task1_response as string) || '',
        task2: (obj['Task 2'] as string) || (obj.task2_response as string) || '',
        response: (obj.response as string) || '',
      };
    }
    return { raw: JSON.stringify(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))) };
  }
  ```

---

### 🔴 [CRIT-06] Eager Auth Cache Desynchronization & 401 Query Cascades

- **Location:** [`src/features/auth/context/AuthContext.jsx:201-224, 325-334`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/auth/context/AuthContext.jsx#L201-L224)
- **Category:** Auth Lifecycle / Security / UX
- **Root Cause:**
  `eagerCheck()` reads `cachedProfile` from `localStorage` and immediately sets `setUserProfile(cachedProfile)` and `setAuthCheckComplete(true)` before `supabase.auth.getSession()` validates the session. `ProtectedRoute.jsx` unblocks and renders protected routes (`/dashboard`). Child components mount and fire authenticated React Query queries. When the background `getSession()` returns `session: null` (token expired or revoked), the app abruptly resets `user: null`, throws 401 Unauthorized errors to Sentry, and forces a redirect to `/login`.
- **Impact:** Flash of protected content, UI flickering, and a storm of failed authenticated network requests on expired sessions.
- **Remediation:**
  Do not mark `authCheckComplete: true` on cached profile data alone; require valid session confirmation or guard query hooks on `Boolean(user?.id && session)`.

---

### 🔴 [CRIT-07] Missing Route-Level `errorElement` Cascades to Full Router Teardown

- **Location:** [`src/App.jsx:217-226, 351-799`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/App.jsx#L217-L226)
- **Category:** Architecture / Resilience / Routing
- **Root Cause:**
  In `createBrowserRouter`, `errorElement: <GlobalErrorElement />` is placed exclusively on `{ path: '/' }`. All other routes (`/dashboard`, `/cambridge-tests`, `/writing-task`, `/speaking-test`, `/admin/panel`) are sibling routes without `errorElement`.
  When a chunk-load failure or runtime rendering error occurs on any sub-route, React Router cannot trap it at the route level. The error bubbles outside `RouterProvider` to the root React `<ErrorBoundary>`, destroying the entire router instance and unmounting navigation state.
- **Impact:** Chunk load errors or isolated page exceptions cause full white screens and destroy client state instead of rendering an in-place retry UI.
- **Remediation:**
  Refactor `createBrowserRouter` to use a root layout route with `errorElement: <GlobalErrorElement />` that wraps all child routes within its `children` array.

---

### 🔴 [CRIT-08] Stripe Webhook vs Client Sync Race Condition & Uncaught 500 Crash

- **Location:** [`supabase/functions/sync-stripe-session/index.ts:155-169`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/functions/sync-stripe-session/index.ts#L155-L169) & [`supabase/migrations/20260730200927_record_stripe_payments_in_payment_requests.sql:8-55`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/migrations/20260730200927_record_stripe_payments_in_payment_requests.sql#L8-L55)
- **Category:** Payment Processing / Idempotency / Error Handling
- **Root Cause:**
  1. `sync-stripe-session` passes event ID as `sync_${session.id}`, whereas `stripe-webhook` passes `evt_${event.id}`. Because the IDs differ, idempotency checks in `stripe_events` evaluate to `false` in both handlers, causing promo code usage to be incremented twice on concurrent runs.
  2. `sync-stripe-session` inserts into `marketing_events` with `dedupe_key: ${session.id}:purchased` without catching PostgreSQL error code `23505` (unique violation). If `stripe-webhook` inserted the record milliseconds earlier, `sync-stripe-session` throws an uncaught 500 error, displaying a failed checkout toast to the user despite successful payment.
- **Impact:** Double counting of promo codes and false payment-failure messages shown to paying customers.
- **Remediation:**
  Catch code `23505` on `marketing_events` insert and unify session deduplication keys in `handle_stripe_event`.

---

## 3. High Severity Issues (P1) — Performance & System Integrity

### 🟠 [HIGH-01] `MediaRecorder` Stream Tracks Terminated Synchronously Before Final Slice Flush

- **Location:** [`src/features/testing/speaking/utils/audioRecorderRuntime.js:389-410`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/speaking/utils/audioRecorderRuntime.js#L389-L410)
- **Category:** Audio Pipeline / Data Loss
- **Root Cause:**
  `stopRecorderCapture` invokes `stopMediaStream(runtime)` immediately after `mediaRecorder.stop()`. Calling `track.stop()` synchronously terminates the underlying browser audio tracks before `MediaRecorder` can encode and flush its final buffered audio slice to `ondataavailable`.
- **Impact:** The final 1–2 seconds of learner answers are truncated, causing incomplete audio uploads, transcription gaps, and false "audio too short" rejections.
- **Remediation:**
  Defer `stopMediaStream` until the `mediaRecorder.onstop` event fires.

---

### 🟠 [HIGH-02] Speaking & Practice Test Timers Drift Due to Uncompensated `setInterval`

- **Location:** [`src/features/testing/speaking/hooks/useSpeakingTimers.js:15-26, 284-293`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/speaking/hooks/useSpeakingTimers.js#L15-L26)
- **Category:** Timer Accuracy / Browser Throttling
- **Root Cause:**
  Timers in `useSpeakingTimers.js` decrement state via naive 1000ms intervals (`setTimeLeft(prev => prev - 1)`). Furthermore, `timeLeft` is listed in the `useEffect` dependency array, tearing down and recreating the interval every single second. When the browser tab is backgrounded, background timer throttling reduces execution frequency to once every 60s or pauses it completely.
- **Impact:** Speaking Part 2 prep times and total exam durations drift significantly; learners gain extra time or timers freeze.
- **Remediation:**
  Calculate remaining time using wall-clock delta against a reference timestamp (`Date.now()`).

---

### 🟠 [HIGH-03] Direct DOM Mutation in Reading Highlighter Causes React Crash

- **Location:** [`src/features/testing/reading/components/ReadingTest/hooks/useHighlighter.js:61-64, 98-107`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/reading/components/ReadingTest/hooks/useHighlighter.js#L61-L64)
- **Category:** Frontend Stability / React VDOM Desync
- **Root Cause:**
  `useHighlighter.js` directly mutates the live DOM tree inside React's render scope using `range.extractContents()` and `range.insertNode(span)`. When React reconciles the parent DOM nodes during re-renders (e.g. font-size changes, panel resizes, passage tab switches), React's reconciler encounters missing/foreign nodes and throws unhandled `NotFoundError: Failed to execute 'removeChild' on 'Node'`.
- **Impact:** Full white-screen crash during active IELTS Reading tests when learners use the text highlighting tool.
- **Remediation:**
  Store highlight ranges as virtual offset data (`{ start, end, color }`) and render highlights declaratively via React components, or isolate the passage DOM in an unmanaged container (`contentEditable={false}` with `dangerouslySetInnerHTML`).

---

### 🟠 [HIGH-04] Debounced Writing Input Dropped on Fast Submit or Task Switch

- **Location:** [`src/features/testing/writing/components/WritingTest/components/WritingEditor.jsx:81-101`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/writing/components/WritingTest/components/WritingEditor.jsx#L81-L101)
- **Category:** Writing Test Engine / Data Loss
- **Root Cause:**
  `WritingEditor.jsx` buffers typing in `localValue` and debounces updates to the global Zustand store by 500ms. When the candidate clicks Submit or switches between Task 1 and Task 2, `handleSubmit` reads `state.drafts` immediately from Zustand. Content typed within the last 500ms is dropped.
- **Impact:** Concluding sentences or final paragraphs of IELTS essays are missing from the submitted answer.
- **Remediation:**
  Add an `onBlur` handler to immediately flush pending content, and implement an imperative `flush()` / unmount cleanup that cancels the debounce timer and synchronously executes `setWriting(lastWritingRef.current)`.

---

### 🟠 [HIGH-05] Listening Flowchart Parser Offset Index Bug

- **Location:** [`src/lib/listening-question-parser/answers.js:197-206`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/lib/listening-question-parser/answers.js#L197-L206)
- **Category:** Parser / Scoring Accuracy
- **Root Cause:**
  In `mergeListeningAnswers`, if a flowchart question in Part 3/4 lacks explicit gap markers, `explicitNum` is `undefined`. It falls back to `relativeNum = gapIdx + 1` (1, 2, 3...), querying `answerMap[1...5]` which belong to Part 1.
- **Impact:** Candidates are graded against Part 1 answers for Part 3/4 flowchart questions, resulting in incorrect scores.
- **Remediation:**
  Change `relativeNum = gapIdx + 1` to `relativeNum = (q.question_number || 1) + gapIdx`.

---

### 🟠 [HIGH-06] Global Settings Polling Triggers Full-Tree Re-render Every 120s

- **Location:** [`src/features/auth/context/AuthContext.jsx:509-525, 753-800`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/auth/context/AuthContext.jsx#L509-L525)
- **Category:** React Performance / Re-render Cascade
- **Root Cause:**
  `AuthContext` polls `system_settings` every 120 seconds. In `contextValue`:
  ```js
  maintenance: normalizeMaintenance(globalSettings?.maintenance_mode),
  announcement: normalizeAnnouncement(globalSettings?.public_announcement),
  ```
  `normalizeMaintenance` and `normalizeAnnouncement` instantiate new object literals on every execution. Even when settings are identical, `contextValue` receives a new object reference.
- **Impact:** Because `useAuth()` is consumed in `Navbar`, `Sidebar`, `ProtectedRoute`, `Dashboard`, and test runners, the **entire React component tree across the entire application re-renders every 2 minutes**.
- **Remediation:**
  Memoize normalized values with `useMemo` and perform shallow/deep equality checks before calling `setGlobalSettings`.

---

### 🟠 [HIGH-07] Monolithic State Selector Anti-Pattern in Test Contexts

- **Location:** [`src/features/testing/reading/components/ReadingTest/context/ReadingTestContext.jsx:181-213`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/reading/components/ReadingTest/context/ReadingTestContext.jsx#L181-L213) & [`WritingTestContext.jsx:302-346`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/writing/components/WritingTest/context/WritingTestContext.jsx#L302-L346)
- **Category:** React Performance / Input Lag
- **Root Cause:**
  `useReadingTestState()` subscribes to all 14 store slices in a single composite object. When a candidate types a character into any input, or when `isSaving` toggles during autosave, all 14 slices update the composite object reference, re-rendering every component that calls `useReadingTestState()` (passage viewer, question navigator, toolbar, audio player).
- **Impact:** Main-thread lag and typing stutter during active test sessions.
- **Remediation:**
  Provide atomic selector hooks (`useReadingAnswers()`, `useReadingSaving()`) or use Zustand's `useShallow`.

---

### 🟠 [HIGH-08] Massive Database Payload Overfetching in `api/blog.js`

- **Location:** [`api/blog.js:829-836, 903-919`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/api/blog.js#L829-L836)
- **Category:** Serverless Performance / Bandwidth / Cold Starts
- **Root Cause:**
  On every single blog article request (`/blog/:slug`), the serverless handler executes `fetchPosts()` with no arguments, querying `select: ARTICLE_FIELDS` (including full HTML article bodies) for **all published articles** in the database just to pick 3 related articles.
- **Impact:** Multi-megabyte JSON transfers, severe Vercel function latency spikes, and increased cold-start durations.
- **Remediation:**
  Split into a single-article query by slug and a lightweight related-articles query selecting only `{ id, slug, title, category, thumbnail_url }` with `limit=4`.

---

### 🟠 [HIGH-09] Missing Rate Limiting & Unsafe Filename in `r2-upload`

- **Location:** [`supabase/functions/r2-upload/index.ts:1-112`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/functions/r2-upload/index.ts#L1-L112)
- **Category:** Security / Resource Exhaustion / Crash
- **Root Cause:**
  1. `r2-upload` has no rate limiter, allowing any authenticated user to upload 50MB files in rapid bursts.
  2. Line 63: `file.name.split('.').pop()` crashes with an uncaught `TypeError` when raw audio `Blob` objects are uploaded without a filename.
- **Impact:** Storage flooding risk and unhandled 500 errors on audio uploads.
- **Remediation:**
  Apply `checkRateLimit` and provide a fallback filename: `const fileName = typeof file.name === 'string' ? file.name : 'upload.bin';`.

---

## 4. Medium Severity Issues (P2) — Optimizations & Robustness

### 🟡 [MED-01] Resuming Expired Exam Mode Session Causes Instant 0-Score Submission

- **Location:** [`src/features/testing/shared/testMode.ts:50-60`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/shared/testMode.ts#L50-L60) & [`useExamDeadline.js:20-35`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/shared/hooks/useExamDeadline.js#L20-L35)
- **Issue:** If a candidate returns to an interrupted exam after the wall-clock deadline has passed, `useExamDeadline` computes remaining time as `0` and fires `handleSubmit` within 0ms, grading whatever was saved (often 0 score) without a retry confirmation dialog.
- **Fix:** In `testInitializer.ts`, detect expired exam sessions and show an "Exam Expired" modal offering a fresh retake rather than auto-submitting.

### 🟡 [MED-02] Regex False-Positive Splitting in Bulk Reading Parser

- **Location:** [`src/lib/bulk-question-parser/answers.js:11-28`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/lib/bulk-question-parser/answers.js#L11-L28)
- **Issue:** `matchAll(/(?:^|\s)(\d+)[.)\s]\s*/g)` treats any number in an answer (e.g. "1990", "15 cm") as a question number delimiter.
- **Fix:** Require line start (`^\s*(\d+)[\.\)]\s+`) and verify sequential question numbering (`nextNum === prevNum + 1`).

### 🟡 [MED-03] High-Frequency Re-renders in `SyncedTranscript`

- **Location:** [`src/features/testing/listening/components/ListeningTest/components/SyncedTranscript.jsx:74-77`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/listening/components/ListeningTest/components/SyncedTranscript.jsx#L74-L77)
- **Issue:** `audioCurrentTime` state updates at 4–60Hz during audio playback, re-rendering all transcript paragraphs.
- **Fix:** Memoize individual transcript paragraph components with custom comparisons on `isActive`.

### 🟡 [MED-04] Over-fetching `content_data` in Analytics Queries

- **Location:** [`src/features/analytics/hooks/analyticsQueries.js:27-48`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/analytics/hooks/analyticsQueries.js#L27-L48)
- **Issue:** `fetchSessions` selects `content_data` (heavy JSON with essays and evaluations) across hundreds of sessions in a loop solely to compute band score averages and test counts.
- **Fix:** Omit `content_data` from list queries; load detailed session content on demand.

### 🟡 [MED-05] Vocabulary Mutations Bypass TanStack Query Cache

- **Location:** [`src/features/vocabulary/hooks/useVocabularyMutations.js:13-102`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/vocabulary/hooks/useVocabularyMutations.js#L13-L102)
- **Issue:** Mutations update local state but do not invalidate React Query cache (`queryKeys.vocabulary.list(userId)`), causing stale data when navigating between pages.
- **Fix:** Call `queryClient.invalidateQueries({ queryKey: ['vocabulary'] })` on mutation success.

### 🟡 [MED-06] Insecure CORS Default Fallback with Credentials

- **Location:** [`supabase/functions/_shared/security.ts:22-36`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/functions/_shared/security.ts#L22-L36)
- **Issue:** When `Origin` is missing or unrecognized, `getCorsHeaders` defaults to `http://localhost:5173` while keeping `Access-Control-Allow-Credentials: true`.
- **Fix:** Omit `Access-Control-Allow-Credentials` when origin is untrusted or missing.

### 🟡 [MED-07] Unbounded Queries in RSS Feed, Sitemap, and LLMs Endpoints

- **Location:** [`api/feed.js:65-78`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/api/feed.js#L65-L78), [`api/sitemap.js:95-108`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/api/sitemap.js#L95-L108), [`api/llms.js:76-90`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/api/llms.js#L76-L90)
- **Issue:** Endpoints query `resources` with no `limit` parameter, growing unbounded as articles expand.
- **Fix:** Add appropriate limits (`limit=50` for RSS, `limit=500` for sitemaps).

### 🟡 [MED-08] Missing Partial Composite Index for AI Usage Quotas

- **Location:** [`supabase/migrations/20260211141934_drop_is_super_admin_column.sql:4040`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/supabase/migrations/20260211141934_drop_is_super_admin_column.sql#L4040)
- **Issue:** Rate checks filter by `(user_id, endpoint, created_at, cached)`. The existing index is only on `(user_id, created_at)`.
- **Fix:** Add partial composite index `CREATE INDEX idx_ai_api_usage_quota ON ai_api_usage(user_id, endpoint, created_at DESC) WHERE cached = FALSE;`.

---

## 5. Low Severity Issues & Code Hygiene (P3)

| ID         | Location                                                                                                                                                               | Description                                                                                                          | Recommended Fix                                           |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **LOW-01** | [`src/features/subscription/hooks/usePricing.js:18`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/subscription/hooks/usePricing.js#L18)    | Redundant `await import('@/lib/pricingUtils')` despite static import at top of file, triggering Vite rollup warning. | Import `countryCurrencyMap` statically at top level.      |
| **LOW-02** | [`src/hooks/useNetworkStatus.js:37`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/hooks/useNetworkStatus.js#L37)                                    | `!navigator.onLine === false` is always true on online events, firing false "back online" flash.                     | Use `wasOfflineTimerRef.current` or track previous state. |
| **LOW-03** | [`src/features/subscription/pages/Pricing.jsx:31-60`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/subscription/pages/Pricing.jsx#L31-L60) | Direct `fetch()` calls to Edge Functions omit CSRF headers from `@/lib/csrf.ts`.                                     | Use `csrfFetch()` helper.                                 |
| **LOW-04** | [`src/hooks/useGamification.ts:119-120`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/hooks/useGamification.ts#L119-L120)                           | Untracked `setTimeout` for XP notification may fire on unmounted component.                                          | Store timeout ID in `useRef` and clear on unmount.        |
| **LOW-05** | [`src/lib/bulk-question-parser/parseBulkQuestions.js`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/lib/bulk-question-parser/parseBulkQuestions.js) | Over 25 `console.log` statements in parser utilities spam test logs and production consoles.                         | Remove debug `console.log` statements.                    |

---

## 6. Design System & UI/UX Audit (Learner Panel & WCAG 2.1 AA)

### 6.1 Design System Rule Violations (Zero-Glassmorphism Rule)

**Rule Reference:** `.claude/skills/learner-panel-design/SKILL.md` & `AGENTS.md`

> _Do NOT use legacy glassmorphism (`backdrop-blur`, heavy `shadow-lg` / `shadow-2xl`, glowing neon backlights). Hierarchy is built strictly using hairline rules (`border-[#e4e2f0]` / `dark:border-white/[0.07]`), subtle surface elevation (`WELL`, `TILE`), and card gradients._

1. **[`src/features/subscription/components/ComparisonSection.jsx:12-14`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/subscription/components/ComparisonSection.jsx#L12-L14)**: Uses `bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl shadow-2xl`. Replace with standard `PANEL` primitive.
2. **[`src/features/subscription/components/ManualPayment.jsx:130-138`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/subscription/components/ManualPayment.jsx#L130-L138)**: Uses `bg-slate-950/60 backdrop-blur-xl` overlay and `rounded-4xl shadow-2xl` card. Refactor to Radix Dialog with `PANEL`.
3. **[`src/features/testing/speaking/components/UpgradeDialog.jsx:21-28`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/speaking/components/UpgradeDialog.jsx#L21-L28)**: Uses `border-none shadow-2xl` and neon backlights `bg-rose-500/30 blur-[80px]`. Replace with hairline border `dark:border-white/10` and `PANEL`.
4. **[`src/features/testing/writing/components/WritingTest/components/WritingDialogs.jsx:65-192`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/writing/components/WritingTest/components/WritingDialogs.jsx#L65-L192)**: Dialogs use `border-none` and `backdrop-blur-xl`. Apply hairline borders and `IconChip` with `tone="accent"`.
5. **[`src/components/XPNotification.jsx:28-33`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/components/XPNotification.jsx#L28-L33)**: Uses legacy blur glows `shadow-[0_0_50px_-12px_rgba(245,158,11,0.3)]`.

### 6.2 Accessibility (WCAG 2.1 AA) Compliance

1. **Missing Audio Player Labels ([WCAG 4.1.2 Level A](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)):**
   [`src/features/testing/listening/components/ListeningTest/components/AudioPlayer.jsx:215-251`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/listening/components/ListeningTest/components/AudioPlayer.jsx#L215-L251) Play/Pause and Seek `-10s`/`+10s` buttons lack `aria-label`.
2. **Missing Test Header Exit Button Labels ([WCAG 1.1.1 Level A](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)):**
   [`ListeningTestHeader.jsx:80`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/listening/components/ListeningTestHeader.jsx#L80), [`ReadingTestHeader.jsx:209`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/reading/components/ReadingTestHeader.jsx#L209), [`WritingHeader.jsx:56`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/writing/components/WritingTest/components/WritingHeader.jsx#L56), and [`TestResultsModal.jsx:302`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/components/results/TestResultsModal.jsx#L302) have icon buttons without `aria-label`.
3. **Unlabeled Exam Input Fields ([WCAG 1.3.1 Level A](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)):**
   [`ReadingTestSheet/AnswerInputItem.jsx:142`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/reading/components/ReadingTestSheet/AnswerInputItem.jsx#L142) and [`ListeningTestSheet.jsx:220`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/listening/components/ListeningTestSheet.jsx#L220) render inputs without `id` or `aria-label`.
4. **Keyboard Focus Ring Suppression ([WCAG 2.4.7 Level AA](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html)):**
   [`src/features/learning/pages/BlogIndex.jsx:1005`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/learning/pages/BlogIndex.jsx#L1005) uses `focus:outline-none! focus-visible:ring-0!`, stripping focus indicators.

### 6.3 Mobile UX & Touch Targets

1. **Sub-44px Touch Targets:**
   - Vocabulary cards action buttons: `30x30px` ([`VocabularyCardItem.jsx:30`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/vocabulary/components/VocabularyCardItem.jsx#L30))
   - Table action buttons: `32x32px` ([`VocabularyTableRow.jsx:106`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/vocabulary/components/VocabularyTableRow.jsx#L106))
   - Modal close button: `32x32px` ([`TestResultsModal.jsx:306`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/components/results/TestResultsModal.jsx#L306))
   - Mobile sidebar toggle: `36x36px` ([`Layout.jsx:272`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/core/pages/Layout.jsx#L272))
2. **Missing iOS Safe Area Padding:**
   [`ListeningTestMainContent.jsx:200`](file:///Users/rayanrizon/Documents/Project/Ielts%20Ai%20Pro/src/features/testing/listening/components/ListeningTest/components/ListeningTestMainContent.jsx#L200) bottom action bar lacks `env(safe-area-inset-bottom)`.

---

## 7. Prioritized Remediation Roadmap

### Phase 1: Critical Fixes & Data Integrity (P0)

- [ ] **DB / Edge:** Fix `updateUserPoints` to execute atomic `add_user_points` RPC.
- [ ] **DB:** Add `FOR UPDATE` row lock in `redeem_promo_code` SQL function.
- [ ] **DB:** Update `get_user_daily_usage` and `get_user_monthly_usage` to ignore failed AI reservations.
- [ ] **Autosave:** Add `.eq('is_completed', false)` in `useAutosave.ts` and fix `normalizeAnswersForComparison` for Reading/Listening.
- [ ] **Audio:** Move `stopMediaStream` inside `mediaRecorder.onstop` in `audioRecorderRuntime.js`.
- [ ] **Timers:** Replace interval ticks with wall-clock delta calculation in `useSpeakingTimers.js`.
- [ ] **Editor:** Add `onBlur` and unmount flush to `WritingEditor.jsx`.
- [ ] **Parsers:** Correct question offset calculation in `listening-question-parser/answers.js`.
- [ ] **Auth / App:** Fix `App.jsx` root error boundary structure and `AuthContext` eager cache desync.

### Phase 2: Performance & High-Impact Polish (P1)

- [ ] **Blog Serverless:** Refactor `api/blog.js` to eliminate full content over-fetching for related articles.
- [ ] **R2 Upload:** Add `checkRateLimit` and safe filename parsing in `r2-upload/index.ts`.
- [ ] **React Contexts:** Memoize `AuthContext` value and `WritingTestDispatchContext.Provider`.
- [ ] **Zustand Selectors:** Refactor `useReadingTestState` and `useWritingTestState` to granular atomic selectors.
- [ ] **Highlighter:** Refactor `useHighlighter.js` to avoid direct DOM mutations on React-rendered nodes.
- [ ] **Indexes:** Deploy composite index `idx_ai_api_usage_quota` on `ai_api_usage`.

### Phase 3: Design System & Accessibility Hardening (P2)

- [ ] **Design Tokens:** Replace legacy glassmorphism and `shadow-2xl` in `ComparisonSection.jsx`, `ManualPayment.jsx`, and `UpgradeDialog.jsx` with `PANEL` and `WELL` primitives.
- [ ] **WCAG:** Add `aria-label` to all audio controls, test headers, modal close buttons, and sheet inputs.
- [ ] **Focus Styles:** Restore `focus-visible:ring-2` on `BlogIndex.jsx`.
- [ ] **Touch Targets:** Increase all interactive buttons to minimum 44×44px hit-areas.
- [ ] **Safe Areas:** Add `env(safe-area-inset-bottom)` to floating bottom bars.

---

_Report compiled automatically by Antigravity Deep Codebase Diagnostics Suite._
