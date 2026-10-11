# Release verification — 11 October 2026

The Cloudflare migration was verified in staging before the explicitly authorized
main-domain cutover. This document records evidence boundaries; local raw reports
and rollback snapshots are intentionally excluded from Git.

## Automated checks

- 2,969 frontend/unit tests across 382 files pass with Vitest 5.0.3.
- Thirteen Cloudflare route/profile/origin/cache/release policy tests pass.
- Actual workerd fixtures verify twelve CAPI/boundary cases, eight GA/GTM cases,
  anonymous cache hits, credential bypass and private API cache policy. Providers
  are mocked in these fixtures; no synthetic purchase reaches live measurement.
- Cloudflare TypeScript checking and production build pass.
- npm production dependency audit: zero advisories. Full development audit:
  17 findings (12 high, 5 moderate, zero critical). Critical Vitest/tinypool and
  newly introduced Wrangler/sharp findings were resolved. Remaining findings are
  development tooling; this is not a claim that every dependency is risk-free.

## Live checks from this migration

- Main-domain Google sign-in, persisted auth and authenticated learner screens.
- Supabase backend CORS/JWT checks; real Writing, Coach, Practice Lab and Teacher
  responses; Reading/Listening scoring and stored QA sessions; R2 upload/read/delete.
- Speaking recording/transcription/coaching/TTS and fixed pause/resume clock.
- Meta Test Events receipt marked Processed / Server; GTM, GA4, Pixel, PostHog
  and Clarity network requests accepted. Sentry public configuration matches the
  original deployment; live exception ingestion was not deliberately triggered.
- Stripe test-mode signed webhook fixtures and isolated database entitlement
  transitions passed. Main production keys remain live and were not swapped.
- Earlier full crawl: 196 routes, 552 references and 24 redirects with zero
  confirmed internal broken links. Eight distinct outdated external URLs were
  repaired in published Supabase content. Sixteen third-party URLs remained
  inconclusive due to blocking/timeouts; they are not certified healthy.

The final live-check script covers two DNS resolvers, TLS 1.2 and 1.3, HTTPS/apex
redirects, static CDN HIT and ETag 304, public sitemap caching, Authorization/Cookie
bypass, private geo/error responses, CAPI rejection paths, GTM loading, hidden-file
404 responses and every sitemap page. It sends no conversion or payment event.
All final checks passed against production version
`992bab92-9e53-40d6-87ed-2bf7b64b119e` at 100% traffic, including 93 sitemap pages.
Provider readback confirmed both fail-open routes, the preserved Meta secret,
disabled production workers.dev/previews, TLS 1.2 and the enabled free WAF ruleset.

## Remaining human/provider checks

A complete three-part recorded Speaking exam and final pronunciation/scoring,
paired Listening across two real-time browser participants, a browser-based Stripe
checkout completion/return with purchase attribution, and Nagad paid completion
were not verified end to end. Password changes require the account owner's action.
No real charge or fabricated live Purchase event was performed.

The earlier Supabase organization warning concerns previous-cycle egress; current
cycle usage was about 61% of the Free allowance. Keep its grace-period deadline
and Worker Free-plan CPU/request limits under review. A clean functional audit is
not a production load test or a comprehensive penetration test.

## Git release and firewall completion

On 11 October, Cloudflare Workers Builds connected the existing authorized
`rayan-rizon/ielts-ai-pro` repository, branch `main`, with previews disabled.
The remote build of commit `b5694a8b` succeeded and promoted version
`5c52ac13-daea-4507-919f-046e41523087` to 100% traffic. GitHub CI passed lint,
frontend types/unit tests, Cloudflare policy/workerd tests, Cloudflare types and build.
Provider readback confirmed the preserved encrypted Meta secret, the 20/60 native
rate-limit binding, disabled workers.dev/previews and both unchanged fail-open routes.
The production live-check passed DNS, TLS, redirects, CDN HIT/304, credential cache
bypass, API validation and all 93 sitemap pages. Invalid CAPI probes reached 429
with Retry-After 60 and private/no-store; no test conversion was forwarded to Meta.

The temporary `ielts-ai-cloudflare-staging` Worker had no routes or persistent
bindings and was deleted with force=false after preserving recreation metadata.
Account readback now lists only one IELTS Worker. Vercel remains the fallback origin.

The Vercel firewall audit found one custom POST-prefix/IP rule at 20/minute.
Cloudflare dashboard now shows active zone rule `b8b579f439934b45b2209e909dc10c19`,
matching only the two production hosts and POST `/api/meta-capi` prefix: 20/10 seconds,
Block for 10 seconds. This Free-plan burst rule complements the Worker minute limit.
Cloudflare native counters are local/eventually consistent, not exact global quotas.

A historical Listening attempt has question-ID drift: its stored card score and
recomputed result differ without a stored question snapshot. This application issue
is still unresolved and is separate from the hosting migration. The end-to-end
Speaking grading and browser paid checkout limitations above still apply.
