/**
 * Shared visual language for the active-test headers.
 *
 * These surfaces intentionally mirror the learner dashboard primitives:
 * flat #131315 panels, hairline borders, quiet inset controls, and semantic
 * colour reserved for an active state or a time warning.
 */
export const TEST_HEADER_SHELL =
  'w-full rounded-xl border border-[#e4e2f0] bg-white/90 backdrop-blur-md transition-all duration-300 dark:border-white/[0.10] dark:bg-[#131315]/95 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

export const TEST_HEADER_BACK =
  'group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] p-0 text-slate-700 shadow-none transition-all duration-200 hover:border-[#c8c9e6] hover:bg-[#ebeaf7] hover:text-[#5a63df] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/25 dark:border-white/[0.12] dark:bg-white/[0.055] dark:text-slate-200 dark:hover:border-white/[0.24] dark:hover:bg-white/[0.09] dark:hover:text-[#afb5ff]';

export const TEST_HEADER_BADGE =
  'inline-flex h-4 shrink-0 items-center gap-0.5 rounded-md border px-1.5 py-0 text-[8px] font-bold uppercase leading-none tracking-[0.08em]';

export const TEST_HEADER_META =
  'flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:gap-2 sm:text-xs';

export const TEST_HEADER_TOOL_GROUP =
  'flex items-center gap-0.5 rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] p-0.5 dark:border-white/[0.10] dark:bg-white/[0.055]';

export const TEST_HEADER_TOOL =
  'flex h-7 items-center gap-1 rounded-md px-2 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-600 transition-colors hover:bg-white hover:text-slate-900 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-white/[0.09] dark:hover:text-slate-100 sm:px-2.5 sm:text-[9px]';

export const TEST_HEADER_TOOL_ACTIVE =
  'bg-[#5a63df] text-white shadow-sm hover:bg-[#4f58d2] hover:text-white dark:bg-[#8f97ff] dark:text-[#10111a] dark:hover:bg-[#afb5ff] dark:hover:text-[#10111a]';

export const TEST_HEADER_AUTOSAVE =
  'hidden items-center gap-1.5 rounded-md border border-[#e4e2f0] bg-[#f4f3fb] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] dark:border-white/[0.10] dark:bg-white/[0.055] sm:flex';

export const TEST_HEADER_TIMER =
  'flex h-8 items-center gap-1.5 rounded-lg border px-3 py-1.5 shadow-none transition-all duration-300';

export const TEST_HEADER_PRIMARY_ACTION =
  'h-8 rounded-lg px-3 text-[9px] font-bold uppercase tracking-[0.08em] transition-colors sm:px-3.5 sm:text-[10px]';

export const TEST_HEADER_PROGRESS_TRACK =
  'h-1.5 w-full overflow-hidden rounded-full bg-[#ebeaf7] dark:bg-white/[0.08]';

export const TEST_HEADER_PROGRESS_FILL = 'h-full rounded-full bg-[#5a63df] dark:bg-[#8f97ff]';
