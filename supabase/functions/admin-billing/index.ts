/**
 * Admin billing actions that move money or end access.
 *
 * - stripe_refund: refunds a Stripe payment through the Stripe API and records
 *   it in public.payment_refunds. The ledger row is opened first, so Stripe's
 *   idempotency key and the charge.refunded webhook both resolve to that row.
 * - end_access: cancels any Stripe subscription, then downgrades the account
 *   now. Cancelling first matters: otherwise the next invoice.paid re-grants
 *   the plan.
 *
 * bKash/Nagad refunds are sent from the merchant wallet today and recorded
 * with the admin_record_manual_refund RPC. When their refund APIs are wired
 * in, they become another branch next to stripe_refund.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14.14.0';
import { getCorsHeaders, handleCorsPrelight, validateCsrfProtection } from '../_shared/security.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const REFUND_REASONS = new Set([
  'unused_purchase',
  'duplicate_charge',
  'service_failure',
  'unauthorized',
  'legal_requirement',
  'goodwill',
  'other',
]);

// Stripe amounts are in the currency's minor unit, except for these.
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
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Json = Record<string, unknown>;

const stripeId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return typeof (value as { id?: unknown }).id === 'string' ? (value as { id: string }).id : null;
};

const toMinorUnits = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100);

const fromMinorUnits = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? amount : amount / 100;

const refundStatus = (status: string | null | undefined) => {
  if (status === 'succeeded') return 'succeeded';
  if (status === 'failed') return 'failed';
  if (status === 'canceled') return 'canceled';
  return 'pending';
};

const stripeRefundReason = (reason: string): Stripe.RefundCreateParams.Reason => {
  if (reason === 'duplicate_charge') return 'duplicate';
  if (reason === 'unauthorized') return 'fraudulent';
  return 'requested_by_customer';
};

/** The Stripe object a stored transaction id can be refunded through. */
async function resolveRefundTarget(
  transactionId: string
): Promise<{ payment_intent?: string; charge?: string } | null> {
  const fromInvoice = async (invoice: Stripe.Invoice) => {
    const paymentIntent = stripeId(invoice.payment_intent);
    if (paymentIntent) return { payment_intent: paymentIntent };
    const charge = stripeId(invoice.charge);
    return charge ? { charge } : null;
  };

  if (transactionId.startsWith('cs_')) {
    const session = await stripe.checkout.sessions.retrieve(transactionId);
    const paymentIntent = stripeId(session.payment_intent);
    if (paymentIntent) return { payment_intent: paymentIntent };
    const invoiceId = stripeId(session.invoice);
    return invoiceId ? fromInvoice(await stripe.invoices.retrieve(invoiceId)) : null;
  }
  if (transactionId.startsWith('in_')) {
    return fromInvoice(await stripe.invoices.retrieve(transactionId));
  }
  if (transactionId.startsWith('pi_')) return { payment_intent: transactionId };
  if (transactionId.startsWith('ch_')) return { charge: transactionId };
  return null;
}

async function cancelStripeSubscription(subscriptionId: string | null) {
  if (!subscriptionId) return { cancelled: false, reason: 'no_subscription' };
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      return { cancelled: false, reason: 'already_cancelled' };
    }
    await stripe.subscriptions.cancel(subscriptionId);
    return { cancelled: true };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'resource_missing') return { cancelled: false, reason: 'not_found' };
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };
  const respond = (status: number, body: Json) =>
    new Response(JSON.stringify(body), { status, headers });

  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });

  const csrf = validateCsrfProtection(req);
  if (!csrf.valid) return respond(403, { error: csrf.error || 'Invalid request' });

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error('[admin-billing] Supabase configuration is missing');
    return respond(503, { error: 'Billing actions are not configured' });
  }

  const authorization = req.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/i.test(authorization)) {
    return respond(401, { error: 'Authentication required' });
  }

  // is_admin() also enforces the admin MFA requirement, so ask the database
  // as the caller rather than reading users.role with the service key.
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: isAdmin, error: adminError } = await caller.rpc('is_admin');
  if (adminError || isAdmin !== true) {
    return respond(403, { error: 'Admin access required' });
  }
  const {
    data: { user: authUser },
  } = await caller.auth.getUser();

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: adminProfile } = await admin
    .from('users')
    .select('id')
    .eq('auth_id', authUser?.id || '')
    .maybeSingle();

  let body: Json;
  try {
    body = await req.json();
  } catch {
    return respond(400, { error: 'Invalid JSON body' });
  }

  const endAccess = async (userId: string, refundId: string | null) => {
    const { data: account, error } = await admin
      .from('users')
      .select('id, stripe_subscription_id')
      .eq('id', userId)
      .maybeSingle();
    if (error || !account) throw new Error('Account not found');

    let stripeResult: { cancelled: boolean; reason?: string } = {
      cancelled: false,
      reason: 'no_subscription',
    };
    if (account.stripe_subscription_id) {
      if (!stripeSecretKey) {
        throw new Error('Stripe is not configured, so the subscription cannot be cancelled');
      }
      stripeResult = await cancelStripeSubscription(account.stripe_subscription_id);
    }

    const { data, error: endError } = await admin.rpc('service_end_paid_access', {
      p_user_id: userId,
      p_refund_id: refundId,
    });
    if (endError) throw endError;
    return { ...(data as Json), stripeSubscription: stripeResult };
  };

  try {
    if (body.action === 'end_access') {
      const userId = String(body.userId || '');
      const refundId = body.refundId ? String(body.refundId) : null;
      if (!UUID.test(userId) || (refundId && !UUID.test(refundId))) {
        return respond(400, { error: 'A valid account is required' });
      }
      const result = await endAccess(userId, refundId);
      console.log(`[admin-billing] Access ended for ${userId} by ${adminProfile?.id}`);
      return respond(200, { access: result });
    }

    if (body.action !== 'stripe_refund') {
      return respond(400, { error: 'Unknown action' });
    }

    if (!stripeSecretKey) return respond(503, { error: 'Stripe is not configured' });

    const paymentRequestId = String(body.paymentRequestId || '');
    const reason = String(body.reason || '');
    const amount = Number(body.amount);
    const note = typeof body.note === 'string' ? body.note.slice(0, 1000) : null;
    if (!UUID.test(paymentRequestId)) return respond(400, { error: 'Choose a payment to refund' });
    if (!REFUND_REASONS.has(reason)) return respond(400, { error: 'Choose a refund reason' });
    if (!Number.isFinite(amount) || amount <= 0) {
      return respond(400, { error: 'Enter a refund amount' });
    }

    const { data: payment, error: paymentError } = await admin
      .from('payment_requests')
      .select('id, auth_id, payment_method, transaction_id, currency, status')
      .eq('id', paymentRequestId)
      .maybeSingle();
    if (paymentError || !payment) return respond(404, { error: 'Payment not found' });
    if (String(payment.payment_method).toLowerCase() !== 'stripe') {
      return respond(400, {
        error: 'This payment was not made through Stripe. Record the manual refund instead.',
      });
    }

    const target = await resolveRefundTarget(String(payment.transaction_id || ''));
    if (!target) {
      return respond(422, { error: 'Stripe has no charge for this payment that can be refunded' });
    }

    // Opens the ledger row (status pending) and re-checks the refundable
    // amount under a row lock, so a double click cannot refund twice.
    const { data: opened, error: openError } = await admin.rpc('service_open_provider_refund', {
      p_payment_request_id: paymentRequestId,
      p_amount: amount,
      p_reason: reason,
      p_note: note,
      p_initiated_by: adminProfile?.id || null,
    });
    if (openError) return respond(400, { error: openError.message });
    const refundRow = opened as { id: string; user_id: string | null; currency: string };
    const currency = String(refundRow.currency || payment.currency || 'USD').toUpperCase();

    let refund: Stripe.Refund;
    try {
      refund = await stripe.refunds.create(
        {
          ...target,
          amount: toMinorUnits(amount, currency),
          reason: stripeRefundReason(reason),
          metadata: {
            refund_id: refundRow.id,
            payment_request_id: paymentRequestId,
            source: 'ielts-ai-pro-admin',
          },
        },
        { idempotencyKey: `admin-refund:${refundRow.id}` }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stripe refused the refund';
      await admin.rpc('service_record_provider_refund', {
        p_provider: 'stripe',
        p_kind: 'refund',
        p_provider_refund_ref: null,
        p_status: 'failed',
        p_amount: amount,
        p_currency: currency,
        p_app_refund_id: refundRow.id,
        p_failure_reason: message.slice(0, 500),
      });
      console.error('[admin-billing] Stripe refund failed:', message);
      return respond(502, { error: `Stripe refused the refund: ${message}` });
    }

    const { error: recordError } = await admin.rpc('service_record_provider_refund', {
      p_provider: 'stripe',
      p_kind: 'refund',
      p_provider_refund_ref: refund.id,
      p_status: refundStatus(refund.status),
      p_amount: fromMinorUnits(refund.amount, currency),
      p_currency: currency,
      p_payment_transaction_id: payment.transaction_id,
      p_app_refund_id: refundRow.id,
      p_failure_reason: refund.failure_reason || null,
    });
    // Stripe has the money moving; the charge.refunded webhook will retry the
    // ledger update, so report success with a warning rather than an error.
    if (recordError) console.error('[admin-billing] Ledger update failed:', recordError.message);

    let access: Json | null = null;
    let accessError: string | null = null;
    if (body.endAccess === true && refundRow.user_id) {
      try {
        access = await endAccess(refundRow.user_id, refundRow.id);
      } catch (error) {
        accessError = error instanceof Error ? error.message : 'Access could not be ended';
        console.error('[admin-billing] End access failed after refund:', accessError);
      }
    }

    console.log(
      `[admin-billing] Stripe refund ${refund.id} (${refund.status}) for payment ${paymentRequestId} by ${adminProfile?.id}`
    );
    return respond(200, {
      refund: { id: refundRow.id, stripeRefundId: refund.id, status: refundStatus(refund.status) },
      access,
      accessError,
      ledgerWarning: recordError ? 'The ledger will update when Stripe confirms the refund.' : null,
    });
  } catch (error) {
    console.error('[admin-billing] Action failed:', error);
    return respond(500, {
      error: error instanceof Error ? error.message : 'Billing action failed',
    });
  }
});
