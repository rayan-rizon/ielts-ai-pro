import React from 'react';
import { m } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { format } from 'date-fns';
import {
  IconChip,
  MUTED,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';

export default function SubscriptionSection({
  user,
  isOpeningPortal,
  isCancelling,
  showCancelDialog,
  setShowCancelDialog,
  handleOpenCustomerPortal,
  handleToggleCancellation,
  navigate,
}) {
  const isFree = user?.subscription_tier === 'free' || !user?.subscription_tier;
  const isCancellingScheduled = !!user?.cancel_at_period_end;

  return (
    <m.div
      key="subscription"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <div className={cn(PANEL, 'p-4 sm:p-5')}>
        <PanelTitle label="Current subscription" accent />
        <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>
          Manage your plan details and billing cycle.
        </p>

        <div className={cn(TILE, 'p-4')}>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Pill tone={isFree ? 'neutral' : 'accent'}>
                  <Crown className="h-2.5 w-2.5" />
                  {user?.subscription_tier || 'Free'} plan
                </Pill>
                {isCancellingScheduled && <Pill tone="fault">Cancelling</Pill>}
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {isFree
                  ? 'Basic learner'
                  : user?.subscription_tier === 'pro'
                    ? 'Pro member'
                    : 'Premium elite'}
              </h4>
              <p className={cn('text-xs font-medium', MUTED)}>
                {isFree
                  ? 'Limited access to AI tools'
                  : `Full access to all ${user?.subscription_tier} features`}
              </p>
            </div>

            <div className="flex min-w-[180px] flex-col gap-2">
              {isFree ? (
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition-all active:scale-95"
                >
                  Upgrade now <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <>
                  {user?.stripe_customer_id && (
                    <button
                      type="button"
                      onClick={handleOpenCustomerPortal}
                      disabled={isOpeningPortal}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                    >
                      {isOpeningPortal ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      Stripe portal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/pricing')}
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-[#e2e5f2] bg-white text-xs font-bold text-slate-700 transition-all hover:border-[#c9cdf3] active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                  >
                    Change plan
                  </button>
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => {
                      if (isCancellingScheduled) {
                        handleToggleCancellation();
                      } else {
                        setShowCancelDialog(true);
                      }
                    }}
                    className={cn(
                      'inline-flex h-9 w-full items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-60',
                      isCancellingScheduled
                        ? 'text-[rgb(var(--signal-ok))] hover:bg-[rgba(var(--signal-ok),0.08)]'
                        : 'text-[rgb(var(--signal-fault))] hover:bg-[rgba(var(--signal-fault),0.08)]'
                    )}
                  >
                    {isCancelling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isCancellingScheduled ? (
                      'Reactivate subscription'
                    ) : (
                      'Cancel subscription'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {!isFree && user?.subscription_end_date && (
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className={cn(TILE, 'p-3.5')}>
              <div className="mb-0.5 flex items-center gap-1.5 text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isCancellingScheduled ? 'Expiry date' : 'Renewal date'}
                </span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {format(new Date(user?.subscription_end_date), 'MMMM dd, yyyy')}
              </p>
            </div>
            <div className={cn(TILE, 'p-3.5')}>
              <div className="mb-0.5 flex items-center gap-1.5 text-slate-400">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Next charge</span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {isCancellingScheduled
                  ? '$0.00'
                  : user?.subscription_amount
                    ? `${user?.subscription_currency === 'BDT' ? '৳' : '$'}${Number(user?.subscription_amount).toFixed(2)}`
                    : user?.subscription_tier === 'premium'
                      ? '$15.99'
                      : '$9.99'}
              </p>
            </div>
          </div>
        )}
      </div>

      {!isFree && (
        <div
          className={cn(
            TILE,
            'flex items-start gap-3 border-amber-200/60 bg-amber-50/40 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/[0.06]'
          )}
        >
          <IconChip icon={AlertCircle} tone="amber" size="sm" />
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Billing note
            </h4>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-amber-800/80 dark:text-amber-300/80">
              Subscription billing is managed via Stripe. Changes reflect across your profile within
              a few seconds.
            </p>
          </div>
        </div>
      )}

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="rounded-2xl border-[#e2e5f2] bg-white p-6 dark:border-white/10 dark:bg-[#131218] sm:max-w-[420px]">
          <DialogHeader className="space-y-2.5">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold text-[rgb(var(--signal-fault))]">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Cancel subscription?
            </DialogTitle>
            <DialogDescription className={cn('text-xs font-medium leading-relaxed', MUTED)}>
              Your subscription will remain active until{' '}
              {user?.subscription_end_date ? (
                <strong className="text-slate-700 dark:text-slate-200">
                  {format(new Date(user.subscription_end_date), 'MMMM dd, yyyy')}
                </strong>
              ) : (
                'the end of the current billing period'
              )}
              . After that, your account will revert to the free plan.
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              TILE,
              'my-3 border-[rgba(var(--signal-fault),0.25)] bg-[rgba(var(--signal-fault),0.05)] p-3.5'
            )}
          >
            <p className="text-xs font-extrabold text-[rgb(var(--signal-fault))]">
              You will lose access to:
            </p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs font-medium text-[rgb(var(--signal-fault))]/80">
              <li>All AI-powered assessments</li>
              <li>Unlimited Speaking &amp; Writing tests</li>
              <li>Detailed feedback &amp; analytics</li>
            </ul>
          </div>

          <DialogFooter className="mt-1 flex-row gap-2.5">
            <button
              type="button"
              onClick={() => setShowCancelDialog(false)}
              className="h-10 flex-1 rounded-lg border border-[#e2e5f2] bg-white text-xs font-bold text-slate-700 transition-all active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
            >
              Keep subscription
            </button>
            <button
              type="button"
              onClick={handleToggleCancellation}
              disabled={isCancelling}
              className="h-10 flex-1 rounded-lg bg-[rgb(var(--signal-fault))] text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-60"
            >
              {isCancelling ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                'Confirm cancel'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </m.div>
  );
}
