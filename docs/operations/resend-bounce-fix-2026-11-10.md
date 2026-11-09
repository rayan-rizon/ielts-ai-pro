# Resend bounce remediation — 10 November 2026 (Asia/Dhaka)

## Root cause and behavior

The marketing webhook changed accepted deliveries to `failed`; dispatch history then excluded them from contact and campaign caps. This allowed the same welcome/offer to be sent again after an asynchronous bounce.

- Provider-accepted sends now remain counted in dispatch history, including bounced deliveries. The stored delivery still retains its actual failure status.
- Address-scoped feedback blocks marketing for 7 days after one bounce, or 30 days after repeated bounces within 30 days. Permanent failures, invalid-domain SMTP replies, complaints and suppressions block marketing indefinitely for that address.
- Database health lookup errors prevent marketing dispatch. Transactional messages do not use this marketing cooldown.
- Signed webhook feedback is recorded even when no marketing delivery exists (e.g. authentication email). Provider-message deduplication makes replay safe.
- Known domain typos are rejected during signup with a correction suggestion. Existing sign-in validation is preserved.

## Deployment

- Migration: `20261109202840_marketing_bounce_protection.sql`, applied to `zvrmvycajimjxghrnpgy`.
- `marketing-campaign-dispatch`: active version 37.
- `resend-marketing-webhook`: active version 14; verifies Svix signatures in the handler.
- Cloudflare production: `8133797e-e6ec-480a-9fba-d72cf3930557`, verified at 100% traffic.

## Verification

- 71 focused Vitest tests passed, including actual dispatch boundary tests proving blocked recipients and database errors never reach provider dispatch.
- Production SQL assertions passed for 7/30-day cooldowns, expiry, permanent blocks, healthy addresses, replay deduplication and private permissions; test fixtures rolled back.
- Existing feedback backfill covered 9 addresses. All 10 affected campaign/member combinations now count accepted sends against caps.
- Replayed one real invalid-domain bounce twice through Resend: exactly one health row persisted, marked permanently blocked, with SMTP diagnostics.
- Unsigned production webhook request returned HTTP 400.
- Live Chrome signup form displayed the `gmail.com` suggestion for `gmail.come`, prevented the signup API request, and accepted the corrected domain in form validation. No test email was sent.
- Production frontend build passed; CodeScene safeguard passed. New health helper score: 10.0.
- Deno checked the standalone health/address helpers successfully. Full Edge Function type checking stalled fetching external dependencies and was stopped; remote deployment and live webhook checks succeeded.
- Public DNS: DKIM/SPF verified by Resend; DMARC exists. `links` points to Resend tracking; `mail` points to Forge sending and must not be replaced to clear an obsolete tracking warning.

The historical bounce rate will not reset immediately. Compare new sending cohorts after rollout; existing provider retry queues may still emit delayed bounce events. This rollout verifies prevention and handling, not a future numerical bounce-rate guarantee.
