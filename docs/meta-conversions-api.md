# Meta Conversions API

How server-side Meta measurement is wired, and one CSP rule that must not be
"fixed".

## Architecture

Conversions are reported twice, on purpose:

| Path          | Code                                                    | Notes                                                                                         |
| ------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Browser Pixel | `fbq('track', …, { eventID })` in `src/lib/tracking.js` | Loaded by GTM. Blocked for a large share of paid traffic (ITP, ad blockers, in-app browsers). |
| Server relay  | `POST /api/meta-capi` → `api/meta-capi.js`              | First-party, same-origin, so ad blockers cannot remove it.                                    |

Both send the **same `event_id`** for the same conversion, so Meta deduplicates
the pair into one event rather than double-counting. Dedup is keyed on
(`event_name`, `event_id`), which is why `Purchase` and its `Subscribe`
companion may safely share one id — different names, separate dedup pairs.

Identity (`em`, `external_id`) is normalised and SHA-256 hashed **in the
browser** before it crosses into the relay, so raw email and account ids never
reach serverless request logs.

Two guards keep dev and preview traffic off the dataset — the host gate in
`index.html` / `tracking.js`, and `MEASURED_HOSTS` in the relay. Both are
required: the browser check alone can be bypassed by a stale build.

### Which events go where

`PIXEL_EVENT_MAP` decides what reaches Meta at all; `CAPI_EVENTS` decides what
is additionally mirrored server-side. These sets are deliberately different.
`ViewContent` (from `writing_checker_signup_gate_viewed`) is **Pixel-only** and
is locked that way by a test in
`src/__tests__/features/meta-attribution-tracking.test.js`. The relay's
`ALLOWED_EVENTS` is a permissive server-side allowlist and is not the source of
truth for what the client actually sends.

## Do not widen the CSP for Meta Open Bridge

The dataset still carries a **Meta Open Bridge (Conversions API Gateway)**
registration, left over from the Stape setup the first-party relay replaced.
It is served inside the Pixel's own config bundle
(`connect.facebook.net/signals/config/991226963227159`):

```json
config.set("991226963227159", "openbridge", {
  "endpoints": [{
    "targetDomain": null,
    "endpoint": "https://8b-…ecs.us-west-2.on.aws/",
    "fallbackDomain": "https://bded8a3c6ae-1-….us-central1.run.app",
    "enrichmentDisabled": true,
    "alwaysRetry": true
  }]
})
```

`fbevents.js` therefore tries to mirror every Pixel event to
`https://<that host>/events?cee=no`, and our `connect-src` blocks it. The
blocked requests show up as console errors and cost a point of Lighthouse Best
Practices. **That is the CSP working, not a bug.**

Allowing them would mean:

- adding `https://*.on.aws` and `https://*.run.app` to `connect-src` — anyone
  can host on `run.app`, so this is a broad exfiltration hole in an otherwise
  tightly enumerated policy, on pages that carry an authenticated session.
  This objection alone is decisive;
- shipping visitor IP, user agent, `_fbp` / `_fbc` and any advanced-matching
  identifiers to third-party infrastructure that is still running but is no
  longer part of this project's architecture, and whose ownership and billing
  status nobody has confirmed;
- adding a third delivery path for conversions the relay already covers. Meta
  should collapse them, since the gateway forwards the Pixel's `eventID` — but
  it also starts routing events the relay deliberately does not send (PageView,
  `ViewContent`) through that host, and `alwaysRetry: true` means failures are
  retried rather than dropped.

There is no coverage to gain here: the relay is same-origin, so it already
survives the ad blockers and in-app browsers the gateway exists to work around.

The same applies to Meta's CAPI param builder
(`capi-automation.s3.us-east-2.amazonaws.com/…/clientParamBuilder.bundle.js`),
blocked by `script-src`. It exists to construct `fbc` / `fbp` on the client —
work `index.html` already does on first paint, before the router strips
`?fbclid=`, with a `localStorage` backup for browsers that reject the cookie.
It is redundant third-party JavaScript.

**The correct fix is to remove the Open Bridge endpoint at source**, in Meta
Events Manager → the dataset → Settings → Conversions API Gateway / Open Bridge
(and clear any custom event endpoint on the GTM Meta Pixel tag, which uses the
`tmSimo-GTM-WebTemplate` template). Once it is gone from the Pixel config the
requests stop being attempted and the console errors disappear on their own.

## Removed with the Stape migration

`https://tag.ieltsai.pro` — the Stape server-side tagging domain — was still
granted in `script-src`, `connect-src` and `frame-src` long after the Vercel
relay replaced it. The subdomain has no DNS record of any kind, so nothing could
load from it; the grants were dead permissions. Removed, along with three other
hosts confirmed unused (no code reference, no reference in any of the 104
`resources` rows, and never requested across full desktop and mobile page
loads):

| Host                                    | Directive              | Why it went                                                                              |
| --------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `https://tag.ieltsai.pro`               | script, connect, frame | Stape tagging domain; no DNS record                                                      |
| `https://static.cloudflareinsights.com` | script                 | Cloudflare Web Analytics; the site is on Vercel                                          |
| `https://*.cloudflare.com`              | img                    | No browser-side Cloudflare URLs (Workers AI is called server-side from an edge function) |
| `https://ssl.google-analytics.com`      | script                 | Universal Analytics endpoint, sunset 2023; GA4 does not use it                           |

Deliberately **kept**: `https://tagmanager.google.com` (GTM Preview/debug mode)
and `https://us-assets.i.posthog.com` (PostHog fetches recorder/survey
extensions from there on demand, so it is absent from a plain landing-page load
without being unused).

## Verifying the relay

`/api/meta-capi` rejects before it ever sends an event, so it can be probed
without writing to the dataset:

```bash
curl -s -X POST https://www.ieltsai.pro/api/meta-capi \
  -H 'Content-Type: application/json' -d '{"event_name":"probe"}' -w '\n%{http_code}\n'
```

`403` (cross-origin rejected) means the function is deployed and
`META_CAPI_ACCESS_TOKEN` is configured. `204` means the token is **missing** —
the relay fails quietly by design so a missing token never surfaces to a user,
which also means it will not announce itself when it breaks. Check this after
any credential rotation.

Set `META_TEST_EVENT_CODE`, or pass `?test_event_code=…`, to route a request
into the Events Manager Test Events tab while validating.
