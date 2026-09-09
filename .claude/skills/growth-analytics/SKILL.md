---
name: growth-analytics
description: Paid acquisition, funnel and measurement guide for IELTS Ai Pro — the funnel shape, the GA4/GTM/Meta/PostHog stack and its real IDs, how conversions actually reach Google Ads and Meta, hard guardrails that must not be violated, and how to cross-check numbers before acting on them. Use for anything involving ads, campaigns, conversion tracking, analytics debugging, audiences, or growth/profitability decisions.
---

# Growth & Analytics (IELTS Ai Pro)

Use this whenever the task touches paid acquisition, conversion tracking, analytics
debugging, audiences, or "why do the numbers disagree". It exists because this
stack has several counter-intuitive properties that have already caused wrong
diagnoses more than once.

**Read the guardrails section before changing anything.** Several obvious-looking
"fixes" in this account are actively harmful.

---

## 1. What the product is, and the real funnel

IELTS Ai Pro is a freemium IELTS prep web app (React SPA on Vercel + Supabase).

The funnel is **not** signup-walled. Get this right before advising on it:

1. **Landing page** — pricing is **public** on `/#pricing` (`PricingSection.jsx`,
   linked from `Navbar.jsx`). There is also a `/pricing` route, but that one is
   auth-gated; an anonymous ad click should be sent to `/#pricing`.
2. **Signup** — Google OAuth (one click) or email+password. Google is ~97% of
   real signups; email requires a verification click and rarely completes.
3. **Free tier (the "aha")** — Reading and Listening are fully free. The writing
   checker gives **3 free feedback reports**. Speaking has a small free
   allowance. Real product value lands before any paywall.
4. **Paywall** — hit when the free writing/speaking allowance runs out.
5. **Payment** — Stripe internationally; **Bangladesh has no card rail**, so BD
   uses a manual bKash flow (`manual_checkout_started` →
   `manual_subscription_request_submitted`).

**Implication for ads:** the conversion to optimise is _signup_, not purchase.
Upgrade happens days-to-weeks later, and ad-attributed purchases are still zero.

---

## 2. The measurement stack (verified IDs)

| Thing                    | Value                                                         |
| ------------------------ | ------------------------------------------------------------- |
| GA4 property             | `530246373`, measurement ID `G-GF63SJZ9ZJ`                    |
| GTM **web** container    | `GTM-TR6XQ2R3` (account `6346472871`, container `247535375`)  |
| GTM **server** container | `GTM-TGSX5DN3` — **EMPTY, UNUSED. Not server-side tracking.** |
| Meta pixel / dataset     | `991226963227159`                                             |
| Meta ad account          | `2358695944373057` (BDT)                                      |
| Google Ads account       | `355-953-4576`                                                |
| Product analytics        | PostHog (separate, receives everything)                       |
| Session replay           | Microsoft Clarity                                             |

**No GA code lives in the repo.** GTM owns every tag. The only `gtag()` call in
the codebase is the consent default in `index.html`.

### How events flow

`src/lib/tracking.js` → `trackAppEvent()` pushes to `dataLayer` → GTM tag
`GA4 - App Events` (event name = `{{Event}}`) sends to GA4. A separate
`GA4 - Purchase` tag maps `subscription_purchase` → GA4 event `purchase`.

Meta is separate and deliberately narrow: only 5 events reach the pixel
(`CompleteRegistration`, `Lead`, `InitiateCheckout`, `Purchase`, `Subscribe`,
plus `ViewContent`), mirrored server-side by `api/meta-capi.js` on Vercel with a
shared `event_id` so Meta dedupes.

### First-party tag serving

Vercel rewrites serve Google endpoints from our own origin: `/mx/gtm.js`,
`/mx/gtag/js`, `/mx/g/collect`. The loaders in `index.html` and `api/blog.js`
request `/mx/gtm.js` with an `onerror` fallback to googletagmanager.com, so a
proxy failure can never make measurement worse. This is **first-party proxying of
browser tracking, not server-side tracking.**

---

## 3. How a conversion actually reaches Google Ads

This is the chain, and every link has broken at least once:

```
app dataLayer event
  → GTM "GA4 - App Events" tag
  → GA4 raw event
  → GA4 KEY EVENT (must be starred in Admin → Data display → Events)
  → GA4 ↔ Google Ads link
  → Google Ads conversion action (source: "Website (Google Analytics (GA4))")
```

**The key-event star is the step that silently fails.** An event can be
collecting perfectly in GA4 for weeks and still send nothing to Google Ads if it
is not starred. Google Ads will just say "Awaiting conversions".

Current conversion actions (all GA4-imported — there is **no** Google Ads native
tag, deliberately):

| Action         | GA4 event          | Role                                                  |
| -------------- | ------------------ | ----------------------------------------------------- |
| Sign-ups       | `signup_completed` | **Primary** — the optimisation target                 |
| Begin checkout | `plan_selected`    | Secondary                                             |
| Purchases      | `purchase`         | Primary (has never fired — no ad-driven purchase yet) |

---

## 4. Hard guardrails — do not violate

1. **Never add Meta Open Bridge hosts to the CSP.** `*.on.aws`, `*.run.app` and
   `capi-automation.s3.us-east-2.amazonaws.com` appear as console errors. That is
   **the CSP working**. Wildcards would let the page POST to any AWS/Cloud Run
   host. Fix at source by removing the Open Bridge connection in Events Manager.
   Rule lives in `AGENTS.md`; full writeup in `docs/meta-conversions-api.md`.

2. **Never create a second Google Ads conversion action for an event GA4 already
   imports.** Google's own "Finish setting up conversion tracking" recommendation
   does exactly this and would double-count every signup. Ignore it; it clears
   itself once conversions flow.

3. **GA4 has no event deduplication.** Unlike Meta's `event_id`, there is no way
   to dedupe a browser event against a server one. Never mirror a browser event
   through the Measurement Protocol — it double-counts.

4. **Do not point the Google tag's `transport_url` at `/mx`.** A plain proxy
   cannot set `ip_override` the way sGTM does, so Google would see Vercel's edge
   IP and country reporting would degrade. Geo matters here (India campaign).

5. **Measurement is gated to production hosts** (`ieltsai.pro`, `www.ieltsai.pro`)
   in three places that must stay in sync: `index.html`, `src/lib/tracking.js`
   (`measurementEnabled()`), and `api/meta-capi.js`. Dev traffic once put
   `localhost` on the Meta dataset and triggered a data-quality penalty.

6. **Nothing backfills.** GA4 key events count only from the moment they are
   starred. Custom dimensions likewise. Never promise historical recovery.

7. **Never accept Terms/agreements or complete identity verification** on the
   user's behalf, on any ad platform.

---

## 5. Cross-checking numbers (do this before diagnosing)

The app has its **own** first-touch attribution (`src/lib/attribution.js`) which
writes `signup_channel` / `signup_gclid` / `signup_utm_*` to the `users` table.
This is an independent second source of truth — use it to sanity-check GA4.

Worked example (Aug 12 – Sep 8 2026): GA4 reported 41 `signup_completed` events /
38 users, channel split paid_social 19, organic_search 14, **paid_search 5**,
referral 2, direct 1 — and the admin panel independently showed 5 paid-search
signups. Agreement across two systems is what makes a number trustworthy.

**Register parameters as custom dimensions or they are invisible in reports.**
Already registered: `plan_tier`, `method`, `channel`, `test_type`, `task_type`.

**Watch for bot traffic.** GA4 once showed 102 google/cpc sessions against 8 real
Google Ads clicks — 97 were homepage hits with 0% engagement and 0s duration.
Ads only bills for its own recorded clicks; GA4 session counts can be junk.

---

## 6. Current account state and how to think about growth

**Meta (the volume channel).** Campaign "IELTS Signups - BD" — Sales objective,
Advantage+ audience, optimising Complete registration, ~৳300/day. Last 30 days:
129 registrations at **৳22.16** each, cost per registration down ~47%. This is
working; do not "fix" it casually.

**Google Ads (the small test).** Search, India, Maximize Clicks with a $0.10 CPC
cap, spend in single-digit dollars. Bid strategy was set deliberately because the
budget is tight.

**Audiences.** `Registered Users - CompleteRegistration 180d` (website custom
audience) and `Lookalike (1%)` built from it. The custom audience's other job is
as an **exclusion** on prospecting campaigns — otherwise budget is spent showing
signup ads to people who already have accounts.

### Optimisation-target ladder

Do not jump ahead of the data:

1. **Now** — optimise for **signup**. It is the only event with volume.
2. **At ~30+ signups/month** — move to a mid-funnel quality event
   (`onboarding_completed`, or first writing check) to filter freebie-seekers.
3. **At ~15+ purchases/month** — move to Maximize Conversion Value / tROAS.

Smart Bidding needs roughly 15–30 conversions per 30 days to leave learning.
Switching to Maximize Conversions on sparse data makes a tight budget worse.

### Profitability reality

Zero ad-attributed purchases so far. Cost per registration is known
(৳22.16 Meta); **LTV is not**. Until free→paid conversion rate and retention are
measured, "profitable" cannot be asserted. Push for that number before
recommending scale.

---

## 7. Known gotchas

- **GTM UI**: config panels are in an iframe. `type` works, but `cmd+a`/Delete do
  not. Prefer find+ref over coordinate clicks; lists re-sort after edits and a
  coordinate click can hit the wrong row.
- **GA4 UI**: the Admin events registry refreshes ~daily, so a freshly shipped
  event cannot be starred the same day. Star toggles open a confirm dialog. A
  greyed star on an event with no data still reads `aria-pressed="true"` if it is
  marked — check the attribute, not the pixels.
- **Blog pages** (`/blog`, `/blog/:slug`) are server-rendered by `api/blog.js`,
  which builds its **own** HTML document. It has its own GTM snippet that must be
  kept in sync with `index.html`. This surface was completely untracked until
  2026-09-09.
- **Meta Ads Manager** refuses ad edits on the BD campaign (Advantage+ creative
  enhancements); adding UTMs fails at publish. Duplicate the ad with UTMs set at
  creation instead. Meta paid traffic therefore lands in GA4 as direct/referral.
- **Meta data-quality warnings about price/currency on CompleteRegistration** are
  usually stale rolling-window artefacts of the pixel's auto-enrichment
  ("Reviews, ratings and pricing"), not app bugs. Check that toggle and the
  relevant commit date before touching tracking code.

---

## 8. Writing ads

For ad copy across platforms, the `ads-copywriter` skill exists. Feed it the real
positioning: free Reading/Listening, 3 free AI writing reports, instant band
feedback, independent (not affiliated with IELTS/IDP/British Council — this
disclaimer is legally load-bearing and appears in the footer).
