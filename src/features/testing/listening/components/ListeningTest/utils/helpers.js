/**
 * Listening Test Helper Functions
 *
 * Utility functions for question display and formatting.
 */

/**
 * Convert number to Roman Numeral (used in matching features)
 * @param {number} num - Number to convert
 * @returns {string} Roman numeral representation
 */
export const toRoman = (num) => {
  const lookup = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = '',
    i;
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
};

/**
 * Format seconds to MM:SS display
 * @param {number} sec - Seconds to format
 * @returns {string} Formatted time string
 */
export const formatSeconds = (sec) => {
  if (!sec || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
