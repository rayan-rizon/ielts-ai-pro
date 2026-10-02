# Listening exam audit — 3 October 2026

Audited the live Supabase Listening catalog and persisted exam timing, then loaded every catalog audio URL in headless Google Chrome using the corrected application duration loader. This audit is read-only; it did not change attempts, answers, scores, catalog content, or production deployments.

## Findings

- All 48 Listening papers (IELTS 10–21, Tests 1–4) are active. Each has four parts in order, four audio URLs, and 40 scored answers split 10 per part.
- All 192 audio files returned finite positive durations through the corrected loader.
- All 48 papers produce question ranges 1–10, 11–20, 21–30, and 31–40 through the application’s actual `computeQuestionNumbers` function. Inputs were sanitized to preserve placeholder counts and structural shapes without retaining question text or answer keys.
- Of 105 stored solo exam attempts, 67 on 15 papers have `[null,null,null,null]` audio durations and invalid total timing. 61 are unfinished; 6 are completed. This matches the previously diagnosed cleanup-before-duration-read bug.
- The bug is in the common solo Listening loader, so every paper could encounter it even where no invalid attempt is stored. The local fix applies to all papers and reconstructs unfinished attempt timing on resume from their original start. It does not create a replacement attempt or change completed scores.
- All 14 paired Listening rooms have valid four-part audio timing and valid total durations. Completed paired sessions may omit timing from their own content data; the room is the authoritative timeline.
- IELTS 18 Test 3 has stored question-group start numbers shifted after Part 1. The application’s computed display ranges are correct for all four parts. This is a separate metadata inconsistency, not a cause of the Part-4-only behavior; no catalog changes were made.

## Papers with confirmed invalid solo timing

| Paper                          | Invalid attempts | Unfinished |
| ------------------------------ | ---------------: | ---------: |
| IELTS 10 Listening 2015 Test 4 |                1 |          1 |
| IELTS 15 Listening 2020 Test 1 |                2 |          2 |
| IELTS 16 Listening 2021 Test 1 |                1 |          1 |
| IELTS 18 Listening 2023 Test 1 |                2 |          2 |
| IELTS 18 Listening 2023 Test 2 |                1 |          1 |
| IELTS 18 Listening 2023 Test 3 |                1 |          1 |
| IELTS 19 Listening 2024 Test 1 |                2 |          2 |
| IELTS 20 Listening 2025 Test 1 |                4 |          3 |
| IELTS 20 Listening 2025 Test 2 |                2 |          2 |
| IELTS 20 Listening 2025 Test 3 |                1 |          1 |
| IELTS 20 Listening 2025 Test 4 |                6 |          6 |
| IELTS 21 Listening 2026 Test 1 |               13 |         12 |
| IELTS 21 Listening 2026 Test 2 |                7 |          5 |
| IELTS 21 Listening 2026 Test 3 |               12 |         11 |
| IELTS 21 Listening 2026 Test 4 |               12 |         11 |

## Every paper checked

Audio durations below are rounded up to seconds by the application loader. Exam duration is their sum plus 120 seconds of review.

| Paper                          | Parts / scored answers | Audio durations (seconds) | Computed question ranges | Invalid solo attempts |
| ------------------------------ | ---------------------- | ------------------------- | ------------------------ | --------------------: |
| IELTS 10 Listening 2015 Test 1 | 4 / 40                 | 366, 345, 355, 357        | Pass                     |                     0 |
| IELTS 10 Listening 2015 Test 2 | 4 / 40                 | 322, 327, 414, 369        | Pass                     |                     0 |
| IELTS 10 Listening 2015 Test 3 | 4 / 40                 | 413, 363, 389, 447        | Pass                     |                     0 |
| IELTS 10 Listening 2015 Test 4 | 4 / 40                 | 358, 356, 398, 405        | Pass                     |                     1 |
| IELTS 11 Listening 2016 Test 1 | 4 / 40                 | 479, 365, 458, 460        | Pass                     |                     0 |
| IELTS 11 Listening 2016 Test 2 | 4 / 40                 | 429, 397, 423, 397        | Pass                     |                     0 |
| IELTS 11 Listening 2016 Test 3 | 4 / 40                 | 387, 393, 364, 464        | Pass                     |                     0 |
| IELTS 11 Listening 2016 Test 4 | 4 / 40                 | 415, 328, 403, 451        | Pass                     |                     0 |
| IELTS 12 Listening 2017 Test 1 | 4 / 40                 | 395, 373, 363, 486        | Pass                     |                     0 |
| IELTS 12 Listening 2017 Test 2 | 4 / 40                 | 459, 433, 396, 475        | Pass                     |                     0 |
| IELTS 12 Listening 2017 Test 3 | 4 / 40                 | 442, 399, 474, 450        | Pass                     |                     0 |
| IELTS 12 Listening 2017 Test 4 | 4 / 40                 | 395, 333, 430, 431        | Pass                     |                     0 |
| IELTS 13 Listening 2018 Test 1 | 4 / 40                 | 350, 370, 392, 376        | Pass                     |                     0 |
| IELTS 13 Listening 2018 Test 2 | 4 / 40                 | 445, 405, 394, 503        | Pass                     |                     0 |
| IELTS 13 Listening 2018 Test 3 | 4 / 40                 | 452, 345, 363, 355        | Pass                     |                     0 |
| IELTS 13 Listening 2018 Test 4 | 4 / 40                 | 390, 377, 415, 438        | Pass                     |                     0 |
| IELTS 14 Listening 2019 Test 1 | 4 / 40                 | 433, 370, 398, 446        | Pass                     |                     0 |
| IELTS 14 Listening 2019 Test 2 | 4 / 40                 | 381, 408, 428, 473        | Pass                     |                     0 |
| IELTS 14 Listening 2019 Test 3 | 4 / 40                 | 432, 364, 347, 446        | Pass                     |                     0 |
| IELTS 14 Listening 2019 Test 4 | 4 / 40                 | 413, 398, 430, 516        | Pass                     |                     0 |
| IELTS 15 Listening 2020 Test 1 | 4 / 40                 | 342, 389, 404, 475        | Pass                     |                     2 |
| IELTS 15 Listening 2020 Test 2 | 4 / 40                 | 382, 394, 399, 453        | Pass                     |                     0 |
| IELTS 15 Listening 2020 Test 3 | 4 / 40                 | 366, 394, 380, 395        | Pass                     |                     0 |
| IELTS 15 Listening 2020 Test 4 | 4 / 40                 | 372, 354, 389, 395        | Pass                     |                     0 |
| IELTS 16 Listening 2021 Test 1 | 4 / 40                 | 341, 387, 373, 432        | Pass                     |                     1 |
| IELTS 16 Listening 2021 Test 2 | 4 / 40                 | 328, 436, 388, 453        | Pass                     |                     0 |
| IELTS 16 Listening 2021 Test 3 | 4 / 40                 | 423, 379, 382, 443        | Pass                     |                     0 |
| IELTS 16 Listening 2021 Test 4 | 4 / 40                 | 356, 355, 378, 481        | Pass                     |                     0 |
| IELTS 17 Listening 2022 Test 1 | 4 / 40                 | 340, 384, 414, 383        | Pass                     |                     0 |
| IELTS 17 Listening 2022 Test 2 | 4 / 40                 | 408, 416, 374, 360        | Pass                     |                     0 |
| IELTS 17 Listening 2022 Test 3 | 4 / 40                 | 348, 420, 425, 414        | Pass                     |                     0 |
| IELTS 17 Listening 2022 Test 4 | 4 / 40                 | 317, 444, 382, 448        | Pass                     |                     0 |
| IELTS 18 Listening 2023 Test 1 | 4 / 40                 | 326, 369, 372, 455        | Pass                     |                     2 |
| IELTS 18 Listening 2023 Test 2 | 4 / 40                 | 373, 408, 399, 352        | Pass                     |                     1 |
| IELTS 18 Listening 2023 Test 3 | 4 / 40                 | 375, 441, 328, 386        | Pass                     |                     1 |
| IELTS 18 Listening 2023 Test 4 | 4 / 40                 | 406, 436, 418, 482        | Pass                     |                     0 |
| IELTS 19 Listening 2024 Test 1 | 4 / 40                 | 420, 437, 426, 453        | Pass                     |                     2 |
| IELTS 19 Listening 2024 Test 2 | 4 / 40                 | 440, 399, 437, 492        | Pass                     |                     0 |
| IELTS 19 Listening 2024 Test 3 | 4 / 40                 | 406, 397, 450, 466        | Pass                     |                     0 |
| IELTS 19 Listening 2024 Test 4 | 4 / 40                 | 423, 412, 458, 583        | Pass                     |                     0 |
| IELTS 20 Listening 2025 Test 1 | 4 / 40                 | 436, 512, 479, 453        | Pass                     |                     4 |
| IELTS 20 Listening 2025 Test 2 | 4 / 40                 | 353, 427, 392, 530        | Pass                     |                     2 |
| IELTS 20 Listening 2025 Test 3 | 4 / 40                 | 407, 468, 449, 480        | Pass                     |                     1 |
| IELTS 20 Listening 2025 Test 4 | 4 / 40                 | 400, 479, 482, 463        | Pass                     |                     6 |
| IELTS 21 Listening 2026 Test 1 | 4 / 40                 | 414, 446, 417, 531        | Pass                     |                    13 |
| IELTS 21 Listening 2026 Test 2 | 4 / 40                 | 462, 369, 447, 443        | Pass                     |                     7 |
| IELTS 21 Listening 2026 Test 3 | 4 / 40                 | 390, 411, 392, 547        | Pass                     |                    12 |
| IELTS 21 Listening 2026 Test 4 | 4 / 40                 | 384, 433, 391, 430        | Pass                     |                    12 |

## Evidence boundaries

The Chrome check verifies that every audio URL loads and supplies valid media metadata using the fixed loader. It does not prove uninterrupted playback over the whole recording, transcription or answer-key correctness, or a signed-in learner completing every paper. The earlier 30 regression tests cover duration cleanup, invalid-timing validation, all four progression steps, and resumed positions across all parts and review. The production build passed. The shared application fix remains local and is not yet deployed.

## Repeat the audio audit

Run `node scripts/audit-listening-exam-audio.mjs <catalog.json> <output.json>`. Set `AUDIT_CHROME_PATH` when using an installed Chrome instead of a Playwright-managed browser. The catalog input must contain each paper’s `id`, `title`, and `parts` entries with `audio_url` fields. The local audit metadata and results are under `tmp/listening-exam-audit-2026-10-03/`.
