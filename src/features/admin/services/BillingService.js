import { supabase } from '@/lib/supabase';
import { getCsrfHeaders } from '@/lib/csrf';
import { readAdminRpc } from './adminReadRpc';

/**
 * Refund evidence and refund actions for the admin panel.
 *
 * Reads come from SECURITY DEFINER RPCs that check is_admin(). Money-moving
 * Stripe actions go through the admin-billing edge function; bKash/Nagad
 * refunds (sent from the merchant wallet) are recorded with an RPC.
 */

export const REFUND_REASONS = [
  { value: 'unused_purchase', label: 'Unused first purchase (7-day policy)' },
  { value: 'duplicate_charge', label: 'Duplicate or incorrect charge' },
  { value: 'service_failure', label: 'Paid service failed' },
  { value: 'unauthorized', label: 'Unauthorized payment' },
  { value: 'legal_requirement', label: 'Required by law' },
  { value: 'goodwill', label: 'Goodwill' },
  { value: 'other', label: 'Other' },
];

/** Payment methods whose refunds go through a provider API from the panel. */
export const API_REFUND_PROVIDERS = new Set(['stripe']);

async function edgeFunctionError(error, fallback) {
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return new Error(body.error);
  } catch {
    // The response had no JSON body; fall through to the generic message.
  }
  return new Error(error?.message || fallback);
}

async function invokeAdminBilling(body) {
  const { data, error } = await supabase.functions.invoke('admin-billing', {
    body,
    headers: getCsrfHeaders(),
  });
  if (error) throw await edgeFunctionError(error, 'Billing action failed');
  return data;
}

export const BillingService = {
  getCustomerProfile(userId) {
    return readAdminRpc(supabase, 'get_admin_customer_billing_profile', { p_user_id: userId });
  },

  getRefundLedger(limit = 100) {
    return readAdminRpc(supabase, 'get_admin_refund_ledger', { p_limit: limit });
  },

  async recordManualRefund({ paymentRequestId, amount, reason, providerRefundRef, note }) {
    const { data, error } = await supabase.rpc('admin_record_manual_refund', {
      p_payment_request_id: paymentRequestId,
      p_amount: amount,
      p_reason: reason,
      p_provider_refund_ref: providerRefundRef,
      p_note: note || null,
    });
    if (error) throw new Error(error.message || 'Refund could not be recorded');
    return data;
  },

  refundStripePayment({ paymentRequestId, amount, reason, note, endAccess }) {
    return invokeAdminBilling({
      action: 'stripe_refund',
      paymentRequestId,
      amount,
      reason,
      note: note || null,
      endAccess: Boolean(endAccess),
    });
  },

  endPaidAccess({ userId, refundId = null }) {
    return invokeAdminBilling({ action: 'end_access', userId, refundId });
  },
};
