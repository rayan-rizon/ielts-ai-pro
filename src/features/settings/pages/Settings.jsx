import React, { useState, useEffect } from 'react';
import { useUserProfile, useUpdateProfile } from '@/features/auth/hooks/useUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { mergeDefaultTestMode } from '@/features/testing/shared/testMode';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTheme } from '@/components/theme-provider';
import {
  User as UserIcon,
  Target,
  Shield,
  Save,
  Trash2,
  Clock,
  Trophy,
  Crown,
  Gift,
  BarChart3,
  Mail,
  Lightbulb,
  ArrowRight,
  Lock,
  LifeBuoy,
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MUTED,
  NUM,
  PANEL,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';
import { generateAdaptiveLearningPath } from '@/utils/api';
import { requirePublicEnv } from '@/lib/publicEnv';
import {
  getWeeklyCapacity,
  normalizeStudyAvailability,
} from '../../../../supabase/functions/_shared/learningPathV2';

// Tab Sections
import ProfileSection from '../components/Sections/ProfileSection';
import GoalsSection from '../components/Sections/GoalsSection';
import SubscriptionSection from '../components/Sections/SubscriptionSection';
import SecuritySection from '../components/Sections/SecuritySection';
import PrivacySection from '../components/Sections/PrivacySection';
import UsageStatsSection from '@/features/settings/components/UsageStatsSection';
import ReferralSection from '@/features/settings/components/ReferralSection';
import EmailPreferencesSection from '../components/Sections/EmailPreferencesSection';
import SupportSection from '../components/Sections/SupportSection';

const loadUserService = () => import('@/features/auth/services/User').then((module) => module.User);
const loadSupabaseClient = () => import('@/lib/supabase').then((module) => module.supabase);
const SUPABASE_URL = requirePublicEnv('VITE_SUPABASE_URL');

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi',
];

const navItems = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'goals', label: 'Study Goals', icon: Target },
  { id: 'usage', label: 'Usage Stats', icon: BarChart3 },
  { id: 'referrals', label: 'Referrals', icon: Gift },
  { id: 'subscription', label: 'Plan & Billing', icon: Crown },
  { id: 'account', label: 'Security', icon: Lock },
  { id: 'preferences', label: 'Email', icon: Mail },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'support', label: 'Help & support', icon: LifeBuoy },
];

export default function Settings() {
  const { setTheme, theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'profile';
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    return tabParam && navItems.some((item) => item.id === tabParam) ? tabParam : 'profile';
  });
  const { data: user, isLoading: isUserLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const tabParam = searchParams.get('tab');

  useEffect(() => {
    const currentTabInUrl =
      tabParam && navItems.some((item) => item.id === tabParam) ? tabParam : 'profile';
    if (currentTabInUrl !== activeTab) {
      setActiveTab(currentTabInUrl);
    }
  }, [tabParam, activeTab]);

  // Form States
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    avatar_url: AVATARS[0],
    target_band_score: 7.0,
    exam_type: 'academic',
    study_hours_goal: 10,
    study_availability: null,
    test_date: '',
    default_test_mode: 'practice',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        avatar_url: user.avatar_url || AVATARS[0],
        target_band_score: user.target_band_score || 7.0,
        exam_type: user.exam_type || 'academic',
        study_hours_goal: user.study_hours_goal || 1,
        study_availability: user.study_availability || null,
        test_date: user.test_date ? user.test_date.split('T')[0] : '',
        default_test_mode: user.settings?.default_test_mode === 'exam' ? 'exam' : 'practice',
      });
    }
  }, [user]);

  const handleSave = async () => {
    const studyAvailability = normalizeStudyAvailability(
      formData.study_availability,
      formData.study_hours_goal,
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    );
    const legacyWeeklyHours = Math.max(1, Math.round(getWeeklyCapacity(studyAvailability) / 60));
    try {
      await updateProfileMutation.mutateAsync({
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
        target_band_score: formData.target_band_score,
        exam_type: formData.exam_type,
        study_hours_goal: legacyWeeklyHours,
        study_availability: studyAvailability,
        test_date: formData.test_date || null,
        settings: mergeDefaultTestMode(user?.settings, formData.default_test_mode),
      });
      if (['pro', 'premium'].includes(String(user?.subscription_tier).toLowerCase())) {
        await generateAdaptiveLearningPath({ trigger: 'goal_changed' });
        queryClient.invalidateQueries({ queryKey: ['learningPath'] });
      }
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.warn('Study goal save did not fully complete:', error?.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Error', { description: 'Passwords do not match.' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Error', { description: 'Password must be at least 8 characters.' });
      return;
    }
    if (
      !/[A-Z]/.test(passwordData.newPassword) ||
      !/[a-z]/.test(passwordData.newPassword) ||
      !/[0-9]/.test(passwordData.newPassword)
    ) {
      toast.error('Error', {
        description: 'Password must contain uppercase, lowercase, and numbers.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const User = await loadUserService();
      await User.updatePassword(passwordData.newPassword);
      toast.success('Success', { description: 'Password updated successfully.' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Error', { description: error.message || 'Failed to update password.' });
    }
    setIsUpdatingPassword(false);
  };

  const handleToggleCancellation = async () => {
    if (!user) return;
    if (!user.stripe_customer_id || !user.stripe_subscription_id) {
      toast.info('This plan is not billed through Stripe.', {
        description: 'Contact support@ieltsai.pro to end or change your access.',
      });
      return;
    }
    setIsCancelling(true);
    setShowCancelDialog(false);
    try {
      const supabase = await loadSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/toggle-subscription-cancellation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ cancel: !user.cancel_at_period_end }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      toast.success(
        user.cancel_at_period_end
          ? 'Subscription reactivated! Billing will resume as normal.'
          : 'Subscription set to cancel at the end of the current period.'
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    } catch (error) {
      toast.error('Failed to update subscription', {
        description: error.message || 'Please try again or contact support.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    if (!user?.stripe_customer_id || !user?.stripe_subscription_id) {
      toast.info('This plan is not billed through Stripe.', {
        description: 'Contact support@ieltsai.pro to manage your access.',
      });
      return;
    }
    setIsOpeningPortal(true);
    try {
      const supabase = await loadSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-customer-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'no_stripe_subscription') {
          toast.info('This plan is not billed through Stripe.', {
            description: 'Contact support@ieltsai.pro to manage your access.',
          });
          return;
        }
        throw new Error(data.error || 'Failed to open billing portal');
      }
      if (data.url) window.open(data.url, '_blank');
    } catch (error) {
      toast.error('Failed to open billing portal', { description: error.message });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8fb] dark:bg-[#08080a]">
        <Clock className="h-8 w-8 animate-spin text-[#5a63df]" />
      </div>
    );
  }

  const isSaving = updateProfileMutation.isPending;

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);

    const nextSearchParams = new URLSearchParams(searchParams);
    if (tabId === 'profile') nextSearchParams.delete('tab');
    else nextSearchParams.set('tab', tabId);
    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pb-10 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />

      <m.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 mx-auto max-w-[1400px] space-y-3"
      >
        {/* Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconChip icon={UserIcon} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Account settings
                </h1>
                <Pill tone="accent">{user?.subscription_tier || 'Free'}</Pill>
              </div>
              <p className={cn('text-sm font-medium', MUTED)}>
                Manage your preferences, study goals, and account security.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#5a63df] px-5 text-sm font-bold text-white shadow-2xs transition-colors duration-150 hover:bg-[#4a52c9] active:scale-[0.97] disabled:opacity-60"
          >
            {isSaving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>

        {/* Main Layout Grid (3:9 split) */}
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-12">
          {/* Left Sidebar Column (3 cols) */}
          <div className="space-y-3 lg:sticky lg:top-4 lg:col-span-3">
            {/* Navigation Tabs */}
            <div className={cn(PANEL, 'p-1.5')}>
              <nav
                className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col"
                role="tablist"
                aria-label="Settings navigation"
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        'group relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-bold outline-none transition-colors duration-150 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                        isActive
                          ? 'text-[#434ac9] dark:text-[#c3c7ff]'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      )}
                    >
                      {isActive && (
                        <m.div
                          layoutId="settings-active-tab-pill"
                          className="absolute inset-0 rounded-lg border border-[#5a63df]/25 bg-[#5a63df]/10 shadow-2xs dark:border-[#5a63df]/40 dark:bg-[#5a63df]/20"
                          transition={{
                            type: 'spring',
                            stiffness: 420,
                            damping: 32,
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors duration-150',
                            isActive
                              ? 'text-[#5a63df] dark:text-[#a5adff]'
                              : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                          )}
                        />
                        <span>{item.label}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Compact Profile Summary Widget */}
            <div className={cn(TILE, 'hidden p-4 lg:block')}>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#e4e2f0] dark:border-white/10">
                  <img
                    src={
                      formData.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name || 'default'}`
                    }
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                    {formData.full_name || 'User Profile'}
                  </h4>
                  <p className={cn('truncate text-xs font-medium', MUTED)}>{formData.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Trophy className="h-3.5 w-3.5" />
                    <span className={NUM}>Target Band {formData.target_band_score}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Column (9 cols) */}
          <div className="space-y-3 lg:col-span-9">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{
                  duration: 0.16,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="space-y-3"
              >
                {activeTab === 'profile' && (
                  <>
                    <ProfileSection
                      formData={formData}
                      setFormData={setFormData}
                      avatars={AVATARS}
                      theme={theme}
                      setTheme={setTheme}
                    />
                    <Link
                      to="/feature-requests"
                      className={cn(
                        PANEL,
                        'group flex items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5a63df]/35 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]'
                      )}
                    >
                      <IconChip icon={Lightbulb} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Suggest a feature
                        </h3>
                        <p className={cn('text-xs font-medium', MUTED)}>
                          Share an idea, vote on requests, and follow team updates.
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#5a63df]" />
                    </Link>
                  </>
                )}

                {activeTab === 'goals' && (
                  <GoalsSection formData={formData} setFormData={setFormData} />
                )}

                {activeTab === 'usage' && <UsageStatsSection />}

                {activeTab === 'referrals' && <ReferralSection />}

                {activeTab === 'subscription' && (
                  <SubscriptionSection
                    user={user}
                    isOpeningPortal={isOpeningPortal}
                    isCancelling={isCancelling}
                    showCancelDialog={showCancelDialog}
                    setShowCancelDialog={setShowCancelDialog}
                    handleOpenCustomerPortal={handleOpenCustomerPortal}
                    handleToggleCancellation={handleToggleCancellation}
                    navigate={navigate}
                  />
                )}

                {activeTab === 'account' && (
                  <SecuritySection
                    passwordData={passwordData}
                    setPasswordData={setPasswordData}
                    isUpdatingPassword={isUpdatingPassword}
                    handleUpdatePassword={handleUpdatePassword}
                    setShowDeleteModal={setShowDeleteModal}
                  />
                )}

                {activeTab === 'preferences' && <EmailPreferencesSection />}

                {activeTab === 'privacy' && <PrivacySection />}

                {activeTab === 'support' && <SupportSection />}
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={showDeleteModal}
          onOpenChange={(open) => {
            if (!isDeletingAccount) {
              setShowDeleteModal(open);
              if (!open) setDeleteConfirmText('');
            }
          }}
        >
          <DialogContent className="rounded-xl border-[#e4e2f0] bg-white p-5 dark:border-white/10 dark:bg-[#131315] sm:max-w-[380px]">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-[rgb(var(--signal-fault))]">
                <Trash2 className="h-5 w-5" />
                Delete account
              </DialogTitle>
              <DialogDescription className={cn('text-xs font-medium leading-relaxed', MUTED)}>
                This action is permanent and will wipe all your IELTS progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Type <span className="px-1 font-bold text-[rgb(var(--signal-fault))]">DELETE</span>{' '}
                below
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="h-11 rounded-lg border-[rgb(var(--signal-fault)/0.25)] bg-transparent text-center text-lg font-black tracking-tight outline-none transition-all placeholder:opacity-30 focus:ring-[rgb(var(--signal-fault))]"
                autoComplete="off"
              />
            </div>
            <DialogFooter className="flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeletingAccount}
                className="h-10 flex-1 rounded-lg border border-[#e2e5f2] text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeletingAccount(true);
                  try {
                    const User = await loadUserService();
                    await User.deleteMyAccount();
                    window.location.href = '/login';
                  } catch (error) {
                    setIsDeletingAccount(false);
                    toast.error('Error', {
                      description: error.message || 'Failed to delete account.',
                    });
                  }
                }}
                disabled={deleteConfirmText.toUpperCase() !== 'DELETE' || isDeletingAccount}
                className="h-10 flex-1 rounded-lg bg-[rgb(var(--signal-fault))] text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <Clock className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  'Confirm wipe'
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </m.div>
    </main>
  );
}
