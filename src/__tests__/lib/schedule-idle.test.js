import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduleIdle } from '@/lib/scheduleIdle';

describe('deferred browser work', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each(['iPhone', 'iPad'])('avoids the recursive Google iOS idle API on %s', (device) => {
    vi.useFakeTimers();
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(`${device} GSA/439.4`);
    const idle = vi.fn(() => {
      throw new RangeError('Maximum call stack size exceeded');
    });
    vi.stubGlobal('requestIdleCallback', idle);
    const callback = vi.fn();
    scheduleIdle(callback, { timeout: 2500, fallbackDelay: 1200 });
    vi.advanceTimersByTime(1200);
    expect(idle).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('cancels the timer when its component unmounts', () => {
    vi.useFakeTimers();
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('iPhone GSA/439.4');
    const callback = vi.fn();
    const cancel = scheduleIdle(callback);
    cancel();
    vi.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
  });

  it('uses native idle scheduling and cancellation in other browsers', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Chrome');
    const idle = vi.fn(() => 17);
    const cancelIdle = vi.fn();
    vi.stubGlobal('requestIdleCallback', idle);
    vi.stubGlobal('cancelIdleCallback', cancelIdle);
    const callback = vi.fn();
    scheduleIdle(callback, { timeout: 2500 })();
    expect(idle).toHaveBeenCalledWith(callback, { timeout: 2500 });
    expect(cancelIdle).toHaveBeenCalledWith(17);
  });
});
