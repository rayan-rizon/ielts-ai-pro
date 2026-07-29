import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLogin from '@/features/auth/pages/AdminLogin';
import { clearAdminAccess } from '@/features/auth/utils/adminAccess';

const testState = vi.hoisted(() => ({
  navigate: vi.fn(),
  auth: {
    user: null,
    signIn: vi.fn(),
    isAdmin: false,
    loading: false,
    adminCheckComplete: true,
    checkIsAdmin: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => testState.navigate,
  };
});

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => testState.auth,
}));

describe('admin login transition', () => {
  beforeEach(() => {
    clearAdminAccess();
    testState.navigate.mockReset();
    testState.auth.user = null;
    testState.auth.isAdmin = false;
    testState.auth.loading = false;
    testState.auth.adminCheckComplete = true;
    testState.auth.signIn.mockReset();
    testState.auth.checkIsAdmin.mockReset();
  });

  it('keeps one stable loading form while auth context updates during sign-in', async () => {
    let finishSignIn;
    testState.auth.signIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSignIn = resolve;
        })
    );
    testState.auth.checkIsAdmin.mockResolvedValue(true);

    const view = render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Admin Email'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Access Password'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enter Command Center' }));

    expect(screen.getByRole('button', { name: 'Authenticating...' })).toBeInTheDocument();

    testState.auth.user = {
      id: 'public-admin-profile',
      auth_id: 'supabase-admin-auth',
    };
    testState.auth.isAdmin = true;
    testState.auth.adminCheckComplete = false;
    view.rerender(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Authenticating...' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Verifying admin access')).not.toBeInTheDocument();

    finishSignIn({ id: 'supabase-admin-auth' });

    await waitFor(() =>
      expect(testState.navigate).toHaveBeenCalledWith('/admin/panel', { replace: true })
    );
  });
});
