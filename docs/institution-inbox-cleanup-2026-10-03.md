# Institution inbox fix and QA cleanup — October 3, 2026

Applications were persisted correctly in the linked live database (`zvrmvycajimjxghrnpgy`). The institution directory only loaded enrolled partners; its default view showed archived QA partners without a pending-request indicator. An already-open request inbox fetched once and could remain stale after another tab submitted an application.

The admin page now checks pending applications independently, displays their count on the request tab, and opens that tab when arriving without an explicit view and requests are waiting. An explicit institution-directory choice persists. Pending counts and inbox entries refresh every 30 seconds while visible, on window focus, and when the document becomes visible. A manual Refresh requests button is available. Background inbox refresh pauses during review; loading failures remain visible instead of presenting a zero count.

## Verification

- Three focused Vitest files passed: 30 tests, including default inbox navigation, explicit directory selection, returning to a stale inbox, manual refresh, and visible loading failures.
- Scoped ESLint and `git diff --check` passed. The production build passed.
- The live admin database RPC returned both pending applications. In the authenticated Safari session at `localhost:5173`, Institutions navigation opened the real request inbox, showed both submissions and review buttons, and displayed the pending count. Transport was not mocked for this check.
- After cleanup, the browser showed zero institutions, zero pending requests, and the eight existing global pricing rules. This frontend fix is local; no production frontend deployment, commit, or push was performed.

## Carefully scoped live cleanup

Removed the three archived QA institutions shown in the screenshot, using exact IDs:

- `41c71765-eb41-4b5e-8c52-ffbc343db79e`
- `7f21e0f4-bdd0-46dd-a64c-ea4984b8f401`
- `8a238c65-c095-46e8-a69b-32c413b7bcb6`

Their related records were backed up before removal: eight QA orders, seven revoked seats, seven invitations, two custom pricing rules, 49 institution/request audit rows, and two historical reviewed requests. The payment inventory contained one fully refunded sandbox order, failed unpaid checkout attempts (including one live session), and a complimentary QA grant. There were no institution billing-history rows and no remaining active seat grants. No Stripe operation was performed.

The user separately confirmed removing both recent pending test submissions, IDs `55b1e1b4-ddb7-4374-8180-3b32dd3163b3` and `bcb2b04f-dce6-436c-8fce-44e93a980d67`. These were separately backed up and removed only if their complete records still matched the backup. No invitation or account was created from these applications.

Cleanup ran in transactions, using explicit row allowlists, locks and full-record backup comparisons. The first transaction aborted without deletion because the audit comparison sorted numeric IDs as text; numeric comparison was corrected before the successful run. Existing global pricing, rollout settings, general rollout audit history, learner accounts, personal subscriptions, and authentication accounts were preserved.

Private recovery files are outside the repository at `/Users/rayanrizon/.codex/backups/institution-cleanup-20261003/`, with directory permissions 0700 and files 0600. `records.json` and `restore.sql` recover the archived QA institutions and historical records. `pending-records.json` and `restore-pending.sql` recover the two subsequently confirmed test applications. The historical restore SQL was exercised against the live database within a transaction and rolled back successfully, restoring three institutions, eight orders and seven seats for that check without committing them.

Final database counts: zero institutions, applications, institution orders, seats, invitations, and custom pricing rules; eight global pricing rules remain.

## Follow-up: QA accounts in User Management

The initial cleanup preserved authentication accounts and learner profiles, so the six banned institution QA accounts still appeared in User Management. This was an incomplete part of the requested test-data cleanup.

Confirmed all six exact screenshot addresses as disposable institution QA accounts on `example.test`, banned through 2126, with role `user`, personal plan `free`, no Stripe subscription, no owned storage objects, and no non-cascading shared-data references. Backed up their complete dependency closure privately to `user-records.json` in the same recovery directory before removing them through the official Supabase Auth admin deletion API. Backup includes six authentication records and identities, six profiles and points rows, 88 seeded skill rows, four activity-day rows, and 11 session/refresh-token/AMR rows each. This file contains private authentication recovery data and must not be committed or shared.

Live verification confirmed zero matching QA profiles and authentication accounts remain. Parisa's profile and authentication account and the platform admin profile were verified preserved. No other test accounts or real learners were selected for deletion.
