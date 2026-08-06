/**
 * Shared visual tokens for reading & listening question renderers.
 * Keeps both features on the same instrument-panel surface/border/validation
 * colors instead of drifting into their own one-off dark-mode palettes.
 */

export const ACCENT = '#5a63df';
export const ACCENT_TEXT = 'text-[#5a63df] dark:text-[#a9afff]';

/** Outer question/panel card shell. */
export const PANEL_CARD =
  'rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b from-white to-[#faf9ff] dark:from-[#131315] dark:to-[#131315]';

/** Nested tile/box surface — one step quieter than PANEL_CARD, no shadow. */
export const TILE_SURFACE =
  'rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] dark:border-white/8 dark:bg-white/3';

/** Quiet inset well — table header rows, word-bank boxes. */
export const WELL_SURFACE = 'bg-[#f4f3fb] dark:bg-white/4';

/** Instruction/callout banner — solid panel surface + accent rail, not an alpha-blend tint. */
export const INSTRUCTION_CARD =
  'relative overflow-hidden bg-[#5a63df]/5 dark:bg-[#131315] border border-[#5a63df]/10 dark:border-[#5a63df]/25 text-slate-800 dark:text-slate-100';
export const INSTRUCTION_RAIL =
  'absolute left-0 top-0 bottom-0 w-[3px] bg-[#5a63df] dark:bg-[#8f97ff]';
export const INSTRUCTION_ICON_CHIP =
  'bg-[#5a63df]/10 dark:bg-[#8f97ff]/16 text-[#5a63df] dark:text-[#afb5ff]';

/** Default (not-finished) input/select surface. */
export const INPUT_DEFAULT =
  'bg-white/70 dark:bg-white/4 border border-slate-300/70 dark:border-white/8 text-foreground hover:border-slate-400/80 dark:hover:border-white/[0.14] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5a63df]/40 focus-visible:border-[#5a63df]/50';

/**
 * Validation-aware input/select style. Mirrors baseStyle when not finished;
 * once finished, colors by correctness with the emerald/rose pair used
 * across both features (never plain green/red).
 */
export function getValidationInputStyle(isFinished, value, isCorrect, baseStyle) {
  if (!isFinished) return baseStyle;
  let style = baseStyle + ' cursor-not-allowed opacity-100 ';
  if (value) {
    style += isCorrect
      ? ' bg-emerald-50/90 border-emerald-500 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500/70 dark:text-emerald-200 font-semibold'
      : ' bg-rose-50/90 border-rose-500 text-rose-950 dark:bg-rose-950/40 dark:border-rose-500/70 dark:text-rose-200 font-semibold';
  } else {
    style +=
      ' bg-white dark:bg-white/4 border-[#e4e2f0] dark:border-white/8 text-slate-500 dark:text-slate-400';
  }
  return style;
}

export function getCircleStatus(isFinished, validation, value) {
  if (!isFinished || !validation) return 'default';
  if (validation.isCorrect === true) return 'correct';
  if (validation.isTypo === true) return 'typo';
  return value ? 'incorrect' : 'unanswered';
}
