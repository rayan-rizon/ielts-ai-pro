import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from '@/components/ProtectedRoute';

const authState = vi.hoisted(() => ({
  user: null,
  loading: false,
  isAdmin: false,
  authCheckComplete: true,
  adminCheckComplete: true,
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => authState,
}));

const LoginRedirect = () => {
  const location = useLocation();
  return <div>{`login:${location.state?.from?.pathname || 'none'}`}</div>;
};

const renderProtectedRoute = (props = {}) =>
  render(
    <MemoryRouter initialEntries={['/protected?source=test']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute {...props}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/upgrade" element={<div>Upgrade required</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute redirects', () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    authState.isAdmin = false;
    authState.authCheckComplete = true;
    authState.adminCheckComplete = true;
  });

  it('redirects unauthenticated visitors to login and preserves the originating path', () => {
    renderProtectedRoute();

    expect(screen.getByText('login:/protected')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects free users from pro-only routes to the upgrade page', () => {
    authState.user = { id: 'learner-1', subscription_tier: 'free' };
    renderProtectedRoute({ requirePro: true });

    expect(screen.getByText('Upgrade required')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('does not redirect a paid learner from a pro-only route', () => {
    authState.user = { id: 'learner-1', subscription_tier: 'pro' };
    renderProtectedRoute({ requirePro: true });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
