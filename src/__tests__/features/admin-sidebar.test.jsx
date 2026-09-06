import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/features/core/components/Sidebar/AdminSidebar';
import { supabase } from '@/lib/supabase';

const paymentAlertFixture = vi.hoisted(() => ({
  pendingCount: 3,
  stripePaymentCount: 2,
  stripeFailureCount: 1,
  latestStripePaymentAt: '2026-08-01T12:00:00Z',
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'payment_requests') {
        return {
          select: vi.fn((columns) => {
            if (columns === 'created_at') {
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    not: vi.fn(() => ({
                      order: vi.fn(() => ({
                        limit: vi.fn(() =>
                          Promise.resolve({
                            data: [{ created_at: paymentAlertFixture.latestStripePaymentAt }],
                            error: null,
                          })
                        ),
                      })),
                    })),
                  })),
                })),
              };
            }

            return {
              eq: vi.fn((field, val) => {
                if (field === 'status' && val === 'pending') {
                  return Promise.resolve({ count: paymentAlertFixture.pendingCount, error: null });
                }
                if (field === 'payment_method' && val === 'stripe') {
                  return {
                    eq: vi.fn(() => ({
                      gt: vi.fn(() =>
                        Promise.resolve({
                          count: paymentAlertFixture.stripePaymentCount,
                          error: null,
                        })
                      ),
                    })),
                  };
                }
                return Promise.resolve({ count: 0, error: null });
              }),
            };
          }),
        };
      }
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            not: vi.fn(() =>
              Promise.resolve({ count: paymentAlertFixture.stripeFailureCount, error: null })
            ),
          })),
        };
      }
      return {
        select: vi.fn(),
      };
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({})),
    })),
    removeChannel: vi.fn(),
  },
}));

function renderAdminSidebar(location = { pathname: '/admin', search: '' }) {
  const user = { id: 'admin-1', full_name: 'Super Admin' };
  return render(
    <MemoryRouter initialEntries={[location.pathname + location.search]}>
      <SidebarProvider>
        <AdminSidebar user={user} location={location} handleLogout={vi.fn()} />
      </SidebarProvider>
    </MemoryRouter>
  );
}

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    paymentAlertFixture.pendingCount = 3;
    paymentAlertFixture.stripePaymentCount = 2;
    paymentAlertFixture.stripeFailureCount = 1;
    paymentAlertFixture.latestStripePaymentAt = '2026-08-01T12:00:00Z';
    window.matchMedia =
      window.matchMedia ||
      vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
  });

  it('renders admin navigation items, intelligence, quick actions, and footer', async () => {
    renderAdminSidebar();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(screen.getByText('Create test')).toBeInTheDocument();
    expect(screen.getByText('Add promo')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryAllByRole('status').length).toBeGreaterThan(0);
    });
  });

  it('renders payment alert badge when there are pending or stripe alerts', async () => {
    window.localStorage.setItem('admin_stripe_payments_seen_at:admin-1', '2026-01-01T00:00:00Z');
    renderAdminSidebar();
    // 3 pending + 2 stripe payments + 1 stripe failure = 6
    const badges = await screen.findAllByRole('status');
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toHaveTextContent('6');
  });

  it('does not treat existing Stripe payments as new in a fresh browser', async () => {
    paymentAlertFixture.pendingCount = 0;
    paymentAlertFixture.stripeFailureCount = 0;

    renderAdminSidebar();

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledTimes(3);
    });
    await act(async () => {});
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('admin_stripe_payments_seen_at:admin-1')).toBe(
      paymentAlertFixture.latestStripePaymentAt
    );
  });

  it('suppresses payment alert badges when currently on the payments tab', async () => {
    renderAdminSidebar({ pathname: '/admin', search: '?tab=payments' });
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
