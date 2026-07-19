# Analytics results and journey design

## Goal

Make completed practice actionable from the analytics dashboard while matching the supplied milestone and pacing references without inventing learner data.

## Interaction design

- The page heading is `Analytics Dashboard`; the time-aware greeting moves into the supporting line.
- `View all` opens an accessible, scrollable dialog containing every completed session in the selected timeframe.
- Every recent-session row has a `View result` action.
- Reading and listening sessions with complete answer statistics reuse the existing detailed test-result modal. Older or module-specific sessions use a concise result dialog and offer the product's full report route.

## Visual design

- Band Journey becomes an ascending, curved milestone canvas: baseline, earned/intermediate half-band milestones, current, future milestone, and target. Only baseline/current are observations; intermediate nodes are clearly presented as milestones.
- Score Prediction is restored as a visible overview card and uses the existing guarded 30-day regression output.
- Pacing uses paired purple `You` and translucent `Ideal` bars, with per-module deltas below the chart. Missing timing stays unavailable.
- Recent Practice History becomes a full-width table, matching the supplied reference and preserving a compact mobile card view.

## Data rules

- Sessions remain restricted by the existing user-scoped Supabase query and RLS.
- Band, accuracy, timing, criteria, and feedback come only from the selected completed session.
- Timestamp spans are not used for pacing. Missing answer or timing facts render as unavailable.
- No database schema change is required.

## Verification

- Unit-test recent-session normalization, result payloads, pacing deltas, and journey milestones.
- Run lint, TypeScript, focused Vitest, and the production build.
- In browser QA, verify the `View all` dialog, a `View result` flow, score prediction visibility, desktop/mobile layouts, and console health.
