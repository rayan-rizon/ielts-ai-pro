import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { sendEmail } from '../_shared/resend.ts';
import { getEmailTemplate } from '../_shared/templates.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function isAuthorizedScheduler(req: Request): Promise<boolean> {
  const token = req.headers.get('X-Scheduler-Secret');
  if (!token) return false;

  const { data, error } = await supabase.rpc('verify_scheduled_email_token', {
    p_token: token,
  });
  return !error && data === true;
}

serve(async (req) => {
  // Basic auth check if called via HTTP
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // The database scheduler uses an opaque, dedicated Vault secret. This keeps
  // the service-role key out of cron SQL and prevents public callers from
  // triggering a privileged bulk-email job.
  if (!(await isAuthorizedScheduler(req))) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const requestBody = await req.json().catch(() => ({}));
  if (requestBody?.healthCheck === true) {
    return new Response(JSON.stringify({ success: true, mode: 'health-check' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let runId: string | null = null;
  let candidates = 0;
  let accepted = 0;
  let skipped = 0;
  let failed = 0;

  const captureDispatch = (result: Awaited<ReturnType<typeof sendEmail>>) => {
    candidates += 1;
    if ('error' in result && result.error) failed += 1;
    else if ('skipped' in result && result.skipped) skipped += 1;
    else accepted += 1;
  };

  try {
    console.log('Starting scheduled-emails processing...');

    const { data: run, error: runError } = await supabase
      .from('scheduled_email_runs')
      .insert({ status: 'running' })
      .select('id')
      .single();
    if (runError || !run) {
      throw new Error(
        `Could not start scheduled email telemetry: ${runError?.message || 'no run id'}`
      );
    }
    runId = run.id;

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
    const { data: renewals, error: renewalsError } = await supabase
      .from('users')
      .select('id, email, full_name, subscription_end_date')
      .neq('subscription_tier', 'free')
      .gte('subscription_end_date', `${dates.renewalTarget}T00:00:00Z`)
      .lte('subscription_end_date', `${dates.renewalTarget}T23:59:59Z`);
    if (renewalsError)
      throw new Error(`Could not load renewal reminders: ${renewalsError.message}`);

    if (renewals && renewals.length > 0) {
      for (const user of renewals) {
        if (!user.email) continue;
        const template = getEmailTemplate('renewal_reminder', {
          full_name: user.full_name,
          subscription_end_date: user.subscription_end_date,
        });
        captureDispatch(
          await sendEmail({
            to: user.email,
            subject: template.subject,
            type: 'renewal_reminder',
            html: template.html,
            text: template.text,
          })
        );
      }
    }

    // 2. Trial / Referral Bonus Expiry (3 Days Before)
    console.log(`Checking trial/bonus ending around ${dates.trialTarget}`);
    const { data: trials, error: trialsError } = await supabase
      .from('users')
      .select('id, email, full_name, referral_bonus_expires_at')
      .gte('referral_bonus_expires_at', `${dates.trialTarget}T00:00:00Z`)
      .lte('referral_bonus_expires_at', `${dates.trialTarget}T23:59:59Z`);
    if (trialsError) throw new Error(`Could not load trial reminders: ${trialsError.message}`);

    if (trials && trials.length > 0) {
      for (const user of trials) {
        if (!user.email) continue;
        const template = getEmailTemplate('trial_expiry', {
          full_name: user.full_name,
          referral_bonus_expires_at: user.referral_bonus_expires_at,
        });
        captureDispatch(
          await sendEmail({
            to: user.email,
            subject: template.subject,
            type: 'trial_expiry',
            html: template.html,
            text: template.text,
          })
        );
      }
    }

    // 3. Inactivity Warning (7 Days Inactive)
    console.log(`Checking users last active around ${dates.inactiveTarget}`);
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('users')
      .select('id, email, full_name, last_active')
      .gte('last_active', `${dates.inactiveTarget}T00:00:00Z`)
      .lte('last_active', `${dates.inactiveTarget}T23:59:59Z`);
    if (inactiveError)
      throw new Error(`Could not load inactivity reminders: ${inactiveError.message}`);

    if (inactiveUsers && inactiveUsers.length > 0) {
      for (const user of inactiveUsers) {
        if (!user.email) continue;
        const template = getEmailTemplate('inactivity_warning', { full_name: user.full_name });
        captureDispatch(
          await sendEmail({
            to: user.email,
            subject: template.subject,
            type: 'inactivity_warning',
            html: template.html,
            text: template.text,
          })
        );
      }
    }

    const runStatus = failed > 0 ? 'failed' : 'completed';
    const { error: completeError } = await supabase
      .from('scheduled_email_runs')
      .update({
        status: runStatus,
        completed_at: new Date().toISOString(),
        candidates,
        accepted,
        skipped,
        failed,
        error_message: failed > 0 ? `${failed} email dispatch(es) failed` : null,
      })
      .eq('id', runId);
    if (completeError)
      throw new Error(`Could not finalize scheduled email telemetry: ${completeError.message}`);

    if (failed > 0) {
      return new Response(
        JSON.stringify({
          error: 'One or more scheduled emails failed',
          candidates,
          accepted,
          skipped,
          failed,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled tasks executed.',
        candidates,
        accepted,
        skipped,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Scheduled Tasks Error:', err);
    if (runId) {
      await supabase
        .from('scheduled_email_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          candidates,
          accepted,
          skipped,
          failed: Math.max(failed, 1),
          error_message: String(err?.message || err).slice(0, 500),
        })
        .eq('id', runId);
    }
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
