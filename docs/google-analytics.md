# Google Analytics 4

Property `530246373`, measurement ID `G-GF63SJZ9ZJ`, data stream `14251195462`,
fed exclusively through the GTM web container `GTM-TR6XQ2R3`. No GA code ships
in this repo — `index.html` loads GTM and GTM owns every tag.

## What was broken (audited and repaired 2026-09-07)

For roughly a month the property recorded traffic and attribution correctly and
**nothing else**: no page views, no content reports, no conversions.

| Fault                                                                                                                                                         | Effect                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| The tag named `GA4 - Google Tag` was a **GA4 Event** tag, not a **Google tag**, with the measurement-ID variable `{{GA4 - M - ID}}` in its _Event Name_ field | Every hit sent `en=G-GF63SJZ9ZJ`, so the property's highest-volume event was literally named after the measurement ID                 |
| No Google tag existed for the property                                                                                                                        | No `page_view` at all, no Enhanced Measurement, empty `dt` (page title). _Pages and screens_ was blank                                |
| None of the 14 dataLayer events had a GA4 event tag                                                                                                           | Zero key events. GA4 could not see a signup, a checkout or a purchase                                                                 |
| `accounts.google.com` was not an unwanted referral                                                                                                            | Returning from Google OAuth started a new session credited to Google, overwriting the real acquisition source (63 sessions in 7 days) |
| Event data retention was the 2-month default                                                                                                                  | Every exploration silently capped at 2 months                                                                                         |

## How it is wired now

Container version 15. Four measurement tags, each keeping the
`EXCEPTION - Non-Production Host` gate so dev and preview traffic stays off the
dataset.

| Tag                       | Type                        | Trigger                                    |
| ------------------------- | --------------------------- | ------------------------------------------ |
| `Google Tag - GA4 Config` | Google tag (`G-GF63SJZ9ZJ`) | Initialization – All Pages                 |
| `GA4 - App Events`        | GA4 Event, name `{{Event}}` | Custom Event, regex over the 14 app events |
| `GA4 - Purchase`          | GA4 Event, name `purchase`  | Custom Event `subscription_purchase`       |
| `FB-Base-Tag`             | Meta Pixel                  | All Pages (untouched)                      |

`page_view` comes from the Google tag plus Enhanced Measurement, including
"page changes based on browser history events" — which is how SPA route changes
are captured, since `App.jsx` navigates with react-router `pushState`. The app's
own `pageview` dataLayer push is not used by GA4; it stays for PostHog.

One tag covers the whole funnel rather than fourteen: _Event Name_ is the
built-in `{{Event}}` variable and the trigger matches by regex, so adding an
event means editing the regex. `subscription_purchase` is deliberately
**excluded** from that regex and handled by the dedicated `purchase` tag,
because GA4 only reports revenue under the reserved `purchase` name — sending
both would double-count.

Event parameters are mapped from dataLayer variables: `plan_tier`, `method`,
`test_type`, `channel`, `task_type`, `value` and `currency` on app events, and
`value` / `currency` / `transaction_id` / `plan_tier` on `purchase`.

## Custom dimensions are not optional

An event parameter that is not registered as a custom dimension is **collected
and then dropped from every report** — visible only in Realtime and DebugView.
The property had none, so every parameter above would have been invisible.
Registered 2026-09-07, all event-scoped:

| Dimension         | Parameter   | Comes from                                               |
| ----------------- | ----------- | -------------------------------------------------------- |
| Plan tier         | `plan_tier` | `plan_selected`, `checkout_started`, `purchase`          |
| Signup method     | `method`    | `signup_completed`, `signin_success`                     |
| Signup channel    | `channel`   | `signup_completed` — the app's own first-touch channel   |
| Test type         | `test_type` | `test_completed`, reading/listening flows                |
| Writing task type | `task_type` | `writing_submitted`, `writing_checker_feedback_revealed` |

`value`, `currency` and `transaction_id` need no custom dimension — GA4 treats
them as standard fields on `purchase`.

Custom dimensions are **not backfilled**: they collect from the moment they are
created, so anything earlier reports as `(not set)`.

`channel` and `task_type` are safe to send — both already appear on the vetted
non-PII property allowlist in `src/lib/posthog.js`.

## Verified

Checked against the live site after publishing (network level, then GA4
Realtime):

- `en=page_view` with the correct `dt` on every route, including SPA
  navigations;
- `en=plan_selected` carrying `ep.plan_tier`, `ep.channel` and `ep.task_type`,
  proving both the generic tag and the parameter mapping;
- Enhanced Measurement alive for the first time (`scroll`, `user_engagement`);
- _Views by page title_ populating with real titles after a month of "No data
  available";
- Meta Pixel `PageView` (id `991226963227159`, with `eid` for dedup) still
  firing alongside GA4 — the container change did not disturb it.

A synthetic `purchase` was **not** fired: it would have written fake revenue
into the property. That tag is structurally identical to the verified one and
differs only in its trigger and static event name.

## Still to do

- **Mark `signup_completed` as a key event.** GA4 only lets an event be starred
  once it has been collected, and the event registry refreshes about daily, so
  it cannot be marked the same day the tag ships. Admin → Data display → Events
  → _Recent events_ → star `signup_completed`. `purchase` was already a key
  event and needs nothing.
- **Deploy the CSP change** that unblocks Microsoft Clarity (below).

## Microsoft Clarity was CSP-blocked

GA4's tag diagnostics flagged "your website's security settings are blocking
measurement". Checking `securitypolicyviolation` events on a live page load
showed the culprit is not Google at all — every Google host loads fine — but:

```
script-src-elem  https://www.clarity.ms/tag/xq6eu7owe1?ref=gtm
```

`clarity.ms` appeared nowhere in `vercel.json`, so the Clarity tag in GTM has
never run under this CSP. Fixed by adding `https://www.clarity.ms` to
`script-src` and `https://*.clarity.ms` to `connect-src` (ingestion uses
regional subdomains). Needs a deploy to take effect.

The same check re-confirmed the two Meta Open Bridge `?cee=no` endpoints and
Meta's `capiParamBuilder` are still blocked. That is deliberate — see
`docs/meta-conversions-api.md`; do not widen the CSP for them.

## Why GA4 also undercounts

`index.html` defers GTM to the first user interaction or 3s idle, whichever
comes first — a deliberate LCP tradeoff. A visitor who leaves in under three
seconds without interacting is never measured. Expect GA4 sessions to sit below
server-side reality, and do not treat the gap as a tagging bug.

Measurement is additionally gated to `ieltsai.pro` / `www.ieltsai.pro` in three
places (see `docs/meta-conversions-api.md`), and the GTM host-gate trigger uses
`^(www\.)?ieltsai\.pro$`.

## Orphans left over from the Stape era

- **`GTM-TGSX5DN3`** — a server container named "Ielts Ai Pro Server", the
  counterpart to the dead `tag.ieltsai.pro` domain removed from the CSP. Nothing
  points at it.
- **`GTM-WX3GSFDX`** — loaded by the `user_engagement` tag (a Google tag for a
  different container) on a custom event this app never pushes. Inert.

Neither was removed, because deleting a container is irreversible and neither
costs anything while idle.
