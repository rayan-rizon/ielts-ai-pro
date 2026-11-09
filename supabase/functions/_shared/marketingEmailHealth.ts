type ProviderEvent = { type: string; created_at?: string; data?: Record<string, any> };

function isPermanentFeedback(type: string, bounce: Record<string, any>) {
  return (
    type !== 'email.bounced' ||
    bounce.type === 'Permanent' ||
    /5\.4\.4|5\.1\.1|invalid domain|user unknown|does not exist/i.test(
      JSON.stringify(bounce.diagnosticCode)
    )
  );
}

export function marketingFeedback(event: ProviderEvent) {
  if (!['email.bounced', 'email.complained', 'email.suppressed'].includes(event.type)) return null;
  const bounce = event.data?.bounce || {};
  return {
    reason: event.type === 'email.bounced' ? String(bounce.subType || 'General') : event.type,
    permanent: isPermanentFeedback(event.type, bounce),
    bounce_type: bounce.type || null,
    diagnostic_code: bounce.diagnosticCode || null,
  };
}

function feedbackRows(event: ProviderEvent, feedback: Record<string, any>) {
  const recipients: string[] = event.data?.to || [];
  return [...new Set(recipients.map((email) => email.trim().toLowerCase()))].map((email) => ({
    email,
    occurred_at: event.created_at,
    ...feedback,
  }));
}

export async function recordMarketingFeedback(db: any, event: ProviderEvent) {
  const feedback = marketingFeedback(event);
  const providerId = event.data?.email_id;
  if (!feedback || !providerId) return;
  const rows = feedbackRows(event, { ...feedback, provider_message_id: providerId });
  if (!rows.length) return;
  const { error } = await db.from('marketing_email_feedback').upsert(rows, {
    onConflict: 'email,provider_message_id',
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

export async function marketingEmailBlockReason(db: any, email: string) {
  const { data, error } = await db.rpc('marketing_email_block_reason', { p_email: email });
  if (error) throw error;
  return data as string | null;
}

// An asynchronous bounce does not undo the provider's accepted send.
export function countsAsMarketingContact(row: Record<string, any>): boolean {
  return (
    Boolean(row.provider_message_id) ||
    ['accepted', 'delivered', 'viewed', 'clicked'].includes(row.status)
  );
}

export function countsTowardsCampaignCap(row: Record<string, any>): boolean {
  return Boolean(row.provider_message_id) || !['skipped', 'failed'].includes(row.status);
}
