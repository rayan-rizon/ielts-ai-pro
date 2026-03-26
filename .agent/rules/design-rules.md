---
trigger: always_on
---

# Project Rules & Guidelines

## 1. Technology Stack

- **Framework**: React 18+ (Vite)
- **Styling**: TailwindCSS + Tailwind Animate
- **UI Architecture**: Radix UI Primitives (Headless) + Shadcn/ui pattern (Copy/Paste components)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State/Backend**: Supabase
- **Routing**: React Router DOM v6+

## 2. UI/UX Design Principles ("Zero-Placeholder" Policy)

- **Premium Aesthetic**: All UI elements must have a polished, "premium" feel. Use generous interactions, subtle shadows/glows, and glassmorphism where appropriate.
- **Micro-interactions**: buttons, cards, and list items must react to hover/active states (`hover:scale-105`, `active:scale-95`, etc.).
- **Transitions**: Use `duration-200` or `duration-300` with `ease-in-out` for all state changes.
- **Glassmorphism**: Use `backdrop-blur-md` or `backdrop-blur-xl` with semi-transparent backgrounds (`bg-background/80`) for overlays, sticky headers, and floating paths.
- **Gradients**: Use subtle gradients for text (`bg-clip-text text-transparent bg-gradient-to...`) or borders to add depth.
- **Empty States**: Never leave a section blank. Use illustrations (lucide icons with circles/bg) and encouraging text for empty states.
- **Mobile First**: All designs must be fully responsive.
- **Dark Mode**: All components must support dark mode using the `dark:` variant and CSS variables.

## 3. Coding Standards

### Structure & Imports

- **Absolute Imports**: Always use the `@/` alias for imports.
  - ✅ `import { Button } from "@/components/ui/button"`
  - ❌ `import { Button } from "../../components/ui/button"`
- **Component Size**: Components should be small and focused. If a file exceeds 250 lines, consider breaking it down.
- **Exports**: Use `export default` for pages, `export` (named) for utility components.

### Styling with Tailwind

- **Semantic Colors**: Use the CSS variable definitions in `index.css` instead of hardcoded hex values.
  - ✅ `bg-primary`, `text-muted-foreground`, `border-border`
  - ❌ `bg-blue-500` (unless specifically denoting a "Blue" entity), `text-gray-500`
- **Class Sorting**: Group logic (layout -> spacing -> sizing -> typography -> effects).
- **Conditionals**: Use `cn()` utility (clsx + tailwind-merge) for conditional classes.
  - `className={cn("p-4 border rounded", isActive && "border-primary")}`

### React Patterns

- **Hooks**: Use custom hooks for complex logic (`useAuth`, `useFetch`).
- **Loading States**: Always implement Skeleton loaders (`<Skeleton className="h-4 w-full" />`) instead of simple "Loading..." text.
- **Error Handling**: gracefully handle errors with Toasts (`sonner` or `toast`) or UI feedback.

## 4. File Structure

- `src/components/ui`: Base UI components (Button, Input, Card).
- `src/components/[Feature]`: Feature-specific components.
- `src/pages`: Route components.
- `src/lib`: Utilities (`utils.js`, `constants.js`).
- `src/hooks`: Custom hooks.

## 5. Development Workflow

- **Linting**: Ensure no unused imports or variables.
- **Types**: Even in JS files, use PropType patterns or consistent object shapes.
- **Testing**: Components should be testable.

## 6. AI/Agent Behavior

- **Context Awareness**: When editing a file, always check if there are related files (e.g. mobile versions, css files) that need updating.
- **Proactive Fixes**: If you see legacy code (e.g. `style={{}}` for things Tailwind can do), refactor it standard Tailwind classes.

## 7. Never reset database. If you do then it will die

## 8. Use Rich Aesthetics: The USER should be wowed at first glance by the design. Use best practices in modern web design (e.g. vibrant colors, dark modes, glassmorphism, and dynamic animations) to create a stunning first impression. Failure to do this is UNACCEPTABLE.

## 9. CRITICAL REMINDER: AESTHETICS ARE VERY IMPORTANT. If your web app looks simple and basic then you have FAILED!

## 10. Animation & Motion Guidelines

### Key Principles

- **Purposeful**: Use animations to guide attention and provide feedback.
- **Performance**: Animate 'transform' and 'opacity' only. Avoid layout thrashing.
- **Reduced Motion**: Respect user preferences for reduced motion.

### Technology Specifics

- **CSS**: Use specific transitions (e.g., 'transition-transform') and proper easing.
- **Framer Motion**: Use for complex component states, entrances, and layout animations.

### Best Practices

- **Duration**: Quick and snappy (< 500ms).
- **Easing**: Natural ease-out for entrances.
- **Micro-interactions**: Subtle hover/active states are mandatory.
