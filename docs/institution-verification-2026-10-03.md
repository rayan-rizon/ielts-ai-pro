# Institution deployment and verification — October 3, 2026

## Deployed scope

Linked Supabase project: `zvrmvycajimjxghrnpgy`.

Applied only the institution migrations, without pushing unrelated or divergent migration history:

- `20261002214310_institution_subscriptions.sql`
- `20261002215002_institution_foreign_key_indexes.sql`

Local migration filenames match the versions assigned by the remote migration ledger. Captured the existing learner function definitions before deployment for rollback. All six institution tables have RLS enabled. Invitations, audit and raw pricing have no authenticated table grants; authenticated users must use the checked API. Eight default prices were independently seeded from current individual USD/BDT prices.

Deployed and verified ACTIVE: `institutions`, `stripe-webhook`, `admin-payment-history`, `ai-coach`, `evaluateGrammarTransfer`, `evaluateSpeakingTest`, `generateAdaptiveLearningPath`, `generateDetailedFeedback`, `generateDetailedSpeakingFeedback`, `generateStudyRecommendations`, `processSpeakingSession`, `reading-assistant`, `synthesizePracticeSpeech`, `synthesizeSpeech`, `transcribeAudio`. Preserved the existing JWT verification settings, including signature verification on the webhook.

The `institution-access-reconcile` cron job is enabled every minute. Observed multiple successful actual executions in `cron.job_run_details`, rather than only confirming that the job was scheduled.

Security/performance advisors were inspected after the main migration. Institution tables deliberately denied to authenticated clients produced informational no-policy notices; self-authorized security-definer RPCs produced expected warnings. Preexisting unrelated warnings were left unchanged. Missing institution foreign-key indexes were added in the second migration. A later advisor rerun was unavailable because the connector returned a permission error; do not interpret it as a clean advisor result.

No production frontend deployment, commit, push, or live charge was made.

## Real authenticated browser and API checks

Used the existing admin session at localhost:5173. Created isolated disposable owner, student, personal-Premium and unrelated accounts, with separate localhost origins for owner/student browser sessions. No mocked transport was used for these checks.

Verified:

- Admin institution creation, owner invitation/acceptance, complimentary grant, negotiated pricing, access extension and audit history through the actual local browser.
- Owner student invitations, CSV preview with duplicate/invalid rows, and import of only the valid row. Backend repeated/batch invitation requests did not reserve extra seats.
- Verified recipient binding, repeated acceptance, a free learner activating Pro, and a personal-Premium learner reserving a Waiting seat without changing personal billing.
- Student/unrelated account management denials, owner denials for admin operations, tenant RLS, anonymous denial, and rejection of direct calls to service-only mutation RPCs.
- Default quote calculation, ignored client totals, invalid quantity/duration rejection, negotiated override, exact custom package precedence, nonmatching quantity fallback, and an immutable saved quote after admin pricing changes.
- Suspension blocking purchases/distribution while existing activated access continued.
- Renewal with one active and one waiting seat; admin waiting-seat release; assignment corrections; atomic activation after personal expiry; explicit revocation falling back to valid personal Premium.
- Live learner RPCs for current tier, Reading/Listening quotas, Grammar Lab and feature requests recognized sponsored Pro. Writing quota reservation recognized Pro allowances and preserved idempotency; access changes did not reset usage.
- Learner Settings showed the institution name, active Pro plan and expiry, alongside an unchanged personal Free subscription.
- Admin Payments showed one institution transaction and a working institution-management link, with the correct source label. Complimentary seats generated no payment records.
- Responsive owner panel at 390px in light/dark themes. No document-level horizontal overflow; wide tables scroll inside their containers. Fixed the mobile title/menu-button overlap and verified the heading starts below the toggle.

Evidence:

- Sponsored learner access
- Owner students, mobile light
- Owner students, mobile dark
- Institution payment in admin
- Final disabled rollout gate

## Payment verification boundary

The deployed institution Checkout opened using the live Stripe key and the correct $29.97 package for three Pro seats. Left it unpaid.

Separately completed an actual Stripe **sandbox** Checkout payment for $19.98/two seats in the browser. Ran the same webhook source locally with the sandbox key and a temporary signing secret, while its database operations used the deployed institution schema. Signed test deliveries were generated locally and the handler independently retrieved the actual paid session from Stripe. This verifies the handler and database integration, not Stripe's network delivery to the hosted production endpoint.

Passed invalid-signature rejection, repeated completion, delayed-success event routing, exactly two fulfilled seats, one payment ledger entry, invoice/receipt links, unchanged owner personal billing, a real partial sandbox refund blocking allocation, a full sandbox refund revoking all associated seats, duplicate refunds, and zero net institution revenue. Delayed unpaid/failure and refund-before-fulfilment cases are additionally covered by unit/database suites; a real asynchronous bank-payment lifecycle was not exercised.

Before enabling live institution purchases, verify the production Stripe endpoint subscribes to the institution checkout, delayed-payment, expiry, invoice and refund events documented in the rollout guide. Live webhook delivery and a live financial transaction were not tested. No changes to existing Stripe webhook subscriptions were made.

## Local checks and cleanup

- Isolated PostgreSQL 16 harness passed real quota-function rewrites, seat/payment/refund lifecycle, RLS, concurrent repeated acceptance and last-seat contention. Both institution migrations are included.
- Institution/pricing/CSV/webhook, personal-billing provenance and Reading Assistant regression tests: 5 files / 42 tests passed.
- Production build passed, including the mobile spacing fix. ESLint on the changed frontend files passed; TS files are outside the repository's ESLint configuration and were type-checked during implementation.
- Final full repository unit suite: **344 files / 2,651 tests passed**, exit 0. The first verification run had one wall-clock-sensitive translation-cache coalescing failure; its focused rerun passed. The test now controls debounce timers rather than relying on CPU scheduling.

Cleanup archived `[QA archived] Institution murhsuq6`, revoked all seven test seats, disabled institution-specific QA prices, cancelled unused invitations, marked abandoned quotes failed, banned all four QA logins, restored their personal access to Free, and removed the sandbox payment ledger record and the single QA quota reservation. Retained labelled order/audit history for traceability. The actual sandbox payment was fully refunded. The feature gate is **false**. Existing admin credentials/session were preserved. Temporary QA browser tabs and servers were closed; the original localhost:5173 development server remains running.
