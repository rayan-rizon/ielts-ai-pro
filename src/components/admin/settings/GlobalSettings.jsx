import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import PlatformHealthDashboard from './PlatformHealthDashboard';
import TierRateLimitsSettings from './TierRateLimitsSettings';
import AdminEmailSettings from './AdminEmailSettings';
import AnnouncementsSettingsTab from './AnnouncementsSettingsTab';
import PricingSettingsTab from './PricingSettingsTab';
import { ADMIN_TABS_LIST, ADMIN_TAB_TRIGGER } from '@/components/admin/ui/primitives';
import SecuritySettingsTab from './SecuritySettingsTab';
import {
  validatePricingTiers,
  validatePasswordChange,
  performPasswordUpdate,
} from './settingsHelpers';
import { toast } from 'sonner';

import { Loader2, Activity, CreditCard, Bell, HeartPulse, Gauge, Mail, Lock } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/primitives';

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
      className="space-y-6 pb-12 pt-12 md:pt-0 max-w-7xl mx-auto px-1 sm:px-2"
      data-oid="_8_3dg3"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} data-oid="kdpj5_b">
        <AdminPageHeader
          title="Settings"
          description="Manage system configurations, environment parameters, and platform controls"
        >
          {saving && (
            <div
              className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs shrink-0"
              data-oid="7n88hnp"
            >
              <Activity
                className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse"
                data-oid="yytghqi"
              />
              <span
                className="text-[11px] sm:text-xs font-bold text-indigo-700 dark:text-indigo-300"
                data-oid="57qqa9r"
              >
                Saving changes...
              </span>
            </div>
          )}
        </AdminPageHeader>
      </motion.div>

      <Tabs
        value={activeSection}
        onValueChange={handleSectionChange}
        className="w-full space-y-6"
        data-oid="bufrpat"
      >
        {/* Compact Segmented Tab Navigation */}
        <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 pb-1">
          <TabsList className={ADMIN_TABS_LIST} data-oid="ybobvet">
            <TabsTrigger value="general" className={ADMIN_TAB_TRIGGER} data-oid="tbs-gen">
              <HeartPulse className="w-3.5 h-3.5" />
              Health
            </TabsTrigger>
            <TabsTrigger value="announcements" className={ADMIN_TAB_TRIGGER} data-oid="tbs-ann">
              <Bell className="w-3.5 h-3.5" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="pricing" className={ADMIN_TAB_TRIGGER} data-oid="tbs-prc">
              <CreditCard className="w-3.5 h-3.5" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="security" className={ADMIN_TAB_TRIGGER} data-oid="tbs-sec">
              <Lock className="w-3.5 h-3.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="rate-limits" className={ADMIN_TAB_TRIGGER} data-oid="tbs-rat">
              <Gauge className="w-3.5 h-3.5" />
              Rate Limits
            </TabsTrigger>
            <TabsTrigger value="emails" className={ADMIN_TAB_TRIGGER} data-oid="tbs-eml">
              <Mail className="w-3.5 h-3.5" />
              Emails
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-6" data-oid="ziz8z.b">
          <motion.div variants={itemVariants} data-oid="21cboft">
            <PlatformHealthDashboard
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
