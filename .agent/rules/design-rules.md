---
trigger: always_on
---

# Project Rules & Guidelines

## 1. Technology Stack

- **Framework**: React 18+ (Vite)
- **Styling**: TailwindCSS + Tailwind Animate
- **UI Architecture**: Radix UI Primitives (Headless) + Shadcn/ui pattern + Learner Panel Design System
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State/Backend**: Supabase (PostgreSQL with RLS) + Edge Functions
- **Routing**: React Router DOM v6+

## 2. Learner Panel Design System & UI Architecture

Do NOT use legacy glassmorphism (`backdrop-blur`, heavy `shadow-lg` / `shadow-2xl`, glowing neon backlights) for UI design in this project. Strictly adhere to the **Learner Panel Design System** documented in `DESIGN.md` and `.claude/skills/learner-panel-design/SKILL.md`:

- **Design Philosophy**: Compact, high-density instrument-panel design system (`PANEL`, `WELL`, `TILE`, `NUM`, `MICRO`, `TITLE`, `Stat`, `Meter`, `Pill`, `IconChip`, `Tip`, `Empty`).
- **Typography**: Tabular monospace numbers (`NUM`), uppercase micro labels (`MICRO`), and distinct card titles (`TITLE`).
- **Surfaces & Elevation**: Zero heavy drop shadows or glassmorphic blur layers. Hierarchy is built strictly using hairline rules (`border-[#e4e2f0]` in light mode / `dark:border-white/[0.07]` in dark mode), subtle surface elevation (`WELL`, `TILE`), and card gradients (`from-white to-[#faf9ff]` in light / `from-[#141319] to-[#100f15]` in dark).
- **Primitives Source**: Always import UI primitives from `@/features/dashboard/components/primitives.jsx`.
- **Signal Colors**: Use `--signal-ok` (success), `--signal-warn` (warning), `--signal-fault` (error), and brand accent `#5a63df`.
- **Micro-interactions**: Subtle hover translations (`hover:-translate-y-0.5 transition-all duration-200`) and active compression (`active:scale-[0.99]`).
- **Mobile First & Responsive**: All designs must be fully responsive, zero horizontal overflow at 375px viewport (`scrollWidth === innerWidth`).
- **Dark Mode**: All components must support dark mode cleanly using `dark:` variants.

## 3. Coding Standards

### Structure & Imports

- **Absolute Imports**: Always use the `@/` alias for imports.
  - ✅ `import { Button } from "@/components/ui/button"`
  - ❌ `import { Button } from "../../components/ui/button"`
- **Component Size**: Components should be small and focused. If a file exceeds 250 lines, consider breaking it down.
- **Exports**: Use `export default` for pages, `export` (named) for utility components and primitives.

### Styling with Tailwind

- **Semantic Colors**: Use the CSS variable definitions and design tokens instead of ad-hoc arbitrary hex values.
- **Class Sorting**: Group logic (layout -> spacing -> sizing -> typography -> effects).
- **Conditionals**: Use `cn()` utility (clsx + tailwind-merge) for conditional classes.

### React Patterns

- **Hooks**: Use custom hooks for complex logic (`useAuth`, `useAutosave`, `useTestSession`).
- **Loading States**: Always implement skeleton loaders matching the target UI 1:1 to prevent Cumulative Layout Shift (CLS).
- **Error Handling**: Gracefully handle errors with UI banners, empty states, or toasts (`sonner` / `toast`).

## 4. File Structure

- `src/components/ui`: Base headless/Radix UI components.
- `src/features/dashboard/components/primitives.jsx`: Core Learner Panel Design System primitives.
- `src/features/[feature]`: Feature-specific domain modules.
- `src/lib`: Shared infrastructure utilities (`supabase.js`, `rateLimiter.js`, `posthog.js`).
- `src/hooks`: Custom React hooks.

## 5. Development Workflow & Database Safety

- **Database Safety Rule**: **NEVER RESET THE DATABASE (`supabase db reset` is strictly disallowed)**. All schema evolutions must be non-destructive incremental migrations.
- **AI Model Registry**: `supabase/functions/_shared/aiModelRegistry.ts` is the single source of truth for all AI model routing, fallback chains, and token pricing.
- **Linting & Testing**: Ensure all unit/integration tests pass (`npm run test:unit`) before completing tasks.

## 6. Animation & Motion Guidelines

- **Purposeful**: Use animations to guide attention, provide feedback, and ease page transitions.
- **Performance**: Animate `transform` and `opacity` only. Avoid layout-triggering properties.
- **Reduced Motion**: Respect user preferences for reduced motion (`prefers-reduced-motion`).
- **Micro-interactions**: Fast, snappy transitions (< 300ms) with natural ease-out curves.
