# Speaking Report v2 — competitor review and plan

Status: P0 + P1 + re-answer and plan tracking implemented 2026-10-12 (uncommitted). Bangla and "hear the better version" are deferred.

### What shipped, and where it differs from this plan

- **Re-answer costs $0.** It uses the browser's own speech recognition (`hooks/useRehearsal.js`). Nothing is uploaded, and there is no Skill Lab call. Where the browser has no recogniser, only timing is checked.
- **The #1 fix and the 7-day plan are fully deterministic** (`utils/speakingReportInsights.js`, `utils/speakingDrillLibrary.js`). The deep dive returns only per-answer `issue` / `focus` / `why` tags, not session-level fields, so its JSON array contract is unchanged.
- **Measured length beats model inference.** A `too_short` tag from the model is ignored. Length comes from each answer's recorded `durationMs`, which is now saved on the conversation entry, or from word counts when timings weren't saved.
- **Plan ticks and re-answer results** are saved in `test_sessions.content_data.reportPractice`. No migration was needed.
- **Deep-dive output budget** raised from 6144 to 7168 in the registry, to make room for the new tags.

Input: IELTSNexa speaking report (Cambridge 21 Test 1, Part 1 only, 40 s of speech, band 5.5),
compared with our report (`src/features/testing/speaking/components/SpeakingReport.jsx`).

---

## 1. What IELTSNexa's report does

Top to bottom:

| #   | Section                         | What it shows                                                                                                                                                      |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Hero                            | Overall band plus **"Your #1 opportunity"**: one concrete instruction and a coach paragraph                                                                        |
| 2   | Criteria row                    | 4 band tiles (FC / LR / GRA / P), coloured red/green                                                                                                               |
| 3   | Delivery strip                  | Duration 40 s · 60 WPM · 40 words · 0 fillers · 0 pauses                                                                                                           |
| 4   | **"Fix this first"**            | One lead issue with a quote from the answer, then 3 smaller ones. Each has a timestamp and a fix                                                                   |
| 5   | Strengths                       | 2 ticks with quotes                                                                                                                                                |
| 6   | **"This week's plan"**          | 3 ranked drills (PEEL, Why-Why-Why, topic vocabulary), each with a time cost and frequency                                                                         |
| 7   | Communication Scorecard         | 6 pillars: Relevance, Organisation, Development, Strategic Flexibility, Engagement, Interaction. Each has a status, evidence lines with timestamps and a "Do this" |
| 8   | **Answer-length check by part** | Targets (P1 ≥ 30 s, P2 90–120 s, P3 ≥ 50 s) and how many answers missed them                                                                                       |
| 9   | Linguistic accuracy             | Mispronounced words, grammar errors, inflection errors, fillers, pauses. All empty here                                                                            |
| 10  | **"Your answers, upgraded"**    | Per question: what you said, a better version, and why it's better                                                                                                 |
| 11  | Footer                          | 1–5 "how natural did it feel" rating, recording playable for 14 days, report language setting (Bangla)                                                             |

### What works for students (worth learning from)

1. **One priority first.** The page opens with what to do next, not with a score breakdown.
2. **Their own words come back to them.** Every issue quotes the answer, so the feedback feels personal and is easy to check.
3. **"You said → better version → why".** It is the most useful section in the report and the easiest to act on.
4. **Answer length set against a target.** Most Band 5–6 students lose marks by under-developing their answers, and this check is objective, cheap and motivating.
5. **A plan with a time cost.** "10 min, daily for 5 days" turns feedback into something a student can do.
6. **Coaching in the student's first language (Bangla).** Fits our core market.

### Where it is weak (do not copy)

1. **It contradicts itself.** "No grammar errors flagged" sits next to an upgrade that says it "fixes a grammar error" ("the salon nearest salon"). Students notice this, and it erodes trust in the score.
2. **The timestamps look made up.** Every item lands on a neat 5-second window (0:00–0:05, 0:10–0:15, …) inside a 40-second session, so they read as invented rather than measured.
3. **Implausible zeros.** 0 pauses and 0 fillers at 60 WPM almost certainly means "not measured" displayed as "perfect". Then the Engagement pillar calls the delivery "monotonous and flat", which contradicts it.
4. **Flattering praise.** A 9-word answer gets called "direct, important for band 7". False praise from the coach undermines the coach.
5. **The six "pillars" are not IELTS criteria.** "Interaction" and "Engagement" are not scored by IELTS examiners, and "ask the examiner to clarify" is weak advice for Part 1. The section is padding with a confident label.
6. **It repeats itself.** "Make your answers longer" appears in the hero, "Fix this first", Organisation, Development, the length check and the plan: the same point six times.
7. **The plan is text only.** No drill links to an exercise, so nothing tracks whether the student did it.
8. **Mixed languages.** Bangla headings with English sub-labels ("NEEDS WORK", "Do this") and Bangla body text inside English sections.
9. **Recording kept for 14 days.** This adds storage cost and privacy surface for a feature students rarely use.

## 2. Our report today

Current order: rose gradient header → Band ring | Coach Summary | Performance at a Glance → Part-by-Part (3 cards) → "Practise this skill" link → Strengths | Areas to Improve → Pronunciation Breakdown → Deep Dive (accordion, one question open at a time) → footer buttons.

### Where we are already ahead

- **Real acoustic pronunciation.** Azure phoneme-level assessment gives problematic sounds and word-level issues. They show "No mispronunciations flagged".
- **Honest scoring.** We show an `insufficient_evidence` state instead of inventing a band, and the transcript-only score is labelled as an estimate.
- **Band per part** with an observation for each part. They score the whole session only.
- **Grammar corrections** (`incorrect → correct + explanation`) and **topic-drift detection** in the deep dive.
- **PDF export** and a **Skill Lab** link, so a real practice loop already exists.
- **Cheap models.** The deep dive runs on Luna at $0.10/$0.50 per million tokens and scoring on DeepSeek at $0.04/$0.64 per million.

### Where we are behind

| Gap                                                                                                                                       | Effect on students                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| No single "do this next". Coach summary, focus area and three improvements compete with each other                                        | The student reads everything and acts on nothing          |
| No delivery numbers (speaking time, words, WPM, answer length against target)                                                             | The biggest Band 5–6 problem, short answers, is invisible |
| The deep dive is the most valuable section, but it sits last and behind an accordion that opens one item at a time                        | Most students never reach the "better version"            |
| Strengths and improvements are generic and quote nothing                                                                                  | Feels like template feedback                              |
| No plan. "Practise this skill" is one undifferentiated link                                                                               | No path from the report back into the app                 |
| Coaching is English only                                                                                                                  | Lower comprehension for BD students at Band 4.5–6         |
| Visual debt: rose gradient banner, `backdrop-blur`, `shadow-lg/xl`, ambient glows, rainbow part themes in the deep dive (blue/amber/rose) | Breaks the Learner Panel design system and is noisy       |
| `StudyRecommendationsSection` is dead code (exported, never used, buttons with no handlers)                                               | Clean-up                                                  |

## 3. Principles for v2

1. **Every number is measured or not shown.** If we can't measure something (fillers, pauses), the report says "not measured". It never shows 0. This is how we beat them on trust.
2. **One point, one place.** Each issue appears once, in the section where the student can act on it.
3. **Quote, then fix.** Every piece of criticism quotes the student's answer by part and question number, not by a fake timestamp.
4. **Every recommendation leads somewhere** (re-answer, Skill Lab, Vocabulary, Grammar Lab).
5. **Stay on the four official IELTS criteria.** No invented pillars. Depth comes from evidence, not from more categories.
6. **Deterministic first, AI second.** Use code wherever the data already exists. Use AI only for language judgement.

## 4. The report, section by section (UI/UX)

All surfaces use the Learner Panel primitives from `@/features/dashboard/components/primitives.jsx`: `PANEL`, `WELL`, `TILE`, `NUM`, `MICRO`, `TITLE`, `Stat`, `Meter`, `Pill`, `IconChip`, `Tip`, `Empty`. Hairline borders, no glows, no blur, accent `#5a63df`, signal colours for status. The rose gradient header goes; speaking keeps a small rose `IconChip` as its module marker only.

```
┌ Header strip (PANEL, compact) ─────────────────────────────────────────┐
│ ← Speaking / Cambridge 21 · Test 1     12 Oct 2026   [EN|বাংলা] [PDF]  │
└────────────────────────────────────────────────────────────────────────┘
┌ A. Verdict ────────────────────────────┬ B. Your #1 fix ──────────────┐
│  6.0  OVERALL                          │ Pill: Fluency & Coherence    │
│  FC 6.0 ▮▮▮▮▮▮▯▯▯  LR 5.5 …            │ "Develop each answer: give a │
│  GRA 5.5 …  PR 6.5 …                   │  reason and an example"      │
│  MICRO: Grammar is holding you at 5.5  │ WELL: You said "No, I haven't│
│  → reach 6.0 by fixing tense control   │  changed my hairstyle."  P1·Q2│
│                                        │ [Re-answer this question →]  │
└────────────────────────────────────────┴──────────────────────────────┘
┌ C. Delivery (measured) ────────────────────────────────────────────────┐
│ SPEAKING TIME 6:42 │ WORDS 812 │ PACE 121 wpm │ PRON. CLARITY 74/100   │
│ Answer length vs target                                                 │
│ P1 avg 14 s  ▮▮▮▯▯ target ≥ 20–30 s   3 of 5 short                     │
│ P2 1:12      ▮▮▮▮▯ target 1:30–2:00   ends 18 s early                  │
│ P3 avg 31 s  ▮▮▮▮▯ target ≥ 45 s      2 of 4 short                     │
└────────────────────────────────────────────────────────────────────────┘
┌ D. Answer by answer  (Part tabs: 1 · 2 · 3) ───────────────────────────┐
│ P1·Q2  Have you changed your hairstyle recently?   14 s · 9 words  ⚑ short
│ YOU SAID   No, I haven't changed my ~~hair style~~ recently.            │
│ STRONGER   No, I haven't. I've kept the same short cut for years …    │
│ WHY        Adds a reason + a future possibility → Development (FC)     │
│ FIXES      hair style → hairstyle (one word)                            │
│ [Re-answer]  [Hear sample]                                             │
└────────────────────────────────────────────────────────────────────────┘
┌ E. 7-day plan (3 drills, each a real link, checkable) ─────────────────┐
│ 1 Extend with reason + example · 10 min × 5 days  [Start in Skill Lab] │
│ 2 /θ/ minimal pairs · 5 min × 5 days              [Start]              │
│ 3 Topic words: appearance (8 words)               [Add to Vocabulary]  │
└────────────────────────────────────────────────────────────────────────┘
┌ F. Criteria detail (collapsed by default) ─────────────────────────────┐
│ ▸ Fluency & Coherence 6.0 — note + 1 quoted strength + 1 quoted issue  │
│ ▸ Lexical Resource 5.5 — …   ▸ Grammar 5.5 — …                         │
│ ▸ Pronunciation 6.5 — problem sounds, word-level issues (Azure)       │
└────────────────────────────────────────────────────────────────────────┘
  Footer: [Take another test]  [Speaking library]   ·  Was this useful? 👍 👎
```

### A. Verdict

- A `NUM` band tile plus four criteria rows, each with a `Meter`. This replaces the animated ring and the "Average" row. The average misleads, because IELTS rounds the overall band differently from a plain mean.
- **"What's holding you back"** (new, deterministic): the lowest criterion, plus a one-line route to the next half band taken from `targetBandTips`.
- Transcript-only estimate: an inline `Pill tone="warn"` reading "Estimate: pronunciation not measured". The flag is already computed (`isTranscriptEstimate`) but never shown (`_isTranscriptEstimate` is ignored).

### B. Your #1 fix

- Exactly one item, with a quote from the student's answer and a part/question reference.
- Primary action: **Re-answer this question** (see §5, P2). Until that ships, the button links to the matching answer card in section D.
- Moves the Coach Summary paragraph here as a single collapsed "More from your coach" line.

### C. Delivery (new, mostly free)

- Computed in the browser from data we already have: per-turn `audio_duration_ms` (stored per V2 turn), transcript word counts and the Azure clarity scores.
- Pace is shown only within plausible bounds (40–220 wpm), otherwise "—".
- **Fillers and pauses are left out at first.** Whisper normalises fillers away, so we cannot count them honestly. If we enable Azure prosody later (§6), they come back with real data.
- Targets are guidance, not rules: P1 about 20–30 s, P2 1:30–2:00, P3 about 45 s+. Show "x of n short", and tapping it filters section D to those answers.

### D. Answer by answer

This is the most important section, so it moves up and opens by default.

- Part tabs (`Pill`-style segmented control). Within a part, **all cards are open**, not one at a time.
- Each card: question, `MICRO` meta (seconds · words · ⚑ short / drift), **You said** with inline marks (grammar span struck through and corrected, words Azure flagged dotted-underlined with the issue in a tooltip), **Stronger version**, **Why** (one line naming the criterion it lifts) and **Fixes** (the existing `grammaticalErrors`).
- "Hear sample" plays the stronger version through the existing TTS route, which is cached by SHA-1 so repeats are free. Lazy: TTS runs on first tap only.
- Mobile: the cards stack. "You said" and "Stronger" sit one above the other, never side by side.

### E. 7-day plan

- Three drills chosen from a **fixed drill library** in code (about 15–20 entries: PEEL extension, Part 2 timing with the 1-minute plan, hedging for Part 3, minimal pairs per phoneme, topic vocabulary sets, tense control, and so on).
- The AI picks only drill IDs plus one personalised line each. It never writes the drill. This keeps the output short (cheap), consistent and linkable.
- Each drill deep-links into Skill Lab, Vocabulary or Grammar Lab. Done state is stored per user, so the next report can say "you did 4/5 sessions of drill 1".

### F. Criteria detail

- The current criterion notes, the pronunciation breakdown (sounds, word issues, minimal-pair tip) and strengths, folded into each criterion. Collapsed by default, because this is reference material, not the main path.

### Removed or merged

- Separate Strengths / Areas to Improve cards: strengths move into F with quotes, improvements become B plus the plan.
- Part-by-Part cards: the part band moves into the D tab labels ("Part 2 · 6.0"), and the observation becomes the first line of each tab.
- Confetti: keep it only when the band beats the student's previous best. Otherwise it rewards a bad result.
- `StudyRecommendationsSection`: delete (dead code).

### Language (Bangla)

- A report-language toggle in the header. **All UI labels come from i18n strings**, so there is never a mixed EN/BN header. The AI writes only the _coaching text_ (fix, why, drill line, criterion notes) in the chosen language. Quotes and "stronger versions" always stay in English.
- Default follows the account language. The toggle re-renders labels instantly. For a report already generated in EN, offer "Translate coaching to বাংলা" as a lazy, one-off call cached on the session.

## 5. Phased delivery

### P0: front-end only, $0 extra AI cost (≈ 2–3 days)

1. Restyle the whole report to the panel system. Remove the gradient banner, blur, glows and `shadow-lg/xl`.
2. New order: A → B → C → D → E (stub) → F.
3. Section C from existing data (durations, word counts, Azure scores).
4. Section B from existing `improvements[0]` plus a deterministic quote match: pick the shortest answer in that part.
5. Section D opens by default with part tabs, and inline grammar marks from the existing `grammaticalErrors`.
6. Show the transcript-estimate pill. Fix the ignored `isTranscriptEstimate` prop.
7. Delete `StudyRecommendationsSection`.

### P1: prompt and schema changes, about +$0.001 per report (≈ 2 days)

Extend the **existing** deep-dive call (`generateDetailedSpeakingFeedback`, Luna). Do not add a new call:

- per question: `why` (≤ 20 words), `criterion` (enum), `issueTag` (enum: `too_short | no_reason | no_example | off_topic | grammar | vocab_range | none`)
- per session: `topFix { questionIndex, criterion, instruction }`, `drills [{ id, personalLine }] × 3` (IDs from the library)
- Validate the new fields in the existing grounding validator. The quote must be a substring of the transcript, which kills invented quotes (their bug).
- Update `aiModelRegistry.ts` if the output budget changes (6144 is enough; expected +600–900 tokens).

### P2: retention loop (≈ 3–4 days)

1. **Re-answer this question.** Record one answer and run it on the `skill-lab-transcription` route (flash-lite) plus the existing skill-lab feedback. Show before → after: length, the fix applied (yes/no) and one line. Cost ≈ $0.0005 per attempt. Cap at 5 per report for free users.
2. Plan completion tracking, and a "since last report" line in section A.
3. Bangla coaching output: a language param on the deep-dive prompt, with lazy translate for old reports.

### P3: only if the data says so

- Azure prosody (`EnableProsodyAssessment`) for real pause and monotone signals. Same per-hour price, but it only covers the 6–30 s pronunciation sample, so label it as a sample.
- Audio playback of the student's own answers: **skip by default.** Storage, privacy and retention work (see the 6-month retention policy) for a feature that drives little learning. Revisit only if users ask for it.

## 6. Cost summary (per completed full test)

| Item                                                                                | Today     | v2                             |
| ----------------------------------------------------------------------------------- | --------- | ------------------------------ |
| Transcription (Whisper turbo) + Azure sample                                        | unchanged | unchanged                      |
| Band scoring (DeepSeek / Gemini)                                                    | unchanged | unchanged                      |
| Deep dive (Luna, ~3k in / ~5k out)                                                  | ≈ $0.0028 | ≈ $0.0033 (+ new fields)       |
| Bangla coaching text (≈ 2.5× tokens for Bengali script on the coaching fields only) | —         | ≈ +$0.0015 when chosen         |
| "Hear sample" TTS (Neural2, ~300 chars, cached)                                     | —         | ≈ $0.005 per _first_ play only |
| Re-answer (flash-lite)                                                              | —         | ≈ $0.0005 per attempt, capped  |
| Delivery metrics, length check, quote matching, plan selection logic                | —         | $0 (client-side)               |
| Recording storage                                                                   | —         | $0 (not storing)               |

The largest variable cost is TTS for samples, so it stays lazy and cached. Everything else is a rounding error against the subscription price.

## 7. How we'll know it worked

The bar is lean, decision-grade metrics only:

- % of reports where the student opens at least one answer card (today the deep dive is mostly unseen)
- % who click Re-answer or any plan drill within 24 h
- Next speaking test taken within 7 days (retention)
- 👍/👎 on the report, kept as one tap, as a quality signal

## 8. Files touched

- `src/features/testing/speaking/components/SpeakingReport.jsx`: layout and header
- `components/SpeakingReportSummary.jsx`, `ScoreSection.jsx`: Verdict and #1 fix
- new `components/DeliveryPanel.jsx`, `components/AnswerCard.jsx`, `components/WeeklyPlan.jsx`
- `components/DeepDive*.jsx`, `QuestionAccordionItem.jsx`: replaced by part tabs and `AnswerCard`
- `components/FeedbackSections.jsx`: remove dead section, fold strengths into criteria
- `utils/speakingReportSummary.js`: delivery metrics, length check, "holding you back"
- new `utils/speakingDrillLibrary.js`
- `supabase/functions/generateDetailedSpeakingFeedback/index.ts`: schema, prompt, validator
- `supabase/functions/_shared/aiModelRegistry.ts`: only if the budget changes
