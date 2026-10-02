import { describe, it, expect } from 'vitest';
import {
  quoteInstitutionSeats,
  type InstitutionPriceRule,
} from '../../../supabase/functions/_shared/institutionPricing';
const institution = { id: 'school', currency: 'USD' };
const rule = (
  kind: InstitutionPriceRule['kind'],
  amount: number,
  quantity = 1
): InstitutionPriceRule => ({
  id: kind,
  institution_id: ['package', 'override'].includes(kind) ? 'school' : null,
  kind,
  tier: 'pro',
  months: 1,
  currency: 'USD',
  quantity,
  amount,
  enabled: true,
});
describe('Institution server-side pricing', () => {
  it('applies a bulk rate to every seat, without stacking discounts', () =>
    expect(
      quoteInstitutionSeats(
        [rule('default', 9.99), rule('bulk', 8, 10), rule('bulk', 7, 50)],
        institution,
        'pro',
        1,
        20
      )
    ).toMatchObject({ amount_minor: 16000, pricing_kind: 'bulk', quantity: 20 }));
  it('prefers negotiated pricing and exact package totals', () => {
    const rules = [
      rule('default', 10),
      rule('bulk', 8, 10),
      rule('override', 6),
      rule('package', 90, 20),
    ];
    expect(quoteInstitutionSeats(rules, institution, 'pro', 1, 20).total).toBe(90);
    expect(quoteInstitutionSeats(rules, institution, 'pro', 1, 21).total).toBe(126);
  });
  it('does not apply another institution override or disabled rule', () =>
    expect(
      quoteInstitutionSeats(
        [
          rule('default', 10),
          { ...rule('override', 1), institution_id: 'other' },
          { ...rule('bulk', 2, 10), enabled: false },
        ],
        institution,
        'pro',
        1,
        20
      ).total
    ).toBe(200));
  it('does currency rounding per seat before multiplication', () =>
    expect(
      quoteInstitutionSeats([rule('default', 9.995)], institution, 'pro', 1, 3).amount_minor
    ).toBe(3000));
  it('supports zero decimal currencies', () =>
    expect(
      quoteInstitutionSeats(
        [{ ...rule('default', 999), currency: 'JPY' }],
        { ...institution, currency: 'JPY' },
        'pro',
        1,
        3
      ).amount_minor
    ).toBe(2997));
  it.each([0, -1, 1.2, Infinity, 10001])('rejects invalid quantities %s', (quantity) =>
    expect(() =>
      quoteInstitutionSeats([rule('default', 10)], institution, 'pro', 1, quantity)
    ).toThrow()
  );
  it('requires a configured price rather than inventing a fallback', () =>
    expect(() =>
      quoteInstitutionSeats([rule('default', 10)], institution, 'premium', 3, 10)
    ).toThrow('No institution price'));
});
