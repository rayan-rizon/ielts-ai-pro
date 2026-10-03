# Learner account access repair — 4 October 2026

## Root causes

1. The institution subscription migration made profile reads reconcile seats,
   including `SELECT FOR UPDATE`. Seventeen profile queries across twelve Edge
   Functions still read the profile view through PostgREST GET. Production
   reproduced HTTP 405 / SQLSTATE 25006 because GET runs in a read-only
   transaction. Several routes translated that database failure into “Account
   unavailable” or “Profile not found” even though the account existed.
2. Production did not contain `public.grammar_guide_progress`, despite the table
   and ownership policies being present in the repository baseline. Its absence
   caused the grammar completion warning. The historical reason for this schema
   drift has not been established.
3. The notification SELECT policy called the same mutating entitlement path.
   Notification audience checks now read personal access and unexpired active
   institution seats without reconciliation. Writable access RPCs continue to
   reconcile waiting and expired seats.

## Repair

- Added a VOLATILE, service-only profile RPC. All seventeen Edge queries now use
  POST with the same field projections and verified bearer-token identity.
  Institution reconciliation, personal/institution priority, and quotas remain
  enforced.
- Restored the guide progress table, composite primary key, index, grants, and
  SELECT/INSERT/UPDATE/DELETE ownership policies. No completions were fabricated.
- Made notification audience lookup STABLE and read-only, retaining effective
  active institution access and paid-access expiry checks.
- Applied three scoped migrations transactionally in the linked production
  database, recording each exact migration in schema history. A normal dry-run
  was blocked by unrelated remote migration versions missing locally; those
  history entries were preserved.
- Deployed all twelve changed Edge Functions. Their deployed versions increased
  and remained ACTIVE; JWT settings were preserved.

## Evidence

- Each of the seventeen original Supabase client profile projections returned
  HTTP 200 through the new RPC.
- Linked rollback regression checked service-only execution, profile identity,
  entitlement agreement (including notification tiers), and guide CRUD ownership isolation. All test data and
  reconciliation side effects in this regression were rolled back.
- An authenticated notification query and its audience-tier function succeeded
  inside an explicit read-only transaction.
- Signed-in Safari: AI Coach loaded saved conversations; Grammar loaded without
  the warning and exposed “Mark guide complete”; Learning Path “Check for updates”
  completed and returned to “Saved plan”; Reading returned a Bengali translation
  of the selected passage sentence.
- Guide completion writes were verified through rollback SQL rather than marking
  a real learner's guide complete. The existing Coach draft and exam answers were
  preserved. The live translation used the normal quota accounting.
- Full unit suite, TypeScript, lint, and production build passed. These checks
  establish the shared account gate repair; they do not claim every possible AI
  response, device, or provider failure was exercised.

The earlier Practice Lab catalogue volatility repair remains in place. This
repair addresses additional GET transaction and missing-schema failures that
became visible after that catalogue repair.

## Wider institution and Admin Health audit

- Scanned 260 live public/private function definitions and followed named SQL
  function dependencies. No remaining STABLE function path reached the mutating
  institution profile/reconciliation path. This is a source dependency audit,
  not a claim that every dynamic SQL path or browser journey was exercised.
- A rollback audit ran 26 successful access/status checks across four existing
  account classes: institution access, objective quotas, Grammar dashboard, AI
  Coach status, Feature Requests, Practice Lab dashboard, and Reading assistant
  status where a suitable Reading session existed. No quota was reserved.
- An institution integration regression proved active institution Premium
  access for a personal Free learner, personal access priority while a seat
  waits, seat activation after personal expiry, notification tier agreement,
  and grammar entitlement. Personal subscription fields were not overwritten
  by reconciliation; all fixture seats/orders and the expiry change rolled back.
- Found and fixed one additional transport mismatch: learner Feature Requests
  still opted into GET even though `feature_request_page` now reconciles seats.
  It now uses POST; the independent admin board remains a read-only request.
- Admin Health previously inspected profile row existence and provider/operation
  ledgers. Account lookup failures happened before those ledgers recorded an
  operation, and no check covered the missing guide table. Added 19 read-only
  schema/function/permission checks under “Learner Access & Schema”. A rollback
  missing-table simulation correctly changed that service to Down. These checks
  explicitly do not claim to exercise browser journeys or AI responses.
- Health refreshes for the same window now coalesce while a request is in flight;
  window changes still supersede stale results. Existing parallel reads,
  visible-document polling every 60 seconds, and capped incidents remain.
  Healthy header copy now states that no failures were **recorded by these
  checks**, rather than implying all user journeys were checked.

### Measured Health database time before the new contract checks

| Window                | Main health | Provider health | Incidents |
| --------------------- | ----------: | --------------: | --------: |
| 24 hours (first call) |  1,341.9 ms |          6.8 ms |   25.5 ms |
| 7 days                |    313.1 ms |          7.1 ms |   18.9 ms |
| 30 days               |    514.9 ms |         20.7 ms |   33.5 ms |

Single linked database measurements exclude network and rendering time; the
first and warm measurements are not a controlled performance comparison.
Health is partially optimized, not established as fully optimized at scale.

The 24-hour window contained no recorded service failures. Longer windows still
contain historical speech/scoring failures and recovered provider fallbacks.
Sentry still has ten unresolved groups, last seen no later than 1 October, with
browser/network attribution and physical-device validation gaps documented in
`sentry-audit-2026-10-03.md`. These are not evidence that every feature is currently
broken, and their absence from the 24-hour Health window does not prove resolution.

Commit `75e6a569` passed all GitHub quality gates and reached Vercel production.
One local full-suite rerun hit a five-second Grammar UI test timeout; that file
passed its focused rerun, and all 359 files passed in GitHub CI. The follow-up
Health/Feature Requests changes passed 25 focused tests, TypeScript, and lint.
