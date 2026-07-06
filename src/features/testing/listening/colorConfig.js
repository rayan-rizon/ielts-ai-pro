// Color palette lookup for listening test cards.
// Deterministically maps a string to one of the palette colors via a hash.

export const COLOR_KEYS = ['violet', 'orange', 'blue', 'indigo', 'rose', 'cyan'];

export const colorVariants = {
  violet: {
    gradient:
      'from-violet-50/80 via-white to-white dark:from-violet-900/10 dark:via-[#151515] dark:to-[#151515]',
    hover: 'from-violet-100/50 via-transparent to-transparent dark:from-violet-900/30',
    text: 'text-violet-500 dark:text-violet-400',
    border: 'border-violet-100 dark:border-white/10',
    badge:
      'bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300',
    button:
      'border-violet-600 dark:border-violet-500 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20',
    ping: 'bg-violet-400',
    dot: 'bg-violet-500',
    progress: 'from-violet-500 to-indigo-600',
  },
  orange: {
    gradient:
      'from-orange-50/80 via-white to-white dark:from-orange-900/10 dark:via-[#151515] dark:to-[#151515]',
    hover: 'from-orange-100/50 via-transparent to-transparent dark:from-orange-900/30',
    text: 'text-orange-500 dark:text-orange-400',
    border: 'border-orange-100 dark:border-white/10',
    badge:
      'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-300',
    button:
      'border-orange-600 dark:border-orange-500 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20',
    ping: 'bg-orange-400',
    dot: 'bg-orange-500',
    progress: 'from-orange-400 to-orange-600',
  },
  cyan: {
    gradient:
      'from-cyan-50/80 via-white to-white dark:from-cyan-900/10 dark:via-[#151515] dark:to-[#151515]',
    hover: 'from-cyan-100/50 via-transparent to-transparent dark:from-cyan-900/30',
    text: 'text-cyan-500 dark:text-cyan-400',
    border: 'border-cyan-100 dark:border-white/10',
    badge:
      'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-100 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300',
    button:
      'border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
    ping: 'bg-cyan-400',
    dot: 'bg-cyan-500',
    progress: 'from-cyan-400 to-cyan-600',
  },
  blue: {
    gradient:
      'from-blue-50/80 via-white to-white dark:from-blue-900/10 dark:via-[#151515] dark:to-[#151515]',
    hover: 'from-blue-100/50 via-transparent to-transparent dark:from-blue-900/30',
    text: 'text-blue-500 dark:text-blue-400',
    border: 'border-blue-100 dark:border-white/10',
    badge:
      'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    button:
      'border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    ping: 'bg-blue-400',
    dot: 'bg-blue-500',
    progress: 'from-blue-400 to-blue-600',
  },
  rose: {
    gradient:
      'from-rose-50/80 via-white to-white dark:from-rose-900/10 dark:via-[#151515] dark:to-[#151515]',
    hover: 'from-rose-100/50 via-transparent to-transparent dark:from-rose-900/30',
    text: 'text-rose-500 dark:text-rose-400',
    border: 'border-rose-100 dark:border-white/10',
    badge:
      'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300',
    button:
      'border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20',
    ping: 'bg-rose-400',
    dot: 'bg-rose-500',
    progress: 'from-rose-400 to-rose-600',
  },
  indigo: {
    gradient:
      'from-indigo-50/80 via-white to-white dark:from-indigo-900/10 dark:via-[#151515] dark:to-[#151515]',
    hover: 'from-indigo-100/50 via-transparent to-transparent dark:from-indigo-900/30',
    text: 'text-indigo-500 dark:text-indigo-400',
    border: 'border-indigo-100 dark:border-white/10',
    badge:
      'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    button:
      'border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    ping: 'bg-indigo-400',
    dot: 'bg-indigo-500',
    progress: 'from-indigo-400 to-indigo-600',
  },
};

/**
 * Deterministically picks a color key from COLOR_KEYS based on a hash of `str`.
 * @param {string} str
 * @returns {string} one of the COLOR_KEYS values
 */
export function getColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_KEYS[Math.abs(hash) % COLOR_KEYS.length];
}
