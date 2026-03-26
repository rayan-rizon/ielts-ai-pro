import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Minus, ArrowRight, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card
        className={cn(
          'relative h-full transition-all duration-700 rounded-[2rem] sm:rounded-[2.5rem] border backdrop-blur-3xl group',
          isPro
            ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.2)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] md:-translate-y-8 z-20 md:scale-105 ring-1 ring-slate-200 dark:ring-white/10'
            : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] dark:shadow-none hover:border-slate-300'
        )}
      >
        {isPro && (
          <div className="absolute top-0 right-0 p-8 overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[150%] h-[150%] bg-indigo-500/10 blur-[60px] rounded-full" />
          </div>
        )}

        <CardContent className="p-6 sm:p-8 flex flex-col h-full relative z-10">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3
                className={cn(
                  'text-2xl font-black tracking-tight',
                  isPro
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : isPremium
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-900 dark:text-white'
                )}
              >
                {plan.name}
              </h3>
              {isPro && (
                <Badge className="bg-indigo-600 text-white border-0 font-bold px-3 py-1 scale-90">
                  MOST POPULAR
                </Badge>
              )}
              {isPremium && (
                <div className="p-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
              {plan.description}
            </p>
          </div>

          <div className="mb-10">
            <div className="flex flex-col gap-1">
              {plan.oldPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">
                    Was
                  </span>
                  {isPricingLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <>
                      <span className="text-xl font-bold text-slate-600 dark:text-slate-400 line-through decoration-indigo-500/40">
                        {plan.currencySymbol || '$'}
                        {plan.oldPrice}
                      </span>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 px-2 font-black">
                        SAVE {Math.round((1 - Number(displayPrice) / plan.oldPrice) * 100)}%
                      </Badge>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-baseline gap-1 mt-1 overflow-hidden h-14">
                {isPricingLoading ? (
                  <Skeleton className="h-10 w-32 mt-2" />
                ) : (
                  <>
                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter flex items-baseline">
                      <span className="mr-1">{plan.currencySymbol || '$'}</span>
                      <AnimatePresence mode="wait">
                        <m.span
                          key={displayPrice}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                          {displayPrice}
                        </m.span>
                      </AnimatePresence>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                      / mo
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={() => onUpgrade(plan.tier)}
            disabled={isLoading || isPricingLoading || isActive}
            className={cn(
              'w-full py-6 rounded-2xl font-black text-lg transition-all duration-300 mb-8 shadow-lg group/btn active:scale-95',
              isPro
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/40'
                : isPremium
                  ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/40'
                  : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 shadow-none'
            )}
          >
            {isActive ? (
              'Current Plan'
            ) : (
              <>
                {plan.tier !== 'free' && isSubscribed ? 'Switch to this Plan' : plan.buttonText}
                <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <div className="flex-1 space-y-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">
              Includes
            </div>
            {plan.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4 group/item">
                <div
                  className={cn(
                    'mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                    isPro
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : isPremium
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  )}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover/item:translate-x-0.5 transition-transform duration-300">
                  {feature}
                </span>
              </div>
            ))}
            {plan.limitations?.map((lim, i) => (
              <div key={i} className="flex items-start gap-4 opacity-50">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Minus className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-sm font-medium text-slate-500 line-through">{lim}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}
