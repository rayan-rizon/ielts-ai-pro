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
