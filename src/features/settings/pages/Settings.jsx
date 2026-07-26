import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useUserProfile, useUpdateProfile } from '@/features/auth/hooks/useUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { mergeDefaultTestMode } from '@/features/testing/shared/testMode';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  Sparkles,
  Trophy,
  Crown,
  Gift,
  BarChart3,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { generateAdaptiveLearningPath } from '@/utils/api';
import {
  getWeeklyCapacity,
  normalizeStudyAvailability,
} from '../../../../supabase/functions/_shared/learningPathV2';

// Extracted Sections
import ProfileSection from '../components/Sections/ProfileSection';

const GoalsSection = lazy(() => import('../components/Sections/GoalsSection'));
const SubscriptionSection = lazy(() => import('../components/Sections/SubscriptionSection'));
const SecuritySection = lazy(() => import('../components/Sections/SecuritySection'));
const PrivacySection = lazy(() => import('../components/Sections/PrivacySection'));
const UsageStatsSection = lazy(() => import('@/features/settings/components/UsageStatsSection'));
const ReferralSection = lazy(() => import('@/features/settings/components/ReferralSection'));

const loadUserService = () => import('@/features/auth/services/User').then((module) => module.User);
const loadSupabaseClient = () => import('@/lib/supabase').then((module) => module.supabase);

function SettingsTabFallback() {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 p-5 space-y-3">
      <Skeleton className="h-6 w-36 rounded-lg" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

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
  { id: 'account', label: 'Security', icon: Shield },
  { id: 'privacy', label: 'Privacy', icon: Shield },
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
    if (!tabParam) return;
    if (!navItems.some((item) => item.id === tabParam)) return;
    if (tabParam === activeTab) return;
    setActiveTab(tabParam);
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

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
      const response = await fetch(`${supabaseUrl}/functions/v1/toggle-subscription-cancellation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ cancel: !user.cancel_at_period_end }),
      });

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
    if (!user?.stripe_customer_id) {
      toast.error('No Stripe subscription found');
      return;
    }
    setIsOpeningPortal(true);
    try {
      const supabase = await loadSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'}/functions/v1/create-customer-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to open billing portal');
      if (data.url) window.open(data.url, '_blank');
    } catch (error) {
      toast.error('Failed to open billing portal', { description: error.message });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#020617]">
        <Clock className="w-8 h-8 animate-spin text-indigo-600" />
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
    <div className="relative min-h-screen pb-16 bg-slate-50 dark:bg-[#020617] transition-colors duration-300 font-sans">
      {/* Background Subtle Gradient & Grid */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[45rem] h-[45rem] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4 sm:space-y-6 relative z-10"
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Account Settings
                </h1>
                <Badge className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 rounded-md font-semibold uppercase text-xs">
                  {user?.subscription_tier || 'Free'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Manage your preferences, study goals, and account security.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="rounded-xl px-5 h-10 font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all text-white text-sm border-0"
            >
              {isSaving ? (
                <Clock className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Main Layout Grid (3:9 split) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Sidebar Column (3 cols) */}
          <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">
            {/* Navigation Tabs */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 p-1.5">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        'flex shrink-0 items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 relative overflow-hidden whitespace-nowrap',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                          : 'text-slate-600 hover:text-slate-900 dark:hover:text-white dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/5'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-white' : 'text-slate-400'
                        )}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Compact Profile Summary Widget */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-4 text-white shadow-md shadow-indigo-500/15 relative overflow-hidden hidden lg:block">
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/30 shrink-0 shadow-sm">
                  <img
                    src={
                      formData.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name || 'default'}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold truncate">
                    {formData.full_name || 'User Profile'}
                  </h4>
                  <p className="text-xs text-indigo-100/90 truncate font-medium">
                    {formData.email}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs font-semibold opacity-90">
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Target Band {formData.target_band_score}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Column (9 cols) */}
          <div className="lg:col-span-9 space-y-4">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <ProfileSection
                  key="profile"
                  formData={formData}
                  setFormData={setFormData}
                  avatars={AVATARS}
                  theme={theme}
                  setTheme={setTheme}
                />
              )}
              {activeTab !== 'profile' && (
                <Suspense fallback={<SettingsTabFallback />}>
                  {activeTab === 'goals' && (
                    <GoalsSection key="goals" formData={formData} setFormData={setFormData} />
                  )}
                  {activeTab === 'subscription' && (
                    <SubscriptionSection
                      key="subscription"
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
                      key="account"
                      passwordData={passwordData}
                      setPasswordData={setPasswordData}
                      isUpdatingPassword={isUpdatingPassword}
                      handleUpdatePassword={handleUpdatePassword}
                      theme={theme}
                      setTheme={setTheme}
                      setShowDeleteModal={setShowDeleteModal}
                    />
                  )}
                  {activeTab === 'usage' && <UsageStatsSection key="usage" />}
                  {activeTab === 'referrals' && <ReferralSection key="referrals" />}
                  {activeTab === 'privacy' && <PrivacySection key="privacy" />}
                </Suspense>
              )}
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
          <DialogContent className="sm:max-w-[380px] rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-xl font-black text-rose-600">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                This action is permanent and will wipe all your IELTS progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Type <span className="text-rose-600 font-bold px-1">DELETE</span> below
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="h-11 rounded-xl border-rose-500/20 focus:ring-rose-500 bg-transparent font-black text-center text-lg tracking-tight transition-all placeholder:opacity-30 outline-none"
                autoComplete="off"
              />
            </div>
            <DialogFooter className="flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeletingAccount}
                className="rounded-xl h-10 font-bold flex-1 border-slate-200 dark:border-white/10 text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
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
                className="rounded-xl h-10 font-black flex-1 shadow-md shadow-rose-500/20 text-xs border-0"
              >
                {isDeletingAccount ? <Clock className="animate-spin w-4 h-4" /> : 'Confirm Wipe'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
