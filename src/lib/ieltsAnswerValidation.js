/**
 * IELTS Answer Validation Utility
 *
 * Centralized answer validation logic for IELTS Reading and Listening tests.
 * Handles the Cambridge IELTS answer format with:
 * - Optional content in parentheses: (£) 115
 * - Inline alternatives: a/one hundred
 * - Main alternatives separated by " / "
 * - Legacy admin alternatives separated by " , " or " ; "
 * - Currency symbol flexibility
 *
 * Includes memoization for performance optimization.
 */

// Cache for expanded answer variations to avoid re-computation
const answerCache = new Map();
const MAX_CACHE_ENTRIES = 500;
const MAX_VARIATIONS = 256;
const MAX_EXPANSION_DEPTH = 12;

function cacheVariations(key, variations) {
  // Map preserves insertion order, so this is a compact LRU cache.
  if (answerCache.has(key)) answerCache.delete(key);
  answerCache.set(key, variations);
  if (answerCache.size > MAX_CACHE_ENTRIES) answerCache.delete(answerCache.keys().next().value);
}

/**
 * Normalize an answer string for comparison
 * @param {string} answer - Answer to normalize
 * @returns {string} Lowercase trimmed answer with normalized whitespace
 */
export const normalizeAnswer = (answer) => {
  if (!answer) return '';
  return String(answer).trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Parse IELTS Cambridge answer format and generate all valid variations
 * Handles:
 * - (optional) content in parentheses
 * - a/b alternatives within words/phrases
 * - Combinations of the above
 *
 * Results are cached for performance.
 *
 * @param {string} answerPattern - IELTS answer pattern like "(£) 115 / a/one hundred (and) fifteen"
 * @returns {string[]} Array of all valid answer variations
 */
export const parseIeltsAnswerVariations = (answerPattern) => {
  if (!answerPattern) return [];

  // Check cache first
  const cacheKey = String(answerPattern);
  if (answerCache.has(cacheKey)) {
    return answerCache.get(cacheKey);
  }

  const normalized = String(answerPattern).trim();

  // Split by main "/" separators (answers separated by space-/-space pattern)
  // BUT: Don't split on slashes that are inside parentheses
  // e.g., "(its / huarango / the) branches" should NOT be split
  // but "cat / dog" should be split into ["cat", "dog"]
  const mainAlternatives = splitMainAlternatives(normalized);

  const allVariations = [];

  const expansionState = { remaining: MAX_VARIATIONS };
  mainAlternatives.forEach((alternative) => {
    const variations = expandAnswerVariations(alternative.trim(), expansionState);
    allVariations.push(...variations);
  });

  // Normalize all variations and deduplicate
  const result = [...new Set(allVariations.map((v) => normalizeAnswer(v)))].filter(
    (v) => v.length > 0
  );

  // Cache the result
  cacheVariations(cacheKey, result);

  return result;
};

/**
 * Split answer pattern by main alternatives (separated by " / ", " , ", or " ; ")
 * but ignore slashes that are inside parentheses
 * @param {string} pattern
 * @returns {string[]}
 */
const splitMainAlternatives = (pattern) => {
  const alternatives = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (
      parenDepth === 0 &&
      ((char === '/' &&
        // Distinguish main alternatives from inline alternatives like "a/one".
        (pattern[i - 1] === ' ' || pattern[i + 1] === ' ')) ||
        // Older admin entries used whitespace-wrapped commas/semicolons.
        // Requiring whitespace on both sides avoids splitting normal punctuation.
        ((char === ',' || char === ';') && pattern[i - 1] === ' ' && pattern[i + 1] === ' '))
    ) {
      // This is a main separator outside parentheses
      if (current.trim()) {
        alternatives.push(current.trim());
      }
      current = '';
      // Skip the separator's trailing space.
      if (pattern[i + 1] === ' ') i++;
    } else {
      current += char;
    }
  }

  // Don't forget the last part
  if (current.trim()) {
    alternatives.push(current.trim());
  }

  return alternatives.length > 0 ? alternatives : [pattern];
};

/**
 * Expand a single answer pattern into all its possible variations
 * Handles IELTS Cambridge format:
 * - (optional) parts in parentheses that can be included or omitted
 * - Alternatives inside parentheses like (its/huarango/the) branches → branches, its branches, huarango branches, the branches
 * - Inline alternatives like a/one → a OR one
 *
 * @param {string} pattern - Single answer pattern like "(its/huarango/the) branches"
 * @returns {string[]} All valid variations
 */
const expandAnswerVariations = (pattern, state = { remaining: MAX_VARIATIONS }, depth = 0) => {
  if (!pattern || state.remaining <= 0) return [];
  if (depth >= MAX_EXPANSION_DEPTH) {
    state.remaining -= 1;
    return [pattern];
  }

  // Find optional parts (content in parentheses)
  const optionalRegex = /\(([^)]+)\)/;
  const optMatch = pattern.match(optionalRegex);

  if (optMatch) {
    const before = pattern.substring(0, optMatch.index);
    const after = pattern.substring(optMatch.index + optMatch[0].length);
    const optionalContent = optMatch[1];

    // Check if the optional content contains alternatives (/)
    if (optionalContent.includes('/')) {
      // Split by / to get alternatives: "its/huarango/the" → ["its", "huarango", "the"]
      const alternatives = optionalContent.split('/').map((a) => a.trim());

      // Generate variations:
      // 1. Without the optional part at all
      const withoutVariations = expandAnswerVariations(
        (before + after).replace(/\s+/g, ' ').trim(),
        state,
        depth + 1
      );

      // 2. With each alternative
      const withVariations = alternatives.flatMap((alt) =>
        expandAnswerVariations((before + alt + after).replace(/\s+/g, ' ').trim(), state, depth + 1)
      );

      return [...withoutVariations, ...withVariations];
    } else {
      // Simple optional content (no alternatives inside)
      const withContent = (before + optionalContent + after).replace(/\s+/g, ' ').trim();
      const withoutContent = (before + after).replace(/\s+/g, ' ').trim();

      return [
        ...expandAnswerVariations(withContent, state, depth + 1),
        ...expandAnswerVariations(withoutContent, state, depth + 1),
      ];
    }
  }

  // Handle inline alternatives (not in parentheses): a/one, carbon/insulating, etc.
  // Match multi-way alternatives: word1/word2/word3
  // Support words with hyphens and apostrophes: e.g. "low-cost/cheap" or "didn't/did not"
  const inlineAltRegex = /\b([\w'-]+(?:\/[\w'-]+)+)\b/;
  const altMatch = pattern.match(inlineAltRegex);

  if (altMatch) {
    // Only treat as alternatives if it's NOT a numeric fraction (e.g., "1/2")
    // and NOT a date-like format (e.g., "12/05")
    const isNumericFraction = /^[\d/]+$/.test(altMatch[1]);

    if (!isNumericFraction) {
      const before = pattern.substring(0, altMatch.index);
      const after = pattern.substring(altMatch.index + altMatch[0].length);
      const alternatives = altMatch[1].split('/').map((a) => a.trim());

      // Generate a variation for each alternative
      return alternatives.flatMap((alt) =>
        expandAnswerVariations((before + alt + after).replace(/\s+/g, ' ').trim(), state, depth + 1)
      );
    }
  }

  // No special patterns, return as-is
  state.remaining -= 1;
  return [pattern];
};

/**
 * Check if a user answer matches any acceptable correct answer
 * Handles IELTS Cambridge answer format:
 * - (optional) parts in parentheses
 * - a/b inline alternatives
 * - Main alternatives separated by " / "
 *
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer (IELTS Cambridge format)
 * @returns {boolean} Whether the answer is correct
 */
export const isAnswerCorrect = (userAnswer, correctAnswer) => {
  if (!userAnswer || !correctAnswer) return false;

  const normalizedUser = normalizeAnswer(userAnswer);
  if (!normalizedUser) return false;

  // Parse all valid variations from the IELTS answer pattern (cached)
  const validAnswers = parseIeltsAnswerVariations(correctAnswer);

  // Check if user's answer matches any valid variation
  return validAnswers.some((valid) => {
    // Exact match
    if (normalizedUser === valid) return true;

    // Match without leading/trailing currency symbols for number answers
    // e.g., user types "115" and valid is "£ 115"
    const userWithoutCurrency = normalizedUser.replace(/^[£$€¥]\s*/, '').replace(/\s*[£$€¥]$/, '');
    const validWithoutCurrency = valid.replace(/^[£$€¥]\s*/, '').replace(/\s*[£$€¥]$/, '');

    if (userWithoutCurrency === validWithoutCurrency) return true;
    if (userWithoutCurrency === valid) return true;
    if (normalizedUser === validWithoutCurrency) return true;

    // Hyphen / space flexibility: e.g. "forty-eight" vs "forty eight" or "wi-fi" vs "wifi"
    const userNoHyphen = normalizedUser.replace(/-/g, ' ').replace(/\s+/g, ' ');
    const validNoHyphen = valid.replace(/-/g, ' ').replace(/\s+/g, ' ');
    if (userNoHyphen === validNoHyphen) return true;

    const userCleanHyphen = normalizedUser.replace(/-/g, '');
    const validCleanHyphen = valid.replace(/-/g, '');
    if (userCleanHyphen === validCleanHyphen) return true;

    // Numeric decimal equivalence: e.g. "67.5" vs "67.50"
    const numUser = Number(userWithoutCurrency);
    const numValid = Number(validWithoutCurrency);
    if (
      !isNaN(numUser) &&
      !isNaN(numValid) &&
      userWithoutCurrency.length > 0 &&
      validWithoutCurrency.length > 0
    ) {
      if (numUser === numValid) return true;
    }

    // Date Month Order Inversion: e.g., "13th January" vs "January 13th"
    const datePattern = /^(\d{1,2}(?:st|nd|rd|th)?)\s+(?:of\s+)?([a-z]+)$/;
    const userDateMatch = normalizedUser.match(datePattern);
    const validDateMatch = valid.match(datePattern);

    if (userDateMatch) {
      const invertedUser = `${userDateMatch[2]} ${userDateMatch[1]}`;
      if (invertedUser === valid) return true;
    }
    if (validDateMatch) {
      const invertedValid = `${validDateMatch[2]} ${validDateMatch[1]}`;
      if (normalizedUser === invertedValid) return true;
    }

    return false;
  });
};

/**
 * Clear the answer cache (useful for testing or memory management)
 */
export const clearAnswerCache = () => {
  answerCache.clear();
};

/**
 * Get cache statistics for debugging
 * @returns {{ size: number }} Cache statistics
 */
export const getAnswerCacheStats = () => ({
  size: answerCache.size,
});

export default {
  normalizeAnswer,
  parseIeltsAnswerVariations,
  isAnswerCorrect,
  clearAnswerCache,
  getAnswerCacheStats,
};
