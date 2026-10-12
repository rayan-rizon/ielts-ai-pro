import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import ManualPayment from '@/features/subscription/components/ManualPayment';
import NagadPaymentResult from '@/features/subscription/pages/NagadPaymentResult';
import {
  buildNagadReconciliationCsv,
  nagadReportFilename,
} from '@/components/admin/billing/nagadReconciliation';
import {
  fetchNagadPaymentStatus,
  getNagadAvailability,
  startNagadCheckout,
} from '@/features/subscription/services/nagadPayment';
import { trackAuthenticatedAppEvent } from '@/lib/tracking';

vi.mock('@/lib/publicEnv', () => ({
  optionalPublicEnv: () => '',
  requirePublicEnv: () => 'https://project.supabase.co',
}));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: {}, from: vi.fn() } }));
vi.mock('@/features/subscription/services/nagadPayment', () => ({
  startNagadCheckout: vi.fn(),
  fetchNagadPaymentStatus: vi.fn(),
  getNagadAvailability: vi.fn(),
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
    getNagadAvailability.mockResolvedValue({ available: true, testMode: false });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign: vi.fn() },
    });
  });

  const openNagad = async () => {
    render(<ManualPayment isOpen onClose={vi.fn()} planData={planData} userId="usr-1" />);
    const tile = screen.getByRole('button', { name: /Nagad/ });
    await waitFor(() => expect(tile).toBeEnabled());
    fireEvent.click(tile);
  };

  it('keeps Nagad as Coming Soon when the server says this learner cannot use it', async () => {
    getNagadAvailability.mockResolvedValue({ available: false, testMode: false });
    render(<ManualPayment isOpen onClose={vi.fn()} planData={planData} userId="usr-1" />);
    await waitFor(() => expect(getNagadAvailability).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /Nagad/ })).toBeDisabled();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('labels a sandbox gateway as test mode for admins', async () => {
    getNagadAvailability.mockResolvedValue({ available: true, testMode: true });
    await openNagad();
    expect(screen.getByText('Test mode')).toBeInTheDocument();
    expect(screen.getByText(/does not change your plan/)).toBeInTheDocument();
  });

  it('shows the policies in English only', () => {
    render(<ManualPayment isOpen onClose={vi.fn()} planData={planData} userId="usr-1" />);
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/bd/terms');
    expect(document.querySelector('[lang="bn"]')).toBeNull();
  });

  it('replaces the TrxID form with a redirect to Nagad', async () => {
    await openNagad();
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
    await openNagad();
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
    await openNagad();
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

  it('marks a verified sandbox payment as a test, without tracking a purchase', async () => {
    fetchNagadPaymentStatus.mockResolvedValue({
      order_id: 'IAPTEST123',
      status: 'paid',
      test_mode: true,
      tier: 'pro',
      interval: 'monthly',
      amount: 699,
    });
    renderAt('?order=IAPTEST123');
    expect(await screen.findByText('Test payment verified')).toBeInTheDocument();
    expect(trackAuthenticatedAppEvent).not.toHaveBeenCalled();
    expect(refreshProfile).not.toHaveBeenCalled();
  });

  it('shows an error, never success, when Nagad confirms a different amount', async () => {
    fetchNagadPaymentStatus.mockResolvedValue({
      order_id: 'IAPTEST123',
      status: 'review',
      review_reason: 'amount_mismatch',
      nagad_status: 'Success',
      nagad_status_code: '000',
      tier: 'pro',
      interval: 'monthly',
      amount: 699,
    });
    renderAt('?order=IAPTEST123');
    expect(await screen.findByText('We could not confirm this payment')).toBeInTheDocument();
    expect(screen.getByText('Payment error')).toBeInTheDocument();
    expect(
      screen.getByText(/the amount does not match this order.*has not been activated/)
    ).toBeInTheDocument();
    expect(screen.queryByText('Payment received')).not.toBeInTheDocument();
    expect(trackAuthenticatedAppEvent).not.toHaveBeenCalled();
    expect(refreshProfile).not.toHaveBeenCalled();
  });

  it.each([
    ['merchant_mismatch', /not issued for IELTS Ai Pro/],
    ['reference_mismatch', /refers to a different payment/],
    ['order_mismatch', /refers to a different order/],
    ['status_code_mismatch', /confirmation was incomplete/],
  ])('explains a %s', async (reason, text) => {
    fetchNagadPaymentStatus.mockResolvedValue({
      order_id: 'IAPTEST123',
      status: 'review',
      review_reason: reason,
      tier: 'pro',
      interval: 'monthly',
      amount: 699,
    });
    renderAt('?order=IAPTEST123');
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it('falls back to a general error for an unknown review reason', async () => {
    fetchNagadPaymentStatus.mockResolvedValue({
      order_id: 'IAPTEST123',
      status: 'review',
      review_reason: 'unmatched',
      tier: 'pro',
      interval: 'monthly',
      amount: 699,
    });
    renderAt('?order=IAPTEST123');
    expect(await screen.findByText(/confirmation did not match this order/)).toBeInTheDocument();
  });

  it('tells a learner who closed the Nagad page that nothing was taken', async () => {
    fetchNagadPaymentStatus.mockResolvedValue({
      order_id: 'IAPTEST123',
      status: 'failed',
      nagad_status: 'Aborted',
      nagad_status_code: '9999',
      tier: 'pro',
      interval: 'monthly',
      amount: 699,
    });
    renderAt('?order=IAPTEST123');
    expect(await screen.findByText('Payment cancelled')).toBeInTheDocument();
    expect(screen.getByText(/no money was taken/)).toBeInTheDocument();
    expect(screen.getByText('9999')).toBeInTheDocument();
  });

  it("shows Nagad's code on a failed payment for support", async () => {
    fetchNagadPaymentStatus.mockResolvedValue({
      order_id: 'IAPTEST123',
      status: 'failed',
      nagad_status: 'Failed',
      nagad_status_code: '50_0026_106',
      tier: 'pro',
      interval: 'monthly',
      amount: 699,
    });
    renderAt('?order=IAPTEST123');
    expect(await screen.findByText('The payment did not go through')).toBeInTheDocument();
    expect(screen.getByText('Nagad code')).toBeInTheDocument();
    expect(screen.getByText('50_0026_106')).toBeInTheDocument();
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
  it('is served by the app, not answered with a 404', () => {
    // Nagad redirects the learner here after paying. The Cloudflare Worker
    // (and the Vercel fallback) take their rewrites from vercel.json and only
    // send allowlisted paths to the app; anything else is a hard 404.
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
    expect(vercel.rewrites).toContainEqual({
      source: '/payment/nagad',
      destination: '/index.html',
    });
    expect(readFileSync('src/App.jsx', 'utf8')).toContain("path: '/payment/nagad'");
  });
});

describe('Nagad reconciliation report', () => {
  it('lists both references for every order, exactly as stored', () => {
    const csv = buildNagadReconciliationCsv([
      {
        order_id: 'IAPMV3OS8EOA3C0201C1',
        payment_ref_id: 'MTAxMTE2MzQ0OTcwOS42ODMw+/a=',
        issuer_payment_ref: '00061L74',
        status: 'paid',
        nagad_status: 'Success',
        nagad_status_code: '000',
        amount: '699.00',
        paid_amount: '699.00',
        currency: 'BDT',
        environment: 'live',
        tier: 'pro',
        billing_interval: 'monthly',
        created_at: '2026-10-11T10:35:00Z',
        paid_at: '2026-10-11T10:36:20Z',
        user: { email: 'learner@example.com' },
      },
      {
        order_id: 'IAPMX',
        payment_ref_id: null,
        nagad_status: '=HYPERLINK("x")',
        status: 'failed',
      },
    ]);
    const [header, first, second] = csv.trim().split('\r\n');
    expect(header).toBe(
      'order_id,payment_ref_id,issuer_payment_ref,status,nagad_status,nagad_status_code,amount,paid_amount,currency,environment,plan,billing_interval,created_at,paid_at'
    );
    expect(first).toBe(
      'IAPMV3OS8EOA3C0201C1,MTAxMTE2MzQ0OTcwOS42ODMw+/a=,00061L74,paid,Success,000,699.00,699.00,BDT,live,pro,monthly,2026-10-11T10:35:00Z,2026-10-11T10:36:20Z'
    );
    // Spreadsheet formulas are neutralised; no customer contact details.
    expect(second).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).not.toContain('learner@example.com');
  });

  it('names the file by environment and date', () => {
    expect(nagadReportFilename('live', new Date('2026-10-12T08:00:00Z'))).toBe(
      'nagad-reconciliation-live-2026-10-12.csv'
    );
  });
});
