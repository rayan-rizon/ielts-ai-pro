# Institution panel and history verification — 3 October 2026

## Changes

- `/institution` now uses a dedicated institution layout, with Overview, Students, Buy seats, Billing, and Settings. It does not mount the learner sidebar, learner promotions, or product tour.
- `/institution/accept` also uses the institution layout. The learner sidebar offers an explicit panel switch for owners, outside the learner navigation group.
- Platform-admin management remains under `/admin/panel?tab=institutions`. Its separate Pricing and History tabs keep administrative records and controls out of the owner's panel.
- **Open institution panel** shows a labelled owner-panel preview with the administrator's own authenticated session. No impersonation or permission change is involved.
- Seat statuses, free allocations, pricing types, durations, and billing states have readable labels. Pricing forms explain global versus institution-specific rules and avoid asking admins to enter a technical quantity of 1.
- Institution history shows action titles, actor names, local timestamps, reasons, and expandable field changes. It hides raw database identifiers and JSON from the display while retaining the original audit records.
- History supports server-side category/reason filters and stable ID-based pagination, 25 records per page. Older events remain accessible beyond the previous 100-record display limit.
- The new `history` operation verifies the authenticated actor's persisted platform-admin role before querying history. Actor lookup runs only for actors present in that institution's returned page.

## Deployment

Deployed only the updated `institutions` Edge Function to linked project `zvrmvycajimjxghrnpgy`. The history API uses existing tables; no new migration was required. The rollout gate was not changed, and frontend changes remain local.

## Verification

- **31 tests passed across 6 files**: separate owner shell, paused gate, labelled administrator preview, error/retry, history presentation, filtering/pagination, API admin authorization, malformed cursor, pricing/CSV, and existing learner chrome.
- Changed frontend files passed ESLint with no warnings or errors.
- The institutions function passed `deno check` with the existing ignored `allowJs` compiler-option notice.
- Production build and `git diff --check` passed.
- In-app browser used the existing authenticated administrator and archived QA institution against the deployed API. Verified navigation between platform-admin management and the separate institution panel.
- Live history pagination loaded all **41 existing events** from two pages. Category and reason filtering returned the matching pricing events. Expanded details displayed **$10.01 → $20.02** and the actor's name.
- All five institution sections were exercised at **375px** in light and dark themes. Document and content widths stayed at 375px; wide tables scroll within their containers.
- Mobile history search fills the available width, and its expanded price details fit without page overflow. Desktop dark and mobile light history screenshots were captured.
- No purchases, grants, invitations, pricing changes, account changes, or learner-access changes were made during these browser checks. Actual owner states were covered by component tests; live browser checks used the clearly labelled admin preview because the pilot gate remains disabled.

## Evidence

Visual layout and responsiveness verified:

- Desktop dark theme
- Mobile dark theme
- Mobile light theme
- History view dark theme
- History view mobile light theme

The earlier payment fulfilment verification and production Stripe release boundary remain documented in `institution-verification-2026-10-03.md`.
