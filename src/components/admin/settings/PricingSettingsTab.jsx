import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DollarSign, Zap, Loader2, Save, ShieldCheck } from 'lucide-react';
import PricingTierCard from './PricingTierCard';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const premiumTheme = {
  gradientFrom: 'from-purple-500/5',
  border: 'border-purple-200/60 dark:border-purple-800/40',
  bgGradient: 'from-purple-50/30 to-background dark:from-purple-900/10 dark:to-slate-900/50',
  iconGradient: 'from-purple-500 to-purple-600',
  iconShadow: 'shadow-purple-500/25',
  badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
  badgeText: 'text-purple-700 dark:text-purple-300',
  badgeBorder: 'border-purple-200/50 dark:border-purple-800/50',
  textColor: 'text-purple-700 dark:text-purple-300',
  inputRing: 'focus-visible:ring-purple-500/20 focus-visible:border-purple-500',
  discountBg: 'bg-purple-50 dark:bg-purple-900/20',
  discountBorder: 'border-purple-200/50 dark:border-purple-800/30',
  discountText: 'text-purple-700 dark:text-purple-300',
  discountTextMuted: 'text-purple-600/70 dark:text-purple-400/70',
  regionalText: 'text-purple-700 dark:text-purple-300',
  regionalHover:
    'hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400',
  bulletColor: 'bg-purple-500',
};

const PricingSettingsHeader = () => (
  <div
    className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/80"
    data-oid="f8sa9t:"
  >
    <div className="flex items-center gap-3" data-oid="z49kav8">
      <div
        className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs"
        data-oid="h6ax7g5"
      >
        <DollarSign className="w-5 h-5" data-oid="t493xto" />
      </div>
      <div className="space-y-0.5" data-oid="tcj0xox">
        <h3
          className="text-lg font-black tracking-tight text-slate-950 dark:text-white"
          data-oid="q_mbpg0"
        >
          Pricing Configuration
        </h3>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400" data-oid=".ky0t.m">
          Manage global subscription rates, discount formulas, and localized regional pricing
        </p>
      </div>
    </div>
  </div>
);

const PricingSettingsFooter = ({ onSave, pricingTiers, saving }) => (
  <div
    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-5 border-t border-slate-100 dark:border-white/5"
    data-oid="b25u3fj"
  >
    <div
      className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
      data-oid="qih51.2"
    >
      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" data-oid="4n.-03f"></div>
      <span data-oid="8vwkl:7">Pricing updates apply across all billing flows immediately</span>
    </div>
    <Button
      onClick={() => onSave('pricing_tiers', pricingTiers)}
      disabled={saving}
      className="w-full sm:w-auto justify-center h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all shrink-0"
      data-oid=":i.ehgz"
    >
      {saving ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" data-oid="c8.w.wa" />
      ) : (
        <Save className="mr-2 h-3.5 w-3.5" data-oid="9yq1h4h" />
      )}
      <span>Update Pricing</span>
    </Button>
  </div>
);

export default function PricingSettingsTab({
  pricingTiers,
  saving,
  onSave,
  onChangePricingTiers,
  onRegionalUpdate,
}) {
  const tiers = pricingTiers || {};
  const pro = tiers.pro || {};
  const premium = tiers.premium || {};

  return (
    <motion.div variants={itemVariants} className="max-w-5xl space-y-6" data-oid="duxl5bf">
      <div
        className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 shadow-2xs overflow-hidden"
        data-oid="_v9cdza"
      >
        <PricingSettingsHeader />

        <div className="p-6 space-y-6" data-oid="bws3833">
          <div className="grid md:grid-cols-2 gap-6" data-oid="piynevn">
            {/* Pro Plan */}
            <PricingTierCard
              tierId="pro"
              tierName="Pro Plan"
              tierDescription="Professional features for dedicated learners"
              activeText="Active tier for standard subscribers"
              icon={Zap}
              price={pro.price}
              originalPrice={pro.originalPrice}
              regional={pro.regional}
              saving={saving}
              onChangePrice={(price) =>
                onChangePricingTiers({
                  ...tiers,
                  pro: {
                    ...pro,
                    price,
                  },
                })
              }
              onChangeOriginalPrice={(originalPrice) =>
                onChangePricingTiers({
                  ...tiers,
                  pro: {
                    ...pro,
                    originalPrice,
                  },
                })
              }
              onRegionalUpdate={onRegionalUpdate}
            />

            {/* Premium Plan */}
            <PricingTierCard
              tierId="premium"
              tierName="Premium Tier"
              tierDescription="Advanced AI features & unlimited evaluations"
              activeText="Premium tier for intensive preparation"
              icon={ShieldCheck}
              price={premium.price}
              originalPrice={premium.originalPrice}
              regional={premium.regional}
              saving={saving}
              onChangePrice={(price) =>
                onChangePricingTiers({
                  ...tiers,
                  premium: {
                    ...premium,
                    price,
                  },
                })
              }
              onChangeOriginalPrice={(originalPrice) =>
                onChangePricingTiers({
                  ...tiers,
                  premium: {
                    ...premium,
                    originalPrice,
                  },
                })
              }
              onRegionalUpdate={onRegionalUpdate}
            />
          </div>

          <PricingSettingsFooter onSave={onSave} pricingTiers={pricingTiers} saving={saving} />
        </div>
      </div>
    </motion.div>
  );
}
