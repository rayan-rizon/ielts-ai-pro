import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const admin = createClient(supabaseUrl, serviceKey);
const PIXEL = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='),
  (character) => character.charCodeAt(0)
);

const pixelResponse = () =>
  new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, max-age=0',
      'Content-Length': String(PIXEL.length),
    },
  });

serve(async (req) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const url = new URL(req.url);
  const deliveryId = url.searchParams.get('delivery_id');
  const token = url.searchParams.get('token');
  const eventType = url.searchParams.get('event') === 'click' ? 'clicked' : 'viewed';

  if (!deliveryId || !token)
    return eventType === 'viewed' ? pixelResponse() : new Response('Invalid link', { status: 400 });
  const { data: delivery } = await admin
    .from('marketing_deliveries')
    .select('id,campaign_id,user_id,channel,tracking_token')
    .eq('id', deliveryId)
    .eq('tracking_token', token)
    .maybeSingle();
  if (!delivery)
    return eventType === 'viewed' ? pixelResponse() : new Response('Invalid link', { status: 404 });

  await admin.from('marketing_events').upsert(
    {
      campaign_id: delivery.campaign_id,
      delivery_id: delivery.id,
      user_id: delivery.user_id,
      event_type: eventType,
      channel: delivery.channel,
      dedupe_key: `${delivery.id}:${eventType}`,
      metadata: { source: 'email_tracking_link' },
    },
    { onConflict: 'dedupe_key', ignoreDuplicates: true }
  );

  if (eventType === 'viewed') return pixelResponse();
  const target = url.searchParams.get('target');
  try {
    const destination = new URL(target || 'https://www.ieltsai.pro/pricing');
    if (destination.protocol !== 'https:' || !/(^|\.)ieltsai\.pro$/i.test(destination.hostname)) {
      throw new Error('Untrusted destination');
    }
    return Response.redirect(destination.toString(), 302);
  } catch {
    return Response.redirect('https://www.ieltsai.pro/pricing', 302);
  }
});
