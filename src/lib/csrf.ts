/**
 * CSRF Token Utility
 * 
 * Provides CSRF token management for API calls to Edge Functions.
 * Works with the server-side CSRF validation in _shared/security.ts
 */

// Generate a simple CSRF token (UUID v4)
function generateCsrfToken(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Store the token in memory (regenerated on page load for security)
let csrfToken: string | null = null;

/**
 * Get the current CSRF token, generating one if needed.
 * Token is stored per-session and regenerated on page reload.
 */
export function getCsrfToken(): string {
    if (!csrfToken) {
        csrfToken = generateCsrfToken();
    }
    return csrfToken;
}

/**
 * Get headers object with CSRF token included.
 * Use this for all state-changing API calls to Edge Functions.
 * 
 * @example
 * ```ts
 * const response = await fetch(url, {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     ...getCsrfHeaders(),
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function getCsrfHeaders(): Record<string, string> {
    return {
        'x-csrf-token': getCsrfToken(),
        'x-requested-with': 'XMLHttpRequest', // Additional protection
    };
}

/**
 * Wrapper for fetch that automatically includes CSRF headers.
 * Use for POST/PUT/DELETE requests to Edge Functions.
 */
export async function csrfFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers = new Headers(options.headers);

    // Add CSRF headers for non-GET requests
    if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
        headers.set('x-csrf-token', getCsrfToken());
        headers.set('x-requested-with', 'XMLHttpRequest');
    }

    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * Create Supabase function invoke options with CSRF headers.
 * Use when calling supabase.functions.invoke()
 * 
 * @example
 * ```ts
 * const { data, error } = await supabase.functions.invoke('myFunction', {
 *   body: { someData: 'value' },
 *   headers: getCsrfHeaders(),
 * });
 * ```
 */
export function getSupabaseFunctionHeaders(): Record<string, string> {
    return getCsrfHeaders();
}
