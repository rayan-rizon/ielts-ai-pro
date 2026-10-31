import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { Webhook } from 'https://esm.sh/svix@1.76.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET') || '';
const admin = createClient(supabaseUrl, serviceKey);

const eventMap: Record<string, 'delivered' | 'viewed' | 'clicked' | 'failed'> = {
  'email.delivered': 'delivered',
  'email.opened': 'viewed',
  'email.clicked': 'clicked',
  'email.bounced': 'failed',
  'email.complained': 'failed',
  'email.failed': 'failed',
  'email.suppressed': 'failed',
};

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!webhookSecret) return new Response('Webhook is not configured', { status: 503 });
  const payload = await req.text();
  const svixId = req.headers.get('svix-id') || '';
  try {
    let event: Record<string, any>;
    try {
      event = new Webhook(webhookSecret).verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': req.headers.get('svix-timestamp') || '',
        'svix-signature': req.headers.get('svix-signature') || '',
      }) as Record<string, any>;
    } catch (error) {
      console.warn('[resend-marketing-webhook] Rejected invalid signature:', error);
      return new Response('Invalid webhook signature', { status: 400 });
    }

    const eventType = eventMap[event.type];
    if (!eventType) return new Response('ok');
    const providerMessageId = event.data?.email_id || event.data?.id;
    if (!providerMessageId) return new Response('ok');

    const { data: delivery } = await admin
      .from('marketing_deliveries')
      .select('id,campaign_id,user_id,channel')
      .eq('provider_message_id', providerMessageId)
      .maybeSingle();
    if (!delivery) return new Response('ok');

    const { error: insertError } = await admin.from('marketing_events').insert({
      campaign_id: delivery.campaign_id,
      delivery_id: delivery.id,
      user_id: delivery.user_id,
      event_type: eventType,
      channel: 'email',
      dedupe_key: `resend:${svixId}`,
      metadata: {
        provider_message_id: providerMessageId,
        provider_event: event.type,
        click_url: event.data?.click?.link || null,
      },
    });
    if (insertError && insertError.code !== '23505') {
      console.error('[resend-marketing-webhook] Could not store event:', insertError);
      return new Response('Could not store event', { status: 500 });
    }

    const deliveryUpdate =
      eventType === 'failed'
        ? { status: 'failed', failure_reason: event.type }
        : { status: eventType };
    const { error: updateError } = await admin
      .from('marketing_deliveries')
      .update(deliveryUpdate)
      .eq('id', delivery.id);
    if (updateError) {
      console.error('[resend-marketing-webhook] Could not update delivery:', updateError);
      return new Response('Could not update delivery', { status: 500 });
    }
    return new Response('ok');
  } catch (error) {
    console.error('[resend-marketing-webhook] Failed to process event:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
});
