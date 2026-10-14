# Writing feedback v2: audit and plan

Status: implemented 2026-10-13 (uncommitted; the generateDetailedFeedback edge function still needs deploying for the new AI fields).

Changes from this plan made during review:

- The official criterion names are the labels (owner request), with the plain question in a tooltip.
- The margin-note column was dropped because it narrowed every paragraph. A marker note now sits under its own paragraph, only when one exists.
- The band ring and 2×2 criterion tiles return, without the glow.
- New finding, fixed: the essay was sent to the AI marker with every paragraph break removed, so Coherence and Cohesion was marked on one block. The marker now gets paragraphs; the cache key is unchanged.
- New finding, fixed: the server's quote stripping removed the opening quote mark from notes that start with a quotation, and its text limits cut fixes and strengths off with "...".

Scope: the result screen after a Writing task is marked. That is
`FeedbackPanel.jsx` (right pane: the report), `AnnotatedText.jsx` (left pane: the
marked essay plus vocabulary, linking and paragraph tools), `WritingCoach.jsx` (revise
and Band 8 example) and `writingReportPdf.js`. The AI contract is in
`supabase/functions/_shared/writingEvaluation.ts`.

How this was checked: I read the code, then rendered the real components with a
realistic Task 2 result (196 words, 6 annotations, 3 priorities) at laptop width and
clicked through them.

---

## 1. Is it showing everything properly? No. Eight concrete problems

| #   | Problem                                            | Where                                                                                                                      | What the student sees                                                                                                                                                                                               |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Paragraphs are flattened**                       | `AnnotatedText.jsx:1230` replaces every whitespace run, line breaks included, with a single space                          | Their 5-paragraph essay shows as one block. Paragraphing is part of Coherence & Cohesion, and they can't see their own structure. The "Paragraph flow: 5 paragraphs" card below contradicts what they're looking at |
| 2   | **Overlapping mistakes disappear**                 | `filterNonOverlapping` keeps the first range and drops any that overlap it                                                 | "people is" sits inside a longer "clarity" highlight, so it's never highlighted. The filter still says "3 Errors" but only 2 are visible, and Priority 2's "Show in my essay" points to the hidden one              |
| 3   | **Corrections are cut off, with no way to expand** | `compactUiText(…, 88)` on the original and correction, 112 on the explanation                                              | Long fixes read "When people is not paying… → If people did not have to pay…, which…". The most useful rewrite is unreadable                                                                                        |
| 4   | **The #1 action is truncated in the hero**         | `takeaway.nextAction = priority.action.preview`                                                                            | "Add 2–3 sentences explaining how the government could fund it, for example by taxing private cars, and why…" is cut mid-sentence at the top of the page                                                            |
| 5   | **The examiner's summary is never shown**          | `summary` is generated, saved and printed in the PDF, but not rendered                                                     | Students get "6.0, Solid Task 2 response" but never the sentence explaining _why 6.0_                                                                                                                               |
| 6   | **Task 1 chart analysis is hidden**                | `taskAnalysis` (chart type, whether the answer matched it, the features it saw) is only used as an internal evidence check | A Task 1 student never learns "we read this as a line graph and you missed the overall trend", which is the single most useful Task 1 note                                                                          |
| 7   | **No reason for each criterion's score**           | The schema returns only numbers per criterion                                                                              | "Grammar 5.5" with no sentence about why. Priorities cover only 3 issues and may not touch the lowest criterion                                                                                                     |
| 8   | **Two-column cards squeezed**                      | Strengths and Priorities use the `xl:grid-cols-2` _viewport_ breakpoint, but the report is half the screen                 | At a typical laptop width, each card is about 300px wide, and priority text wraps into tall narrow columns that need "More" clicks                                                                                  |

## 2. Hard to understand: jargon and vague labels

- **Criterion codes:** "TR/TA", "CC", "LR", "GRA" appear above the full names, so the same thing is said twice and the code means nothing to students.
- **"Solid Task 2 response":** a generic label made from the band. It says nothing the number doesn't.
- **The marking line:** "sent for 2 independent markings, agreed within 0.5 band" is examiner jargon in the hero.
- **The essay legend:** "INTERACTIVE FEEDBACK MODE", then "3 Errors · 2 Warnings · 1 Suggestions · 1 Good · 7 Highlights". There are five categories, "Highlights" is actually the total, and "Warnings" means nothing to a student.
- **Badges and prefixes:** "DO:", "Correction" vs "Consider", "Why it matters:". Three different labelling systems.
- **The combined band** shows a formula ("Task 1 × ⅓ + Task 2 × ⅔") instead of what it means.
- **The word-count warning** says "Language criteria are still judged from what you demonstrated" (jargon). Being under 250 words caps Task Response, and that is often the #1 issue, yet it sits in a side banner.

## 3. Unnecessary or repeated

- **The same point appears three times.** "poor people / traffic repeated" shows up in Priority 3, in Vocabulary ideas and in Repeated words.
- **Repeated words is mostly noise.** 4 of the 5 entries are words from the question ("people", "transport", "free", "public"), each followed by "repetition may be necessary".
- **"How your ideas connect" only counts linkers.** "Contrast: 1 use, however" gives no judgement, and the card itself says it doesn't grade cohesion. That's a lot of space for very little.
- **"Open Grammar Lab" repeats** under every grammar correction instead of appearing once.
- **The disclaimer appears twice:** once in the hero and once in the footer.
- **Decoration that breaks the Learner Panel system:** the glowing gradient score ring (SVG blur filter), gradient buttons, `shadow-2xs` on every chip, ALL-CAPS micro labels everywhere, and hard-coded emerald and amber instead of the signal tokens.
- **"Apply correction" quietly rewrites the student's draft** in the editor. That can be useful for revising, but the label doesn't say so.

## 4. What's already good (keep)

- **Adaptive marking with a per-criterion median** is genuinely more reliable than one-shot marking. It's worth stating plainly, not as jargon.
- **Annotations are grounded in the essay** and can be clicked, applied or dismissed. The popover is clean.
- **Vocabulary ideas** show the student's own sentence, then alternatives with an "Add" to vocabulary. That makes a real learning loop.
- **WritingCoach:** revise and recheck (5 checks), plus a Band 8 example with reasons per change. This is the strongest feature, but it sits at the very bottom.
- **Error, pending and quota states** are already well handled.

---

## 5. Design plan

The design system is fixed by `AGENTS.md`: Learner Panel primitives, hairline rules, no glow, accent `#5a63df`, signal tokens. The plan works inside it. It uses the same reading order as the new Speaking report, so both modules teach students one way to read a report: **score → why → one next step → evidence → practice**.

**Palette (existing tokens):** panel `#ffffff→#faf9ff`, hairline `#e4e2f0`, ink `#0f172a`, accent `#5a63df`, signal fault / warn / ok. Mistakes use fault, better-wording ideas use accent, and good phrases use ok. That's three meanings and three colours.

**Type:** the app sans for UI. The essay stays in the existing serif in the left pane, because it is the student's document, and a serif tells "your writing" apart from "our feedback". `NUM` is used only for scores and counts. Sentence-case headings, no ALL-CAPS labels.

**Signature element: margin notes on the essay.** It comes from how a teacher marks a paper. On desktop, each paragraph of the student's essay gets a short note in a narrow right margin, e.g. "Body 2: reason given, no example" or "Conclusion: repeats the intro; add your final view". Notes link to the priority they come from. This makes structure, the hardest feedback to understand, visible where it happened. It's built from data we already have (priority `evidenceText` and annotation positions mapped to paragraphs), plus one optional short AI field per paragraph (§7). On phones, the notes become a line under each paragraph.

**Layout (desktop: essay pane left, report pane right, as today):**

```
┌ My essay (left) ─────────────────────────────┬ margin ─────────┐
│ Legend: ● Mistake 3  ● Better wording 3  ● Good 1               │
│ ¶1 Nowadays, many people believe…  [In my opinion, I agree]   │ Intro: clear    │
│                                                               │ position ✓      │
│ ¶2 Firstly, free public transport… [people is] …              │ Body 1: reason  │
│                                                               │ + example ✓     │
│ ¶4 However, some people think… But I think government…        │ Counter-view in │
│                                                               │ 1 line: develop │
│ ── Better words for this essay (vocabulary ideas, merged) ──── │
│ ── Paragraph flow (openings of each paragraph) ──────────────── │
└──────────────────────────────────────────────────────────────┴─────────────────┘

┌ Report (right) ───────────────────────────────────────────────┐
│ 6.0 overall  ┃ Task response 6 ▮▮▮▮▮▮  "Clear view; other side  │
│ Task 2       ┃   not developed"                                │
│              ┃ Organisation 6.5 …  Vocabulary 6 …  Grammar 5.5 │
│ Why 6.0: <summary, 2 sentences>                                │
├────────────────────────────────────────────────────────────────┤
│ Your next step   [Task response]                               │
│ Explain the other side of the argument                         │
│ Add 2–3 sentences on how free transport could be paid for…     │
│ From your essay: "But I think government can take money…"      │
│ [Show in my essay]  [Revise this paragraph]                    │
├────────────────────────────────────────────────────────────────┤
│ Also work on   2. Grammar …   3. Vocabulary …  (full text)     │
├────────────────────────────────────────────────────────────────┤
│ Fix these mistakes (6)   Grammar 3 · Word choice 2 · Clarity 1 │
│  people is → people are   A plural subject needs a plural verb │
│  When people is not paying… → If people… [Show full sentence]  │
│  [Practise in Grammar Lab]  (once, under the group)            │
├────────────────────────────────────────────────────────────────┤
│ Revise and recheck  (WritingCoach, promoted)                   │
│ Band 8 example                                                 │
├────────────────────────────────────────────────────────────────┤
│ What's already working  ✓ …  ✓ …                               │
└────────────────────────────────────────────────────────────────┘
```

Left-aligned throughout. The report is one column at every width (the 2-column card split goes), so the text never squeezes.

**Plan review against the brief:**

- I first sketched a big band tile with four KPI stat tiles, which is the generic SaaS score page. I dropped it, because a number doesn't help a learner; the _reason_ does. Scores now carry one-line reasons inline.
- Numbered "01/02/03" markers stay only on the priorities, where order really is the priority.
- The margin notes are the only bold idea. Everything else is quieter than today: fewer labels, fewer colours, no glow.

## 6. Plain-English copy (examples)

| Now                                                             | Proposed                                                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| TR/TA · Task Response                                           | Task response, with the line "Did you answer every part of the question?"                                  |
| CC · Coherence & Cohesion                                       | Organisation, with the line "Are your ideas in a clear order and well linked?"                             |
| LR · Lexical Resource                                           | Vocabulary, with the line "Do you use the right words, and enough different ones?"                         |
| GRA · Grammar & Accuracy                                        | Grammar, with the line "Are your sentences correct and varied?"                                            |
| Solid Task 2 response                                           | _(removed; the summary says it better)_                                                                    |
| sent for 2 independent markings, agreed within 0.5 band         | Marked twice. Both marks were within half a band.                                                          |
| 3 Errors · 2 Warnings · 1 Suggestions · 1 Good · 7 Highlights   | Mistakes 3 · Better wording 3 · Good 1                                                                     |
| DO:                                                             | _(dropped; the action is the second line)_                                                                 |
| Correction / Consider                                           | Mistake → fix / Better wording                                                                             |
| Below the 250-word minimum… Language criteria are still judged… | Your essay has 196 words. Under 250 words limits your Task response score, so add one more developed idea. |
| Task 1 × ⅓ + Task 2 × ⅔                                         | Task 2 counts twice as much as Task 1.                                                                     |
| Apply Correction                                                | Use this fix in my draft                                                                                   |

The official criterion names stay in the PDF and in a tooltip, so students still learn the real terms.

## 7. Phases and cost

**P0: fix what's broken ($0, about 1 day)**

1. Keep paragraph breaks in the annotated essay. Collapse only spaces and tabs, and match annotations with a whitespace-tolerant search (#1).
2. Overlaps: when one highlight sits inside another, show the inner, more specific mistake and list the outer one in the same popover. Never drop one silently. Make the legend counts match what's visible (#2).
3. Remove truncation on corrections, priorities and the hero. Long fixes get "Show full sentence" (#3, #4).
4. Render `summary` as "Why you got 6.0" (#5).
5. One-column report so cards never squeeze (#8).

**P1: hierarchy, copy, design system ($0, about 2 days)**

- New order as in the wireframe. Priority 1 becomes the hero; the WritingCoach "Revise and recheck" is promoted under it.
- Plain-English copy from §6. Remove the duplicate disclaimer and the repeated links.
- Merge Repeated words into Vocabulary ideas and exclude question words. Collapse the linker counts into one compact line.
- When under the word count, that becomes the next step (deterministic), not a side banner.
- Learner Panel restyle: no glow ring, no gradients, signal tokens, sentence case.
- Rename the mobile tabs: Report · My essay · Question · Edit.

**P2: richer evidence (small AI addition)**

- Add `criterionNotes` (one plain sentence per criterion, B1 English) and `paragraphNotes` (one short note per paragraph, up to 6) to the existing marking call. No new call. That's about +250 output tokens per pass, roughly **+$0.00013 per pass** on Luna and at most about $0.0004 with three passes. Notes come from the median pass, or from the first pass when criteria agree.
- Task 1 card "What the marker saw in the chart", from the existing `taskAnalysis` (free). It shows a clear warning when `alignment` is `mismatched` or `partial`.
- Margin notes on the essay (the signature element), built from `paragraphNotes` plus priority evidence.
- Bump `FEEDBACK_EVALUATOR_VERSION` only if the cache must refresh. Old saved reports simply show no notes.

**P3: PDF**

- Mirror the new order: band with reasons, why, next step, mistakes in full, paragraph notes, and the Task 1 chart note. The PDF already prints the summary.

## 8. Verification

- Unit tests for paragraph-preserving segmentation and nested annotations.
- Render tests with long corrections (no ellipsis), overlapping annotations, Task 1 with a mismatched visual, under-length essays, and old reports without the new fields.
- A visual check at 1280, 1440 and 375px, in light and dark.
