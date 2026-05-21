import { getSupabaseClient } from '@/lib/supabase';
import { checkRateLimit, RATE_LIMITS, getRemainingRequests } from '@/lib/rateLimiter';
import {
  getFromCache,
  setInCache,
  CACHE_TTL,
  createCacheKey,
  invalidateCache,
} from '@/lib/apiCache';
import { getCsrfHeaders } from '@/lib/csrf';

// Get the Supabase Functions URL based on environment
// Use the same URL as the main Supabase client, with fallback to production
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://zvrmvycajimjxghrnpgy.supabase.co';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Call a Supabase Edge Function with proper authentication, rate limiting, and error handling
 * @param {string} functionName - Name of the Edge Function
 * @param {object} payload - Data to send to the function
 * @param {object} options - Additional options { headers, rateLimit, cache }
 * @returns {Promise<object>} - Response from the Edge Function
 */
export async function callEdgeFunction(functionName, payload = {}, options = {}) {
  const { rateLimit = null, cache = null, headers: customHeaders = {} } = options;

  // Check rate limit if specified
  if (rateLimit) {
    const rateLimitKey = `api:${functionName}`;
    const { allowed, resetMs } = checkRateLimit(rateLimitKey, rateLimit);

    if (!allowed) {
      const error = new Error(
        `Rate limit exceeded for ${functionName}. Try again in ${Math.ceil(resetMs / 1000)} seconds.`
      );
      error.name = 'RateLimitError';
      error.resetMs = resetMs;
      throw error;
    }
  }

  // Check cache if enabled
  if (cache) {
    const cacheKey = createCacheKey(functionName, payload);
    const cached = getFromCache(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  try {
    // Get current session for authentication using direct client access
    const client = await getSupabaseClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();

    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }

    if (!sessionData?.session?.access_token) {
      throw new Error('No valid session found. Please log in.');
    }

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
        ...(SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : {}),
        ...getCsrfHeaders(), // Include CSRF headers for Edge Function security
        ...customHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Edge Function error: ${response.status}`;
      let parsedError = null;
      try {
        parsedError = await response.json();
        errorMessage = parsedError.error || parsedError.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${await response.text()}`;
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      if (response.status === 429) {
        error.name = 'RateLimitError';
        // Distinguish burst limit vs quota exceeded:
        // - quotaExceededResponse includes dailyUsed/monthlyUsed fields
        // - burst limit only returns { error, message }
        error.rateLimitType = parsedError?.dailyUsed !== undefined ? 'quota' : 'burst';
        error.quotaInfo = parsedError || null;
        const retryAfterSeconds = parsedError?.retryAfterSeconds;
        if (typeof retryAfterSeconds === 'number' && Number.isFinite(retryAfterSeconds)) {
          error.retryAfterSeconds = retryAfterSeconds;
          error.resetMs = retryAfterSeconds * 1000;
        }
      }

      throw error;
    }

    const result = await response.json();

    // Cache the result if caching is enabled
    if (cache) {
      const cacheKey = createCacheKey(functionName, payload);
      setInCache(cacheKey, result, cache.ttl || CACHE_TTL.MEDIUM);
    }

    return result;
  } catch (error) {
    // Retry logic for 401/403 (Token potentially expired/refreshing)
    if ((error.status === 401 || error.status === 403) && !options._isRetry) {
      console.warn(`Edge Function ${functionName} returned ${error.status}. Retrying once...`);
      // Wait 1 second to allow potential background token refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return callEdgeFunction(functionName, payload, { ...options, _isRetry: true });
    }

    if (error.status === 403) {
      console.warn(`Edge Function ${functionName} returned 403 (permission denied) — skipping.`);
    } else {
      console.error(`Error calling Edge Function ${functionName}:`, error);
    }

    // Classify the error for better UX
    const errorMessage = error.message || '';
    const isNetworkError =
      errorMessage.toLowerCase().includes('failed to fetch') ||
      errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('timeout') ||
      error.name === 'TypeError';

    if (isNetworkError) {
      const networkError = new Error(
        'Unable to connect to AI service. Please check your internet connection and try again.'
      );
      networkError.name = 'NetworkError';
      networkError.isNetworkError = true;
      networkError.originalMessage = errorMessage;
      throw networkError;
    }

    // Add user-friendly message property
    error.userMessage =
      error.name === 'RateLimitError'
        ? `Too many requests. Please wait ${Math.ceil((error.resetMs || 60000) / 1000)} seconds.`
        : error.status === 401 || error.status === 403
          ? 'Please log in again to use AI features.'
          : error.status >= 500
            ? 'AI service is temporarily unavailable. Please try again in a moment.'
            : errorMessage;

    throw error;
  }
}

/**
 * Generate adaptive learning path for the authenticated user
 * Rate limited: 5 per minute (AI operation)
 * Cached: 5 minutes
 * Identity derived from JWT token (no userId needed)
 * @returns {Promise<object>} - Learning path data
 */
export async function generateAdaptiveLearningPath() {
  return callEdgeFunction(
    'generateAdaptiveLearningPath',
    {},
    {
      rateLimit: RATE_LIMITS.AI_OPERATION,
      cache: { ttl: CACHE_TTL.LONG }, // 30 minutes - learning paths don't change frequently
    }
  );
}

/**
 * Generate detailed feedback for a writing task
 * Rate limited: 5 per minute (AI operation)
 * NOT cached (unique per submission)
 * @param {object} payload - { writingText, taskPrompt, taskType, imageUrl }
 * @returns {Promise<object>} - Feedback data
 */
export async function generateDetailedFeedback(payload) {
  return callEdgeFunction('generateDetailedFeedback', payload, {
    rateLimit: RATE_LIMITS.AI_OPERATION,
    // No cache - each feedback is unique
  });
}

/**
 * Generate study recommendations for the authenticated user
 * Rate limited: 5 per minute (AI operation)
 * Cached: 5 minutes
 * Identity derived from JWT token (no userId needed)
 * @returns {Promise<object>} - Study recommendations
 */
export async function generateStudyRecommendations() {
  return callEdgeFunction(
    'generateStudyRecommendations',
    {},
    {
      rateLimit: RATE_LIMITS.AI_OPERATION,
      cache: { ttl: CACHE_TTL.MEDIUM },
    }
  );
}

/**
 * Update user points
 * Rate limited: 10 per minute
 * NOT cached (mutation)
 * @param {string|object} payloadOrUserId - User ID or payload object
 * @param {number} [points] - Points to add (if first arg is userId)
 * @returns {Promise<object>} - Updated points data
 */
export async function updateUserPoints(payloadOrUserId, points) {
  let payload;
  if (typeof payloadOrUserId === 'object' && payloadOrUserId !== null) {
    payload = payloadOrUserId;
  } else {
    payload = { userId: payloadOrUserId, points: points };
  }

  if (!payload.userId) {
    const client = await getSupabaseClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user?.id) payload.userId = user.id;
  }

  const result = await callEdgeFunction('updateUserPoints', payload, {
    rateLimit: RATE_LIMITS.POINTS_UPDATE,
  });

  // Invalidate any user-related caches after points update
  invalidateCache(/^generateAdaptiveLearningPath:/);
  invalidateCache(/^generateStudyRecommendations:/);

  return result;
}

/**
 * Send email via Edge Function
 * Rate limited: Standard (30 per minute)
 * NOT cached
 * @param {object} emailData - Email data (to, subject, content, from_name)
 * @returns {Promise<object>} - Email send result
 */
export async function sendEmail(emailData) {
  return callEdgeFunction('sendEmail', emailData, {
    rateLimit: RATE_LIMITS.STANDARD,
  });
}

/**
 * Get remaining API requests for a function.
 * Useful for showing users their quota.
 * @param {string} functionName - Name of the function
 * @param {'AI_OPERATION'|'STANDARD'|'SEARCH'|'POINTS_UPDATE'} limitType - Type of rate limit
 * @returns {number} - Remaining requests
 */
export function getApiQuota(functionName, limitType = 'AI_OPERATION') {
  const rateLimitKey = `api:${functionName}`;
  return getRemainingRequests(rateLimitKey, RATE_LIMITS[limitType]);
}
