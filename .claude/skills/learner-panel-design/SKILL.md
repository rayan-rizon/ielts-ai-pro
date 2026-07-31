---
name: learner-panel-design
description: Design system guide for converting learner-facing pages (Analytics, Leaderboard, Study Groups, Vocabulary, etc.) to the compact instrument-panel UI system built for /dashboard — visual tokens, primitives, layout geometry, micro-interactions, dark mode, and UI checklists.
---

# Learner Panel Design System (UI & Aesthetics Guide)

This is the UI design system built for `src/features/dashboard/` (July 2026 instrument-panel rework). Use this skill whenever asked to redesign, modernize, polish, or "match the new dashboard UI" on any student-facing page.

It is a **compact, high-density instrument-panel design system** designed to keep data legible, visual hierarchy crisp, and responsive layouts self-correcting across mobile and desktop.

---

## 🎨 1. Visual & Aesthetic Foundations

The learner panel design system balances **high data density** with a **sleek, premium aesthetic**. Every visual element follows five foundational rules:

### A. Number-First Typography Hierarchy

- ** Tabular Numerals (`NUM`)**: All rendered metrics, scores, and quantities use mono tabular numbers (`font-mono tabular-nums tracking-tight`) so numbers align vertically and read with mechanical precision.
- ** Micro Meta Labels (`MICRO`)**: Card metadata, section headers, and sub-labels use high-tracking uppercase typography (`text-[9px] font-bold uppercase tracking-[0.14em]`).
- ** Card Headings (`TITLE`)**: Distinct, highly legible titles (`text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100`) anchor every card visually without competing with key metrics.

### B. Dual-Theme Palette & Surface Elevation

- ** Light Mode Palette**: Crisp lavender-tinged white gradient surfaces (`from-white to-[#faf9ff]`) bounded by soft hairline borders (`border-[#e4e2f0]`).
- ** Dark Mode Palette**: Deep obsidian night surfaces (`from-[#141319] to-[#100f15]`) with subtle white hairline rules (`dark:border-white/[0.07]`).
- ** Elevation Model**: Zero heavy drop shadows. Hierarchy is achieved strictly through border rules, subtle background shifts (`WELL`, `TILE`), and background gradients.

### C. Signal Color System

Color is reserved strictly for status and meaning (never for arbitrary decoration):

- **OK / Success**: `--signal-ok` (`rgb(var(--signal-ok))`) — Positive deltas, completed tasks, target band achieved.
- **Warning / Caution**: `--signal-warn` (`rgb(var(--signal-warn))`) — Approaching deadline, stagnant band score, moderate risk.
- **Fault / Alert**: `--signal-fault` (`rgb(var(--signal-fault))`) — Negative delta, critical question weakness, missed daily goal.
- **Brand Accent**: `#5a63df` (Indigo) — Primary interactive elements, active progress meters, focus rings, selected state highlights.

### D. Micro-Interactions & Motion Choreography

- ** Dynamic Hover State**: KPI tiles and interactive cards subtlely elevate on hover (`hover:-translate-y-0.5 transition-all duration-200 ease-in-out hover:shadow-sm dark:hover:border-white/[0.12]`).
- ** Micro-Press Feedback**: Interactive buttons and tiles compress on active press (`active:scale-[0.99]`).
- ** Staggered Entrance Animations**: Page layouts use Framer Motion container stagger (`STAGGER_CONTAINER`) and card fade-ups (`FADE_UP`) for smooth 60fps mounting without layout jank.

---

## 🛠️ 2. Primitives Reference & Tailwind Recipes

Import all UI primitives from `@/features/dashboard/components/primitives.jsx`. Do **not** hand-roll custom borders, numbers, or pill badges locally.

| Primitive           | Class / Signature | Usage & Tailwind Styling Recipe                                                                                                                               |
| :------------------ | :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PANEL`             | `string`          | Base card shell: `rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15]` |
| `WELL`              | `string`          | Quiet inset surface for progress tracks, empty wells: `bg-[#f4f3fb] dark:bg-white/[0.04]`                                                                     |
| `TILE`              | `string`          | Secondary nested surface: `rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] transition-colors duration-150 dark:border-white/10 dark:bg-white/[0.03]`          |
| `NUM`               | `string`          | Monospace tabular numbers: `font-mono tabular-nums tracking-tight`                                                                                            |
| `MICRO`             | `string`          | Uppercase micro label: `text-[9px] font-bold uppercase tracking-[0.14em]`                                                                                     |
| `TITLE`             | `string`          | Card section title: `text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100`                                                            |
| `MUTED`             | `string`          | Secondary muted text: `text-slate-500 dark:text-slate-400`                                                                                                    |
| `Panel`             | Component         | Polymorphic section card wrapper (`<Panel as="section">`) with vertical flex column layout.                                                                   |
| `PanelTitle`        | Component         | Standardized card header: hairline accent rail + title + optional tip + right-side action button.                                                             |
| `PanelFootnote`     | Component         | Hairline summary line ending cards: `mt-3 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]`.                                                         |
| `FootNum`           | Component         | Emphasized tabular number inside a footnote (`<FootNum>7.5</FootNum>`).                                                                                       |
| `Stat`              | Component         | Top-level KPI metric tile with icon chip, tabular value, optional subtext, delta badge, and `size="sm"` variant.                                              |
| `IconChip`          | Component         | Tinted micro icon badge (`size="sm"`: 20px, `size="md"`: 28px) with tone variants (`accent`, `emerald`, `amber`, `rose`, `sky`).                              |
| `Pill`              | Component         | Micro badge tag (`PILL_BASE`) with dynamic signal tones (`ok`, `warn`, `fault`, `accent`, `rose`, `sky`, `amber`, `emerald`, `neutral`).                      |
| `Meter`             | Component         | Ultra-dense horizontal fill bar with inner label and numeric readout.                                                                                         |
| `Bar`               | Component         | Standalone thin progress track (`h-1.5`) with animated width fill (`duration-500 ease-out`).                                                                  |
| `Ring`              | Component         | SVG stroke-dash donut chart for single-ratio progress indicators (e.g. completion %).                                                                         |
| `Delta`             | Component         | Signed change indicator (`+0.5` or `−0.2`) formatted in `NUM` with signal color coding.                                                                       |
| `Tip` / `InfoTip`   | Component         | Accessible hover tooltip trigger and micro popover for metric explanations.                                                                                   |
| `Empty`             | Component         | Standardized empty state card with icon and helpful contextual empty copy.                                                                                    |
| `STAGGER_CONTAINER` | Object            | Framer Motion variant for page-level staggered entry (`staggerChildren: 0.04`).                                                                               |
| `FADE_UP`           | Object            | Framer Motion variant for individual card fade-and-rise entrance (`y: 12 → y: 0`).                                                                            |

---

## 📐 3. Layout Architecture & Grid Guidelines

### A. 12-Column Responsive Grid System

All learner-facing pages follow the 12-column grid layout pattern. Spans adapt cleanly between mobile (single column) and desktop:

```jsx
// Standard Page Container Pattern
<m.div
  variants={STAGGER_CONTAINER}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-12 gap-3 p-4 md:p-6"
>
  {/* Top KPI Stat Band (Full Width) */}
  <m.div variants={FADE_UP} className="col-span-12">
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      <Stat size="sm" icon={Trophy} label="Target Band" value="7.5" tone="accent" />
      <Stat
        size="sm"
        icon={Activity}
        label="Practice Rate"
        value="12"
        unit="q/day"
        tone="emerald"
      />
      <Stat size="sm" icon={Clock} label="Days Left" value="24" tone="amber" />
      <Stat size="sm" icon={BookOpen} label="Completed" value="84%" tone="sky" />
      <Stat size="sm" icon={TrendingUp} label="Band Delta" value="+0.5" tone="emerald" />
    </div>
  </m.div>

  {/* Main Content Area: Primary Chart (8 Cols) + Sidebar Card (4 Cols) */}
  <m.div variants={FADE_UP} className="col-span-12 lg:col-span-8">
    <Panel className="p-4">
      <PanelTitle label="Primary Trajectory" tip="Calculated from last 10 scored tests" />
      {/* Visual content */}
    </Panel>
  </m.div>

  <m.div variants={FADE_UP} className="col-span-12 lg:col-span-4">
    <Panel className="p-4">
      <PanelTitle label="Focus Skill Areas" />
      {/* Supporting details */}
    </Panel>
  </m.div>
</m.div>
```

### B. Grid Column Guidelines

1. **Stat Bands**: Use `grid-cols-2 lg:grid-cols-5` (or `lg:grid-cols-4`) with `<Stat size="sm">` so top metric rows act as compact instrument strips, not massive cards.
2. **Container-Driven Sizing (`flex-1`)**: Never hardcode fixed pixel widths on custom visual elements (heatmaps, timelines, progress bars) in responsive grid columns. Use `flex-1` and responsive container widths to prevent horizontal overflow or empty whitespace gaps.
3. **Reading Order Hierarchy**: Order cards top-to-bottom and left-to-right by priority:
   - **Standing** (KPI metrics & current band)
   - **Movement** (Delta trajectory & progress meters)
   - **Actionable Steps** (Weak areas to practice now)
   - **Supporting History** (Practice logs & detailed breakdowns)
   - **Reference Material** (Study notes & resource links)

---

## 💀 4. Skeleton Loader 1:1 Mirroring

To prevent layout reflow (CLS) when loading data, every page **must provide a skeleton loader that mirrors the real layout 1:1**:

```jsx
export function LearnerPageSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-3 p-4 md:p-6 animate-pulse">
      {/* Stat Band Skeleton */}
      <div className="col-span-12 grid grid-cols-2 gap-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-slate-100 dark:bg-white/5"
          />
        ))}
      </div>
      {/* 8-col & 4-col Cards Skeleton */}
      <div className="col-span-12 lg:col-span-8 h-80 rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-slate-100 dark:bg-white/5" />
      <div className="col-span-12 lg:col-span-4 h-80 rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-slate-100 dark:bg-white/5" />
    </div>
  );
}
```

---

## Checklist: Page UI Conversion & Modernization

Follow this step-by-step UI checklist when converting legacy pages (e.g. `Analytics.jsx`, `Leaderboard.jsx`, `StudyGroups.jsx`, `BandScoreCalculator.jsx`):

1. **Audit & Remove Legacy Glassmorphism**:
   - Replace `backdrop-blur`, heavy `shadow-lg`, and legacy `Card`/`CardContent` wrappers with `PANEL`, `WELL`, `TILE`, and `Panel`.
2. **Replace Local Typography with UI Primitives**:
   - Wrap raw metric numbers in `NUM`.
   - Standardize section labels with `Eyebrow`, `SectionLabel`, or `PanelTitle`.
   - Convert status labels into signal-coded `Pill` elements.
3. **Restructure Layout Grid**:
   - Apply 12-column grid layout (`grid-cols-12 gap-3`).
   - Group KPI metrics into a top `<Stat size="sm">` band strip.
4. **Enforce Theme Balance & Color Tokens**:
   - Test both Light Mode (`from-white to-[#faf9ff]`) and Dark Mode (`from-[#141319] to-[#100f15]`).
   - Replace hardcoded hex colors with signal tokens (`rgb(var(--signal-ok))` etc.) or `#5a63df` accent.
5. **Add Micro-Interactions & Entrance Motion**:
   - Wrap layout container in `<m.div variants={STAGGER_CONTAINER}>`.
   - Wrap individual cards in `<m.div variants={FADE_UP}>`.
6. **Ensure Honest Empty States**:
   - Add `<Empty icon={...}>` states for zero-data scenarios.
7. **Create 1:1 Mirroring Skeleton Component**:
   - Build/update the skeleton component to match card spans and heights exactly.
8. **Mobile Overflow & Quality Gate**:
   - Test at `375px` screen width in browser pane to ensure zero horizontal scroll (`scrollWidth === innerWidth`).
   - Run build & lint checks (`npx vite build` & `npx eslint`) with zero errors.

```bash
grep -rln "backdrop-blur\|data-oid=" src/features/*/pages/*.jsx
```
