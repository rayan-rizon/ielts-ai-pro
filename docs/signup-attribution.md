# Signup acquisition attribution

`shared/signupAttributionCapture.js` is embedded before navigation by both Vite's
HTML transform and `api/blog.js`. It records the first landing, including a
landing with no source signal, for up to 30 days. Only acquisition parameters
are retained in the landing URL. Same-site and Google authentication referrers
are ignored. Storage failure has an in-memory fallback, but that fallback
cannot survive a full navigation or an OAuth redirect.

`src/lib/attribution.js` classifies the evidence. AI provider hosts and UTM
aliases are maintained in `AI_PROVIDERS`; explicit `ai`, `llm`, `ai_referral`,
or `ai_assistant` mediums also support tagged links from other tools. The admin
shows AI referral with the provider when identifiable. An app that strips its
referrer and sends no campaign tags cannot be identified reliably.

Facebook click IDs alone mean social traffic, not necessarily paid traffic.
Unverified social traffic uses `social`; explicit campaign mediums distinguish
`paid_social` and `organic_social`. Google authentication is not a source;
Gmail and Gemini are email and AI referrals respectively.

Email signup sends context in Auth metadata. OAuth profiles can be completed
once by browser synchronization within ten minutes of profile creation, using
evidence captured before signup (five seconds of clock tolerance). A recorded
timestamp freezes even no-signal attribution. The database trigger protects
finalized and older profiles against subsequent learner updates, including
updates from older clients. Operator/service-role corrections remain possible.

## Release order

1. Apply `20260926180318_accurate_signup_channels.sql` before releasing the
   frontend; it adds the finalization column, accepts the new channel values,
   and protects historical attribution.
2. Deploy the app and server-rendered blog together. Check the admin source
   labels and a blog-to-signup journey on the deployed version.
3. Run `node scripts/reclassify-signup-attribution.mjs` for a read-only summary.
4. Once authorized, run that script with `--apply` and
   `--backup-dir=/absolute/private/directory`. It writes a private timestamped
   backup before changes, compares original fields to avoid concurrent updates,
   and reads each updated record back. It never infers missing sources from
   login providers and never changes a source without stored evidence.
5. Run the read-only summary again; no pending corrections should remain.

If interrupted, rerun the read-only summary before proceeding. Preserve the
backup for rollback. Do not drop the additive column when rolling back the UI.

Local verification includes classifier/capture tests, Auth metadata and profile
synchronization tests, existing admin and blog tests, an isolated PostgreSQL
trigger test, and browser journeys through the production-route preview. These
checks do not substitute for deployed, authenticated-admin verification.
