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
