import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import InstitutionWorkspace, {
  InstitutionAdmin,
  PricingTable,
} from '../../features/institution/components/InstitutionWorkspace';

const state = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('../../features/institution/services/institutions', () => ({
  institutionRequest: (...args) => state.request(...args),
}));

const mockSchool = {
  id: 'school',
  name: 'Oxford English Academy',
  owner_email: 'owner@academy.org',
  contact_email: 'contact@academy.org',
  contact_phone: '+123456789',
  logo_url: 'https://example.com/logo.png',
  currency: 'USD',
  status: 'active',
  updated_at: '2026-10-01T00:00:00Z',
};

const mockDetailData = {
  institution: mockSchool,
  seats: [
    {
      id: 'seat-1',
      order_id: 'ord-1',
      recipient_email: 'alice@student.org',
      recipient_name: 'Alice Student',
      tier: 'pro',
      source: 'paid',
      status: 'active',
      access_until: '2026-11-01T00:00:00Z',
      activation_deadline: '2026-12-01T00:00:00Z',
    },
    {
      id: 'seat-2',
      order_id: 'ord-1',
      recipient_email: 'bob@student.org',
      recipient_name: 'Bob Student',
      tier: 'premium',
      source: 'complimentary',
      status: 'invited',
      access_until: '2026-11-01T00:00:00Z',
      activation_deadline: '2099-01-01T00:00:00Z',
      allocation_blocked: false,
    },
    {
      id: 'seat-3',
      order_id: 'ord-1',
      tier: 'pro',
      source: 'paid',
      status: 'available',
      activation_deadline: '2099-01-01T00:00:00Z',
      allocation_blocked: false,
    },
  ],
  orders: [
    {
      id: 'ord-1',
      tier: 'pro',
      quantity: 10,
      amount_minor: 9900,
      currency: 'USD',
      source: 'paid',
      status: 'paid',
      months: 1,
      access_days: 30,
      activation_deadline: '2099-01-01T00:00:00Z',
      created_at: '2026-10-01T00:00:00Z',
      invoice_url: 'https://example.com/inv',
      receipt_url: 'https://example.com/rec',
    },
  ],
  pricing: [
    {
      id: 'price-1',
      kind: 'default',
      tier: 'pro',
      months: 1,
      quantity: 1,
      currency: 'USD',
      amount: 9.99,
      enabled: true,
    },
  ],
};

beforeEach(() => {
  state.request.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('InstitutionWorkspace', () => {
  it('renders workspace overview with statistics and header', async () => {
    state.request.mockResolvedValue(mockDetailData);

    render(
      <MemoryRouter initialEntries={['/institution?institution=school&tab=overview']}>
        <InstitutionWorkspace institutionId="school" />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Oxford English Academy' });
    expect(screen.getByText('Available seats')).toBeInTheDocument();
    expect(screen.getByText('Invitations sent')).toBeInTheDocument();
    expect(screen.getByText('Active students')).toBeInTheDocument();
    expect(screen.getByText('Seat balance')).toBeInTheDocument();
  });

  it('renders students tab and filters students list', async () => {
    state.request.mockResolvedValue(mockDetailData);

    render(
      <MemoryRouter initialEntries={['/institution?institution=school&tab=students']}>
        <InstitutionWorkspace institutionId="school" />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Oxford English Academy' });
    expect(screen.getByText('Provide student access')).toBeInTheDocument();
    expect(screen.getByText('Alice Student')).toBeInTheDocument();
    expect(screen.getByText('bob@student.org')).toBeInTheDocument();

    const searchInput = screen.getByLabelText('Search students');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    expect(screen.getByText('Alice Student')).toBeInTheDocument();
    expect(screen.queryByText('bob@student.org')).not.toBeInTheDocument();
  });

  it('renders subscription buy seats tab and calculates price quote', async () => {
    state.request.mockImplementation(async (action) => {
      if (action === 'detail') return mockDetailData;
      if (action === 'quote') {
        return {
          amount_minor: 9990,
          currency: 'USD',
          quantity: 10,
          pricing_kind: 'default',
        };
      }
      return {};
    });

    render(
      <MemoryRouter initialEntries={['/institution?institution=school&tab=subscription']}>
        <InstitutionWorkspace institutionId="school" />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Buy student seats' });
    const calcButton = screen.getByRole('button', { name: 'Calculate price' });
    fireEvent.click(calcButton);

    await screen.findByText('Calculated Price');
    expect(screen.getByText('Pay with Stripe')).toBeInTheDocument();
  });

  it('renders billing tab with orders table', async () => {
    state.request.mockResolvedValue(mockDetailData);

    render(
      <MemoryRouter initialEntries={['/institution?institution=school&tab=billing']}>
        <InstitutionWorkspace institutionId="school" />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Orders & receipts' });
    expect(screen.getByText('Invoice')).toBeInTheDocument();
    expect(screen.getByText('Receipt')).toBeInTheDocument();
  });

  it('renders admin mode with management toolbar and pricing tab', async () => {
    state.request.mockResolvedValue(mockDetailData);

    render(
      <MemoryRouter initialEntries={['/admin?tab=institutions&section=pricing']}>
        <InstitutionWorkspace institutionId="school" admin />
      </MemoryRouter>
    );

    await screen.findByText('Platform admin management');
    expect(screen.getByRole('button', { name: 'Grant free seats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit institution' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Institution pricing' })).toBeInTheDocument();
  });
});

describe('PricingTable', () => {
  it('renders pricing rules correctly and handles edit click', () => {
    const onEdit = vi.fn();
    render(<PricingTable rules={mockDetailData.pricing} onEdit={onEdit} />);

    expect(screen.getByText('Standard price')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(mockDetailData.pricing[0]);
  });
});

describe('InstitutionAdmin', () => {
  it('renders institution list and allows toggling rollout gate', async () => {
    state.request.mockImplementation(async (action) => {
      if (action === 'list') {
        return {
          enabled: true,
          institutions: [mockSchool],
          pricing: mockDetailData.pricing,
        };
      }
      if (action === 'enable') {
        return { success: true };
      }
      return {};
    });

    render(
      <MemoryRouter initialEntries={['/admin?tab=institutions']}>
        <InstitutionAdmin />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Institutions' });
    expect(screen.getByText('Oxford English Academy')).toBeInTheDocument();
    expect(screen.getByText('Disable new institution operations')).toBeInTheDocument();
  });
});
