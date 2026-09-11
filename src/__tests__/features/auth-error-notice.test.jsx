import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthErrorNotice } from '@/features/auth/components/AuthErrorNotice';

describe('AuthErrorNotice', () => {
  it('tells the user an outage is our fault and not their account', () => {
    render(<AuthErrorNotice message="" isOutage />);

    expect(screen.getByText(/having trouble connecting/i)).toBeInTheDocument();
    expect(screen.getByText(/problem on our side — your account is fine/i)).toBeInTheDocument();
    // The point of the whole change: no credential language during an outage.
    expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
  });

  it('offers a manual retry during an outage', () => {
    const onRetry = vi.fn();
    render(<AuthErrorNotice message="" isOutage onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders a credential failure plainly, with no retry button', () => {
    render(<AuthErrorNotice message="Invalid email or password. Please try again." />);

    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/problem on our side/i)).not.toBeInTheDocument();
  });

  it('uses a calmer amber treatment for outages and red for user errors', () => {
    const { container: outage } = render(<AuthErrorNotice message="" isOutage />);
    expect(outage.querySelector('[role="alert"]').className).toMatch(/amber/);

    const { container: rejected } = render(
      <AuthErrorNotice message="Invalid email or password." />
    );
    expect(rejected.querySelector('[role="alert"]').className).toMatch(/rose/);
  });

  it('renders nothing when there is no error at all', () => {
    const { container } = render(<AuthErrorNotice message="" />);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
