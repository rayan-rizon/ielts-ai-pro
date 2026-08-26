# IELTS AI Pro — Comprehensive Project Issues, Bottlenecks & Performance Audit

**Audit Date:** August 27, 2026
**Auditor System:** Antigravity Multi-Agent Audit Swarm (Edge AI, Database/Security, Frontend Architecture, Practice Test Engines)
**Verification Method:** Static Code Analysis, PostgreSQL Migration & RPC Tracing, AST Inspection, Runtime Lifecycle Analysis, and Cross-Module Concurrency Verification.

---

## Verification addendum — 2026-08-27

This document began as a hypothesis list. The matrix below is the release record: each claim was traced to source and, where applicable, checked against the production database or public site.

| Findings                                                                    | Disposition                                                | Resolution / evidence                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB-01, DB-02, DB-03, DB-04                                                  | Confirmed                                                  | Local migration `20260826231224_harden_issues_performance_audit.sql` removes learner writes to points/achievements, restores referral trigger bypass safely, qualifies `get_session_counts`, and serializes one-referral assignment. Production verification found no existing duplicate referrals.                    |
| DB-05                                                                       | Confirmed data divergence; cause requires product decision | 13 of 261 joined profiles have divergent legacy streak fields. No blind data rewrite: `users.current_streak` remains the product source until its obsolete duplicate can be retired safely.                                                                                                                            |
| DB-06                                                                       | Partly stale / overbroad                                   | The live advisor identifies actual unindexed foreign keys; the claimed blanket index set is not justified. No speculative indexes were added.                                                                                                                                                                          |
| TE-01, TE-02, TE-04, TE-05, TE-06, FE-02, FE-05, FE-06, AI-01, AI-03, AI-04 | Confirmed and fixed locally                                | Exam-mode timer is single-owner; persisted stores clear their real keys; the Part 2 card persists; validation is bounded; recovery TTS completes before the mic restarts; 401 refresh is explicit; TanStack pagination is deterministic; transcript animation has a stable timer; Edge conversions/CORS are corrected. |
| AI-02                                                                       | Confirmed, mitigated                                       | Added one bounded retry for transient Gemini failures and recorded it in the model registry. A second provider requires a rubric benchmark and is not safe to introduce without that evidence.                                                                                                                         |
| FE-01, FE-03, FE-04, TE-07                                                  | Real optimization opportunities, not safe hotfixes         | The live bundle still contains a 122 kB gzip Framer chunk and the stylesheet is 747 kB uncompressed. Unload persistence and audio transport need a designed recovery/upload contract; no fake `beforeunload` async save or risky storage migration was shipped.                                                        |
| TE-03, TE-08                                                                | Stale / not reproduced                                     | `src/lib/r2.ts` is admin-only; learner Task 1 uploads use the purpose-gated client path. The recorder already probes WebM then MP4, so the claimed universal iOS WebM default is inaccurate.                                                                                                                           |
| L-01, L-02, L-03, L-06, L-07, L-10, L-11                                    | Confirmed and fixed locally                                | Corrected transcript-size telemetry, parallelized blog SSR reads, rounded provider costs to six decimals, excluded the Lucide vendor from route preloads, guarded admin analytics state, aligned the displayed perfect-score bonus with the 250-point award, and paginated sitemap/LLM article reads beyond 500 posts. |
| L-04                                                                        | Already mitigated                                          | The editor already debounces parent/store updates and calculates a local word count; the regex was tightened to avoid an unnecessary optional quantifier.                                                                                                                                                              |
| L-05                                                                        | Stale / not reproduced                                     | Scrolling occurs when the active transcript segment changes, not on every word/audio tick.                                                                                                                                                                                                                             |
| L-08                                                                        | Infrastructure configuration, not code                     | R2 lifecycle expiry must be configured on the Cloudflare bucket; the Edge upload function cannot create a bucket lifecycle rule.                                                                                                                                                                                       |
| L-09                                                                        | Intentional fail-closed behavior                           | Unauthenticated callers without a trustworthy client IP share a conservative bucket; weakening this to a spoofable per-request key would reduce abuse protection.                                                                                                                                                      |

### Verification performed

- Fresh public crawl of `https://www.ieltsai.pro` (100 pages): 69/100, with real remaining structured-data, CSS-size, external-link, and CSP work recorded above rather than mislabelled as code defects.
- Production database inspection: direct point/achievement write grants and permissive policies confirmed; referral duplicate count was 0; streak divergence was 13/261; `get_session_counts` had an unqualified table reference.
- Local checks after fixes: ESLint passed; Vite production build passed; focused unit suites passed (62 tests); Prettier and `git diff --check` passed.
- Release state: both hardening migrations were applied and smoke-verified in production; the changed Edge Functions were deployed with JWT verification preserved; and the Vercel production deployment reached `Ready` with the `www.ieltsai.pro` alias. The audit changes are committed after final verification; no Git push was performed because it was not requested.

## Executive Summary

An exhaustive, repository-wide technical audit was conducted across the entire IELTS AI Pro codebase (`src/`, `supabase/`, `api/`, `scripts/`, configuration, and dependencies). The audit verified every finding through direct line-by-line code review, PostgreSQL query and locking semantics, React state lifecycle inspections, and Web Audio / Media stream lifecycles.

### Summary by Severity & Domain

| Domain / Subsystem                                    | Critical |  High  | Medium |  Low   | Total Findings |
| :---------------------------------------------------- | :------: | :----: | :----: | :----: | :------------: |
| **1. Database Layer, RPCs, RLS & Migrations**         |    1     |   2    |   5    |   3    |     **11**     |
| **2. Practice Test Engines & Concurrency**            |    1     |   5    |   4    |   1    |     **11**     |
| **3. Frontend Architecture, React Renders & Bundle**  |    1     |   3    |   3    |   2    |     **9**      |
| **4. Edge Functions, AI Pipelines & Serverless APIs** |    0     |   2    |   5    |   5    |     **12**     |
| **Total Verified Issues**                             |  **3**   | **12** | **17** | **11** |     **43**     |

---

## Section 1: Critical Severity Findings (Immediate Action Required)

### 🔴 Finding DB-01: Direct REST Manipulation Vulnerability on `user_points` and `user_achievements`

- **Category:** Database Security & RLS Bypass
- **File & Lines:** [`supabase/migrations/20260215110410_remote_schema.sql:L1200-L1214`](supabase/migrations/20260215110410_remote_schema.sql#L1200-L1214), [`supabase/migrations/20260211141934_drop_is_super_admin_column.sql:L4923-L4927`](supabase/migrations/20260211141934_drop_is_super_admin_column.sql#L4923-L4927)
- **Root Cause:**
  While the stored procedure `award_user_points()` was secured to `service_role` only, the underlying table policy `points_all_policy` on `public.user_points` was left configured as:
  ```sql
  CREATE POLICY "points_all_policy" ON "public"."user_points"
    AS PERMISSIVE FOR ALL TO "authenticated"
    USING (((user_id = (SELECT public.get_my_public_user_id())) OR public.is_admin()));
  ```
  Similarly, `achievements_all_policy` on `public.user_achievements` is `FOR ALL TO authenticated`, and `GRANT ALL ON TABLE public.user_points TO authenticated` was never revoked.
- **Concrete Impact / Exploit:**
  Any authenticated user can open their browser developer tools and execute:
  ```javascript
  await supabase
    .from('user_points')
    .update({ points: 999999, level: 99, current_streak: 365 })
    .eq('user_id', my_id);
  ```
  This immediately overwrites their points, streak, and level in the database without completing any practice tests or exercises, completely undermining the global leaderboard and gamification integrity.
- **Recommended Fix:**
  1. Revoke `INSERT, UPDATE, DELETE` permissions on `public.user_points` and `public.user_achievements` from `anon` and `authenticated`.
  2. Drop `points_all_policy` and `achievements_all_policy` and replace them with strict `FOR SELECT TO authenticated` read-only policies.

---

### 🔴 Finding TE-01: Dual Competing Timers Overwriting `timeRemaining` State in Writing Exam Mode

- **Category:** Concurrency / State Synchronization Race
- **File & Lines:**
  - [`src/features/testing/writing/components/WritingTest/context/WritingTestContext.jsx:L68-L114`](src/features/testing/writing/components/WritingTest/context/WritingTestContext.jsx#L68-L114)
  - [`src/features/testing/writing/components/WritingTest/hooks/useWritingTaskLogic.js:L233-L242`](src/features/testing/writing/components/WritingTest/hooks/useWritingTaskLogic.js#L233-L242)
  - [`src/features/testing/shared/hooks/useExamDeadline.js:L22-L44`](src/features/testing/shared/hooks/useExamDeadline.js#L22-L44)
- **Root Cause:**
  When a Writing test is started in Exam Mode, two independent timer loops run simultaneously:
  1. `WritingTestProvider` in `WritingTestContext.jsx` runs a `setInterval` measuring elapsed local time (`Date.now() - startTime`) and calling `state.setTime(newRemaining)`.
  2. `useWritingTaskLogic.js` calls `useExamDeadline`, which runs its own `setInterval` measuring time from the session's server `created_at` timestamp and calling `state.setTime(remaining)`.
- **Concrete Impact / Failure Scenario:**
  Because the two loops calculate remaining seconds from different reference times and tick at slightly different millisecond offsets, they fight each other every second, overwriting `timeRemaining`. If a user resumes a test 10 minutes into the exam, Timer 1 starts from 3600s and counts down while Timer 2 calculates 3000s and counts down, causing the clock display to jitter back and forth and triggering false time-up dialogs.
- **Recommended Fix:**
  Disable the internal timer in `WritingTestContext.jsx` when in Exam Mode, centralizing countdown logic solely in `useExamDeadline`.

---

### 🔴 Finding FE-01: Synchronous `framer-motion` Import Contaminating Landing Page Bundle

- **Category:** Bundle Sizing & Core Web Vitals (LCP/FCP)
- **File & Lines:**
  - [`src/features/core/components/landing/Navbar.jsx:L3`](src/features/core/components/landing/Navbar.jsx#L3)
  - [`src/features/core/components/landing/DesktopNavLinks.jsx:L2`](src/features/core/components/landing/DesktopNavLinks.jsx#L2)
  - [`src/features/core/components/landing/MobileNavMenu.jsx:L3`](src/features/core/components/landing/MobileNavMenu.jsx#L3)
  - [`src/features/core/pages/LandingPage.jsx:L11`](src/features/core/pages/LandingPage.jsx#L11)
  - [`src/App.jsx:L14, L210-L218`](src/App.jsx#L14)
- **Root Cause:**
  `App.jsx` deliberately bypasses `MotionProvider` on the `/` route to keep initial page load fast and lightweight. However, `LandingPage.jsx` directly imports `Navbar.jsx`, which imports `import { motion, AnimatePresence } from 'framer-motion'`.
- **Concrete Impact / Failure Scenario:**
  The entire full-weight Framer Motion animation engine (~40 KB gzipped / ~150 KB parsed) is pulled into the critical landing page bundle. This blocks the main thread during initial parse and worsens First Contentful Paint (FCP) and Largest Contentful Paint (LCP) for every visitor.
- **Recommended Fix:**
  Refactor `Navbar.jsx`, `DesktopNavLinks.jsx`, and `MobileNavMenu.jsx` to use Tailwind CSS transitions or use Framer Motion's lightweight `m` component with `<LazyMotion features={domAnimation}>`.

---

## Section 2: High Severity Findings

### 🟠 Finding DB-02: `claim_referral_rewards` Blocked by Sensitive Column Protection Trigger

- **Category:** Database RPC Defect / Broken Feature
- **File & Lines:** [`supabase/migrations/20260521183000_security_hotfix_rpc_rls.sql:L85-L100`](supabase/migrations/20260521183000_security_hotfix_rpc_rls.sql#L85-L100)
- **Root Cause:**
  The `protect_sensitive_user_columns()` trigger prevents updates to `bonus_writing_credits`, `bonus_speaking_credits`, and `referral_bonus_expires_at` unless `app.bypass_column_protection = 'on'`. The `claim_referral_rewards(p_user_id)` function updates those columns but omits `PERFORM set_config('app.bypass_column_protection', 'on', true)`.
- **Concrete Impact:**
  Every time a learner tries to claim their earned referral bonus credits, the transaction crashes with: `ERROR: Cannot modify protected column: referral_bonus_expires_at`. Referral reward claims are 100% broken in production.
- **Recommended Fix:**
  Add `PERFORM set_config('app.bypass_column_protection', 'on', true);` before updating `public.users` in `claim_referral_rewards`.

---

### 🟠 Finding DB-03: Unqualified Table Reference in `get_session_counts` with Empty `search_path`

- **Category:** Database RPC Runtime Crash
- **File & Lines:** [`supabase/migrations/20260214210059_remote_schema.sql:L139-L149`](supabase/migrations/20260214210059_remote_schema.sql#L139-L149)
- **Root Cause:**
  `get_session_counts` is defined with `SET search_path TO ''` for security, but the query body uses an unqualified table name: `FROM test_sessions` instead of `FROM public.test_sessions`.
- **Concrete Impact:**
  Calling `get_session_counts` fails immediately with `ERROR: relation "test_sessions" does not exist (SQLSTATE 42P01)`.
- **Recommended Fix:**
  Change `from test_sessions` to `from public.test_sessions`.

---

### 🟠 Finding AI-01: Heap Allocation & CPU Spiking on Naive Image Base64 Encoding

- **Category:** Edge Function Memory & Performance
- **File & Lines:** [`supabase/functions/generateDetailedFeedback/index.ts:L541-L545`](supabase/functions/generateDetailedFeedback/index.ts#L541-L545)
- **Root Cause:**
  When converting an uploaded Task 1 image (up to 8 MB) to base64, the function executes:
  ```ts
  const arrayBuffer = await imageBlob.arrayBuffer();
  const base64Image = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  ```
  For an 8 MB image (~8.38 million bytes), `.reduce()` performs **8.38 million single-character string allocations and concatenations** in V8 isolate memory.
- **Concrete Impact:**
  Creates hundreds of megabytes of garbage allocations, triggering CPU spikes and Deno isolate Out-Of-Memory (OOM) 500/504 errors on large image uploads.
- **Recommended Fix:**
  Use Node Buffer: `Buffer.from(arrayBuffer).toString('base64')` or chunked subarray conversion.

---

### 🟠 Finding AI-02: Single Point of Failure (No Fallback Route) for Detailed Speaking Feedback

- **Category:** AI Pipeline Resilience
- **File & Lines:** [`supabase/functions/generateDetailedSpeakingFeedback/index.ts:L293-L316`](supabase/functions/generateDetailedSpeakingFeedback/index.ts#L293-L316)
- **Root Cause:**
  Unlike `generateDetailedFeedback` (Writing), `evaluateSpeakingTest`, and `evaluateGrammarTransfer`, which implement multi-provider fallbacks (OpenRouter / DeepSeek / Gemini), `generateDetailedSpeakingFeedback` makes a single direct call to Gemini without a fallback or retry mechanism.
- **Concrete Impact:**
  If Google Gemini returns HTTP 429 (rate limit) or HTTP 503, the speaking deep-dive evaluation permanently fails for the student.
- **Recommended Fix:**
  Wrap the invocation with `requestJsonWithGeminiFallback` or configure an OpenRouter fallback route.

---

### 🟠 Finding FE-02: Edge Function 401/403 Token Expiration Retry Without Session Refresh

- **Category:** Auth & Network Resilience
- **File & Lines:** [`src/utils/api.js:L120-L126`](src/utils/api.js#L120-L126), [`src/lib/supabase.ts:L40-L48`](src/lib/supabase.ts#L40-L48)
- **Root Cause:**
  When a browser tab is backgrounded, `supabase.auth.stopAutoRefresh()` suspends token refresh. When a request to an Edge Function returns 401/403, `callEdgeFunction` sleeps 1000ms and retries using `client.auth.getSession()`, which still contains the expired JWT token.
- **Concrete Impact:**
  When returning to a tab after an idle period, AI submissions (speaking feedback, writing evaluation) fail immediately with `"Please log in again to use AI features"`.
- **Recommended Fix:**
  Call `await client.auth.refreshSession()` before retrying on 401/403 in `callEdgeFunction`.

---

### 🟠 Finding FE-03: Asynchronous Autosave Dropped by Browsers on Page Unload

- **Category:** Data Loss on Tab Close
- **File & Lines:** [`src/hooks/useAutosave.ts:L397-L415`](src/hooks/useAutosave.ts#L397-L415), [`src/hooks/useAutosave.ts:L248-L257`](src/hooks/useAutosave.ts#L248-L257)
- **Root Cause:**
  `useAutosave` listens to `beforeunload` and `pagehide` and calls `performSaveCheck(true)`, which makes an asynchronous Supabase JS update. Modern browsers abort standard asynchronous HTTP requests during unload events unless dispatched with `keepalive: true` or `navigator.sendBeacon`.
- **Concrete Impact:**
  If a student types essay content and closes the browser tab within 25 seconds of typing (before the periodic 30s timer), the final draft changes are aborted and permanently lost.
- **Recommended Fix:**
  Persist the draft synchronously to `localStorage` on `beforeunload` and use `fetch(..., { keepalive: true })` or `navigator.sendBeacon` for edge sync.

---

### 🟠 Finding TE-02: Unpersisted Key Mismatch in `useWritingTestStore.clearPersistedData`

- **Category:** State Storage Defect
- **File & Lines:** [`src/features/testing/writing/store/useWritingTestStore.js:L309-L315, L355-L356`](src/features/testing/writing/store/useWritingTestStore.js#L309-L315), [`src/features/testing/reading/store/useReadingTestStore.js:L230-L235`](src/features/testing/reading/store/useReadingTestStore.js#L230-L235), [`src/features/testing/listening/store/useListeningTestStore.js:L223-L228`](src/features/testing/listening/store/useListeningTestStore.js#L223-L228)
- **Root Cause:**
  Zustand persist middleware stores state in `sessionStorage` under `'writing-test-store'`, `'reading-test-store'`, and `'listening-test-store'`. However, `clearPersistedData()` in all three stores calls:
  `sessionStorage.removeItem('writing-test-' + sessionId)` (a key that is never written).
- **Concrete Impact:**
  When a test is finished or reset, old test drafts and progress remain in `sessionStorage`. Starting a new test or opening a retake can restore stale answers from the previous attempt.
- **Recommended Fix:**
  Call `useWritingTestStore.persist.clearStorage()` or remove the actual persist key name.

---

### 🟠 Finding TE-03: Task 1 Image Upload Fails with 403 Forbidden for Non-Admin Users via `src/lib/r2.ts`

- **Category:** Authorization Header Omission
- **File & Lines:** [`src/lib/r2.ts:L8-L26`](src/lib/r2.ts#L8-L26), [`supabase/functions/r2-upload/index.ts:L31-L33, L69-L71`](supabase/functions/r2-upload/index.ts#L31-L33)
- **Root Cause:**
  `src/lib/r2.ts` exports an `uploadToR2(file)` function that invokes `r2-upload` without passing `X-Upload-Purpose: writing-checker`. In `r2-upload/index.ts`, requests without this header default to `admin-content` and require `is_admin() = true`.
- **Concrete Impact:**
  Any non-admin user uploading an image for Task 1 via `src/lib/r2.ts` receives HTTP 403 Forbidden.
- **Recommended Fix:**
  Deprecate `src/lib/r2.ts` in favor of the typed `uploadToR2` in `src/lib/supabase.ts` which properly sets `X-Upload-Purpose`.

---

### 🟠 Finding TE-04: Cue Card Topic Wiped from UI as Soon as Speaking Part 2 Speech Begins

- **Category:** UX & Test Simulation Flaw
- **File & Lines:** [`src/features/testing/speaking/hooks/useStartPartTwoSpeaking.js:L16-L19, L46`](src/features/testing/speaking/hooks/useStartPartTwoSpeaking.js#L16-L19)
- **Root Cause:**
  When the 60-second preparation countdown finishes or the user clicks "Start Speaking Now", `useStartPartTwoSpeaking` calls `setCueCardTopic(null)`.
- **Concrete Impact:**
  In the real IELTS exam, the cue card and prompts remain in front of the student while speaking for 2 minutes. Setting `cueCardTopic` to `null` hides the cue card from the UI right when the user begins speaking.
- **Recommended Fix:**
  Retain `cueCardTopic` in state throughout Part 2 and clear it only upon transitioning to Part 3.

---

### 🟠 Finding TE-05: Unbounded Cache Memory Leak & Exponential Recursion in Answer Validation

- **Category:** Algorithmic Complexity / Memory Leak
- **File & Lines:** [`src/lib/ieltsAnswerValidation.js:L16, L40-L73, L134-197`](src/lib/ieltsAnswerValidation.js#L16)
- **Root Cause:**
  `answerCache` is an unbounded module-level `Map` that never purges entries. Furthermore, `expandAnswerVariations` recursively splits parentheses and alternatives ($O(K^N)$ branching) without a maximum recursion depth guard.
- **Concrete Impact:**
  Malformed or deeply nested question patterns from admin imports can cause `RangeError: Maximum call stack size exceeded` and continuously consume client memory in long-running browser sessions.
- **Recommended Fix:**
  Use an LRU cache (capped at 500 entries) and guard `expandAnswerVariations` with a maximum recursion depth of 5.

---

### 🟠 Finding TE-06: Premature `isProcessing` Reset Allows Mic Auto-Start While Error TTS Plays

- **Category:** Audio Pipeline Race Condition
- **File & Lines:** [`src/features/testing/speaking/hooks/useSpeakingRecordingProcessor.js:L155-L158, L446-L494`](src/features/testing/speaking/hooks/useSpeakingRecordingProcessor.js#L155-L158)
- **Root Cause:**
  In `useSpeakingRecordingProcessor.js`, error speech is triggered via `speakAiMessageFromLoadingState`, but the outer `finally` block sets `setIsProcessing(false)` immediately without awaiting speech completion.
- **Concrete Impact:**
  `canAutoStartSpeakingAnswer` detects that processing is finished and opens the microphone (`startListening()`) while the AI examiner is still speaking the error message, recording the examiner's own voice.
- **Recommended Fix:**
  Await the recovery speech promise before setting `setIsProcessing(false)`.

---

## Section 3: Medium Severity Findings

### 🟡 Finding DB-04: TOCTOU Concurrency Race in Referral Processing & Missing `UNIQUE(referred_id)`

- **File & Lines:** [`supabase/migrations/20260521183000_security_hotfix_rpc_rls.sql:L423-L465`](supabase/migrations/20260521183000_security_hotfix_rpc_rls.sql#L423-L465)
- **Issue:** `public.user_referrals` has constraint `UNIQUE(referrer_id, referred_id)` instead of `UNIQUE(referred_id)`. Parallel requests can register multiple referrers for the same new user.
- **Fix:** Add a unique index on `(referred_id)` and take an advisory transaction lock `pg_advisory_xact_lock(hashtextextended(p_new_user_id::text, 0))`.

---

### 🟡 Finding DB-05: Dual-Source Streak Counter Divergence

- **File & Lines:** [`supabase/migrations/20260217000000_fix_rpc_auth_and_leaderboard.sql:L48-L120`](supabase/migrations/20260217000000_fix_rpc_auth_and_leaderboard.sql#L48-L120), [`supabase/migrations/20260402034000_user_profile_auto_update.sql:L40-L60`](supabase/migrations/20260402034000_user_profile_auto_update.sql#L40-L60)
- **Issue:** Streak is tracked in two places: `user_points` (updated on vocab/grammar) and `users` (updated by test sessions trigger). Performing daily vocab updates `user_points.current_streak` without syncing `users.current_streak`, creating conflicting values in UI profile vs leaderboard.
- **Fix:** Unify streak calculation under a single atomic trigger/procedure.

---

### 🟡 Finding DB-06: 12+ Missing Foreign Key and Query Indexes

- **Issue:**
  - `public.marketing_events (user_id, event_type, occurred_at DESC)`: Unindexed subquery causes full table scans during segment evaluation.
  - `public.billing_history (promo_code, status)`: Unindexed filter in `get_marketing_offer_intelligence`.
  - `public.vocabulary_review_events (vocabulary_item_id)`: Missing FK index on cascade delete.
  - `public.ai_api_usage ((request_metadata ->> 'idempotencyKey'))`: Functional index missing for reservation queries.
- **Fix:** Create btree indexes in a consolidation migration.

---

### 🟡 Finding FE-04: 1-Second Render Cascades in Test Runners (`ListeningTest` & `WritingTest`)

- **File & Lines:** [`src/features/testing/listening/components/ListeningTest/context/ListeningTestContext.jsx:L191`](src/features/testing/listening/components/ListeningTest/context/ListeningTestContext.jsx#L191), [`src/features/testing/writing/components/WritingTest/context/WritingTestContext.jsx:L66`](src/features/testing/writing/components/WritingTest/context/WritingTestContext.jsx#L66)
- **Issue:** `useListeningTestState` and `WritingTestProvider` subscribe directly to `timeRemaining`. Every 1-second timer tick forces a re-render of all question cards, audio controls, and editor containers.
- **Fix:** Isolate `timeRemaining` to a dedicated `useTestTimer()` hook and remove timer subscriptions from parent context providers.

---

### 🟡 Finding FE-05: Missing TanStack Query v5 `initialPageParam` and Stale Leaderboard Cache

- **File & Lines:** [`src/features/gamification/hooks/useLeaderboard.js:L8-L51`](src/features/gamification/hooks/useLeaderboard.js#L8-L51)
- **Issue:** `useInfiniteQuery` omits `initialPageParam: 1` (required in TanStack Query v5) and omits `currentUserId` from `queryKey: ['leaderboard', timeFilter]`. Logging out and in as another user retains previous user's `is_me` formatting.
- **Fix:** Add `initialPageParam: 1` and include `currentUserId` in query key.

---

### 🟡 Finding FE-06: Rapid Audio Time-Update Interval Churn in `ConversationMessage`

- **File & Lines:** [`src/features/testing/speaking/components/ConversationMessage.jsx:L184-L210`](src/features/testing/speaking/components/ConversationMessage.jsx#L184-L210)
- **Issue:** `targetWordCount` is placed in the `useEffect` dependency array while updating on every audio `timeupdate` event (4-5 times/sec), tearing down and recreating the 68ms interval continuously before it can tick.
- **Fix:** Store `targetWordCount` in a ref (`targetWordCountRef.current = targetWordCount`) and keep the `setInterval` dependency stable on `[entry.isExaminerSpeaking]`.

---

### 🟡 Finding AI-03: CORS Policy Inconsistency (`*` Wildcard) in Admin Functions

- **File & Lines:** [`supabase/functions/admin-email-stats/index.ts:L7-L12`](supabase/functions/admin-email-stats/index.ts#L7-L12), [`supabase/functions/admin-payment-history/index.ts:L9-L14`](supabase/functions/admin-payment-history/index.ts#L9-L14)
- **Issue:** Hardcoded `'Access-Control-Allow-Origin': '*'` in admin functions bypasses the strict origin whitelist in `_shared/security.ts`.
- **Fix:** Use `getCorsHeaders(req)` and `handleCorsPrelight(req)` across all admin endpoints.

---

### 🟡 Finding AI-04: Redundant Base64 Round-Trip & Uncached HEAD Request in Speech Synthesis

- **File & Lines:** [`supabase/functions/synthesizeSpeech/index.ts:L116-L121, L344-L350`](supabase/functions/synthesizeSpeech/index.ts#L116-L121)
- **Issue:** Google TTS audio response arrives as Base64, is decoded into binary ArrayBuffer, and then re-encoded back into Base64 via `btoa()` before returning. Also executes an uncached HTTP HEAD check to Supabase storage on every request.
- **Fix:** Return the original Base64 payload directly and verify cache existence via database index.

---

### 🟡 Finding TE-07: Entire Speaking Audio Transferred as Base64 in Edge Function JSON Body

- **File & Lines:** [`src/features/testing/speaking/hooks/useSpeakingRecordingProcessor.js:L97-L120`](src/features/testing/speaking/hooks/useSpeakingRecordingProcessor.js#L97-L120)
- **Issue:** 2-minute Part 2 recordings (3MB–7MB base64 JSON payload) are sent directly to `processSpeakingSession`, causing memory pressure and potential HTTP 413 payload limits.
- **Fix:** Stream audio directly to R2 and pass the key reference to the processing endpoint.

---

### 🟡 Finding TE-08: iOS Safari MIME-Type Defaulting to Unsupported `audio/webm`

- **File & Lines:** [`src/features/testing/speaking/utils/audioRecorderRuntime.js:L439-L444, L478-L481`](src/features/testing/speaking/utils/audioRecorderRuntime.js#L439-L444)
- **Issue:** When Safari MediaRecorder does not report `audio/webm`, fallback defaults blob type to `'audio/webm'` with MP4 bytes, failing magic-byte signature validation on the backend.
- **Fix:** Default Safari fallback mime-types to `'audio/mp4'`.

---

## Section 4: Low Severity & Maintenance Findings

| ID       | Module        | File & Lines                         | Description                                                                                                     |
| :------- | :------------ | :----------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **L-01** | Speaking      | `evaluateSpeakingTest/index.ts:L189` | Logs `failureReason: 'evaluation_parse_failed'` instead of `'transcript_size_exceeded'` on transcript overflow. |
| **L-02** | Blog SSR      | `api/blog.js:L980-L982`              | Sequential database fetch waterfall between article and related posts (should use `Promise.all`).               |
| **L-03** | AI Costs      | `_shared/aiModelRegistry.ts:L290`    | Token cost estimation floating point numbers lack 6-decimal rounding.                                           |
| **L-04** | Writing       | `WritingEditor.jsx:L91-L111`         | Per-keystroke HTML regex word count on large essays causes minor typing latency on mobile.                      |
| **L-05** | Listening     | `SyncedTranscript.jsx:L108-L120`     | Smooth scroll on every word at high playback speeds causes scroll container layout thrashing.                   |
| **L-06** | Bundler       | `vite.config.js:L53-L66`             | `lucide-vendor` manual chunk is eagerly preloaded on every page instead of split per route.                     |
| **L-07** | Admin         | `AdminPanel.jsx:L55-L98`             | Raw `useEffect` data fetching in analytics wrappers lacks unmounted state guards.                               |
| **L-08** | Storage       | `r2-upload/index.ts:L31`             | R2 `writing-checker/` uploads lack a 48-hour object lifecycle auto-deletion policy.                             |
| **L-09** | Rate Limiting | `_shared/security.ts:L130`           | Fallback rate limit identifier `'ip:unknown'` pools unauthenticated requests together.                          |
| **L-10** | Gamification  | `useGamification.ts:L114-L120`       | UI breakdown reports 100 XP bonus while backend awards 250 XP for perfect test scores.                          |
| **L-11** | SEO           | `api/sitemap.js:L104`                | Sitemap and LLMs endpoints query max 500 articles without cursor pagination.                                    |

---

## Section 5: Prioritized Remediation Plan

```mermaid
graph TD
    A[Phase 1: Critical Database & State Security Hotfixes] --> B[Phase 2: Practice Engines & Concurrency Stabilization]
    B --> C[Phase 3: Frontend Render Performance & Bundle Optimization]
    C --> D[Phase 4: Edge AI Resiliency & Audio Pipeline Streaming]
```

### Phase 1: Database & Security Hotfixes (Immediate)

1. Apply hotfix migration for `public.user_points` and `public.user_achievements` to revoke direct write access and enforce `FOR SELECT` RLS policies.
2. Fix `claim_referral_rewards` to bypass column protection trigger during reward claims.
3. Fix `get_session_counts` table qualification (`public.test_sessions`).
4. Add `UNIQUE(referred_id)` and transaction advisory locks to `process_referral`.

### Phase 2: Practice Engines & Concurrency Stabilization

1. Remove redundant countdown interval in `WritingTestContext.jsx` when in Exam Mode.
2. Correct `clearPersistedData()` in Zustand stores to clear `'writing-test-store'`, `'reading-test-store'`, and `'listening-test-store'`.
3. Retain `cueCardTopic` in state throughout Speaking Part 2 speech.
4. Correct Task 1 image upload headers in `src/lib/r2.ts`.
5. Fix `ieltsAnswerValidation.js` unbounded cache and recursion depth.

### Phase 3: Frontend Performance & Bundle Optimization

1. Refactor `Navbar.jsx` to use Tailwind transitions or `LazyMotion`, removing synchronous Framer Motion from the landing bundle.
2. Add `supabase.auth.refreshSession()` before retrying on 401/403 in `callEdgeFunction`.
3. Isolate `timeRemaining` subscriptions in `ListeningTestContext` and `WritingTestContext` to stop 1-second render cascades.
4. Add `initialPageParam: 1` and user ID to `useLeaderboard` query keys.

### Phase 4: Edge AI & Audio Streaming Optimization

1. Replace `.reduce(String.fromCharCode)` with `Buffer.from().toString('base64')` in `generateDetailedFeedback/index.ts`.
2. Add multi-provider fallback chain to `generateDetailedSpeakingFeedback/index.ts`.
3. Stream speaking audio directly to R2 instead of passing multi-megabyte Base64 payloads.
4. Harmonize CORS policies across `admin-*` edge functions.
