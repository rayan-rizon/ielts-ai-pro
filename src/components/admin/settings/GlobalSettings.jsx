import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import SystemHealthDashboard from './SystemHealthDashboard';
import TierRateLimitsSettings from './TierRateLimitsSettings';
import AdminEmailSettings from './AdminEmailSettings';
import AnnouncementsSettingsTab from './AnnouncementsSettingsTab';
import PricingSettingsTab from './PricingSettingsTab';
import SecuritySettingsTab from './SecuritySettingsTab';
import {
  validatePricingTiers,
  validatePasswordChange,
  performPasswordUpdate,
} from './settingsHelpers';
import { toast } from 'sonner';

import {
  Loader2,
  Settings,
  CreditCard,
  Bell,
  Globe,
  Activity,
  Gauge,
  Mail,
  Lock,
} from 'lucide-react';

export default function GlobalSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'general';

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
        const validation = validatePricingTiers(value);
        if (!validation.valid) {
          toast.error(validation.error);
          setSaving(false);
          return;
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

  const handleSectionChange = (value) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set('section', value);
        return params;
      },
      { replace: true }
    );
  };

  const handlePasswordChange = async () => {
    const validation = validatePasswordChange(passwordData);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      setChangingPassword(true);
      await performPasswordUpdate(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRegionalUpdate = ({ tier, action, index, field, value }) => {
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

      <Tabs
        value={activeSection}
        onValueChange={handleSectionChange}
        className="w-full"
        data-oid="bufrpat"
      >
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
            <TabsTrigger
              value="emails"
              className="relative rounded-xl px-6 py-3 font-semibold text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 dark:data-[state=active]:shadow-blue-400/20 transition-all duration-300 flex items-center gap-2.5 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-background/50 dark:hover:bg-slate-800/50 group"
            >
              <Mail className="w-4 h-4 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400 transition-colors" />
              <span className="relative z-10">Emails</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
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

        <TabsContent value="announcements" className="space-y-6" data-oid="h6s19d0">
          <AnnouncementsSettingsTab
            announcement={settings.public_announcement}
            saving={saving}
            onSave={handleSave}
            onChangeAnnouncement={(announcement) =>
              setSettings((prev) => ({ ...prev, public_announcement: announcement }))
            }
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6" data-oid="irb46s8">
          <PricingSettingsTab
            pricingTiers={settings.pricing_tiers}
            saving={saving}
            onSave={handleSave}
            onChangePricingTiers={(pricingTiers) =>
              setSettings((prev) => ({ ...prev, pricing_tiers: pricingTiers }))
            }
            onRegionalUpdate={handleRegionalUpdate}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6" data-oid="vdpbpus">
          <SecuritySettingsTab
            passwordData={passwordData}
            onChangePasswordData={setPasswordData}
            changingPassword={changingPassword}
            onPasswordChange={handlePasswordChange}
          />
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-6" data-oid="v5d91or">
          <motion.div variants={itemVariants} className="max-w-5xl" data-oid="7o46ze9">
            <TierRateLimitsSettings data-oid="oe.xgq6" />
          </motion.div>
        </TabsContent>

        <TabsContent value="emails" className="space-y-6">
          <motion.div variants={itemVariants} className="max-w-5xl">
            <AdminEmailSettings />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
