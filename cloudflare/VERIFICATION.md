# Release verification — 11 October 2026

The Cloudflare migration was verified in staging before the explicitly authorized
main-domain cutover. This document records evidence boundaries; local raw reports
and rollback snapshots are intentionally excluded from Git.

## Automated checks

- 2,969 frontend/unit tests across 382 files pass with Vitest 5.0.3.
- Eleven Cloudflare route/profile/origin/cache policy tests pass.
- Actual workerd fixtures verify eleven CAPI/boundary cases, eight GA/GTM cases,
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
