/**
 * The one place a plan price is decided. The pricing page (via
 * src/lib/pricingUtils.js), create-checkout-session and the Stripe webhook all
 * import this file, so the price a learner sees is, by construction, the price
 * Stripe charges. Pure: no Deno or browser APIs.
 *
 * Admin pricing lives in system_settings.pricing_tiers:
 *   { pro: { price, originalPrice, currency, regional: [{ country, price, currency, symbol }] } }
 * A regional row applies to one country. Anyone else pays the global price.
 */

export const EXAM_PASS_MONTHS = 3;
export const EXAM_PASS_DISCOUNT = 0.25;

export type BillingInterval = 'monthly' | 'quarterly';

export interface PriceBook {
  price: number;
  originalPrice: number | null;
  currency: string;
  symbol: string | null;
  country: string | null;
}

export interface PromoDiscount {
  discount_type?: string;
  discount_value?: number;
}

// Stripe amounts are in the currency's minor unit. These have none.
const ZERO_DECIMAL = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);
// Sent as two-decimal values, but fractions cannot be charged.
const WHOLE_TWO_DECIMAL = new Set(['ISK', 'UGX']);
// Three minor digits; Stripe requires the last one to be 0.
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);
// Currencies under sanctions that no card processor, Stripe included, settles.
export const UNCHARGEABLE_CURRENCIES = new Set(['CUP', 'IRR', 'KPW', 'SYP']);

const upper = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toUpperCase();

const positive = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * The price book for one tier and country. A regional row with no valid price
 * is ignored rather than charging nothing, on the page and at checkout alike.
 */
export function resolvePriceBook(
  pricingTiers: Record<string, any> | null | undefined,
  tier: string,
  country: string | null | undefined,
  defaults: { price?: number; originalPrice?: number | null } = {}
): PriceBook | null {
  const tierSettings = pricingTiers?.[tier];
  const basePrice = positive(tierSettings?.price) ?? positive(defaults.price);
  if (!basePrice) return null;

  const baseOriginal =
    positive(tierSettings?.originalPrice) ?? positive(defaults.originalPrice) ?? null;
  const globalCurrency = upper(tierSettings?.currency) || 'USD';
  const countryCode = upper(country);

  const regional = countryCode
    ? (tierSettings?.regional || []).find(
        (row: any) => upper(row?.country) === countryCode && positive(row?.price)
      )
    : null;

  if (regional) {
    const price = positive(regional.price) as number;
    return {
      price,
      // The "was" price keeps the same proportion to the regional price.
      originalPrice: baseOriginal ? Math.round((baseOriginal / basePrice) * price) : null,
      currency: upper(regional.currency) || globalCurrency,
      symbol: regional.symbol || null,
      country: countryCode,
    };
  }

  return {
    price: basePrice,
    originalPrice: baseOriginal,
    currency: globalCurrency,
    symbol: null,
    country: null,
  };
}

/**
 * Whole-unit prices stay whole: taka, rupees, yen. A price the admin set as a
 * round number (৳699, ₹499) is charged in round numbers, and so is any currency
 * Stripe cannot charge fractions of. $9.99 keeps its cents.
 */
export function chargesWholeUnits(currency: string, basePrice?: number | null) {
  const code = upper(currency);
  if (code === 'BDT' || ZERO_DECIMAL.has(code) || WHOLE_TWO_DECIMAL.has(code)) return true;
  return basePrice != null && Number.isInteger(Number(basePrice));
}

const roundFor = (amount: number, wholeUnits: boolean) =>
  wholeUnits ? Math.round(amount) : Math.round(amount * 100) / 100;

export interface PlanCharge {
  /** Charged before any promo code: what the recurring price is set to. */
  listAmount: number;
  /** Charged for this checkout, promo applied. */
  amount: number;
  /** `amount` spread over the months it covers, for the card. */
  perMonth: number;
  months: number;
  wholeUnits: boolean;
}

export function computePlanCharge(
  basePrice: number,
  interval: string,
  currency: string,
  discount?: PromoDiscount | null
): PlanCharge {
  const months = interval === 'quarterly' ? EXAM_PASS_MONTHS : 1;
  const wholeUnits = chargesWholeUnits(currency, basePrice);
  const listAmount = roundFor(
    basePrice * months * (interval === 'quarterly' ? 1 - EXAM_PASS_DISCOUNT : 1),
    wholeUnits
  );

  let amount = listAmount;
  const value = Number(discount?.discount_value);
  if (discount && Number.isFinite(value) && value > 0) {
    amount =
      discount.discount_type === 'percentage'
        ? listAmount * (1 - value / 100)
        : Math.max(0, listAmount - value);
  }
  amount = roundFor(amount, wholeUnits);

  return {
    listAmount,
    amount,
    perMonth: roundFor(amount / months, wholeUnits),
    months,
    wholeUnits,
  };
}

/** Major units (what the card shows) → the integer Stripe expects. */
export function toStripeAmount(amount: number, currency: string) {
  const code = upper(currency);
  if (ZERO_DECIMAL.has(code)) return Math.round(amount);
  if (THREE_DECIMAL.has(code)) return Math.round(amount * 100) * 10;
  return Math.round(amount * 100);
}

/** Stripe's integer amount → major units, for records and receipts. */
export function fromStripeAmount(amount: number | null | undefined, currency: string) {
  const code = upper(currency);
  const n = Number(amount || 0);
  if (ZERO_DECIMAL.has(code)) return n;
  if (THREE_DECIMAL.has(code)) return n / 1000;
  return n / 100;
}
