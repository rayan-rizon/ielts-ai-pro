import { toStripeAmount, fromStripeAmount, UNCHARGEABLE_CURRENCIES } from './planPricing.ts';
export interface InstitutionPriceRule {
  id: string;
  institution_id: string | null;
  kind: 'default' | 'bulk' | 'override' | 'package';
  tier: string;
  months: number;
  currency: string;
  quantity: number;
  amount: number;
  enabled: boolean;
}
export function quoteInstitutionSeats(
  rules: InstitutionPriceRule[],
  institution: { id: string; currency: string },
  tier: string,
  months: number,
  quantity: number
) {
  if (
    !['pro', 'premium'].includes(tier) ||
    ![1, 3].includes(months) ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 10000
  )
    throw new Error('Choose Pro/Premium, 1 or 3 months, and 1–10,000 seats');
  const currency = institution.currency.toUpperCase();
  if (UNChargeable(currency)) throw new Error('Currency unavailable for Stripe payments');
  const eligible = rules.filter(
    (r) =>
      r.enabled &&
      r.tier === tier &&
      Number(r.months) === months &&
      r.currency.toUpperCase() === currency &&
      (r.institution_id === null || r.institution_id === institution.id)
  );
  const rank = { package: 4, override: 3, bulk: 2, default: 1 };
  const rule = eligible
    .filter((r) =>
      r.kind === 'package'
        ? Number(r.quantity) === quantity
        : r.kind === 'bulk'
          ? Number(r.quantity) <= quantity
          : true
    )
    .sort((a, b) => rank[b.kind] - rank[a.kind] || Number(b.quantity) - Number(a.quantity))[0];
  if (!rule || !Number.isFinite(Number(rule.amount)) || Number(rule.amount) <= 0)
    throw new Error('No institution price is configured for this plan and currency');
  const roundedAmount = Math.round(Number(rule.amount) * 100 + 1e-8) / 100;
  const unitMinor = toStripeAmount(roundedAmount, currency);
  const amountMinor = rule.kind === 'package' ? unitMinor : unitMinor * quantity;
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error('Invalid price');
  return {
    tier,
    months,
    quantity,
    currency,
    amount_minor: amountMinor,
    total: fromStripeAmount(amountMinor, currency),
    rule_id: rule.id,
    pricing_kind: rule.kind,
    unit_amount: rule.kind === 'package' ? null : fromStripeAmount(unitMinor, currency),
  };
}
function UNChargeable(currency: string) {
  return !/^[A-Z]{3}$/.test(currency) || UNCHARGEABLE_CURRENCIES.has(currency);
}
