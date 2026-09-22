import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Clock,
  CreditCard,
  ExternalLink,
  History,
  Info,
  Loader2,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
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
  formatReason,
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

function EvidenceBlock({ evidence }) {
  const usage = evidence.usage || {};
  const meta = verdictMeta(evidence.verdict);
  const remaining = windowRemaining(evidence.windowEndsAt);
  const endpoints = (usage.byEndpoint || []).filter((row) => row.delivered + row.notDelivered > 0);
  const refundable = Number(evidence.refundableAmount || 0);

  const VerdictIcon =
    {
      ok: ShieldCheck,
      warn: AlertTriangle,
      fault: Ban,
      accent: ReceiptText,
      neutral: Clock,
    }[meta.tone] || Info;

  return (
    <div className="space-y-3">
      {/* Verdict Announcement Card */}
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3',
          meta.tone === 'ok' && 'border-emerald-500/30 bg-emerald-500/[0.05]',
          meta.tone === 'warn' && 'border-amber-500/30 bg-amber-500/[0.05]',
          meta.tone === 'fault' && 'border-rose-500/30 bg-rose-500/[0.05]',
          meta.tone === 'accent' && 'border-indigo-500/30 bg-indigo-500/[0.05]',
          meta.tone === 'neutral' &&
            'border-stone-200 bg-stone-100/70 dark:border-white/10 dark:bg-white/[0.03]'
        )}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <VerdictIcon
            className={cn(
              'h-4 w-4 shrink-0 mt-0.5',
              meta.tone === 'ok' && 'text-emerald-600 dark:text-emerald-400',
              meta.tone === 'warn' && 'text-amber-600 dark:text-amber-400',
              meta.tone === 'fault' && 'text-rose-600 dark:text-rose-400',
              meta.tone === 'accent' && 'text-indigo-600 dark:text-indigo-400',
              meta.tone === 'neutral' && 'text-stone-500 dark:text-stone-400'
            )}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Pill tone={meta.tone}>{meta.label}</Pill>
              <span className="text-xs font-bold text-stone-900 dark:text-stone-50">
                {meta.title}
              </span>
            </div>
            {meta.detail && (
              <p className="mt-0.5 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
                {meta.detail}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 sm:text-right pl-6 sm:pl-0">
          <span className={cn(MICRO, MUTED, 'block')}>Refund policy</span>
          <span
            className={cn(
              NUM,
              'text-xs font-bold',
              refundable > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-stone-500 dark:text-stone-400'
            )}
          >
            {refundable > 0 ? `$${refundable.toFixed(2)} refundable` : 'Non-refundable'}
          </span>
        </div>
      </div>

      {/* Structured Evidence Clusters */}
      <div className={cn(WELL, 'rounded-lg p-3 space-y-3')}>
        {/* Tier 1: Window & Policy Facts */}
        <div>
          <span className={cn(MICRO, MUTED, 'block mb-2')}>Window & eligibility</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Fact label="Activated" isMono>
              {formatDateTime(evidence.paidAt)}
            </Fact>
            <Fact label="7-Day Window">
              {remaining ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {remaining} remaining
                </span>
              ) : (
                `Closed on ${formatDate(evidence.windowEndsAt)}`
              )}
            </Fact>
            <Fact label="Order History">
              {evidence.isFirstPurchase ? 'First purchase on account' : 'Repeat purchase'}
            </Fact>
          </div>
        </div>

        <div className="h-px bg-stone-200/70 dark:bg-white/[0.06]" />

        {/* Tier 2: Learner Activity */}
        <div>
          <span className={cn(MICRO, MUTED, 'block mb-2')}>Activity since payment</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Fact label="AI results delivered" isMono>
              {usage.learnerDelivered ?? 0}
              {usage.learnerNotDelivered ? (
                <span className="text-rose-500 font-normal ml-1">
                  (+{usage.learnerNotDelivered} failed)
                </span>
              ) : (
                ''
              )}
            </Fact>
            <Fact label="First AI use">
              {usage.firstLearnerUseAt
                ? `+${formatElapsed(usage.minutesToFirstUse)} after payment`
                : 'None'}
            </Fact>
            <Fact label="Tests started" isMono>
              {usage.testsStarted ?? 0}
            </Fact>
            <Fact label="Skill Lab / Sessions" isMono>
              {usage.skillLabSessions ?? 0} lab · {usage.sessionsOpened ?? 0} opened
            </Fact>
          </div>
        </div>

        <div className="h-px bg-stone-200/70 dark:bg-white/[0.06]" />

        {/* Tier 3: AI Provider Cost */}
        <div className="flex items-center justify-between text-[11px]">
          <span className={cn(MICRO, MUTED)}>API cost incurred for this user</span>
          <span className={cn(NUM, 'font-bold text-stone-800 dark:text-stone-100')}>
            ${Number(usage.providerCostUsd || 0).toFixed(4)}
          </span>
        </div>
      </div>

      {/* Formatted Policy Rule Highlights */}
      {evidence.reasons?.length > 0 && (
        <div className="space-y-1.5">
          {evidence.reasons.map((reason) => (
            <div
              key={reason}
              className="flex items-start gap-2 rounded-md border border-stone-200/80 bg-stone-50/80 px-2.5 py-1.5 text-[11px] text-stone-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-300"
            >
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500" />
              <span className="leading-snug">{formatReason(reason)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Feature endpoints list */}
      {endpoints.length > 0 && (
        <div className="pt-0.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={cn(MICRO, MUTED)}>Background & automated activity</span>
            <Tip content="Background refreshes and automated paths do not disqualify refund requests.">
              <span className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-help">
                <Info className="w-3 h-3" />
              </span>
            </Tip>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {endpoints.map((row) => (
              <span
                key={row.endpoint}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold',
                  row.class === 'background' || row.class === 'session'
                    ? 'border-stone-200 text-stone-500 dark:border-white/10 dark:text-stone-400 bg-stone-50 dark:bg-white/[0.02]'
                    : 'border-stone-300 text-stone-700 dark:border-white/15 dark:text-stone-200 bg-white dark:bg-white/[0.05]'
                )}
              >
                {endpointLabel(row.endpoint)}
                <span className={cn(NUM, 'text-stone-400 dark:text-stone-500')}>
                  ×{row.delivered}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

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
  const stripeUrl = getProviderUrl(payment.provider, payment.transactionId);

  return (
    <div className="space-y-3 px-3.5 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(NUM, 'text-base font-extrabold text-stone-900 dark:text-stone-50')}>
              {formatMoney(payment.amount, payment.currency)}
            </span>
            <Pill tone="neutral" className="capitalize text-[10px]">
              {payment.tier}
            </Pill>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {payment.interval}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              {providerLabel(payment.provider)}
            </span>
            <span>·</span>
            <span className={cn(NUM, 'text-[10px] truncate max-w-[200px] sm:max-w-none')}>
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
                  className="inline-flex items-center text-stone-400 hover:text-[#5a63df] dark:hover:text-[#afb5ff] transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Tip>
            )}
            {payment.senderPhone && payment.provider !== 'stripe' && (
              <>
                <span>·</span>
                <span className={cn(NUM, 'text-[10px]')}>{payment.senderPhone}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Pill tone={PAYMENT_STATUS_TONE[payment.status] || 'neutral'}>{payment.status}</Pill>
          {canRefund && (
            <AdminButton size="sm" variant="outline" onClick={() => onRefund(payment)}>
              <ReceiptText className="h-3 w-3" />
              Issue refund
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
        className="w-full overflow-y-auto border-stone-200 bg-stone-50 p-0 dark:border-white/10 dark:bg-[#0f0f11] sm:max-w-2xl"
      >
        {/* Sticky Sheet Header */}
        <div className="sticky top-0 z-10 border-b border-stone-200/80 bg-stone-50 px-4 py-3 pr-12 dark:border-white/[0.07] dark:bg-[#0f0f11]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200/80 bg-white font-extrabold text-stone-700 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-stone-200">
              {(profile?.user?.fullName || profile?.user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className={cn(TITLE, 'text-sm')}>
                  {profile?.user?.fullName || profile?.user?.email || 'Customer'}
                </SheetTitle>
                {subscription.tier && (
                  <Pill tone={isPaid ? 'ok' : 'neutral'} className="text-[9px]">
                    {subscription.tier}
                  </Pill>
                )}
              </div>
              <SheetDescription className="sr-only">
                Customer billing, refunds and AI usage details
              </SheetDescription>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500 dark:text-stone-400">
                <span className="truncate">{profile?.user?.email || 'No email on file'}</span>
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
              {/* Plan Card */}
              <Section
                label="Plan & subscription"
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
                <StatRail className="grid-cols-2 sm:grid-cols-4">
                  <StatCell label="Subscription">
                    <Pill
                      tone={isPaid ? 'ok' : 'neutral'}
                      className="text-xs px-2.5 py-0.5 font-bold"
                    >
                      {subscription.tier || 'Free'}
                    </Pill>
                  </StatCell>
                  <StatCell
                    label={subscription.cancelAtPeriodEnd ? 'Ends on' : 'Renews / ends'}
                    value={isPaid ? formatDate(subscription.endDate) : '—'}
                  />
                  <StatCell label="First payment" value={formatDate(profile.facts?.firstPaidAt)} />
                  <StatCell
                    label="Refunds on record"
                    value={profile.facts?.refundsSucceeded ?? 0}
                    tip="Counted for the life of the account, even after the six-month record purge."
                  />
                </StatRail>

                {/* Account metadata strip */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-stone-200/80 bg-stone-50/50 px-3.5 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.02]">
                  <span className={cn(BODY, 'flex items-center gap-1.5 text-[11px]')}>
                    <Clock className="h-3.5 w-3.5 text-stone-400" /> Joined{' '}
                    {formatDate(profile.user?.createdAt)}
                  </span>
                  <span className={cn(BODY, 'flex items-center gap-1.5 text-[11px]')}>
                    <History className="h-3.5 w-3.5 text-stone-400" /> Last active{' '}
                    {formatDateTime(profile.user?.lastActive)}
                  </span>
                  {subscription.hasStripeSubscription && (
                    <span className={cn(BODY, 'flex items-center gap-1.5 text-[11px]')}>
                      <CreditCard className="h-3.5 w-3.5 text-stone-400" /> Stripe subscription
                      {subscription.cancelAtPeriodEnd ? ' (cancelling)' : ''}
                    </span>
                  )}
                  {subscription.paymentFailedAt && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[rgb(var(--signal-fault))]">
                      <AlertCircle className="h-3.5 w-3.5" /> Payment failed{' '}
                      {formatDate(subscription.paymentFailedAt)}
                    </span>
                  )}
                </div>

                {/* Protected subscription management action */}
                {isPaid && (
                  <div className="flex items-center justify-between border-t border-stone-200/80 bg-stone-50/80 px-3.5 py-2 dark:border-white/[0.07] dark:bg-white/[0.03]">
                    <span className={cn(BODY, 'text-[11px] text-stone-500 dark:text-stone-400')}>
                      {confirmEnd
                        ? 'Are you sure? This drops the learner to Free tier immediately.'
                        : 'Administrative access control'}
                    </span>
                    <AdminButton
                      size="sm"
                      variant="destructive"
                      onClick={endAccess}
                      onBlur={() => setConfirmEnd(false)}
                      loading={endingAccess}
                    >
                      {confirmEnd ? 'Confirm: Drop to free' : 'End paid access'}
                    </AdminButton>
                  </div>
                )}
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
