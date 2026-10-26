# Cloudflare hosting

Live: **https://www.ieltsai.pro**. The apex redirects to www with path and query preserved.
The production Worker is `ielts-ai-pro`; its workers.dev and version preview URLs
are disabled. The temporary migration Worker was removed after a successful remote Git release
and live verification. Any future staging deployment requires an explicit profile.

Cloudflare serves the frontend, public blog/SEO handlers, geo API and first-party
Meta CAPI relay. Auth, AI, billing webhooks and database access continue through the
existing Supabase backend. Public `VITE_` settings are embedded at build time;
server credentials remain in Supabase or Worker secrets.

## Local commands

Use Node 24 and `npm ci` from the repository root. Wrangler is pinned in the root
lockfile; no global CLI or machine-specific paths are required.

```sh
npm --prefix cloudflare test
npm --prefix cloudflare run typecheck
node cloudflare/build.mjs --profile=production
node cloudflare/release.mjs --upload
# Review the uploaded version ID, then promote that exact version:
node cloudflare/release.mjs --deploy=<version-uuid>
node cloudflare/live-check.mjs
```

## Git deployments

Workers Builds connects `rayan-rizon/ielts-ai-pro`, production branch `main`, root `/`.
Build command: `npm run cf:build`. Deploy command: `npm run cf:deploy`.
Preview builds are disabled. Public `VITE_` values and `NODE_VERSION=24` belong in
Build variables, not merely runtime variables. `META_CAPI_ACCESS_TOKEN` stays only
in the deployed Worker's secret store and is preserved across versions.

`cf:build` runs Cloudflare policy tests, actual workerd tracking/cache/rate-limit
fixtures, types and the production frontend/SEO build. `cf:deploy` verifies the
existing Worker identity, both enabled custom domains and disabled preview URLs;
uploads a version; reads the exact version ID from Wrangler structured output;
promotes only that version; and confirms it serves 100% traffic. It never rewrites
routes or DNS. An error fails the build instead of promoting an arbitrary version.
The existing GitHub CI also checks Cloudflare policy and types.

For a deliberately recreated isolated staging environment, run
`node cloudflare/build.mjs --profile=staging`, then
`node cloudflare/deploy.mjs --profile=staging`.
The candidate deployment command refuses to deploy a production Worker with live routes.
The production release command uses version operations, requires both production
custom domains and disabled preview URLs, preserves secrets, and requires the
`META_CAPI_ACCESS_TOKEN` secret. It does not edit DNS or Worker routes.

Production builds validate all public settings listed in `profile.mjs`, including
live Stripe publishable mode, real public Sentry DSN and the GA4 server-purchase flag.
Provide public values through normal local env files or the optional ignored
`.generated/build-public.env`. Never add service-role keys or provider secrets to
`VITE_` variables. `.dev.vars` contains only public Supabase runtime bindings.
Types, generated configuration, build output and raw verification reports are ignored.

## Security and caching

`cloudflare/routes.json` owns redirects, rewrites, security headers and cache rules.
The Worker build, local preview, SEO checks and routing tests all use this file.
Vercel Analytics, Speed Insights and their CSP permissions have been removed.
Sentry and product measurement run only on the production custom domains.

The existing CSP and Permissions Policy are preserved. Meta Open Bridge endpoints
remain blocked as documented in `../docs/meta-conversions-api.md`.

The Vercel firewall audit found one active custom rule: POST paths starting with
`/api/meta-capi`, 20 requests per 60 seconds per IP, with HTTP 429. The Cloudflare
Worker preserves its path/method/IP scope through `META_CAPI_RATE_LIMITER`, using
only `CF-Connecting-IP`; caller-supplied forwarding headers cannot reset the limit.
Rejected requests have `Retry-After: 60` and private/no-store. GET, other APIs and
staging measurement are unaffected. A missing/failing binding fails closed.
Cloudflare's native counters are local to a data center and eventually consistent;
they are abuse protection, not an exact global accounting quota. See
[Cloudflare's rate-limit semantics](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
The domain firewall also has an active `Meta CAPI POST burst protection` rule,
created through the Cloudflare dashboard: the same two hosts, POST and path prefix,
20 requests per 10 seconds per IP/data center, Block for 10 seconds. The Free-plan
dashboard only offers a 10-second period/duration, so this supplements rather than
replaces the Worker minute limit. Rule ID: `b8b579f439934b45b2209e909dc10c19`.
These zone settings persist independently of Git Worker deployments.
The retired Vercel firewall had Bot Protection in log-only mode, AI Bots allowed
and OWASP disabled; those were not blocking protections to copy into broad bot
challenges on Cloudflare.

Public blog, feed, sitemap and llms responses use a five-minute edge freshness window
and stale-while-revalidate. The Worker caches only anonymous GET requests whose
successful responses explicitly allow public caching. Authorization, Cookie,
Set-Cookie, private/no-store/no-cache and unkeyed Vary responses bypass storage.
Credentialed requests receive private/no-store. Geo and API error responses are not
cached. Fingerprinted frontend assets are immutable for one year; HTML revalidates.
The Workers Cache API is local to each Cloudflare data center.

Zone settings verified on 11 October 2026: Full (strict), forced HTTPS, minimum
TLS 1.2, TLS 1.3, HTTP/2, HTTP/3 and Brotli. Cloudflare Free Managed Ruleset is enabled
with default rules. Speed Brain is disabled because its prefetching does not run on
Worker routes. The existing R2 TTS cache rule is retained; no blanket cache-everything
rule applies to auth or APIs. See [verification boundaries](VERIFICATION.md).

## Routing and rollback

Both `ieltsai.pro` and `www.ieltsai.pro` are enabled Custom Domains on
`ielts-ai-pro`, with previews disabled. Cloudflare manages their Worker DNS records;
the former Vercel CNAMEs and fail-open routes were removed on 20 October 2026.
The Worker is now the origin and has no Vercel fallback. The Free-plan request/CPU
limits still apply; reaching them can interrupt service rather than falling back
to Vercel. No paid plan was enabled by this change.

To roll back Worker code, use `wrangler versions deploy <previous-version>@100%`
with the production release configuration. This preserves the custom domains.
A rollback to another hosting provider requires explicitly recreating that origin
and changing domain routing; deleting a Worker route no longer restores Vercel.
The ignored `verification/vercel-removal-routing-before.json` records the previous
routing configuration for reference.
