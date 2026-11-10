# Gemini credential recovery — 2026-11-10

## Incident

Google rejected the configured Gemini credential with HTTP 403 and the message
"Your API key was reported as leaked. Please use another API key."
Production usage records matched the reported 15 voice failures: eight examiner
voice requests and seven practice coach voice requests. Six standard Google TTS
replacement requests completed successfully. Speaking also recorded one upstream
request timeout and one Gemini transcription fallback HTTP 403. The records do
not establish where the credential was exposed.

## Remediation

Replaced the `GEMINI_API_KEY` Supabase production secret for IELTS Ai Pro at
2026-11-10 17:19:20 UTC (23:19:20 Asia/Dhaka), and updated the ignored local
function environment. Verified that the production secret digest matches the
replacement. No key value, environment file, or credential digest is stored in
this report. This was a configuration change; no application deployment was
required.

## Verification

- A fresh direct Google Gemini text request returned HTTP 200 with output.
- A fresh direct Gemini speech request through the repository's streaming helper
  returned 151,680 bytes of audio.
- Opened the live speaking library in the existing authenticated Safari session,
  selected IELTS 21 Academic 2026 Test 4, and began practice mode. The page
  initially showed an empty conversation while initializing, then displayed the
  introduction and first question. This transient state was not established as
  a separate defect.
- During the live check, a speaking turn created at 17:22:28 UTC completed at
  17:22:37 UTC. Production metadata confirms Cloudflare Whisper transcription,
  Gemini `gemini-2.5-flash-lite` semantic processing, and an AI coach reply from
  DeepSeek. The UI displayed the captured transcript and the coach speaking.
- Fresh production `practice-tts` usage at 17:22:38 UTC completed without a TTS
  error, generated 1,117,440 bytes of audio, and recorded first audio at 2,183 ms.

## Limits and follow-up

The live practice turn and fresh practice voice generation passed. A complete
three-part examination, fresh examiner-route generation through the browser,
and an intentionally forced Gemini transcription fallback were not exercised.
Historical failures remain in the dashboard's rolling reporting window and do
not by themselves establish a continuing outage. The earlier upstream timeout
has no independently verified permanent fix from this credential rotation.

Only this incident report is included in the associated commit. Existing UI and
formatting edits in the checkout were outside this task. A workspace CodeScene
safeguard reported regressions in those pre-existing changes to
`DashboardHeader.jsx` and `format.ts`; this task changed no source files.

## Speaking finalization follow-up — 2026-11-11

The separate Postgres error storm was traced to `finalize_speaking_v2_turn`:
3,580 instances of `turn is not active` in the reported hour. Its business-state
conflict used SQLSTATE `40001`, which denotes a retryable serialization failure.
The exact originating retry implementation was not independently established.

Applied `speaking_turn_finalization_reliability` in production. Completed turns
now replay the saved response without charging turn/audio quota again. Inactive
and failed turns return a structured terminal conflict and authoritative state;
expired sessions cannot be revived by late responses. Stale part transitions
also return an explicit conflict rather than a transaction exception. Service
role and owner checks remain enforced.

Deployed `processSpeakingSessionV2` v31 with a bounded finalization helper:
three attempts maximum with backoff, an eight-second overall deadline, and a
stable error code, retry policy and turn operation ID. A write with an uncertain
outcome is not subsequently marked failed. Deployment preserved the existing
live shared dependencies rather than replacing them with differing checkout
versions.

Deployed the scoped frontend build at 100% as Cloudflare Worker version
`0fece688-7222-48fd-a1ec-a6d2f278f148`. The client preserves error metadata,
stops resubmitting terminal conflicts, and does not automatically reopen the
microphone after a finalization failure. The release excluded unrelated local
UI edits.

Verification:

- Isolated PostgreSQL regression tests reproduced the old failure and passed
  against the migration. The same rollback-only probes passed on production:
  replay, single quota charge, stale turn/part, expiry and authorization.
- Read-only live API probes passed for a saved-result replay and a terminal
  inactive-turn conflict using the real database endpoint and new helper.
- 25 focused unit tests passed; Deno type checking and targeted ESLint passed.
- The full unit run had 3,715 passes and two unrelated failures, both reproduced
  in the isolated checkout: `blog-renderer.test.js` (Article schema/HTML
  sanitization) and `platformHealthMigration.test.ts` (missed daily invocation).
- Cloudflare build and its required checks passed. The live speaking page
  returned HTTP 200; the deployed speaking and index assets matched the release
  bytes. A new microphone-to-report browser session was not exercised.
- Scoped CodeScene safeguard passed. Finalization helper Code Health: 10/10.
- No new Supabase security advisor findings compared with the pre-change check.
- No `turn is not active` or `speaking state conflict` log entries appeared in
  the checked 20:32–20:36 UTC post-migration window. This short window is not a
  guarantee about every future error or load condition.

The previously observed admin health-query timeouts and a platform-wide alerting
or provider circuit-breaker system are outside this targeted repair. Temporary
release directories and investigation logs are removed after verification;
regression tests are retained as project files.
