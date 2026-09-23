/**
 * Utility functions for fetching and displaying tier rate limits
 * These are used to dynamically populate feature limits on pricing pages
 */

import { supabase } from '@/lib/supabase';

export const WRITING_PARTS_PER_EVALUATION = 2;

export function getWritingPartCapacity(evaluationLimit) {
  if (evaluationLimit === -1 || evaluationLimit === '-1') return Infinity;
  const normalized = Number(evaluationLimit);
  return Number.isFinite(normalized) ? Math.max(0, normalized) * WRITING_PARTS_PER_EVALUATION : 0;
}

export function getWritingQuotaUsage(partReviewCount) {
  const normalized = Number(partReviewCount);
  return Number.isFinite(normalized) ? Math.max(0, normalized) / WRITING_PARTS_PER_EVALUATION : 0;
}

// Default fallback limits if database fetch fails
const DEFAULT_LIMITS = {
  free: {
    writing_monthly_limit: 1,
    speaking_monthly_limit: 0,
    writing_daily_limit: 1,
    speaking_daily_limit: 0,
    reading_daily_limit: -1,
    reading_monthly_limit: -1,
    listening_daily_limit: -1,
    listening_monthly_limit: -1,
  },
  pro: {
    writing_monthly_limit: 100,
    speaking_monthly_limit: 50,
    writing_daily_limit: 10,
    speaking_daily_limit: 5,
    reading_daily_limit: -1,
    reading_monthly_limit: -1,
    listening_daily_limit: -1,
    listening_monthly_limit: -1,
  },
  premium: {
    writing_monthly_limit: 200,
    speaking_monthly_limit: 100,
    writing_daily_limit: 20,
    speaking_daily_limit: 10,
    reading_daily_limit: -1,
    reading_monthly_limit: -1,
    listening_daily_limit: -1,
    listening_monthly_limit: -1,
  },
  admin: {
    writing_monthly_limit: 1000,
    speaking_monthly_limit: 1000,
    writing_daily_limit: 100,
    speaking_daily_limit: 100,
    reading_daily_limit: -1,
    reading_monthly_limit: -1,
    listening_daily_limit: -1,
    listening_monthly_limit: -1,
  },
};

// Cache for tier limits to avoid repeated fetches (keyed by currency)
let limitsCache = {};
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all tier limits from the database for a specific currency
 * @param {string} currency - The currency code (e.g., 'USD', 'BDT')
 * @returns {Promise<Object>} Object with tier names as keys and limit objects as values
 */
export async function fetchAllTierLimits(currency = 'ALL') {
  const cacheKey = currency.toUpperCase();
  const now = Date.now();

  // Return cached data if still valid
  if (limitsCache[cacheKey] && now - lastFetchTime < CACHE_DURATION_MS) {
    return limitsCache[cacheKey];
  }

  try {
    const { data, error } = await supabase
      .from('tier_rate_limits')
      .select(
        'tier, currency, writing_monthly_limit, speaking_monthly_limit, writing_daily_limit, speaking_daily_limit, reading_daily_limit, reading_monthly_limit, listening_daily_limit, listening_monthly_limit'
      )
      .in('currency', [cacheKey, 'ALL']);

    if (error) throw error;

    // Transform array to object keyed by tier
    const limits = {};
    const exactMatches = data?.filter((r) => r.currency === cacheKey) || [];
    const allMatches = data?.filter((r) => r.currency === 'ALL') || [];

    // Initialize with 'ALL' fallback limits first
    allMatches.forEach((row) => {
      limits[row.tier] = {
        writing_monthly_limit: row.writing_monthly_limit,
        speaking_monthly_limit: row.speaking_monthly_limit,
        writing_daily_limit: row.writing_daily_limit,
        speaking_daily_limit: row.speaking_daily_limit,
        reading_daily_limit: row.reading_daily_limit,
        reading_monthly_limit: row.reading_monthly_limit,
        listening_daily_limit: row.listening_daily_limit,
        listening_monthly_limit: row.listening_monthly_limit,
      };
    });

    // Override with exact currency settings if they exist
    exactMatches.forEach((row) => {
      limits[row.tier] = {
        writing_monthly_limit: row.writing_monthly_limit,
        speaking_monthly_limit: row.speaking_monthly_limit,
        writing_daily_limit: row.writing_daily_limit,
        speaking_daily_limit: row.speaking_daily_limit,
        reading_daily_limit: row.reading_daily_limit,
        reading_monthly_limit: row.reading_monthly_limit,
        listening_daily_limit: row.listening_daily_limit,
        listening_monthly_limit: row.listening_monthly_limit,
      };
    });

    // Cache the result
    limitsCache[cacheKey] = { ...DEFAULT_LIMITS, ...limits };
    lastFetchTime = now;

    return limitsCache[cacheKey];
  } catch (error) {
    console.error('Error fetching tier limits:', error);
    return DEFAULT_LIMITS;
  }
}

/**
 * Get tier limits for a specific tier
 * @param {string} tier - The tier name (free, pro, premium)
 * @returns {Promise<Object>} The limit object for the tier
 */
export async function getTierLimits(tier) {
  const allLimits = await fetchAllTierLimits();
  return allLimits[tier] || DEFAULT_LIMITS.free;
}

/**
 * Generate feature strings for a tier based on its limits
 * @param {string} tier - The tier name
 * @param {Object} limits - The limits object for the tier
 * @returns {Object} Object containing formatted feature strings
 */
export function generateFeatureStrings(tier, limits) {
  const writingMonthly =
    limits?.writing_monthly_limit ?? DEFAULT_LIMITS[tier]?.writing_monthly_limit ?? 0;
  const speakingMonthly =
    limits?.speaking_monthly_limit ?? DEFAULT_LIMITS[tier]?.speaking_monthly_limit ?? 0;

  const formatLimit = (limit, singularLabel, pluralLabel) => {
    if (limit === -1 || limit === '-1') return `Unlimited ${pluralLabel}`;
    return `${limit} ${Number(limit) === 1 ? singularLabel : pluralLabel}`;
  };

  const formatTestStarts = (type) => {
    if (tier !== 'free') return `Unlimited ${type} tests`;
    const daily = limits?.[`${type.toLowerCase()}_daily_limit`] ?? -1;
    const monthly = limits?.[`${type.toLowerCase()}_monthly_limit`] ?? -1;
    if (daily === -1 && monthly === -1) return `Unlimited ${type} tests`;
    const parts = [];
    if (daily !== -1) parts.push(`${daily}/day`);
    if (monthly !== -1) parts.push(`${monthly}/month`);
    return `${type} tests: ${parts.join(', ')}`;
  };

  return {
    readingFeature: formatTestStarts('Reading'),
    listeningFeature: formatTestStarts('Listening'),
    writingFeature: formatLimit(
      writingMonthly,
      'AI Writing Evaluation/month',
      'AI Writing Evaluations/month'
    ),
    speakingFeature: formatLimit(
      speakingMonthly,
      'AI Speaking Session/month',
      'AI Speaking Sessions/month'
    ),
  };
}

/**
 * Clear the limits cache (useful after admin updates)
 */
export function clearLimitsCache() {
  limitsCache = {};
  lastFetchTime = 0;
}

/**
 * Get default limits (used as fallback)
 */
export function getDefaultLimits() {
  return DEFAULT_LIMITS;
}
