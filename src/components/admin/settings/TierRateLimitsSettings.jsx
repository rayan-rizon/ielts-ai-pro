import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

const TierRateLimitsSettings = () => {
  const [tierLimits, setTierLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [editedValues, setEditedValues] = useState({});

  const limitKey = (tier, currency) => `${tier}_${currency || 'ALL'}`;

  const fetchTierLimits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TierRateLimit.list();
      setTierLimits(data || []);

      const initial = {};
      data?.forEach((tier) => {
        const key = limitKey(tier.tier, tier.currency);
        initial[key] = {
          daily_limit: tier.daily_limit,
          monthly_limit: tier.monthly_limit,
          burst_limit: tier.burst_limit,
          writing_daily_limit: tier.writing_daily_limit,
          writing_monthly_limit: tier.writing_monthly_limit,
          speaking_daily_limit: tier.speaking_daily_limit,
          speaking_monthly_limit: tier.speaking_monthly_limit,
        };
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
        ...prev[key],
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

    if (tierLimits.find((t) => t.tier === tierName && t.currency === currUpper)) {
      toast.error(`Override for ${currUpper} already exists in ${tierName}`);
      return;
    }

    const baseLimit = tierLimits.find((t) => t.tier === tierName && t.currency === 'ALL') || {
      daily_limit: 5,
      monthly_limit: 5,
      burst_limit: 10,
      writing_daily_limit: 5,
      writing_monthly_limit: 5,
      speaking_daily_limit: 5,
      speaking_monthly_limit: 5,
    };

    const newLimit = {
      ...baseLimit,
      id: `temp_${Date.now()}`,
      tier: tierName,
      currency: currUpper,
      isNew: true,
    };

    setTierLimits((prev) => [...prev, newLimit]);
    const key = limitKey(tierName, currUpper);
    setEditedValues((prev) => ({
      ...prev,
      [key]: {
        daily_limit: newLimit.daily_limit,
        monthly_limit: newLimit.monthly_limit,
        burst_limit: newLimit.burst_limit,
        writing_daily_limit: newLimit.writing_daily_limit,
        writing_monthly_limit: newLimit.writing_monthly_limit,
        speaking_daily_limit: newLimit.speaking_daily_limit,
        speaking_monthly_limit: newLimit.speaking_monthly_limit,
      },
    }));
  };

  const hasChanges = (tier, currency) => {
    const key = limitKey(tier, currency);
    const original = tierLimits.find((t) => t.tier === tier && t.currency === currency);
    const edited = editedValues[key];
    if (!original || !edited) return false;

    // If it's a new override manually added via prompt, it naturally has changes (needs saving)
    if (original.isNew) return true;

    return (
      original.daily_limit !== edited.daily_limit ||
      original.monthly_limit !== edited.monthly_limit ||
      original.burst_limit !== edited.burst_limit ||
      original.writing_daily_limit !== edited.writing_daily_limit ||
      original.writing_monthly_limit !== edited.writing_monthly_limit ||
      original.speaking_daily_limit !== edited.speaking_daily_limit ||
      original.speaking_monthly_limit !== edited.speaking_monthly_limit
    );
  };

  const tierConfig = {
    free: { icon: User, color: 'slate', gradient: 'from-slate-500 to-gray-500' },
    pro: { icon: Crown, color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
    premium: { icon: Sparkles, color: 'purple', gradient: 'from-purple-500 to-pink-500' },
    admin: { icon: Shield, color: 'amber', gradient: 'from-amber-500 to-orange-500' },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const tiersList = ['free', 'pro', 'premium', 'admin'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            AI Rate Limits Config
          </h3>
          <p className="text-sm text-muted-foreground">Configure global and regional API limits.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTierLimits} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </motion.div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading
          ? [...Array(4)].map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="border border-border/50">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          : tiersList.map((tierName) => {
              const config = tierConfig[tierName] || tierConfig.free;
              const TierIcon = config.icon;

              const currentTierLimits = tierLimits.filter((t) => t.tier === tierName);
              // Ensure we have an ALL fallback to render if empty for some reason
              if (!currentTierLimits.find((t) => t.currency === 'ALL')) {
                currentTierLimits.unshift({ tier: tierName, currency: 'ALL' });
              }

              // Sort ALL first, then alphabetically
              currentTierLimits.sort((a, b) => {
                if (a.currency === 'ALL') return -1;
                if (b.currency === 'ALL') return 1;
                return (a.currency || '').localeCompare(b.currency || '');
              });

              return (
                <motion.div key={tierName} variants={itemVariants}>
                  <Card className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
                    <CardHeader className={`bg-gradient-to-r ${config.gradient} text-white p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <TierIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold capitalize">
                              {tierName}
                            </CardTitle>
                            <CardDescription className="text-white/70 text-xs">
                              Subscription Tier
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddOverride(tierName)}
                          size="sm"
                          variant="secondary"
                          className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1.5 h-8 px-3"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Override
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 bg-background/50 divide-y divide-border/40">
                      <AnimatePresence>
                        {currentTierLimits.map((tierLimitData) => {
                          const cur = tierLimitData.currency || 'ALL';
                          const isGlobal = cur === 'ALL';
                          const key = limitKey(tierName, cur);
                          const edited = editedValues[key] || {};
                          const changed = hasChanges(tierName, cur);

                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className={`p-5 space-y-5 ${changed ? 'bg-primary/5' : ''} transition-colors duration-300`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isGlobal ? (
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5"
                                    >
                                      {cur}
                                    </Badge>
                                  )}
                                  <h4 className="font-semibold text-sm">
                                    {isGlobal
                                      ? 'Global Default Limits'
                                      : `Regional Override Limits`}
                                  </h4>
                                </div>
                                {changed && (
                                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0 text-[10px] uppercase">
                                    Unsaved Changes
                                  </Badge>
                                )}
                              </div>

                              {/* General Limits */}
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">
                                      General Daily
                                    </Label>
                                    <Input
                                      type="number"
                                      value={edited.daily_limit ?? tierLimitData.daily_limit ?? 0}
                                      onChange={(e) =>
                                        handleValueChange(
                                          tierName,
                                          cur,
                                          'daily_limit',
                                          e.target.value
                                        )
                                      }
                                      className="h-8 font-mono text-sm shadow-sm"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">
                                      General Monthly
                                    </Label>
                                    <Input
                                      type="number"
                                      value={
                                        edited.monthly_limit ?? tierLimitData.monthly_limit ?? 0
                                      }
                                      onChange={(e) =>
                                        handleValueChange(
                                          tierName,
                                          cur,
                                          'monthly_limit',
                                          e.target.value
                                        )
                                      }
                                      className="h-8 font-mono text-sm shadow-sm"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">
                                      Burst/Min
                                    </Label>
                                    <Input
                                      type="number"
                                      value={edited.burst_limit ?? tierLimitData.burst_limit ?? 0}
                                      onChange={(e) =>
                                        handleValueChange(
                                          tierName,
                                          cur,
                                          'burst_limit',
                                          e.target.value
                                        )
                                      }
                                      className="h-8 font-mono text-sm shadow-sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Writing Limits */}
                                <div className="space-y-2 p-3 rounded-lg border border-indigo-100 dark:border-indigo-950 bg-indigo-50/30 dark:bg-indigo-950/20">
                                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                    <Pen className="w-3 h-3" />
                                    Writing Limits
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-[10px] text-muted-foreground">
                                        Daily
                                      </Label>
                                      <Input
                                        type="number"
                                        value={
                                          edited.writing_daily_limit ??
                                          tierLimitData.writing_daily_limit ??
                                          0
                                        }
                                        onChange={(e) =>
                                          handleValueChange(
                                            tierName,
                                            cur,
                                            'writing_daily_limit',
                                            e.target.value
                                          )
                                        }
                                        className="h-7 text-xs font-mono border-indigo-200 dark:border-indigo-900 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px] text-muted-foreground">
                                        Monthly
                                      </Label>
                                      <Input
                                        type="number"
                                        value={
                                          edited.writing_monthly_limit ??
                                          tierLimitData.writing_monthly_limit ??
                                          0
                                        }
                                        onChange={(e) =>
                                          handleValueChange(
                                            tierName,
                                            cur,
                                            'writing_monthly_limit',
                                            e.target.value
                                          )
                                        }
                                        className="h-7 text-xs font-mono border-indigo-200 dark:border-indigo-900 focus:ring-indigo-500"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Speaking Limits */}
                                <div className="space-y-2 p-3 rounded-lg border border-violet-100 dark:border-violet-950 bg-violet-50/30 dark:bg-violet-950/20">
                                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                    <Mic className="w-3 h-3" />
                                    Speaking Limits
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-[10px] text-muted-foreground">
                                        Daily
                                      </Label>
                                      <Input
                                        type="number"
                                        value={
                                          edited.speaking_daily_limit ??
                                          tierLimitData.speaking_daily_limit ??
                                          0
                                        }
                                        onChange={(e) =>
                                          handleValueChange(
                                            tierName,
                                            cur,
                                            'speaking_daily_limit',
                                            e.target.value
                                          )
                                        }
                                        className="h-7 text-xs font-mono border-violet-200 dark:border-violet-900 focus:ring-violet-500"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px] text-muted-foreground">
                                        Monthly
                                      </Label>
                                      <Input
                                        type="number"
                                        value={
                                          edited.speaking_monthly_limit ??
                                          tierLimitData.speaking_monthly_limit ??
                                          0
                                        }
                                        onChange={(e) =>
                                          handleValueChange(
                                            tierName,
                                            cur,
                                            'speaking_monthly_limit',
                                            e.target.value
                                          )
                                        }
                                        className="h-7 text-xs font-mono border-violet-200 dark:border-violet-900 focus:ring-violet-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 flex justify-between items-center">
                                <span className="text-[11px] text-muted-foreground">
                                  {tierLimitData.updated_at
                                    ? `Last saved: ${new Date(tierLimitData.updated_at).toLocaleDateString()}`
                                    : 'Not saved yet'}
                                </span>
                                <Button
                                  onClick={() => handleSave(tierName, cur)}
                                  disabled={!changed || saving[key]}
                                  size="sm"
                                  className="gap-1.5 h-8 shadow-sm"
                                >
                                  {saving[key] ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Save className="w-3.5 h-3.5" />
                                  )}
                                  Save {cur !== 'ALL' ? cur : ''}
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      {/* Info Box */}
      <motion.div variants={itemVariants}>
        <Card className="border border-amber-500/30 bg-amber-500/5 rounded-xl shadow-sm overflow-hidden text-sm">
          <CardContent className="p-5 flex items-start gap-3">
            <Gauge className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-amber-800 dark:text-amber-400">
                Rate Limit Enforcement & Regional Overrides
              </p>
              <div className="text-muted-foreground text-sm space-y-1.5">
                <p>
                  <strong>Global Default:</strong> Applied to all users unless they match a specific
                  regional override (e.g. BDT currency).
                </p>
                <p>
                  <strong>Currency Overrides:</strong> Overrides limits based on the user's
                  localized subscription currency allowing adjustment for lower regional price
                  points.
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
