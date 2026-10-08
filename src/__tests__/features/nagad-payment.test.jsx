import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import ManualPayment from '@/features/subscription/components/ManualPayment';
import NagadPaymentResult from '@/features/subscription/pages/NagadPaymentResult';
import {
  fetchNagadPaymentStatus,
  startNagadCheckout,
} from '@/features/subscription/services/nagadPayment';
import { trackAuthenticatedAppEvent } from '@/lib/tracking';

vi.mock('@/lib/publicEnv', () => ({
  optionalPublicEnv: (name) => (name === 'VITE_NAGAD_PAYMENTS_ENABLED' ? 'true' : ''),
  requirePublicEnv: () => 'https://project.supabase.co',
}));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: {}, from: vi.fn() } }));
vi.mock('@/features/subscription/services/nagadPayment', () => ({
  startNagadCheckout: vi.fn(),
  fetchNagadPaymentStatus: vi.fn(),
}));
vi.mock('@/lib/tracking', () => ({
  trackAppEvent: vi.fn(),
  trackAuthenticatedAppEvent: vi.fn(),
}));
vi.mock('@/lib/marketingAttribution', () => ({ clearMarketingAttribution: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const refreshProfile = vi.fn();
vi.mock('@/features/auth/context/AuthContext', () => ({ useAuth: () => ({ refreshProfile }) }));
vi.mock('@/components/shared/DocumentHead', () => ({ default: () => null }));

const planData = {
  tier: 'pro',
  planName: 'Pro Plan',
  interval: 'monthly',
  price: 699,
  currencySymbol: '৳',
  marketingCampaignId: null,
  marketingDeliveryId: null,
};

describe('Nagad in the Bangladesh payment modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign: vi.fn() },
    });
  });

  const openNagad = () => {
    render(<ManualPayment isOpen onClose={vi.fn()} planData={planData} userId="usr-1" />);
    fireEvent.click(screen.getByRole('button', { name: /Nagad/ }));
  };

  it('replaces the TrxID form with a redirect to Nagad', () => {
    openNagad();
    expect(screen.getByText('Pay with Nagad')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('01XXXXXXXXX')).not.toBeInTheDocument();
    expect(screen.queryByText('01676663311')).not.toBeInTheDocument();
    const pay = screen.getByRole('button', { name: /Pay ৳699 with Nagad/ });
    expect(pay).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Accept Bangladesh payment policies'));
    expect(pay).toBeEnabled();
  });

  it('starts checkout for the shown amount and sends the learner to Nagad', async () => {
    startNagadCheckout.mockResolvedValue({
      url: 'https://sandbox-ssl.mynagad.com:10061/check-out/abc',
      order_id: 'IAPTEST123',
      amount: 699,
      currency: 'BDT',
    });
    openNagad();
    fireEvent.click(screen.getByLabelText('Accept Bangladesh payment policies'));
    fireEvent.click(screen.getByRole('button', { name: /Pay ৳699 with Nagad/ }));

    await waitFor(() =>
      expect(window.location.assign).toHaveBeenCalledWith(
        'https://sandbox-ssl.mynagad.com:10061/check-out/abc'
      )
    );
    expect(startNagadCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'pro', interval: 'monthly', expectedAmount: 699 })
    );
  });

  it('says the learner was not charged when checkout cannot start', async () => {
    const failure = Object.assign(new Error('Nagad could not start the payment.'), {
      code: 'nagad_unavailable',
    });
    startNagadCheckout.mockRejectedValue(failure);
    openNagad();
    fireEvent.click(screen.getByLabelText('Accept Bangladesh payment policies'));
    fireEvent.click(screen.getByRole('button', { name: /Pay ৳699 with Nagad/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error.mock.calls[0][0]).toMatch(/not been charged/);
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});

describe('Nagad result page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const renderAt = (search) =>
    render(
      <MemoryRouter initialEntries={[`/payment/nagad${search}`]}>
        <NagadPaymentResult />
      </MemoryRouter>
    );

  it('confirms a paid order, refreshes the profile and tracks the purchase once', async () => {
    fetchNagadPaymentStatus.mockResolvedValue({
      order_id: 'IAPTEST123',
      status: 'paid',
      tier: 'pro',
      interval: 'monthly',
      amount: 699,
      currency: 'BDT',
    });
    renderAt('?order=IAPTEST123');
    expect(await screen.findByText('Payment received')).toBeInTheDocument();
    expect(screen.getByText('৳699')).toBeInTheDocument();
    expect(refreshProfile).toHaveBeenCalled();
    expect(trackAuthenticatedAppEvent).toHaveBeenCalledTimes(1);
    expect(trackAuthenticatedAppEvent).toHaveBeenCalledWith(
      'subscription_purchase',
      expect.objectContaining({ transaction_id: 'IAPTEST123', currency: 'BDT', source: 'nagad' })
    );
  });

  it('shows a failed payment and offers to try again', async () => {
    fetchNagadPaymentStatus.mockResolvedValue({
      order_id: 'IAPTEST123',
      status: 'failed',
      tier: 'pro',
      interval: 'monthly',
      amount: 699,
    });
    renderAt('?order=IAPTEST123');
    expect(await screen.findByText('The payment did not go through')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to pricing' })).toHaveAttribute(
      'href',
      '/pricing'
    );
    expect(trackAuthenticatedAppEvent).not.toHaveBeenCalled();
  });

  it('treats a missing or foreign order as not found', async () => {
    renderAt('');
    expect(screen.getByText('Payment not found')).toBeInTheDocument();
    expect(fetchNagadPaymentStatus).not.toHaveBeenCalled();
  });

  it('treats a 404 from the server as not found', async () => {
    fetchNagadPaymentStatus.mockRejectedValue(Object.assign(new Error('nope'), { status: 404 }));
    renderAt('?order=IAPNOTMINE1');
    expect(await screen.findByText('Payment not found')).toBeInTheDocument();
  });
});

describe('Nagad result route', () => {
  it('is served by the app on Vercel, not answered with a 404', () => {
    // Nagad redirects the learner here after paying. Vercel only rewrites
    // allowlisted paths to the app; anything else is a hard 404.
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
    expect(vercel.rewrites).toContainEqual({
      source: '/payment/nagad',
      destination: '/index.html',
    });
    expect(readFileSync('src/App.jsx', 'utf8')).toContain("path: '/payment/nagad'");
  });
});
