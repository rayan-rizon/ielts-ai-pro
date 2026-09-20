import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ExpiryTimer from '@/components/shared/ExpiryTimer';
import { formatExpiryCountdown } from '@/components/shared/expiryCountdown';

describe('ExpiryTimer', () => {
  it('formats a truthful countdown from the stored expiry', () => {
    const now = new Date('2026-09-21T00:00:00Z').getTime();
    expect(formatExpiryCountdown('2026-09-21T01:02:03Z', now)).toEqual({
      label: '01:02:03 left',
      expired: false,
    });
    expect(formatExpiryCountdown('2026-09-20T23:59:59Z', now)).toEqual({
      label: 'Ended',
      expired: true,
    });
  });

  it('renders the exact end time as accessible context', () => {
    render(<ExpiryTimer expiresAt="2099-09-21T01:02:03Z" />);
    expect(screen.getByRole('timer')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/until/i)
    );
  });

  it('makes a real limited-time offer explicit without changing its stored deadline', () => {
    render(<ExpiryTimer expiresAt="2099-09-21T01:02:03Z" urgent />);
    expect(screen.getByRole('timer')).toHaveTextContent(/Ends in/i);
    expect(screen.getByRole('timer')).toHaveAttribute('title', expect.stringMatching(/until/i));
  });
});
