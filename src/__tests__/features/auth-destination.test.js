import { beforeEach, describe, expect, it } from 'vitest';
import {
  AUTH_DESTINATION_KEY,
  clearRequestedDestination,
  getRequestedDestination,
  saveRequestedDestination,
} from '@/features/auth/utils/authDestination';

describe('auth destination handoff', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('restores a safe checker destination in a new tab', () => {
    saveRequestedDestination('/ielts-writing-checker', { crossTab: true });
    window.sessionStorage.clear();

    expect(getRequestedDestination(null)).toBe('/ielts-writing-checker');
    clearRequestedDestination();
    expect(window.localStorage.getItem(AUTH_DESTINATION_KEY)).toBeNull();
  });

  it('rejects unsafe destinations and expires the cross-tab handoff', () => {
    expect(saveRequestedDestination('//malicious.example', { crossTab: true })).toBe(false);
    expect(saveRequestedDestination('/admin/users', { crossTab: true })).toBe(false);

    const savedAt = Date.parse('2026-08-09T10:00:00.000Z');
    window.localStorage.setItem(AUTH_DESTINATION_KEY, '/ielts-writing-checker');
    window.localStorage.setItem(`${AUTH_DESTINATION_KEY}:saved-at`, String(savedAt));
    expect(getRequestedDestination(null, '/dashboard', savedAt + 2 * 60 * 60 * 1000 + 1)).toBe(
      '/dashboard'
    );
  });
});
