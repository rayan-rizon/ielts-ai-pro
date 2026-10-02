import { describe, it, expect } from 'vitest';
import { historyChanges, historySubject } from '../../features/institution/services/history';
describe('readable institution history', () => {
  it('shows changed fields with formatted pricing and hides internal identifiers', () => {
    const changes = historyChanges({
      before_value: { amount: 9.99, kind: 'override', enabled: true, updated_at: 'old' },
      after_value: {
        amount: 4.25,
        kind: 'override',
        enabled: false,
        updated_at: 'new',
        id: 'internal',
        token_hash: 'secret',
      },
    });
    expect(changes.map((c) => c.key)).toEqual(['amount', 'enabled']);
    expect(changes[0]).toMatchObject({ before: '$9.99', after: '$4.25', label: 'Price' });
    expect(changes[1]).toMatchObject({ before: 'Yes', after: 'No' });
  });
  it('uses readable values for new free grants', () => {
    const changes = historyChanges({
      before_value: null,
      after_value: { tier: 'pro', quantity: 5, access_days: 30, source: 'complimentary' },
    });
    expect(changes.find((c) => c.key === 'source').after).toBe('Free seats');
    expect(changes.find((c) => c.key === 'access_days').after).toBe('30 days');
    expect(changes.every((c) => c.created)).toBe(true);
  });
  it('resolves acceptance to student identity and formats refund amounts', () => {
    expect(
      historySubject({ after_value: { seat_id: 'seat', kind: 'student' } }, [
        { id: 'seat', recipient_email: 'student@example.test' },
      ])
    ).toBe('student@example.test');
    expect(
      historyChanges({
        before_value: { currency: 'USD', refunded_minor: 0 },
        after_value: { refunded_minor: 999 },
      })[0]
    ).toMatchObject({ before: '$0.00', after: '$9.99' });
  });
  it('does not invent a change when a snapshot repeats its values', () => {
    expect(
      historyChanges({
        before_value: { enabled: false, status: 'revoked' },
        after_value: { enabled: false, status: 'revoked' },
      })
    ).toEqual([]);
  });
});
