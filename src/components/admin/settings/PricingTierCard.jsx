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
  theme = {
    gradientFrom: 'from-blue-500/5',
    border: 'border-blue-200/60 dark:border-blue-800/40',
    bgGradient: 'from-blue-50/30 to-background dark:from-blue-900/10 dark:to-slate-900/50',
    iconGradient: 'from-blue-500 to-blue-600',
    iconShadow: 'shadow-blue-500/25',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200/50 dark:border-blue-800/50',
    textColor: 'text-blue-700 dark:text-blue-300',
    inputRing: 'focus-visible:ring-blue-500/20 focus-visible:border-blue-500',
    discountBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    discountBorder: 'border-emerald-200/50 dark:border-emerald-800/30',
    discountText: 'text-emerald-700 dark:text-emerald-300',
    discountTextMuted: 'text-emerald-600/70 dark:text-emerald-400/70',
    regionalText: 'text-blue-700 dark:text-blue-300',
    regionalHover: 'hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    bulletColor: 'bg-emerald-500',
  },
}) {
  return (
    <motion.div variants={itemVariants} className="group relative" data-oid=".zn-4cw">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradientFrom} to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        data-oid="0y7b3tg"
      ></div>
      <div
        className={`relative p-8 rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.bgGradient} flex flex-col gap-6 shadow-sm hover:shadow-md transition-all duration-300`}
        data-oid="my7yzx-"
      >
        <div className="flex items-center justify-between" data-oid="r3k0k3l">
          <div className="flex items-center gap-3" data-oid="fc:m5y.">
            <div
              className={`p-3 bg-gradient-to-br ${theme.iconGradient} rounded-xl text-white shadow-lg ${theme.iconShadow}`}
              data-oid="jkak7gt"
            >
              <Icon className="w-6 h-6" data-oid=".0_6_7c" />
            </div>
            <div data-oid="r2twdt:">
              <h4 className="font-bold text-xl text-foreground" data-oid="e4rdac8">
                {tierName}
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="n_kw0le">
                {tierDescription}
              </p>
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}
            data-oid="caj7v.9"
          >
            <span className="text-xs font-semibold" data-oid="d5ficww">
              Monthly
            </span>
          </div>
        </div>

        <div className="space-y-4" data-oid="vlo1u13">
          <div className="grid grid-cols-2 gap-4" data-oid="xjddd2z">
            <div className="space-y-2" data-oid="wg94n7i">
              <Label
                className={`text-xs font-bold ${theme.textColor} uppercase tracking-wider opacity-80`}
                data-oid="v066p1w"
              >
                Current Price (USD)
              </Label>
              <div className="relative group/input" data-oid="dfhx2:w">
                <span
                  className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg ${theme.textColor} z-10`}
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
                  className={`h-12 pl-10 bg-background font-bold text-xl rounded-xl shadow-sm ${theme.inputRing}`}
                  placeholder="9.99"
                  data-oid="o1jccs."
                />
              </div>
            </div>
            <div className="space-y-2" data-oid="w743wq5">
              <Label
                className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider opacity-80"
                data-oid="6ynrxtx"
              >
                Original Price (Was)
              </Label>
              <div className="relative group/input" data-oid="_vk32vs">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-slate-400 z-10"
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
                  className="h-12 pl-10 bg-muted/30 border-slate-200/60 dark:border-slate-800/40 font-bold text-xl text-slate-500 focus-visible:ring-slate-500/20 rounded-xl"
                  placeholder="15"
                  data-oid="-d_vp:r"
                />
              </div>
            </div>
          </div>

          {/* Auto-calculated discount preview */}
          {price && originalPrice && (
            <div
              className={`flex items-center gap-3 p-3 rounded-xl ${theme.discountBg} border ${theme.discountBorder}`}
              data-oid="f1tv8_i"
            >
              <div
                className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center"
                data-oid="s4rzjmg"
              >
                <Icon className={`w-4 h-4 ${theme.discountText}`} data-oid="tpdcbul" />
              </div>
              <div data-oid="h6o4dhd">
                <p className={`text-xs font-bold ${theme.discountText}`} data-oid="cy-rzr9">
                  Auto-calculated discount: {Math.round((1 - price / originalPrice) * 100)}% OFF
                </p>
                <p className={`text-[10px] ${theme.discountTextMuted}`} data-oid="b389l9o">
                  Quarterly will show additional 15% off (total:{' '}
                  {Math.round((1 - (price * 0.85) / originalPrice) * 100)}%)
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground" data-oid="fyi01cr">
            <div
              className={`w-2 h-2 rounded-full ${theme.bulletColor} animate-pulse`}
              data-oid="p93ijbu"
            ></div>
            <span data-oid="r6ikakq">{activeText}</span>
          </div>

          {/* Regional Pricing Section */}
          <div className="pt-4 border-t border-border/40" data-oid="n5xbdyj">
            <div className="flex items-center justify-between mb-3" data-oid=":0nen-s">
              <Label
                className={`text-xs font-bold ${theme.regionalText} uppercase tracking-wider opacity-80 flex items-center gap-1`}
                data-oid="6-gg:1h"
              >
                <Globe className="w-3 h-3" data-oid="ms_eoo1" /> Regional Pricing
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRegionalUpdate({ tier: tierId, action: 'add' })}
                className={`h-6 px-2 text-xs ${theme.regionalHover}`}
                data-oid="6jf6l5p"
              >
                <Plus className="w-3 h-3 mr-1" data-oid="x-1o879" /> Add Region
              </Button>
            </div>

            <div className="space-y-2" data-oid="bwza9sg">
              {regional?.map((region, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/40 group/item hover:bg-muted/50 transition-colors"
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

                  <div className="relative flex-1 min-w-[120px]" data-oid="z.ef:47">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none"
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
                      className="h-9 pl-8 pr-12 text-sm font-semibold bg-background border-border/40 focus-visible:ring-blue-500/20"
                      data-oid="ndqqo:3"
                    />

                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      data-oid="um7tkts"
                    >
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-mono tracking-wider opacity-70"
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
