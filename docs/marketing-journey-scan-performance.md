# Marketing journey scan investigation — 2026-10-30

The active `quarter-hour-marketing-journeys` cron runs at minutes 7, 22, 37 and 52. It invokes `marketing-campaign-dispatch` with `process_journeys: true`.
The handler verifies the scheduler token, scans active journeys sequentially,
and then checks due scheduled campaigns. HTTP 200 alone does not prove every
journey succeeded: the response can contain individual journey errors.

## Production evidence (read-only)

The unified logs' rolling 24-hour window at investigation time contained 96
invocations, averaging 18,083.7 ms (15,228–32,768 ms). This is a different window
from the reported 76 runs / 16.7 seconds. Runtime logs contained boot/listen/
shutdown events but no phase timings; sampled boot times were tens of
milliseconds. An exact historical phase breakdown is unavailable.

The 24 retained journey responses in `net._http_response` covered
2026-10-29 17:52–23:37 UTC. All had HTTP 200, success true, no journey errors,
and zero accepted deliveries. A recent response scanned first-practice 49,
referral-expiry 0, signup 141 and low-quota 117 audience members; all were
skipped. An empty segment is therefore not the only idle case.

Read-only replay of the existing segment/profile/preference/history reads,
using the production API from the developer machine, produced:

| Journey         | Audience | Segment ms | Profiles ms / requests | Preferences ms / requests | History ms / requests / rows |
| --------------- | -------: | ---------: | ---------------------: | ------------------------: | ---------------------------: |
| First-practice  |       49 |        683 |                739 / 2 |                   402 / 1 |            2,724 / 4 / 1,229 |
| Referral expiry |        0 |        349 |                  0 / 0 |                     0 / 0 |                    0 / 0 / 0 |
| Signup          |      141 |        339 |              1,243 / 4 |                   601 / 2 |              1,362 / 4 / 398 |
| Low quota       |      117 |        413 |              1,185 / 4 |                   981 / 3 |         50,203 / 83 / 39,976 |

These are single developer-machine samples, including network time, **not**
production Edge phase timings or a before/after production benchmark. No
campaign dispatch, reservation, offer provisioning or email send was invoked.

The largest demonstrated cost is repeated paginated history transfer, especially
low-quota. The reader batches 100 user IDs, reads 500-row pages, and probes for
an empty page to establish completion. Production had 42,218 total deliveries,
of which 41,411 were skipped. Rows cannot simply be removed or history cut off:
current campaign frequency caps, maximum attempt numbers, previous skip reasons,
and cross-campaign cooldown/contact/promotion caps depend on this history.
Cumulative `pg_stat_statements` also ranked the delivery-history read above the
segment RPC in total execution time; those statistics are not a 24-hour sample
and cannot apportion the Edge request's wall time.

## Implemented optimizations

### Compact history in Postgres

`marketing_dispatch_history(uuid, uuid[])` returns the exact history information
consumed by the existing dispatcher, without transporting thousands of redundant
skips. It retains:

- Every successful contact (`accepted`, `delivered`, `viewed`, `clicked`) across
  all campaigns and all dates, preserving cooldowns and contact/promotion caps.
- Every current-campaign row other than `skipped`/`failed`, preserving the exact
  lifetime frequency-cap count, including `processing` reservations.
- The current campaign's highest attempt row per learner/channel, including
  failed attempts, preserving next-attempt allocation.
- One current-campaign skipped row per learner/channel/reason, including null
  reasons, preserving skip deduplication.

The dispatcher still evaluates the original eligibility predicates against those
rows. The RPC uses `SECURITY INVOKER`, an empty search path, and grants execution
only to `service_role`; learner and anonymous roles cannot call it. No delivery
records are modified or deleted. Existing indexes cover learner and campaign
lookups; no new index was needed.

The client batches at most 100 distinct learner IDs and pages every RPC result
in stable ID order, continuing until an empty page. This remains correct if the
server row cap is lower than the requested 500 rows. A failed page aborts the
dispatch instead of treating an incomplete history as empty. Deploy the migration
before the Edge function; there is deliberately no fail-open fallback when the
RPC is unavailable.

Read-only comparisons on the live database, running the exact migration query
body without creating the function or dispatching messages, showed:

| Journey         | Original history rows | Compact rows | Changed attempt/cap/skip summaries | Missing successful contacts |
| --------------- | --------------------: | -----------: | ---------------------------------: | --------------------------: |
| First-practice  |                 1,229 |          204 |                                  0 |                           0 |
| Referral expiry |                     0 |            0 |                                  0 |                           0 |
| Signup          |                   398 |          376 |                                  0 |                           0 |
| Low quota       |                39,976 |          573 |                                  0 |                           0 |

Low-quota history payload drops approximately 98.6%. The new query body plus its
segment lookup took 254.6 ms in one database-side `EXPLAIN ANALYZE` sample. This
is not an Edge end-to-end benchmark; actual savings need post-deployment phase
logs. The query still reads historical records inside Postgres, but returns only
the compact result instead of transferring each raw row over many requests.

### Lazy profiles and phase timing

Defer the `users` profile read (`username`, `promo_discount`, `used_promo_codes`)
until a member passes all existing channel, delay, consent, preference and
history gates. These fields are only used later for offer conflict checks and
email rendering. Share a promise within one campaign dispatch so concurrent
workers perform the read once, and perform it before reserving a send so a
profile-read failure cannot leave a new processing reservation.

For the demonstrated all-skipped audience this eliminates 10 profile HTTP
requests, about 3,167 ms in the developer-machine sample. This is conditional on
no member reaching the profile stage; zero accepted alone does not guarantee
that (later offer checks or sends can fail). Eligible dispatches still load the
same full profile data.

No eligibility predicates, consent rules, contact windows, caps, skip reasons,
reservations, campaign activation updates, cron frequency, or pagination
completeness rules changed. Preferences/history remain fresh every dispatch.
There is no cache between invocations, so a new signup, changed preference or
expired cooldown can become eligible on the next scan.

One `[marketing-dispatch-timing]` log per campaign includes campaign/journey
IDs, phase durations and total duration, also on errors/early returns. Fields:
`campaign_ms`, `segment_ms`, `preferences_ms`, `history_ms`, `profiles_ms` (only
when used), `processing_ms`, `activation_ms`, `total_ms`. `profiles_ms` is nested
inside `processing_ms`; do not add the two together. IDs and durations are
logged, not learner identities, addresses or profile content. Phases not reached
are omitted. Total excludes handler authorization and journey/scheduled listings.

## Verification and deployment status

31 focused tests pass under the repository's Node 24 runtime, including the real
dispatch algorithm with external I/O replaced, RPC request construction,
pagination beyond a lower server cap, bounded/deduplicated learner batches, empty
audiences and failure on a later history page. Existing reservation/pagination
and marketing service tests also pass.

`supabase/tests/marketing_dispatch_history.sql` runs the actual migration in an
empty disposable PostgreSQL database, checks permissions and history invariants,
and rolls everything back. Its 40,011 audience rows compacted to 11 while keeping
attempt maxima, exact cap counts, skip-reason sets and every successful contact.
It includes separate channels, old contacts, processing rows, a highest failed
attempt, null skip reasons and an unrelated learner. Run it with:

```sh
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/marketing_dispatch_history.sql
```

Formatting and `git diff --check` pass. Deno type checking also passes using the
repository local-edge import map (`deno check --node-modules-dir=none
--import-map=scripts/local-edge/import_map.json
supabase/functions/marketing-campaign-dispatch/index.ts`). That map resolves
the Supabase client to its local development npm version. The repository ESLint
configuration ignores these TypeScript paths and provides no lint coverage.

Deployed on 2026-10-30 at approximately 06:16 Asia/Dhaka (00:16 UTC):

- Applied `20261030001610_compact_marketing_dispatch_history.sql` before deploying
  the Edge function. Local migration filename and SQL test reference were aligned
  with the version actually recorded in `supabase_migrations.schema_migrations`.
- Deployed `marketing-campaign-dispatch` version 31, ACTIVE, preserving its
  existing `verify_jwt: false` and in-handler scheduler/admin authentication.
- Retrieved the live bundle and confirmed all eight returned source/import-map
  files exactly match the deployment payload. Preserved the live
  `originValidation.ts` dependency rather than shipping an unrelated local change.
  Supabase's retrieval does not return the uploaded compiler-only `deno.json`.
- Triggered one normal scheduler-authenticated request using the same Vault
  secrets and body as the existing cron. `net._http_response` request 10420
  returned HTTP 200, success true, no timeouts, no journey errors, zero failed
  deliveries, zero accepted and 307 skipped (49 first-practice, 141 signup,
  117 low-quota; referral audience zero). No marketing messages were sent.
- An unauthenticated POST returned HTTP 403.
- Rechecked the actual deployed RPC as `service_role` against full raw production
  history for all four journey audiences: zero changed attempt/cap/skip summaries
  and zero missing successful contacts. Compact row counts remain those above.
- Confirmed invoker security, stable volatility, empty search path, no execute
  privilege for anon/authenticated and execute privilege for service_role.
  Security advisor finding counts were unchanged from before deployment.
- Reran all 31 focused tests immediately before deployment and reran the
  standalone PostgreSQL regression after aligning the migration filename.

The verification invocation (execution
`b781c426-a019-40e3-9af9-8c5cd7a45771`, version 31) took **7,630 ms** end to end
according to Edge logs. That is about 58% below the earlier 18,084 ms rolling
24-hour average, but this is one manual scheduler-flow invocation, not a new
production average or proof about future eligible-send latency. The unchanged
quarter-hour cron remains active at minutes 7, 22, 37 and 52; its next automatic
run was not needed to trigger this verification.

Live phase timings from that invocation:

| Journey         | Campaign ms | Segment ms | Preferences ms | History ms | Processing ms | Activation ms | Total ms |
| --------------- | ----------: | ---------: | -------------: | ---------: | ------------: | ------------: | -------: |
| First-practice  |          91 |        541 |            219 |        337 |             5 |            50 |    1,243 |
| Referral expiry |         119 |         86 |              0 |          0 |             0 |            37 |      241 |
| Signup          |          36 |         63 |             77 |        416 |            13 |            37 |      646 |
| Low quota       |          23 |        213 |             99 |      4,487 |             8 |            30 |    4,865 |

No profile phase was executed in this all-skipped run. Low-quota history remains
the largest phase, so subsequent scheduled-run timings should inform any further
work. The normal eligible-send path is covered by regression tests; this live
idle scan did not exercise actual email delivery.
