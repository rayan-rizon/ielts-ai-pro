import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import ServiceOutageBanner from '@/components/shared/ServiceOutageBanner';
import {
  reportServiceOutage,
  reportServiceRecovered,
  __resetServiceOutageForTests,
} from '@/lib/serviceOutage';

describe('ServiceOutageBanner', () => {
  beforeEach(() => {
    __resetServiceOutageForTests();
    // The recovery probe must never reach the network from a test.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    __resetServiceOutageForTests();
  });

  it('stays out of the way while everything is healthy', () => {
    render(<ServiceOutageBanner />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('appears when any surface reports an outage, blaming us and not the user', async () => {
    render(<ServiceOutageBanner />);

    act(() => reportServiceOutage('login'));

    expect(await screen.findByText(/connection problems/i)).toBeInTheDocument();
    expect(screen.getByText(/on our end, not your account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('swaps to a short confirmation once the backend recovers', async () => {
    render(<ServiceOutageBanner />);

    act(() => reportServiceOutage('login'));
    await screen.findByText(/connection problems/i);

    act(() => reportServiceRecovered());

    await waitFor(() => {
      expect(screen.queryByText(/connection problems/i)).toBeNull();
    });
    expect(screen.getByText(/back to normal/i)).toBeInTheDocument();
  });

  it('shows one banner for an outage reported by several surfaces at once', async () => {
    render(<ServiceOutageBanner />);

    act(() => {
      reportServiceOutage('login');
      reportServiceOutage('checkout');
      reportServiceOutage('profile');
    });

    await screen.findByText(/connection problems/i);
    expect(screen.getAllByText(/connection problems/i)).toHaveLength(1);
  });
});
