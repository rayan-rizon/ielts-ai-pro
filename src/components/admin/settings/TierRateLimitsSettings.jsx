import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Zap,
  Calendar,
  Clock,
} from 'lucide-react';
import { TierRateLimit } from '@/entities';
import { toast } from 'sonner';

const TierRateLimitsSettings = () => {
  const [tierLimits, setTierLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [editedValues, setEditedValues] = useState({});

  const fetchTierLimits = async () => {
    try {
      setLoading(true);
      const data = await TierRateLimit.list();
      setTierLimits(data || []);
      // Initialize edited values
      const initial = {};
      data?.forEach((tier) => {
        initial[tier.tier] = {
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
  };

  useEffect(() => {
    fetchTierLimits();
  }, []);

  const handleValueChange = (tier, field, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: parseInt(value) || 0,
      },
    }));
  };

  const handleSave = async (tier) => {
    try {
      setSaving((prev) => ({ ...prev, [tier]: true }));
      await TierRateLimit.update(tier, editedValues[tier]);
      toast.success(`${tier.charAt(0).toUpperCase() + tier.slice(1)} tier limits updated`);
      fetchTierLimits();
    } catch (error) {
      console.error('Error saving tier limits:', error);
      toast.error('Failed to update limits');
    } finally {
      setSaving((prev) => ({ ...prev, [tier]: false }));
    }
  };

  const hasChanges = (tier) => {
    const original = tierLimits.find((t) => t.tier === tier);
    const edited = editedValues[tier];
    if (!original || !edited) return false;
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            AI Rate Limits by Tier
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure API limits and feature quotas. Changes here reflect on the pricing page.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTierLimits} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </motion.div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading
          ? [...Array(4)].map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="border border-border/50">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          : tierLimits.map((tier) => {
              const config = tierConfig[tier.tier] || tierConfig.free;
              const TierIcon = config.icon;
              const edited = editedValues[tier.tier] || {};
              const changed = hasChanges(tier.tier);

              return (
                <motion.div key={tier.tier} variants={itemVariants}>
                  <Card
                    className={`border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 ${changed ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    <CardHeader className={`bg-gradient-to-r ${config.gradient} text-white p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <TierIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold capitalize">
                              {tier.tier}
                            </CardTitle>
                            <CardDescription className="text-white/70 text-xs">
                              Subscription Tier
                            </CardDescription>
                          </div>
                        </div>
                        {changed && (
                          <Badge className="bg-white/20 text-white border-0">Modified</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-5">
                      {/* API Limits - General */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <Zap className="w-3.5 h-3.5" />
                          General API Limits
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Daily
                            </Label>
                            <Input
                              type="number"
                              value={edited.daily_limit ?? tier.daily_limit}
                              onChange={(e) =>
                                handleValueChange(tier.tier, 'daily_limit', e.target.value)
                              }
                              className="h-9 font-mono font-bold text-center text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Monthly
                            </Label>
                            <Input
                              type="number"
                              value={edited.monthly_limit ?? tier.monthly_limit}
                              onChange={(e) =>
                                handleValueChange(tier.tier, 'monthly_limit', e.target.value)
                              }
                              className="h-9 font-mono font-bold text-center text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Burst/Min
                            </Label>
                            <Input
                              type="number"
                              value={edited.burst_limit ?? tier.burst_limit}
                              onChange={(e) =>
                                handleValueChange(tier.tier, 'burst_limit', e.target.value)
                              }
                              className="h-9 font-mono font-bold text-center text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Writing Limits */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          <Pen className="w-3.5 h-3.5" />
                          AI Writing Evaluations
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Daily Limit
                            </Label>
                            <Input
                              type="number"
                              value={edited.writing_daily_limit ?? tier.writing_daily_limit}
                              onChange={(e) =>
                                handleValueChange(tier.tier, 'writing_daily_limit', e.target.value)
                              }
                              className="h-9 font-mono font-bold text-center text-sm border-indigo-200 dark:border-indigo-900 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Monthly Limit
                              <span className="text-[10px] text-indigo-500">(Pricing)</span>
                            </Label>
                            <Input
                              type="number"
                              value={edited.writing_monthly_limit ?? tier.writing_monthly_limit}
                              onChange={(e) =>
                                handleValueChange(
                                  tier.tier,
                                  'writing_monthly_limit',
                                  e.target.value
                                )
                              }
                              className="h-9 font-mono font-bold text-center text-sm border-indigo-200 dark:border-indigo-900 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Speaking Limits */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                          <Mic className="w-3.5 h-3.5" />
                          AI Speaking Sessions
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Daily Limit
                            </Label>
                            <Input
                              type="number"
                              value={edited.speaking_daily_limit ?? tier.speaking_daily_limit}
                              onChange={(e) =>
                                handleValueChange(tier.tier, 'speaking_daily_limit', e.target.value)
                              }
                              className="h-9 font-mono font-bold text-center text-sm border-violet-200 dark:border-violet-900 focus:ring-violet-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Monthly Limit
                              <span className="text-[10px] text-violet-500">(Pricing)</span>
                            </Label>
                            <Input
                              type="number"
                              value={edited.speaking_monthly_limit ?? tier.speaking_monthly_limit}
                              onChange={(e) =>
                                handleValueChange(
                                  tier.tier,
                                  'speaking_monthly_limit',
                                  e.target.value
                                )
                              }
                              className="h-9 font-mono font-bold text-center text-sm border-violet-200 dark:border-violet-900 focus:ring-violet-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          Updated:{' '}
                          {tier.updated_at
                            ? new Date(tier.updated_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                        <Button
                          onClick={() => handleSave(tier.tier)}
                          disabled={!changed || saving[tier.tier]}
                          size="sm"
                          className="gap-2"
                        >
                          {saving[tier.tier] ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      {/* Info Box */}
      <motion.div variants={itemVariants}>
        <Card className="border border-amber-500/30 bg-amber-500/5 rounded-lg">
          <CardContent className="p-4 flex items-start gap-3">
            <Gauge className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Rate Limit Enforcement & Pricing Sync
              </p>
              <div className="text-muted-foreground space-y-1">
                <p>
                  <strong>General API Limits:</strong> Daily/Monthly limits control overall API
                  usage. Burst limits are in-memory.
                </p>
                <p>
                  <strong>Writing & Speaking Limits:</strong> Monthly limits marked with{' '}
                  <span className="text-indigo-500 font-bold">(Pricing)</span> are displayed on the
                  pricing page and synced automatically.
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
