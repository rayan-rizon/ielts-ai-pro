import { m } from 'framer-motion';
import { DollarSign, Zap, Save, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  MICRO,
  PANEL,
  AdminButton,
  STAGGER_CONTAINER,
  FADE_UP,
} from '@/components/admin/ui/primitives';
import PricingTierCard from './PricingTierCard';

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
    <m.div variants={FADE_UP} className="max-w-5xl">
      <div className={cn(PANEL, 'overflow-hidden')}>
        <div className="p-4 border-b border-stone-100 dark:border-white/[0.06] flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-stone-300">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50">Pricing</h3>
            <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>
              Rates, discounts, and regional overrides
            </p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <m.div
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-4"
          >
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
              onChangePrice={(price) => onChangePricingTiers({ ...tiers, pro: { ...pro, price } })}
              onChangeOriginalPrice={(originalPrice) =>
                onChangePricingTiers({ ...tiers, pro: { ...pro, originalPrice } })
              }
              onRegionalUpdate={onRegionalUpdate}
            />
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
                onChangePricingTiers({ ...tiers, premium: { ...premium, price } })
              }
              onChangeOriginalPrice={(originalPrice) =>
                onChangePricingTiers({ ...tiers, premium: { ...premium, originalPrice } })
              }
              onRegionalUpdate={onRegionalUpdate}
            />
          </m.div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-stone-100 dark:border-white/[0.06]">
            <span className={cn(MICRO, 'text-stone-400 flex items-center gap-1.5')}>
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
              Pricing updates apply across all billing flows immediately
            </span>
            <AdminButton onClick={() => onSave('pricing_tiers', pricingTiers)} loading={saving}>
              <Save className="w-3.5 h-3.5" />
              Update pricing
            </AdminButton>
          </div>
        </div>
      </div>
    </m.div>
  );
}
