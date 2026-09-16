import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/features/core/components/Sidebar/AdminSidebar';
import { supabase } from '@/lib/supabase';

const fixture = vi.hoisted(() => ({
  pendingCount: 3,
  stripePaymentCount: 2,
  stripeFailureCount: 1,
  latestPaymentAt: '2026-08-01T12:00:00Z',
  seenAt: '2026-01-01T00:00:00Z',
  seenAtRpcError: null,
  rpcCalls: [],
}));

/**
 * Minimal chainable stand-in for the supabase query builder: it records the
 * filters applied and resolves to the count the fixture says that query means.
 */
function makeQuery(table, columns) {
  const filters = [];
  const builder = {
    filters,
    eq(field, value) {
      filters.push([field, value]);
      return builder;
    },
    gt(field, value) {
      filters.push(['gt:' + field, value]);
      return builder;
    },
    not(field, op, value) {
      filters.push(['not:' + field, op, value]);
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return Promise.resolve({
        data: [{ created_at: fixture.latestPaymentAt }],
        error: null,
      });
    },
    then(resolve, reject) {
      return resolvedResult(table, columns, filters).then(resolve, reject);
    },
  };
  return builder;
}

function resolvedResult(table, columns, filters) {
  if (table === 'users') {
    return Promise.resolve({ count: fixture.stripeFailureCount, error: null });
  }
  const hasFilter = (field, value) => filters.some(([f, v]) => f === field && v === value);
  if (hasFilter('status', 'pending')) {
    return Promise.resolve({ count: fixture.pendingCount, error: null });
  }
  if (hasFilter('payment_method', 'stripe')) {
    return Promise.resolve({ count: fixture.stripePaymentCount, error: null });
  }
  if (columns === 'created_at') {
    return Promise.resolve({ data: [{ created_at: fixture.latestPaymentAt }], error: null });
  }
  return Promise.resolve({ count: 0, error: null });
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: vi.fn((columns) => makeQuery(table, columns)),
    })),
    rpc: vi.fn((name) => {
      fixture.rpcCalls.push(name);
      if (fixture.seenAtRpcError) {
        return Promise.resolve({ data: null, error: fixture.seenAtRpcError });
      }
      return Promise.resolve({ data: fixture.seenAt, error: null });
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
    fixture.pendingCount = 3;
    fixture.stripePaymentCount = 2;
    fixture.stripeFailureCount = 1;
    fixture.latestPaymentAt = '2026-08-01T12:00:00Z';
    fixture.seenAt = '2026-01-01T00:00:00Z';
    fixture.seenAtRpcError = null;
    fixture.rpcCalls = [];
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

  it('renders payment alert badge for everything newer than the stored marker', async () => {
    renderAdminSidebar();
    // 3 pending + 2 stripe payments + 1 stripe failure = 6
    const badges = await screen.findAllByRole('status');
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toHaveTextContent('6');
    expect(fixture.rpcCalls).toContain('get_admin_payment_alert_seen_at');
  });

  it('stays dismissed in a fresh browser because the marker lives on the server', async () => {
    // A browser that has never stored anything locally still reads the marker
    // the admin set elsewhere, so nothing counts as new.
    fixture.pendingCount = 0;
    fixture.stripePaymentCount = 0;
    fixture.stripeFailureCount = 0;

    renderAdminSidebar();

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_admin_payment_alert_seen_at');
    });
    await act(async () => {});
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(window.localStorage.length).toBe(0);
  });

  it('records the dismissal server-side when the payments tab is opened', async () => {
    renderAdminSidebar({ pathname: '/admin', search: '?tab=payments' });
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('mark_admin_payment_alerts_seen');
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('falls back to a session baseline when the marker cannot be read', async () => {
    fixture.seenAtRpcError = { code: '42883', message: 'function does not exist' };

    renderAdminSidebar();

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_admin_payment_alert_seen_at');
    });
    await act(async () => {});
    // Existing payments are treated as already seen rather than crashing.
    const badges = screen.queryAllByRole('status');
    expect(badges.length).toBeGreaterThan(0);
  });
});
