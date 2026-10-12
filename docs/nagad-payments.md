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

## Verification checks (Nagad UAT, 12 Oct 2026)

Nagad passed our sandbox UAT with one requirement: before showing success, check
`merchant`, `paymentRefId`, `amount`, `statusCode` and `status` in the verify
response, and show an error on any mismatch. `verificationMismatch` in
`_shared/nagad.ts` does this on every verify:

| Check                                                 | Success response | Failed / pending response |
| ----------------------------------------------------- | ---------------- | ------------------------- |
| `merchantId` equals `NAGAD_MERCHANT_ID`               | required         | must match if present     |
| `paymentRefId` equals the order's reference           | required         | must match if present     |
| `orderId` equals the order                            | required         | must match if present     |
| `amount` equals the order amount (to the paisa)       | required         | not checked               |
| `statusCode` is a success code (`000` or `00_000_00`) | required         | not checked               |

Any mismatch puts the order in `review` with a reason such as
`amount_mismatch: paid 10, expected 699.00`. No plan is granted and the order is
not closed as failed. The result page shows _We could not confirm this payment_
with the reason in plain words; `nagad-payment-status` returns only the reason's
code (`review_reason`), never the detail. Failed orders show Nagad's code, and
`Aborted`/`Cancelled` read as _Payment cancelled_.

Status codes seen in the sandbox: `000` success, `50_0026_106` wrong PIN or OTP,
`50_0026_851` wallet balance too low, `9999` with status `Aborted` when the
customer clicks Close. `16_0006_077` at Complete is an amount limit on the
merchant (it refused ৳2,248+ for part of 11 Oct, then accepted it again).

**Reconciliation report.** Admin → Payments → Nagad → _Reconciliation CSV_
exports every order in the current environment (live once live keys are
installed) with `order_id`, `payment_ref_id`, `issuer_payment_ref` (Nagad's
TrxID), statuses, amounts and times. It has no customer contact details, so it
can be sent to Nagad as is.

## Go-live checklist

Sandbox UAT passed on 12 Oct 2026 (all five checklist cases, first Success:
`IAPMV3OS8EOA3C0201C1`, TrxID `00061L74`).

1. Log in to the Nagad Merchant Portal
   (`https://auth.mynagad.com:10900/authentication-service-provider-1.0/login`,
   login ID `MC…` from Nagad's SMS/email). If the menus below are missing, ask
   the Key Account Manager to enable online payment.
2. Merchant Management → _Merchant Integration Details_: note the live
   Merchant ID, click _Key Generate_ and download `merchant…pri.pem` and
   `merchant…pub.pem` (every click makes a new pair; use the latest). Download
   the Nagad Gateway Server Public Key from the same page.
3. Merchant Management → _Merchant Integration_: enter the callback URL
   `https://zvrmvycajimjxghrnpgy.supabase.co/functions/v1/nagad-callback`,
   upload `merchant…pub.pem`, add, submit.
4. Email Nagad the callback URL for whitelisting. They also whitelist the
   server IP when the server is outside Bangladesh, which ours is: Nagad calls
   go out from Supabase Edge Functions, which have no fixed outbound IP. Ask
   whether they can whitelist the callback URL alone; if they need an IP,
   route the three Nagad calls through a fixed-IP proxy first. (The frontend
   moved to Cloudflare; it never calls Nagad, so this does not change.)
5. Set the live secrets: `NAGAD_BASE_URL=https://api.mynagad.com` (the code
   adds `/api/dfs/...`), `NAGAD_MERCHANT_ID`, `NAGAD_MERCHANT_PRIVATE_KEY`
   (`…pri.pem`), `NAGAD_PG_PUBLIC_KEY` (gateway key), optionally
   `NAGAD_ENVIRONMENT=live`. Redeploy the four `nagad-*` functions.
6. Pay once as an admin with a real wallet, check the order and TrxID in the
   admin panel, then switch _Available to_ → `everyone`.
7. Refunds: there is no refund API. Refund in the Nagad merchant portal, then
   record it in the admin refund ledger as for bKash.
