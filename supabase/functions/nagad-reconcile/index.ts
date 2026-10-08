/**
 * Backstop for Nagad payments nobody came back for.
 *
 * Nagad has no server-to-server webhook; it only redirects the browser. If the
 * learner pays and closes the tab, nothing would ever verify the order. pg_cron
 * calls this every 10 minutes (see the nagad_online_payments migration) with
 * the nagad_reconcile_secret Vault secret.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadNagadConfig } from '../_shared/nagad.ts';
import { EXPIRE_AFTER_MS, NAGAD_ORDER_COLUMNS, syncNagadOrder } from '../_shared/nagadOrders.ts';

const serviceClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const BATCH = 25;
// Fresh orders are left to the learner's own redirect for a couple of minutes.
const MIN_AGE_MS = 2 * 60 * 1000;
// Nagad keeps a reference verifiable for a while; past this we stop asking.
const GIVE_UP_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req: Request) => {
  const secret = Deno.env.get('NAGAD_RECONCILE_SECRET');
  const presented = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (req.method !== 'POST' || !secret || !constantTimeEqual(presented, secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const config = loadNagadConfig();
  if (!config) return Response.json({ error: 'Nagad is not configured' }, { status: 503 });

  const now = Date.now();
  const { data: orders, error } = await serviceClient
    .from('nagad_payments')
    .select(NAGAD_ORDER_COLUMNS)
    .in('status', ['initiated', 'pending'])
    .lt('created_at', new Date(now - MIN_AGE_MS).toISOString())
    .gt('created_at', new Date(now - GIVE_UP_AFTER_MS).toISOString())
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(BATCH);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const summary = { checked: 0, paid: 0, failed: 0, expired: 0, review: 0, errors: 0 };
  for (const order of orders || []) {
    summary.checked += 1;
    try {
      // Never reached Nagad: nothing to verify, nothing could have been paid.
      if (!order.payment_ref_id) {
        await expire(order.order_id, 'never reached Nagad');
        summary.expired += 1;
        continue;
      }
      const { status } = await syncNagadOrder(serviceClient, config, order);
      if (status === 'paid') summary.paid += 1;
      else if (status === 'failed') summary.failed += 1;
      else if (status === 'review') summary.review += 1;
      else if (now - Date.parse(order.created_at) > EXPIRE_AFTER_MS) {
        await expire(order.order_id, 'not completed in time');
        summary.expired += 1;
      }
    } catch (err) {
      summary.errors += 1;
      console.error(`[NagadReconcile] Order ${order.order_id}:`, err);
    }
  }

  console.log('[NagadReconcile]', JSON.stringify(summary));
  return Response.json(summary);
});

async function expire(orderId: string, reason: string) {
  await serviceClient
    .from('nagad_payments')
    .update({
      status: 'expired',
      failure_reason: reason,
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .in('status', ['initiated', 'pending']);
  await serviceClient
    .from('marketing_checkout_intents')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('provider', 'nagad')
    .eq('external_session_id', orderId)
    .eq('status', 'initiated');
}
