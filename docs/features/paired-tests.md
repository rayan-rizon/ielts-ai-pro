# Paired Reading and Listening practice

Private two-person exam practice lives directly in the existing Reading and Listening test routes. Study Groups is intentionally unchanged and reserved for a separate feature. Writing, chat, video, public leaderboards and paid guest access are outside this release.

## Routes and operation

- Reading and Listening libraries introduce the feature above the test grid. Every eligible full-test card exposes **Take with a friend**; compact volume rows expose **Together**.
- `/reading-test/:passageId?together=true` (and the Listening equivalent) opens creation, consent and previous paired attempts for that skill.
- Invitations use the same test route with `#invite=<token>`. The fragment survives the existing sign-in return flow and is not sent as an HTTP URL query or referrer.
- `?room=<id>` opens the lobby/countdown/current test/waiting/comparison, based on server state. Active attempts use their own session ID. `&review=true&view-results=true` opens private review after both finish.
- Both students must consent, have test access and select Ready. The host starts a five-second countdown. Listening checks all four audio assets before Ready; if a browser requires another playback gesture after navigation, the player shows **Enable shared audio** and records the interruption.

## Authority and privacy

`paired-tests` validates the bearer token with `auth.getUser`, uses the verified auth ID (never a supplied user ID), and calls service-only `paired_test_action`. All room/member data is inaccessible to browser table queries. Existing owner policies remain; restrictive policies prevent direct paired-attempt writes and withhold personal score rows until comparison release. Realtime private-channel policies permit member reads and presence writes, not client broadcast authority. Presence is advisory; database state decides readiness, timing and completion.

Room creation snapshots the selected database passage/questions. It accepts full three-section Reading or four-part Listening with 40 scored items and nonempty section statistics. Listening durations are parsed server-side from allowlisted audio sources (HTTPS project storage or `media.ieltsai.pro`, no redirects, 32 MiB per file, 20-second fetch timeout). Audio URLs must remain immutable for the life of an attempt. Client-supplied durations, scores and deadlines are ignored.

Both browser and Edge grading import `supabase/functions/_shared/objective-scoring`. The original frontend module paths remain re-export adapters. Active paired payloads omit solutions/transcripts. Comparison exposes only names, bands, correct totals, section/type aggregates and completion/interruption statuses. The partner's answers, auth ID, session ID, essays and unrelated history are never returned. This is friendly practice, not proctoring: the pre-existing solo content APIs are not redesigned into an anti-cheating system.

Saves use optimistic revisions and requests are serialized per tab. A stale tab must reload instead of overwriting current answers. Submission locks answers transactionally; retries cannot change the score or create another attempt. The server can retry grading locked attempts after an Edge interruption. `paired-test-deadlines` runs every minute to lock overdue attempts even with no connected browser; the next room read grades any locked attempts. API writes reject changes after the exact deadline even before the scheduled sweep. Last server-saved answers are used on timeout. Paired autosave runs every five seconds while answers change.

## Limits and measurement

There is one active room per student and two students per room, with database-enforced uniqueness and row locking. Invitations expire after 24 hours. Leaving a lobby cancels the room and revokes its invitation; leaving a running test submits the last saved answers without stopping the partner. Creation preflight/create and invitation preview/join requests share a 20-operation hourly budget per account; rejected valid-format invitation attempts also count.

`paired_test_events` records operational lifecycle events (created, joined, started, submitted, completed), with internal user/room identifiers and timestamps only. Combined with membership timestamps and interruption flags, it supports invitation conversion, completion, repeat usage and failure analysis. Review events are recorded once per participant. No answers, invitation tokens, essays or transcripts enter analytics. Measure actual database/Edge/media usage before expanding rollout; Reading/Listening comparison requires no AI calls.

## Release procedure

1. Use the Edge secret `PAIRED_TESTS_ENABLED=false` as the emergency kill switch. The discovery UI remains visible so students can understand the feature; the server remains authoritative for availability.
2. Review/apply `20260906204606_paired_test_rooms.sql` to a non-production Supabase environment; deploy `paired-tests`. Its JWT gateway verification is off because the handler verifies each token itself. Keep the service key server-only. For local function development only, set `ALLOW_LOOPBACK_ORIGINS=true`.
3. Run `supabase/tests/paired_rooms.sql` in an isolated database. Run the paired frontend/scoring tests and normal test regressions, then perform two-account end-to-end QA with real Realtime and audio. Verify actual production-schema triggers and advisors in that environment.
4. Enable the Edge secret in staging, test desktop/mobile and throttled connections, and only then enable production.
5. A backend emergency disable stops new entries, saves and room reads; use it only for an incident, and disclose that interrupted attempts retain their last saved answers. Keep stored attempts and room records when rolling back UI.

## Required end-to-end cases

Two accounts: invitation → consent → ready → shared countdown → existing question screens → independent submissions → delayed comparison → each student's private review. Verify Reading and Listening separately, mobile audio unlock, buffering, part boundaries, tab visibility, reconnect/refresh, clock changes, expired invites, third-member races, start/submit retries, stale tabs, deadline closure, entitlement changes before start and attempts to read/write another student's records. Verify signup/login preserves the invitation fragment. Do not equate unit/local PostgreSQL tests with authenticated hosted Supabase proof.
