/**
 * Ask Nagad what happened to one order and record it.
 *
 * Shared by nagad-callback (the learner's browser coming back), the result
 * page's status poll and the reconcile job. Whichever gets there first wins;
 * service_finalize_nagad_payment locks the order row so a payment is granted
 * once.
 */

import { classifyNagadStatus, NagadError, verifyPayment, type NagadConfig } from './nagad.ts';

export interface NagadOrderRow {
  order_id: string;
  auth_id: string | null;
  tier: string;
  billing_interval: string;
  amount: number;
  status: string;
  payment_ref_id: string | null;
  issuer_payment_ref: string | null;
  last_checked_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export const NAGAD_ORDER_COLUMNS =
  'order_id, auth_id, tier, billing_interval, amount, status, payment_ref_id, issuer_payment_ref, last_checked_at, paid_at, created_at';

export const OPEN_STATUSES = new Set(['initiated', 'pending']);

/** Orders still unpaid after this long are closed by the reconcile job. */
export const EXPIRE_AFTER_MS = 2 * 60 * 60 * 1000;

export interface SyncResult {
  status: string;
  nagadStatus: string | null;
}

/**
 * Verify with Nagad and persist the outcome. Returns the stored status.
 * Throws NagadError when Nagad cannot be reached; the order stays open.
 */
export async function syncNagadOrder(
  serviceClient: any,
  config: NagadConfig,
  order: NagadOrderRow
): Promise<SyncResult> {
  if (!OPEN_STATUSES.has(order.status) || !order.payment_ref_id) {
    return { status: order.status, nagadStatus: null };
  }

  const verified = await verifyPayment(config, order.payment_ref_id);
  if (verified.merchantId && verified.merchantId !== config.merchantId) {
    throw new NagadError('Verify response belongs to a different merchant');
  }

  const outcome = classifyNagadStatus(verified.status);
  const { data, error } = await serviceClient.rpc('service_finalize_nagad_payment', {
    p_order_id: order.order_id,
    p_payment_ref_id: order.payment_ref_id,
    p_outcome: outcome,
    p_nagad_status: verified.status,
    p_status_code: verified.statusCode,
    p_verified_order_id: verified.orderId,
    p_verified_amount: verified.amount,
    p_issuer_payment_ref: verified.issuerPaymentRefNo,
    p_payer_mobile: verified.clientMobileNo,
  });
  if (error) throw new Error(`Could not record Nagad outcome: ${error.message}`);

  const status = String(data?.status || order.status);
  if (status === 'review') {
    console.error(
      `[Nagad] Order ${order.order_id} needs review: ${data?.reason || 'unknown reason'}`
    );
  }
  return { status, nagadStatus: verified.status };
}
