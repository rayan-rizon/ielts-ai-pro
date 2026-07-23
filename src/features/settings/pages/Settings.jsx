import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useUserProfile, useUpdateProfile } from '@/features/auth/hooks/useUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'react-router-dom';
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
    <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 p-6 space-y-4">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
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
      });
      if (['pro', 'premium'].includes(String(user?.subscription_tier).toLowerCase())) {
        await generateAdaptiveLearningPath({ trigger: 'goal_changed' });
        queryClient.invalidateQueries({ queryKey: ['learningPath'] });
      }
    } catch (error) {
      // The profile mutation and plan generator provide their own user-facing errors.
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
    // Simple checks for upper, lower, number
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
        <Clock className="w-10 h-10 animate-spin text-indigo-600" />
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
    <div className="relative min-h-screen pb-20 bg-slate-50 dark:bg-[#020617] transition-colors duration-500 overflow-hidden font-sans">
      {/* Background blobs / grid */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[70rem] h-[70rem] rounded-full bg-slate-200/30 dark:bg-indigo-950/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-indigo-100/20 dark:bg-slate-900/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/10 pb-10">
          <div className="space-y-1">
            <Badge className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 rounded-full font-bold uppercase tracking-widest text-[10px]">
              Settings
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Manage Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                Profile
              </span>
            </h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="rounded-2xl px-8 h-12 font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/25 active:scale-95 transition-all text-white border-0"
          >
            {isSaving ? (
              <Clock className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Nav */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-10">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden p-1 sm:p-2">
              <nav className="flex lg:flex-col gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        'flex shrink-0 items-center gap-2 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl transition-all duration-300 relative overflow-hidden whitespace-nowrap',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 shrink-0 h-4',
                          isActive ? 'text-white' : 'text-slate-400'
                        )}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Profile Preview Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white/20 mb-6 shadow-2xl">
                  <img
                    src={
                      formData.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.full_name || 'default'}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-2xl font-black">{formData.full_name || 'Your Name'}</h4>
                <p className="text-indigo-100/70 text-sm font-medium">{formData.email}</p>
                <div className="mt-8 pt-8 border-t border-white/10 w-full flex justify-between items-center px-2">
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      Target Band
                    </p>
                    <p className="text-3xl font-black">{formData.target_band_score}</p>
                  </div>
                  <Trophy className="w-10 h-10 text-white/20" />
                </div>
              </div>
              <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>

          {/* Tab Content */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <ProfileSection
                  key="profile"
                  formData={formData}
                  setFormData={setFormData}
                  avatars={AVATARS}
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
          <DialogContent className="sm:max-w-[400px] rounded-3xl border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-6 md:p-8 shadow-2xl">
            <DialogHeader className="space-y-3">
              <DialogTitle className="flex items-center gap-3 text-2xl font-black text-rose-600">
                <Trash2 className="h-6 w-6" />
                Delete Account
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                This action is permanent and will wipe all your IELTS progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-6">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                Type <span className="text-rose-600 font-bold px-1">DELETE</span> below
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="h-14 rounded-xl border-rose-500/20 focus:ring-rose-500 bg-transparent font-black text-center text-xl tracking-tight transition-all placeholder:opacity-30 outline-none"
                autoComplete="off"
              />
            </div>
            <DialogFooter className="flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeletingAccount}
                className="rounded-xl h-12 font-bold flex-1 border-slate-200 dark:border-white/10 text-sm hover:bg-white/5 transition-all"
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
                className="rounded-xl h-12 font-black flex-1 shadow-lg shadow-rose-500/20 text-sm border-0"
              >
                {isDeletingAccount ? <Clock className="animate-spin" /> : 'Confirm Wipe'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
