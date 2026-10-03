import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '@/features/auth/pages/Login';
import InstitutionLogin from '@/features/institution/pages/InstitutionLogin';
const auth = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn(), user: null }));
const api = vi.hoisted(() => ({ invitation: vi.fn(), reset: vi.fn(), update: vi.fn() }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ loading: false, authCheckComplete: true, ...auth }),
}));
vi.mock('@/features/auth/services/User', () => ({ User: { updatePassword: api.update } }));
vi.mock('@/features/institution/services/institutions', () => ({
  institutionInvitationRequest: api.invitation,
}));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { resetPasswordForEmail: api.reset } } }));
vi.mock('@/lib/tracking', () => ({ trackAppEvent: vi.fn() }));
vi.mock('@/components/shared/DocumentHead', () => ({ default: () => null }));
vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));
function Destination() {
  const location = useLocation();
  return (
    <div>
      Destination: {location.pathname}
      {location.search}
    </div>
  );
}
function mount(institution = true, from, search = '') {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: institution ? '/institution/login' : '/login',
          search,
          state: from ? { from } : null,
        },
      ]}
    >
      <Routes>
        <Route
          path={institution ? '/institution/login' : '/login'}
          element={institution ? <InstitutionLogin /> : <Login />}
        />
        <Route path="*" element={<Destination />} />
      </Routes>
    </MemoryRouter>
  );
}
beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  auth.signIn.mockReset();
  auth.signUp.mockReset();
  auth.user = null;
  localStorage.clear();
  sessionStorage.clear();
  api.reset.mockResolvedValue({ error: null });
});
function credentials(label = /^password$/i) {
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'owner@example.test' },
  });
  fireEvent.change(screen.getByLabelText(label), { target: { value: 'StrongPassword123!' } });
}
const invited = { pathname: '/institution/accept', search: '?token=single-use' };
const details = { email: 'owner@example.test', institution_name: 'Approved Centre', kind: 'owner' };
describe('institution sign-in integration', () => {
  it('only offers institution sign-in and application, without public registration, Google, or learner links', () => {
    mount();
    expect(
      screen.queryByRole('button', { name: /sign up|create account|google|set your password/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Apply for institution access/ })).toHaveAttribute(
      'href',
      '/institution/apply'
    );
    expect(
      screen
        .getAllByRole('link')
        .every((link) => link.getAttribute('href').startsWith('/institution/'))
    ).toBe(true);
  });
  it('retains invitation token after sign-in', async () => {
    api.invitation.mockResolvedValue(details);
    auth.signIn.mockResolvedValue({ session: {} });
    mount(true, invited);
    await screen.findByRole('button', { name: /First time/ });
    credentials();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
    await screen.findByText('Destination: /institution/accept?token=single-use');
    expect(auth.signIn).toHaveBeenCalledWith('owner@example.test', 'StrongPassword123!');
  });
  it('preserves learner login and signup independently, with no institution cross-link', async () => {
    auth.signIn.mockResolvedValue({});
    mount(false, { pathname: '/dashboard' });
    expect(screen.queryByRole('link', { name: /institution owner/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up', exact: true })).toBeInTheDocument();
    credentials();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
    await screen.findByText('Destination: /dashboard');
  });
  it('keeps password recovery in the institution portal and retains the invitation', async () => {
    api.invitation.mockResolvedValue(details);
    mount(true, invited);
    await screen.findByRole('button', { name: /First time/ });
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await screen.findByText(/a password reset link is on its way/);
    expect(api.reset).toHaveBeenCalledWith('owner@example.test', {
      redirectTo: `${window.location.origin}/institution/login?recovery=1`,
    });
    expect(localStorage.getItem('auth_destination')).toBe('/institution/accept?token=single-use');
    expect(
      screen
        .getAllByRole('link')
        .every((link) => link.getAttribute('href').startsWith('/institution/'))
    ).toBe(true);
  });
  it('allows password setup only after server validation, and binds it to the invitation rather than an editable email', async () => {
    api.invitation.mockResolvedValue(details);
    auth.signIn.mockResolvedValue({});
    mount(true, invited);
    fireEvent.click(await screen.findByRole('button', { name: /First time/ }));
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set password and continue' }));
    await screen.findByText('Destination: /institution/accept?token=single-use');
    expect(api.invitation).toHaveBeenCalledWith('invitation_setup', {
      token: 'single-use',
      password: 'StrongPassword123!',
    });
    expect(auth.signUp).not.toHaveBeenCalled();
  });
  it('does not expose setup for an invalid invitation', async () => {
    api.invitation.mockRejectedValue(new Error('Invitation expired'));
    mount(true, invited);
    await screen.findByText('Invitation expired');
    expect(screen.queryByRole('button', { name: /First time/ })).not.toBeInTheDocument();
  });
  it('requires an existing account to sign in without replacing its password', async () => {
    api.invitation
      .mockResolvedValueOnce(details)
      .mockResolvedValueOnce({ ...details, existing_account: true });
    mount(true, invited);
    fireEvent.click(await screen.findByRole('button', { name: /First time/ }));
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set password and continue' }));
    await screen.findByText(/already has an account/);
    expect(auth.signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });
  it('does not redirect the authenticated recovery session before saving its password', async () => {
    auth.user = { id: 'owner' };
    mount(true, undefined, '?recovery=1');
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith('StrongPassword123!'));
    await screen.findByText('Destination: /institution');
  });
});
