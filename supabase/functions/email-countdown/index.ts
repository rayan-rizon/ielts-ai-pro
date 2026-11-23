import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { renderCountdownGif } from '../_shared/countdownGif.ts';

const admin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// A live countdown for an offer email. The email embeds this URL as an image; the
// mail client fetches it when the message is opened, so the clock starts at the time
// that is really left, not the time the email was sent. The expiry in the URL is
// only a timestamp: it grants nothing and carries no learner data.
const DAY = 86_400;
const MAX_AHEAD = 30 * DAY;

const headers = {
  'Content-Type': 'image/gif',
  // Never cache: a cached image would freeze the clock at an earlier time.
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'Access-Control-Allow-Origin': '*',
};

// When the image carries a delivery and its token, loading it is what opens the offer:
// the first load gives the learner's live code 24 hours from that moment. If that is
// not possible the deadline in the URL (the code's deadline when sent) is used.
async function deadlineFor(params: URLSearchParams, fallback: number): Promise<number> {
  const deliveryId = params.get('d');
  const token = params.get('t');
  if (!deliveryId || !token) return fallback;
  const { data, error } = await admin.rpc('start_offer_countdown', {
    p_delivery_id: deliveryId,
    p_token: token,
  });
  if (error || !data) return fallback;
  return Math.floor(Date.parse(data) / 1000);
}

serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }
  const params = new URL(req.url).searchParams;
  const now = Math.floor(Date.now() / 1000);
  const sent = Number(params.get('e'));
  if (!Number.isInteger(sent) || sent < now - 7 * DAY || sent > now + MAX_AHEAD) {
    return new Response('Invalid countdown', { status: 400 });
  }
  // A preflight HEAD must not start the clock; only a real image load does.
  const expiry = req.method === 'GET' ? await deadlineFor(params, sent) : sent;
  const gif = renderCountdownGif(expiry - now);
  return new Response(req.method === 'HEAD' ? null : gif, {
    headers: { ...headers, 'Content-Length': String(gif.length) },
  });
});
