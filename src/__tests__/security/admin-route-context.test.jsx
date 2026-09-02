import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from '@/components/ProtectedRoute';
import { clearAdminAccess, grantAdminAccess } from '@/features/auth/utils/adminAccess';

const authState = vi.hoisted(() => ({
  user: {
    id: 'public-admin-profile',
    auth_id: 'admin-1',
    subscription_tier: 'free',
  },
  loading: false,
  isAdmin: true,
  authCheckComplete: true,
  adminCheckComplete: true,
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => authState,
}));

const renderAdminRoute = () =>
  render(
    <MemoryRouter initialEntries={['/admin/panel']}>
      <Routes>
        <Route
          path="/admin/panel"
          element={
            <ProtectedRoute adminOnly>
              <div>Private admin content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<div>Admin login required</div>} />
        <Route path="/dashboard" element={<div>User dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('admin route context', () => {
  beforeEach(() => {
    clearAdminAccess();
    authState.user = {
      id: 'public-admin-profile',
      auth_id: 'admin-1',
      subscription_tier: 'free',
    };
    authState.isAdmin = true;
    authState.adminCheckComplete = true;
  });

  it('requires an admin-role user to enter through the admin login', () => {
    renderAdminRoute();

    expect(screen.getByText('Admin login required')).toBeInTheDocument();
    expect(screen.queryByText('Private admin content')).not.toBeInTheDocument();
  });

  it('allows the admin route after the dedicated admin login grants context', () => {
    grantAdminAccess('admin-1');
    renderAdminRoute();

    expect(screen.getByText('Private admin content')).toBeInTheDocument();
  });

  it('does not render admin content while the database role is unverified', () => {
    authState.adminCheckComplete = false;
    grantAdminAccess('admin-1');
    renderAdminRoute();

    expect(screen.queryByText('Private admin content')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin login required')).not.toBeInTheDocument();
  });

  it('does not let a non-admin use client-side admin context', () => {
    authState.user = {
      id: 'public-user-profile',
      auth_id: 'user-1',
      subscription_tier: 'free',
    };
    authState.isAdmin = false;
    grantAdminAccess('user-1');
    renderAdminRoute();

    expect(screen.getByText('User dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Private admin content')).not.toBeInTheDocument();
  });
});
