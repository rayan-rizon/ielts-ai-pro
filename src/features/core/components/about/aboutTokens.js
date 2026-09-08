/**
 * The About page's share of the landing design system.
 *
 * The page used to carry its own parallel look — generic Tailwind `indigo-600`
 * eyebrows, `slate-950` headings, `rounded-[24px]` cards over `backdrop-blur-xl`
 * with coloured glow orbs inside them — which is a different product from the
 * landing page it links out of, and the exact glassmorphism DESIGN.md §7 rules
 * out. Everything here is the landing page's own vocabulary, named once so the
 * two surfaces cannot drift apart again.
 *
 * Section shells and headings are not re-declared: About imports `SoftSection`
 * and `SectionHeading` from the landing directly.
 */

/** Same reveal threshold the landing sections use. */
export const ABOUT_VIEWPORT = { once: true, amount: 0.12 };

/**
 * The landing card shell (`FeaturesSection` / `HowItWorksSection`): hairline
 * violet border, near-white fill, one soft brand-tinted shadow, flat dark
 * surface. No glow orbs, no blur stack.
 */
export const CARD =
  'group relative flex h-full flex-col rounded-[26px] border border-[#e2e5fa] bg-white/95 p-5 sm:p-6 shadow-[0_20px_50px_-25px_rgba(79,66,220,0.22)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#6256ef]/25 hover:shadow-[0_24px_55px_-24px_rgba(79,66,220,0.30)] dark:border-white/10 dark:bg-[#131315] dark:shadow-none dark:backdrop-blur-none dark:hover:border-violet-400/25 dark:hover:shadow-none';

/** Quiet inset surface for a nested block inside a CARD. */
export const INSET =
  'rounded-[18px] border border-[#e7e4fb] bg-linear-to-b/srgb from-[#fcfbff] to-[#f4f2ff] dark:border-white/[0.07] dark:bg-white/2 dark:bg-none';

/** Ink. The landing's navy, not Tailwind slate. */
export const INK = 'text-[#101836] dark:text-white';
export const MUTED = 'text-[#56617f] dark:text-slate-400';

/** The brand violet chip used for step numbers and small markers. */
export const CHIP =
  'border border-[#ded9ff] bg-[#f2f0ff] text-[#5e50ee] dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300';

/** Hairline rule between cells of a fact rail. */
export const RULE = 'border-[#e9e6fa] dark:border-white/[0.08]';
