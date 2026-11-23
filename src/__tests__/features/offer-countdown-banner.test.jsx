import React from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OfferCountdownBanner from '@/features/subscription/components/OfferCountdownBanner';
import OfferStrip from '@/features/subscription/components/OfferStrip';
import { countdownUnits, formatClock } from '@/features/subscription/offerCountdown';
import { useOfferBanner } from '@/features/subscription/hooks/useOfferBanner';

const NOW = Date.parse('2026-11-23T12:00:00Z');
const at = (ms) => new Date(NOW + ms).toISOString();

describe('offer countdown banner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('shows the code, the value and a clock that ticks every second', () => {
    render(<OfferCountdownBanner code="START20ABC" percent={20} expiresAt={at(3_725_000)} />);
    expect(screen.getByText('20% off your first payment')).toBeTruthy();
    expect(screen.getByText('START20ABC')).toBeTruthy();
    const timer = screen.getByRole('timer');
    expect(timer.textContent).toContain('01');
    expect(timer.textContent).toContain('02');
    expect(timer.textContent).toContain('05');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('timer').textContent).toContain('02');
  });

  it('switches to days when a day or more is left, and seconds inside the last day', () => {
    expect(countdownUnits(2 * 86_400_000 + 3 * 3_600_000).map(([, unit]) => unit)).toEqual([
      'days',
      'hrs',
      'min',
    ]);
    expect(countdownUnits(5 * 3_600_000).map(([, unit]) => unit)).toEqual(['hrs', 'min', 'sec']);
  });

  it('calls onExpire and disappears when the time runs out', () => {
    const onExpire = vi.fn();
    const { container } = render(
      <OfferCountdownBanner
        code="START20ABC"
        percent={20}
        expiresAt={at(2000)}
        onExpire={onExpire}
      />
    );
    expect(container.textContent).toContain('START20ABC');
    act(() => vi.advanceTimersByTime(2500));
    expect(onExpire).toHaveBeenCalled();
    expect(container.textContent).not.toContain('START20ABC');
  });

  it('renders nothing for an offer that already ended or has no usable deadline', () => {
    for (const expiresAt of [at(-1000), 'not a date']) {
      const { container } = render(
        <OfferCountdownBanner code="START20ABC" expiresAt={expiresAt} />
      );
      expect(container.textContent).toBe('');
    }
  });
});

describe('useOfferBanner', () => {
  const valid = {
    code: 'START20ABC',
    discount_type: 'percentage',
    discount_value: 20,
    expires_at: at(3_600_000),
  };

  it('reads the real deadline from the server for the applied code', async () => {
    const load = vi.fn().mockResolvedValue(valid);
    const { result } = renderHook(() => useOfferBanner({ code: 'START20ABC' }, { load }));
    await waitFor(() => expect(result.current.offer).not.toBeNull());
    expect(result.current.offer).toEqual({
      code: 'START20ABC',
      percent: 20,
      expiresAt: valid.expires_at,
    });
  });

  it('shows nothing without a promo, for a different code, without a deadline, or on error', async () => {
    const cases = [
      [null, vi.fn().mockResolvedValue(valid)],
      [{ code: 'OTHER' }, vi.fn().mockResolvedValue(valid)],
      [{ code: 'START20ABC' }, vi.fn().mockResolvedValue({ ...valid, expires_at: null })],
      [{ code: 'START20ABC' }, vi.fn().mockRejectedValue(new Error('offline'))],
    ];
    for (const [promo, load] of cases) {
      const { result } = renderHook(() => useOfferBanner(promo, { load }));
      await waitFor(() => expect(load.mock.calls.length).toBe(promo ? 1 : 0));
      expect(result.current.offer).toBeNull();
    }
  });

  it('drops the offer when dismissed at expiry', async () => {
    const load = vi.fn().mockResolvedValue(valid);
    const { result } = renderHook(() => useOfferBanner({ code: 'START20ABC' }, { load }));
    await waitFor(() => expect(result.current.offer).not.toBeNull());
    act(() => result.current.dismiss());
    expect(result.current.offer).toBeNull();
  });
});

describe('offer strip inside a plan card', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('shows a limited-offer badge, the value, a ticking clock and a copyable code', () => {
    render(<OfferStrip code="START20ABC" percent={20} expiresAt={at(3_725_000)} />);
    expect(screen.getByText(/Limited offer · 20% off/)).toBeTruthy();
    expect(screen.getByText('START20ABC')).toBeTruthy();
    expect(screen.getByRole('timer').textContent).toBe('01:02:05');
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('timer').textContent).toBe('01:02:00');
  });

  it('shows days and minutes when a day or more is left', () => {
    expect(formatClock(2 * 86_400_000 + 5 * 3_600_000 + 9 * 60_000)).toBe('2d 05:09');
    expect(formatClock(59_000)).toBe('00:00:59');
  });

  it('calls onExpire and disappears at zero', () => {
    const onExpire = vi.fn();
    const { container } = render(
      <OfferStrip code="START20ABC" percent={20} expiresAt={at(1500)} onExpire={onExpire} />
    );
    act(() => vi.advanceTimersByTime(2000));
    expect(onExpire).toHaveBeenCalled();
    expect(container.textContent).toBe('');
  });
});
