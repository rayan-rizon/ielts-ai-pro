import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackAuthenticatedAppEvent } from '@/lib/tracking';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { User } from '@/entities';
import { addWeeks } from 'date-fns';
import {
  CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Target,
  Brain,
  Clock,
  Rocket,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import { generateAdaptiveLearningPath } from '@/utils/api';
import { toast } from 'sonner';
import { IconChip, MICRO, MUTED } from '@/features/dashboard/components/primitives';
import { useAuth } from '@/features/auth/context/AuthContext';
import { hasPaidAccess } from '@/features/subscription/config/contentAccess';
import {
  getWeeklyCapacity,
  normalizeStudyAvailability,
} from '../../../../supabase/functions/_shared/learningPathV2';

import WelcomeStep from '@/features/onboarding/components/steps/WelcomeStep';
import TargetStep from '@/features/onboarding/components/steps/TargetStep';
import TimelineStep from '@/features/onboarding/components/steps/TimelineStep';
import StudyTimeStep from '@/features/onboarding/components/steps/StudyTimeStep';
import FocusStep from '@/features/onboarding/components/steps/FocusStep';
import CompleteStep from '@/features/onboarding/components/steps/CompleteStep';
import { queueFirstRunProductTour } from '@/features/dashboard/lib/productTourStorage';
import { recordOnboardingOffer } from '@/features/onboarding/services/onboardingOffer';
import { Logo } from '@/components/shared/Logo';

// Step configurations
const steps = [
  {
    id: 'welcome',
    title: 'Welcome to IELTS Ai Pro',
    description: 'Personalize your learning journey in under 60 seconds.',
    icon: Brain,
  },
  {
    id: 'target',
    title: 'What is your target Band Score?',
    description: 'This helps us calibrate the difficulty of your practice tests.',
    icon: Target,
  },
  {
    id: 'timeline',
    title: 'When do you plan to take IELTS?',
    description: 'Choose a specific date or an estimated timeline.',
    icon: CalendarIcon,
  },
  {
    id: 'studyTime',
    title: 'When can you study each week?',
    description: 'Set your active days and study limits so the plan fits real life.',
    icon: Clock,
  },
  {
    id: 'focus',
    title: 'Which area needs the most work?',
    description: "We'll prioritize this in your personalized study plan.",
    icon: Zap,
  },
  {
    id: 'complete',
    title: 'Your personalized plan',
    description: 'A realistic first structure, built from the goals and time you shared.',
    icon: Rocket,
  },
];

const stepVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir) => ({
    x: dir > 0 ? -20 : 20,
    opacity: 0,
  }),
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const firstRunTourUserRef = useRef(null);

  if (!firstRunTourUserRef.current && user?.id) {
    firstRunTourUserRef.current =
      user.onboarding_completed === false ? { id: user.id, onboarding_completed: false } : null;
  }

  const [formData, setFormData] = useState({
    target_band_score: 7.0,
    test_date: null,
    timeline_type: null, // 'specific' or 'estimated'
    estimated_weeks: null,
    study_hours_goal: 4,
    study_availability: normalizeStudyAvailability(
      {
        version: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        days: { monday: 45, wednesday: 60, friday: 45, saturday: 90 },
      },
      4,
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    ),
    weak_area: null,
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    setIsCheckingStatus(true);
    try {
      // We no longer automatically redirect away from the onboarding page.
    } catch (error) {
      console.warn('Failed to check onboarding status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentStep((prev) => prev + 1);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  }, []);

  const handleNext = async () => {
    if (steps[currentStep].id === 'focus') {
      const saved = await submitData();
      if (saved) goNext();
    } else if (currentStep === steps.length - 1) {
      finishOnboarding();
    } else {
      goNext();
    }
  };

  const handleOnboardingConflict = async () => {
    try {
      const updatedUser = await User.updateMyUserData({
        onboarding_completed: true,
        onboarding_outcome: 'answered',
      });
      saveOnboardingCompletedLocally();
      if (hasPaidAccess(updatedUser)) triggerBackgroundPathGeneration(updatedUser);
      return true;
    } catch (retryError) {
      console.error('Retry also failed:', retryError);
      toast.error('Update conflict', {
        description: 'Profile update conflict. Please refresh the page and try again.',
      });
      return false;
    }
  };

  const submitData = async () => {
    setIsLoading(true);
    try {
      const updatePayload = buildOnboardingPayload(formData);
      console.info('Saving onboarding preferences:', updatePayload);

      const updatedUser = await User.updateMyUserData(updatePayload);
      saveOnboardingCompletedLocally();
      if (hasPaidAccess(updatedUser)) triggerBackgroundPathGeneration(updatedUser);

      trackAuthenticatedAppEvent(
        'onboarding_completed',
        {
          target_band_score: formData.target_band_score,
          weak_area: formData.weak_area,
          study_hours_goal: formData.study_hours_goal,
          has_test_date: !!(formData.test_date || formData.estimated_weeks),
        },
        updatedUser
      );
      return true;
    } catch (error) {
      console.error('Onboarding save error:', error);

      const { title, message } = getErrorMessage(error);
      if (message === 'CONFLICT') {
        return await handleOnboardingConflict();
      } else {
        toast.error(title, { description: message });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const finishOnboarding = () => {
    void recordOnboardingOffer('continued_free');
    trackAuthenticatedAppEvent('onboarding_free_continue', {}, user);
    if (firstRunTourUserRef.current) {
      queueFirstRunProductTour(firstRunTourUserRef.current);
      firstRunTourUserRef.current = null;
    }
    navigate(createPageUrl('Dashboard'));
  };

  const openLearningPath = () => {
    navigate(createPageUrl('LearningPath'));
  };

  const trackPlanOfferViewed = useCallback(() => {
    void recordOnboardingOffer('offer_seen');
    trackAuthenticatedAppEvent(
      'onboarding_plan_offer_viewed',
      { target_band_score: formData.target_band_score, weak_area: formData.weak_area },
      user
    );
  }, [formData.target_band_score, formData.weak_area, user]);

  const openSubscriptionPlans = (tier = 'pro') => {
    void recordOnboardingOffer('plan_clicked', tier);
    trackAuthenticatedAppEvent('onboarding_plan_selected', { plan_tier: tier }, user);
    const params = new URLSearchParams({
      plan: tier,
      source: 'onboarding',
      focus: formData.weak_area || 'all',
      target: String(formData.target_band_score || 7),
    });
    navigate(`${createPageUrl('Pricing')}?${params.toString()}`);
  };

  const skipOnboarding = async () => {
    setIsLoading(true);
    try {
      await User.updateMyUserData({
        onboarding_completed: true,
        onboarding_outcome: 'skipped',
      });
      saveOnboardingCompletedLocally();
      toast.info('Onboarding skipped', {
        description: 'You can complete your profile later from the dashboard.',
      });
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Skip onboarding error:', error);
      toast.warning('Could not save preferences, but continuing...');
      navigate(createPageUrl('Dashboard'));
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    const currentStepId = steps[currentStep]?.id;
    if (currentStepId === 'timeline') {
      if (formData.timeline_type === 'specific') {
        return !!formData.test_date;
      }
      return !!formData.estimated_weeks;
    }
    if (currentStepId === 'focus') {
      return !!formData.weak_area;
    }
    if (currentStepId === 'studyTime') {
      return Object.keys(formData.study_availability?.days || {}).length > 0;
    }
    return true;
  };

  const renderStepContent = (stepId) => {
    switch (stepId) {
      case 'welcome':
        return <WelcomeStep />;
      case 'target':
        return (
          <TargetStep
            targetBandScore={formData.target_band_score}
            onChangeTargetBand={(val) =>
              setFormData((prev) => ({ ...prev, target_band_score: val }))
            }
          />
        );
      case 'timeline':
        return (
          <TimelineStep
            timelineType={formData.timeline_type}
            estimatedWeeks={formData.estimated_weeks}
            testDate={formData.test_date}
            onChangeTimeline={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
          />
        );
      case 'studyTime':
        return (
          <StudyTimeStep
            studyHoursGoal={formData.study_hours_goal}
            studyAvailability={formData.study_availability}
            onChangeAvailability={(study_availability) =>
              setFormData((prev) => ({
                ...prev,
                study_availability,
                study_hours_goal: Math.max(
                  1,
                  Math.round(getWeeklyCapacity(study_availability) / 60)
                ),
              }))
            }
          />
        );
      case 'focus':
        return (
          <FocusStep
            weakArea={formData.weak_area}
            onChangeWeakArea={(val) => setFormData((prev) => ({ ...prev, weak_area: val }))}
          />
        );
      case 'complete':
        return (
          <CompleteStep
            formData={formData}
            hasPaidPlan={hasPaidAccess(user)}
            onUpgrade={openSubscriptionPlans}
            onContinue={finishOnboarding}
            onOpenPlan={openLearningPath}
            onPlanOfferViewed={trackPlanOfferViewed}
          />
        );
      default:
        return null;
    }
  };

  const StepIcon = steps[currentStep]?.icon || Brain;

  if (isCheckingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f0f7] dark:bg-[#08080a]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#5a63df]/25 border-t-[#5a63df]" />
          <p className={cn(MICRO, MUTED)}>Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-[#f1f0f7] p-2.5 sm:p-4 dark:bg-[#08080a]">
      {/* Subtle dot-grid + ambient depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.08] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(90,99,223,0.07),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 z-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(90,99,223,0.05),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.12),transparent_70%)]"
      />

      <div
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-2xl',
          currentStep === steps.length - 1 ? 'max-w-2xl' : 'max-w-lg sm:max-w-xl',
          'border border-[#cecbe2] bg-linear-to-b from-white to-[#faf9ff]',
          'dark:border-white/[0.08] dark:from-[#141319] dark:to-[#100f15]',
          'shadow-[0_12px_36px_-6px_rgba(20,18,48,0.06),0_4px_16px_-4px_rgba(20,18,48,0.03)] dark:shadow-none'
        )}
      >
        {/* Step rail — one segment per step */}
        <div className="flex gap-1 p-3 pb-0 sm:p-4 sm:pb-0">
          {steps.map((step, index) => (
            <span
              key={step.id}
              aria-hidden="true"
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                index <= currentStep
                  ? 'bg-[#5a63df] dark:bg-[#8f97ff]'
                  : 'bg-[#e2e0f0] dark:bg-white/[0.07]'
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 px-3 pt-2.5 sm:px-4">
          <Logo size="sm" className="shrink-0" />

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <IconChip icon={StepIcon} tone="accent" size="xs" />
              <span className={cn(MICRO, MUTED, 'text-[10px]')}>
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            {currentStep < steps.length - 1 && (
              <>
                <span className="h-3 w-px bg-[#e2e0f0] dark:bg-white/10" />
                <button
                  type="button"
                  onClick={skipOnboarding}
                  disabled={isLoading}
                  className={cn(
                    MICRO,
                    'inline-flex min-h-[24px] items-center rounded-sm px-1 text-[10.5px] text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200'
                  )}
                >
                  Skip for now
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-3.5 pb-3.5 pt-2 sm:px-5 sm:pb-5">
          <div className="relative w-full">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <m.div
                key={steps[currentStep].id}
                custom={direction}
                variants={stepVariants}
                initial={reduceMotion ? { opacity: 0 } : 'enter'}
                animate={reduceMotion ? { opacity: 1 } : 'center'}
                exit={reduceMotion ? { opacity: 0 } : 'exit'}
                transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {steps[currentStep].id !== 'complete' && (
                  <div className="mb-2.5 sm:mb-3 text-center">
                    <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                      {steps[currentStep].title}
                    </h1>
                    <p
                      className={cn(
                        'mt-0.5 text-[12px] font-medium leading-relaxed',
                        MUTED,
                        'mx-auto max-w-sm sm:max-w-md'
                      )}
                    >
                      {steps[currentStep].description}
                    </p>
                  </div>
                )}

                {renderStepContent(steps[currentStep].id)}
              </m.div>
            </AnimatePresence>
          </div>

          {currentStep < steps.length - 1 && (
            <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-[#e2e0f0] pt-2.5 dark:border-white/[0.07]">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isLoading || currentStep === steps.length - 1}
                  className="inline-flex h-8.5 items-center gap-1 rounded-lg px-2.5 text-[12px] font-bold text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-40 dark:text-slate-400 dark:hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              ) : (
                <div aria-hidden="true" className="w-10" />
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className={cn(
                  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-6 text-[13px] font-bold text-white transition-all duration-150',
                  'bg-[#5a63df] hover:bg-[#4a52c9] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {isLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating plan…
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Standalone pure helper function to map save error to user-friendly titles and messages
function getErrorMessage(error) {
  if (!error) {
    return {
      title: 'Error saving profile',
      message: 'Could not save your preferences. Please try again.',
    };
  }

  const msg = error.message || '';
  const code = error.code || '';

  if (isSessionError(msg)) {
    return { title: 'Session expired', message: 'Please log in again to continue.' };
  }
  if (isNetworkError(msg)) {
    return {
      title: 'Connection error',
      message: 'Please check your internet connection and try again.',
    };
  }
  if (isPermissionError(code, msg)) {
    return {
      title: 'Access issue',
      message: 'Permission denied. Please try logging out and back in.',
    };
  }
  if (isConflictError(code, msg)) {
    return { title: 'Update conflict', message: 'CONFLICT' };
  }

  return {
    title: 'Error saving profile',
    message: msg || 'Could not save your preferences. Please try again.',
  };
}

function isSessionError(msg) {
  if (msg.includes('not logged in')) return true;
  if (msg.includes('User not logged in')) return true;
  return false;
}

function isNetworkError(msg) {
  if (msg.includes('network')) return true;
  if (msg.includes('fetch')) return true;
  return false;
}

function isPermissionError(code, msg) {
  if (code === '42501') return true;
  if (msg.includes('permission denied')) return true;
  return false;
}

function isConflictError(code, msg) {
  if (code === '23505') return true;
  if (msg.includes('unique constraint')) return true;
  if (msg.includes('ON CONFLICT')) return true;
  return false;
}

function buildOnboardingPayload(formData) {
  const payload = {
    onboarding_completed: true,
    // The gate and the metric are separate: `onboarding_completed` only says
    // "don't send this learner back here", `onboarding_outcome` says whether
    // they actually answered. See 20260914130736.
    onboarding_outcome: 'answered',
  };

  if (formData.target_band_score) {
    payload.target_band_score = formData.target_band_score;
  }

  let actualTestDate = formData.test_date;
  if (formData.timeline_type === 'estimated') {
    if (formData.estimated_weeks) {
      actualTestDate = addWeeks(new Date(), formData.estimated_weeks);
    }
  }

  if (actualTestDate) {
    payload.test_date = actualTestDate.toISOString();
    payload.test_date_source = formData.timeline_type === 'specific' ? 'confirmed' : 'estimated';
    payload.test_date_confirmed_at =
      formData.timeline_type === 'specific' ? new Date().toISOString() : null;
  }
  if (formData.weak_area) {
    payload.weak_area = formData.weak_area;
  }
  if (formData.study_hours_goal) {
    payload.study_hours_goal = formData.study_hours_goal;
  }
  if (formData.study_availability) {
    payload.study_availability = formData.study_availability;
  }

  return payload;
}

function triggerBackgroundPathGeneration(user) {
  if (!user) return;
  const userId = user.id;
  if (!userId) return;

  generateAdaptiveLearningPath({ trigger: 'goal_changed' }).catch((pathError) => {
    const status = pathError?.status;
    if (status === 403) {
      return;
    }
    const errMsg = pathError?.message || pathError;
    console.warn('AI path generation skipped (background):', errMsg);
  });
}

function saveOnboardingCompletedLocally() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('onboarding_completed', 'true');
}
