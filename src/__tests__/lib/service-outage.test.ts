import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SERVICE_ERROR,
  classifyServiceError,
  isServiceOutageError,
  getServiceOutageState,
  reportServiceOutage,
  reportServiceRecovered,
  subscribeToServiceOutage,
  trackServiceError,
  __resetServiceOutageForTests,
} from '@/lib/serviceOutage';

const setOnline = (value: boolean) => {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
};

describe('classifyServiceError', () => {
  beforeEach(() => {
    setOnline(true);
    __resetServiceOutageForTests();
  });

  afterEach(() => {
    setOnline(true);
  });

  it('treats a fetch transport failure as our outage, not a credential problem', () => {
    // This is exactly what Supabase throws in the browser when the service is
    // down — the case that previously reached users as a raw error string.
    expect(classifyServiceError(new TypeError('Failed to fetch'))).toBe(SERVICE_ERROR.OUTAGE);
  });

  it("treats Safari's transport failure wording as an outage", () => {
    expect(classifyServiceError(new TypeError('Load failed'))).toBe(SERVICE_ERROR.OUTAGE);
  });

  it('treats 5xx responses as an outage', () => {
    for (const status of [500, 502, 503, 504]) {
      expect(classifyServiceError({ status, message: 'error' })).toBe(SERVICE_ERROR.OUTAGE);
    }
  });

  it('treats an aborted (timed-out) request as an outage', () => {
    const abort = new Error('The operation was aborted');
    abort.name = 'AbortError';
    expect(classifyServiceError(abort)).toBe(SERVICE_ERROR.OUTAGE);
  });

  it('treats an HTML error page parsed as JSON as an outage', () => {
    const parseError = new SyntaxError('Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON');
    expect(classifyServiceError(parseError)).toBe(SERVICE_ERROR.OUTAGE);
  });

  it("still reports genuinely wrong credentials as the user's problem", () => {
    expect(classifyServiceError({ status: 400, message: 'Invalid login credentials' })).toBe(
      SERVICE_ERROR.CREDENTIALS
    );
  });

  it('keeps unconfirmed email and rate limiting distinct from an outage', () => {
    expect(classifyServiceError({ status: 400, message: 'Email not confirmed' })).toBe(
      SERVICE_ERROR.EMAIL_UNCONFIRMED
    );
    expect(classifyServiceError({ status: 429, message: 'Too many requests' })).toBe(
      SERVICE_ERROR.RATE_LIMIT
    );
  });

  it('does not mistake a Postgres SQLSTATE for an HTTP 5xx', () => {
    // 23505 (unique violation) and 42501 (RLS denial) arrive in `code`. Reading
    // them as statuses would report a plain constraint error as an outage.
    expect(classifyServiceError({ code: '23505', message: 'duplicate key value' })).not.toBe(
      SERVICE_ERROR.OUTAGE
    );
    expect(
      classifyServiceError({ code: '42501', message: 'new row violates row-level security policy' })
    ).not.toBe(SERVICE_ERROR.OUTAGE);
  });

  it('does not treat a number in an unrelated message as a status code', () => {
    expect(classifyServiceError(new Error('Your essay must be under 500 words'))).not.toBe(
      SERVICE_ERROR.OUTAGE
    );
  });

  it('defers to the offline banner when the browser itself has no network', () => {
    setOnline(false);
    expect(classifyServiceError(new TypeError('Failed to fetch'))).toBe(SERVICE_ERROR.OFFLINE);
    expect(isServiceOutageError(new TypeError('Failed to fetch'))).toBe(false);
  });
});

describe('global outage state', () => {
  beforeEach(() => {
    setOnline(true);
    __resetServiceOutageForTests();
  });

  it('notifies subscribers on the first failure and keeps the original timestamp', () => {
    const listener = vi.fn();
    subscribeToServiceOutage(listener);

    reportServiceOutage('login');
    const firstSince = getServiceOutageState().since;
    expect(firstSince).not.toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    reportServiceOutage('checkout');
    expect(getServiceOutageState().since).toBe(firstSince);
    expect(getServiceOutageState().source).toBe('login');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clears on recovery and notifies once', () => {
    const listener = vi.fn();
    subscribeToServiceOutage(listener);

    reportServiceOutage('login');
    reportServiceRecovered();
    expect(getServiceOutageState().since).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    reportServiceRecovered();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('raises the flag only for failures that are actually ours', () => {
    trackServiceError({ status: 400, message: 'Invalid login credentials' }, 'login');
    expect(getServiceOutageState().since).toBeNull();

    trackServiceError(new TypeError('Failed to fetch'), 'login');
    expect(getServiceOutageState().since).not.toBeNull();
  });
});
