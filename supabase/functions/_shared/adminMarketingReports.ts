// Approved reporting queries only. The model never supplies SQL, filters, or values.
export const REPORTS = {
  delivery_health: 'Message delivery by channel and status',
  contact_feedback: 'Dismissals, snoozes, and negative message feedback',
  automation_pipeline: 'Prepared, suppressed, and failed automation decisions',
  checkout_progress: 'Checkout initiation and payment status',
};
type Row = Record<string, any>;
export function reportWindow(days: unknown, now = new Date()) {
  const value = Number(days ?? 30);
  if (![7, 14, 30, 90].includes(value)) throw new Error('Choose a 7, 14, 30, or 90 day window');
  return {
    days: value,
    since: new Date(+now - value * 86400000).toISOString(),
    until: now.toISOString(),
  };
}
export function requireUuid(value: unknown) {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
    throw new Error('A valid learner or message ID is required');
  return value;
}
async function rows(query: any) {
  const result = await query;
  if (result.error) throw new Error(`Reporting data unavailable: ${result.error.message}`);
  return result.data || [];
}
export async function runReport(db: any, report: string, days: unknown) {
  if (!Object.hasOwn(REPORTS, report)) throw new Error('Unsupported report');
  const window = reportWindow(days);
  const definitions: Record<
    string,
    { table: string; time: string; field: string; values: string[] }
  > = {
    delivery_health: {
      table: 'marketing_deliveries',
      time: 'created_at',
      field: 'status',
      values: [
        'pending',
        'processing',
        'accepted',
        'delivered',
        'viewed',
        'clicked',
        'skipped',
        'failed',
      ],
    },
    contact_feedback: {
      table: 'marketing_contact_feedback',
      time: 'created_at',
      field: 'action',
      values: [
        'viewed',
        'clicked',
        'dismissed',
        'not_interested',
        'snoozed',
        'useful',
        'not_useful',
      ],
    },
    automation_pipeline: {
      table: 'marketing_interventions',
      time: 'created_at',
      field: 'status',
      values: [
        'prepared',
        'needs_approval',
        'approved',
        'queued',
        'sent',
        'suppressed',
        'cancelled',
        'expired',
        'failed',
      ],
    },
    checkout_progress: {
      table: 'marketing_checkout_intents',
      time: 'initiated_at',
      field: 'status',
      values: ['initiated', 'pending', 'manual_review', 'settled', 'failed', 'expired'],
    },
  };
  const definition = definitions[report];
  const channels = report === 'delivery_health' ? ['in_app', 'banner', 'email', 'push'] : [null];
  const facts = await Promise.all(
    channels.flatMap((channel) =>
      definition.values.map(async (status) => {
        let query = db
          .from(definition.table)
          .select('id', { count: 'exact', head: true })
          .gte(definition.time, window.since)
          .lt(definition.time, window.until)
          .eq(definition.field, status);
        if (channel) query = query.eq('channel', channel);
        const result = await query;
        if (result.error || result.count == null)
          throw new Error('Report counts are unavailable. Please retry.');
        return {
          id: `${report}.${channel || 'all'}.${status}`,
          label: [channel?.replaceAll('_', ' '), status.replaceAll('_', ' ')]
            .filter(Boolean)
            .join(' · '),
          value: result.count,
          channel,
          status,
        };
      })
    )
  );
  return {
    report,
    title: REPORTS[report as keyof typeof REPORTS],
    window,
    source: definition.table,
    facts,
    limitation:
      report === 'delivery_health'
        ? 'Current status of deliveries created in this window. These are not cumulative funnel stages. Provider acceptance and email opens do not prove reading. Scheduled emails outside Marketing deliveries are available in the learner timeline.'
        : report === 'checkout_progress'
          ? 'Current status of checkout intents initiated in this window. Counts are checkout attempts, not unique subscribers or renewal revenue.'
          : 'Counts are records, not unique learners. These observations do not establish causal impact.',
  };
}
export function rankBriefing(recommendations: Row[]) {
  const seen = new Set<string>();
  return recommendations
    .filter((item) => ['new', 'accepted'].includes(item.status) && Number(item.sample_size) > 0)
    .sort(
      (a, b) =>
        (({ urgent: 3, attention: 2, opportunity: 1 })[b.severity] || 0) -
          ({ urgent: 3, attention: 2, opportunity: 1 }[a.severity] || 0) ||
        +new Date(b.created_at) - +new Date(a.created_at)
    )
    .filter((item) => {
      const key = item.fingerprint || item.title.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}
export async function briefing(db: any) {
  const window = reportWindow(30);
  const recommendations = await rows(
    db
      .from('marketing_admin_recommendations')
      .select(
        'id,fingerprint,title,summary,severity,category,sample_size,evidence,proposed_action,status,created_at,measurement_window'
      )
      .in('status', ['new', 'accepted'])
      .gte('created_at', window.since)
      .order('created_at', { ascending: false })
      .limit(100)
  );
  const runs = await rows(
    db
      .from('marketing_autopilot_analysis_runs')
      .select('created_at,model_metadata')
      .order('created_at', { ascending: false })
      .limit(1)
  );
  return {
    items: rankBriefing(recommendations),
    window,
    last_analysis: runs[0] || null,
    generated_at: new Date().toISOString(),
  };
}
export async function searchLearners(db: any, value: unknown) {
  const term = String(value || '').trim();
  if (term.length < 3 || term.length > 120)
    throw new Error('Enter at least three characters of a name or email');
  // Escape wildcard and PostgREST filter syntax; values stay in a single ilike filter.
  const safe = term.replace(/[%_\\]/g, '\\$&');
  const field = term.includes('@') ? 'email' : 'full_name';
  return rows(
    db.from('users').select('id,full_name,email').ilike(field, `%${safe}%`).order('id').limit(20)
  );
}
async function recipientHash(email: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(email.trim().toLowerCase())
  );
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export async function learnerTimeline(db: any, id: unknown, days: unknown) {
  const userId = requireUuid(id);
  const window = reportWindow(days);
  const users = await rows(db.from('users').select('id,full_name,email').eq('id', userId).limit(1));
  if (!users.length) throw new Error('Learner not found');
  const user = users[0];
  const hash = await recipientHash(user.email);
  const sources = [
    [
      'deliveries',
      'marketing_deliveries',
      'id,channel,status,content,provider_message_id,failure_reason,created_at,delivered_at,viewed_at,clicked_at',
      'user_id',
      userId,
    ],
    [
      'emails',
      'email_delivery_events',
      'id,email_type,status,provider_message_id,error_message,created_at',
      'recipient_hash',
      hash,
    ],
    [
      'decisions',
      'marketing_interventions',
      'id,playbook_key,status,rationale,suppression_reason,content,recommended_channel,created_at',
      'user_id',
      userId,
    ],
    [
      'feedback',
      'marketing_contact_feedback',
      'id,delivery_id,action,snoozed_until,created_at',
      'user_id',
      userId,
    ],
    [
      'events',
      'marketing_events',
      'id,delivery_id,event_type,channel,occurred_at',
      'user_id',
      userId,
    ],
  ];
  const results = await Promise.all(
    sources.map(async ([key, table, fields, field, value]) => {
      const time = key === 'events' ? 'occurred_at' : 'created_at';
      return {
        key,
        data: await rows(
          db
            .from(table)
            .select(fields)
            .eq(field, value)
            .gte(time, window.since)
            .lt(time, window.until)
            .order(time, { ascending: false })
            .order('id')
            .limit(201)
        ),
      };
    })
  );
  const deliveries = results.find((x) => x.key === 'deliveries')!.data.slice(0, 200);
  const linkedProviders = new Set(
    deliveries.map((x: Row) => x.provider_message_id).filter(Boolean)
  );
  const items = results.flatMap(({ key, data }) =>
    data
      .slice(0, 200)
      .filter((item: Row) => key !== 'emails' || !linkedProviders.has(item.provider_message_id))
      .map((item: Row) => ({ ...item, kind: key, at: item.occurred_at || item.created_at }))
  );
  return {
    user,
    window,
    items: items.sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    truncated_sources: results.filter((x) => x.data.length > 200).map((x) => x.key),
    limitation:
      'Up to 200 records per source in this window. Provider acceptance is not proof of reading. Email matching uses the learner’s current email; older addresses and legacy broadcasts without per-learner delivery records may be absent.',
  };
}
export async function emailPreview(
  db: any,
  userId: unknown,
  messageId: unknown,
  kind: unknown,
  apiKey: string | undefined
) {
  const user = requireUuid(userId),
    id = requireUuid(messageId);
  if (!['deliveries', 'emails'].includes(String(kind)))
    throw new Error('Unsupported message source');
  let query;
  if (kind === 'deliveries')
    query = db
      .from('marketing_deliveries')
      .select('provider_message_id')
      .eq('id', id)
      .eq('user_id', user)
      .eq('channel', 'email');
  else {
    const users = await rows(db.from('users').select('email').eq('id', user).limit(1));
    if (!users.length) throw new Error('Learner not found');
    query = db
      .from('email_delivery_events')
      .select('provider_message_id')
      .eq('id', id)
      .eq('recipient_hash', await recipientHash(users[0].email));
  }
  const matches = await rows(query.limit(1));
  if (!matches[0]?.provider_message_id || !apiKey)
    return {
      available: false,
      reason:
        'The original email is unavailable; no provider message or provider access was recorded.',
    };
  const response = await fetch(
    `https://api.resend.com/emails/${encodeURIComponent(matches[0].provider_message_id)}`,
    { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(8000) }
  );
  if (!response.ok)
    return {
      available: false,
      reason: 'The email provider could not retrieve this original email.',
    };
  const email = await response.json();
  return {
    available: true,
    subject: email.subject,
    html: email.html || '',
    text: email.text || '',
    provider_status: email.last_event || 'unknown',
  };
}
