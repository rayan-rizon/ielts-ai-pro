/**
 * The result page's view of one of the learner's own Nagad orders.
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

  const { data: order } = await serviceClient
    .from('nagad_payments')
    .select(NAGAD_ORDER_COLUMNS)
    .eq('order_id', orderId)
    .eq('auth_id', user.id)
    .maybeSingle();
  // Someone else's order is indistinguishable from no order.
  if (!order) return errorResponse('Order not found', 404, cors);

  let status = order.status;
  const lastChecked = order.last_checked_at ? Date.parse(order.last_checked_at) : 0;
  const config = loadNagadConfig();
  if (config && OPEN_STATUSES.has(status) && Date.now() - lastChecked >= MIN_RECHECK_MS) {
    try {
      status = (await syncNagadOrder(serviceClient, config, order)).status;
    } catch (error) {
      console.error(`[NagadStatus] Could not verify order ${order.order_id}:`, error);
    }
  }

  return successResponse(
    {
      order_id: order.order_id,
      status,
      tier: order.tier,
      interval: order.billing_interval,
      amount: Number(order.amount),
      currency: 'BDT',
    },
    cors
  );
});
