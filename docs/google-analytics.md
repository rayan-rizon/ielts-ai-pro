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

## Property configuration

| Setting              | State                                                     |
| -------------------- | --------------------------------------------------------- |
| Custom dimensions    | 5 event-scoped (above)                                    |
| Custom metrics       | none — deliberately                                       |
| Key events           | `purchase` only, until `signup_completed` can be starred  |
| Event data retention | 14 months (was the 2-month default)                       |
| Unwanted referrals   | `accounts.google.com`, `checkout.stripe.com`              |
| Reporting identity   | Blended                                                   |
| Search Console       | linked to the `ieltsai.pro` domain property               |
| Audiences            | GA4 defaults only (All Users, Purchasers, 7-day inactive) |
| Annotations          | one, marking the 2026-09-07 repair                        |

GA4 had auto-created two key events, `close_convert_lead` and `qualify_lead`,
that this app never fires. Both were unmarked so the Key events list contains
only events that actually exist.

The annotation matters more than it looks: every report that spans 2026-09-07
straddles a property that was structurally broken on one side of the line. Do
not read a "spike" in page views or key events as a real change in behaviour.

## Deliberately not added

Keeping the property lean is a decision, not an oversight. See
`analytics-scope-preference` — the rule is that a dimension, metric, audience or
report has to change a decision to earn its place.

- **`overall_band` and `word_count` as custom metrics.** The app emits both, but
  they are per-session product outcomes, not acquisition or revenue signals, and
  custom definitions are capped per property. Product depth belongs in PostHog
  and the admin dashboard, which already hold it.
- **Extra audiences.** GA4 audiences are chiefly a Google Ads remarketing
  mechanism, and this account advertises on Meta. "Started checkout, did not
  purchase" would be the one worth adding _if_ Google Ads is ever linked.
- **A saved funnel exploration.** With `page_view` and the funnel events only
  hours old there is nothing to plot yet, and Explore builds one from a template
  in a few clicks once a week of data exists.

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

## Google Ads

Google Ads account `355-953-4576` is linked to the property (Sep 7 2026,
personalized advertising enabled, auto-tagging on the recommended setting). The
account has never run a campaign.

**One conversion action, imported from GA4:** "Ielts Ai Pro (web) purchase",
sourced from the GA4 `purchase` key event, category Purchase, primary. No
Google Ads-native tag was installed alongside it — a second delivery path for
the same conversion invites double counting, and GA4 is already the source of
truth.

Purchase is the **only** account-default goal. Three others were removed or
demoted, because account-default goals steer bidding on every campaign
created later:

| Goal                       | Was                      | Action                                                                                                                                                     |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Submit lead forms → "Form" | Primary, account-default | **Removed.** It imported `ads_conversion_Form_1` from a GA4 property named _Quantbyte_ — a different project entirely — and was permanently misconfigured. |
| Contacts (3 call actions)  | Account-default          | Account-default turned off. The actions are Google-hosted and cannot be deleted; they only fire on call assets this account does not use.                  |
| Get directions (2 actions) | Not account-default      | Left alone.                                                                                                                                                |

`gclid` capture is verified end to end: loading
`https://www.ieltsai.pro/?gclid=…` writes `_gcl_aw=GCL.<ts>.<gclid>` and
records the click id in the `attribution_first_touch` payload. `isPaidArrival()`
in `index.html` already treats `gclid` as a paid arrival and loads GTM eagerly,
so the Google tag reads the query string before the router rewrites it — the
same failure that once silently killed `fbclid`.

## The subscription funnel

Saved as the **Subscription funnel** exploration, two tabs — _By channel_
(breakdown: First user primary channel group) and _By country_ — over a rolling
`Sun – Today` window. Segments: Direct, Organic, Paid.

| Step                | GA4 event(s)                                        | Fired by                                               |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| 1. Visited site     | `session_start`                                     | Enhanced Measurement                                   |
| 2. Signed up        | `signup_completed`                                  | `trackSignupCompleted`, once per user from `User.me()` |
| 3. Chose a plan     | `plan_selected`                                     | `Pricing.jsx`, both payment paths                      |
| 4. Started checkout | `checkout_started` **or** `manual_checkout_started` | Stripe path / manual bKash path                        |
| 5. Subscribed       | `purchase`                                          | GTM renames `subscription_purchase` → `purchase`       |

Step 4 must carry both events. The bKash path calls
`trackAuthenticatedAppEvent('manual_checkout_started', …)` and never emits
`checkout_started` — the `checkout_started` string that appears beside it in
`startManualBdCheckout` is a `MarketingDelivery.record` label, not an analytics
event. A funnel built on `checkout_started` alone would drop Bangladesh, the
largest market, at step 4.

Step 5 is safe for both paths: Stripe fires `subscription_purchase` from
`SubscriptionSuccess.jsx`, and manual bKash activations fire it from the
upgrade-detection effect in `AuthContext.jsx` (`source: 'manual_bangladesh'`).

`checkout_started`, `manual_checkout_started` and `purchase` had to be defined
by name in the step editor — GA4 has not received one yet, because the tagging
was only repaired on Sep 7. They resolve automatically once the events arrive.

### Cross-check against the code

The `GA4 - App Events` trigger regex matches exactly the 14 events that survive
`DROPPED_EVENTS` in `src/lib/tracking.js`, and deliberately excludes
`subscription_purchase`, which the separate `GA4 - Purchase` tag owns. 14 + 1 is
the whole live event surface — nothing missing, nothing firing twice.

## Attribution settings

Verified Sep 7 2026, all at Google's recommended values; nothing changed:

| Setting                         | Value                                   |
| ------------------------------- | --------------------------------------- |
| Reporting attribution model     | Data-driven (paid and organic channels) |
| Acquisition key events lookback | 30 days                                 |
| All other key events lookback   | 90 days                                 |
| Engaged-view key events         | 3 days (fixed)                          |

The 90-day window is the right one for this product — an IELTS candidate
researches for weeks before paying.
