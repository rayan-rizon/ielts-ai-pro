import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, ArrowRight, Crown, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

const FreeIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="11" r="2.2" fill="currentColor" fillOpacity="0.8" />
  </svg>
);

const PremiumIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M2 4L5 18H19L22 4L15.5 10L12 3L8.5 10L2 4Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="14.5" r="1.5" fill="currentColor" />
    <circle cx="7.5" cy="14.5" r="1" fill="currentColor" fillOpacity="0.7" />
    <circle cx="16.5" cy="14.5" r="1" fill="currentColor" fillOpacity="0.7" />
  </svg>
);

const PLAN_ICONS = {
  free: FreeIcon,
  pro: ProIcon,
  premium: PremiumIcon,
};

export default function PricingCard({
  plan,
  displayPrice,
  isActive,
  isSubscribed,
  isLoading,
  isPricingLoading,
  onUpgrade,
}) {
  const isPro = plan.tier === 'pro';
  const isPremium = plan.tier === 'premium';
  const Icon = PLAN_ICONS[plan.tier] || Zap;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: isPro ? -8 : -5 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="h-full"
    >
      <Card
        className={cn(
          'relative h-full transition-all duration-300 rounded-[26px] overflow-hidden group flex flex-col',
          isPro
            ? 'bg-gradient-to-b from-white via-[#faf9ff] to-[#f4f2ff] dark:from-slate-900 dark:via-[#101426] dark:to-[#13172e] border border-[#5661e9]/40 dark:border-[#5661e9]/40 shadow-[0_20px_50px_-18px_rgba(86,97,233,0.22)] hover:border-[#5661e9]/70 hover:shadow-[0_28px_60px_-15px_rgba(86,97,233,0.35)] md:-translate-y-3 z-20'
            : isPremium
              ? 'bg-white dark:bg-slate-900 border border-purple-200/90 hover:border-purple-400 dark:border-purple-900/40 dark:hover:border-purple-700/60 shadow-[0_15px_40px_-20px_rgba(147,51,234,0.2)] hover:shadow-[0_25px_50px_-15px_rgba(147,51,234,0.35)]'
              : 'bg-white dark:bg-slate-900 border border-slate-200/90 hover:border-[#5661e9]/50 dark:border-white/10 dark:hover:border-[#5661e9]/50 shadow-[0_15px_40px_-25px_rgba(30,41,59,0.15)] hover:shadow-[0_25px_50px_-20px_rgba(30,41,59,0.25)]'
        )}
      >
        <CardContent className="p-6 sm:p-7 flex flex-col h-full relative z-10">
          {/* Card Header: Icon top-left, Badge top-right */}
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div
                className={cn(
                  'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-sm',
                  isPro
                    ? 'bg-[#5661e9] text-white shadow-indigo-500/25 ring-2 ring-[#5661e9]/20'
                    : isPremium
                      ? 'bg-purple-600 text-white shadow-purple-500/25 ring-2 ring-purple-500/20'
                      : 'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20'
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              {isPro && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 border border-[#5661e9]/25 text-xs font-black uppercase tracking-wider shrink-0 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#5661e9] dark:text-indigo-300" />
                  Best Choice
                </span>
              )}
              {isPremium && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 text-xs font-black uppercase tracking-wider shrink-0 shadow-2xs">
                  <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Ultimate
                </span>
              )}
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              {plan.name}
            </h3>
            <p className="mt-1.5 text-xs sm:text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 min-h-[36px] flex items-center">
              {plan.description}
            </p>
          </div>

          {/* Pricing Section */}
          <div className="mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col justify-end min-h-[60px]">
              {plan.oldPrice ? (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    WAS
                  </span>
                  {isPricingLoading ? (
                    <Skeleton className="h-4 w-12" />
                  ) : (
                    <>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-400 dark:text-slate-500 line-through decoration-slate-400/80">
                        {plan.currencySymbol || '$'}
                        {plan.oldPrice}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10.5px] font-black tracking-wide">
                        SAVE {Math.round((1 - Number(displayPrice) / plan.oldPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-5 mb-1" />
              )}
              <div className="flex items-baseline gap-1">
                {isPricingLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <>
                    <div className="flex items-baseline font-black text-slate-950 dark:text-white tracking-tight text-3xl sm:text-4xl leading-none">
                      <span className="text-3xl sm:text-4xl font-black mr-0.5">
                        {plan.currencySymbol || '$'}
                      </span>
                      <AnimatePresence mode="wait">
                        <m.span
                          key={displayPrice}
                          initial={{ y: 8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -8, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {displayPrice}
                        </m.span>
                      </AnimatePresence>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-extrabold text-xs sm:text-sm self-baseline pb-0.5 ml-1">
                      / month
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onUpgrade(plan.tier)}
            disabled={isLoading || isPricingLoading || isActive}
            className={cn(
              'group/btn relative w-full h-12 sm:h-13 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-5 flex items-center justify-center gap-2 cursor-pointer shadow-sm overflow-hidden',
              isPro
                ? 'bg-[#5661e9] hover:bg-[#4752d4] text-white shadow-indigo-500/25 hover:shadow-indigo-500/40'
                : isPremium
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25 hover:shadow-purple-600/40'
                  : 'bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-xs'
            )}
          >
            {isActive ? (
              'Current Plan'
            ) : (
              <>
                <span>
                  {plan.tier !== 'free' && isSubscribed ? 'Switch to this Plan' : plan.buttonText}
                </span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1.5" />
              </>
            )}
          </Button>

          {/* Features Checklist */}
          <div className="flex-1 space-y-2.5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              What's Included
            </div>
            {isPricingLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                  <Skeleton className={cn('h-4', i % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
                </div>
              ))
            ) : (
              <>
                {plan.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-1 -mx-1 rounded-lg transition-colors hover:bg-slate-100/60 dark:hover:bg-white/5"
                  >
                    <div
                      className={cn(
                        'w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 shadow-2xs',
                        isPro
                          ? 'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20'
                          : isPremium
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-200/70'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      )}
                    >
                      <Check className="w-3 h-3 stroke-[2.8px]" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-snug">
                      {feature}
                    </span>
                  </div>
                ))}
                {plan.limitations?.map((lim, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-1 -mx-1">
                    <div className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 line-through leading-snug">
                      {lim}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}
