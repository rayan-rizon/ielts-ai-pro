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
  mfa: {
    getAuthenticatorAssuranceLevel: vi.fn(),
    listFactors: vi.fn(),
  },
  recordSecurityEvent: vi.fn(),
  verifyTotp: vi.fn(),
  getUser: vi.fn(),
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

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      mfa: testState.mfa,
      getUser: testState.getUser,
    },
  },
}));

vi.mock('@/features/admin/services/AdminSecurityService', () => ({
  AdminSecurityService: {
    record: testState.recordSecurityEvent,
    verifyTotp: testState.verifyTotp,
  },
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
    testState.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });
    testState.mfa.listFactors.mockResolvedValue({ data: { totp: [], phone: [] }, error: null });
    testState.recordSecurityEvent.mockReset();
    testState.recordSecurityEvent.mockResolvedValue(undefined);
    testState.verifyTotp.mockReset();
    testState.verifyTotp.mockResolvedValue(undefined);
    testState.getUser.mockReset();
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
      expect(testState.navigate).toHaveBeenCalledWith(
        '/admin/panel?tab=settings&section=security',
        {
          replace: true,
        }
      )
    );
  });

  it('requires an authenticator code after the first factor when MFA is enrolled', async () => {
    testState.auth.signIn.mockResolvedValue({
      id: 'supabase-admin-auth',
      email: 'admin@example.com',
    });
    testState.auth.checkIsAdmin.mockResolvedValue(true);
    testState.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });
    testState.mfa.listFactors.mockResolvedValue({
      data: {
        totp: [{ id: 'factor-1', status: 'verified', friendly_name: 'Work authenticator' }],
        phone: [],
      },
      error: null,
    });
    testState.getUser.mockResolvedValue({
      data: { user: { id: 'supabase-admin-auth', email: 'admin@example.com' } },
    });

    render(
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

    expect(await screen.findByLabelText('Verification code')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and enter' }));

    await waitFor(() => expect(testState.verifyTotp).toHaveBeenCalledWith('factor-1', '123456'));
    await waitFor(() =>
      expect(testState.navigate).toHaveBeenCalledWith('/admin/panel', { replace: true })
    );
  });
});
