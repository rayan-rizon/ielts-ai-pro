import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

describe('useNetworkStatus', () => {
    const originalNavigator = global.navigator;

    beforeEach(() => {
        vi.useFakeTimers();
        // Mock window event listeners
        vi.spyOn(window, 'addEventListener');
        vi.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should return initial online status', () => {
        const { result } = renderHook(() => useNetworkStatus());
        expect(result.current.isOnline).toBe(typeof navigator !== 'undefined' ? navigator.onLine : true);
        expect(result.current.wasOffline).toBe(false);
    });

    it('should update status when going offline', () => {
        const { result } = renderHook(() => useNetworkStatus());

        // Trigger offline event
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });

        expect(result.current.isOnline).toBe(false);
    });

    it('should update status and set wasOffline when going online', () => {
        const { result } = renderHook(() => useNetworkStatus());

        // First go offline
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(result.current.isOnline).toBe(false);

        // Then go online
        act(() => {
            window.dispatchEvent(new Event('online'));
        });

        expect(result.current.isOnline).toBe(true);
        // wasOffline becomes true for 5 seconds
        expect(result.current.wasOffline).toBe(true);

        // Fast forward 5 seconds
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(result.current.wasOffline).toBe(false);
    });

    it('should cleanup event listeners on unmount', () => {
        const { unmount } = renderHook(() => useNetworkStatus());

        expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
        expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

        unmount();

        expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
        expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should provide a checkConnection function', async () => {
        // Mock fetch for checkConnection
        const mockFetch = vi.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;

        const { result } = renderHook(() => useNetworkStatus());

        let connectionOk;
        await act(async () => {
            connectionOk = await result.current.checkConnection();
        });

        expect(mockFetch).toHaveBeenCalledWith('/favicon.ico', expect.objectContaining({
            method: 'HEAD'
        }));
        expect(connectionOk).toBe(true);
    });
});
