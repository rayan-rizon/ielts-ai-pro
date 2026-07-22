import { toRoman } from '../../../utils/helpers';

export function getCircleStatus(isFinished, validation, value) {
  if (!isFinished || !validation) return 'default';
  if (validation.isCorrect === true) return 'correct';
  if (validation.isTypo === true) return 'typo';
  return value ? 'incorrect' : 'unanswered';
}

export function getValidationInputStyle(isFinished, value, isCorrect, baseStyle) {
  if (!isFinished) return baseStyle;
  let style = baseStyle + ' cursor-not-allowed opacity-100 ';
  if (value) {
    if (isCorrect) {
      style +=
        ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 font-semibold';
    } else {
      style +=
        ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 font-semibold';
    }
  } else {
    style += ' bg-white border-slate-300 text-slate-500 dark:bg-slate-900/50 dark:border-slate-700';
  }
  return style;
}

export function getFeatureLabel(idx, style) {
  if (style === 'ROMAN') {
    return toRoman(idx + 1).toLowerCase();
  }
  return String.fromCharCode(65 + idx);
}
