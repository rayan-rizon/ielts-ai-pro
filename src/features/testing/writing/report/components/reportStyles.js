/** Class strings and small helpers shared by the report's components. */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]';
export const PRIMARY_BUTTON = `inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#4b53c9] active:scale-[0.98] cursor-pointer disabled:cursor-wait disabled:opacity-70 ${FOCUS_RING} focus-visible:ring-offset-2`;
export const QUIET_BUTTON = `inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#dcdaea] bg-white px-3 py-2 text-[12.5px] font-bold text-slate-700 transition-colors hover:border-[#5a63df]/40 hover:text-[#5a63df] cursor-pointer disabled:cursor-wait disabled:opacity-60 dark:border-white/12 dark:bg-white/5 dark:text-slate-100 ${FOCUS_RING}`;
export const TEXT_BUTTON = `inline-flex min-h-8 items-center gap-1 rounded text-[12.5px] font-bold text-[#4b53c9] underline-offset-2 hover:underline cursor-pointer dark:text-[#afb5ff] ${FOCUS_RING}`;
export const HEADING =
  'text-[16px] font-extrabold tracking-[-0.01em] text-slate-900 dark:text-white';
export const BODY = 'text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200';
export const HAIRLINE = 'border-[#eceafa] dark:border-white/[0.07]';

/** The learner's and the examiner's English, whatever the report language. */
export const ENGLISH = { lang: 'en', dir: 'ltr' };

export const formatBand = (score) => (Number(score) > 0 ? Number(score).toFixed(1) : '-');
