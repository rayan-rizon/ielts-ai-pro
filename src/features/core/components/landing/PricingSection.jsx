import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Star, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { detectLocation, getPriceData, calculatePrice } from '@/lib/pricingUtils';
import { fetchAllTierLimits, generateFeatureStrings } from '@/lib/tierLimitsUtils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const defaultPlans = [
  {
    name: 'Free',
    pricing: {
      monthly: { price: '$0', period: '/mo', oldPrice: null },
      quarterly: { price: '$0', period: '/mo', oldPrice: null },
    },
    desc: 'Perfect for getting started with Reading & Listening.',
    features: [
      'Unlimited Reading & Listening',
      'All Cambridge Test Papers',
      '0 AI Speaking Sessions / month',
      '5 AI Evaluations / month',
      '100 Vocabulary Words',
      'Basic Performance Analytics',
    ],
    buttonText: 'Start Practice Free',
    popular: false,
    icon: Zap,
    tier: 'free',
    defaultPrice: 0,
    defaultOldPrice: null,
  },
  {
    name: 'Pro',
    pricing: {
      monthly: { price: '$9.99', period: '/mo', oldPrice: '$15' },
      quarterly: { price: '$8.49', period: '/mo', oldPrice: '$15', savings: 'SAVE 43%' },
    },
    desc: 'The preferred choice for serious IELTS candidates.',
    features: [
      'Everything in Free',
      '100 AI Writing Evaluations',
      '50 AI Speaking Sessions',
      '300 Vocabulary Words',
      'AI Study Recommendations',
      'Advanced Performance Analytics',
    ],
    buttonText: 'Upgrade to Pro',
    popular: true,
    icon: Star,
    tier: 'pro',
    defaultPrice: 9.99,
    defaultOldPrice: 15,
  },
  {
    name: 'Premium',
    pricing: {
      monthly: { price: '$15.99', period: '/mo', oldPrice: '$25' },
      quarterly: { price: '$13.59', period: '/mo', oldPrice: '$25', savings: 'SAVE 46%' },
    },
    desc: 'Ultimate power with adaptive AI and deep insights.',
    features: [
      'Everything in Pro Included',
      '200 AI Writing Evaluations',
      '100 AI Speaking Sessions',
      'Unlimited Vocabulary Words',
      'Adaptive AI Learning Path',
      'Exclusive Study Group Access',
    ],
    buttonText: 'Get Premium',
    popular: false,
    icon: Crown,
    tier: 'premium',
    defaultPrice: 15.99,
    defaultOldPrice: 25,
  },
];

const PricingSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="glass-card-premium rounded-[2.5rem] p-8 border border-border/50 h-[600px] flex flex-col"
      >
        <Skeleton className="h-12 w-12 rounded-2xl mb-6" />
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-16 w-full mb-8" />
        <div className="space-y-4 flex-grow">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex gap-3 items-center">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full mt-auto rounded-xl" />
      </div>
    ))}
  </div>
);

export default function PricingSection({ handlePrimaryCta, viewport }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'quarterly'
  const [plans, setPlans] = useState(defaultPlans);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Eagerly load pricing data on mount to avoid flicker when user scrolls there
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const [settings, userCountry] = await Promise.all([SystemSetting.getAll(), detectLocation()]);

      const { countryCurrencyMap } = await import('@/lib/pricingUtils');
      const currency = countryCurrencyMap[userCountry]?.currency || 'USD';
      const tierLimits = await fetchAllTierLimits(currency);

      const updatedPlans = defaultPlans.map((plan) => {
        // Get dynamic feature strings for all tiers
        const limits = tierLimits[plan.tier];
        const featureStrings = generateFeatureStrings(plan.tier, limits);

        // Update features with dynamic limits
        const updatedFeatures = plan.features
          .map((feature) => {
            if (feature.includes('AI Evaluations') || feature.includes('AI Writing')) {
              return featureStrings.writingFeature;
            }
            if (feature.includes('AI Speaking')) {
              return featureStrings.speakingFeature;
            }
            return feature;
          })
          .filter(Boolean);

        const priceData = getPriceData(
          plan.tier,
          plan.defaultPrice || 0,
          plan.defaultOldPrice,
          settings,
          userCountry
        );
        const symbol = priceData.symbol || '$';
        const monthlyPrice = calculatePrice(priceData.price, 'monthly');
        const monthlyOldPrice = calculatePrice(priceData.oldPrice, 'monthly');
        const quarterlyPerMonth = calculatePrice(priceData.price, 'quarterly');

        const savingsPercentQuarterly = monthlyOldPrice
          ? Math.round((1 - Number(quarterlyPerMonth) / Number(monthlyOldPrice)) * 100)
          : 43;

        const savingsPercentMonthly = monthlyOldPrice
          ? Math.round((1 - Number(monthlyPrice) / Number(monthlyOldPrice)) * 100)
          : 0;

        return {
          ...plan,
          features: updatedFeatures,
          pricing: {
            monthly: {
              price: `${symbol}${monthlyPrice}`,
              period: '/mo',
              oldPrice: monthlyOldPrice ? `${symbol}${monthlyOldPrice}` : null,
              savings: savingsPercentMonthly > 0 ? `SAVE ${savingsPercentMonthly}%` : null,
            },
            quarterly: {
              price: `${symbol}${quarterlyPerMonth}`,
              period: '/mo',
              oldPrice: monthlyOldPrice ? `${symbol}${monthlyOldPrice}` : null,
              savings: `SAVE ${savingsPercentQuarterly}%`,
            },
          },
        };
      });

      setPlans(updatedPlans);
      setPricesLoaded(true);
    } catch (error) {
      console.error('Failed to load pricing:', error);
      setPricesLoaded(true); // Show defaults on error
    }
  };

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="scroll-mt-24 py-8 md:py-12 relative bg-muted/30 dark:bg-muted/10 border-t border-border overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="text-center mb-10"
        >
          <Badge
            variant="secondary"
            className="rounded-full bg-primary/10 dark:bg-primary/20 text-blue-900 dark:text-primary-foreground border-primary/20 dark:border-primary/30 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest mb-6"
          >
            Pricing Plans
          </Badge>
          <m.h2 variants={itemVariants} className="heading-lg">
            Invest in your <span className="text-gradient-primary">Future Success</span>
          </m.h2>
          <m.p variants={itemVariants} className="body-lg max-w-2xl mx-auto mb-8">
            Choose the roadmap that fits your band score target. Unlock examiner-level feedback and
            start practicing with intent.
          </m.p>

          <m.div variants={itemVariants} className="flex flex-col items-center gap-4">
            <div className="flex items-center p-1.5 bg-white dark:bg-zinc-900 rounded-full border border-border shadow-xl backdrop-blur-md">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-300',
                  billingCycle === 'monthly'
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('quarterly')}
                className={cn(
                  'px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-300 relative',
                  billingCycle === 'quarterly'
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Quarterly
                <span className="absolute -top-3 -right-4 bg-emerald-600 text-[9px] text-white px-2 py-0.5 rounded-full font-black shadow-lg border-2 border-white dark:border-zinc-900 animate-bounce">
                  SAVE 15%
                </span>
              </button>
            </div>
          </m.div>
        </m.div>

        <div className="relative min-h-[600px]">
          {!pricesLoaded ? (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PricingSkeleton />
            </m.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, i) => {
                const currentPrice = plan.pricing[billingCycle];
                return (
                  <m.div
                    key={plan.name}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewport}
                    variants={itemVariants}
                    transition={{ delay: i * 0.1 }}
                    className={`relative group flex flex-col h-full rounded-[2.5rem] p-8 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                      plan.popular
                        ? 'bg-white dark:bg-card border-primary/40 ring-2 ring-primary/30 shadow-[0_50px_100px_-20px_rgba(59,130,246,0.4)] md:-translate-y-4 z-20 hover:shadow-primary/40'
                        : 'glass-card-premium border-border dark:border-white/5 hover:border-primary/30 hover:shadow-primary/10'
                    }`}
                  >
                    {/* Background animated glow for popular plan */}
                    {plan.popular && (
                      <div className="absolute inset-0 -z-10 bg-primary/5 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
                    )}
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-[10px] font-black uppercase tracking-widest rounded-full text-white shadow-[0_8px_16px_rgba(59,130,246,0.4)] flex items-center justify-center gap-1.5 whitespace-nowrap leading-none">
                        <Sparkles className="h-3 w-3" />
                        <span>Most Popular</span>
                      </div>
                    )}

                    <div className="mb-8">
                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${plan.popular ? 'bg-primary text-white shadow-primary/20' : 'bg-primary/10 text-primary'}`}
                      >
                        <plan.icon className="h-6 w-6" />
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                        {plan.desc}
                      </p>
                    </div>

                    <div className="mb-8 h-20 flex flex-col justify-end">
                      {currentPrice.oldPrice && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                            Was
                          </span>
                          <span className="text-lg font-bold text-muted-foreground line-through decoration-primary/40">
                            {currentPrice.oldPrice}
                          </span>
                          {currentPrice.savings && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-black py-0 px-2 rounded-lg"
                            >
                              {currentPrice.savings}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <AnimatePresence mode="wait">
                          <m.span
                            key={currentPrice.price}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-5xl font-black tracking-tight text-foreground"
                          >
                            {currentPrice.price}
                          </m.span>
                        </AnimatePresence>
                        {currentPrice.period && (
                          <span className="text-sm font-bold text-muted-foreground">
                            {currentPrice.period}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 mb-10 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 items-center group/item text-sm cursor-default"
                        >
                          <div
                            className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300 group-hover/item:scale-110 ${plan.popular ? 'bg-emerald-500/20 group-hover/item:bg-emerald-500/40' : 'bg-primary/10 group-hover/item:bg-primary/30'}`}
                          >
                            <CheckCircle2
                              className={`h-3 w-3 ${plan.popular ? 'text-emerald-500 dark:text-emerald-400' : 'text-primary'}`}
                            />
                          </div>
                          <span className="font-semibold tracking-tight text-muted-foreground group-hover/item:text-foreground transition-all duration-300 group-hover/item:translate-x-1">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-11/12 mx-auto h-12 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                        plan.popular
                          ? 'shiny-button bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 border-t border-white/20'
                          : 'bg-background hover:bg-muted border border-border/60 text-foreground'
                      }`}
                      onClick={handlePrimaryCta}
                    >
                      {plan.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </m.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
