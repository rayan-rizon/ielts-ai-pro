import { useState, useEffect, useCallback, useMemo } from 'react';
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
  BookOpen,
  Headphones,
  Globe,
  Plus,
  Check,
  Layers,
  Activity,
  GraduationCap,
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
  LiveDot,
} from '@/components/admin/ui/primitives';
import { clearLimitsCache } from '@/lib/tierLimitsUtils';

const TIER_CONFIG = {
  free: {
    icon: User,
    chipClass: 'text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-white/6',
    description: 'Free trial & guest evaluation quotas',
  },
  pro: {
    icon: Crown,
    chipClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20',
    description: 'Standard subscribers quota allocation',
  },
  premium: {
    icon: Sparkles,
    chipClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20',
    description: 'High-volume intensive preparation limits',
  },
  admin: {
    icon: Shield,
    chipClass:
      'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
    description: 'Internal administrative access & bypass',
  },
};

const TIERS_LIST = ['free', 'pro', 'premium', 'admin'];

const QUOTA_FIELDS = [
  // Legacy general quotas still protect non-evaluation API routes. Keep their
  // stored values intact when saving the visible Writing, Speaking and test limits.
  'daily_limit',
  'monthly_limit',
  'burst_limit',
  'writing_daily_limit',
  'writing_monthly_limit',
  'speaking_daily_limit',
  'speaking_monthly_limit',
  'reading_test_limit',
  'listening_test_limit',
];

const DEFAULT_QUOTAS = {
  daily_limit: 5,
  monthly_limit: 5,
  burst_limit: 10,
  writing_daily_limit: 5,
  writing_monthly_limit: 5,
  speaking_daily_limit: 5,
  speaking_monthly_limit: 5,
  reading_test_limit: -1,
  listening_test_limit: -1,
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

const LimitInput = ({ label, value, onChange, placeholder = '0' }) => (
  <div className="space-y-1 min-w-0">
    <Label
      className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate block h-3 leading-none')}
    >
      {label}
    </Label>
    <Input
      type="number"
      min="0"
      value={value ?? 0}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        NUM,
        'h-7 text-xs font-bold rounded-md border-stone-200/90 dark:border-white/10 bg-white dark:bg-[#131315] px-2 w-full min-w-0 transition-colors hover:border-stone-300 dark:hover:border-white/20 focus-visible:ring-1 focus-visible:ring-[#5a63df]'
      )}
    />
  </div>
);

const CompactTestLimitInput = ({ label, value, onChange }) => {
  const isUnlimited = value === -1;
  return (
    <div className="flex items-center justify-between gap-2 min-w-0 h-7">
      <label
        className={cn(
          MICRO,
          'flex items-center gap-1 text-stone-600 dark:text-stone-300 cursor-pointer select-none leading-none min-w-0'
        )}
      >
        <input
          type="checkbox"
          aria-label={`${label} unlimited`}
          checked={isUnlimited}
          onChange={(event) => onChange(event.target.checked ? -1 : 0)}
          className="h-3.5 w-3.5 rounded border-stone-300 dark:border-white/20 text-[#5a63df] focus:ring-[#5a63df] accent-[#5a63df] cursor-pointer shrink-0"
        />
        <span className="truncate">{label}</span>
        <span className="sr-only">unlimited</span>
      </label>
      <div className="w-20 shrink-0">
        <Input
          type="number"
          min="0"
          step="1"
          aria-label={`${label} limit`}
          value={isUnlimited ? '' : value}
          placeholder="No limit"
          disabled={isUnlimited}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            NUM,
            'h-7 w-full rounded-md border-stone-200/90 dark:border-white/10 bg-white px-2 text-xs font-bold transition-all dark:bg-[#131315]',
            'placeholder:text-[10px] placeholder:text-stone-400 dark:placeholder:text-stone-500 text-center',
            'hover:border-stone-300 dark:hover:border-white/20',
            'focus-visible:ring-1 focus-visible:ring-[#5a63df]',
            'disabled:opacity-60 disabled:bg-stone-100/70 dark:disabled:bg-white/[0.03] disabled:text-stone-400 dark:disabled:text-stone-500 disabled:cursor-not-allowed'
          )}
        />
      </div>
    </div>
  );
};

const TierHeader = ({
  tierName,
  tierIcon: TierIcon,
  config,
  selectedCur,
  availableCurrencies,
  onSelectCurrency,
  onAddOverride,
  hasChanges,
}) => (
  <div className="p-3.5 border-b border-stone-200/80 dark:border-white/[0.07] bg-white dark:bg-[#131315]">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn('p-1.5 rounded-lg shrink-0 transition-colors', config.chipClass)}>
          <TierIcon className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-50 capitalize truncate">
            {tierName} tier
          </h4>
          <p
            className={cn(
              MICRO,
              'text-stone-500 dark:text-stone-400 mt-0.5 normal-case tracking-normal text-[10px] truncate'
            )}
          >
            {config.description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAddOverride}
        className={cn(
          MICRO,
          'inline-flex items-center gap-1 rounded-md border border-stone-200 dark:border-white/10 px-2 py-1 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 hover:border-stone-300 dark:hover:border-white/20 transition-all duration-150 ease-smooth-out active:scale-95 shrink-0'
        )}
      >
        <Plus className="w-3 h-3" />
        Override
      </button>
    </div>

    {/* Currency rail */}
    <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto no-scrollbar">
      <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500 mr-0.5 shrink-0 text-[8px]')}>
        Region:
      </span>
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
              'relative px-2.5 py-1 rounded-md transition-all duration-150 ease-smooth-out active:scale-95 flex items-center gap-1.5 border shrink-0',
              isCurActive
                ? 'text-white dark:text-stone-50 border-transparent shadow-xs'
                : 'bg-stone-50/80 dark:bg-white/[0.03] text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/20'
            )}
          >
            {isCurActive && (
              <m.span
                layoutId={`currencyPill-${tierName}`}
                className="absolute inset-0 bg-stone-900 dark:bg-white/15 rounded-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            {cur === 'ALL' && <Globe className="relative z-10 w-2.5 h-2.5 opacity-80" />}
            <span className="relative z-10 font-bold">{cur === 'ALL' ? 'Global' : cur}</span>
            <span
              className={cn(
                'relative z-10 w-1.5 h-1.5 rounded-full bg-[rgb(var(--signal-warn))] transition-opacity duration-150',
                curChanged ? 'opacity-100 animate-pulse' : 'opacity-0'
              )}
            />
          </button>
        );
      })}
    </div>
  </div>
);

const TierBody = ({
  tierName,
  selectedCur,
  edited,
  activeLimitData,
  changed,
  isSaving,
  onValueChange,
  onReset,
  onSave,
}) => {
  const getVal = (field) =>
    edited[field] ??
    activeLimitData[field] ??
    (field.startsWith('reading_') || field.startsWith('listening_') ? -1 : 0);

  return (
    <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
      <div className="space-y-3">
        {/* AI evaluations */}
        <div className="space-y-1.5">
          <span
            className={cn(
              MICRO,
              'text-stone-600 dark:text-stone-300 flex items-center gap-1.5 font-bold leading-none'
            )}
          >
            <Sparkles className="w-3 h-3 text-stone-400 shrink-0" />
            AI Evaluations
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Writing */}
            <div className="space-y-1">
              <span
                className={cn(
                  MICRO,
                  'text-stone-600 dark:text-stone-300 flex items-center gap-1 font-bold leading-none'
                )}
              >
                <Pen className="w-2.5 h-2.5 text-indigo-500 shrink-0" /> Writing
              </span>
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

            {/* Speaking */}
            <div className="space-y-1">
              <span
                className={cn(
                  MICRO,
                  'text-stone-600 dark:text-stone-300 flex items-center gap-1 font-bold leading-none'
                )}
              >
                <Mic className="w-2.5 h-2.5 text-indigo-500 shrink-0" /> Speaking
              </span>
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

        {/* Reading and Listening individual test starts */}
        <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-white/5">
          <span
            className={cn(
              MICRO,
              'text-stone-600 dark:text-stone-300 flex items-center gap-1.5 font-bold leading-none'
            )}
          >
            <GraduationCap className="w-3 h-3 text-stone-400 shrink-0" />
            Reading &amp; Listening free tests
          </span>
          <p className="text-[10px] leading-snug text-stone-500 dark:text-stone-400">
            Total new Practice or Exam tests a free learner can start per skill, for the life of the
            account. Paired tests and resumed tests do not count.
          </p>

          {tierName === 'free' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Reading */}
              <div className="space-y-1.5 p-2 rounded-lg border border-stone-200/70 dark:border-white/6 bg-stone-50/50 dark:bg-white/[0.02]">
                <div
                  className={cn(
                    MICRO,
                    'flex items-center gap-1.5 text-stone-700 dark:text-stone-200 font-bold leading-none'
                  )}
                >
                  <BookOpen className="h-2.5 w-2.5 text-stone-500 shrink-0" />
                  <span>Reading</span>
                </div>
                <div className="space-y-1">
                  <CompactTestLimitInput
                    label="Free tests"
                    value={getVal('reading_test_limit') ?? -1}
                    onChange={(v) => onValueChange('reading_test_limit', v)}
                  />
                </div>
              </div>

              {/* Listening */}
              <div className="space-y-1.5 p-2 rounded-lg border border-stone-200/70 dark:border-white/6 bg-stone-50/50 dark:bg-white/[0.02]">
                <div
                  className={cn(
                    MICRO,
                    'flex items-center gap-1.5 text-stone-700 dark:text-stone-200 font-bold leading-none'
                  )}
                >
                  <Headphones className="h-2.5 w-2.5 text-stone-500 shrink-0" />
                  <span>Listening</span>
                </div>
                <div className="space-y-1">
                  <CompactTestLimitInput
                    label="Free tests"
                    value={getVal('listening_test_limit') ?? -1}
                    onChange={(v) => onValueChange('listening_test_limit', v)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Reading */}
              <div className="flex flex-col justify-between p-2 rounded-lg border border-stone-200/60 dark:border-white/6 bg-stone-50/40 dark:bg-white/[0.015] min-h-[88px]">
                <div
                  className={cn(
                    MICRO,
                    'flex items-center gap-1.5 text-stone-700 dark:text-stone-200 font-bold leading-none'
                  )}
                >
                  <BookOpen className="h-2.5 w-2.5 text-stone-500 shrink-0" />
                  <span>Reading</span>
                </div>
                <div className="flex items-center gap-1.5 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--signal-ok))] shrink-0" />
                  <span className="font-semibold text-stone-800 dark:text-stone-100">
                    Unlimited test starts
                  </span>
                </div>
              </div>

              {/* Listening */}
              <div className="flex flex-col justify-between p-2 rounded-lg border border-stone-200/60 dark:border-white/6 bg-stone-50/40 dark:bg-white/[0.015] min-h-[88px]">
                <div
                  className={cn(
                    MICRO,
                    'flex items-center gap-1.5 text-stone-700 dark:text-stone-200 font-bold leading-none'
                  )}
                >
                  <Headphones className="h-2.5 w-2.5 text-stone-500 shrink-0" />
                  <span>Listening</span>
                </div>
                <div className="flex items-center gap-1.5 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--signal-ok))] shrink-0" />
                  <span className="font-semibold text-stone-800 dark:text-stone-100">
                    Unlimited test starts
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-stone-100 dark:border-white/6 flex justify-between items-center h-9 mt-2">
        <div className="h-6 flex items-center">
          {changed ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[rgb(var(--signal-warn))]">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--signal-warn))] animate-pulse" />
              Unsaved
            </span>
          ) : activeLimitData.updated_at ? (
            <span
              className={cn(
                MICRO,
                'text-stone-400 dark:text-stone-500 flex items-center gap-1 normal-case tracking-normal text-[10px]'
              )}
            >
              <Check className="w-3 h-3 text-[rgb(var(--signal-ok))]" />
              Saved {new Date(activeLimitData.updated_at).toLocaleDateString()}
            </span>
          ) : (
            <span
              className={cn(
                MICRO,
                'text-stone-400 dark:text-stone-500 normal-case tracking-normal text-[10px]'
              )}
            >
              Not saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 h-7">
          <button
            type="button"
            onClick={onReset}
            disabled={!changed}
            tabIndex={changed ? 0 : -1}
            className={cn(
              MICRO,
              'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-1 text-[9px] transition-opacity duration-150',
              changed ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
            )}
          >
            Discard
          </button>
          <AdminButton onClick={onSave} disabled={!changed} loading={isSaving} size="sm">
            <Save className="w-3 h-3" />
            Save {selectedCur !== 'ALL' ? selectedCur : ''}
          </AdminButton>
        </div>
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
  onReset,
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
    <m.div
      variants={FADE_UP}
      className={cn(
        PANEL,
        'overflow-hidden flex flex-col h-full transition-[border-color,box-shadow] duration-150 hover:shadow-xs',
        changed ? 'border-amber-400/60 dark:border-amber-500/40' : ''
      )}
    >
      <TierHeader
        tierName={tierName}
        tierIcon={TierIcon}
        config={config}
        selectedCur={selectedCur}
        availableCurrencies={availableCurrencies}
        onSelectCurrency={(cur) => onSelectCurrency(tierName, cur)}
        onAddOverride={() => onAddOverride(tierName)}
        hasChanges={(cur) => hasChanges(tierName, cur)}
      />
      <TierBody
        tierName={tierName}
        selectedCur={selectedCur}
        edited={edited}
        activeLimitData={activeLimitData}
        changed={changed}
        isSaving={isSaving}
        onValueChange={(field, val) => onValueChange(tierName, selectedCur, field, val)}
        onReset={() => onReset(tierName, selectedCur)}
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
    const numericValue = value === -1 ? -1 : Math.max(0, parseInt(value, 10) || 0);
    setEditedValues((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: numericValue },
    }));
  };

  const handleReset = (tier, currency) => {
    const key = limitKey(tier, currency);
    const original = tierLimits.find((t) => t.tier === tier && t.currency === currency);
    if (!original) return;
    const quotaValues = {};
    QUOTA_FIELDS.forEach((f) => {
      quotaValues[f] = original[f];
    });
    setEditedValues((prev) => ({ ...prev, [key]: quotaValues }));
    toast.info(`Reset changes for ${tier} (${currency})`);
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
        queryClient.invalidateQueries({ queryKey: ['objective-test-quotas'] }),
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

  const overrideCurrencies = useMemo(() => {
    const currencies = new Set();
    tierLimits.forEach((t) => {
      if (t.currency && t.currency !== 'ALL') {
        currencies.add(t.currency);
      }
    });
    return Array.from(currencies).sort();
  }, [tierLimits]);

  return (
    <m.div variants={STAGGER_CONTAINER} initial="hidden" animate="visible" className="space-y-3.5">
      {/* Top Header Strip */}
      <m.div
        variants={FADE_UP}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
      >
        <div>
          <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            Usage Limits
          </h3>
          <p
            className={cn(
              MICRO,
              'text-stone-500 dark:text-stone-400 mt-0.5 normal-case tracking-normal text-[11px]'
            )}
          >
            Global defaults and currency-specific quota overrides
          </p>
        </div>
        <button
          onClick={fetchTierLimits}
          disabled={loading}
          className={cn(
            MICRO,
            'w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 dark:border-white/10 px-3 py-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-all duration-150 ease-smooth-out active:scale-95'
          )}
        >
          <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
          Refresh
        </button>
      </m.div>

      {/* Summary KPI Strip */}
      <m.div variants={FADE_UP} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className={cn(PANEL, 'p-2.5 flex items-center gap-2.5')}>
          <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className={cn(MICRO, 'text-stone-400 block text-[8px]')}>Configured Tiers</span>
            <span className={cn(NUM, 'text-xs font-bold text-stone-900 dark:text-stone-50')}>
              4 Active Tiers
            </span>
          </div>
        </div>

        <div className={cn(PANEL, 'p-2.5 flex items-center gap-2.5')}>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className={cn(MICRO, 'text-stone-400 block text-[8px]')}>Regional Overrides</span>
            <span
              className={cn(
                NUM,
                'text-xs font-bold text-stone-900 dark:text-stone-50 truncate block'
              )}
            >
              {overrideCurrencies.length > 0
                ? `${overrideCurrencies.length} Active (${overrideCurrencies.join(', ')})`
                : 'Global Defaults Only'}
            </span>
          </div>
        </div>

        <div className={cn(PANEL, 'p-2.5 flex items-center gap-2.5')}>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn(MICRO, 'text-stone-400 block text-[8px]')}>Policy Engine</span>
              <LiveDot tone="ok" />
            </div>
            <span className="text-xs font-bold text-stone-900 dark:text-stone-50 truncate block">
              Edge & In-Memory Cache
            </span>
          </div>
        </div>
      </m.div>

      {/* Main Tiers Grid - equal height cards across rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(PANEL, 'h-80 animate-pulse')} />
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
                onReset={handleReset}
                onSave={handleSave}
                hasChanges={hasChanges}
              />
            ))}
      </div>

      {/* Rate limit enforcement explanation panel */}
      <m.div variants={FADE_UP} className={cn(PANEL, 'p-3.5 overflow-hidden')}>
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 shrink-0 mt-0.5">
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-extrabold text-stone-900 dark:text-stone-50">
              Rate limit enforcement
            </p>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed text-[11px]">
              <strong>Global</strong> applies to everyone unless matched by a regional currency
              override. <strong>Currency overrides</strong> apply based on subscription currency
              (e.g. BDT, INR). 1 Writing evaluation = any 2 Task 1 or Task 2 reviews. Changes purge
              in-memory caches and propagate to edge middleware instantly.
            </p>
          </div>
        </div>
      </m.div>
    </m.div>
  );
};

export default TierRateLimitsSettings;
