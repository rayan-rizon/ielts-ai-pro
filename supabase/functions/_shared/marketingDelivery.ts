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
      const { data, error } = await db
        .rpc('marketing_dispatch_history', { p_campaign_id: campaignId, p_user_ids: batch })
        .order('id')
        .range(offset, offset + 499);
      if (error) throw error;
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
