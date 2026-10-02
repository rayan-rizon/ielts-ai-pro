import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@22.6.0';
import {
  getCorsHeaders,
  handleCorsPrelight,
  validateCsrfProtection,
  checkRateLimit,
} from '../_shared/security.ts';
import { quoteInstitutionSeats } from '../_shared/institutionPricing.ts';
import { getInstitutionHistory } from '../_shared/institutionHistory.ts';
import { sendEmail } from '../_shared/resend.ts';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || 'unconfigured');
const frontend = (Deno.env.get('FRONTEND_URL') || 'https://www.ieltsai.pro').replace(/\/$/, '');
const json = (value: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
export async function hashToken(token: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}
async function rpc(actor: string, action: string, data: Record<string, unknown>) {
  const { data: result, error } = await db.rpc('institution_action', {
    p_actor: actor,
    p_action: action,
    p_data: data,
  });
  if (error) throw error;
  return result;
}
async function createInvitation(actor: string, action: string, data: Record<string, unknown>) {
  const raw = crypto.randomUUID() + crypto.randomUUID();
  const result = await rpc(actor, action, { ...data, token_hash: await hashToken(raw) });
  const url = `${frontend}/institution/accept?token=${encodeURIComponent(raw)}`;
  const email = await sendEmail({
    to: result.email,
    type: 'institution_invitation',
    subject: 'Your IELTS Ai Pro institution invitation',
    html: `<p>You have been invited to IELTS Ai Pro.</p><p><a href="${esc(url)}">Accept invitation</a></p><p>Sign in using ${esc(result.email)}.</p>`,
    text: `Accept your IELTS Ai Pro institution invitation: ${url}\nSign in using ${result.email}.`,
    idempotencyKey: `institution-invite:${result.id}`,
  });
  const deliveryError =
    'error' in email
      ? 'Email delivery failed; share the invitation link instead'
      : 'skipped' in email && email.skipped
        ? 'Invitation email is disabled; share the invitation link instead'
        : null;
  const delivered = await db
    .from('institution_invitations')
    .update({
      sent_at: deliveryError ? null : new Date().toISOString(),
      delivery_error: deliveryError,
    })
    .eq('id', result.id);
  if (delivered.error) throw delivered.error;
  return { invitation_id: result.id, url, delivery_error: deliveryError };
}
Deno.serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);
  if (!validateCsrfProtection(req).valid)
    return json({ error: 'Request validation failed' }, 403, headers);
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser(token);
  if (authError || !user) return json({ error: 'Sign in to continue' }, 401, headers);
  if (!user.email_confirmed_at) return json({ error: 'Verify your email first' }, 403, headers);
  if (!checkRateLimit(`institution:${user.id}`, { maxRequests: 60, windowMs: 60000 }).allowed)
    return json({ error: 'Please try again shortly' }, 429, headers);
  try {
    const { action, data = {} } = await req.json();
    const actor = user.id;
    if (typeof action !== 'string') throw new Error('Operation required');
    if (action === 'history')
      return json({ data: await getInstitutionHistory(db, actor, data) }, 200, headers);
    // Accept is always bound to Supabase's verified address, never a client-supplied identity.
    if (action === 'accept') {
      if (typeof data.token !== 'string' || data.token.length > 200)
        throw new Error('Invalid invitation');
      const { data: invite, error } = await db
        .from('institution_invitations')
        .select('email')
        .eq('token_hash', await hashToken(data.token))
        .maybeSingle();
      if (error) throw error;
      if (!invite || invite.email.toLowerCase() !== user.email?.toLowerCase())
        return json({ error: 'Sign in with the invited email address' }, 403, headers);
      const result = await rpc(actor, 'accept', { token_hash: await hashToken(data.token) });
      return json({ data: result }, 200, headers);
    }
    if (action === 'quote' || action === 'checkout') {
      const detail = await rpc(actor, 'detail', { institution_id: data.institution_id });
      const institution = detail.institution;
      if (institution.status !== 'active') throw new Error('Institution is not active');
      const { data: flag, error: flagError } = await db
        .from('system_settings')
        .select('value')
        .eq('key', 'institution_enabled')
        .single();
      if (flagError || flag.value !== true)
        throw new Error('Institution purchases are not enabled');
      const { data: rules, error } = await db
        .from('institution_pricing')
        .select('*')
        .eq('enabled', true);
      if (error) throw error;
      const quote = quoteInstitutionSeats(
        rules || [],
        institution,
        String(data.tier),
        Number(data.months),
        Number(data.quantity)
      );

      // Request key prevents browser retries from creating multiple payable orders.
      if (typeof data.request_id !== 'string' || !/^[a-f0-9-]{36}$/i.test(data.request_id))
        throw new Error('Purchase request ID required');
      const { data: order, error: orderError } = await db.rpc('institution_prepare_order', {
        p_actor: actor,
        p_id: data.request_id,
        p_institution: institution.id,
        p_quote: quote,
      });
      if (orderError) throw orderError;
      if (Date.now() - new Date(order.created_at).getTime() > 24 * 60 * 60 * 1000)
        throw new Error('Quote expired; calculate a new price');
      if (action === 'quote') return json({ data: order.pricing_snapshot }, 200, headers);
      let customerId = institution.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create(
          {
            name: institution.name,
            email: institution.contact_email || institution.owner_email,
            metadata: { institution_id: institution.id },
          },
          { idempotencyKey: `institution-customer:${institution.id}` }
        );
        customerId = customer.id;
        const updated = await db
          .from('institutions')
          .update({ stripe_customer_id: customerId })
          .eq('id', institution.id);
        if (updated.error) throw updated.error;
      }
      const session = await stripe.checkout.sessions.create(
        {
          customer: customerId,
          mode: 'payment',
          invoice_creation: {
            enabled: true,
            invoice_data: {
              metadata: { institution_order_id: order.id, institution_id: institution.id },
            },
          },
          metadata: {
            institution_id: institution.id,
            institution_order_id: order.id,
            purchase_scope: 'institution',
          },
          payment_intent_data: {
            metadata: { institution_id: institution.id, institution_order_id: order.id },
          },
          line_items: [
            {
              price_data: {
                currency: order.currency.toLowerCase(),
                unit_amount: order.amount_minor,
                product_data: {
                  name: `${institution.name}: ${order.quantity} ${order.tier} seats (${order.months} month access)`,
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${frontend}/institution?tab=billing&institution=${institution.id}&checkout=success`,
          cancel_url: `${frontend}/institution?tab=subscription&institution=${institution.id}`,
        },
        { idempotencyKey: `institution-order:${order.id}` }
      );
      const updated = await db
        .from('institution_orders')
        .update({ checkout_session_id: session.id })
        .eq('id', order.id);
      if (updated.error) throw updated.error;
      return json({ data: { url: session.url, order_id: order.id } }, 200, headers);
    }
    if (action === 'import') {
      if (!Array.isArray(data.rows) || data.rows.length < 1 || data.rows.length > 50)
        throw new Error('Import 1–50 rows at a time');
      await rpc(actor, 'detail', { institution_id: data.institution_id });
      const results = [];
      const seen = new Set();
      for (const [index, row] of data.rows.entries()) {
        // Pace bulk email dispatch; each checked reservation still has its own transaction.
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, 600));
        const email = String(row.email || '')
          .trim()
          .toLowerCase();
        if (seen.has(email)) {
          results.push({ email, error: 'Duplicate email' });
          continue;
        }
        seen.add(email);
        try {
          const result = await createInvitation(actor, 'invite', {
            institution_id: data.institution_id,
            order_id: data.order_id,
            email,
            name: String(row.name || '').slice(0, 160),
          });
          results.push({ email, ...result });
        } catch (error) {
          results.push({
            email,
            error: String((error as { message?: string }).message || 'Invitation failed'),
          });
        }
      }
      return json({ data: { results } }, 200, headers);
    }
    if (action === 'invite' || action === 'invite_owner') {
      return json({ data: await createInvitation(actor, action, data) }, 200, headers);
    }
    if (action === 'update' && data.logo_url && !/^https:\/\//.test(data.logo_url))
      throw new Error('Logo must use an HTTPS URL');
    const allowed = new Set([
      'list',
      'detail',
      'create',
      'update',
      'enable',
      'pricing',
      'grant',
      'cancel',
      'revoke',
      'extend',
      'release',
      'correct',
      'reconcile_refund',
      'user_access',
    ]);
    if (!allowed.has(action)) throw new Error('Unknown operation');
    return json({ data: await rpc(actor, action, data) }, 200, headers);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String((error as { message?: string }).message || 'Institution operation failed');
    console.error('[institutions] operation failed', message);
    return json(
      { error: message },
      (error as { code?: string }).code === '42501' ? 403 : 400,
      headers
    );
  }
});
