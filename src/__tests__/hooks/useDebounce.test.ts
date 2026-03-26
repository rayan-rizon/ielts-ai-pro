import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce, useThrottle } from '@/hooks/useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should debounce value changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            {
                initialProps: { value: 'initial', delay: 500 },
            }
        );

        // Change value
        rerender({ value: 'changed', delay: 500 });

        // Should still be initial
        expect(result.current).toBe('initial');

        // Fast forward 300ms
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(result.current).toBe('initial');

        // Fast forward balance of 200ms
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(result.current).toBe('changed');
    });

    it('should reset timer on subsequent value changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            {
                initialProps: { value: 'initial', delay: 500 },
            }
        );

        // First change
        rerender({ value: 'change1', delay: 500 });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(result.current).toBe('initial');

        // Second change before first one finishes
        rerender({ value: 'change2', delay: 500 });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        // Still hasn't updated to change1 or change2
        expect(result.current).toBe('initial');

        // Final fast forward
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(result.current).toBe('change2');
    });
});

describe('useThrottle', () => {
    it('should call the callback immediately on first call', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useThrottle(callback, 500));

        act(() => {
            result.current('test');
        });

        expect(callback).toHaveBeenCalledWith('test');
    });

    it('should throttle subsequent calls', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useThrottle(callback, 1000));

        // Mock Date.now to control time
        const now = 10000;
        vi.spyOn(Date, 'now').mockReturnValue(now);

        act(() => {
            result.current('call1');
        });
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('call1');

        // Next call immediately after
        vi.spyOn(Date, 'now').mockReturnValue(now + 500);
        act(() => {
            result.current('call2');
        });
        // Should NOT have called again
        expect(callback).toHaveBeenCalledTimes(1);

        // Call after delay
        vi.spyOn(Date, 'now').mockReturnValue(now + 1500);
        act(() => {
            result.current('call3');
        });
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith('call3');

        vi.restoreAllMocks();
    });
});
