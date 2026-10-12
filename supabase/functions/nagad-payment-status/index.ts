/**
 * The result page's view of one of the learner's own Nagad orders (admins
 * may check any order, to re-verify it from the payments panel).
 *
 * While the order is open it re-verifies with Nagad (at most every few
 * seconds per order), so a learner whose callback was lost still gets their
 * access as soon as they look.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  checkRateLimit,
  errorResponse,
  getCorsHeaders,
  getRateLimitIdentifier,
  handleCorsPrelight,
  rateLimitedResponse,
  successResponse,
} from '../_shared/security.ts';
import { isValidOrderId, loadNagadConfig } from '../_shared/nagad.ts';
import { NAGAD_ORDER_COLUMNS, OPEN_STATUSES, syncNagadOrder } from '../_shared/nagadOrders.ts';

const serviceClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const MIN_RECHECK_MS = 4000;

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405, cors);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return errorResponse('Missing authorization header', 401, cors);
  const {
    data: { user },
    error: authError,
  } = await serviceClient.auth.getUser(token);
  if (authError || !user) return errorResponse('Unauthorized', 401, cors);

  const rate = checkRateLimit(`nagad-status:${getRateLimitIdentifier(req, user.id)}`, {
    maxRequests: 40,
    windowMs: 60000,
  });
  if (!rate.allowed) return rateLimitedResponse(rate.resetIn, cors);

  let orderId: unknown;
  try {
    orderId = (await req.json())?.order_id;
  } catch {
    return errorResponse('Invalid request body', 400, cors);
  }
  if (!isValidOrderId(orderId)) return errorResponse('Invalid order', 400, cors);

  const [{ data: order }, { data: profile }] = await Promise.all([
    serviceClient
      .from('nagad_payments')
      .select(
        `${NAGAD_ORDER_COLUMNS}, environment, nagad_status, nagad_status_code, failure_reason`
      )
      .eq('order_id', orderId)
      .maybeSingle(),
    serviceClient.from('users').select('role').eq('auth_id', user.id).maybeSingle(),
  ]);
  // Someone else's order is indistinguishable from no order.
  if (!order || (order.auth_id !== user.id && profile?.role !== 'admin')) {
    return errorResponse('Order not found', 404, cors);
  }

  let current = order;
  const lastChecked = order.last_checked_at ? Date.parse(order.last_checked_at) : 0;
  const config = loadNagadConfig();
  if (config && OPEN_STATUSES.has(order.status) && Date.now() - lastChecked >= MIN_RECHECK_MS) {
    try {
      const synced = await syncNagadOrder(serviceClient, config, order);
      if (synced.status !== order.status) {
        const { data: fresh } = await serviceClient
          .from('nagad_payments')
          .select(
            `${NAGAD_ORDER_COLUMNS}, environment, nagad_status, nagad_status_code, failure_reason`
          )
          .eq('order_id', order.order_id)
          .maybeSingle();
        current = fresh || { ...order, status: synced.status };
      }
    } catch (error) {
      console.error(`[NagadStatus] Could not verify order ${order.order_id}:`, error);
    }
  }
  const status = current.status;

  return successResponse(
    {
      order_id: order.order_id,
      status,
      tier: order.tier,
      interval: order.billing_interval,
      amount: Number(order.amount),
      currency: 'BDT',
      test_mode: order.environment === 'sandbox',
      // What Nagad said, so the page can explain a failure. A review reason is
      // only its code (amount_mismatch, ...); the detail stays with admins.
      nagad_status: status === 'paid' ? null : current.nagad_status || null,
      nagad_status_code: status === 'paid' ? null : current.nagad_status_code || null,
      review_reason: status === 'review' ? reviewCode(current.failure_reason) : null,
    },
    cors
  );
});

function reviewCode(reason: string | null): string {
  const code = String(reason || '')
    .split(':')[0]
    .trim();
  return /^[a-z_]{3,40}$/.test(code) ? code : 'unmatched';
}
