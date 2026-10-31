import process from 'node:process';
import {
  EXAM_PASS_DISCOUNT,
  EXAM_PASS_MONTHS,
  computePlanCharge,
  resolvePriceBook,
} from '../supabase/functions/_shared/planPricing.ts';

const SITE_URL = 'https://www.ieltsai.pro';

// Same fallbacks as src/features/subscription/config/pricingPlans.js. The live
// price comes from system_settings.pricing_tiers; these only apply if a tier
// has no valid price there.
const TIERS = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    originalPrice: null,
    summary: 'Start practising IELTS and see how you are improving.',
    features: [
      'Reading and Listening practice tests',
      '5 AI Reading Assistant requests per day',
      'Grammar Units 1-3 and 5 practice questions per day',
      'Basic 30-day progress analytics',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 9.99,
    originalPrice: 15,
    summary: 'More AI help and a study plan that fits your needs.',
    features: [
      'Unlimited Reading and Listening tests',
      'Unlimited AI Reading Assistant (simplify, translate, break down sentences)',
      'All Grammar guides with unlimited practice',
      'Advanced weakness and readiness analytics',
      'AI study plan made for you',
    ],
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: 15.99,
    originalPrice: 25,
    summary: 'More AI practice and support for every part of IELTS prep.',
    features: [
      'Everything in Pro',
      'Detailed Writing and Speaking feedback',
      'Study plan updates as you improve',
    ],
  },
];

const FALLBACK_LIMITS = {
  free: { writing: 1, speaking: 0 },
  pro: { writing: 100, speaking: 50 },
  premium: { writing: 200, speaking: 100 },
};

function money(amount, currency, symbol) {
  const whole = Number.isInteger(amount);
  const text = amount.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (symbol) return `${symbol}${text}`;
  return currency === 'USD' ? `$${text}` : `${currency} ${text}`;
}

function quota(limit, singular, plural) {
  if (limit === -1 || limit === '-1') return `Unlimited AI ${plural} per month`;
  if (!limit) return `No AI ${plural} included`;
  return `${limit} AI ${Number(limit) === 1 ? singular : plural} per month`;
}

export function renderPricingMd({ pricingTiers = null, limits = {}, updatedOn } = {}) {
  const sections = [];
  const regional = [];

  for (const plan of TIERS) {
    const book =
      plan.tier === 'free'
        ? { price: 0, originalPrice: null, currency: 'USD', symbol: '$' }
        : resolvePriceBook(pricingTiers, plan.tier, null, {
            price: plan.price,
            originalPrice: plan.originalPrice,
          });
    const tierLimits = limits[plan.tier] || FALLBACK_LIMITS[plan.tier];
    const lines = [`## ${plan.name}`, ''];

    if (plan.tier === 'free') {
      lines.push('- Price: $0, no card required');
    } else if (book) {
      const monthly = computePlanCharge(book.price, 'monthly', book.currency);
      const pass = computePlanCharge(book.price, 'quarterly', book.currency);
      const was = book.originalPrice
        ? ` (list price ${money(book.originalPrice, book.currency)})`
        : '';
      lines.push(
        `- Price: ${money(monthly.amount, book.currency)} per month${was}, billed monthly`,
        `- Exam Pass: ${money(pass.amount, book.currency)} paid once for ${EXAM_PASS_MONTHS} months (${Math.round(EXAM_PASS_DISCOUNT * 100)}% below three monthly payments, not auto-renewing)`
      );
    }

    lines.push(
      `- Writing: ${quota(tierLimits.writing_monthly_limit ?? tierLimits.writing, 'Writing evaluation', 'Writing evaluations')}`,
      `- Speaking: ${quota(tierLimits.speaking_monthly_limit ?? tierLimits.speaking, 'Speaking session', 'Speaking sessions')}`,
      `- Best for: ${plan.summary}`,
      '- Includes:',
      ...plan.features.map((feature) => `  - ${feature}`),
      ''
    );
    sections.push(lines.join('\n'));

    for (const row of pricingTiers?.[plan.tier]?.regional || []) {
      const price = Number(row?.price);
      if (!row?.country || !Number.isFinite(price) || price <= 0) continue;
      const currency = String(row.currency || book?.currency || 'USD').toUpperCase();
      const charge = computePlanCharge(price, 'monthly', currency);
      regional.push(
        `- ${plan.name}, ${String(row.country).toUpperCase()}: ${money(charge.amount, currency, row.symbol)} per month`
      );
    }
  }

  const regionalBlock = regional.length ? ['## Local prices', '', ...regional, ''].join('\n') : '';

  return `# IELTS Ai Pro pricing

> IELTS Ai Pro is an independent web-based IELTS preparation platform. Plans below are the current public prices${updatedOn ? ` (checked ${updatedOn})` : ''}. Prices are in US dollars unless a local price is listed. The pricing shown at checkout is authoritative.

${sections.join('\n')}
${regionalBlock}
## Billing and policies

- Monthly plans renew until cancelled; the Exam Pass is a one-time payment for ${EXAM_PASS_MONTHS} months and does not renew.
- Local payment options such as bKash and Nagad are offered to learners in Bangladesh.
- AI feedback and band scores are practice estimates, not official IELTS results.
- [Refund and cancellation policy](${SITE_URL}/refund)
- [Terms of service](${SITE_URL}/terms)
- Institutions can buy prepaid Pro or Premium seats: ${SITE_URL}/institutions

## More

- [Home](${SITE_URL}/)
- [llms.txt](${SITE_URL}/llms.txt)
- Contact: mail@ieltsai.pro
`;
}

function getSupabaseCredentials() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase pricing configuration is unavailable');
  return { supabaseUrl, anonKey };
}

async function rest(path, params) {
  const { supabaseUrl, anonKey } = getSupabaseCredentials();
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}?${new URLSearchParams(params)}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
  return response.json();
}

async function fetchPricingInputs() {
  const [settings, limitRows] = await Promise.all([
    rest('system_settings', { select: 'value', key: 'eq.pricing_tiers' }),
    rest('tier_rate_limits', {
      select: 'tier,currency,writing_monthly_limit,speaking_monthly_limit',
      currency: 'in.(ALL,USD)',
    }),
  ]);
  const limits = {};
  // A USD row wins over the ALL row, as in src/lib/tierLimitsUtils.js.
  for (const currency of ['ALL', 'USD']) {
    for (const row of limitRows) if (row.currency === currency) limits[row.tier] = row;
  }
  return { pricingTiers: settings[0]?.value ?? null, limits };
}

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  response.setHeader('Content-Language', 'en');
  response.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method && !['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).send('');
  }

  const updatedOn = new Date().toISOString().slice(0, 10);
  try {
    const body = renderPricingMd({ ...(await fetchPricingInputs()), updatedOn });
    return response.status(200).send(request.method === 'HEAD' ? '' : body);
  } catch (error) {
    // Never serve default prices when the live ones cannot be read: a stale
    // price in an AI answer is worse than no answer.
    console.error('[pricing-render]', error);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Retry-After', '300');
    return response.status(503).send('Pricing is temporarily unavailable.');
  }
}
