# IELTS Ai Pro Design System

## 1. Atmosphere & Identity

IELTS Ai Pro is a premium, high-energy learning command center built on a **compact, high-density instrument-panel design system** (see `.claude/skills/learner-panel-design/SKILL.md`). It balances technical precision with educational approachability.

The system relies on clean surface elevation, hairline borders, tabular numerals, and signal color coding. Glassmorphism, heavy backdrop blurs, and saturated glowing drop shadows are strictly avoided in favor of crisp panel surfaces (`PANEL`, `WELL`, `TILE`) and precise micro-interactions.

## 2. Color

### Palette

| Role              | Token              | Light                  | Dark             | Usage                                       |
| ----------------- | ------------------ | ---------------------- | ---------------- | ------------------------------------------- |
| Surface/primary   | --background       | HSL(215 25% 95%)       | HSL(240 10% 2%)  | Main background canvas                      |
| Surface/card      | --card             | HSL(0 0% 100%)         | HSL(240 10% 4%)  | Default card panels                         |
| Surface/secondary | --secondary        | HSL(210 40% 96.1%)     | HSL(240 5% 10%)  | Inactive controls, inputs, secondary badges |
| Text/primary      | --foreground       | HSL(222.2 84% 4.9%)    | HSL(0 0% 98%)    | Main headings and body text                 |
| Text/muted        | --muted-foreground | HSL(215 20% 35%)       | HSL(240 5% 75%)  | Secondary captions and text labels          |
| Accent/primary    | --primary          | HSL(221 83% 45%)       | HSL(221 83% 53%) | Primary CTAs, active links, brand accents   |
| Accent/hover      | --primary-hover    | HSL(221 83% 40%)       | HSL(221 83% 60%) | Hover state of primary elements             |
| Border/default    | --border           | HSL(214.3 31.8% 91.4%) | HSL(240 5% 15%)  | Default separators, card borders            |
| Border/input      | --input            | HSL(214.3 31.8% 91.4%) | HSL(240 5% 15%)  | Form inputs outline border                  |
| Ring/focus        | --ring             | HSL(221.2 83.2% 53.3%) | HSL(239 84% 67%) | Keyboard focus ring                         |

### Status Colors

| Status  | Light                  | Dark                   | Usage                                      |
| ------- | ---------------------- | ---------------------- | ------------------------------------------ |
| Success | HSL(142.1 76.2% 36.3%) | HSL(142.1 70.6% 45.3%) | Confirmations, high band scores (8.0+)     |
| Warning | HSL(37.9 92.1% 50.2%)  | HSL(37.9 92.1% 50.2%)  | Warnings, mid-range band scores (6.0-7.5)  |
| Error   | HSL(0 84.2% 60.2%)     | HSL(0 62.8% 30.6%)     | Validation errors, low band scores (< 6.0) |

### Rules

- Never use hardcoded hexadecimal or RGB colors in component styling; reference CSS variables or Tailwind CSS classes.
- Use primary blue/indigo accents exclusively for interactive elements or brand logo marks.
- Support both light and dark modes cleanly using Tailwind's `dark:` variant.

## 3. Typography

### Scale

| Level    | Size             | Weight | Line Height | Tracking | Usage                            |
| -------- | ---------------- | ------ | ----------- | -------- | -------------------------------- |
| Display  | 48px / 3rem      | 800    | 1.1         | -0.02em  | Hero headline titles             |
| H1       | 36px / 2.25rem   | 800    | 1.2         | -0.015em | Landing headers, auth welcome    |
| H2       | 24px / 1.5rem    | 700    | 1.3         | -0.01em  | Sidebar headings, card headers   |
| H3       | 18px / 1.125rem  | 600    | 1.4         | -0.005em | Form section labels              |
| Body     | 16px / 1rem      | 400    | 1.6         | 0        | Default body paragraphs          |
| Body/sm  | 14px / 0.875rem  | 400    | 1.5         | 0        | Description text, error messages |
| Caption  | 12px / 0.75rem   | 500    | 1.4         | 0.01em   | Metadata, secondary labels       |
| Overline | 11px / 0.6875rem | 700    | 1.3         | 0.1em    | Category tabs, uppercase labels  |

### Font Stack

- Primary: `'Plus Jakarta Sans'`, `Inter`, `system-ui`, `-apple-system`, `sans-serif`
- Mono: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `monospace`

### Rules

- Max 2 font families (Default & Mono).
- All display headers should use `font-extrabold` or `font-black` with tracking-tight.
- Line heights must scale appropriately with text size to prevent overlapping lines.

## 4. Spacing & Layout

### Base Unit

All spacing is based on a **4px** unit.

| Token      | Value | Usage                                      |
| ---------- | ----- | ------------------------------------------ |
| --space-1  | 4px   | Tight margins: icon-to-text spacing        |
| --space-2  | 8px   | Group spacing: input field to label        |
| --space-3  | 12px  | Component inner margins                    |
| --space-4  | 16px  | Padding: buttons, medium cards             |
| --space-6  | 24px  | Default layout gutters, major card padding |
| --space-8  | 32px  | Section gap separation                     |
| --space-12 | 48px  | Page margins and outer panels layout       |

### Grid

- Maximum container width: `1280px` (`max-w-7xl`).
- Mobile margins: `16px` (`px-4`).
- Breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

## 5. Components

### Logo

- **Structure**: `<Logo>` - Scalable SVG markup
- **Variants**: `iconOnly` (only renders the SVG mark), `horizontal` (default, renders the mark alongside logotype)
- **Interactive State**: Group hover triggers a subtle rotation and scale lift (`scale-105 rotate-6`)

### Button

- **Structure**: `<Button>` component utilizing `class-variance-authority`
- **States**:
  - `default`: Smooth primary color background.
  - `hover`: Scale transform (`hover:scale-[1.02]`) and brightness shift.
  - `active`: Slight press scale (`active:scale-[0.98]`).
  - `disabled`: Grayed out with `pointer-events-none`.

### Input

- **Structure**: `<Input>` field with absolute icon placements
- **States**:
  - `default`: Muted background with thin borders.
  - `hover`: Light border highlight (`hover:border-primary/30`).
  - `focus`: Full accent border and ring glow (`focus:border-primary/50 focus:ring-4 focus:ring-primary/10`).

## 6. Motion & Interaction

### Timing

| Transition Type   | Duration | Easing                        | Usage                                      |
| ----------------- | -------- | ----------------------------- | ------------------------------------------ |
| Micro-interaction | 150ms    | ease-out                      | Button taps, link hovers                   |
| Smooth Transition | 300ms    | ease-in-out                   | Toggle slide actions, accordion expand     |
| Entrance Motion   | 500ms    | cubic-bezier(0.16, 1, 0.3, 1) | Modals reveal, panel entrances, page fades |

### Rules

- Always use CSS variables or Tailwind transition utilities (`transition-all duration-300`).
- Limit animations to compositor-friendly attributes: `transform`, `opacity`, and `filter`.
- Respect `prefers-reduced-motion` settings.

## 7. Depth & Surface

### Strategy

We use a **zero-heavy-shadow surface elevation strategy**:

- **PANEL Shell**: Base card container bounded by subtle hairline rules (`border-[#e4e2f0]` in light / `dark:border-white/[0.07]` in dark mode) over smooth gradient surfaces (`from-white to-[#faf9ff]` / `from-[#141319] to-[#100f15]`).
- **WELL Surface**: Inset surfaces for meter tracks, nested rows, and empty wells (`bg-[#f4f3fb]` / `dark:bg-white/[0.04]`).
- **TILE Surface**: Nested tiles inside cards (`border-[#ebeaf7] bg-[#fbfbfe]` / `dark:border-white/10 dark:bg-white/[0.03]`).
- **Zero Glassmorphism**: Glassmorphism overlays and heavy drop shadows (`backdrop-blur-3xl`, `shadow-2xl`) are strictly disallowed. Elevation and hierarchy are achieved purely via hairline rules, subtle surface shifts, and tabular metric focus.
