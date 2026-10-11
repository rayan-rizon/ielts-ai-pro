import React from 'react';
import { m } from 'framer-motion';

export default function SubscriptionManagementBanner({ user, isLoading, handleOpenPortal }) {
  if (user?.subscription_tier === 'free') return null;

  const showSupport = !user?.stripe_customer_id || !user?.stripe_subscription_id;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3"
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Want to manage your current subscription or payment methods?
      </p>
      {showSupport ? (
        <button
          type="button"
          onClick={() => window.open('mailto:support@ieltsai.pro', '_blank')}
          className="cursor-pointer inline-flex h-9 items-center justify-center rounded-lg border border-[#e2e5f2] bg-white px-5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-[#5a63df]/40 hover:bg-[#5a63df]/5 hover:text-slate-900 active:scale-[0.99] dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:border-[#5a63df]/40 dark:hover:bg-white/10 dark:hover:text-white"
        >
          Contact support
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpenPortal}
          disabled={isLoading}
          className="cursor-pointer inline-flex h-9 items-center justify-center rounded-lg border border-[#e2e5f2] bg-white px-5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-[#5a63df]/40 hover:bg-[#5a63df]/5 hover:text-slate-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:border-[#5a63df]/40 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {isLoading ? 'Opening…' : 'Open billing portal'}
        </button>
      )}
    </m.div>
  );
}
