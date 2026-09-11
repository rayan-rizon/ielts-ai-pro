import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Layout from '@/features/core/pages/Layout';

const testState = vi.hoisted(() => ({
  auth: {
    user: null,
    userProfile: null,
    loading: false,
    authCheckComplete: true,
    adminCheckComplete: false,
    isAdmin: false,
    announcement: {
      enabled: true,
      title: 'Upgrade offer',
      message: 'Save on IELTS AI Pro.',
      audience: 'free',
    },
    signOut: vi.fn(),
  },
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => testState.auth,
}));

vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children }) => <aside>{children}</aside>,
  SidebarProvider: ({ children }) => <div>{children}</div>,
  SidebarTrigger: () => <button type="button">Toggle sidebar</button>,
  SidebarRail: () => null,
  useSidebar: () => ({
    open: true,
    setOpen: vi.fn(),
    setOpenMobile: vi.fn(),
  }),
}));

vi.mock('@/features/core/components/Sidebar/SidebarStyles', () => ({
  SidebarStyles: ({ children }) => <>{children}</>,
}));

vi.mock('@/features/core/components/Sidebar/UserSidebar', () => ({
  UserSidebar: ({ user, showUpgradeOffer }) => (
    <div>
      User sidebar
      {(showUpgradeOffer ?? !user?.subscription_tier) && <span>Upgrade to Pro</span>}
    </div>
  ),
}));

vi.mock('@/features/core/components/Sidebar/AdminSidebar', () => ({
  AdminSidebar: () => <div>Admin sidebar</div>,
}));

vi.mock('@/components/shared/AnnouncementBanner', () => ({
  default: () => <div>Site announcement</div>,
}));

vi.mock('@/features/marketing/components/LearnerMarketingSurface', () => ({
  default: () => <div>Learner marketing</div>,
}));

vi.mock('@/components/OfflineBanner', () => ({ OfflineBanner: () => null }));
vi.mock('@/components/shared/ServiceOutageBanner', () => ({ default: () => null }));

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Layout currentPageName="Dashboard">
        <div>Dashboard content</div>
      </Layout>
    </MemoryRouter>
  );

describe('learner-only dashboard chrome', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    testState.auth.user = null;
    testState.auth.userProfile = null;
    testState.auth.loading = false;
    testState.auth.authCheckComplete = true;
    testState.auth.adminCheckComplete = false;
    testState.auth.isAdmin = false;
    testState.auth.signOut.mockReset();
  });

  it('stays hidden until the current profile role is authoritative', async () => {
    testState.auth.user = { id: 'auth-admin' };

    renderDashboard();

    await screen.findByText('User sidebar');
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(screen.queryByText('Site announcement')).not.toBeInTheDocument();
    expect(screen.queryByText('Learner marketing')).not.toBeInTheDocument();
    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
  });

  it('renders learner offers after a matching non-admin profile resolves', async () => {
    testState.auth.user = { id: 'learner-profile', auth_id: 'auth-learner' };
    testState.auth.userProfile = {
      id: 'learner-profile',
      auth_id: 'auth-learner',
      role: 'user',
      subscription_tier: 'free',
    };
    testState.auth.adminCheckComplete = true;

    renderDashboard();

    await screen.findByText('User sidebar');
    expect(screen.getByText('Site announcement')).toBeInTheDocument();
    expect(screen.getByText('Learner marketing')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
  });

  it('never renders learner offers for a confirmed admin', async () => {
    testState.auth.user = { id: 'admin-profile', auth_id: 'auth-admin' };
    testState.auth.userProfile = {
      id: 'admin-profile',
      auth_id: 'auth-admin',
      role: 'admin',
      subscription_tier: 'free',
    };
    testState.auth.adminCheckComplete = true;
    testState.auth.isAdmin = true;

    renderDashboard();

    await screen.findByText('User sidebar');
    expect(screen.queryByText('Site announcement')).not.toBeInTheDocument();
    expect(screen.queryByText('Learner marketing')).not.toBeInTheDocument();
    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
  });
});
