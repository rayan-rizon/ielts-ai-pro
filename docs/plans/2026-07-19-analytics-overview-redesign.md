# Analytics overview redesign

## Direction

Use progressive disclosure: a calm, reference-faithful overview first, followed by the existing specialist analytics. The visual system stays within the product's current light/dark design tokens, with compact white surfaces, fine borders, restrained indigo accents, and clearer typographic hierarchy.

## Overview information architecture

1. Personalized header with the active timeframe.
2. Accurate summary cards sourced from completed Supabase test sessions and vocabulary entries.
3. Band journey and AI recommendations.
4. Progress over time beside section performance.
5. Pacing chart beside recent practice history.
6. Existing module trends and diagnostic tools under an explicit advanced-analysis heading.

## Data rules

- Never display an estimated band, accuracy, or duration when its source fields are absent or invalid.
- Section performance is the average valid band score per IELTS module within the selected timeframe.
- Recent practice uses completed sessions only and includes the related passage title when available.
- Pacing compares recorded average minutes with the product's configured module duration. Missing module timing stays unavailable.
- Band journey uses the earliest valid score in the selected timeframe as its baseline, the current scored-session average as the current point, and the user's saved target as the destination.

## Verification

- Unit-test data guards and overview derivations.
- Run focused Vitest, ESLint on changed files, TypeScript, and production build.
- Validate desktop and mobile layouts, timeframe interaction, console health, and visual fidelity against the supplied reference image.
