/**
 * Where Nagad sends the learner's browser after the payment page.
 *
 * The query string (order_id, payment_ref_id, status, ...) is unsigned and can
 * be forged, so it is used only to find our order. The outcome comes from
 * Nagad's verify API, server to server. The learner is then redirected to the
 * result page, which shows whatever was recorded.
 *
 * Public endpoint (verify_jwt = false): a browser redirect carries no token.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getRateLimitIdentifier } from '../_shared/security.ts';
import { isValidOrderId, loadNagadConfig } from '../_shared/nagad.ts';
import { NAGAD_ORDER_COLUMNS, syncNagadOrder } from '../_shared/nagadOrders.ts';

const serviceClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Hardcoded origin, never taken from the request: no open redirect.
const FRONTEND_URL = (Deno.env.get('FRONTEND_URL') || 'https://www.ieltsai.pro').replace(/\/$/, '');

function redirectToResult(orderId: string | null, fallback?: string) {
  const target = new URL(`${FRONTEND_URL}/payment/nagad`);
  if (orderId) target.searchParams.set('order', orderId);
  if (fallback) target.searchParams.set('error', fallback);
  return new Response(null, {
    status: 303,
    headers: { Location: target.toString(), 'Cache-Control': 'no-store' },
  });
}

serve(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

  const params = new URL(req.url).searchParams;
  const orderId = params.get('order_id');
  const paymentRefId = params.get('payment_ref_id');
  if (!isValidOrderId(orderId)) return redirectToResult(null, 'invalid');

  const rate = checkRateLimit(`nagad-callback:${getRateLimitIdentifier(req)}`, {
    maxRequests: 20,
    windowMs: 60000,
  });
  if (!rate.allowed) return redirectToResult(orderId);

  const { data: order } = await serviceClient
    .from('nagad_payments')
    .select(NAGAD_ORDER_COLUMNS)
    .eq('order_id', orderId)
    .maybeSingle();
  if (!order) return redirectToResult(null, 'invalid');

  // A mismatched reference means a tampered or mixed-up redirect; show the
  // order as stored, and let the result page and reconcile job verify it.
  if (paymentRefId && paymentRefId !== order.payment_ref_id) {
    console.warn(`[NagadCallback] Reference mismatch for order ${orderId}`);
    return redirectToResult(orderId);
  }

  const config = loadNagadConfig();
  if (config) {
    try {
      const result = await syncNagadOrder(serviceClient, config, order);
      console.log(
        `[NagadCallback] Order ${orderId}: redirect said ${params.get('status')}, Nagad says ${result.nagadStatus}, recorded ${result.status}`
      );
    } catch (error) {
      // The result page retries; the reconcile job is the backstop.
      console.error(`[NagadCallback] Could not verify order ${orderId}:`, error);
    }
  }
  return redirectToResult(orderId);
});
