import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let profile = null;
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ userProfile: profile }),
}));
const read = vi.fn();
const save = vi.fn();
vi.mock('@/features/testing/writing/report/reportLanguagePreference', () => ({
  readSavedReportLanguage: (...args) => read(...args),
  saveReportLanguage: (...args) => save(...args),
}));

const { useReportLanguage, resetReportLanguageForTests } =
  await import('@/features/testing/writing/report/useReportLanguage');

describe('the report language a learner sees', () => {
  beforeEach(() => {
    profile = { id: 'u1', settings: {} };
    read.mockReset().mockResolvedValue(null);
    save.mockReset().mockResolvedValue({});
    resetReportLanguageForTests();
  });

  it('is the saved choice, with no question and no extra read', () => {
    profile = { id: 'u1', settings: { report_language: 'hi' } };
    const { result } = renderHook(() => useReportLanguage());
    expect(result.current).toMatchObject({ language: 'hi', needsChoice: false });
    expect(read).not.toHaveBeenCalled();
  });

  it('is English, and asks, once the database confirms nothing was chosen', async () => {
    const { result } = renderHook(() => useReportLanguage());
    // Never ask before checking: the cached profile may be older than the choice.
    expect(result.current.needsChoice).toBe(false);
    await waitFor(() => expect(result.current.needsChoice).toBe(true));
    expect(result.current.language).toBe('en');
  });

  it('does not ask again when the choice was made on another device', async () => {
    read.mockResolvedValue('uz');
    const { result } = renderHook(() => useReportLanguage());
    await waitFor(() => expect(result.current.language).toBe('uz'));
    expect(result.current.needsChoice).toBe(false);
  });

  it('never asks a signed-out visitor', () => {
    profile = null;
    const { result } = renderHook(() => useReportLanguage());
    expect(result.current).toMatchObject({ language: 'en', needsChoice: false });
    expect(read).not.toHaveBeenCalled();
  });

  it('stays quiet if the check fails, rather than asking someone who may have chosen', async () => {
    read.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useReportLanguage());
    await act(async () => {});
    expect(result.current.needsChoice).toBe(false);
  });

  it('switches at once, saves, and remembers it for the next report opened', async () => {
    const { result, unmount } = renderHook(() => useReportLanguage());
    await act(() => result.current.choose('bn'));
    expect(save).toHaveBeenCalledWith('bn');
    expect(result.current).toMatchObject({ language: 'bn', needsChoice: false, saveFailed: false });

    unmount();
    const next = renderHook(() => useReportLanguage());
    expect(next.result.current).toMatchObject({ language: 'bn', needsChoice: false });
  });

  it('keeps the language for this visit and says so when saving fails', async () => {
    save.mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useReportLanguage());
    await act(() => result.current.choose('ur'));
    expect(result.current).toMatchObject({ language: 'ur', needsChoice: false, saveFailed: true });
  });

  it('does not carry one learner’s choice to the next account', async () => {
    const first = renderHook(() => useReportLanguage());
    await act(() => first.result.current.choose('fa'));
    first.unmount();

    profile = { id: 'u2', settings: { report_language: 'ru' } };
    const second = renderHook(() => useReportLanguage());
    expect(second.result.current.language).toBe('ru');
  });
});
