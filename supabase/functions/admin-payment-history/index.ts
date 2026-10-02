import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14.14.0';
import { isVisibleIeltsCheckout, stripeObjectId } from './visibility.ts';
import { getCorsHeaders, handleCorsPrelight } from '../_shared/security.ts';
import { fromStripeAmount } from '../_shared/planPricing.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// These are audited live-mode Checkout Sessions created during payment testing.
// Stripe does not support deleting completed Checkout Sessions, so keep the
// financial history intact. The provenance filter below handles future
// sessions; this set handles only legacy sessions that predate that contract.
const LEGACY_TEST_CHECKOUT_SESSION_IDS = new Set([
  'cs_live_a12f9quY27IxOkP5ZB052WguXomVpK1mXeoMiHM28AhH9FhNXdIa1gEFSv',
  'cs_live_b13bIPIEDTVTk2gEAAxJ8nvtxUWPnjigDb6RvgNQ14FCIHhhGsemocuaEo',
  'cs_live_b1r2E1vkD5s9kMy2juA2yovR687bepmaJAuIDZ3tajYSUrMxoTsm2cajrA',
  'cs_live_b1XKvH0XyIjdw9djwa80fJlGYexNPt9baCiQtHSQYn8mXunNJJ7ZnsirMo',
  'cs_live_b1VcmUYpegxkD8t2aDWQG2g9xZ8tIYYBWkALh6r5zitNGu9ncviK0mY3O1',
  'cs_live_b13C8wcJdQwseCKultCSPM0cjwvIdiQS92PsP65YK2DhLwUXfTPiI0q9aJ',
  'cs_live_b1P1jqN8y6Ph38xJGpRrz82mIG5hE2eeVhgLSvlrZcJnXFwWMRtTKTOhmm',
  'cs_live_b11WGnjbELyvC2MsXG5KIgLeKYcwnLXIChei1EWaqzNSJerAd7DP2lrgy5',
  'cs_live_a1uiau1eP0f07JTljpHaYbQVzcb1XW88Y7QYSNFFf2otacOa4WGPdKZXAD',
  'cs_live_a15Pk1Qv4c3y4iZq2anaRJDc2JDBKOX6PLl0HSBjm92mXPu8Y2MmSjPXVG',
  'cs_live_a1mmFhsdfvUWzAYgMt6jgP1BA1FNcqof1cUMSWOuNug2vymvQJyth8eH56',
  'cs_live_a1vT4N1orE9rRQ5v3m8HnZWgtZBau1wrhTTdN8cFH1pAOlILLOCj5T20JB',
  'cs_live_a1I9G4aKJUEdr8GOlzzh2pES1HULZyKGoYXEWzwFBWHw43uk5DgudHDn7M',
  'cs_live_a1c5n3sCs3x06gWpH9xR4Kv6Ld30tEFkmyG2rL48tLaIta2YsP0akvvqfs',
  'cs_live_a1vG1oIvdDcm2OK3dmRmFv6hjmcFzL25UtR5FdDVCJsanLHNQhjE8YQl2Z',
  'cs_live_a1StunJhtFpWeja3BCqDhhsReUe7ZtfjxMlSkIb1XPc0MpcHa7LJf9VLxB',
  'cs_live_a15fXC01uaUGYWELvdprxPbWs6GFaczzqXrDGZrHzEAok49sdbWNJlOANq',
  'cs_live_a19ffKxzLa9pMEaKyU3DCu8h8d1kq2THPHSB3t0hubHmzidAmIKQON1X1O',
  'cs_live_a1fiX05GxMyGgW0wC5UFMzG8XizPiejAKS17xYZVlOy6VCeIWi7oC2cKAg',
  'cs_live_b1qOcrkqE0HQpWfeILAeU90KHljlPgrM1V42FksSLv4fvms6meqMZxt374',
  'cs_live_b1Dt3MD8JedgBXsk9CY801YttZXOPzYFGHUm9NPHxwRlhLcnhsd01Juuc5',
  'cs_live_b1FwelhbSSjxRgOIJU79eRdhbwb0c3ADg5tSdQAIkA7sH0yTGMZxJGoXBE',
  'cs_live_b1r5Xh6byj5FooPt40AwVv2mM5myhMjWP3EDBIesyLRoXhaLAIuSAlJpiM',
]);

const toIsoDate = (timestamp?: number | null) => new Date((timestamp || 0) * 1000).toISOString();

const paymentInterval = (interval?: string | null, intervalCount?: number | null) =>
  interval === 'month' && intervalCount === 3 ? 'quarterly' : 'monthly';

const paymentFromCheckout = (session: Stripe.Checkout.Session) => ({
  id: `stripe-checkout-${session.id}`,
  auth_id: null,
  tier: session.metadata?.tier || 'subscription',
  interval: session.metadata?.interval || 'monthly',
  amount: fromStripeAmount(session.amount_total, session.currency || 'usd'),
  currency: (session.currency || 'usd').toUpperCase(),
  payment_method: 'stripe',
  transaction_id: session.id,
  sender_phone: 'Stripe Checkout',
  status: 'approved',
  admin_notes: 'Stripe Checkout payment',
  created_at: toIsoDate(session.created),
  updated_at: toIsoDate(session.created),
  user: {
    full_name: session.customer_details?.name || 'Stripe customer',
    email: session.customer_details?.email || session.customer_email || '',
  },
});

const paymentFromInvoice = (invoice: Stripe.Invoice) => {
  const line = invoice.lines.data[0];
  const recurring = line?.price?.recurring;

  return {
    id: `stripe-invoice-${invoice.id}`,
    auth_id: null,
    tier: invoice.subscription_details?.metadata?.tier || 'subscription',
    interval: paymentInterval(recurring?.interval, recurring?.interval_count),
    amount: fromStripeAmount(invoice.amount_paid, invoice.currency || 'usd'),
    currency: (invoice.currency || 'usd').toUpperCase(),
    payment_method: 'stripe',
    transaction_id: invoice.id,
    sender_phone: 'Stripe Invoice',
    status: 'approved',
    admin_notes: 'Stripe subscription renewal',
    created_at: toIsoDate(invoice.created),
    updated_at: toIsoDate(invoice.created),
    user: {
      full_name: invoice.customer_name || 'Stripe customer',
      email: invoice.customer_email || '',
    },
  };
};

Deno.serve(async (req: Request) => {
  const corsHeaders = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
    console.error('[admin-payment-history] Required payment configuration is missing');
    return new Response(JSON.stringify({ error: 'Payment history is not configured' }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const [checkoutSessions, paidInvoices, institutionHistory] = await Promise.all([
      stripe.checkout.sessions.list({ limit: 100 }),
      stripe.invoices.list({ limit: 100, status: 'paid' }),
      supabase
        .from('billing_history')
        .select('*, institution:institutions(name)')
        .not('institution_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    const visibleCheckoutSessions = checkoutSessions.data.filter((session) =>
      isVisibleIeltsCheckout(session, LEGACY_TEST_CHECKOUT_SESSION_IDS)
    );
    const visibleSubscriptionIds = new Set(
      visibleCheckoutSessions.map((session) => stripeObjectId(session.subscription)).filter(Boolean)
    );

    if (institutionHistory.error) throw institutionHistory.error;
    const payments = [
      ...(institutionHistory.data || []).map((row) => ({
        ...row,
        interval: row.billing_interval,
        sender_phone: 'Institution Stripe payment',
        admin_notes: 'Institution prepaid seats',
        user: { full_name: row.institution?.name || 'Institution', email: '' },
      })),
      ...visibleCheckoutSessions.map(paymentFromCheckout),
      ...paidInvoices.data
        // Initial subscription invoices correspond to a Checkout Session above.
        .filter(
          (invoice) =>
            invoice.billing_reason !== 'subscription_create' &&
            Number(invoice.amount_paid) > 0 &&
            visibleSubscriptionIds.has(stripeObjectId(invoice.subscription) || '')
        )
        .map(paymentFromInvoice),
    ];

    return new Response(JSON.stringify({ payments }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('[admin-payment-history] Failed to list Stripe payments:', error);
    return new Response(JSON.stringify({ error: 'Unable to load Stripe payment history' }), {
      status: 502,
      headers: corsHeaders,
    });
  }
});
