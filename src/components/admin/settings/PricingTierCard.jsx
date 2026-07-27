import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Globe, Plus, Trash2 } from 'lucide-react';
import CountryAutocomplete from './CountryAutocomplete';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

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
    <motion.div variants={itemVariants} className="group relative" data-oid=".zn-4cw">
      <div
        className="relative p-6 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 flex flex-col gap-5 shadow-2xs transition-all duration-200"
        data-oid="my7yzx-"
      >
        <div className="flex items-center justify-between" data-oid="r3k0k3l">
          <div className="flex items-center gap-3" data-oid="fc:m5y.">
            <div
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200/80 dark:border-white/10 shadow-2xs"
              data-oid="jkak7gt"
            >
              <Icon className="w-5 h-5" data-oid=".0_6_7c" />
            </div>
            <div data-oid="r2twdt:">
              <h4 className="font-black text-lg text-slate-950 dark:text-white" data-oid="e4rdac8">
                {tierName}
              </h4>
              <p
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
                data-oid="n_kw0le"
              >
                {tierDescription}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase"
            data-oid="caj7v.9"
          >
            Monthly Plan
          </Badge>
        </div>

        <div className="space-y-4" data-oid="vlo1u13">
          <div className="grid grid-cols-2 gap-3" data-oid="xjddd2z">
            <div className="space-y-1.5" data-oid="wg94n7i">
              <Label
                className="text-[10px] font-black text-slate-500 uppercase tracking-wider"
                data-oid="v066p1w"
              >
                Current Price (USD)
              </Label>
              <div className="relative group/input" data-oid="dfhx2:w">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-base text-indigo-600 dark:text-indigo-400 z-10 select-none"
                  data-oid="lgdpi-2"
                >
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price || ''}
                  onChange={(e) => onChangePrice(parseFloat(e.target.value))}
                  className="h-10 pl-8 font-black text-base bg-slate-50/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-slate-950 dark:text-white shadow-2xs"
                  placeholder="9.99"
                  data-oid="o1jccs."
                />
              </div>
            </div>
            <div className="space-y-1.5" data-oid="w743wq5">
              <Label
                className="text-[10px] font-black text-slate-400 uppercase tracking-wider"
                data-oid="6ynrxtx"
              >
                Original Price (Was)
              </Label>
              <div className="relative group/input" data-oid="_vk32vs">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-slate-400 z-10 select-none"
                  data-oid="9s1g8sh"
                >
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={originalPrice || ''}
                  onChange={(e) => onChangeOriginalPrice(parseFloat(e.target.value))}
                  className="h-10 pl-8 font-bold text-base bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl shadow-2xs"
                  placeholder="15"
                  data-oid="-d_vp:r"
                />
              </div>
            </div>
          </div>

          {/* Auto-calculated discount preview */}
          {price && originalPrice && price < originalPrice && (
            <div
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-400 text-xs font-bold"
              data-oid="f1tv8_i"
            >
              <div
                className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0"
                data-oid="s4rzjmg"
              >
                <Icon
                  className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                  data-oid="tpdcbul"
                />
              </div>
              <div data-oid="h6o4dhd" className="space-y-0.5">
                <p
                  className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300"
                  data-oid="cy-rzr9"
                >
                  Auto Discount: {Math.round((1 - price / originalPrice) * 100)}% OFF
                </p>
                <p
                  className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/80"
                  data-oid="b389l9o"
                >
                  Quarterly rate: {Math.round((1 - (price * 0.85) / originalPrice) * 100)}% off
                  total
                </p>
              </div>
            </div>
          )}

          <div
            className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
            data-oid="fyi01cr"
          >
            <div
              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
              data-oid="p93ijbu"
            ></div>
            <span data-oid="r6ikakq">{activeText}</span>
          </div>

          {/* Regional Pricing Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/5" data-oid="n5xbdyj">
            <div className="flex items-center justify-between mb-2.5" data-oid=":0nen-s">
              <Label
                className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
                data-oid="6-gg:1h"
              >
                <Globe className="w-3 h-3 text-indigo-500" data-oid="ms_eoo1" /> Regional Pricing
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRegionalUpdate({ tier: tierId, action: 'add' })}
                className="h-7 px-2.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                data-oid="6jf6l5p"
              >
                <Plus className="w-3 h-3 mr-1" data-oid="x-1o879" /> Add Region
              </Button>
            </div>

            <div className="space-y-2" data-oid="bwza9sg">
              {regional?.map((region, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/80 dark:border-white/5 group/item hover:border-slate-300 transition-colors shadow-2xs"
                  data-oid="qb:ds67"
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
                    data-oid="nrc_jqw"
                  />

                  <div className="relative flex-1 min-w-[110px]" data-oid="z.ef:47">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 select-none"
                      data-oid="d2qvo55"
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
                      className="h-8 pl-7 pr-10 text-xs font-mono font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg"
                      data-oid="ndqqo:3"
                    />

                    <div
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      data-oid="um7tkts"
                    >
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[9px] font-black tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        data-oid="esj9iw2"
                      >
                        {region.currency || 'USD'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRegionalUpdate({ tier: tierId, action: 'remove', index: idx })}
                    className="h-9 w-9 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors opacity-60 group-hover/item:opacity-100"
                    data-oid="_4tk-3j"
                  >
                    <Trash2 className="w-4 h-4" data-oid="r1:da6w" />
                  </Button>
                </div>
              ))}
              {(!regional || regional.length === 0) && (
                <p className="text-xs text-muted-foreground italic pl-1" data-oid="byz3ucd">
                  No regional overrides configured
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
