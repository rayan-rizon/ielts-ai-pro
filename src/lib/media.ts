
/**
 * Media URL Helper
 * 
 * Handles resolution of media URLs, supporting both R2 and legacy fallback locations.
 */

// Base URL for R2 storage - configured via environment variable
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://media.ieltsai.pro';

/**
 * Resolves a media path or URL to the appropriate full URL.
 * 
 * @param urlOrPath - The stored URL or path (e.g., 'audio/listening/...' or 'https://...')
 * @returns Full URL to the media asset
 */
export function getMediaUrl(urlOrPath) {
    if (!urlOrPath) return '';

    // If it's already a full URL, return it
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
        return urlOrPath;
    }

    // If it's a relative path, assume it's on R2
    // Encapsulating this logic allows us to easily switch CDN providers later
    return `${R2_PUBLIC_URL}/${urlOrPath.startsWith('/') ? urlOrPath.slice(1) : urlOrPath}`;
}

/**
 * Helper to determine if a URL is an R2 URL
 */
export function isR2Url(url) {
    if (!url) return false;
    return url.includes(R2_PUBLIC_URL) || url.includes('.r2.dev');
}
