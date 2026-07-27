import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
  return Array.from(currencies).sort((a, b) => {
    if (a === 'ALL') return -1;
    if (b === 'ALL') return 1;
    return a.localeCompare(b);
  });
};

const getActiveLimitData = (tierLimits, tierName, currency) => {
  const currentLimits = tierLimits.filter((t) => t.tier === tierName);
  return (
    currentLimits.find((t) => t.currency === currency) ||
    currentLimits.find((t) => t.currency === 'ALL') ||
    {}
  );
};

// Sub-component: Limit Input Field
const LimitInput = ({ label, value, onChange, className = '', height = 'h-7' }) => (
  <div className="space-y-0.5">
    <Label className="text-[9px] font-bold text-slate-400">{label}</Label>
    <Input
      type="number"
      value={value ?? 0}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        `${height} font-mono text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 px-2`,
        className
      )}
    />
  </div>
);

// Sub-component: Card Header for Tier
const TierHeader = ({
  tierName,
  tierIcon: TierIcon,
  selectedCur,
  availableCurrencies,
  onSelectCurrency,
  onAddOverride,
  hasChanges,
}) => (
  <CardHeader className="bg-slate-50/80 dark:bg-slate-900/90 border-b border-slate-100 dark:border-white/5 p-4 sm:p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xs">
          <TierIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <CardTitle className="text-base font-black text-slate-950 dark:text-white capitalize">
            {tierName} Tier
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            API & evaluation quotas
          </CardDescription>
        </div>
      </div>
      <Button
        onClick={onAddOverride}
        size="sm"
        variant="outline"
        className="bg-white dark:bg-slate-800 hover:bg-slate-100 border-slate-200 dark:border-white/10 gap-1.5 h-8 px-3 text-xs font-extrabold rounded-xl shadow-2xs"
      >
        <Plus className="w-3.5 h-3.5 text-indigo-600" />
        Add Override
      </Button>
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
              'px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border shrink-0',
              isCurActive
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/10 hover:border-slate-300'
            )}
          >
            {cur === 'ALL' && <Globe className="w-3 h-3 opacity-80" />}
            <span>{cur === 'ALL' ? 'Global Default' : `${cur} Override`}</span>
            {curChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
          </button>
        );
      })}
    </div>
  </CardHeader>
);

// Sub-component: Form Controls for Limits
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
    <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
      <div className="space-y-3">
        {/* General Limits */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              General Limits ({selectedCur})
            </span>
            {changed && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                Modified
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <LimitInput
              label="Daily"
              value={getVal('daily_limit')}
              onChange={(val) => onValueChange('daily_limit', val)}
              className="bg-slate-50/50 dark:bg-slate-900"
            />
            <LimitInput
              label="Monthly"
              value={getVal('monthly_limit')}
              onChange={(val) => onValueChange('monthly_limit', val)}
              className="bg-slate-50/50 dark:bg-slate-900"
            />
            <LimitInput
              label="Burst / Min"
              value={getVal('burst_limit')}
              onChange={(val) => onValueChange('burst_limit', val)}
              className="bg-slate-50/50 dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Quota Limits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Writing Limits */}
          <div className="space-y-1.5 p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/40">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Pen className="w-3 h-3" />
              <span>Writing Limits</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <LimitInput
                label="Daily"
                value={getVal('writing_daily_limit')}
                onChange={(val) => onValueChange('writing_daily_limit', val)}
                className="bg-white dark:bg-slate-950"
                height="h-6.5"
              />
              <LimitInput
                label="Monthly"
                value={getVal('writing_monthly_limit')}
                onChange={(val) => onValueChange('writing_monthly_limit', val)}
                className="bg-white dark:bg-slate-950"
                height="h-6.5"
              />
            </div>
          </div>

          {/* Speaking Limits */}
          <div className="space-y-1.5 p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/40">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Mic className="w-3 h-3" />
              <span>Speaking Limits</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <LimitInput
                label="Daily"
                value={getVal('speaking_daily_limit')}
                onChange={(val) => onValueChange('speaking_daily_limit', val)}
                className="bg-white dark:bg-slate-950"
                height="h-6.5"
              />
              <LimitInput
                label="Monthly"
                value={getVal('speaking_monthly_limit')}
                onChange={(val) => onValueChange('speaking_monthly_limit', val)}
                className="bg-white dark:bg-slate-950"
                height="h-6.5"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center mt-2">
        <span className="text-[10px] font-medium text-slate-400">
          {activeLimitData.updated_at
            ? `Saved: ${new Date(activeLimitData.updated_at).toLocaleDateString()}`
            : 'Not saved'}
        </span>
        <Button
          onClick={onSave}
          disabled={!changed || isSaving}
          size="sm"
          className="gap-1.5 h-7.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save {selectedCur !== 'ALL' ? selectedCur : ''}</span>
        </Button>
      </div>
    </CardContent>
  );
};

// Sub-component: Individual Tier Card
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
  itemVariants,
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
    <motion.div variants={itemVariants}>
      <Card className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl overflow-hidden shadow-2xs flex flex-col h-full">
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
      </Card>
    </motion.div>
  );
};

// Main Component
const TierRateLimitsSettings = () => {
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
        const key = `${item.tier}_${cur}`;
        uniqueMap.set(key, { ...item, currency: cur });
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
      [key]: {
        ...(prev[key] || {}),
        [field]: parseInt(value) || 0,
      },
    }));
  };

  const handleSave = async (tier, currency = 'ALL') => {
    const key = limitKey(tier, currency);
    try {
      setSaving((prev) => ({ ...prev, [key]: true }));
      await TierRateLimit.upsert(tier, currency, editedValues[key]);
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
    const currency = window.prompt('Enter Currency Code for the override (e.g., BDT, INR, EUR)');
    if (!currency) return;

    const currUpper = currency.toUpperCase().trim();
    if (currUpper.length < 2) {
      toast.error('Invalid currency code');
      return;
    }

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

    setEditedValues((prev) => ({
      ...prev,
      [key]: quotaValues,
    }));

    setActiveCurrencies((prev) => ({ ...prev, [tierName]: currUpper }));
  };

  const hasChanges = (tier, currency) => {
    const key = limitKey(tier, currency);
    const original = tierLimits.find((t) => t.tier === tier && t.currency === currency);
    const edited = editedValues[key];
    return checkHasChanges(original, edited);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1"
      >
        <div className="space-y-0.5">
          <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>AI Rate Limits Config</span>
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Configure global defaults and currency-specific regional API limits.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTierLimits}
          className="gap-2 h-9 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Limits
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading
          ? [...Array(4)].map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              </motion.div>
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
                itemVariants={itemVariants}
              />
            ))}
      </div>

      <motion.div variants={itemVariants}>
        <Card className="border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/60 rounded-2xl shadow-2xs overflow-hidden text-xs">
          <CardContent className="p-5 flex items-start gap-3">
            <Gauge className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                Rate Limit Enforcement & Regional Overrides
              </p>
              <div className="text-slate-500 dark:text-slate-400 text-xs space-y-1 font-medium">
                <p>
                  <strong>Global Default:</strong> Applied to all candidates unless matched by a
                  regional currency override.
                </p>
                <p>
                  <strong>Currency Overrides:</strong> Overrides quotas based on candidate
                  subscription currency (e.g. BDT, INR).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TierRateLimitsSettings;
