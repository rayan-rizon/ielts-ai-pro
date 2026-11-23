// Bound the IN filter and page every result: PostgREST's default row limit must
// never turn an existing delivery or contact cap into an apparently empty history.
export async function readMarketingAudienceRows(
  db: any,
  table: string,
  columns: string,
  userIds: string[],
  userColumn = 'user_id',
  orderColumn = 'id'
): Promise<any[]> {
  const rows: any[] = [];
  const ids = [...new Set(userIds)];
  for (let start = 0; start < ids.length; start += 100) {
    const batch = ids.slice(start, start + 100);
    for (let offset = 0; ;) {
      const { data, error } = await db
        .from(table)
        .select(columns)
        .in(userColumn, batch)
        .order(orderColumn)
        .range(offset, offset + 499);
      if (error) throw error;
      if (!data?.length) break;
      rows.push(...data);
      offset += data.length;
    }
  }
  return rows;
}

// PostgREST cancels any call that runs past its statement timeout. The cron
// dispatch overlaps with other heavy jobs, so a page that normally takes well
// under a second can occasionally be cancelled; one retry clears it. Every
// other error, and a second timeout, still fails the run (fail closed).
const STATEMENT_TIMEOUT = '57014';

async function readHistoryPage(db: any, campaignId: string, batch: string[], offset: number) {
  for (let attempt = 0; ; attempt++) {
    const result = await db
      .rpc('marketing_dispatch_history', { p_campaign_id: campaignId, p_user_ids: batch })
      .order('id')
      .range(offset, offset + 499);
    if (!result.error) return result;
    if (result.error.code !== STATEMENT_TIMEOUT || attempt >= 1) throw result.error;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

// Compact history is computed fresh in Postgres. Keep complete pagination:
// successful contacts and non-failed campaign rows must never be truncated.
export async function readMarketingDispatchHistory(
  db: any,
  campaignId: string,
  userIds: string[]
): Promise<any[]> {
  const rows: any[] = [];
  const ids = [...new Set(userIds)];
  for (let start = 0; start < ids.length; start += 100) {
    const batch = ids.slice(start, start + 100);
    for (let offset = 0; ;) {
      const { data } = await readHistoryPage(db, campaignId, batch, offset);
      if (!data?.length) break;
      rows.push(...data);
      offset += data.length;
    }
  }
  return rows;
}

export function nextMarketingAttempt(rows: { attempt: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, Number(row.attempt) || 0), 0) + 1;
}

// Offer outcomes that never reverse for a campaign: the learner is too old for
// the starter offer, already paid, or the offer already ended / was used. Once
// one is recorded, later scans must not reserve (and log) another row.
export const TERMINAL_OFFER_SKIP_REASONS: ReadonlySet<string> = new Set([
  'not_eligible',
  'already_paid',
  'starter_offer_used',
  'starter_offer_ended',
  'another_offer_assigned',
  'another_offer_applied',
  'account_promo_already_used',
  'offer_assigned_to_another_account',
]);

export function hasRecordedSkip(
  rows: { status: string; failure_reason?: string | null }[],
  reason?: string
): boolean {
  return rows.some(
    (row) =>
      row.status === 'skipped' &&
      (reason
        ? row.failure_reason === reason
        : TERMINAL_OFFER_SKIP_REASONS.has(row.failure_reason || ''))
  );
}

export function terminallySkippedUsers(
  history: {
    user_id: string;
    campaign_id: string;
    status: string;
    failure_reason?: string | null;
  }[],
  campaignId: string
): Set<string> {
  return new Set(
    history
      .filter((row) => row.campaign_id === campaignId && hasRecordedSkip([row]))
      .map((row) => row.user_id)
  );
}

// Record a skip for a reserved delivery. The history already holds one skipped
// row per reason, so a repeat is released instead of stored: the quarter-hour
// scan would otherwise add a new row per ineligible learner on every run.
export async function skipReservedDelivery(
  db: any,
  deliveryId: string,
  priorRows: { status: string; failure_reason?: string | null }[],
  reason: string
) {
  if (hasRecordedSkip(priorRows, reason)) {
    const { error } = await db
      .from('marketing_deliveries')
      .delete()
      .eq('id', deliveryId)
      .eq('status', 'processing');
    if (error) throw error;
    return;
  }
  const { error } = await db
    .from('marketing_deliveries')
    .update({ status: 'skipped', failure_reason: reason })
    .eq('id', deliveryId);
  if (error) throw error;
}

// A unique delivery is the send reservation. Only the request that inserted it
// may send; an overlapping request gets null and must skip. Never merge content
// into an existing accepted/processing delivery.
export async function reserveMarketingDelivery(db: any, record: Record<string, any>) {
  const { data, error } = await db
    .from('marketing_deliveries')
    .upsert(record, {
      onConflict: 'campaign_id,user_id,channel,attempt',
      ignoreDuplicates: true,
    })
    .select('id,tracking_token')
    .maybeSingle();
  if (error) throw error;
  return data;
}
