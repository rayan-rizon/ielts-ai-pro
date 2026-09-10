import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Gauge,
  Save,
  RefreshCw,
  Crown,
  Sparkles,
  User,
  Shield,
  Pen,
  Mic,
  Globe,
  Plus,
} from 'lucide-react';
import { TierRateLimit } from '@/features/admin/services/TierRateLimit';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  NUM,
  MICRO,
  PANEL,
  AdminButton,
  STAGGER_CONTAINER,
  FADE_UP,
} from '@/components/admin/ui/primitives';
import { clearLimitsCache } from '@/lib/tierLimitsUtils';

const TIER_CONFIG = {
  free: { icon: User },
  pro: { icon: Crown },
  premium: { icon: Sparkles },
  admin: { icon: Shield },
};

const TIERS_LIST = ['free', 'pro', 'premium', 'admin'];

const QUOTA_FIELDS = [
  'daily_limit',
  'monthly_limit',
  'burst_limit',
  'writing_daily_limit',
  'writing_monthly_limit',
  'speaking_daily_limit',
  'speaking_monthly_limit',
];

const DEFAULT_QUOTAS = {
  daily_limit: 5,
  monthly_limit: 5,
  burst_limit: 10,
  writing_daily_limit: 5,
  writing_monthly_limit: 5,
  speaking_daily_limit: 5,
  speaking_monthly_limit: 5,
};

const limitKey = (tier, currency) => `${tier}_${currency || 'ALL'}`;

const checkHasChanges = (original, edited) => {
  if (!original || !edited) return false;
  if (original.isNew) return true;
  return QUOTA_FIELDS.some((field) => original[field] !== edited[field]);
};

const getAvailableCurrencies = (tierLimits, tierName) => {
  const currentLimits = tierLimits.filter((t) => t.tier === tierName);
  const currencies = new Set(currentLimits.map((t) => t.currency || 'ALL'));
  currencies.add('ALL');
  return Array.from(currencies).sort((a, b) =>
    a === 'ALL' ? -1 : b === 'ALL' ? 1 : a.localeCompare(b)
  );
};

const getActiveLimitData = (tierLimits, tierName, currency) => {
  const currentLimits = tierLimits.filter((t) => t.tier === tierName);
  return (
    currentLimits.find((t) => t.currency === currency) ||
    currentLimits.find((t) => t.currency === 'ALL') ||
    {}
  );
};

const LimitInput = ({ label, value, onChange }) => (
  <div className="space-y-0.5">
    <Label className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>{label}</Label>
    <Input
      type="number"
      value={value ?? 0}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        NUM,
        'h-7 text-xs font-bold rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] px-2'
      )}
    />
  </div>
);

const TierHeader = ({
  tierName,
  tierIcon: TierIcon,
  selectedCur,
  availableCurrencies,
  onSelectCurrency,
  onAddOverride,
  hasChanges,
}) => (
  <div className="p-4 border-b border-stone-100 dark:border-white/6">
    <div className="flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-md bg-stone-100 dark:bg-white/6 text-stone-600 dark:text-stone-300 shrink-0">
          <TierIcon className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-50 capitalize">
            {tierName} tier
          </h4>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
            API & evaluation quotas
          </p>
        </div>
      </div>
      <button
        onClick={onAddOverride}
        className={cn(
          MICRO,
          'w-full min-[480px]:w-auto inline-flex items-center justify-center gap-1 rounded-md border border-stone-300 dark:border-white/15 px-2.5 py-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors shrink-0'
        )}
      >
        <Plus className="w-3 h-3" />
        Add override
      </button>
    </div>

    <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
      {availableCurrencies.map((cur) => {
        const isCurActive = selectedCur === cur;
        const curChanged = hasChanges(cur);
        return (
          <button
            key={cur}
            type="button"
            onClick={() => onSelectCurrency(cur)}
            className={cn(
              MICRO,
              'relative px-2.5 py-1 rounded-md transition-all active:scale-95 flex items-center gap-1.5 border shrink-0',
              isCurActive
                ? 'text-white dark:text-stone-50 border-transparent'
                : 'bg-white dark:bg-[#131315] text-stone-500 dark:text-stone-400 border-stone-200 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/20'
            )}
          >
            {isCurActive && (
              <m.span
                layoutId={`currencyPill-${tierName}`}
                className="absolute inset-0 bg-stone-900 dark:bg-white/10 rounded-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            {cur === 'ALL' && <Globe className="relative w-2.5 h-2.5 opacity-80" />}
            <span className="relative">{cur === 'ALL' ? 'Global' : cur}</span>
            {curChanged && (
              <span className="relative w-1 h-1 rounded-full bg-[rgb(var(--signal-warn))]" />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

const TierBody = ({
  selectedCur,
  edited,
  activeLimitData,
  changed,
  isSaving,
  onValueChange,
  onSave,
}) => {
  const getVal = (field) => edited[field] ?? activeLimitData[field] ?? 0;

  return (
    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              General ({selectedCur})
            </span>
            {changed && (
              <span className={cn(MICRO, 'text-[rgb(var(--signal-warn))]')}>Modified</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <LimitInput
              label="Daily"
              value={getVal('daily_limit')}
              onChange={(v) => onValueChange('daily_limit', v)}
            />
            <LimitInput
              label="Monthly"
              value={getVal('monthly_limit')}
              onChange={(v) => onValueChange('monthly_limit', v)}
            />
            <LimitInput
              label="Burst/min"
              value={getVal('burst_limit')}
              onChange={(v) => onValueChange('burst_limit', v)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1.5 p-2.5 rounded-md border border-stone-200/70 dark:border-white/6 bg-stone-50/70 dark:bg-white/2">
            <div
              className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1')}
            >
              <Pen className="w-2.5 h-2.5" />
              Writing
            </div>
            <p className="text-[10px] leading-snug text-stone-500 dark:text-stone-400">
              1 evaluation = any 2 Task 1 or Task 2 reviews
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <LimitInput
                label="Daily"
                value={getVal('writing_daily_limit')}
                onChange={(v) => onValueChange('writing_daily_limit', v)}
              />
              <LimitInput
                label="Monthly"
                value={getVal('writing_monthly_limit')}
                onChange={(v) => onValueChange('writing_monthly_limit', v)}
              />
            </div>
          </div>

          <div className="space-y-1.5 p-2.5 rounded-md border border-stone-200/70 dark:border-white/6 bg-stone-50/70 dark:bg-white/2">
            <div
              className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1')}
            >
              <Mic className="w-2.5 h-2.5" />
              Speaking
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <LimitInput
                label="Daily"
                value={getVal('speaking_daily_limit')}
                onChange={(v) => onValueChange('speaking_daily_limit', v)}
              />
              <LimitInput
                label="Monthly"
                value={getVal('speaking_monthly_limit')}
                onChange={(v) => onValueChange('speaking_monthly_limit', v)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-stone-100 dark:border-white/6 flex justify-between items-center mt-2">
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
          {activeLimitData.updated_at
            ? `Saved ${new Date(activeLimitData.updated_at).toLocaleDateString()}`
            : 'Not saved'}
        </span>
        <AdminButton onClick={onSave} disabled={!changed} loading={isSaving} size="sm">
          <Save className="w-3 h-3" />
          Save {selectedCur !== 'ALL' ? selectedCur : ''}
        </AdminButton>
      </div>
    </div>
  );
};

const TierCard = ({
  tierName,
  tierLimits,
  activeCurrency,
  onSelectCurrency,
  onAddOverride,
  editedValues,
  saving,
  onValueChange,
  onSave,
  hasChanges,
}) => {
  const config = TIER_CONFIG[tierName] || TIER_CONFIG.free;
  const TierIcon = config.icon;

  const availableCurrencies = getAvailableCurrencies(tierLimits, tierName);
  const selectedCur = activeCurrency || 'ALL';
  const activeLimitData = getActiveLimitData(tierLimits, tierName, selectedCur);

  const key = limitKey(tierName, selectedCur);
  const edited = editedValues[key] || {};
  const changed = hasChanges(tierName, selectedCur);
  const isSaving = saving[key] || false;

  return (
    <m.div variants={FADE_UP} className={cn(PANEL, 'overflow-hidden flex flex-col h-full')}>
      <TierHeader
        tierName={tierName}
        tierIcon={TierIcon}
        selectedCur={selectedCur}
        availableCurrencies={availableCurrencies}
        onSelectCurrency={(cur) => onSelectCurrency(tierName, cur)}
        onAddOverride={() => onAddOverride(tierName)}
        hasChanges={(cur) => hasChanges(tierName, cur)}
      />
      <TierBody
        selectedCur={selectedCur}
        edited={edited}
        activeLimitData={activeLimitData}
        changed={changed}
        isSaving={isSaving}
        onValueChange={(field, val) => onValueChange(tierName, selectedCur, field, val)}
        onSave={() => onSave(tierName, selectedCur)}
      />
    </m.div>
  );
};

const TierRateLimitsSettings = () => {
  const queryClient = useQueryClient();
  const [tierLimits, setTierLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [activeCurrencies, setActiveCurrencies] = useState({
    free: 'ALL',
    pro: 'ALL',
    premium: 'ALL',
    admin: 'ALL',
  });

  const fetchTierLimits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TierRateLimit.list();

      const uniqueMap = new Map();
      (data || []).forEach((item) => {
        const cur = (item.currency || 'ALL').toUpperCase();
        uniqueMap.set(`${item.tier}_${cur}`, { ...item, currency: cur });
      });
      const uniqueLimits = Array.from(uniqueMap.values());
      setTierLimits(uniqueLimits);

      const initial = {};
      uniqueLimits.forEach((tier) => {
        const key = limitKey(tier.tier, tier.currency);
        const quotaValues = {};
        QUOTA_FIELDS.forEach((f) => {
          quotaValues[f] = tier[f];
        });
        initial[key] = quotaValues;
      });
      setEditedValues(initial);
    } catch (error) {
      console.error('Error fetching tier limits:', error);
      toast.error('Failed to load rate limits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTierLimits();
  }, [fetchTierLimits]);

  const handleValueChange = (tier, currency, field, value) => {
    const key = limitKey(tier, currency);
    setEditedValues((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: parseInt(value) || 0 },
    }));
  };

  const handleSave = async (tier, currency = 'ALL') => {
    const key = limitKey(tier, currency);
    try {
      setSaving((prev) => ({ ...prev, [key]: true }));
      await TierRateLimit.upsert(tier, currency, editedValues[key]);
      clearLimitsCache();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tier-rate-limits'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription', 'pricingConfig'] }),
      ]);
      toast.success(`${tier.charAt(0).toUpperCase() + tier.slice(1)} (${currency}) limits updated`);
      fetchTierLimits();
    } catch (error) {
      console.error('Error saving tier limits:', error);
      toast.error('Failed to update limits');
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAddOverride = (tierName) => {
    const currency = window.prompt('Enter currency code for the override (e.g., BDT, INR, EUR)');
    if (!currency) return;

    const currUpper = currency.toUpperCase().trim();
    if (currUpper.length < 2) return toast.error('Invalid currency code');

    if (tierLimits.some((t) => t.tier === tierName && t.currency === currUpper)) {
      toast.error(`Override for ${currUpper} already exists in ${tierName}`);
      setActiveCurrencies((prev) => ({ ...prev, [tierName]: currUpper }));
      return;
    }

    const baseLimit =
      tierLimits.find((t) => t.tier === tierName && t.currency === 'ALL') || DEFAULT_QUOTAS;
    const newLimit = {
      ...baseLimit,
      id: `temp_${Date.now()}`,
      tier: tierName,
      currency: currUpper,
      isNew: true,
    };

    setTierLimits((prev) => [...prev, newLimit]);
    const key = limitKey(tierName, currUpper);
    const quotaValues = {};
    QUOTA_FIELDS.forEach((f) => {
      quotaValues[f] = newLimit[f];
    });
    setEditedValues((prev) => ({ ...prev, [key]: quotaValues }));
    setActiveCurrencies((prev) => ({ ...prev, [tierName]: currUpper }));
  };

  const hasChanges = (tier, currency) => {
    const key = limitKey(tier, currency);
    const original = tierLimits.find((t) => t.tier === tier && t.currency === currency);
    return checkHasChanges(original, editedValues[key]);
  };

  return (
    <m.div variants={STAGGER_CONTAINER} initial="hidden" animate="visible" className="space-y-4">
      <m.div
        variants={FADE_UP}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            AI Rate Limits
          </h3>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
            Global defaults and currency-specific overrides
          </p>
        </div>
        <button
          onClick={fetchTierLimits}
          className={cn(
            MICRO,
            'w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 dark:border-white/15 px-3 py-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors'
          )}
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(PANEL, 'h-64 animate-pulse')} />
            ))
          : TIERS_LIST.map((tierName) => (
              <TierCard
                key={tierName}
                tierName={tierName}
                tierLimits={tierLimits}
                activeCurrency={activeCurrencies[tierName]}
                onSelectCurrency={(tier, cur) =>
                  setActiveCurrencies((prev) => ({ ...prev, [tier]: cur }))
                }
                onAddOverride={handleAddOverride}
                editedValues={editedValues}
                saving={saving}
                onValueChange={handleValueChange}
                onSave={handleSave}
                hasChanges={hasChanges}
              />
            ))}
      </div>

      <m.div variants={FADE_UP} className={cn(PANEL, 'p-4 flex items-start gap-3')}>
        <Gauge className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-extrabold text-stone-900 dark:text-stone-50">Rate limit enforcement</p>
          <p className="text-stone-500 dark:text-stone-400">
            <strong>Global</strong> applies to everyone unless matched by a regional currency
            override. <strong>Currency overrides</strong> apply based on subscription currency (e.g.
            BDT, INR).
          </p>
        </div>
      </m.div>
    </m.div>
  );
};

export default TierRateLimitsSettings;
