import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, ArrowRight, Crown, Sparkles, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/cn';

const PLAN_ICONS = {
  free: Zap,
  pro: Star,
  premium: Crown,
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
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-full"
    >
      <Card
        className={cn(
          'relative h-full transition-all duration-300 rounded-[28px] border backdrop-blur-xl group flex flex-col overflow-visible',
          isPro
            ? 'bg-white dark:bg-slate-900 border-2 border-[#6d55e8] shadow-xl shadow-[#6d55e8]/10 md:-translate-y-3 z-20'
            : isPremium
              ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
        )}
      >
        {/* Top Badge (Clean solid color, overflow-visible on border) */}
        {isPro && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#6d55e8] text-[11px] font-black uppercase tracking-wider rounded-full text-white shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap z-30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Best Choice</span>
          </div>
        )}

        <CardContent className="p-5 sm:p-6 flex flex-col h-full relative z-10">
          {/* Card Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <div
                className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                  isPro
                    ? 'bg-[#6d55e8] text-white shadow-md shadow-[#6d55e8]/20'
                    : isPremium
                      ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {isPremium && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-purple-500" />
                  Ultimate
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
            <p className="mt-1 text-xs sm:text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 min-h-[34px]">
              {plan.description}
            </p>
          </div>

          {/* Pricing Section */}
          <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-1">
              {plan.oldPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Was
                  </span>
                  {isPricingLoading ? (
                    <Skeleton className="h-4 w-12" />
                  ) : (
                    <>
                      <span className="text-xs sm:text-sm font-bold text-slate-400 line-through">
                        {plan.currencySymbol || '$'}
                        {plan.oldPrice}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        SAVE {Math.round((1 - Number(displayPrice) / plan.oldPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-baseline gap-1 mt-0.5 overflow-hidden h-11">
                {isPricingLoading ? (
                  <Skeleton className="h-10 w-32 mt-1" />
                ) : (
                  <>
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-baseline">
                      <span className="mr-1 text-2xl font-bold">{plan.currencySymbol || '$'}</span>
                      <AnimatePresence mode="wait">
                        <m.span
                          key={displayPrice}
                          initial={{ y: 12, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -12, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {displayPrice}
                        </m.span>
                      </AnimatePresence>
                    </span>
                    <span className="text-slate-400 font-bold text-xs">/ month</span>
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
              'w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-150 mb-5 flex items-center justify-center gap-2',
              isPro
                ? 'bg-[#6d55e8] hover:bg-[#5b43d6] text-white shadow-md shadow-[#6d55e8]/20'
                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
            )}
          >
            {isActive ? (
              'Current Plan'
            ) : (
              <>
                <span>
                  {plan.tier !== 'free' && isSubscribed ? 'Switch to this Plan' : plan.buttonText}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Features Checklist */}
          <div className="flex-1 space-y-3.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
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
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                        isPro
                          ? 'bg-[#6d55e8] text-white'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      )}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {feature}
                    </span>
                  </div>
                ))}
                {plan.limitations?.map((lim, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500 line-through leading-snug">
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
