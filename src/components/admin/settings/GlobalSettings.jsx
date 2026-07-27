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
      className="space-y-6 pb-12 max-w-7xl mx-auto px-1 sm:px-2"
      data-oid="_8_3dg3"
    >
      {/* Header Section */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2"
        data-oid="kdpj5_b"
      >
        <motion.div variants={itemVariants} data-oid="kha4q:o">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs"
              data-oid="7q-v0g0"
            >
              <Settings className="w-5 h-5" data-oid="9.znbfp" />
            </div>
            <div>
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white"
                data-oid="rpads70"
              >
                Global Settings
              </h2>
              <p
                className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5"
                data-oid="ln-p8lk"
              >
                Manage system configurations, environment parameters, and platform controls
              </p>
            </div>
          </div>
        </motion.div>

        {saving && (
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs"
            data-oid="7n88hnp"
          >
            <Activity
              className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse"
              data-oid="yytghqi"
            />
            <span
              className="text-xs font-bold text-indigo-700 dark:text-indigo-300"
              data-oid="57qqa9r"
            >
              Saving changes...
            </span>
          </div>
        )}
      </div>

      <Tabs
        value={activeSection}
        onValueChange={handleSectionChange}
        className="w-full space-y-6"
        data-oid="bufrpat"
      >
        {/* Compact Segmented Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar pb-1">
          <TabsList
            className="inline-flex h-auto items-center justify-start gap-1 p-1.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs backdrop-blur-md"
            data-oid="ybobvet"
          >
            <TabsTrigger
              value="general"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all"
              data-oid="tbs-gen"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all"
              data-oid="tbs-ann"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Announcements</span>
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all"
              data-oid="tbs-prc"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pricing</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all"
              data-oid="tbs-sec"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="rate-limits"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all"
              data-oid="tbs-rat"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Rate Limits</span>
            </TabsTrigger>
            <TabsTrigger
              value="emails"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-xs transition-all"
              data-oid="tbs-eml"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Emails</span>
            </TabsTrigger>
          </TabsList>
        </div>

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
