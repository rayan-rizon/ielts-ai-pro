import { act, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/features/core/components/Sidebar/AdminSidebar';
import { supabase } from '@/lib/supabase';

const fixture = vi.hoisted(() => ({ data: null, error: null }));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(() => ({
      abortSignal: () => Promise.resolve({ data: fixture.data, error: fixture.error }),
    })),
  },
}));

function sidebar(location, user) {
  return (
    <MemoryRouter>
      <SidebarProvider>
        <AdminSidebar user={user} location={location} handleLogout={vi.fn()} />
      </SidebarProvider>
    </MemoryRouter>
  );
}
const admin = { id: 'admin-1', full_name: 'Super Admin' };
const overview = { pathname: '/admin/panel', search: '' };
const paymentLink = () =>
  screen.getAllByRole('link').find((link) => link.textContent.startsWith('Payments'));

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    fixture.data = {
      observedAt: '2026-10-04T00:00:00Z',
      pendingCount: 3,
      stripePaymentCount: 2,
      stripeFailureCount: 1,
      featureRequestCount: 4,
      testReportCount: 5,
      institutionRequestCount: 6,
    };
    fixture.error = null;
  });

  it('renders all four badges from one shared RPC', async () => {
    render(sidebar(overview, admin));
    await screen.findByLabelText('6 new payment alerts');
    expect(screen.getByLabelText('4 feature requests awaiting review')).toHaveTextContent('4');
    expect(screen.getByLabelText('5 unresolved test reports')).toHaveTextContent('5');
    expect(screen.getByLabelText('6 institution requests awaiting review')).toHaveTextContent('6');
    expect(screen.getByText('Communications')).toBeInTheDocument();
    expect(screen.getByText('Test Management')).toBeInTheDocument();
    expect(screen.queryByText('Create test')).not.toBeInTheDocument();
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith('get_admin_sidebar_badges', {
      p_payment_seen_through: null,
    });
  });

  it('caps visible counts and the accessible label at 99+', async () => {
    fixture.data = { ...fixture.data, stripePaymentCount: 100, featureRequestCount: 100 };
    render(sidebar(overview, admin));
    expect(await screen.findByLabelText('99+ new payment alerts')).toHaveTextContent('99+');
    expect(screen.getByLabelText('99+ feature requests awaiting review')).toHaveTextContent('99+');
  });

  it('does not poll again when navigating between non-payment pages', async () => {
    const view = render(sidebar(overview, admin));
    await screen.findByLabelText('6 new payment alerts');
    view.rerender(sidebar({ ...overview, search: '?tab=feature-requests' }, admin));
    await act(async () => {});
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('4 feature requests awaiting review')).toBeInTheDocument();
  });

  it('acknowledges only after the payment view has loaded', async () => {
    fixture.data = {
      ...fixture.data,
      pendingCount: 0,
      stripePaymentCount: 0,
      stripeFailureCount: 0,
    };
    render(sidebar({ ...overview, search: '?tab=payments' }, admin));
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledTimes(1));
    await act(async () =>
      window.dispatchEvent(
        new CustomEvent('admin-payments-loaded', {
          detail: { observedAt: fixture.data.observedAt },
        })
      )
    );
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledTimes(2));
    expect(supabase.rpc).toHaveBeenLastCalledWith('get_admin_sidebar_badges', {
      p_payment_seen_through: fixture.data.observedAt,
    });
    expect(within(paymentLink()).queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('5 unresolved test reports')).toBeInTheDocument();
  });

  it('uses exact tab matching rather than acknowledging similarly named routes', async () => {
    render(sidebar({ ...overview, search: '?tab=payments-history' }, admin));
    await screen.findByLabelText('6 new payment alerts');
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('does not query without an identified administrator', async () => {
    render(sidebar(overview, null));
    await act(async () => {});
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('clears cached badges when switching administrators, even if the next query fails', async () => {
    const view = render(sidebar(overview, admin));
    await screen.findByLabelText('6 new payment alerts');
    fixture.error = { code: '42501' };
    view.rerender(sidebar(overview, { ...admin, id: 'admin-2' }));
    await act(async () => {});
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
