/** Buttons and focus treatment shared by the speaking report's sections. */

export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#08080a]';

export const PRIMARY_BUTTON = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] px-3.5 text-[12.5px] font-bold text-white transition-[background-color,transform] duration-150 ease-smooth-out hover:bg-[#4b53c9] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${FOCUS_RING}`;

export const QUIET_BUTTON = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-3 text-[12.5px] font-bold text-slate-700 transition-[background-color,border-color,transform] duration-150 ease-smooth-out hover:border-[#5a63df]/40 hover:bg-[#f7f6fd] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 dark:border-white/10 dark:bg-white/4 dark:text-slate-200 dark:hover:border-[#8f97ff]/35 dark:hover:bg-white/8 ${FOCUS_RING}`;

export const TEXT_BUTTON = `inline-flex items-center gap-1 rounded-sm text-[12px] font-bold text-[#5a63df] transition-colors hover:text-[#4b53c9] dark:text-[#afb5ff] dark:hover:text-white ${FOCUS_RING}`;

/** Status colour for a measured length against its target. */
export const LENGTH_TONE = {
  ok: 'bg-[rgb(var(--panel-accent))]',
  short: 'bg-[rgb(var(--signal-warn))]',
  'very-short': 'bg-[rgb(var(--signal-fault))]',
  unknown: 'bg-slate-300 dark:bg-white/20',
};
