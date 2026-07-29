import React from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function SubscriptionManagementBanner({
  user,
  useManualBdPayment,
  isLoading,
  handleOpenPortal,
}) {
  if (user?.subscription_tier === 'free') return null;

  const showSupport = useManualBdPayment || !user?.stripe_subscription_id;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 mb-16 -mt-8"
    >
      <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
        Want to manage your current subscription or payment methods?
      </p>
      {showSupport ? (
        <Button
          variant="outline"
          onClick={() => window.open('mailto:support@ieltsai.pro', '_blank')}
          className="rounded-full px-8 h-11 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-black uppercase tracking-widest text-xs shadow-sm"
        >
          Contact Support
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={handleOpenPortal}
          disabled={isLoading}
          className="rounded-full px-8 h-11 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-black uppercase tracking-widest text-xs shadow-sm"
        >
          {isLoading ? 'Opening…' : 'Open Billing Portal'}
        </Button>
      )}
    </m.div>
  );
}
