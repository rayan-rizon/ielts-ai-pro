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
    className="p-6 border-b border-border/40 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20"
    data-oid="f8sa9t:"
  >
    <div className="flex items-center gap-3" data-oid="z49kav8">
      <div
        className="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-500/30"
        data-oid="h6ax7g5"
      >
        <DollarSign className="w-6 h-6" data-oid="t493xto" />
      </div>
      <div className="space-y-1" data-oid="tcj0xox">
        <h3 className="text-xl font-bold tracking-tight text-foreground" data-oid="q_mbpg0">
          Pricing Configuration
        </h3>
        <p className="text-sm text-muted-foreground" data-oid=".ky0t.m">
          Manage global subscription costs and economic tiers
        </p>
      </div>
    </div>
  </div>
);

const PricingSettingsFooter = ({ onSave, pricingTiers, saving }) => (
  <div
    className="flex items-center justify-between pt-6 border-t border-border/30"
    data-oid="b25u3fj"
  >
    <div className="flex items-center gap-3 text-sm text-muted-foreground" data-oid="qih51.2">
      <div className="w-2 h-2 rounded-full bg-emerald-500" data-oid="4n.-03f"></div>
      <span data-oid="8vwkl:7">Pricing changes take effect immediately</span>
    </div>
    <Button
      onClick={() => onSave('pricing_tiers', pricingTiers)}
      disabled={saving}
      className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
      data-oid=":i.ehgz"
    >
      {saving ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="c8.w.wa" />
      ) : (
        <Save className="mr-2 h-4 w-4" data-oid="9yq1h4h" />
      )}
      Update Pricing
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
    <motion.div variants={itemVariants} className="max-w-5xl" data-oid="duxl5bf">
      <div
        className="rounded-xl border text-card-foreground bg-card/50 backdrop-blur-sm border-border/50 shadow-sm overflow-hidden"
        data-oid="_v9cdza"
      >
        <PricingSettingsHeader />

        <div className="p-8 space-y-8" data-oid="bws3833">
          <div className="grid md:grid-cols-2 gap-8" data-oid="piynevn">
            {/* Pro Plan */}
            <PricingTierCard
              tierId="pro"
              tierName="Pro Plan"
              tierDescription="Professional features"
              activeText="Active plan for professional users"
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
              tierDescription="Advanced capabilities"
              activeText="Premium features for power users"
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
              theme={premiumTheme}
            />
          </div>

          <PricingSettingsFooter onSave={onSave} pricingTiers={pricingTiers} saving={saving} />
        </div>
      </div>
    </motion.div>
  );
}
