# PostHog product analytics

## Purpose

PostHog answers four product questions without duplicating the learner-facing Analytics page:

1. Do high-intent visitors become registered learners?
2. Do new learners finish onboarding and complete a first scored test?
3. Which test modules and modes lead to repeat practice?
4. Where do learners leave the plan-selection and checkout journey?

PostHog is not the source of truth for scores, entitlements, billing, or AI cost. Those remain in
Supabase and the payment provider. Sentry remains the error-investigation tool.

## Event contract

| Product question            | Events                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Writing-checker acquisition | `writing_checker_signup_gate_viewed` → `signup_completed`                                     |
| Learner activation          | `signup_completed` → `onboarding_completed` → `test_completed`                                |
| Practice engagement         | `test_started` → `test_completed`, split by `test_type` and `test_mode`                       |
| AI-test completion          | `writing_submitted`, `speaking_submitted`, `test_completed`                                   |
| Subscription journey        | `plan_selected` → `checkout_started` → `subscription_purchase`                                |
| Manual Bangladesh payment   | `manual_checkout_started` → `manual_subscription_request_submitted` → `subscription_purchase` |

Only reviewed scalar properties are sent. Answers, essays, speaking transcripts, audio, email,
name, session IDs, campaign IDs, and payment-provider IDs are excluded in `src/lib/posthog.js`.

## AI Observability

Server-side `$ai_generation` events are emitted by `supabase/functions/_shared/aiObservability.ts`
for the shared text and writing providers. They include model/provider, token counts, generation
settings, and a per-request trace ID; parse/schema rejections and writing-provider failures include
the error name. They omit `$ai_input`, `$ai_output_choices`, error messages, learner content, and
conversation session IDs.
The AI Coach uses the existing stable profile ID as `distinct_id`; other requests are grouped under
the shared `unattributed` ID because their Edge Function call sites do not carry a verified user ID.

Local Edge Function development reads `POSTHOG_API_KEY` and `POSTHOG_HOST` from
`supabase/functions/.env`. Production capture requires those values as Supabase Edge Function
secrets; adding code or local env values does not configure the deployed project.

## Privacy and performance policy

- The SDK loads automatically only on `ieltsai.pro`/`www.ieltsai.pro` when a project token is
  configured. This deliberately matches the existing GTM/Meta production-host policy; the cookie
  settings UI does not disable PostHog lifecycle measurement.
- Autocapture, session replay, exception capture, automatic pageviews, and automatic page-leave
  events are disabled. SPA pageviews are emitted by the existing router tracking seam.
- Identified profiles contain only the stable profile ID, subscription tier, onboarding state, and
  admin boolean. Sign-out resets the PostHog identity.
- The SDK is dynamically imported, keeping it out of the initial application chunk.

## Production activation

1. Set `VITE_POSTHOG_PROJECT_TOKEN`, `VITE_POSTHOG_HOST`, and `VITE_POSTHOG_UI_HOST` in the Vercel
   Production environment. Do not enable `VITE_POSTHOG_ENABLE_DEVELOPMENT` there.
2. In PostHog project settings, set the project timezone to `Asia/Dhaka` before building daily or
   weekly insights.
3. Deploy and open a clean production browser (including one with analytics cookies declined), then
   complete one labelled test journey. Confirm `$pageview`, identity, and lifecycle events in Live
   events without answer or transcript properties.
4. After real events exist, build a compact dashboard with activation, test completion, 7-day
   repeat practice, and checkout conversion. Do not create empty insights before ingestion.

Current PostHog setup guidance: [React analytics](https://posthog.com/tutorials/react-analytics),
[SPA pageviews](https://posthog.com/tutorials/single-page-app-pageviews), and
[JavaScript configuration](https://posthog.com/docs/libraries/js/config).
