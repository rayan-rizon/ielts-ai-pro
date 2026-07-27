import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Minus, ArrowRight, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

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

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-full"
    >
      <Card
        className={cn(
          'relative h-full transition-all duration-300 rounded-[24px] border backdrop-blur-xl group overflow-hidden flex flex-col',
          isPro
            ? 'bg-white dark:bg-slate-900 border-2 border-indigo-600 shadow-xl shadow-indigo-500/10 md:-translate-y-3 z-20'
            : 'bg-white/90 dark:bg-slate-900/70 border-slate-200/90 dark:border-white/10 shadow-sm hover:border-slate-300 dark:hover:border-white/20'
        )}
      >
        <CardContent className="p-7 flex flex-col h-full relative z-10">
          {/* Card Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">{plan.name}</h3>
              {isPro && (
                <Badge className="bg-indigo-600 text-white border-0 font-black px-3 py-1 text-[10px] tracking-wider rounded-full shadow-xs uppercase">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Best Choice
                </Badge>
              )}
              {isPremium && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold border border-slate-200/80 dark:border-white/10 uppercase">
                  <Crown className="w-3 h-3 text-indigo-500" />
                  Ultimate
                </div>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed min-h-[38px]">
              {plan.description}
            </p>
          </div>

          {/* Pricing Section */}
          <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
            <div className="flex flex-col gap-1">
              {plan.oldPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Was
                  </span>
                  {isPricingLoading ? (
                    <Skeleton className="h-4 w-12" />
                  ) : (
                    <>
                      <span className="text-sm font-bold text-slate-400 line-through">
                        {plan.currencySymbol || '$'}
                        {plan.oldPrice}
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        SAVE {Math.round((1 - Number(displayPrice) / plan.oldPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-baseline gap-1 mt-1 overflow-hidden h-12">
                {isPricingLoading ? (
                  <Skeleton className="h-10 w-32 mt-1" />
                ) : (
                  <>
                    <span className="text-4xl sm:text-[42px] font-black text-slate-950 dark:text-white tracking-tight flex items-baseline">
                      <span className="mr-1 text-2xl font-bold">{plan.currencySymbol || '$'}</span>
                      <AnimatePresence mode="wait">
                        <m.span
                          key={displayPrice}
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -15, opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                          {displayPrice}
                        </m.span>
                      </AnimatePresence>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">
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
              'w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 mb-8 flex items-center justify-center gap-2',
              isPro
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white'
            )}
          >
            {isActive ? (
              'Current Plan'
            ) : (
              <>
                <span>
                  {plan.tier !== 'free' && isSubscribed ? 'Switch to this Plan' : plan.buttonText}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>

          {/* Features Checklist */}
          <div className="flex-1 space-y-3.5">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
              What's Included
            </div>
            {isPricingLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-4.5 h-4.5 rounded-full shrink-0" />
                  <Skeleton className={cn('h-4', i % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
                </div>
              ))
            ) : (
              <>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                        isPro
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      )}
                    >
                      <Check className="w-3 h-3 stroke-[2.5px]" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {feature}
                    </span>
                  </div>
                ))}
                {plan.limitations?.map((lim, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 line-through">
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
