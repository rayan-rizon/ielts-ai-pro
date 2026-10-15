# Admin AI test creation and safe previews

In Test Management, Reading and Listening both offer **Create with AI**.
Provide all source material together: all three Reading passages or all four
Listening audioscripts and all questions. A complete numbered answer key is optional.
Text and screenshots can be combined. The question count follows a pasted key;
set it manually when the key is supplied as an image.

AI transcribes and arranges the supplied material and creates grounded
explanations. With no key, it solves from the passage/transcript; the review labels
these as AI-inferred answers and lets the admin correct them. A supplied key is
preserved and must be complete. Every explanation quotes actual source evidence. Coloured
answer highlights in source images are mapped to the relevant scored questions.
Unreadable, unsupported, contradictory, or incomplete sources return an error
and keep the input for correction.

Listening needs an audioscript (plain text, screenshots, or existing SRT) for
explanations. Add optional HTTPS audio links per part, or upload recordings in
the editor after saving the draft. AI does not invent audio or timestamps.
Maps and diagrams needing missing coordinates are rejected rather than silently
converted to a different question type.

Review the generated content and open **Student preview** to inspect the complete
layout. **Save inactive draft** atomically inserts
a new passage and question rows. It cannot replace an existing test. Retrying a
lost response uses the same request ID and does not duplicate the draft. Publish
separately in Test Management.

Reading imports preserve separate instruction paragraphs and actual box headings.
Paragraph matching keeps A–E in the answer dropdowns without a redundant letter
list; Roman heading lists use their source heading or **List of Headings**.
Summary headings such as **Facial Vision** stay above the continuous inline-gap
text. The student renderer also repairs question-range-only box titles and flat
plain-text instructions in older drafts, without rewriting saved test records,
question numbers, or answers. Legacy rich-text instructions keep their markup
and pass through the existing HTML sanitizer.

The existing Reading and Listening editors offer **AI explanations**. Select one
passage/part or all, generate, review the quoted evidence, then apply to the
editor. The action changes explanation data only; the normal editor save keeps
it. Existing correct answers and IDs are preserved.

All four editors offer **Full preview**. Preview answers, notes, flags, local
results, writing samples and speaking responses do not create student sessions
or submit/evaluate work. Reading and Listening reuse their learner question
renderers and scorers; Writing reuses its task panel and editor; Speaking reuses
its header, conversation messages and cue card. Speaking microphone/examiner
calls are disabled in preview. Preview clocks are fixed display values.

Opening a saved test preserves its published/draft status and title. Reading and
Writing autosave only actual editor changes, and pause while preview/review is
open. Listening retains its existing local-only autosave for new tests.

## Backend and limits

- Routes: `admin-reading-draft`, `admin-listening-draft`.
- Registry: Luna primary with reasoning off; GLM-5.3 Flash once on failure with
  low reasoning (the model requires reasoning). Up to 28,000 output tokens
  accommodates full source transcription and explanations; timeout stays bounded.
- Authentication: verified user, admin profile, and existing `is_admin` MFA/recovery gate.
- Generation writes usage telemetry only; it cannot save or publish tests.
- Save RPCs use SECURITY INVOKER, insert-only transactions and inactive status.
- Up to 40 scored questions, 8 compressed images, 6 MB combined image data, and
  60,000 source text characters per generation.
- Audio URLs are not sent to AI and are assigned in original part order.

The new backend routes/RPCs were activated on 14 October 2026. Frontend changes
are verified on localhost; this work did not deploy the production website.

## Accidental-change protection

All four test modules start with changes locked on each admin management visit.
Test titles and the Full preview button open the isolated student preview without
mounting an editor or its autosave hooks. Edit, Delete and bulk Activate/Draft/Delete
are disabled until the admin types `UNLOCK` in Unlock changes. Export, duplication
and creation remain available; duplication creates an inactive copy.

Saving or leaving an editor, switching modules, completing a bulk status operation,
or closing a delete dialog locks changes again. The admin can also lock manually.
Delete requires the exact stored test title (ID for untitled tests); bulk delete
requires `DELETE N TESTS`. Confirmation resets when the target or selected IDs
change, and pending confirmation prevents duplicate submits and closing.

This is a session-local UI accident guard, not a persistent database lock or a
replacement for admin authorization. Existing delete operations are permanent;
Trash/Restore and atomic backend deletion are separate work. No existing test
content, publication status, questions or student results are changed by locking.

## Editor history and responsive header

Reading, Listening, Writing and Speaking now share full editor Undo/Redo snapshots
covering content, question groups and metadata. History remains in memory for the
current editor visit, keeps up to 60 snapshots, and discards the redo branch when
a new change follows Undo. Writing/Speaking wait for initial hydration before
starting history. It does not restore deleted tests or previous editor visits;
existing editor save/autosave behavior still applies.

The shared header places the title and primary actions on the first row, with
metadata and preview controls wrapping below. On narrow screens the action row
moves below the title. Undo/Redo buttons have accessible names and disabled states.
The Editing unlocked notice disappears after 4.5 seconds; dismissing the notice
never changes editing authorization. Session locking behavior is unchanged.

## Explanation style and traps

The existing 1,920 Cambridge explanations average 33 words for the main reason,
with a median of 32 and a 90th percentile of 49 (read-only audit on 14 October
2026). Both AI creation and AI explanation generation share a style prompt:
simple, familiar English, normally 25–45 words, pointing directly to the
decisive source detail. Supporting quotes and keyword pairs remain separate.
Generated reasons above 70 words are rejected rather than silently clipped.

Grounded Common trap notes stay within 180 characters and are preserved in
`explanation_data`, including composite blanks. Optional tempting choices must
be actual incorrect labels and can never be an accepted multi-select choice.
The current learner explanation component displays these notes; the AI review
shows them before saving. Existing explanations and reviewed trap annotations
are not rewritten.

The checklist has been removed from both AI creation and AI explanations.
Creation shows grouped completeness warnings for missing source text, question
numbers/text, answers, reasons/evidence and answer highlights. Missing required
content blocks saving; absent highlights are advisory. NOT GIVEN questions do
not require a highlighted answer phrase. Schema, source-evidence validation,
inactive saving and stale-source checks remain in force.
