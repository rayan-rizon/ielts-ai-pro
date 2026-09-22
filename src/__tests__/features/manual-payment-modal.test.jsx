import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ManualPayment from '@/features/subscription/components/ManualPayment';
import { supabase } from '@/lib/supabase';
import { trackAppEvent } from '@/lib/tracking';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'usr-123', email: 'test@example.com' } },
        })
      ),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock('@/lib/tracking', () => ({
  trackAppEvent: vi.fn(),
}));

describe('ManualPayment Modal', () => {
  const planData = {
    tier: 'pro',
    planName: 'Pro Plan',
    interval: 'monthly',
    price: 499,
    currencySymbol: '৳',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders into document.body as a portal when open', async () => {
    const handleClose = vi.fn();
    render(
      <ManualPayment isOpen={true} onClose={handleClose} planData={planData} userId="usr-123" />
    );

    // Dialog should be portaled directly to document.body
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(document.body.contains(dialog)).toBe(true);

    // Displays plan information
    expect(screen.getByText('Manual Payment Portal')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Pro Plan')).toBeInTheDocument();
    expect(screen.getAllByText('৳499').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('01676663311')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Refund & Cancellation Policy' })).toHaveAttribute(
      'href',
      '/bd/refund-cancellation'
    );
  });

  it('calls onClose when close button is clicked or Escape is pressed', async () => {
    const handleClose = vi.fn();
    render(
      <ManualPayment isOpen={true} onClose={handleClose} planData={planData} userId="usr-123" />
    );

    const closeButton = screen.getByLabelText('Close payment portal');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('copies recipient number to clipboard and shows copied feedback', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });

    render(<ManualPayment isOpen={true} onClose={vi.fn()} planData={planData} userId="usr-123" />);

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('01676663311');
    expect(await screen.findByText('Copied')).toBeInTheDocument();
  });

  it('formats TrxID to uppercase and strips invalid chars', async () => {
    render(<ManualPayment isOpen={true} onClose={vi.fn()} planData={planData} userId="usr-123" />);

    const trxInput = screen.getByPlaceholderText('e.g. BL9A4K8...');
    fireEvent.change(trxInput, { target: { value: 'bl9a4k8m!' } });
    expect(trxInput.value).toBe('BL9A4K8M');
  });

  it('submits valid payment request and renders success confirmation screen', async () => {
    const insertMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    });

    render(<ManualPayment isOpen={true} onClose={vi.fn()} planData={planData} userId="usr-123" />);

    const phoneInput = screen.getByPlaceholderText('01XXXXXXXXX');
    const trxInput = screen.getByPlaceholderText('e.g. BL9A4K8...');

    fireEvent.change(phoneInput, { target: { value: '01711223344' } });
    fireEvent.change(trxInput, { target: { value: 'TRX12345678' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Payment Request/i });
    expect(submitBtn).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /Accept Bangladesh payment policies/i }));
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          auth_id: 'usr-123',
          tier: 'pro',
          amount: 499,
          currency: 'BDT',
          payment_method: 'bkash',
          transaction_id: 'TRX12345678',
          sender_phone: '01711223344',
          status: 'pending',
        })
      );
    });

    // Verification screen appears
    await waitFor(() => {
      expect(screen.getByText('Payment Request Submitted')).toBeInTheDocument();
      expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    });

    expect(trackAppEvent).toHaveBeenCalledWith(
      'manual_subscription_request_submitted',
      expect.objectContaining({
        policies_accepted: true,
        policy_version: '2026-09-22',
      })
    );
  });
});
