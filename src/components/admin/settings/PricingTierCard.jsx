import { m } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL, FADE_UP } from '@/components/admin/ui/primitives';
import CountryAutocomplete from './CountryAutocomplete';

const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');

export default function PricingTierCard({
  tierId,
  tierName,
  tierDescription,
  activeText,
  icon: Icon,
  price,
  originalPrice,
  regional,
  saving,
  onChangePrice,
  onChangeOriginalPrice,
  onRegionalUpdate,
}) {
  return (
    <m.div variants={FADE_UP} className={cn(PANEL, 'p-4 space-y-4')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-stone-300">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-50">{tierName}</h4>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
              {tierDescription}
            </p>
          </div>
        </div>
        <span
          className={cn(
            MICRO,
            'text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-white/10 rounded-md px-1.5 py-0.5'
          )}
        >
          Monthly
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className={FIELD_LABEL}>Current price (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-sm text-stone-900 dark:text-stone-50 z-10 select-none">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price || ''}
              onChange={(e) => onChangePrice(parseFloat(e.target.value))}
              className="h-10 pl-7 font-black text-sm rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315]"
              placeholder="9.99"
            />
          </div>
        </div>
        <div>
          <Label className={FIELD_LABEL}>Original price (was)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-stone-500 dark:text-stone-400 z-10 select-none">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={originalPrice || ''}
              onChange={(e) => onChangeOriginalPrice(parseFloat(e.target.value))}
              className="h-10 pl-7 font-bold text-sm rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-500 dark:text-stone-400"
              placeholder="15"
            />
          </div>
        </div>
      </div>

      {price && originalPrice && price < originalPrice && (
        <div className="flex items-center gap-2.5 p-2.5 rounded-md border border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)]">
          <div className="w-6 h-6 rounded-md bg-[rgb(var(--signal-ok)/0.12)] grid place-items-center shrink-0">
            <Icon className="w-3 h-3 text-[rgb(var(--signal-ok))]" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-[rgb(var(--signal-ok))]">
              Auto discount: {Math.round((1 - price / originalPrice) * 100)}% off
            </p>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
              Quarterly rate: {Math.round((1 - (price * 0.85) / originalPrice) * 100)}% off total
            </p>
          </div>
        </div>
      )}

      <div className={cn(MICRO, 'flex items-center gap-1.5 text-stone-500 dark:text-stone-400')}>
        <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
        {activeText}
      </div>

      <div className="pt-3 border-t border-stone-100 dark:border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <Label className={cn(FIELD_LABEL, 'mb-0 flex items-center gap-1.5')}>
            <Globe className="w-3 h-3 text-stone-500 dark:text-stone-400" /> Regional pricing
          </Label>
          <button
            onClick={() => onRegionalUpdate({ tier: tierId, action: 'add' })}
            className={cn(
              MICRO,
              'inline-flex items-center gap-1 rounded-md border border-stone-300 dark:border-white/15 px-2 py-1 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors'
            )}
          >
            <Plus className="w-2.5 h-2.5" /> Add region
          </button>
        </div>

        <div className="space-y-2">
          {regional?.map((region, idx) => (
            <div
              key={idx}
              className="flex flex-col min-[450px]:flex-row items-stretch min-[450px]:items-center gap-2 bg-stone-50 dark:bg-white/[0.02] p-2 rounded-md border border-stone-200/70 dark:border-white/[0.06]"
            >
              <CountryAutocomplete
                value={region.country}
                disabled={saving}
                onChange={(country) =>
                  onRegionalUpdate({
                    tier: tierId,
                    action: 'update',
                    index: idx,
                    field: {
                      country: country.code,
                      currency: country.currency,
                      symbol: country.symbol,
                    },
                  })
                }
              />
              <div className="relative flex-1 min-w-[110px]">
                <span
                  className={cn(
                    NUM,
                    'absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 select-none'
                  )}
                >
                  {region.symbol || '$'}
                </span>
                <Input
                  type="number"
                  placeholder="Price"
                  value={region.price || ''}
                  onChange={(e) =>
                    onRegionalUpdate({
                      tier: tierId,
                      action: 'update',
                      index: idx,
                      field: 'price',
                      value: parseFloat(e.target.value),
                    })
                  }
                  className="h-8 pl-6 pr-12 text-xs font-mono font-bold rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315]"
                />
                <span
                  className={cn(
                    MICRO,
                    'absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/[0.06] px-1 py-0.5 rounded pointer-events-none'
                  )}
                >
                  {region.currency || 'USD'}
                </span>
              </div>
              <button
                onClick={() => onRegionalUpdate({ tier: tierId, action: 'remove', index: idx })}
                className="h-8 w-8 grid place-items-center shrink-0 rounded-md text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {(!regional || regional.length === 0) && (
            <p className="text-xs text-stone-500 dark:text-stone-400 italic">
              No regional overrides configured
            </p>
          )}
        </div>
      </div>
    </m.div>
  );
}
