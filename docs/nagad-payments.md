# Nagad Online Payment

Bangladesh learners can pay with Nagad and get their plan the moment Nagad
confirms, with no TrxID for an admin to check. bKash stays on the manual flow.

## How a payment flows

1. **Pricing → payment modal → Nagad tile.** `nagad-checkout` prices the plan
   from the BD row of `pricing_tiers` (same `computePlanCharge` as the card and
   Stripe), refuses a stale price, records a `nagad_payments` row, opens a
   Nagad session (Initialize + Complete) and returns Nagad's payment page.
2. **Learner pays on Nagad** (number → OTP → PIN).
3. **Nagad redirects the browser** to `nagad-callback`. The query string is
   unsigned, so it only identifies the order. The function calls Nagad's
   verify API server to server and records the result, then redirects to
   `/payment/nagad?order=…`.
4. **Result page** polls `nagad-payment-status`, which re-verifies open orders.
5. **`nagad-reconcile`** (pg_cron, every 10 minutes) verifies orders nobody
   came back for, and expires them after 2 hours.

A verified Success for the exact amount runs `service_finalize_nagad_payment`,
which inserts an approved `payment_requests` row (`payment_method = 'nagad'`).
The existing triggers then grant access, write `billing_history`, credit the
marketing campaign and record the customer payment fact, exactly as for an
admin-approved bKash payment. Admin payment history, refunds and revenue all
see Nagad without further changes.

Order states: `initiated → pending → paid | failed | expired`, plus `review`
when Nagad reports Success but the amount or order does not match ours. Review
orders grant nothing; check them in `nagad_payments.failure_reason` and resolve
them by hand.

## Things the integration guide gets wrong

Confirmed against the sandbox:

- Signatures are **SHA256withRSA**, not SHA1withRSA (SHA-1 fails with
  `16_0006_058`).
- `dateTime` must be **Bangladesh time** (UTC+6), or Nagad answers `16_0006_076`.
- The Initialize response calls the challenge `challenge`, not `random`.

## Secrets

Edge Function secrets (`supabase secrets set …`):

| Secret                       | Value                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| `NAGAD_BASE_URL`             | Sandbox `http://sandbox.mynagad.com:30001`; live URL from Nagad after UAT |
| `NAGAD_MERCHANT_ID`          | 15-digit merchant id                                                      |
| `NAGAD_MERCHANT_PRIVATE_KEY` | Our RSA private key (base64 body or PEM)                                  |
| `NAGAD_PG_PUBLIC_KEY`        | Nagad's public key                                                        |
| `NAGAD_RECONCILE_SECRET`     | Random string; the same value goes in Vault as `nagad_reconcile_secret`   |

The reconcile cron job does nothing until the Vault secret exists:

```sql
select vault.create_secret('<same value as NAGAD_RECONCILE_SECRET>', 'nagad_reconcile_secret');
```

## Who can pay with Nagad

Admin → Payments → **Nagad online payments** has an _Available to_ switch
(`off` / `admins` / `everyone`), stored in `system_settings.nagad_payments`.
The payment modal asks `GET nagad-checkout` whether to show the option, and
`POST nagad-checkout` enforces the same rule, so they cannot disagree. No site
redeploy is needed to change it.

Sandbox credentials (`NAGAD_ENVIRONMENT`, or a sandbox `NAGAD_BASE_URL`) are
admin-only whatever the switch says. Sandbox orders are stamped
`environment = 'sandbox'`: a verified sandbox payment is recorded as paid but
grants no plan, writes no payment request or billing row, and stays out of
the checkout-intent funnel, so admins can test without changing their own plan
or adding fake revenue. The result page shows it as a test payment.

The same panel lists every Nagad checkout (open, review, failed, paid) with
Nagad's status code and a **Re-verify** button for open orders.

The sandbox keys and the NDA-confidential guide live in `Nagad/`, which is
gitignored. For live, Nagad's guide has us generate our own key pair and upload
the public key in the merchant portal. The private key goes only into secrets.

## Running it locally

```bash
LOCAL_EDGE_FUNCTIONS=nagad-checkout,nagad-callback,nagad-payment-status,nagad-reconcile \
NAGAD_CALLBACK_URL=http://127.0.0.1:8787/functions/v1/nagad-callback \
FRONTEND_URL=http://localhost:5173 npm run edge:local
```

Then run `npm run dev` with `LOCAL_EDGE_FUNCTIONS_URL=http://127.0.0.1:8787`,
and the same `LOCAL_EDGE_FUNCTIONS` list. Sign in as an admin to see Nagad.
The local functions use the hosted database, so test with a throwaway account.

Tests:

```bash
deno test --allow-env --allow-net --allow-read --env-file=supabase/functions/.env supabase/functions/_shared/nagad.test.ts
npx vitest run src/__tests__/features/nagad-payment.test.jsx
```

The Deno suite includes a real sandbox round trip when the `NAGAD_*` sandbox
secrets are present. A completed sandbox payment needs a test wallet that Nagad
registers on request.

## Go-live checklist

1. Complete a sandbox payment as an admin (sandbox wallet 01776662444 is
   registered). The order should end `paid` with the sandbox pill. A first
   attempt on 2026-10-08 ended `Failed` with code `50_0026_851`, which is not in
   the guide (likely a wrong PIN or OTP, or no test balance).
2. Ask Nagad whether live requires whitelisting a server IP. Supabase Edge
   Functions have no fixed outbound IP; if Nagad insists, calls need to go
   through a fixed-IP proxy.
3. UAT session with Nagad, then live credentials: live base URL, live
   merchant id, our own key pair (upload the public key in the portal).
4. Set the live secrets (`NAGAD_BASE_URL`, merchant id, keys; optionally
   `NAGAD_ENVIRONMENT=live`), redeploy the four `nagad-*` functions, test once as
   an admin with a real wallet, then switch _Available to_ → `everyone`.
5. Refunds: there is no refund API. Refund in the Nagad merchant portal, then
   record it in the admin refund ledger as for bKash.
