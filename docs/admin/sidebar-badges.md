# Admin sidebar badges

The sidebar owns one authenticated request stream for Payments, Feature Requests,
Test Reports, and Institutions. `get_admin_sidebar_badges` returns counts only;
it does not expose request bodies, institution contact details, or payment records.

## Badge meaning

| Category         | Count                                                                                               | Dismissal                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Payments         | New pending payments, approved Stripe payments, and Stripe failures after this admin's saved marker | Opening Payments acknowledges a freshly fetched server snapshot |
| Feature Requests | `pending`                                                                                           | Reviewing/changing the request status removes it                |
| Test Reports     | `open` or `reviewing`                                                                               | Resolving/dismissing the report removes it                      |
| Institutions     | Pending institution applications                                                                    | Approving/declining the application removes it                  |

Counts are capped at 100 per source and the UI displays `99+`. Full management
pages retain their existing exact totals and pagination. Collapsed navigation
shows an alert dot, with the count available in the tooltip and accessible label.

## Request and database behavior

- One RPC every 60 seconds after the preceding request completes, per mounted,
  visible, online admin sidebar; no learner listeners or badge requests.
- Visibility/online restoration refreshes immediately. Focus refreshes if the last
  successful response is at least 15 seconds old.
- One request may run at a time. Requests time out after 15 seconds and abort on
  unmount/account changes. Errors preserve the last valid counts, mark accessible
  labels as stale, and back off to a maximum of five minutes.
- Entering Payments makes a fresh read followed by one acknowledgment RPC. The
  acknowledgment uses the server's observed timestamp, never the device clock.
  It can only advance the caller's marker; repeated/older acknowledgments do not
  write. Payments newer than that snapshot remain unread. Staying on Payments
  does not cause periodic acknowledgment writes.
- Existing payment markers and legacy RPCs remain compatible with older clients.
  A new admin's marker is initialized once to avoid historical payment alerts.
- The three new queue badges require no read-marker rows or acknowledgment writes.
- One browser tab makes approximately 60 routine requests/hour for all categories,
  compared with 240/hour for the previous payment hook alone (75% fewer). Opening
  Payments, returning to the tab, and network recovery can add refresh requests.
  Multiple open admin tabs each own a stream; there is no cross-tab leader election.

Partial indexes support pending payments, approved Stripe payments, and non-null
payment failure timestamps. Existing status/date queue indexes support the other
categories. Each subquery stops after 100 qualifying records, avoiding exact
counts over the entire backlog. There are no write triggers or extra realtime
subscriptions on business tables. Healthy visible tabs see new work on the next
poll, generally within one minute.

The RPC uses `SECURITY DEFINER` because underlying queues intentionally lack
browser table grants. It fixes `search_path=''`, qualifies all relations, checks
`auth.uid()` and the existing MFA-aware `public.is_admin()` on every call, and
revokes execution from `PUBLIC`/`anon`. Only the caller's marker can change.
Supabase's generic authenticated-definer advisor flags this intentionally
callable API; authenticated execution does not bypass its internal admin check.

## Verification (4 October 2026)

- 55 focused unit/UI regression tests passed across sidebar/controller, payment
  history, feature requests, issue reporting, and institution entry.
- Isolated PostgreSQL lifecycle checks passed: all queue states, caps, fresh-admin
  baseline, timestamp validation, monotonic/idempotent acknowledgments, read-only
  polling, later-payment preservation, and anonymous/learner rejection.
- Linked database checks passed with actual admin/learner/anonymous roles and the
  production authorization function, inside a rolled-back transaction.
- Live failure-count plan uses `users_payment_failure_alert_idx` with an index-only
  scan and zero heap fetches (the live snapshot currently has no failures).
- Browser verification used fixture data through the real sidebar/hook/controller:
  four badges, snapshot dismissal, 99+, last-known counts after failure, light/dark
  rendering, and collapsed alert dots. This was not a real payment simulation or
  a signed-in production browser session.
- Production build and focused ESLint checks passed.

Migration `20261003193239_admin_sidebar_badge_summary.sql` was applied to the linked
project. Frontend changes require deployment. No Stripe/webhook, entitlement,
submission/review API, or existing business record changes were part of the patch.

Commands:

```sh
scripts/test-admin-badges-database.sh
npx vitest run src/__tests__/features/admin-sidebar.test.jsx src/__tests__/features/admin-badge-controller.test.js
npm run build
```
