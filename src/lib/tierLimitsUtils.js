/**
 * Utility functions for fetching and displaying tier rate limits
 * These are used to dynamically populate feature limits on pricing pages
 */

import { supabase } from '@/lib/supabase';

// Default fallback limits if database fetch fails
const DEFAULT_LIMITS = {
  free: {
    writing_monthly_limit: 1,
    speaking_monthly_limit: 0,
    writing_daily_limit: 1,
    speaking_daily_limit: 0,
  },
  pro: {
    writing_monthly_limit: 100,
    speaking_monthly_limit: 50,
    writing_daily_limit: 10,
    speaking_daily_limit: 5,
  },
  premium: {
    writing_monthly_limit: 200,
    speaking_monthly_limit: 100,
    writing_daily_limit: 20,
    speaking_daily_limit: 10,
  },
  admin: {
    writing_monthly_limit: 1000,
    speaking_monthly_limit: 1000,
    writing_daily_limit: 100,
    speaking_daily_limit: 100,
  },
};

// Cache for tier limits to avoid repeated fetches
let limitsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all tier limits from the database
 * @returns {Promise<Object>} Object with tier names as keys and limit objects as values
 */
export async function fetchAllTierLimits() {
  const now = Date.now();

  // Return cached data if still valid
  if (limitsCache && now - lastFetchTime < CACHE_DURATION_MS) {
    return limitsCache;
  }

  try {
    const { data, error } = await supabase
      .from('tier_rate_limits')
      .select(
        'tier, writing_monthly_limit, speaking_monthly_limit, writing_daily_limit, speaking_daily_limit'
      );

    if (error) throw error;

    // Transform array to object keyed by tier
    const limits = {};
    data?.forEach((row) => {
      limits[row.tier] = {
        writing_monthly_limit: row.writing_monthly_limit,
        speaking_monthly_limit: row.speaking_monthly_limit,
        writing_daily_limit: row.writing_daily_limit,
        speaking_daily_limit: row.speaking_daily_limit,
      };
    });

    // Cache the result
    limitsCache = { ...DEFAULT_LIMITS, ...limits };
    lastFetchTime = now;

    return limitsCache;
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

  const formatLimit = (limit, label) => {
    if (limit === -1 || limit === '-1') return `Unlimited ${label}`;
    return `${limit} ${label}`;
  };

  return {
    writingFeature: formatLimit(writingMonthly, 'AI Writing Evaluations/month'),
    speakingFeature: formatLimit(speakingMonthly, 'AI Speaking Sessions/month'),
  };
}

/**
 * Clear the limits cache (useful after admin updates)
 */
export function clearLimitsCache() {
  limitsCache = null;
  lastFetchTime = 0;
}

/**
 * Get default limits (used as fallback)
 */
export function getDefaultLimits() {
  return DEFAULT_LIMITS;
}
