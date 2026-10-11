import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { isUndeliverableEmail } from './emailAddress.ts';

export type EmailType =
  | 'institution_invitation'
  | 'welcome'
  | 'renewal_confirmation'
  | 'payment_failed'
  | 'quota_conversion'
  | 'renewal_reminder'
  | 'trial_expiry'
  | 'inactivity_warning'
  | 'marketing_campaign';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  type: EmailType;
  /**
   * Plain-text alternative. Optional so existing callers keep working, but
   * always pass it when the template provides one — a multipart message is
   * what plain-text clients and text previews render, and an HTML-only body
   * is a long-standing spam heuristic.
   */
  text?: string;
  /**
   * Extra SMTP headers. Marketing sends pass List-Unsubscribe and
   * List-Unsubscribe-Post here so the mail client shows its own native
   * unsubscribe control — Gmail and Yahoo require one-click opt-out from bulk
   * senders, and without it they push recipients toward "report spam" instead.
   */
  headers?: Record<string, string>;
  /**
   * Stable provider-side deduplication key for retryable workflows. Resend
   * retains these for 24 hours, covering the scheduled job's retry window.
   */
  idempotencyKey?: string;
}

/**
 * RFC 8058 one-click unsubscribe headers for a specific delivery.
 * The mailto: fallback covers clients that predate one-click.
 */
export const unsubscribeHeaders = (unsubscribeUrl: string) => ({
  'List-Unsubscribe': `<mailto:unsubscribe@ieltsai.pro>, <${unsubscribeUrl}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
});

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type DispatchStatus = 'accepted' | 'failed' | 'skipped';

async function hashRecipient(recipient: string): Promise<string | null> {
  try {
    const bytes = new TextEncoder().encode(recipient.trim().toLowerCase());
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

async function recordDispatch({
  to,
  type,
  status,
  providerMessageId,
  errorMessage,
}: {
  to: string;
  type: EmailType;
  status: DispatchStatus;
  providerMessageId?: string;
  errorMessage?: string;
}) {
  try {
    const { error } = await supabase.from('email_delivery_events').insert({
      email_type: type,
      recipient_hash: await hashRecipient(to),
      status,
      provider_message_id: providerMessageId || null,
      error_message: errorMessage?.slice(0, 500) || null,
    });

    // Delivery telemetry must never turn a successful provider dispatch into a
    // learner-facing failure. During migration rollouts the table may briefly be
    // unavailable, so report the instrumentation gap without retrying the email.
    if (error) console.warn('[email-health] Could not persist dispatch outcome:', error.message);
  } catch (error) {
    console.warn(
      '[email-health] Dispatch succeeded but telemetry could not be persisted:',
      error instanceof Error ? error.message : error
    );
  }
}

function providerErrorMessage(result: unknown): string {
  if (!result || typeof result !== 'object') return 'Resend rejected the email dispatch';
  const candidate = result as Record<string, unknown>;
  return String(candidate.message || candidate.name || 'Resend rejected the email dispatch').slice(
    0,
    500
  );
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  headers,
  type,
  idempotencyKey,
}: SendEmailParams) {
  if (isUndeliverableEmail(to)) {
    console.log(`Skipping '${type}' email: recipient uses a reserved test domain.`);
    await recordDispatch({ to, type, status: 'skipped', errorMessage: 'undeliverable_address' });
    return { success: true, skipped: true, reason: 'undeliverable_address' };
  }

  if (!resendApiKey) {
    console.error('Missing RESEND_API_KEY');
    await recordDispatch({ to, type, status: 'failed', errorMessage: 'RESEND_API_KEY is missing' });
    return { error: 'Missing RESEND_API_KEY' };
  }

  try {
    // 1. Check if email type is enabled by Admin
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_preferences')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching email settings:', error);
      // Fallback safe: allow send if setting fetch errors (except not found)
    }

    if (data && data.value) {
      const preferences = data.value as Record<string, boolean>;
      // If explicitly turned off, skip sending
      if (preferences[type] === false) {
        console.log(`Email '${type}' is disabled via Admin Settings. Skipping send to ${to}.`);
        await recordDispatch({ to, type, status: 'skipped' });
        return { success: true, skipped: true, reason: 'email_preference_disabled' };
      }
    }

    // 2. Set Context-Aware Sender
    const supportEmails: EmailType[] = ['payment_failed'];
    const isSupport = supportEmails.includes(type);
    const from = isSupport
      ? 'IELTS AI Pro Support <mail@ieltsai.pro>'
      : 'IELTS AI Pro <mail@ieltsai.pro>';

    // 3. Dispatch to Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
        ...(headers && Object.keys(headers).length ? { headers } : {}),
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`Successfully sent '${type}' email to ${to}:`, result.id);
      await recordDispatch({
        to,
        type,
        status: 'accepted',
        providerMessageId: typeof result.id === 'string' ? result.id : undefined,
      });
      return { success: true, id: result.id };
    } else {
      console.error(`Resend API Error sending '${type}' email:`, result);
      await recordDispatch({
        to,
        type,
        status: 'failed',
        errorMessage: providerErrorMessage(result),
      });
      return { error: result };
    }
  } catch (err) {
    console.error('Unexpected error in sendEmail:', err);
    await recordDispatch({
      to,
      type,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Unexpected email dispatch error',
    });
    return { error: err };
  }
}
