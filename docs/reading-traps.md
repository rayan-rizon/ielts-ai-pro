# Reading traps

All 48 Reading tests are supported by a local annotation catalogue. Answer
explanations show a short `trap` and, where applicable, `tempting_answer` after
submission. There are 1,477 notes and 631 tempting answers. Notes stay within 110
characters and 18 words. Questions without a useful trap show no note.

The catalogue has no runtime AI calls or external API requests. `withReadingTraps`
attaches notes only when the reviewed passage, question text/type, answer key,
options, structured question data and explanation still match. It preserves the
database explanation and suppresses notes made stale by a content edit.

A tempting answer is shown only when it is a wrong available choice or a phrase
present in the passage. Accepted answer variants, including multi-select answers,
are filtered through the same answer normalization used for scoring.

The compact annotation file is the only trap catalogue included by the
learner-facing Reading feature. Regression tests check every note and use a
synthetic passage to verify matching, immutable attachment and stale-note
suppression without duplicating the test passages in the repository.
