import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { countries } from '@/lib/countries';
import { validateField, passwordChangeSchema } from '@/lib/validations';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { SystemHealth } from '@/features/admin/services/SystemHealth';
import SystemHealthDashboard from './SystemHealthDashboard';
import TierRateLimitsSettings from './TierRateLimitsSettings';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  Save,
  Settings,
  CreditCard,
  Bell,
  Globe,
  ShieldCheck,
  DollarSign,
  Activity,
  Zap,
  Lock,
  Gauge,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  AlertCircle,
  Clock,
} from 'lucide-react';

const CountryAutocomplete = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const country = countries.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen} data-oid=".tqj68o">
      <PopoverTrigger asChild data-oid="_.4g4c0">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-8 w-[160px] justify-between text-[11px] font-medium bg-background border-border/50 hover:bg-muted/50 transition-colors rounded-lg"
          data-oid="jl6r3s0"
        >
          {country ? (
            <span className="flex items-center gap-2 truncate" data-oid="z6hl:vy">
              <span className="opacity-60" data-oid="qi_z-th">
                {country.code}
              </span>
              <span className="truncate" data-oid="1..ouh3">
                {country.name}
              </span>
            </span>
          ) : (
            'Select country...'
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" data-oid="mw6r0e1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0 shadow-2xl border-border/50"
        align="start"
        data-oid="jnqf37g"
      >
        <Command className="bg-popover" data-oid="rxgpa9y">
          <CommandInput
            placeholder="Search country..."
            className="h-8 text-xs border-none focus:ring-0"
            data-oid="-zhsl2g"
          />

          <CommandList
            className="max-h-[240px] scrollbar-thin scrollbar-thumb-muted"
            data-oid="6_fzenb"
          >
            <CommandEmpty className="py-4 text-xs text-muted-foreground" data-oid="gwxsnco">
              No country found.
            </CommandEmpty>
            <CommandGroup data-oid="wth0o5t">
              {countries.map((c) => (
                <CommandItem
                  key={c.code}
                  value={c.name}
                  onSelect={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className="text-xs py-2 cursor-pointer hover:bg-primary/5 data-[selected=true]:bg-primary/10 transition-colors"
                  data-oid="e-g8nm4"
                >
                  <Check
                    className={cn(
                      'mr-2 h-3 w-3 text-primary transition-opacity',
                      value === c.code ? 'opacity-100' : 'opacity-0'
                    )}
                    data-oid="fihclvp"
                  />

                  <span className="flex-1 shrink-0" data-oid="2fa5u4n">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-50" data-oid="b7sh75b">
                    {c.code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const GlobalSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    maintenance_mode: false,
    public_announcement: { enabled: false, message: '', type: 'info' },
    pricing_tiers: {
      pro: { price: 9.99, originalPrice: 15, currency: 'USD' },
      premium: { price: 15.99, originalPrice: 25, currency: 'USD' },
    },
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await SystemSetting.getAll();

      setSettings((prev) => ({
        ...prev,
        ...data,
        public_announcement: { ...prev.public_announcement, ...data.public_announcement },
        pricing_tiers: { ...prev.pricing_tiers, ...data.pricing_tiers },
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    try {
      setSaving(true);

      // Validation for pricing tiers
      if (key === 'pricing_tiers') {
        for (const tier in value) {
          const globalPrice = value[tier].price;
          const regional = value[tier].regional || [];

          for (const region of regional) {
            if (region.price === globalPrice && region.currency === value[tier].currency) {
              toast.error(
                `Regional price for ${region.country} in ${tier} tier is the same as global price. Please set a different price or remove the override.`
              );
              setSaving(false);
              return;
            }
            if (!region.country || region.price <= 0) {
              toast.error(`Invalid regional pricing configuration for ${tier} tier.`);
              setSaving(false);
              return;
            }
          }
        }
      }

      await SystemSetting.set(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Use the shared schema to validate the entire form data or individual fields
    // Here we validate the logic that matches what we want (min 8 chars, complexity) via the schema
    const newPasswordValidation = validateField(
      passwordChangeSchema.shape.newPassword,
      passwordData.newPassword
    );
    if (!newPasswordValidation.valid) {
      toast.error(newPasswordValidation.error);
      return;
    }

    try {
      setChangingPassword(true);

      // 1. Verify current password by re-authenticating
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        throw new Error('Incorrect current password');
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRegionalUpdate = (tier, action, index, field, value) => {
    setSettings((prev) => {
      const currentTier = prev.pricing_tiers[tier];
      const regional = [...(currentTier.regional || [])];

      if (action === 'add') {
        regional.push({ country: '', price: 0, currency: '', symbol: '' });
      } else if (action === 'remove') {
        regional.splice(index, 1);
      } else if (action === 'update') {
        if (typeof field === 'object' && field !== null) {
          regional[index] = { ...regional[index], ...field };
        } else {
          regional[index] = { ...regional[index], [field]: value };
        }
      }

      return {
        ...prev,
        pricing_tiers: {
          ...prev.pricing_tiers,
          [tier]: {
            ...currentTier,
            regional,
          },
        },
      };
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div
        className="min-h-[400px] flex flex-col items-center justify-center space-y-4"
        data-oid="3jh:w6o"
      >
        <Loader2 className="h-10 w-10 text-primary animate-spin" data-oid="xpfvuac" />
        <p className="text-sm font-medium text-muted-foreground" data-oid="wd51hwp">
          Loading environment settings...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-10"
      data-oid="_8_3dg3"
    >
      {/* Header Section */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        data-oid="kdpj5_b"
      >
        <motion.div variants={itemVariants} data-oid="kha4q:o">
          <h2
            className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3"
            data-oid="rpads70"
          >
            <div
              className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20"
              data-oid="7q-v0g0"
            >
              <Settings className="w-6 h-6" data-oid="9.znbfp" />
            </div>
            Global Settings
          </h2>
          <p className="text-muted-foreground mt-1 text-lg" data-oid="ln-p8lk">
            Manage system configurations and environment parameters
          </p>
        </motion.div>

        {saving && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border border-border/50 transition-all"
            data-oid="7n88hnp"
          >
            <Activity className="w-3.5 h-3.5 text-primary animate-pulse" data-oid="yytghqi" />
            <span className="text-xs font-bold text-primary" data-oid="57qqa9r">
              Saving changes...
            </span>
          </div>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full" data-oid="bufrpat">
        {/* Enhanced Tab Navigation */}
        <TabsList
          className="relative h-auto bg-gradient-to-r from-slate-50/80 to-blue-50/80 dark:from-slate-900/50 dark:to-blue-900/20 p-1 rounded-2xl border border-blue-200/60 dark:border-blue-800/50 shadow-lg backdrop-blur-sm w-full mb-8"
          data-oid="ybobvet"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-50"
            data-oid="81ocwci"
          ></div>
          <div className="flex flex-wrap justify-center gap-2 w-full" data-oid="pkyqdj.">
            <TabsTrigger
              value="general"
              className="relative rounded-xl px-6 py-3 font-semibold text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 dark:data-[state=active]:shadow-blue-400/20 transition-all duration-300 flex items-center gap-2.5 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-background/50 dark:hover:bg-slate-800/50 group"
              data-oid="_05swy6"
            >
              <Globe
                className="w-4 h-4 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors"
                data-oid="_gxy6zv"
              />

              <span className="relative z-10" data-oid="nbmelfe">
                General
              </span>
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"
                data-oid="_ojd-m0"
              ></div>
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="relative rounded-xl px-6 py-3 font-semibold text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 dark:data-[state=active]:shadow-blue-400/20 transition-all duration-300 flex items-center gap-2.5 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-background/50 dark:hover:bg-slate-800/50 group"
              data-oid="d72m1pl"
            >
              <Bell
                className="w-4 h-4 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors"
                data-oid="p_w9_:x"
              />

              <span className="relative z-10" data-oid="ma_xe0v">
                Announcements
              </span>
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"
                data-oid=".7zepok"
              ></div>
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="relative rounded-xl px-6 py-3 font-semibold text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 dark:data-[state=active]:shadow-blue-400/20 transition-all duration-300 flex items-center gap-2.5 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-background/50 dark:hover:bg-slate-800/50 group"
              data-oid="gxn8r6_"
            >
              <CreditCard
                className="w-4 h-4 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors"
                data-oid="z7nhl0c"
              />

              <span className="relative z-10" data-oid="4rs2x65">
                Pricing
              </span>
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"
                data-oid="az3g53a"
              ></div>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="relative rounded-xl px-6 py-3 font-semibold text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 dark:data-[state=active]:shadow-blue-400/20 transition-all duration-300 flex items-center gap-2.5 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-background/50 dark:hover:bg-slate-800/50 group"
              data-oid="v6mfxzt"
            >
              <Lock
                className="w-4 h-4 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors"
                data-oid="6zgvg9s"
              />

              <span className="relative z-10" data-oid="ccxt:0z">
                Security
              </span>
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"
                data-oid="281p7e_"
              ></div>
            </TabsTrigger>
            <TabsTrigger
              value="rate-limits"
              className="relative rounded-xl px-6 py-3 font-semibold text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 dark:data-[state=active]:shadow-blue-400/20 transition-all duration-300 flex items-center gap-2.5 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-background/50 dark:hover:bg-slate-800/50 group"
              data-oid="ctidv-l"
            >
              <Gauge
                className="w-4 h-4 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors"
                data-oid="yx1s72x"
              />

              <span className="relative z-10" data-oid="1fpbjni">
                Rate Limits
              </span>
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"
                data-oid="3:4jms:"
              ></div>
            </TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="general" className="space-y-6" data-oid="ziz8z.b">
          <motion.div variants={itemVariants} className="max-w-4xl" data-oid="21cboft">
            <SystemHealthDashboard
              maintenanceMode={settings.maintenance_mode}
              onToggleMaintenance={(enabled) => handleSave('maintenance_mode', enabled)}
              isUpdating={saving}
              data-oid="noan2.s"
            />
          </motion.div>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements" className="space-y-6" data-oid="h6s19d0">
          <motion.div variants={itemVariants} className="max-w-3xl" data-oid="uac6lhm">
            <Card
              className="border border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm"
              data-oid="inzo-eu"
            >
              <CardHeader className="border-b border-border/40 bg-muted/20" data-oid="vqhmug2">
                <div className="flex items-center gap-2" data-oid="ms21nis">
                  <Bell className="h-5 w-5 text-primary" data-oid="x-ix.j:" />
                  <CardTitle data-oid="h.:69mu">Public Announcements</CardTitle>
                </div>
                <CardDescription data-oid="0egbc:5">
                  Display a persistent message banner to all users
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6" data-oid="bx4fxoj">
                <div className="flex items-center justify-between" data-oid="mr-n0yy">
                  <div className="space-y-0.5" data-oid="gx--735">
                    <Label className="text-base font-bold" data-oid="nv.hqnz">
                      Banner Status
                    </Label>
                    <p className="text-sm text-muted-foreground" data-oid="_6xzwa4">
                      {settings.public_announcement?.enabled
                        ? 'Active and visible to all users'
                        : 'Currently hidden'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.public_announcement?.enabled}
                    onCheckedChange={(checked) =>
                      handleSave('public_announcement', {
                        ...settings.public_announcement,
                        enabled: checked,
                      })
                    }
                    disabled={saving}
                    data-oid="cux9ifg"
                  />
                </div>

                <AnimatePresence mode="wait" data-oid="-v0_clc">
                  {settings.public_announcement?.enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 overflow-hidden pt-4"
                      data-oid="i8h1euj"
                    >
                      <div className="space-y-2" data-oid="v9y8784">
                        <Label className="text-sm font-bold" data-oid="f_53kuq">
                          Announcement Message
                        </Label>
                        <Textarea
                          value={settings.public_announcement?.message}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              public_announcement: {
                                ...prev.public_announcement,
                                message: e.target.value,
                              },
                            }))
                          }
                          placeholder="Enter your message here..."
                          className="bg-muted/10 border-border/40 focus-visible:ring-primary/20 rounded-xl font-medium min-h-[120px] resize-none"
                          data-oid="g93m0iv"
                        />
                      </div>

                      <div className="space-y-2" data-oid="2j7mzsl">
                        <Label className="text-sm font-bold" data-oid="6inuigl">
                          Severity Level
                        </Label>
                        <div className="grid grid-cols-3 gap-3" data-oid="9bi6tw5">
                          {[
                            {
                              id: 'info',
                              label: 'Info',
                              color: 'bg-blue-500',
                              border: 'border-blue-500',
                            },
                            {
                              id: 'warning',
                              label: 'Warning',
                              color: 'bg-amber-500',
                              border: 'border-amber-500',
                            },
                            {
                              id: 'error',
                              label: 'Critical',
                              color: 'bg-rose-500',
                              border: 'border-rose-500',
                            },
                          ].map((type) => (
                            <button
                              key={type.id}
                              onClick={() =>
                                setSettings((prev) => ({
                                  ...prev,
                                  public_announcement: {
                                    ...prev.public_announcement,
                                    type: type.id,
                                  },
                                }))
                              }
                              className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 transition-all font-bold text-xs ${
                                settings.public_announcement?.type === type.id
                                  ? `${type.border} bg-muted text-foreground`
                                  : 'border-border/30 text-muted-foreground hover:border-border/60 hover:bg-muted/5'
                              }`}
                              data-oid="u-izzt9"
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${type.color}`}
                                data-oid="ox8-hqa"
                              />

                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2" data-oid="54kxmbi">
                        <Button
                          onClick={() =>
                            handleSave('public_announcement', settings.public_announcement)
                          }
                          disabled={saving}
                          className="w-full h-12 font-bold rounded-xl shadow-sm"
                          data-oid="z-0hyv6"
                        >
                          {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="owsndy1" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" data-oid=":8v-smi" />
                          )}
                          Update Announcement
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing" className="space-y-6" data-oid="irb46s8">
          <motion.div variants={itemVariants} className="max-w-5xl" data-oid="duxl5bf">
            <div
              className="rounded-xl border text-card-foreground bg-card/50 backdrop-blur-sm border-border/50 shadow-sm overflow-hidden"
              data-oid="_v9cdza"
            >
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
                    <h3
                      className="text-xl font-bold tracking-tight text-foreground"
                      data-oid="q_mbpg0"
                    >
                      Pricing Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground" data-oid=".ky0t.m">
                      Manage global subscription costs and economic tiers
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-8" data-oid="bws3833">
                <div className="grid md:grid-cols-2 gap-8" data-oid="piynevn">
                  {/* Pro Plan */}
                  <motion.div variants={itemVariants} className="group relative" data-oid=".zn-4cw">
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      data-oid="0y7b3tg"
                    ></div>
                    <div
                      className="relative p-8 rounded-2xl border border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/30 to-background dark:from-blue-900/10 dark:to-slate-900/50 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all duration-300"
                      data-oid="my7yzx-"
                    >
                      <div className="flex items-center justify-between" data-oid="r3k0k3l">
                        <div className="flex items-center gap-3" data-oid="fc:m5y.">
                          <div
                            className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/25"
                            data-oid="jkak7gt"
                          >
                            <Zap className="w-6 h-6" data-oid=".0_6_7c" />
                          </div>
                          <div data-oid="r2twdt:">
                            <h4 className="font-bold text-xl text-foreground" data-oid="e4rdac8">
                              Pro Plan
                            </h4>
                            <p className="text-sm text-muted-foreground" data-oid="n_kw0le">
                              Professional features
                            </p>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50"
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
                              className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider opacity-80"
                              data-oid="v066p1w"
                            >
                              Current Price (USD)
                            </Label>
                            <div className="relative group/input" data-oid="dfhx2:w">
                              <span
                                className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-blue-600 dark:text-blue-400 z-10"
                                data-oid="lgdpi-2"
                              >
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={settings.pricing_tiers?.pro?.price || ''}
                                onChange={(e) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    pricing_tiers: {
                                      ...prev.pricing_tiers,
                                      pro: {
                                        ...prev.pricing_tiers.pro,
                                        price: parseFloat(e.target.value),
                                      },
                                    },
                                  }))
                                }
                                className="h-12 pl-10 bg-background border-blue-200/60 dark:border-blue-800/40 font-bold text-xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500 rounded-xl shadow-sm"
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
                                value={settings.pricing_tiers?.pro?.originalPrice || ''}
                                onChange={(e) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    pricing_tiers: {
                                      ...prev.pricing_tiers,
                                      pro: {
                                        ...prev.pricing_tiers.pro,
                                        originalPrice: parseFloat(e.target.value),
                                      },
                                    },
                                  }))
                                }
                                className="h-12 pl-10 bg-muted/30 border-slate-200/60 dark:border-slate-800/40 font-bold text-xl text-slate-500 focus-visible:ring-slate-500/20 rounded-xl"
                                placeholder="15"
                                data-oid="-d_vp:r"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Auto-calculated discount preview */}
                        {settings.pricing_tiers?.pro?.price &&
                          settings.pricing_tiers?.pro?.originalPrice && (
                            <div
                              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30"
                              data-oid="f1tv8_i"
                            >
                              <div
                                className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center"
                                data-oid="s4rzjmg"
                              >
                                <Zap
                                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                                  data-oid="tpdcbul"
                                />
                              </div>
                              <div data-oid="h6o4dhd">
                                <p
                                  className="text-xs font-bold text-emerald-700 dark:text-emerald-300"
                                  data-oid="cy-rzr9"
                                >
                                  Auto-calculated discount:{' '}
                                  {Math.round(
                                    (1 -
                                      settings.pricing_tiers.pro.price /
                                        settings.pricing_tiers.pro.originalPrice) *
                                      100
                                  )}
                                  % OFF
                                </p>
                                <p
                                  className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70"
                                  data-oid="b389l9o"
                                >
                                  Quarterly will show additional 15% off (total:{' '}
                                  {Math.round(
                                    (1 -
                                      (settings.pricing_tiers.pro.price * 0.85) /
                                        settings.pricing_tiers.pro.originalPrice) *
                                      100
                                  )}
                                  %)
                                </p>
                              </div>
                            </div>
                          )}

                        <div
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                          data-oid="fyi01cr"
                        >
                          <div
                            className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                            data-oid="p93ijbu"
                          ></div>
                          <span data-oid="r6ikakq">Active plan for professional users</span>
                        </div>

                        {/* Regional Pricing Section for Pro */}
                        <div
                          className="pt-4 border-t border-blue-200/40 dark:border-blue-800/20"
                          data-oid="n5xbdyj"
                        >
                          <div
                            className="flex items-center justify-between mb-3"
                            data-oid=":0nen-s"
                          >
                            <Label
                              className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider opacity-80 flex items-center gap-1"
                              data-oid="6-gg:1h"
                            >
                              <Globe className="w-3 h-3" data-oid="ms_eoo1" /> Regional Pricing
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegionalUpdate('pro', 'add')}
                              className="h-6 px-2 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                              data-oid="6jf6l5p"
                            >
                              <Plus className="w-3 h-3 mr-1" data-oid="x-1o879" /> Add Region
                            </Button>
                          </div>

                          <div className="space-y-2" data-oid="bwza9sg">
                            {settings.pricing_tiers?.pro?.regional?.map((region, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/40 group/item hover:bg-muted/50 transition-colors"
                                data-oid="qb:ds67"
                              >
                                <CountryAutocomplete
                                  value={region.country}
                                  disabled={saving}
                                  onChange={(country) =>
                                    handleRegionalUpdate('pro', 'update', idx, {
                                      country: country.code,
                                      currency: country.currency,
                                      symbol: country.symbol,
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
                                      handleRegionalUpdate(
                                        'pro',
                                        'update',
                                        idx,
                                        'price',
                                        parseFloat(e.target.value)
                                      )
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
                                  onClick={() => handleRegionalUpdate('pro', 'remove', idx)}
                                  className="h-9 w-9 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors opacity-60 group-hover/item:opacity-100"
                                  data-oid="_4tk-3j"
                                >
                                  <Trash2 className="w-4 h-4" data-oid="r1:da6w" />
                                </Button>
                              </div>
                            ))}
                            {(!settings.pricing_tiers?.pro?.regional ||
                              settings.pricing_tiers?.pro?.regional.length === 0) && (
                              <p
                                className="text-xs text-muted-foreground italic pl-1"
                                data-oid="byz3ucd"
                              >
                                No regional overrides configured
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Premium Plan */}
                  <motion.div variants={itemVariants} className="group relative" data-oid="lj7_lba">
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      data-oid="8q34_6a"
                    ></div>
                    <div
                      className="relative p-8 rounded-2xl border border-purple-200/60 dark:border-purple-800/40 bg-gradient-to-br from-purple-50/30 to-background dark:from-purple-900/10 dark:to-slate-900/50 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all duration-300"
                      data-oid="cbj9jls"
                    >
                      <div className="flex items-center justify-between" data-oid="26wdxud">
                        <div className="flex items-center gap-3" data-oid="b:qadcg">
                          <div
                            className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white shadow-lg shadow-purple-500/25"
                            data-oid="6fl4lbt"
                          >
                            <ShieldCheck className="w-6 h-6" data-oid="wct-7k_" />
                          </div>
                          <div data-oid="nxhg8o5">
                            <h4 className="font-bold text-xl text-foreground" data-oid="uxf32wb">
                              Premium Tier
                            </h4>
                            <p className="text-sm text-muted-foreground" data-oid="vd48:pv">
                              Advanced capabilities
                            </p>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50"
                          data-oid="3o02cn6"
                        >
                          <span className="text-xs font-semibold" data-oid="pwejz:3">
                            Monthly
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4" data-oid="infranj">
                        <div className="grid grid-cols-2 gap-4" data-oid="5bbzh.u">
                          <div className="space-y-2" data-oid="ku1tyzd">
                            <Label
                              className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider opacity-80"
                              data-oid="ed7mwtc"
                            >
                              Current Price (USD)
                            </Label>
                            <div className="relative group/input" data-oid=".4vfffl">
                              <span
                                className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-purple-600 dark:text-purple-400 z-10"
                                data-oid="4d22uyx"
                              >
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={settings.pricing_tiers?.premium?.price || ''}
                                onChange={(e) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    pricing_tiers: {
                                      ...prev.pricing_tiers,
                                      premium: {
                                        ...prev.pricing_tiers.premium,
                                        price: parseFloat(e.target.value),
                                      },
                                    },
                                  }))
                                }
                                className="h-12 pl-10 bg-background border-purple-200/60 dark:border-purple-800/40 font-bold text-xl focus-visible:ring-purple-500/20 focus-visible:border-purple-500 rounded-xl shadow-sm"
                                placeholder="15.99"
                                data-oid="fgrd8yr"
                              />
                            </div>
                          </div>
                          <div className="space-y-2" data-oid=":mmfcg_">
                            <Label
                              className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider opacity-80"
                              data-oid="8un135w"
                            >
                              Original Price (Was)
                            </Label>
                            <div className="relative group/input" data-oid="z-3q2fy">
                              <span
                                className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-slate-400 z-10"
                                data-oid="bu2c1:e"
                              >
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={settings.pricing_tiers?.premium?.originalPrice || ''}
                                onChange={(e) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    pricing_tiers: {
                                      ...prev.pricing_tiers,
                                      premium: {
                                        ...prev.pricing_tiers.premium,
                                        originalPrice: parseFloat(e.target.value),
                                      },
                                    },
                                  }))
                                }
                                className="h-12 pl-10 bg-muted/30 border-slate-200/60 dark:border-slate-800/40 font-bold text-xl text-slate-500 focus-visible:ring-slate-500/20 rounded-xl"
                                placeholder="25"
                                data-oid="mxak9g9"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Auto-calculated discount preview */}
                        {settings.pricing_tiers?.premium?.price &&
                          settings.pricing_tiers?.premium?.originalPrice && (
                            <div
                              className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/30"
                              data-oid="3xr01di"
                            >
                              <div
                                className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center"
                                data-oid="glpdz-9"
                              >
                                <ShieldCheck
                                  className="w-4 h-4 text-purple-600 dark:text-purple-400"
                                  data-oid="u5en59n"
                                />
                              </div>
                              <div data-oid="mx3y5z2">
                                <p
                                  className="text-xs font-bold text-purple-700 dark:text-purple-300"
                                  data-oid="slx5vc4"
                                >
                                  Auto-calculated discount:{' '}
                                  {Math.round(
                                    (1 -
                                      settings.pricing_tiers.premium.price /
                                        settings.pricing_tiers.premium.originalPrice) *
                                      100
                                  )}
                                  % OFF
                                </p>
                                <p
                                  className="text-[10px] text-purple-600/70 dark:text-purple-400/70"
                                  data-oid="-nc_6v6"
                                >
                                  Quarterly will show additional 15% off (total:{' '}
                                  {Math.round(
                                    (1 -
                                      (settings.pricing_tiers.premium.price * 0.85) /
                                        settings.pricing_tiers.premium.originalPrice) *
                                      100
                                  )}
                                  %)
                                </p>
                              </div>
                            </div>
                          )}

                        <div
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                          data-oid="8v7am3t"
                        >
                          <div
                            className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"
                            data-oid="-ftmnqk"
                          ></div>
                          <span data-oid="r3chj4n">Premium features for power users</span>
                        </div>

                        {/* Regional Pricing Section for Premium */}
                        <div
                          className="pt-4 border-t border-purple-200/40 dark:border-purple-800/20"
                          data-oid="50k61qs"
                        >
                          <div
                            className="flex items-center justify-between mb-3"
                            data-oid="pw5oc:3"
                          >
                            <Label
                              className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider opacity-80 flex items-center gap-1"
                              data-oid="f9eyofb"
                            >
                              <Globe className="w-3 h-3" data-oid="fbwk-g-" /> Regional Pricing
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegionalUpdate('premium', 'add')}
                              className="h-6 px-2 text-xs hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400"
                              data-oid="gzz74j6"
                            >
                              <Plus className="w-3 h-3 mr-1" data-oid="ldq3:p3" /> Add Region
                            </Button>
                          </div>

                          <div className="space-y-2" data-oid="n:q3l:-">
                            {settings.pricing_tiers?.premium?.regional?.map((region, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/40 group/item hover:bg-muted/50 transition-colors"
                                data-oid="_rnnh91"
                              >
                                <CountryAutocomplete
                                  value={region.country}
                                  disabled={saving}
                                  onChange={(country) =>
                                    handleRegionalUpdate('premium', 'update', idx, {
                                      country: country.code,
                                      currency: country.currency,
                                      symbol: country.symbol,
                                    })
                                  }
                                  data-oid="svz:c9l"
                                />

                                <div className="relative flex-1 min-w-[120px]" data-oid="6lq4r_3">
                                  <span
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none"
                                    data-oid="pasaxuf"
                                  >
                                    {region.symbol || '$'}
                                  </span>
                                  <Input
                                    type="number"
                                    placeholder="Price"
                                    value={region.price || ''}
                                    onChange={(e) =>
                                      handleRegionalUpdate(
                                        'premium',
                                        'update',
                                        idx,
                                        'price',
                                        parseFloat(e.target.value)
                                      )
                                    }
                                    className="h-9 pl-8 pr-12 text-sm font-semibold bg-background border-border/40 focus-visible:ring-purple-500/20"
                                    data-oid="84:tqco"
                                  />

                                  <div
                                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    data-oid="9ev0n3d"
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="h-5 px-1.5 text-[10px] font-mono tracking-wider opacity-70"
                                      data-oid=".p54kx."
                                    >
                                      {region.currency || 'USD'}
                                    </Badge>
                                  </div>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRegionalUpdate('premium', 'remove', idx)}
                                  className="h-9 w-9 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors opacity-60 group-hover/item:opacity-100"
                                  data-oid=":hdufko"
                                >
                                  <Trash2 className="w-4 h-4" data-oid="p-e1x-1" />
                                </Button>
                              </div>
                            ))}
                            {(!settings.pricing_tiers?.premium?.regional ||
                              settings.pricing_tiers?.premium?.regional.length === 0) && (
                              <p
                                className="text-xs text-muted-foreground italic pl-1"
                                data-oid="i-doiz3"
                              >
                                No regional overrides configured
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div
                  className="flex items-center justify-between pt-6 border-t border-border/30"
                  data-oid="b25u3fj"
                >
                  <div
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                    data-oid="qih51.2"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" data-oid="4n.-03f"></div>
                    <span data-oid="8vwkl:7">Pricing changes take effect immediately</span>
                  </div>
                  <Button
                    onClick={() => handleSave('pricing_tiers', settings.pricing_tiers)}
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
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6" data-oid="vdpbpus">
          <motion.div variants={itemVariants} className="max-w-3xl" data-oid="yo-z56e">
            <Card
              className="border border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm"
              data-oid="a24fl33"
            >
              <CardHeader className="border-b border-border/40 bg-muted/20" data-oid="8k9ymtq">
                <div className="flex items-center gap-2" data-oid="lpefb_:">
                  <Lock className="h-5 w-5 text-primary" data-oid="8dv0bn:" />
                  <CardTitle data-oid="ebovjjb">Security Settings</CardTitle>
                </div>
                <CardDescription data-oid="demtlp7">
                  Manage your account security and authentication credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6" data-oid="xy3w520">
                <div className="space-y-4" data-oid="uup1w.x">
                  <h3
                    className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                    data-oid="ki0_c5t"
                  >
                    Change Password
                  </h3>
                  <div className="space-y-4" data-oid="yqhhj90">
                    <div className="space-y-2" data-oid="0o.3ztg">
                      <Label htmlFor="current-password" data-oid="d7zo54h">
                        Current Password
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="bg-muted/10"
                        placeholder="Enter current password"
                        data-oid="o9:pk2b"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4" data-oid="7em9c2z">
                      <div className="space-y-2" data-oid="tcj0097">
                        <Label htmlFor="new-password" data-oid="x4xox-h">
                          New Password
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          className="bg-muted/10"
                          placeholder="Enter new password"
                          data-oid="_w01w1n"
                        />
                      </div>
                      <div className="space-y-2" data-oid="oi5qy0_">
                        <Label htmlFor="confirm-password" data-oid="x:d0joa">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          className="bg-muted/10"
                          placeholder="Confirm new password"
                          data-oid="-ji1r4t"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end" data-oid="xyy0wpq">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={
                        changingPassword ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword
                      }
                      className="font-bold rounded-xl shadow-sm"
                      data-oid="fr.6_.8"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="c:gptn5" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" data-oid="giyn:qt" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Rate Limits Settings */}
        <TabsContent value="rate-limits" className="space-y-6" data-oid="v5d91or">
          <motion.div variants={itemVariants} className="max-w-5xl" data-oid="7o46ze9">
            <TierRateLimitsSettings data-oid="oe.xgq6" />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default GlobalSettings;
