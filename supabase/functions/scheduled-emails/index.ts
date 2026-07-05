import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { sendEmail } from '../_shared/resend.ts';
import { getEmailTemplate } from '../_shared/templates.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getJwtRole(req: Request): string | null {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const normalized = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(normalized));
    return decoded?.role || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Basic auth check if called via HTTP
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Supabase validates the JWT at the gateway. Only the scheduled service-role
  // caller should be allowed to run this service-role email job.
  if (getJwtRole(req) !== 'service_role') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Starting scheduled-emails processing...');

    const today = new Date();
    const dates = {
      renewalTarget: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      trialTarget: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      inactiveTarget: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    };

    // 1. Renewal Reminders (7 Days Before)
    console.log(`Checking renewals ending around ${dates.renewalTarget}`);
    const { data: renewals } = await supabase
      .from('users')
      .select('id, email, full_name, subscription_end_date')
      .neq('subscription_tier', 'free')
      .gte('subscription_end_date', `${dates.renewalTarget}T00:00:00Z`)
      .lte('subscription_end_date', `${dates.renewalTarget}T23:59:59Z`);

    if (renewals && renewals.length > 0) {
      for (const user of renewals) {
        if (!user.email) continue;
        const template = getEmailTemplate('renewal_reminder', {
          full_name: user.full_name,
          subscription_end_date: user.subscription_end_date,
        });
        await sendEmail({
          to: user.email,
          subject: template.subject,
          type: 'renewal_reminder',
          html: template.html,
        });
      }
    }

    // 2. Trial / Referral Bonus Expiry (3 Days Before)
    console.log(`Checking trial/bonus ending around ${dates.trialTarget}`);
    const { data: trials } = await supabase
      .from('users')
      .select('id, email, full_name, referral_bonus_expires_at')
      .gte('referral_bonus_expires_at', `${dates.trialTarget}T00:00:00Z`)
      .lte('referral_bonus_expires_at', `${dates.trialTarget}T23:59:59Z`);

    if (trials && trials.length > 0) {
      for (const user of trials) {
        if (!user.email) continue;
        const template = getEmailTemplate('trial_expiry', {
          full_name: user.full_name,
          referral_bonus_expires_at: user.referral_bonus_expires_at,
        });
        await sendEmail({
          to: user.email,
          subject: template.subject,
          type: 'trial_expiry',
          html: template.html,
        });
      }
    }

    // 3. Inactivity Warning (7 Days Inactive)
    console.log(`Checking users last active around ${dates.inactiveTarget}`);
    const { data: inactiveUsers } = await supabase
      .from('users')
      .select('id, email, full_name, last_active')
      .gte('last_active', `${dates.inactiveTarget}T00:00:00Z`)
      .lte('last_active', `${dates.inactiveTarget}T23:59:59Z`);

    if (inactiveUsers && inactiveUsers.length > 0) {
      for (const user of inactiveUsers) {
        if (!user.email) continue;
        const template = getEmailTemplate('inactivity_warning', { full_name: user.full_name });
        await sendEmail({
          to: user.email,
          subject: template.subject,
          type: 'inactivity_warning',
          html: template.html,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Scheduled tasks executed.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Scheduled Tasks Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
