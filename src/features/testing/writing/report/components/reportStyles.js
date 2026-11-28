/** Class strings and small helpers shared by the report's components. */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]';
export const PRIMARY_BUTTON = `inline-flex min-h-[42px] items-center justify-center gap-[7px] rounded-[10px] bg-[#5a63df] px-4 py-2 text-[13.5px] font-bold text-white transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#4b53c9] active:scale-[0.97] cursor-pointer disabled:cursor-wait disabled:opacity-70 ${FOCUS_RING} focus-visible:ring-offset-2`;
export const QUIET_BUTTON = `inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-[10px] border border-[#dcdaea] bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-[#2a2f47] transition-[background-color,border-color,color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#c9c6e6] hover:bg-[#f6f5fd] hover:text-[#12142b] active:scale-[0.97] cursor-pointer disabled:cursor-wait disabled:opacity-60 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-white/[0.08] ${FOCUS_RING}`;
export const TEXT_BUTTON = `inline-flex min-h-8 items-center gap-1 rounded text-[12.5px] font-bold text-[#4b53c9] underline-offset-2 hover:underline cursor-pointer dark:text-[#afb5ff] ${FOCUS_RING}`;
export const HEADING =
  'text-[17px] @2xl:text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-[#12142b] dark:text-white';
export const BODY = 'text-[13.5px] leading-relaxed text-[#2a2f47] dark:text-slate-200';
/** A report card: flat white with one hairline. */
export const CARD =
  'rounded-2xl border border-[#e4e2f0] bg-white dark:border-white/[0.07] dark:bg-[#141319]';
export const MUTED_TEXT = 'text-[#565d75] dark:text-slate-400';
/** The learner's own English, set to be read. */
export const ESSAY_FONT = "font-['Source_Serif_4',Georgia,serif]";
export const HAIRLINE = 'border-[#eeedf6] dark:border-white/[0.07]';

/** Shared Learner Panel color tokens so every tab group on the Writing page matches. */
export const TAB_THEME = {
  track: 'border border-[#e4e2f0] bg-[#f4f3fb] dark:border-white/[0.08] dark:bg-white/[0.05]',
  indicator: 'bg-[#5a63df] shadow-[0_1px_2px_rgba(90,99,223,0.28)] dark:bg-[#5a63df]',
  active: 'text-white',
  idle: 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
};

/** The learner's and the examiner's English, whatever the report language. */
export const ENGLISH = { lang: 'en', dir: 'ltr' };

export const formatBand = (score) => (Number(score) > 0 ? Number(score).toFixed(1) : '-');
