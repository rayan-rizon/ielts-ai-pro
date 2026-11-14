import type Stripe from 'npm:stripe@^14.14.0';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  BillingUser,
  manualSubscriptionRow,
  subscriptionRow,
  summarizeSubscriptions,
} from './overviewModel.ts';

async function billingUsers(db: SupabaseClient): Promise<BillingUser[]> {
  const users: BillingUser[] = [];
  for (let offset = 0; offset < 5000; offset += 200) {
    const { data, error } = await db
      .from('users')
      .select(
        'id,auth_id,full_name,email,subscription_tier,stripe_subscription_id,subscription_end_date,subscription_amount,subscription_currency,payment_failed_at'
      )
      .or('subscription_tier.neq.free,stripe_subscription_id.not.is.null')
      .order('id')
      .range(offset, offset + 199);
    if (error) throw error;
    users.push(...data);
    if (data.length < 200) return users;
  }
  throw new Error('Subscription overview exceeds supported size');
}

async function liveRow(stripe: Stripe, user: BillingUser, now: number) {
  if (!user.stripe_subscription_id) return manualSubscriptionRow(user, now);
  try {
    const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id, {
      expand: ['latest_invoice.payment_intent'],
    });
    return subscriptionRow(user, sub);
  } catch {
    // Keep the learner visible without presenting cached access as live status.
    return {
      userId: user.id,
      authId: user.auth_id,
      name: user.full_name || 'Unnamed learner',
      email: user.email || '',
      tier: user.subscription_tier,
      id: user.stripe_subscription_id,
      provider: 'stripe',
      status: 'unavailable',
      amount: null,
      currency: '',
      interval: '',
      periodEnd: null,
      cancelAtPeriodEnd: false,
      invoice: null,
    };
  }
}

export async function loadPaymentOverview(stripe: Stripe, db: SupabaseClient) {
  const observedAt = new Date().toISOString();
  const [users, pending] = await Promise.all([
    billingUsers(db),
    db
      .from('payment_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);
  if (pending.error) throw pending.error;
  const rows: Awaited<ReturnType<typeof liveRow>>[] = [];
  for (let offset = 0; offset < users.length; offset += 4) {
    rows.push(
      ...(await Promise.all(
        users.slice(offset, offset + 4).map((user) => liveRow(stripe, user, Date.parse(observedAt)))
      ))
    );
  }
  const subscriptions = rows.filter((row): row is NonNullable<typeof row> => row !== null);
  const summary = summarizeSubscriptions(subscriptions);
  return {
    observedAt,
    subscriptions,
    summary: { ...summary, pending: pending.count },
    complete: summary.unverified === 0,
  };
}
