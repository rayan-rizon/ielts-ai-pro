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
          'relative h-full transition-all duration-300 rounded-[28px] border backdrop-blur-xl group overflow-hidden flex flex-col',
          isPro
            ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-[0_25px_60px_-15px_rgba(79,70,229,0.22)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] md:-translate-y-4 z-20 md:scale-105 ring-2 ring-indigo-500/30'
            : isPremium
              ? 'bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-500/40 shadow-xl hover:border-purple-400 hover:shadow-2xl'
              : 'bg-white/90 dark:bg-slate-900/80 border-slate-200/90 dark:border-white/10 shadow-md hover:border-slate-300 hover:shadow-xl'
        )}
      >
        {isPro && (
          <div className="pointer-events-none absolute top-0 right-0 p-8 overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[130%] h-[130%] bg-indigo-500/12 blur-[60px] rounded-full" />
          </div>
        )}

        <CardContent className="p-7 sm:p-8 flex flex-col h-full relative z-10">
          {/* Card Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3
                className={cn(
                  'text-2xl font-black tracking-tight',
                  isPro
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : isPremium
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-slate-950 dark:text-white'
                )}
              >
                {plan.name}
              </h3>
              {isPro && (
                <Badge className="bg-indigo-600 text-white border-0 font-extrabold px-3 py-1 text-xs tracking-wider rounded-full shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  MOST POPULAR
                </Badge>
              )}
              {isPremium && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black">
                  <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ULTIMATE
                </div>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed">
              {plan.description}
            </p>
          </div>

          {/* Pricing Section */}
          <div className="mb-7">
            <div className="flex flex-col gap-1">
              {plan.oldPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Was
                  </span>
                  {isPricingLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <>
                      <span className="text-lg font-bold text-slate-400 dark:text-slate-500 line-through decoration-indigo-500/40">
                        {plan.currencySymbol || '$'}
                        {plan.oldPrice}
                      </span>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs py-0.5 px-2 font-black">
                        SAVE {Math.round((1 - Number(displayPrice) / plan.oldPrice) * 100)}%
                      </Badge>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-baseline gap-1 mt-1 overflow-hidden h-14">
                {isPricingLoading ? (
                  <Skeleton className="h-10 w-32 mt-1" />
                ) : (
                  <>
                    <span className="text-5xl sm:text-6xl font-black text-slate-950 dark:text-white tracking-tight flex items-baseline">
                      <span className="mr-1 text-3xl sm:text-4xl font-bold">
                        {plan.currencySymbol || '$'}
                      </span>
                      <AnimatePresence mode="wait">
                        <m.span
                          key={displayPrice}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                          {displayPrice}
                        </m.span>
                      </AnimatePresence>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">
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
              'w-full h-12 rounded-full font-black text-base transition-all duration-200 mb-8 shadow-md group/btn active:scale-95 border-0',
              isPro
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:shadow-indigo-500/45 hover:scale-[1.01]'
                : isPremium
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30 hover:shadow-purple-500/45 hover:scale-[1.01]'
                  : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 shadow-sm'
            )}
          >
            {isActive ? (
              'Current Plan'
            ) : (
              <>
                {plan.tier !== 'free' && isSubscribed ? 'Switch to this Plan' : plan.buttonText}
                <ArrowRight className="w-4.5 h-4.5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          {/* Features Checklist */}
          <div className="flex-1 space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
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
                  <div key={i} className="flex items-start gap-3 group/item">
                    <div
                      className={cn(
                        'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/item:scale-110',
                        isPro
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isPremium
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-emerald-500 text-white shadow-xs'
                      )}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </div>
                ))}
                {plan.limitations?.map((lim, i) => (
                  <div key={i} className="flex items-start gap-3 opacity-45">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Minus className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 line-through">{lim}</span>
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
