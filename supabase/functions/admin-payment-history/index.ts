import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14.14.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const toIsoDate = (timestamp?: number | null) => new Date((timestamp || 0) * 1000).toISOString();

const paymentInterval = (interval?: string | null, intervalCount?: number | null) =>
  interval === 'month' && intervalCount === 3 ? 'quarterly' : 'monthly';

const paymentFromCheckout = (session: Stripe.Checkout.Session) => ({
  id: `stripe-checkout-${session.id}`,
  auth_id: null,
  tier: session.metadata?.tier || 'subscription',
  interval: session.metadata?.interval || 'monthly',
  amount: (session.amount_total || 0) / 100,
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
    amount: (invoice.amount_paid || 0) / 100,
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
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

    const [checkoutSessions, paidInvoices] = await Promise.all([
      stripe.checkout.sessions.list({ limit: 100 }),
      stripe.invoices.list({ limit: 100, status: 'paid' }),
    ]);

    const payments = [
      ...checkoutSessions.data
        .filter((session) => session.payment_status === 'paid')
        .map(paymentFromCheckout),
      ...paidInvoices.data
        // Initial subscription invoices correspond to a Checkout Session above.
        .filter((invoice) => invoice.billing_reason !== 'subscription_create')
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
