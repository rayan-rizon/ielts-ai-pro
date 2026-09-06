import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackAuthenticatedAppEvent } from '@/lib/tracking';
import { m, AnimatePresence } from 'framer-motion';
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
import { IconChip, MICRO, MUTED, PANEL } from '@/features/dashboard/components/primitives';
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

// Step configurations
const steps = [
  {
    id: 'welcome',
    title: 'Welcome to IELTS Ai Pro',
    description: "Let's personalize your learning journey in just 4 steps.",
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
    description: 'Choose days and minute limits so the plan fits real life.',
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
    title: 'Ready to go!',
    description: 'Your personalized path is ready.',
    icon: Rocket,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

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
      await submitData();
      goNext();
    } else if (currentStep === steps.length - 1) {
      finishOnboarding();
    } else {
      goNext();
    }
  };

  const handleOnboardingConflict = async () => {
    try {
      await User.updateMyUserData({ onboarding_completed: true });
      saveOnboardingCompletedLocally();
      toast.success('Preferences saved!', {
        description: (
          <span className="text-slate-600 dark:text-slate-400 text-xs font-medium block mt-0.5">
            Your personalized study plan is being generated.
          </span>
        ),
      });
      goNext();
    } catch (retryError) {
      console.error('Retry also failed:', retryError);
      toast.error('Update conflict', {
        description: 'Profile update conflict. Please refresh the page and try again.',
      });
    }
  };

  const submitData = async () => {
    setIsLoading(true);
    try {
      const updatePayload = buildOnboardingPayload(formData);
      console.info('Saving onboarding preferences:', updatePayload);

      const updatedUser = await User.updateMyUserData(updatePayload);
      saveOnboardingCompletedLocally();
      triggerBackgroundPathGeneration(updatedUser);

      toast.success('Preferences saved!', {
        description: (
          <span className="text-slate-600 dark:text-slate-400 text-xs font-medium block mt-0.5">
            Your personalized study plan is being generated.
          </span>
        ),
      });

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
    } catch (error) {
      console.error('Onboarding save error:', error);

      const { title, message } = getErrorMessage(error);
      if (message === 'CONFLICT') {
        await handleOnboardingConflict();
      } else {
        toast.error(title, { description: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const finishOnboarding = () => {
    navigate(createPageUrl('Dashboard'));
  };

  const skipOnboarding = async () => {
    setIsLoading(true);
    try {
      await User.updateMyUserData({
        onboarding_completed: true,
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

  const stepVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
  };

  const renderStepContent = () => {
    const stepId = steps[currentStep]?.id;

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
        return <CompleteStep targetBandScore={formData.target_band_score} />;
      default:
        return null;
    }
  };

  const StepIcon = steps[currentStep]?.icon || Brain;

  if (isCheckingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8fb] dark:bg-[#08080a]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#5a63df]/25 border-t-[#5a63df]" />
          <p className={cn(MICRO, MUTED)}>Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-y-auto bg-[#f8f8fb] p-4 pb-8 pt-16 dark:bg-[#08080a] sm:items-center sm:py-4">
      {/* Same dot-grid + glow language as every other authenticated page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 z-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.4),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.12),transparent_70%)]"
      />

      <div className={cn(PANEL, 'relative z-10 w-full max-w-xl overflow-hidden')}>
        {/* Step rail — one segment per step, filled up to the current one. A
            plain percentage bar doesn't tell you how many steps remain; six
            discrete segments do at a glance. */}
        <div className="flex gap-1 p-4 pb-0 sm:p-6 sm:pb-0">
          {steps.map((step, index) => (
            <span
              key={step.id}
              aria-hidden="true"
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                index <= currentStep ? 'bg-[#5a63df]' : 'bg-[#eceafa] dark:bg-white/[0.07]'
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between px-4 pt-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <IconChip icon={StepIcon} tone="accent" size="md" />
            <span className={cn(MICRO, MUTED)}>
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          {currentStep < steps.length - 1 && (
            <button
              type="button"
              onClick={skipOnboarding}
              disabled={isLoading}
              className={cn(
                MICRO,
                'text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50 dark:text-slate-500 dark:hover:text-slate-300'
              )}
            >
              Skip for now
            </button>
          )}
        </div>

        <div className="px-4 pb-6 pt-3 sm:px-6 sm:pb-7">
          <div className="mb-4">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {steps[currentStep].title}
            </h1>
            <p className={cn('mt-1 text-[13px] font-medium', MUTED)}>
              {steps[currentStep].description}
            </p>
          </div>

          <div className="flex min-h-[220px] flex-col justify-center sm:min-h-[260px]">
            <AnimatePresence mode="wait" custom={direction}>
              <m.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full"
              >
                {renderStepContent()}
              </m.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-[#eceafa] pt-4 dark:border-white/[0.07] sm:flex-row">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={isLoading || currentStep === steps.length - 1}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-40 dark:text-slate-400 dark:hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className={cn(
                'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-7 text-sm font-bold text-white transition-all duration-150',
                'bg-[#5a63df] hover:bg-[#4a52c9] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
                'sm:w-auto'
              )}
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating plan…
                </>
              ) : currentStep === steps.length - 1 ? (
                'Finish'
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
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
