# Admin AI test creation and safe previews

In Test Management, Reading and Listening both offer **Create with AI**.
Provide all source material together: all three Reading passages or all four
Listening audioscripts, all questions, and one complete numbered answer key.
Text and screenshots can be combined. The question count follows a pasted key;
set it manually when the key is supplied as an image.

AI transcribes and arranges the supplied material and creates grounded
explanations. It must retain the answer key and exact quoted evidence. Coloured
answer highlights in source images are mapped to the relevant scored questions.
Unreadable, unsupported, contradictory, or incomplete sources return an error
and keep the input for correction.

Listening needs an audioscript (plain text, screenshots, or existing SRT) for
explanations. Add optional HTTPS audio links per part, or upload recordings in
the editor after saving the draft. AI does not invent audio or timestamps.
Maps and diagrams needing missing coordinates are rejected rather than silently
converted to a different question type.

Review the generated content and open **Student preview** to inspect the complete
layout. After checking the review box, **Save inactive draft** atomically inserts
a new passage and question rows. It cannot replace an existing test. Retrying a
lost response uses the same request ID and does not duplicate the draft. Publish
separately in Test Management.

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
- Registry: Luna primary, GLM-5.3 Flash once on failure; bounded output and timeout.
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
