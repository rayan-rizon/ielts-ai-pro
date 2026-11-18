import { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  ExternalLink,
  Info,
  Loader2,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { BillingService } from '@/features/admin/services/BillingService';
import {
  AdminButton,
  BODY,
  CopyButton,
  Empty,
  MICRO,
  MUTED,
  NUM,
  Notice,
  PANEL,
  Pill,
  SectionLabel,
  StatCell,
  StatRail,
  Tip,
  TITLE,
} from '../ui/primitives';
import RefundDialog from './RefundDialog';
import {
  REFUND_STATUS_TONE,
  UNUSED_PURCHASE_VERDICTS,
  endpointLabel,
  formatDate,
  formatDateTime,
  formatElapsed,
  formatMoney,
  getProviderUrl,
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

const Section = ({ label, children, action, className }) => (
  <section className={cn(PANEL, 'overflow-hidden', className)}>
    <div className="flex items-center justify-between gap-2 border-b border-stone-200/80 px-3.5 py-2.5 dark:border-white/[0.07]">
      <SectionLabel>{label}</SectionLabel>
      {action}
    </div>
    {children}
  </section>
);

const Fact = ({ label, children, isMono = false, className }) => (
  <div className={cn('min-w-0', className)}>
    <p className={cn(MICRO, MUTED, 'truncate')}>{label}</p>
    <p
      className={cn(
        'mt-0.5 text-[11px] font-semibold text-stone-800 dark:text-stone-100 leading-snug',
        isMono && NUM
      )}
    >
      {children}
    </p>
  </div>
);

const TONE_TEXT = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  fault: 'text-rose-600 dark:text-rose-400',
  accent: 'text-indigo-600 dark:text-indigo-400',
  neutral: 'text-stone-600 dark:text-stone-300',
};
const TONE_FILL = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  fault: 'bg-rose-500',
  accent: 'bg-indigo-500',
  neutral: 'bg-stone-400 dark:bg-stone-500',
};

/** How far through the 7-day window a payment is, 0–1. */
function windowProgress(evidence, now = Date.now()) {
  const start = new Date(evidence.paidAt).getTime();
  const end = new Date(evidence.windowEndsAt).getTime();
  if (!start || !end || end <= start) return null;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

function WindowMeter({ evidence, tone }) {
  const progress = windowProgress(evidence);
  if (progress === null) return null;
  const remaining = windowRemaining(evidence.windowEndsAt);
  return (
    <div
      role="img"
      aria-label={remaining ? `${remaining} left in refund window` : 'Refund window closed'}
      className="h-1 overflow-hidden rounded-full bg-stone-200/80 dark:bg-white/[0.08]"
    >
      <div
        className={cn(
          'h-full origin-left rounded-full transition-transform duration-300 ease-out',
          remaining ? TONE_FILL[tone] : 'bg-stone-400 dark:bg-stone-500'
        )}
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

function EvidenceBlock({ evidence, action }) {
  const usage = evidence.usage || {};
  const meta = verdictMeta(evidence.verdict);
  const endpoints = (usage.byEndpoint || []).filter((row) => row.delivered + row.notDelivered > 0);
  const remaining = windowRemaining(evidence.windowEndsAt);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={cn('h-2 w-2 shrink-0 rounded-full', TONE_FILL[meta.tone])}
          />
          <p title={meta.detail} className={cn('truncate text-xs font-bold', TONE_TEXT[meta.tone])}>
            {meta.title}
          </p>
        </div>
        {action}
      </div>

      <WindowMeter evidence={evidence} tone={meta.tone} />

      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-600 dark:text-stone-300">
        <span>
          {remaining ? `${remaining} left` : `Window closed ${formatDate(evidence.windowEndsAt)}`}
        </span>
        <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">
          /
        </span>
        <span className={NUM}>{usage.learnerDelivered ?? 0} AI results</span>
        <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">
          /
        </span>
        <span className={NUM}>{usage.testsStarted ?? 0} tests</span>
      </p>

      <details className="group text-[11px]">
        <summary className="inline-flex cursor-pointer select-none list-none items-center gap-1 rounded-sm font-semibold text-[#5a63df] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-[#afb5ff]">
          <span className="group-open:hidden">Details</span>
          <span className="hidden group-open:inline">Hide details</span>
        </summary>
        <div className="mt-1.5 space-y-1 leading-relaxed text-stone-600 dark:text-stone-300">
          {meta.detail && <p>{meta.detail}</p>}
          <p>
            {evidence.isFirstPurchase ? 'First purchase.' : 'Repeat purchase.'}{' '}
            {usage.firstLearnerUseAt
              ? `First AI use ${formatElapsed(usage.minutesToFirstUse)} after payment.`
              : 'No AI use since payment.'}
            {usage.learnerNotDelivered ? ` ${usage.learnerNotDelivered} results failed.` : ''} Skill
            Lab {usage.skillLabSessions ?? 0}, sessions {usage.sessionsOpened ?? 0}, API cost $
            {Number(usage.providerCostUsd || 0).toFixed(4)}.
          </p>
          {endpoints.length > 0 && (
            <p>
              Automated activity does not disqualify a refund:{' '}
              {endpoints
                .map((row) => `${endpointLabel(row.endpoint)} ×${row.delivered}`)
                .join(', ')}
              .
            </p>
          )}
        </div>
      </details>

      {!evidence.evidenceComplete && (
        <Notice tone="warn" title="Evidence is partial">
          Records older than six months, or of a deleted account, have been purged according to
          retention policy.
        </Notice>
      )}
    </div>
  );
}

function PaymentCard({ payment, onRefund }) {
  const evidence = payment.evidence;
  const canRefund = payment.status === 'approved' && Number(evidence?.refundableAmount) > 0;
  const qualifies = evidence && UNUSED_PURCHASE_VERDICTS.has(evidence.verdict);
  const stripeUrl = getProviderUrl(payment.provider, payment.transactionId);

  const refundAction = canRefund ? (
    <AdminButton
      size="sm"
      variant={qualifies ? 'primary' : 'outline'}
      onClick={() => onRefund(payment)}
      className="shrink-0"
    >
      <ReceiptText className="h-3 w-3" />
      {qualifies
        ? `Refund ${formatMoney(evidence.refundableAmount, payment.currency)}`
        : 'Refund anyway'}
    </AdminButton>
  ) : null;

  return (
    <div className="space-y-2 px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2 text-stone-900 dark:text-stone-50">
            <span className={cn(NUM, 'text-base font-extrabold')}>
              {formatMoney(payment.amount, payment.currency)}
            </span>
            <span className="text-xs font-semibold capitalize text-stone-600 dark:text-stone-300">
              {payment.tier} {payment.interval}
            </span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              {providerLabel(payment.provider)}
            </span>
            <span className={cn(NUM, 'max-w-[190px] truncate text-[10px] sm:max-w-[320px]')}>
              {payment.transactionId}
            </span>
            {payment.transactionId && (
              <CopyButton value={payment.transactionId} label="Copy transaction ID" />
            )}
            {stripeUrl && (
              <Tip content="Open in Stripe Dashboard">
                <a
                  href={stripeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open in Stripe Dashboard"
                  className="inline-flex items-center rounded-sm text-stone-400 transition-colors hover:text-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:hover:text-[#afb5ff]"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Tip>
            )}
            {payment.senderPhone && payment.provider !== 'stripe' && (
              <span className={cn(NUM, 'text-[10px]')}>{payment.senderPhone}</span>
            )}
          </div>
        </div>
        <Pill tone={PAYMENT_STATUS_TONE[payment.status] || 'neutral'} className="shrink-0">
          {payment.status}
        </Pill>
      </div>

      {evidence ? (
        <EvidenceBlock evidence={evidence} action={refundAction} />
      ) : (
        <p className={BODY}>
          Submitted {formatDateTime(payment.submittedAt)}. Refund details appear once the payment is
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
        <StatCell
          label="Failed / unfinished"
          value={last30.learnerNotDelivered ?? 0}
          tone={last30.learnerNotDelivered ? 'fault' : undefined}
        />
        <StatCell
          label="Automatic"
          value={last30.background ?? 0}
          tip="Learning-path refreshes the learner did not ask for. They never decide a refund."
        />
        <StatCell label="Our cost" value={`$${Number(last30.providerCostUsd || 0).toFixed(4)}`} />
      </StatRail>

      {/* 30-Day Activity Chart */}
      <div className="px-3.5 pt-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className={cn(MICRO, MUTED)}>Daily request volume</span>
          <div className="flex items-center gap-3 text-[10px] text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-stone-700 dark:bg-stone-300" /> Learner
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-stone-400/50 dark:bg-stone-500/50" /> Automatic
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-[rgb(var(--signal-fault))]" /> Failed
            </span>
          </div>
        </div>

        <div className="flex h-12 items-end gap-[3px] border-b border-stone-200/80 pb-0.5 dark:border-white/[0.07]">
          {daily.map((day) => {
            const total = day.learner + day.background + day.failed;
            const tooltipContent = `${day.day}: ${day.learner} learner, ${day.background} automatic${day.failed ? `, ${day.failed} failed` : ''}`;
            const fillHeight = peak > 0 && total > 0 ? Math.max(8, (100 * total) / peak) : 0;

            return (
              <Tip key={day.day} content={tooltipContent} side="top">
                <div
                  className="flex flex-1 flex-col justify-end overflow-hidden rounded-[2px] bg-stone-100/80 dark:bg-white/[0.04] transition-colors hover:bg-stone-200/80 dark:hover:bg-white/[0.08] cursor-pointer"
                  style={{ height: '100%' }}
                >
                  {fillHeight > 0 && (
                    <div
                      className={cn(
                        'w-full transition-all duration-300',
                        day.failed > 0
                          ? 'bg-[rgb(var(--signal-fault))]'
                          : day.learner > 0
                            ? 'bg-stone-700 dark:bg-stone-200'
                            : 'bg-stone-400/60 dark:bg-stone-500/60'
                      )}
                      style={{ height: `${fillHeight}%` }}
                    />
                  )}
                </div>
              </Tip>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className={cn(MICRO, MUTED)}>30 days ago</span>
          <span className={cn(MICRO, MUTED)}>Today</span>
        </div>
      </div>

      {usage?.recent?.length ? (
        <div className="overflow-x-auto px-3.5 pb-3.5 pt-3">
          <table className="w-full min-w-[460px] text-left">
            <thead>
              <tr className={cn(MICRO, MUTED, 'border-b border-stone-100 dark:border-white/5')}>
                <th className="pb-2 font-bold">When</th>
                <th className="pb-2 font-bold">Feature</th>
                <th className="pb-2 font-bold">Result</th>
                <th className="pb-2 font-bold">Model</th>
                <th className="pb-2 text-right font-bold">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {usage.recent.map((call, index) => (
                <tr
                  key={`${call.createdAt}-${index}`}
                  className="text-[11px] text-stone-700 transition-colors hover:bg-stone-50/60 dark:text-stone-200 dark:hover:bg-white/[0.02]"
                >
                  <td className={cn(NUM, 'py-2 pr-2 text-[10px] text-stone-500')}>
                    {formatDateTime(call.createdAt)}
                  </td>
                  <td className="py-2 pr-2 font-medium">
                    {endpointLabel(call.endpoint)}
                    {call.class === 'admin' && (
                      <span className={cn(MICRO, MUTED, 'ml-1.5 font-bold')}>admin</span>
                    )}
                    {call.class === 'session' && (
                      <span className={cn(MICRO, MUTED, 'ml-1.5 font-bold')}>no AI</span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <Pill
                      tone={
                        call.class === 'session' && call.status === 'completed'
                          ? 'neutral'
                          : call.status === 'completed'
                            ? call.cached
                              ? 'neutral'
                              : 'ok'
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
                      'max-w-[140px] truncate py-2 pr-2 text-[10px] text-stone-500'
                    )}
                  >
                    {call.model || '—'}
                  </td>
                  <td className={cn(NUM, 'py-2 text-right text-[10px] font-semibold')}>
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
    return (
      <div className="flex items-center gap-2.5 px-3.5 py-3 text-stone-600 dark:text-stone-300">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className={cn(BODY, 'text-xs')}>No refunds or chargebacks on this account.</p>
      </div>
    );
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
        hideClose
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-full overflow-y-auto border-stone-200 bg-stone-50 p-0 dark:border-white/10 dark:bg-[#0f0f11] sm:max-w-2xl"
      >
        {/* Sticky Sheet Header */}
        <div className="sticky top-0 z-20 border-b border-stone-200/80 bg-stone-50/95 px-3.5 py-3 backdrop-blur-xs dark:border-white/[0.07] dark:bg-[#0f0f11]/95 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200/80 bg-white font-extrabold text-stone-700 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-stone-200">
                {(profile?.user?.fullName || profile?.user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SheetTitle className={cn(TITLE, 'truncate text-sm')}>
                    {profile?.user?.fullName || profile?.user?.email || 'Customer'}
                  </SheetTitle>
                  {subscription.tier && (
                    <Pill tone={isPaid ? 'ok' : 'neutral'} className="shrink-0 text-[9px]">
                      {subscription.tier}
                    </Pill>
                  )}
                </div>
                <SheetDescription className="sr-only">
                  Customer billing, refunds and AI usage details
                </SheetDescription>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500 dark:text-stone-400">
                  <span className="truncate max-w-[170px] sm:max-w-[260px]">
                    {profile?.user?.email || 'No email on file'}
                  </span>
                  {profile?.user?.email && (
                    <CopyButton value={profile.user.email} label="Copy email" />
                  )}
                  {userId && (
                    <>
                      <span className="text-stone-300 dark:text-stone-600">·</span>
                      <span className={cn(NUM, 'text-[10px] text-stone-400 dark:text-stone-500')}>
                        ID: {userId.slice(0, 8)}…
                      </span>
                      <CopyButton value={userId} label="Copy User ID" />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Header Close Button */}
            <div className="flex shrink-0 items-center">
              <SheetClose asChild>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200/80 bg-white text-stone-500 shadow-2xs transition-all duration-150 ease-smooth-out hover:bg-stone-100 hover:text-stone-900 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-stone-100"
                  aria-label="Close review"
                  title="Close (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </SheetClose>
            </div>
          </div>
        </div>

        <div className="space-y-3.5 p-4">
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
              {/* Account summary */}
              {subscription.paymentFailedAt && (
                <Notice tone="fault" title="Last payment failed">
                  Stripe could not charge this account on {formatDate(subscription.paymentFailedAt)}
                  .
                </Notice>
              )}
              <Section
                label="Account"
                action={
                  <AdminButton
                    size="sm"
                    variant="ghost"
                    onClick={load}
                    aria-label="Refresh account"
                  >
                    <RefreshCcw className={cn('h-3 w-3', loading && 'animate-spin')} />
                  </AdminButton>
                }
              >
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-3.5 py-3 sm:grid-cols-3">
                  <Fact label={subscription.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}>
                    {isPaid ? formatDate(subscription.endDate) : 'Free plan'}
                  </Fact>
                  <Fact label="First paid">{formatDate(profile.facts?.firstPaidAt)}</Fact>
                  <Fact label="Refunds so far" isMono>
                    {profile.facts?.refundsSucceeded ?? 0}
                  </Fact>
                  <Fact label="Joined">{formatDate(profile.user?.createdAt)}</Fact>
                  <Fact label="Last active">{formatDateTime(profile.user?.lastActive)}</Fact>
                  <Fact label="Billing">
                    {subscription.hasStripeSubscription
                      ? `Stripe${subscription.cancelAtPeriodEnd ? ', cancelling' : ''}`
                      : 'One-time'}
                  </Fact>
                </dl>
              </Section>

              {/* Payments Section */}
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

              {/* Refunds & Chargebacks Section */}
              <Section label="Refunds & chargebacks">
                <RefundHistory refunds={profile.refunds} />
              </Section>

              {/* AI Usage Section */}
              <UsageSection usage={profile.usage} />

              {/* Account actions: destructive, so it sits last and asks twice */}
              {isPaid && (
                <Section label="Account actions">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3">
                    <p className={cn(BODY, 'min-w-0 flex-1 basis-56 text-[11px]')}>
                      {confirmEnd
                        ? 'This moves the learner to the Free plan right away. Click again to confirm.'
                        : 'Moves the learner to the Free plan right away. Does not refund any payment.'}
                    </p>
                    <AdminButton
                      size="sm"
                      variant="destructive"
                      onClick={endAccess}
                      onBlur={() => setConfirmEnd(false)}
                      loading={endingAccess}
                    >
                      {confirmEnd ? 'Confirm: end access' : 'End paid access'}
                    </AdminButton>
                  </div>
                </Section>
              )}

              {/* Retention Footnote */}
              <div className="flex items-start gap-2 rounded-lg border border-stone-200/80 bg-stone-50/70 p-3 text-[11px] text-stone-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-stone-400">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-stone-400" />
                <p className="leading-relaxed">
                  Payment, refund and AI-usage records are retained for{' '}
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    {Math.round((profile.retentionDays || 180) / 30)} months
                  </span>
                  .{' '}
                  {profile.usage?.oldestRecordAt
                    ? `Oldest AI record on file: ${formatDate(profile.usage.oldestRecordAt)}.`
                    : ''}
                </p>
              </div>
            </>
          )}

          {/* Mobile bottom dismiss action */}
          <div className="pt-2 pb-6 sm:hidden">
            <SheetClose asChild>
              <AdminButton variant="outline" className="w-full h-9 text-xs">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Close review
              </AdminButton>
            </SheetClose>
          </div>
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
