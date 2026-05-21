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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black">Current Plan</h3>
            <p className="text-slate-500 font-medium">Manage your subscription and billing.</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    'px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]',
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
                    className="px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]"
                  >
                    Cancelling
                  </Badge>
                )}
              </div>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white">
                {user?.subscription_tier === 'free' || !user?.subscription_tier
                  ? 'Basic Learner'
                  : user?.subscription_tier === 'pro'
                    ? 'Pro Member'
                    : 'Premium Elite'}
              </h4>
              <p className="text-sm text-slate-500 font-medium">
                {user?.subscription_tier === 'free' || !user?.subscription_tier
                  ? 'Limited access to AI features'
                  : `Global access to all ${user?.subscription_tier} tools`}
              </p>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              {user?.subscription_tier === 'free' || !user?.subscription_tier ? (
                <Button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all outline-none border-0"
                >
                  Upgrade Now <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <>
                  {user?.stripe_customer_id && (
                    <Button
                      onClick={handleOpenCustomerPortal}
                      disabled={isOpeningPortal}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all outline-none border-0"
                    >
                      {isOpeningPortal ? (
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Manage with Stripe
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate('/pricing')}
                    className="w-full h-11 rounded-xl border-slate-200 dark:border-white/10 font-bold hover:bg-white dark:hover:bg-white/5 active:scale-95 transition-all outline-none"
                  >
                    Change Plan
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={isCancelling_}
                    onClick={() => {
                      // If reactivating, no confirmation needed — it's non-destructive
                      if (user?.cancel_at_period_end) {
                        handleToggleCancellation();
                      } else {
                        setShowCancelDialog(true);
                      }
                    }}
                    className={cn(
                      'w-full h-11 rounded-xl font-bold transition-all outline-none',
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
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3 text-slate-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {user?.cancel_at_period_end ? 'Expiry Date' : 'Renewal Date'}
                  </span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {format(new Date(user?.subscription_end_date), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3 text-slate-400 mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Next Charge
                  </span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white">
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
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 flex gap-4 items-start">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-amber-600 mb-1 leading-none uppercase tracking-widest text-[10px]">
              Important Note
            </h4>
            <p className="text-sm text-amber-500/80 font-medium leading-relaxed">
              Your subscription is managed through our secure payment partners. Changes may take a
              few moments to reflect in your profile dashboard.
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
