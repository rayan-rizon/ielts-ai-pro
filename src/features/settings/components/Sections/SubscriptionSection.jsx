import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Crown,
  ArrowRight,
  Loader2,
  ExternalLink,
  Clock,
  Calendar,
  CreditCard,
  AlertCircle,
  AlertTriangle,
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
  const isCancelling_ = isCancelling;

  return (
    <motion.div
      key="subscription"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Current Subscription
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Manage your plan details and billing cycle.
            </p>
          </div>
        </div>

        <div className="bg-slate-50/70 dark:bg-slate-950/40 rounded-xl p-5 border border-slate-100 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    'px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider text-xs',
                    user?.subscription_tier === 'pro' || user?.subscription_tier === 'premium'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {user?.subscription_tier || 'Free'} Plan
                </Badge>
                {user?.cancel_at_period_end && (
                  <Badge
                    variant="destructive"
                    className="px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider text-xs"
                  >
                    Cancelling
                  </Badge>
                )}
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                {user?.subscription_tier === 'free' || !user?.subscription_tier
                  ? 'Basic Learner'
                  : user?.subscription_tier === 'pro'
                    ? 'Pro Member'
                    : 'Premium Elite'}
              </h4>
              <p className="text-sm text-slate-500 font-medium">
                {user?.subscription_tier === 'free' || !user?.subscription_tier
                  ? 'Limited access to AI tools'
                  : `Full access to all ${user?.subscription_tier} features`}
              </p>
            </div>

            <div className="flex flex-col gap-2 min-w-[180px]">
              {user?.subscription_tier === 'free' || !user?.subscription_tier ? (
                <Button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10 rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all text-sm border-0"
                >
                  Upgrade Now <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              ) : (
                <>
                  {user?.stripe_customer_id && (
                    <Button
                      onClick={handleOpenCustomerPortal}
                      disabled={isOpeningPortal}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10 rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all text-sm border-0"
                    >
                      {isOpeningPortal ? (
                        <Loader2 className="animate-spin w-4 h-4 mr-1.5" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                      )}
                      Stripe Portal
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate('/pricing')}
                    className="w-full h-10 rounded-xl border-slate-200 dark:border-white/10 font-semibold hover:bg-white dark:hover:bg-white/5 active:scale-95 transition-all text-sm"
                  >
                    Change Plan
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={isCancelling_}
                    onClick={() => {
                      if (user?.cancel_at_period_end) {
                        handleToggleCancellation();
                      } else {
                        setShowCancelDialog(true);
                      }
                    }}
                    className={cn(
                      'w-full h-10 rounded-xl font-semibold transition-all text-sm',
                      user?.cancel_at_period_end
                        ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/5 dark:text-emerald-400'
                        : 'text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 dark:text-rose-400'
                    )}
                  >
                    {isCancelling_ ? (
                      <Clock className="animate-spin w-4 h-4" />
                    ) : user?.cancel_at_period_end ? (
                      'Reactivate Subscription'
                    ) : (
                      'Cancel Subscription'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {user?.subscription_tier !== 'free' &&
          user?.subscription_tier &&
          user?.subscription_end_date && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2 text-slate-400 mb-0.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {user?.cancel_at_period_end ? 'Expiry Date' : 'Renewal Date'}
                  </span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {format(new Date(user?.subscription_end_date), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2 text-slate-400 mb-0.5">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Next Charge</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {user?.cancel_at_period_end
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

      {user?.subscription_tier !== 'free' && user?.subscription_tier && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-600 mb-0.5 text-xs uppercase tracking-wider">
              Billing Note
            </h4>
            <p className="text-sm text-amber-500/80 font-medium leading-relaxed">
              Subscription billing is managed via Stripe. Changes reflect across your profile within
              a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-6 md:p-8 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black text-rose-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              Cancel Subscription?
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
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

          <div className="my-4 p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20">
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
              You will lose access to:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-rose-500/80 dark:text-rose-400/80 font-medium list-disc list-inside">
              <li>All AI-powered assessments</li>
              <li>Unlimited Speaking &amp; Writing tests</li>
              <li>Detailed feedback &amp; analytics</li>
            </ul>
          </div>

          <DialogFooter className="flex-row gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="flex-1 rounded-xl h-12 font-bold border-slate-200 dark:border-white/10 hover:bg-white/5 transition-all"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleToggleCancellation}
              disabled={isCancelling_}
              className="flex-1 rounded-xl h-12 font-black shadow-lg shadow-rose-500/20 border-0"
            >
              {isCancelling_ ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
