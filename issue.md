Critical
Secret exposure in plaintext environment files
OWASP: A02 Cryptographic Failures / A05 Security Misconfiguration.
Evidence: .env (line 2), .env (line 4), .env (line 7), .env (line 20), .env (line 3), .env (line 6), .env (line 12), .env (line 39).
Impact: key compromise risk for Supabase service role, AI provider, Stripe, and storage credentials.

Auth sign-in flow regression and resend UX deadlock
Evidence: sign-in checks data?.session after signIn returns user object (Login.jsx (line 140), AuthContext.jsx (line 380)); resend spinner never clears (Login.jsx (line 219)).
Impact: false auth failure messaging, inconsistent navigation state, broken resend interaction.
High
Route guard behavior can render protected children before auth resolves
Evidence: ProtectedRoute.jsx (line 24) returns children when loading/check incomplete.
Impact: unauthorized UI exposure window and inconsistent protected flow behavior.
Auth cache logic mismatch + excessive session/profile churn
Evidence: cache compares cachedProfile.id with auth user id (AuthContext.jsx (line 106)), while merged profile id is not guaranteed same identifier type; repeated updateLastActive calls (AuthContext.jsx (line 120), AuthContext.jsx (line 240), AuthContext.jsx (line 339)).
Impact: redundant DB writes, racey auth transitions, unnecessary API load.
Security helper permissive CORS/rate-limit model
Evidence: wildcard regex origin handling and fallback origin (security.ts (line 37), security.ts (line 46)), in-memory rate limiting only (security.ts (line 78)).
Impact: weaker hardening under multi-instance/serverless cold starts; inconsistent enforcement at scale.
Pricing is behind auth, adding funnel friction
Evidence: /pricing is protected route in App.jsx (line 462).
Impact: unnecessary forced login before pricing evaluation; conversion drop risk.
Medium
Lint/test guardrails are currently unreliable
Evidence: undefined component/import errors (ScoreForecast.jsx (line 89), Vocabulary.jsx (line 1103), Vocabulary.jsx (line 1195)) and missing display-name errors.
Impact: regression risk rises; CI confidence reduced.
Large client-side analytics/dashboard data processing
Evidence: fetch up to 1000 sessions and process heavily in browser (useAnalyticsData.js (line 16) onward), broad vocabulary list call (useDashboardData.js (line 100)), non-user-scoped dashboard resource cache key (useDashboardData.js (line 90)).
Impact: elevated CPU/memory on mid-range devices; slower interactive analytics.
Broad select('*') query usage across services
Evidence: pervasive in services such as Resource.ts (line 47), TestSession.ts (line 58).
Impact: payload bloat, overfetching, unnecessary DB/network work.
Unbounded in-memory API cache
Evidence: map cache without cap/eviction policy in apiCache.ts (line 7), apiCache.ts (line 52).
Impact: memory growth over long sessions.
Performance bottlenecks in frontend bundles
Evidence: index-DXXq8Ehv.css ~463 KB and large vendor/chart chunks from build output.
Impact: slower first load and route hydration, especially on mobile.