import { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  Clock,
  CreditCard,
  History,
  Loader2,
  ReceiptText,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { BillingService } from '@/features/admin/services/BillingService';
import {
  AdminButton,
  BODY,
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  SectionLabel,
  StatCell,
  StatRail,
  TITLE,
  WELL,
} from '../ui/primitives';
import RefundDialog from './RefundDialog';
import {
  REFUND_STATUS_TONE,
  endpointLabel,
  formatDate,
  formatDateTime,
  formatElapsed,
  formatMoney,
  providerLabel,
  refundStatusLabel,
  verdictMeta,
  windowRemaining,
} from './billingFormat';

const PAID_TIERS = new Set(['pro', 'premium']);
const PAYMENT_STATUS_TONE = {
  approved: 'ok',
  pending: 'warn',
  rejected: 'fault',
  refunded: 'accent',
};

const Section = ({ label, children, action }) => (
  <section className={cn(PANEL, 'overflow-hidden')}>
    <div className="flex items-center justify-between gap-2 border-b border-stone-200/80 px-3.5 py-2.5 dark:border-white/[0.07]">
      <SectionLabel>{label}</SectionLabel>
      {action}
    </div>
    {children}
  </section>
);

const Fact = ({ label, children }) => (
  <div className="min-w-0">
    <p className={cn(MICRO, MUTED)}>{label}</p>
    <p
      className={cn(
        NUM,
        'mt-0.5 truncate text-[11px] font-bold text-stone-800 dark:text-stone-100'
      )}
    >
      {children}
    </p>
  </div>
);

function EvidenceBlock({ evidence }) {
  const usage = evidence.usage || {};
  const meta = verdictMeta(evidence.verdict);
  const remaining = windowRemaining(evidence.windowEndsAt);
  const endpoints = (usage.byEndpoint || []).filter((row) => row.delivered + row.notDelivered > 0);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={meta.tone}>{meta.label}</Pill>
        <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">
          {meta.title}
        </span>
      </div>

      <div
        className={cn(WELL, 'grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-lg p-2.5 sm:grid-cols-4')}
      >
        <Fact label="Activated">{formatDateTime(evidence.paidAt)}</Fact>
        <Fact label="Window">
          {remaining ? `${remaining} left` : `closed ${formatDate(evidence.windowEndsAt)}`}
        </Fact>
        <Fact label="AI results after">
          {usage.learnerDelivered ?? 0}
          {usage.learnerNotDelivered ? ` (+${usage.learnerNotDelivered} failed)` : ''}
        </Fact>
        <Fact label="First AI use">
          {usage.firstLearnerUseAt ? `+${formatElapsed(usage.minutesToFirstUse)}` : 'none'}
        </Fact>
        <Fact label="Tests started">{usage.testsStarted ?? 0}</Fact>
        <Fact label="Skill Lab">{usage.skillLabSessions ?? 0}</Fact>
        <Fact label="Sessions opened">{usage.sessionsOpened ?? 0}</Fact>
        <Fact label="Our AI cost">${Number(usage.providerCostUsd || 0).toFixed(4)}</Fact>
        <Fact label="First purchase">{evidence.isFirstPurchase ? 'yes' : 'no'}</Fact>
      </div>

      {evidence.reasons?.length > 0 && (
        <ul className="space-y-1">
          {evidence.reasons.map((reason) => (
            <li key={reason} className={cn(BODY, 'flex gap-1.5')}>
              <span
                aria-hidden="true"
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-stone-400"
              />
              {reason}
            </li>
          ))}
        </ul>
      )}

      {endpoints.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {endpoints.map((row) => (
            <span
              key={row.endpoint}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
                row.class === 'background' || row.class === 'session'
                  ? 'border-stone-200 text-stone-500 dark:border-white/10 dark:text-stone-400'
                  : 'border-stone-300 text-stone-700 dark:border-white/15 dark:text-stone-200'
              )}
            >
              {endpointLabel(row.endpoint)}
              <span className={NUM}>×{row.delivered}</span>
            </span>
          ))}
        </div>
      )}

      {!evidence.evidenceComplete && (
        <p className={cn(BODY, 'text-[rgb(var(--signal-warn))]')}>
          Evidence is partial: records older than six months, or of a deleted account, are removed.
        </p>
      )}
    </div>
  );
}

function PaymentCard({ payment, onRefund }) {
  const evidence = payment.evidence;
  const canRefund = payment.status === 'approved' && Number(evidence?.refundableAmount) > 0;

  return (
    <div className="space-y-3 px-3.5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}>
            {formatMoney(payment.amount, payment.currency)}
            <span className={cn(MICRO, MUTED, 'ml-2')}>
              {payment.tier} · {payment.interval}
            </span>
          </p>
          <p className={cn(NUM, 'mt-0.5 truncate text-[10px] text-stone-500 dark:text-stone-400')}>
            {providerLabel(payment.provider)} · {payment.transactionId}
            {payment.senderPhone && payment.provider !== 'stripe'
              ? ` · ${payment.senderPhone}`
              : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={PAYMENT_STATUS_TONE[payment.status] || 'neutral'}>{payment.status}</Pill>
          {canRefund && (
            <AdminButton size="sm" variant="outline" onClick={() => onRefund(payment)}>
              <ReceiptText className="h-3 w-3" />
              Refund
            </AdminButton>
          )}
        </div>
      </div>
      {evidence ? (
        <EvidenceBlock evidence={evidence} />
      ) : (
        <p className={BODY}>
          Submitted {formatDateTime(payment.submittedAt)}. Evidence is shown once a payment is
          approved.
        </p>
      )}
    </div>
  );
}

function UsageSection({ usage }) {
  const last30 = usage?.last30Days || {};
  const daily = usage?.daily || [];
  const peak = Math.max(1, ...daily.map((day) => day.learner + day.background + day.failed));

  return (
    <Section label="AI usage · last 30 days">
      <StatRail className="grid-cols-2 sm:grid-cols-4">
        <StatCell label="Results delivered" value={last30.learnerDelivered ?? 0} />
        <StatCell label="Failed / unfinished" value={last30.learnerNotDelivered ?? 0} />
        <StatCell
          label="Automatic"
          value={last30.background ?? 0}
          tip="Learning-path refreshes the learner did not ask for. They never decide a refund."
        />
        <StatCell label="Our cost" value={`$${Number(last30.providerCostUsd || 0).toFixed(4)}`} />
      </StatRail>

      <div className="px-3.5 pt-3">
        <div className="flex h-12 items-end gap-[3px]" aria-label="Daily AI requests, last 30 days">
          {daily.map((day) => {
            const total = day.learner + day.background + day.failed;
            return (
              <div
                key={day.day}
                title={`${day.day}: ${day.learner} learner, ${day.background} automatic, ${day.failed} failed`}
                className="flex flex-1 flex-col justify-end overflow-hidden rounded-[2px] bg-stone-100 dark:bg-white/[0.04]"
                style={{ height: '100%' }}
              >
                <div
                  className="w-full bg-stone-500/70 dark:bg-stone-300/60"
                  style={{ height: `${(100 * total) / peak}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {usage?.recent?.length ? (
        <div className="overflow-x-auto px-3.5 pb-3 pt-3">
          <table className="w-full min-w-[460px] text-left">
            <thead>
              <tr className={cn(MICRO, MUTED)}>
                <th className="pb-1.5 font-bold">When</th>
                <th className="pb-1.5 font-bold">Feature</th>
                <th className="pb-1.5 font-bold">Result</th>
                <th className="pb-1.5 font-bold">Model</th>
                <th className="pb-1.5 text-right font-bold">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {usage.recent.map((call, index) => (
                <tr
                  key={`${call.createdAt}-${index}`}
                  className="text-[11px] text-stone-700 dark:text-stone-200"
                >
                  <td className={cn(NUM, 'py-1.5 pr-2 text-[10px] text-stone-500')}>
                    {formatDateTime(call.createdAt)}
                  </td>
                  <td className="py-1.5 pr-2 font-semibold">
                    {endpointLabel(call.endpoint)}
                    {call.class === 'admin' && (
                      <span className={cn(MICRO, MUTED, 'ml-1')}>admin</span>
                    )}
                    {call.class === 'session' && (
                      <span className={cn(MICRO, MUTED, 'ml-1')}>no AI</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-2">
                    <Pill
                      tone={
                        call.class === 'session' && call.status === 'completed'
                          ? 'neutral'
                          : call.status === 'completed'
                            ? 'ok'
                            : call.status === 'failed'
                              ? 'fault'
                              : 'warn'
                      }
                    >
                      {call.class === 'session' && call.status === 'completed'
                        ? 'opened'
                        : call.status === 'completed'
                          ? call.cached
                            ? 'cached'
                            : 'delivered'
                          : call.status}
                    </Pill>
                  </td>
                  <td
                    className={cn(
                      NUM,
                      'max-w-[140px] truncate py-1.5 pr-2 text-[10px] text-stone-500'
                    )}
                  >
                    {call.model || '—'}
                  </td>
                  <td className={cn(NUM, 'py-1.5 text-right text-[10px]')}>
                    {call.costUsd === null || call.costUsd === undefined ? '—' : `$${call.costUsd}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty icon={Sparkles} title="No AI requests on record">
          Nothing in the last six months. Requests appear here as soon as the learner uses an AI
          feature.
        </Empty>
      )}
    </Section>
  );
}

function RefundHistory({ refunds }) {
  if (!refunds?.length) {
    return <p className={cn(BODY, 'px-3.5 py-3')}>No refunds or chargebacks on this account.</p>;
  }
  return (
    <ul className="divide-y divide-stone-100 dark:divide-white/5">
      {refunds.map((refund) => (
        <li
          key={refund.id}
          className="flex flex-wrap items-start justify-between gap-2 px-3.5 py-2.5"
        >
          <div className="min-w-0">
            <p className={cn(NUM, 'text-[12px] font-bold text-stone-900 dark:text-stone-50')}>
              {formatMoney(refund.amount, refund.currency)}
              <span className={cn(MICRO, MUTED, 'ml-2')}>
                {refund.kind} · {providerLabel(refund.provider)} ·{' '}
                {refund.reason.replace(/_/g, ' ')}
              </span>
            </p>
            <p className={cn(BODY, 'mt-0.5 text-[10px]')}>
              {formatDateTime(refund.createdAt)}
              {refund.initiatedBy ? ` · by ${refund.initiatedBy}` : ''}
              {refund.providerRefundRef ? ` · ${refund.providerRefundRef}` : ''}
              {refund.accessEndedAt ? ' · access ended' : ''}
            </p>
            {refund.failureReason && (
              <p className="mt-0.5 text-[10px] font-semibold text-[rgb(var(--signal-fault))]">
                {refund.failureReason}
              </p>
            )}
          </div>
          <Pill tone={REFUND_STATUS_TONE[refund.status] || 'neutral'}>
            {refundStatusLabel(refund)}
          </Pill>
        </li>
      ))}
    </ul>
  );
}

/**
 * Everything an admin needs to answer a refund email about one account:
 * payments with their refund verdicts, AI usage, and the refund ledger.
 */
export default function CustomerBillingSheet({ userId, open, onOpenChange, onChanged }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [endingAccess, setEndingAccess] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      setProfile(await BillingService.getCustomerProfile(userId));
    } catch (loadError) {
      setError(loadError.message || 'Could not load this account');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setConfirmEnd(false);
    if (open) load();
    else setProfile(null);
  }, [open, load]);

  const refresh = () => {
    load();
    onChanged?.();
  };

  const subscription = profile?.subscription || {};
  const isPaid = PAID_TIERS.has(subscription.tier);

  const endAccess = async () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      return;
    }
    try {
      setEndingAccess(true);
      await BillingService.endPaidAccess({ userId });
      toast.success('Paid access ended');
      refresh();
    } catch (endError) {
      toast.error(endError.message || 'Access could not be ended');
    } finally {
      setEndingAccess(false);
      setConfirmEnd(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-stone-200 bg-stone-50 p-0 dark:border-white/10 dark:bg-[#0f0f11] sm:max-w-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-stone-200/80 bg-stone-50 px-4 py-3 pr-12 dark:border-white/[0.07] dark:bg-[#0f0f11]">
          <SheetTitle className={TITLE}>
            {profile?.user?.fullName || profile?.user?.email || 'Customer'}
          </SheetTitle>
          <SheetDescription className={cn(NUM, 'text-[11px] text-stone-500 dark:text-stone-400')}>
            {profile?.user?.email || 'Billing, refunds and AI usage'}
          </SheetDescription>
        </div>

        <div className="space-y-3 p-4">
          {loading && !profile && (
            <div className="flex items-center justify-center gap-2 py-16">
              <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              <span className={cn(MICRO, MUTED)}>Loading account</span>
            </div>
          )}

          {error && (
            <Empty
              icon={Ban}
              title="Could not load this account"
              action={
                <AdminButton size="sm" variant="outline" onClick={load}>
                  Try again
                </AdminButton>
              }
            >
              {error}
            </Empty>
          )}

          {profile && (
            <>
              <Section
                label="Plan"
                action={
                  <div className="flex items-center gap-1.5">
                    <AdminButton
                      size="sm"
                      variant="ghost"
                      onClick={load}
                      aria-label="Refresh account"
                    >
                      <RefreshCcw className={cn('h-3 w-3', loading && 'animate-spin')} />
                    </AdminButton>
                    {isPaid && (
                      <AdminButton
                        size="sm"
                        variant="destructive"
                        onClick={endAccess}
                        onBlur={() => setConfirmEnd(false)}
                        loading={endingAccess}
                      >
                        {confirmEnd ? 'Confirm: drop to free now' : 'End paid access'}
                      </AdminButton>
                    )}
                  </div>
                }
              >
                <StatRail className="grid-cols-2 sm:grid-cols-4">
                  <StatCell label="Plan">
                    <Pill tone={isPaid ? 'ok' : 'neutral'}>{subscription.tier}</Pill>
                  </StatCell>
                  <StatCell
                    label={subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews / ends'}
                    value={isPaid ? formatDate(subscription.endDate) : '—'}
                  />
                  <StatCell label="First paid" value={formatDate(profile.facts?.firstPaidAt)} />
                  <StatCell
                    label="Refunds on record"
                    value={profile.facts?.refundsSucceeded ?? 0}
                    tip="Counted for the life of the account, even after the six-month record purge."
                  />
                </StatRail>
                <div className="flex flex-wrap gap-x-4 gap-y-1 px-3.5 py-2.5">
                  <span className={cn(BODY, 'flex items-center gap-1')}>
                    <Clock className="h-3 w-3" /> Joined {formatDate(profile.user?.createdAt)}
                  </span>
                  <span className={cn(BODY, 'flex items-center gap-1')}>
                    <History className="h-3 w-3" /> Last active{' '}
                    {formatDateTime(profile.user?.lastActive)}
                  </span>
                  {subscription.hasStripeSubscription && (
                    <span className={cn(BODY, 'flex items-center gap-1')}>
                      <CreditCard className="h-3 w-3" /> Stripe subscription
                      {subscription.cancelAtPeriodEnd ? ' (cancelling)' : ''}
                    </span>
                  )}
                  {subscription.paymentFailedAt && (
                    <span className="text-[11px] font-semibold text-[rgb(var(--signal-fault))]">
                      Payment failed {formatDate(subscription.paymentFailedAt)}
                    </span>
                  )}
                </div>
              </Section>

              <Section label={`Payments · ${profile.payments?.length || 0}`}>
                {profile.payments?.length ? (
                  <div className="divide-y divide-stone-100 dark:divide-white/5">
                    {profile.payments.map((payment) => (
                      <PaymentCard key={payment.id} payment={payment} onRefund={setRefundTarget} />
                    ))}
                  </div>
                ) : (
                  <p className={cn(BODY, 'px-3.5 py-3')}>
                    No payments in the last six months.
                    {profile.facts?.firstPaidAt ? ' Older payments have been purged.' : ''}
                  </p>
                )}
              </Section>

              <Section label="Refunds & chargebacks">
                <RefundHistory refunds={profile.refunds} />
              </Section>

              <UsageSection usage={profile.usage} />

              <p className={cn(BODY, 'px-1 text-[10px]')}>
                Payment, refund and AI-usage records are kept for{' '}
                {Math.round((profile.retentionDays || 180) / 30)} months.
                {profile.usage?.oldestRecordAt
                  ? ` Oldest AI record for this account: ${formatDate(profile.usage.oldestRecordAt)}.`
                  : ''}
              </p>
            </>
          )}
        </div>

        <RefundDialog
          payment={refundTarget}
          userId={userId}
          open={Boolean(refundTarget)}
          onOpenChange={(next) => !next && setRefundTarget(null)}
          onDone={refresh}
        />
      </SheetContent>
    </Sheet>
  );
}
