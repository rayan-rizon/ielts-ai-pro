import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Configured to allow standard text formatting and images but strip script tags and dangerous attributes.
 *
 * @param content - The HTML content to sanitize
 * @returns - The sanitized HTML
 */
export const sanitizeHtml = (content: string | undefined | null): string => {
    if (!content) return '';

    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
            'p',
            'br',
            'strong',
            'b',
            'i',
            'em',
            'u',
            's',
            'strike',
            'ul',
            'ol',
            'li',
            'blockquote',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'span',
            'div',
            'hr',
            'img',
            'a',
        ],
        ALLOWED_ATTR: [
            'href',
            'target',
            'src',
            'alt',
            'title',
            'width',
            'height',
            'style',
            'class',
            'align',
            'rel',
            'id',
            'referrerpolicy',
        ],

        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
};

/**
 * Validates if the content contains potentially malicious patterns even if sanitized.
 * Useful for flagging content for review.
 *
 * @param content
 * @returns - True if suspicious
 */
export const hasSuspiciousContent = (content: string): boolean => {
    const suspiciousPatterns = [/<script/i, /javascript:/i, /onload=/i, /onerror=/i, /onclick=/i];

    return suspiciousPatterns.some((pattern) => pattern.test(content));
};
