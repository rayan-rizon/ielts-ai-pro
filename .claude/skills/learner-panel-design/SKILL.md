---
name: learner-panel-design
description: Convert a learner-facing page (Analytics, Leaderboard, Study Groups, Vocabulary, etc.) to the compact instrument-panel design system built for /dashboard — primitives, layout rules, copy principles, and a page-by-page checklist.
---

# Learner panel design system

This is the design system built for `src/features/dashboard/` (July 2026 rework). Use this
skill whenever asked to redesign, modernize, or "match the new dashboard UI" on any other
learner-facing page. It is not a visual reskin — it is a set of rules that keep data honest
and layout self-correcting. Follow the rules, don't just copy class names.

## When to use this

Trigger phrases: "match the new UI", "make it like the dashboard", "use the same design
system", "apply the instrument panel style", or a direct ask to redesign one of the pages
listed in **Target pages** below.

Do NOT use this for admin pages — those already have their own mirror system at
`src/components/admin/ui/primitives.jsx` (graphite palette, same shapes). Use this one for
anything under `src/features/*/pages/` that a _student_ sees.

## Where everything lives

- `src/features/dashboard/components/primitives.jsx` — the primitive library. Import from
  here; do not redefine `PANEL`, `NUM`, etc. locally in a new feature. If a new page needs a
  primitive that doesn't exist yet, add it to this file (or promote it to a shared location
  if a second feature will need it) rather than forking it.
- `src/features/dashboard/components/skillLabels.js` — `formatSkill()`, `stripModulePrefix()`,
  `modulePage()`. Reuse these for any UI that renders a `skill_proficiency.skill_code`
  anywhere outside the dashboard (e.g. an Analytics deep-dive).
- `src/features/dashboard/components/DashboardGrid.jsx` and `StatBand.jsx` — reference
  layouts. Read these before starting a conversion; they are the canonical example of every
  rule below applied together.

## Core principles (the part that actually matters)

**1. Numbers must be true, not just present.**
Before wiring a stat to data, know exactly what the underlying field counts. Two bugs found
and fixed in this system illustrate the failure mode:

- A card said "across 470 sessions" when the field (`practice_count`) actually counts
  _questions answered_, not test sessions — one test contributes dozens at once. The fix was
  reading the DB trigger that writes the field, not guessing from the name.
- A label-lookup dict (`SKILL_LABELS`) had keys like `TFNG`, `MCQ`, `Task 1` that never
  matched a single real `skill_code` in the database — confirmed by querying live rows.
  100% of labels were silently falling through to a generic formatter. The dict was dead
  weight standing in for real behavior nobody had verified.
  Rule: when a page shows a number or label sourced from the DB, read the query/RPC/trigger
  that produces it before writing the copy around it. If you can't verify it, say less, not
  more.

**2. Measured, never projected.**
Show what happened, not what will happen. The "Exam" stat tile shows weeks left and the
practice rate _right now_ — never a predicted exam-day band, because that number can't be
known. The "Band trajectory" chart footnote states the actual delta between the first and
last scored test in the window, never an extrapolated trend line.

**3. Honest empty states.**
Every card that can render zero data has an explicit empty state via the `Empty` primitive
— never a zero that looks like a real measurement, never a silently blank card. Match the
existing tone: state what's missing and what produces the number ("No scored tests yet —
your band history charts here"), not a generic "No data".

**4. Grids fill their container; they don't scroll or float.**
If a page has a custom visualization (heatmap, bar row, timeline) sized in fixed pixels, it
will either overflow-scroll or leave dead space the moment its column width doesn't match a
guessed pixel size — this happened to the practice-history heatmap (14px cells left 132px of
unused space in a 350px card). Use `flex-1` + `aspect-square` (or an equivalent
container-driven size) so cells size themselves to whatever width the grid column actually
gives them. Never hardcode a pixel width for something living in a responsive grid column.

**5. One card, one file, one job.**
Each panel is its own component under `components/`, `React.memo`-wrapped, with a
`displayName`. Data transforms (filtering, sorting, deriving deltas) happen in a `useMemo`
inside the component that renders them — not upstream in the hook — unless two cards need
the same derived value. The hook (`useDashboardData.js`-equivalent) only fetches and does the
minimal reshape needed to hand each card its own props.

**6. Reading order is priority order.**
Order cards top-to-bottom / left-to-right by what the student needs first: standing, then
whether it's moving, then what to do about it, then why, then supporting effort/history data,
then reference material last. Don't order by data-source convenience.

## Primitive reference (import from `dashboard/components/primitives.jsx`)

| Primitive                       | Use for                                                                                                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PANEL`                         | The card shell class — border, gradient bg, both themes                                                                                                                           |
| `WELL`                          | Quiet inset surface: meter tracks, nested rows                                                                                                                                    |
| `TILE`                          | Nested tile one step quieter than `PANEL`                                                                                                                                         |
| `NUM`                           | Every rendered number — mono tabular-nums                                                                                                                                         |
| `MICRO` / `MUTED`               | Uppercase micro-labels / secondary text                                                                                                                                           |
| `TITLE`                         | Card heading text                                                                                                                                                                 |
| `Panel`                         | Polymorphic card wrapper (`as="section"` etc.)                                                                                                                                    |
| `PanelTitle`                    | Card header: rail + heading + optional tip + optional right-side action                                                                                                           |
| `PanelFootnote` / `FootNum`     | The closing summary line every card ends with — use these, don't hand-roll the border-top/text classes again                                                                      |
| `Stat`                          | KPI tile (icon, label, big value, sub). Pass `size="sm"` for a dense stat row — this variant already existed unused until this pass; use it by default for any new multi-stat row |
| `Ring`                          | Single-value donut — use where one ratio is the whole story (a mastery %, a completion %), not for anything with more than one series                                             |
| `Meter` / `Bar`                 | Horizontal fill meters                                                                                                                                                            |
| `Delta`                         | Signed change, colored — never hand-roll a +/− span                                                                                                                               |
| `Empty`                         | Empty state — icon + one line, never blank                                                                                                                                        |
| `Pill` / `IconChip`             | Small tags and icon badges, both keyed off a `tone`                                                                                                                               |
| `Tip` / `InfoTip`               | Hover tooltip / "what does this mean" affordance next to a metric                                                                                                                 |
| `FADE_UP` / `STAGGER_CONTAINER` | Framer-motion variants — every card wraps in `<m.div variants={FADE_UP}>`, the page wraps in `STAGGER_CONTAINER`                                                                  |

Signal tones (`ok` / `warn` / `fault`) come from CSS vars in `src/index.css`
(`--signal-ok`, `--signal-warn`, `--signal-fault`, defined per light/dark). Use
`rgb(var(--signal-ok))` etc. — never a hardcoded green/amber/red hex, so both themes stay in
sync automatically.

## Layout rules

- Grid: `grid grid-cols-12 gap-3`, cards take `col-span-12` on mobile, split at `md:`/`lg:`
  into their real proportions. Look at `DashboardGrid.jsx` for the exact span pattern before
  inventing a new one.
- Stat rows: `grid grid-cols-2 gap-2 lg:grid-cols-5` (or however many stats), `Stat
size="sm"` for anything beyond 3 tiles so the row stays a strip, not a wall.
- Every page needs a skeleton loader that **mirrors the real grid exactly** — same
  `col-span` values, same card count, same approximate heights — or the page reflows when
  data lands. Check `DashboardSkeleton.jsx` for the pattern: one skeleton block per real card,
  same order.
- Dark mode is class-based (`document.documentElement.classList` gets `dark`/`light`, driven
  by `ThemeProvider` at `src/components/theme-provider.jsx`), not
  `prefers-color-scheme` media queries directly — always pair a class with its `dark:`
  variant, and test by toggling the root class, not just OS scheme.

## Conversion checklist for an existing page

1. Read the page's current data hook fully. For every value rendered, find where it's
   queried (Supabase `.from()`/`.rpc()`) and confirm what it actually measures — don't trust
   the variable name.
2. List every stat/chart/list currently shown. Decide what's dead (unused fetch, unreachable
   label map, a card superseded by something better) and delete it — don't leave a "just in
   case" branch.
3. Redraw the reading order: standing → movement → action → why → effort/history →
   reference. Sketch the grid spans before touching JSX.
4. Rebuild each card as its own file using the primitives table above. Copy the shape of the
   closest existing dashboard card rather than starting from a blank component.
5. Write (or update) the skeleton to match the new grid 1:1.
6. Lint (`npx eslint <path> --ext .js,.jsx --fix`) and build (`npx vite build`) — zero errors
   before visual QA.
7. Visual QA in the Browser pane: real logged-in data, light AND dark (toggle the root
   class), desktop AND 375px mobile (check `document.body.scrollWidth === window.innerWidth`
   for zero horizontal overflow), console errors clean.
8. If the page has any custom-drawn grid/visualization, measure its actual rendered width vs.
   its container width via `getBoundingClientRect()` before declaring it fixed — don't eyeball
   a screenshot and assume it fits.

## Target pages (as of this pass)

Still on the pre-rework glassmorphic style (`backdrop-blur`, `data-oid` attributes, Card/
CardContent shadows) — grep confirmed, ordered by likely value as a next conversion:

- `src/features/analytics/pages/Analytics.jsx` — highest value, directly adjacent to the
  dashboard's "Band by module" and "Question types to fix" cards link here already.
- `src/features/gamification/pages/Leaderboard.jsx`
- `src/features/community/pages/StudyGroups.jsx`
- `src/features/core/pages/BandScoreCalculator.jsx`

Lower priority / different audience (admin or auth flows already have their own system, or
are low-traffic utility pages): `AdminPanel`, `AdminUserDetails`, `AdminLogin`, `Login`,
`ForgotPassword`, `UpdatePassword`, `Error500`, `NotFound`, `LandingPage`,
`TermsOfService`.

Re-grep before starting a conversion — this list is a snapshot, not a live source of truth:

```bash
grep -rln "backdrop-blur\|data-oid=" src/features/*/pages/*.jsx
```
