# Writing Practice: Learning Features with Controlled AI Cost

Status: implemented locally on 23 September 2026. The database migration and Edge Function have not been applied or deployed. End-to-end persistence, generation, and recheck verification remain release gates.

## Local implementation map

- `writingCoaching.js` and `WritingCoach.jsx`: local Words & cohesion patterns, the guided revision workspace, and the full-width Band 8.0 comparison. The comparison highlights changed words, aligns every source sentence with a suggested version, and can show the complete example from the same response.
- `writing-coach/index.ts`: authenticated one-request transformation, one explicit retry, ownership checks, a $0.005 per-attempt reservation within a $3 shared daily budget, provider usage logging, and an explicit revision recheck through the existing scorer and quota.
- `writing_practice_coaching` stores the original, current revision, up to five checked revision snapshots, and the optional example. The migration enables ownership RLS and limits browser update privileges.
- Vocabulary Upgrade, word patterns, and linking expressions appear together below the annotated essay in the left Practice panel. Guided revision and the Band 8.0 action remain in the right feedback report. The essay and report use equal desktop columns; exam mode and original scoring remain on their existing paths.

The $0.005 ceiling is a budget reservation, not a guarantee of provider billing. The function records billed cost and reports failures. Task 1 examples carry a visible notice that the chart itself was not checked by the language transformation. In an authenticated local browser, the scored feedback, local analyzer, revision UI, and desktop layout were checked. The connected database lacks the new coaching table, so saving revisions and generating examples could not be verified there. No paid AI request was made.

## 1. Objective and scope

Help students understand feedback, revise their own work, and transfer improvements to the next answer. Implement for Academic Writing Practice, covering Task 1 and Task 2. Preserve existing exam behavior and scoring. General Training and a new exam replica remain outside this plan.

Priority order:

1. Guided revision using existing feedback.
2. Band 8.0 AI Model Transformation, displayed line by line.
3. Overused Words & Cohesion Analyzer.

Build the local analyzer first because it establishes an inexpensive foundation; release the complete learning flow in stages below. Defer open-ended examiner chat, live AI advice, paragraph-balance scoring, and automatic rescoring.

## 2. Verified current foundations

Source review on 23 September 2026:

- `WritingEditor.jsx` already supports word counts and practice/exam behavior.
- `FeedbackPanel.jsx` already presents priorities, corrections, criterion feedback, links to skill practice, and annotation navigation. Extend these rather than create another report.
- `TaskPanel.jsx` exposes stored sample answers in practice. Distinguish these question examples from a transformation of the student's own answer.
- `useWritingTestStore.js` stores current Task 1/Task 2 drafts in session storage, not a durable chain of assessed revisions.
- `generateDetailedFeedback/index.ts` uses adaptive marking, potentially multiple passes, input-hash caching, and quota reservations. Its compact annotations are not a full sentence-by-sentence rewrite.
- `aiModelRegistry.ts` registers the current Writing primary as `openai/gpt-6-luna`, with a 4,096-token marking output limit and a separate fallback chain.

These are local source findings, not deployment verification or measured learning outcomes.

## 3. Student journey

Choose question → Write → Get feedback → revise 2–3 priority issues → optionally compare the Band 8.0 example → Recheck revision → try another question independently.

The left annotation panel groups Vocabulary Upgrade with overused words, linking expressions, and paragraph flow. The right feedback report shows score, priorities, corrections, guided revision, and an optional Band 8.0 example. The revision section explains how to apply feedback and request an assisted recheck while preserving the original score. Grammar-specific practice links open Grammar Lab; writing issues without a corresponding exercise have no Practice Lab link.

Use the Learner Panel primitives from `@/features/dashboard/components/primitives.jsx`, hairline borders, semantic signal colors, and no heavy shadows or glass effects. Desktop can show paired text; mobile stacks Original, Suggested version, and Why. Support keyboard navigation, visible focus, readable text, and accessible difference labels.

## 4. Guided revision: highest learning priority

- Create Draft 2 from the student's original submission, never automatically from the AI example. Store up to five checked snapshots per session part; editing remains available after that.
- Show up to three existing feedback priorities alongside the editor.
- Allow the student to mark an issue Reviewed; this is not proof that it is resolved.
- Keep original text, scores, feedback, prompt/visual identity, and evaluation version immutable.
- Save draft edits and recover them after refresh. Store durable ownership-scoped revision records; Zustand only manages active UI state.
- Suggested record fields: owner, parent attempt, root attempt, task identity/type, prompt revision, draft version, canonical text, content hash, assistance exposure, evaluation reference, timestamps, status.
- Recheck is explicit and uses the existing full evaluator and normal evaluation allowance. No AI calls on typing, saving, or opening results.
- Show criterion changes, issues resolved or still present when supported by new feedback, and an AI-estimated score change. Never guarantee a positive delta.
- Keep assisted revision results identifiable in history and progress. Do not replace the original attempt or count repeated revisions as new independent readiness evidence.
- Compare only compatible task and evaluator versions; otherwise explain that direct score comparison is unavailable.

## 5. Band 8.0 AI Model Transformation: line by line

### Student experience

Button: Show Band 8.0 example. Supporting copy: “An AI example aiming at Band 8 features; not an examiner-certified score.” Display after feedback, with an invitation to try revising first rather than a mandatory gate.

Here, line means a sentence or meaningful sentence group, not a visual screen line. Every source sentence must be represented, including ones that need no change. Preserve paragraph ordering. Support one-to-many and many-to-one sentence mappings.

Each row shows:

- Original sentence, read from the saved submission.
- Suggested version, with local word-level differences.
- One short explanation where changed, tagged Clarity, Vocabulary, Grammar, or Cohesion.
- Already effective for unchanged text.

Illustrative row, not a scored Band 8 sentence:

| Original                                          | Suggested version                                                   | Why                                            |
| ------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| Many people use cars because cars are convenient. | Many people use cars because they offer a convenient way to travel. | Reduces repetition while retaining the reason. |

Show the complete transformed answer as a secondary reading view generated from the same stored response. Never make another AI call for differences, expansion, or the complete view.

### Generation contract

One optional request transforms the whole answer and provides at most three contextual language notes for the analyzer. Do not put this payload inside every marking pass. It must not assign or change a band score.

Proposed response:

- `schemaVersion`, `sourceHash`, `targetBand: 8`.
- `segments[]`: `sourceSentenceIds[]`, `revisedText`, `changeTags[]`, `shortReason`.
- `languageNotes[]`: candidate ID, contextual explanation, up to two appropriate alternatives or a keep recommendation.
- `limitations[]`: missing support, unclear source meaning, or factual uncertainty.

Canonical text and sentence IDs are generated deterministically before the request. Validate complete ordered source coverage, allowed tags, lengths, unique mappings, and correspondence to the saved input. Render originals locally to avoid paying for echoed source text. Treat essay content as untrusted input.

Preserve the student's position and intended meaning. Never invent studies, examples, chart values, units, or comparisons. If ideas are insufficient for Band 8, identify that limitation instead of disguising it with vocabulary. Task 1 requires the verified task visual or equivalent trusted structured data; if unavailable, clearly limit the result to language revision and do not claim full Task Achievement improvement.

### Cost limits

- One generation per eligible saved draft; reopen and repeat clicks reuse the result.
- Default entitlement: one successful transformation per saved session part, with one explicit retry after failure. Additional revisions remain editable and assessable under existing evaluation allowances.
- Initial full-answer eligibility ceiling: 600 essay words; longer answers remain assessable but transformation explains the limit. Do not silently truncate.
- Initial target ceilings: 4,000 text input tokens, 3,000 total billable output/reasoning tokens, 30 mapped sentence units, explanations up to 16 words. Validate feasibility with benchmark essays; revise caps before launch if coverage is insufficient.
- Task 1 image charges need a separate bounded allowance and provider-specific accounting; text estimates below exclude images.
- One attempt, no automatic model cascade or repair calls. A visible retry must use a fresh budget check, preserve billed failure accounting, and be limited to one retry per authorized generation job.
- Candidate model: the existing low-cost Writing primary, pending transformation quality benchmarks. Add a distinct registry route and centralized limits; do not change scoring model behavior to fund coaching.

## 6. Overused Words & Cohesion Analyzer

### Local analysis: no added AI calls

- Parse canonical text into paragraphs and sentences, then count content words and repeated short phrases.
- Exclude common function words; treat prompt terms, technical labels, and necessary Task 1 category names as context-sensitive candidates, not mistakes.
- Show counts, sentence locations, repeated openings, and paragraph distribution. “Repeated 4 times” is descriptive, never an automatic error or penalty.
- Use conservative normalization; avoid aggressive stemming that merges different meanings.
- Detect explicit linking expressions by function: addition, contrast, cause/result, sequence, and example. Surface reference expressions separately as candidates.
- Warn gently about repetitive sentence openings or a heavy concentration of linkers. Do not claim to understand argument logic or reference clarity through counting.
- Missing recognized linkers does not imply poor cohesion. Firstly and Moreover are not inherently wrong; Consequently expresses a result, not referential cohesion.
- Keep overview compact: at most five word/phrase candidates and three pattern observations, expandable without network requests.

### Contextual advice

Reuse existing grounded vocabulary/cohesion annotations wherever available. When the student requests the transformation, its single response may enrich up to three candidates with contextual advice. Before generation, show counts and existing feedback only. No separate analyzer AI request, dictionary synonym spraying, C1/C2 replacement requirement, or per-word generation button.

## 7. Budget model and enforcement

Using the repository's recorded Luna text rates of $0.10/M input and $0.50/M output, 4,000 input plus 3,000 billable output tokens would cost approximately $0.0019 per successful text-only transformation. This is a planning calculation from local configuration, not independently verified live pricing or an actual invoice. It excludes images, retries, hosting, and additional rescoring.

At those assumptions, 1,000 transformations cost about $1.90. If 25% of 10,000 eligible attempts request one, incremental successful text generation would be about $4.75. Relative spend can still rise substantially compared with a cheap existing evaluation; do not promise a fixed percentage increase without measured baseline data.

Before rollout:

- Verify provider prices and actual billed usage, including hidden/reasoning tokens and images.
- Establish baseline cost per evaluated practice attempt, including all marking passes.
- Reserve worst-case cost atomically before calls and settle actual billed usage, including rejected responses.
- The local migration reserves $0.005 per generation attempt against a $3/day shared transformation budget. The request caps output at 3,000 tokens and disables reasoning; actual provider cost is recorded afterward. These controls are not active until migration and function deployment.
- Enforce user entitlement, ownership, rate limits, concurrency, in-flight deduplication, and daily spend on the server.
- Cache key includes owner, task/prompt/visual identity, normalized essay with paragraph boundaries, target band, and transformation version. Do not rely on client storage for eligibility or caching.
- Persist a successful result before exposing it as complete; distinguish provider failure from persistence failure to avoid a second paid generation.
- Record feature-specific calls, tokens, actual cost, failures, cache hits, and generation latency without logging essay contents.
- Opening a panel, toggling differences, reading explanations, or revisiting a result must cost zero additional AI tokens.

## 8. Implementation sequence and code touchpoints

### Phase A: foundations and zero-call learning tools

Create canonical text/sentence utilities, local analyzer, and feature flags. Integrate with WritingEditor and FeedbackPanel. Validate metadata and legacy HTML handling. No scoring changes.

### Phase B: durable guided revision

Add revision persistence with ownership policies and server-side immutable-original enforcement. Extend useWritingTestStore, WritingTask, useWritingFeedback, and history integration. Reuse evaluator/quota contracts for explicit rechecks. Define assisted-attempt analytics before enabling score deltas.

### Phase C: one-shot transformation and enriched analyzer

Add a dedicated authenticated transformation function/provider/schema; register route, rates, and bounds in aiModelRegistry. Implement reservations, entitlement, cache, in-flight deduplication, and durable result storage. Add BandTransformationView and connect contextual notes to the analyzer. Task 1 validation is required before enabling Task 1 generation.

### Phase D: bounded pilot

Release behind flags after approval. Observe cost per eligible attempt, take-up, successful complete transformations, revision completion, latency, and repeated failure rates. Expand only within budget and after quality review.

## 9. Acceptance criteria

Automated checks:

- Canonical parsing handles HTML entities, blank paragraphs, abbreviations, decimals, duplicated sentences, and Unicode without losing text or corrupting anchors.
- Analyzer never treats ordinary function words, missing linkers, or count thresholds as scoring rules.
- Transformation covers every sentence exactly once through ordered mappings; rejects fabricated IDs, partial output, oversized content, and unsafe markup.
- Task 1 examples preserve data, labels, units, and trends; curated human-reviewed fixtures cover charts, maps, and processes.
- Revision survives refresh, preserves original assessment, isolates users, and does not inflate independent readiness evidence.
- Repeated clicks and concurrent requests produce at most one paid successful job; failures reconcile reservations correctly; budgets and entitlements cannot be bypassed with minor edits.
- Old reports without new fields continue to render; coaching failures do not block scores.
- Practice enhancements do not appear during an active exam.

Validation gates:

- Relevant unit/integration and database authorization tests, lint, build, and existing scoring-consistency regressions.
- Browser verification of write → feedback → revise → recheck → reopen, plus transformation/analyzer flows, at desktop and 390px mobile, with keyboard navigation and light/dark themes.
- A bounded benchmark set spanning Task 1/2, weak/strong answers, short/long submissions, and factual traps. Measure full-response coverage, meaning preservation, explanations, failure rate, latency, and billed cost before choosing final caps.
- Educational success: students resolve specific issues and repeat fewer of them on later independent questions. Score increases on assisted rewrites alone are insufficient.

## 10. Assessment reference

Align explanations with the official IELTS Writing band descriptors: https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf . Paragraph proportions and rare vocabulary are not standalone scoring rules. Band 8 is a whole-response standard, not a label a single rewritten sentence can earn.
