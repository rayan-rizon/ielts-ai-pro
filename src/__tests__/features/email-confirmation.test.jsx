import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmailConfirmation from '@/features/auth/pages/EmailConfirmation';

const testState = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: testState.verifyOtp,
    },
  },
}));

function renderConfirmation(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/confirm" element={<EmailConfirmation />} />
        <Route path="/dashboard" element={<div>Dashboard reached</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('signup email confirmation', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    testState.verifyOtp.mockReset();
  });

  it('redeems a signup token and continues to the dashboard', async () => {
    testState.verifyOtp.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    renderConfirmation('/auth/confirm?token_hash=secure-token&type=signup');

    await waitFor(() => {
      expect(testState.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'secure-token',
        type: 'signup',
      });
    });
    expect(await screen.findByText('Dashboard reached')).toBeInTheDocument();
  });

  it('does not send malformed or non-signup links to Supabase', async () => {
    renderConfirmation('/auth/confirm?token_hash=secure-token&type=recovery');

    expect(
      await screen.findByRole('heading', { name: 'This confirmation link is invalid' })
    ).toBeInTheDocument();
    expect(testState.verifyOtp).not.toHaveBeenCalled();
  });

  it('shows an actionable message when the token has expired', async () => {
    testState.verifyOtp.mockResolvedValue({
      data: { session: null },
      error: new Error('Token has expired or is invalid'),
    });

    renderConfirmation('/auth/confirm?token_hash=expired-token&type=signup');

    expect(
      await screen.findByRole('heading', { name: 'This confirmation link has expired' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login');
  });
});
