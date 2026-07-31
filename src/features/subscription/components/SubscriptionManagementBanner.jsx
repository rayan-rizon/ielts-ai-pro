import React from 'react';
import { m } from 'framer-motion';

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
      className="mb-16 -mt-8 flex flex-col items-center gap-3"
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Want to manage your current subscription or payment methods?
      </p>
      {showSupport ? (
        <button
          type="button"
          onClick={() => window.open('mailto:support@ieltsai.pro', '_blank')}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#e2e5f2] bg-white px-5 text-xs font-bold uppercase tracking-widest text-slate-600 transition-colors hover:border-[#c9cdf3] hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-white"
        >
          Contact support
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpenPortal}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#e2e5f2] bg-white px-5 text-xs font-bold uppercase tracking-widest text-slate-600 transition-colors hover:border-[#c9cdf3] hover:text-slate-900 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-white"
        >
          {isLoading ? 'Opening…' : 'Open billing portal'}
        </button>
      )}
    </m.div>
  );
}
