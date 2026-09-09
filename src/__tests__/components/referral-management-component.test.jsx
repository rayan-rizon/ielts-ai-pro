import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReferralManagement from '@/components/admin/ReferralManagement';
import { ReferralSettings } from '@/features/admin/services/ReferralSettings';
import MarketingService from '@/features/admin/services/MarketingService';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('@/features/admin/services/ReferralSettings', () => ({
  ReferralSettings: {
    list: vi.fn(),
    getStats: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleActive: vi.fn(),
  },
}));

vi.mock('@/features/admin/services/MarketingService', () => ({
  default: {
    getOfferIntelligence: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockTiers = [
  {
    id: 'tier-1',
    referrals_required: 3,
    extra_days: 7,
    writing_credits: 5,
    speaking_credits: 2,
    is_active: true,
  },
  {
    id: 'tier-2',
    referrals_required: 5,
    extra_days: 14,
    writing_credits: 10,
    speaking_credits: 5,
    is_active: false,
  },
];

const mockStats = {
  totalReferrals: 42,
  topReferrers: [
    {
      id: 'ref-1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      count: 15,
    },
  ],
};

const mockOfferIntelligence = {
  referrals: [
    {
      referrer_id: 'ref-1',
      activated: 10,
      paid: 5,
      risk_flags: ['rapid_signups'],
    },
  ],
};

function renderWithProviders(ui) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('ReferralManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ReferralSettings.list.mockResolvedValue(mockTiers);
    ReferralSettings.getStats.mockResolvedValue(mockStats);
    MarketingService.getOfferIntelligence.mockResolvedValue(mockOfferIntelligence);
  });

  it('renders KPIs, risk flags banner, milestone rewards, and top advocates', async () => {
    renderWithProviders(<ReferralManagement />);

    await waitFor(() => {
      expect(screen.getByText('Milestone rewards')).toBeInTheDocument();
    });

    expect(screen.getByText('Total referrals')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(
      screen.getByText('1 advocate account(s) need referral-pattern review.')
    ).toBeInTheDocument();
    expect(screen.getByText('3 referrals target')).toBeInTheDocument();
    expect(screen.getByText('5 referrals target')).toBeInTheDocument();
    expect(screen.getByText('+7 days')).toBeInTheDocument();
    expect(screen.getByText('+5 Writing')).toBeInTheDocument();
    expect(screen.getByText('Top advocates')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('opens add tier modal and handles creation', async () => {
    ReferralSettings.create.mockResolvedValue({ id: 'tier-3' });

    renderWithProviders(<ReferralManagement />);

    await waitFor(() => {
      expect(screen.getByText('Milestone rewards')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Add tier/i });
    fireEvent.click(addBtn);

    expect(
      screen.getByText('Set the referral threshold and rewards unlocked at this tier')
    ).toBeInTheDocument();

    const referralsInput = screen.getAllByPlaceholderText('e.g. 3')[0];
    fireEvent.change(referralsInput, { target: { value: '10' } });

    const createBtn = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(ReferralSettings.create).toHaveBeenCalledWith({
        referrals_required: 10,
        extra_days: 0,
        writing_credits: 0,
        speaking_credits: 0,
      });
    });
  });

  it('toggles tier active status', async () => {
    ReferralSettings.toggleActive.mockResolvedValue({ success: true });

    renderWithProviders(<ReferralManagement />);

    await waitFor(() => {
      expect(screen.getByText('Milestone rewards')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    await waitFor(() => {
      expect(ReferralSettings.toggleActive).toHaveBeenCalledWith('tier-1', false);
    });
  });

  it('opens delete confirmation modal and deletes tier', async () => {
    ReferralSettings.delete.mockResolvedValue({ success: true });

    renderWithProviders(<ReferralManagement />);

    await waitFor(() => {
      expect(screen.getByText('Milestone rewards')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', {
      name: /Delete 3 referrals tier/i,
    });
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Delete Reward Tier')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Delete Tier/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(ReferralSettings.delete).toHaveBeenCalledWith('tier-1');
    });
  });
});
