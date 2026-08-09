import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * One-click marketing unsubscribe.
 *
 * Authenticated by the delivery's own `tracking_token`, so it works straight
 * from the email with no sign-in. That matters: the previous footer link went
 * to `/settings?tab=preferences`, which is not a real Settings tab — the page
 * silently fell back to Profile, so opting out was impossible from the message.
 *
 * Two entry points, both required:
 *
 *  - GET  — a learner clicking the footer link. Applies the opt-out, then
 *           redirects to the app's confirmation page.
 *  - POST — RFC 8058 one-click, triggered by the mail client's own
 *           "Unsubscribe" button via the List-Unsubscribe-Post header. Gmail
 *           and Yahoo require this of bulk senders; without it they degrade
 *           deliverability and surface "report spam" instead. Returns a bare
 *           200 — the client renders nothing.
 *
 * The GET redirects rather than rendering its own HTML because Supabase serves
 * function-returned HTML as `text/plain` under a `sandbox` CSP (anti-phishing
 * on the *.supabase.co domain), so an inline page would show the learner raw
 * markup. The confirmation lives in the app, which is better anyway — it is
 * branded and the resubscribe control is a real interaction.
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const admin = createClient(supabaseUrl, serviceKey);

const SITE = 'https://www.ieltsai.pro';
const CONFIRM_PATH = '/email/unsubscribed';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Send the learner to the app's confirmation page. The delivery id and token
 * ride along so the page can offer a working "undo" without a login.
 */
const confirm = (state: string, deliveryId?: string, token?: string) => {
  const target = new URL(`${SITE}${CONFIRM_PATH}`);
  target.searchParams.set('state', state);
  if (deliveryId && token) {
    target.searchParams.set('delivery_id', deliveryId);
    target.searchParams.set('token', token);
  }
  return Response.redirect(target.toString(), 302);
};

serve(async (req) => {
  const url = new URL(req.url);
  const deliveryId = url.searchParams.get('delivery_id') || '';
  const token = url.searchParams.get('token') || '';
  const resubscribe = url.searchParams.get('resubscribe') === '1';
  // RFC 8058 requires the POST to be accepted without any interaction. Mail
  // clients send it unauthenticated, so the token in the URL is the only proof
  // of identity — and the only thing we act on.
  const oneClick = req.method === 'POST';

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!UUID.test(deliveryId) || !UUID.test(token)) {
    return oneClick ? new Response('Invalid link', { status: 400 }) : confirm('invalid');
  }

  if (resubscribe && !oneClick) {
    const { data: delivery } = await admin
      .from('marketing_deliveries')
      .select('user_id')
      .eq('id', deliveryId)
      .eq('tracking_token', token)
      .maybeSingle();
    if (!delivery) return confirm('invalid');

    await admin
      .from('users')
      .update({ marketing_email_unsubscribed_at: null })
      .eq('id', delivery.user_id);
    return confirm('resubscribed');
  }

  const { data, error } = await admin.rpc('unsubscribe_marketing_email', {
    p_delivery_id: deliveryId,
    p_token: token,
  });

  if (error || !data?.ok) {
    console.error('[unsubscribe] failed', error || data);
    return oneClick ? new Response('Invalid link', { status: 400 }) : confirm('invalid');
  }

  if (oneClick) return new Response('OK', { status: 200 });
  return confirm(data.already ? 'already' : 'done', deliveryId, token);
});
