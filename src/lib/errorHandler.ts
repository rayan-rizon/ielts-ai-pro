/**
 * Centralized Error Handling Utility
 *
 * Provides standardized error categorization, formatting, and handling
 * across the application.
 */

/**
 * Error categories for consistent handling
 */
export const ErrorCategory = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  PERMISSION: 'permission',
  SERVER: 'server',
  RATE_LIMIT: 'rate_limit',
  UNKNOWN: 'unknown',
} as const;

export type ErrorCategoryType = (typeof ErrorCategory)[keyof typeof ErrorCategory];

/**
 * User-friendly error messages by category
 */
const ErrorMessages: Record<ErrorCategoryType, string> = {
  [ErrorCategory.NETWORK]:
    'Unable to connect to the server. Please check your internet connection.',
  [ErrorCategory.AUTH]: 'Authentication failed. Please sign in again.',
  [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
  [ErrorCategory.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCategory.PERMISSION]: 'You do not have permission to perform this action.',
  [ErrorCategory.SERVER]: 'An unexpected error occurred. Please try again later.',
  [ErrorCategory.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorCategory.UNKNOWN]: 'Something went wrong. Please try again.',
};

interface ErrorLike {
  message?: string;
  name?: string;
  status?: number;
  statusCode?: number;
  code?: string | number;
}

interface HandleErrorOptions {
  onAuth?: (error: ErrorLike) => void;
  onNetwork?: (error: ErrorLike) => void;
  onRateLimit?: (error: ErrorLike) => void;
  showToast?: (options: { title: string; description: string; variant: string }) => void;
  log?: boolean;
}

/**
 * Categorize an error based on its properties
 */
export function categorizeError(error: ErrorLike | null | undefined): ErrorCategoryType {
  if (!error) return ErrorCategory.UNKNOWN;

  const message = (error.message || '').toLowerCase();
  const status = error.status || error.statusCode || error.code;
  const numStatus = typeof status === 'number' ? status : parseInt(String(status), 10);

  // Rate limit errors
  if (
    numStatus === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    error.name === 'RateLimitError'
  ) {
    return ErrorCategory.RATE_LIMIT;
  }

  // Network errors
  if (
    (error.name === 'TypeError' && message.includes('fetch')) ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('net::') ||
    status === 'NETWORK_ERROR'
  ) {
    return ErrorCategory.NETWORK;
  }

  // Authentication errors
  if (
    numStatus === 401 ||
    message.includes('unauthorized') ||
    message.includes('not authenticated') ||
    message.includes('invalid login') ||
    message.includes('jwt') ||
    message.includes('session')
  ) {
    return ErrorCategory.AUTH;
  }

  // Permission errors
  if (numStatus === 403 || message.includes('forbidden') || message.includes('permission')) {
    return ErrorCategory.PERMISSION;
  }

  // Not found errors
  if (numStatus === 404 || message.includes('not found')) {
    return ErrorCategory.NOT_FOUND;
  }

  // Validation errors
  if (
    numStatus === 400 ||
    numStatus === 422 ||
    message.includes('validation') ||
    message.includes('invalid')
  ) {
    return ErrorCategory.VALIDATION;
  }

  // Server errors
  if (numStatus >= 500 && numStatus < 600) {
    return ErrorCategory.SERVER;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get a user-friendly message for an error
 */
export function getErrorMessage(error: ErrorLike | null | undefined): string {
  if (!error) return ErrorMessages[ErrorCategory.UNKNOWN];

  const category = categorizeError(error);
  const defaultMessage = ErrorMessages[category];

  // For validation errors, try to show the specific message
  if (category === ErrorCategory.VALIDATION && error.message) {
    return error.message;
  }

  // For auth errors, show specific message if available
  if (category === ErrorCategory.AUTH && error.message) {
    const authMessage = error.message.toLowerCase();
    if (authMessage.includes('email not confirmed')) {
      return 'Please verify your email address before signing in.';
    }
    if (authMessage.includes('invalid login')) {
      return 'Invalid email or password.';
    }
  }

  // For rate limit errors, return the original message if it contains timing info
  if (category === ErrorCategory.RATE_LIMIT && error.message) {
    return error.message;
  }

  return defaultMessage;
}

/**
 * Handle an error consistently across the app
 */
export function handleError(
  error: ErrorLike | null | undefined,
  options: HandleErrorOptions = {}
): { category: ErrorCategoryType; message: string } {
  const {
    onAuth,
    onNetwork,
    onRateLimit,
    showToast,
    log = typeof window !== 'undefined' && window.location?.hostname === 'localhost',
  } = options;

  const category = categorizeError(error);
  const message = getErrorMessage(error);

  // Log in development
  if (log && error) {
    console.error(`[${category.toUpperCase()}] Error:`, error);
  }

  // Handle specific categories
  if (category === ErrorCategory.AUTH && onAuth && error) {
    onAuth(error);
  }

  if (category === ErrorCategory.NETWORK && onNetwork && error) {
    onNetwork(error);
  }

  if (category === ErrorCategory.RATE_LIMIT && onRateLimit && error) {
    onRateLimit(error);
  }

  // Show toast notification
  if (showToast) {
    const title =
      category === ErrorCategory.NETWORK
        ? 'Connection Error'
        : category === ErrorCategory.RATE_LIMIT
          ? 'Please Slow Down'
          : 'Error';
    showToast({
      title,
      description: message,
      variant: 'destructive',
    });
  }

  return { category, message };
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: HandleErrorOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return (await fn(...args)) as ReturnType<T>;
    } catch (error) {
      handleError(error as ErrorLike, options);
      throw error;
    }
  };
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: ErrorLike | null | undefined): boolean {
  return categorizeError(error) === ErrorCategory.NETWORK;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: ErrorLike | null | undefined): boolean {
  return categorizeError(error) === ErrorCategory.AUTH;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: ErrorLike | null | undefined): boolean {
  return categorizeError(error) === ErrorCategory.RATE_LIMIT;
}

export default {
  ErrorCategory,
  categorizeError,
  getErrorMessage,
  handleError,
  withErrorHandling,
  isNetworkError,
  isAuthError,
  isRateLimitError,
};
