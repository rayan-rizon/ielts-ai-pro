import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MaintenanceGate from '@/components/shared/MaintenanceGate';
import { normalizeMaintenance } from '@/lib/communications';

const state = vi.hoisted(() => ({ auth: {} }));
vi.mock('@/features/auth/context/AuthContext', () => ({ useAuth: () => state.auth }));
vi.mock('@/components/shared/MaintenanceScreen', () => ({
  default: ({ config }) => <h1>{config.title}</h1>,
}));
vi.mock('@/components/ui/PremiumLoading', () => ({
  default: ({ message }) => <div role="status">{message}</div>,
}));

function mount(path = '/') {
  const router = createMemoryRouter(
    [
      {
        element: <MaintenanceGate />,
        children: [
          { path: '/', element: <div>Public landing</div> },
          { path: '/pricing', element: <div>Pricing page</div> },
          { path: '/dashboard', element: <div>Learner dashboard</div> },
          { path: '/admin/panel', element: <div>Admin panel</div> },
          { path: '/admin-login', element: <div>Admin login</div> },
        ],
      },
    ],
    { initialEntries: [path] }
  );
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}

beforeEach(() => {
  state.auth = {
    maintenance: normalizeMaintenance({ enabled: true }),
    settingsLoading: false,
    authCheckComplete: true,
    isAdmin: false,
    adminCheckComplete: true,
    user: null,
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('site-wide maintenance enforcement', () => {
  it.each(['/', '/pricing', '/dashboard'])('blocks ordinary visitors on %s', (path) => {
    mount(path);
    expect(screen.getByRole('heading')).toHaveTextContent("We'll be right back");
    expect(screen.queryByText(/Public landing|Pricing page|Learner dashboard/)).toBeNull();
  });

  it('blocks signed-in learners', () => {
    state.auth.user = { email: 'learner@example.com' };
    mount('/dashboard');
    expect(screen.queryByText('Learner dashboard')).toBeNull();
  });

  it('allows admins by default and honors disabling their bypass', () => {
    state.auth.isAdmin = true;
    state.auth.user = { email: 'admin@example.com' };
    const view = mount();
    expect(screen.getByText('Public landing')).toBeInTheDocument();
    state.auth.maintenance = normalizeMaintenance({ enabled: true, allow_admins: false });
    view.unmount();
    mount();
    expect(screen.queryByText('Public landing')).toBeNull();
  });

  it('allows an explicitly allowlisted learner', () => {
    state.auth.user = { email: 'OPS@EXAMPLE.COM' };
    state.auth.maintenance = normalizeMaintenance({
      enabled: true,
      allowed_emails: ['ops@example.com'],
    });
    mount('/dashboard');
    expect(screen.getByText('Learner dashboard')).toBeInTheDocument();
  });

  it.each(['/admin/panel', '/admin-login'])('keeps recovery route %s reachable', (path) => {
    state.auth.settingsLoading = true;
    mount(path);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText(/Admin panel|Admin login/)).toBeInTheDocument();
  });

  it('rechecks the gate when navigating out of the admin escape hatch', async () => {
    state.auth.maintenance = normalizeMaintenance({ enabled: true, allow_admins: false });
    const { router } = mount('/admin/panel');
    await act(() => router.navigate('/pricing'));
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.queryByText('Pricing page')).toBeNull();
    await act(() => router.navigate('/admin/panel'));
    expect(screen.getByText('Admin panel')).toBeInTheDocument();
  });

  it('holds public routes while fresh settings are loading, even with cached online state', () => {
    state.auth.settingsLoading = true;
    state.auth.maintenance = normalizeMaintenance(false);
    mount();
    expect(screen.getByRole('status')).toHaveTextContent('Checking site availability');
    expect(screen.queryByText('Public landing')).toBeNull();
  });

  it('holds active routes while signed-in bypass eligibility is unresolved', () => {
    state.auth.user = { email: 'learner@example.com' };
    state.auth.adminCheckComplete = false;
    mount();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Public landing')).toBeNull();
  });

  it('activates and auto-resumes on time without a settings change', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T00:00:00Z'));
    state.auth.maintenance = normalizeMaintenance({
      enabled: true,
      starts_at: '2026-10-12T00:00:05Z',
      ends_at: '2026-10-12T00:00:10Z',
      auto_resume: true,
    });
    mount();
    expect(screen.getByText('Public landing')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5001));
    expect(screen.queryByText('Public landing')).toBeNull();
    expect(screen.getByRole('heading')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText('Public landing')).toBeInTheDocument();
  });

  it('does not auto-resume for an ETA unless explicitly enabled', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T00:00:00Z'));
    state.auth.maintenance = normalizeMaintenance({
      enabled: true,
      ends_at: '2026-10-12T00:00:05Z',
    });
    mount();
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
