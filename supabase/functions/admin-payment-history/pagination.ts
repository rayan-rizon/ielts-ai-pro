import type Stripe from 'npm:stripe@^14.14.0';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { isVisibleIeltsCheckout, stripeObjectId } from './visibility.ts';

export type HistoryCursor = {
  checkout: string | null;
  invoice: string | null;
  institution: { date: string; id: string } | null;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseHistoryOptions(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Invalid history options');
  const body = input as { limit?: unknown; cursor?: HistoryCursor } | null;
  const limit = body?.limit === undefined ? 50 : Number(body.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid page size');
  const cursor = body?.cursor;
  if (cursor !== undefined) {
    if (
      !cursor ||
      typeof cursor !== 'object' ||
      !(
        cursor.checkout === null ||
        (typeof cursor.checkout === 'string' && /^cs_[a-zA-Z0-9_]+$/.test(cursor.checkout))
      ) ||
      !(
        cursor.invoice === null ||
        (typeof cursor.invoice === 'string' && /^in_[a-zA-Z0-9_]+$/.test(cursor.invoice))
      ) ||
      !(
        cursor.institution === null ||
        (cursor.institution &&
          typeof cursor.institution.id === 'string' &&
          UUID.test(cursor.institution.id) &&
          typeof cursor.institution.date === 'string' &&
          Number.isFinite(Date.parse(cursor.institution.date)))
      )
    )
      throw new Error('Invalid history cursor');
  }
  return { limit, cursor };
}

// Cache Checkout provenance for five minutes, never caller authorization or payment data.
// Bounded per worker; all history requests still pass the live MFA admin gate.
const provenanceCache = new Map<string, { visible: boolean; expires: number }>();

export async function loadHistoryPage(
  stripe: Stripe,
  db: SupabaseClient,
  options: ReturnType<typeof parseHistoryOptions>,
  hiddenIds: ReadonlySet<string>
) {
  const { limit, cursor } = options;
  let institutionQuery = db
    .from('billing_history')
    .select('*, institution:institutions(name)')
    .not('institution_id', 'is', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);
  if (cursor?.institution) {
    const date = new Date(cursor.institution.date).toISOString();
    institutionQuery = institutionQuery.or(
      `created_at.lt.${date},and(created_at.eq.${date},id.lt.${cursor.institution.id})`
    );
  }
  const [checkouts, invoices, institutions] = await Promise.all([
    cursor?.checkout === null
      ? { data: [], has_more: false }
      : stripe.checkout.sessions.list({
          limit,
          ...(cursor?.checkout ? { starting_after: cursor.checkout } : {}),
        }),
    cursor?.invoice === null
      ? { data: [], has_more: false }
      : stripe.invoices.list({
          limit,
          status: 'paid',
          ...(cursor?.invoice ? { starting_after: cursor.invoice } : {}),
        }),
    cursor?.institution === null ? { data: [], error: null } : institutionQuery,
  ]);
  if (institutions.error) throw institutions.error;
  const visibleCheckouts = checkouts.data.filter((s) => isVisibleIeltsCheckout(s, hiddenIds));
  const visibleSubscriptions = new Set(
    visibleCheckouts.map((s) => stripeObjectId(s.subscription)).filter(Boolean)
  );
  const candidates = invoices.data.filter(
    (i) => i.billing_reason !== 'subscription_create' && Number(i.amount_paid) > 0
  );
  const missing = [
    ...new Set(
      candidates
        .map((i) => stripeObjectId(i.subscription))
        .filter((id): id is string => Boolean(id) && !visibleSubscriptions.has(id))
    ),
  ];
  // A renewal's original Checkout can be older than the current page. Validate it
  // directly, deduplicate lookups per subscription, and cap concurrency at four.
  for (let offset = 0; offset < missing.length; offset += 4) {
    await Promise.all(
      missing.slice(offset, offset + 4).map(async (id) => {
        const cached = provenanceCache.get(id);
        let visible = cached?.visible;
        if (!cached || cached.expires <= Date.now()) {
          const original = await stripe.checkout.sessions.list({ subscription: id, limit: 1 });
          visible = original.data.some((s) => isVisibleIeltsCheckout(s, hiddenIds));
          if (provenanceCache.size >= 256)
            provenanceCache.delete(provenanceCache.keys().next().value!);
          provenanceCache.set(id, { visible: Boolean(visible), expires: Date.now() + 300_000 });
        }
        if (visible) visibleSubscriptions.add(id);
      })
    );
  }
  const institutionRows = (institutions.data || []).slice(0, limit);
  const lastInstitution = institutionRows[institutionRows.length - 1];
  return {
    checkouts: visibleCheckouts,
    invoices: candidates.filter((i) => visibleSubscriptions.has(stripeObjectId(i.subscription))),
    institutions: institutionRows,
    cursor: {
      checkout: checkouts.has_more ? (checkouts.data[checkouts.data.length - 1]?.id ?? null) : null,
      invoice: invoices.has_more ? (invoices.data[invoices.data.length - 1]?.id ?? null) : null,
      institution:
        (institutions.data || []).length > limit
          ? { date: lastInstitution.created_at, id: lastInstitution.id }
          : null,
    } satisfies HistoryCursor,
  };
}
