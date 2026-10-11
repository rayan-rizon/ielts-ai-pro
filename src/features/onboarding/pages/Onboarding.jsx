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
import { MICRO, MUTED, NUM, PANEL } from '@/features/dashboard/components/primitives';
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
import OnboardingHeading from '@/features/onboarding/components/OnboardingHeading';
import '../onboarding.css';

// Step configurations. Question steps share one heading shape: a short
// eyebrow, a title whose closing phrase carries the accent, and one line of
// supporting copy. Welcome and the plan screen render their own.
const steps = [
  {
    id: 'welcome',
    title: 'Welcome to IELTS Ai Pro',
    icon: Brain,
  },
  {
    id: 'target',
    eyebrow: 'Your goal',
    title: 'What band score',
    accent: 'are you aiming for?',
    description: 'We pace your practice and feedback toward this score.',
    icon: Target,
  },
  {
    id: 'timeline',
    eyebrow: 'Exam date',
    title: 'When is your',
    accent: 'IELTS test?',
    description: 'Tap your booked date, or estimate — the plan counts down to it.',
    icon: CalendarIcon,
  },
  {
    id: 'studyTime',
    eyebrow: 'Weekly rhythm',
    title: 'How much time can you',
    accent: 'study each week?',
    description: 'We fit sessions to the days you choose.',
    icon: Clock,
  },
  {
    id: 'focus',
    eyebrow: 'Starting point',
    title: 'Which skill should we',
    accent: 'start with?',
    description: 'Pick a starting point. Your practice results refine it from there.',
    icon: Zap,
  },
  {
    id: 'complete',
    title: 'Your personalized plan',
    icon: Rocket,
  },
];

const QUESTION_COUNT = steps.filter((step) => step.eyebrow).length;
const EASE_OUT = [0.22, 1, 0.36, 1];

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.32, ease: EASE_OUT } },
  exit: (dir) => ({
    x: dir > 0 ? -20 : 20,
    opacity: 0,
    transition: { duration: 0.16, ease: EASE_OUT },
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

  const trackPlanOfferViewed = useCallback(() => {
    void recordOnboardingOffer('offer_seen');
    trackAuthenticatedAppEvent(
      'onboarding_plan_offer_viewed',
      { target_band_score: formData.target_band_score, weak_area: formData.weak_area },
      user
    );
  }, [formData.target_band_score, formData.weak_area, user]);

  const openSubscriptionPlans = (tier = 'pro', interval = 'monthly') => {
    void recordOnboardingOffer('plan_clicked', tier);
    const selection = { plan_tier: tier, billing_interval: interval };
    trackAuthenticatedAppEvent('onboarding_plan_selected', selection, user);
    const params = new URLSearchParams({
      plan: tier,
      interval,
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
        return <WelcomeStep onStart={handleNext} isLoading={isLoading} />;
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
            currentTier={user?.subscription_tier || null}
            onUpgrade={openSubscriptionPlans}
            onContinue={finishOnboarding}
            onPlanOfferViewed={trackPlanOfferViewed}
          />
        );
      default:
        return null;
    }
  };

  const headingRef = useRef(null);
  const bodyRef = useRef(null);
  const pageRef = useRef(null);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    // The plan screen grows past the viewport, so the app's own scroll
    // container must start at the top too, not where the last step left it.
    pageRef.current?.scrollIntoView?.({ block: 'start' });
    headingRef.current?.focus({ preventScroll: true });
  }, [currentStep]);

  const stepConfig = steps[currentStep];
  const isLastQuestion = steps[currentStep + 1]?.id === 'complete';

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
    <div className="onboarding-page" ref={pageRef}>
      <section
        className={cn(PANEL, 'onboarding-frame', `onboarding-frame--${stepConfig.id}`)}
        aria-label="Personalize your IELTS practice"
      >
        <header className="onboarding-header">
          <Logo size="md" animated={false} />
          <div
            className="onboarding-progress"
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={currentStep + 1}
            aria-valuetext={`Step ${currentStep + 1} of ${steps.length}`}
          >
            <div className="onboarding-progress__rail" aria-hidden="true">
              {steps.map((step, index) => (
                <span
                  key={step.id}
                  className={cn(
                    index < currentStep && 'is-complete',
                    index === currentStep && 'is-current'
                  )}
                />
              ))}
            </div>
            <span className={cn(NUM, 'onboarding-progress__count')}>
              {stepConfig.eyebrow ? (
                <>
                  {String(currentStep).padStart(2, '0')}
                  <span className="opacity-50"> / {String(QUESTION_COUNT).padStart(2, '0')}</span>
                </>
              ) : currentStep === 0 ? (
                'Start'
              ) : (
                'Ready'
              )}
            </span>
          </div>
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={skipOnboarding}
              disabled={isLoading}
              className="onboarding-skip"
            >
              Skip for now
            </button>
          ) : (
            <span className="onboarding-skip-placeholder" />
          )}
        </header>

        <div className="onboarding-body" ref={bodyRef}>
          <AnimatePresence
            mode="wait"
            custom={direction}
            initial={false}
            onExitComplete={() => {
              headingRef.current?.focus({ preventScroll: true });
            }}
          >
            <m.div
              key={stepConfig.id}
              custom={direction}
              variants={stepVariants}
              initial={reduceMotion ? { opacity: 0 } : 'enter'}
              animate={reduceMotion ? { opacity: 1 } : 'center'}
              exit={reduceMotion ? { opacity: 0 } : 'exit'}
              transition={reduceMotion ? { duration: 0.1 } : undefined}
              onAnimationComplete={() => {
                bodyRef.current?.scrollTo({ top: 0 });
                window.scrollTo({ top: 0 });
                headingRef.current?.focus({ preventScroll: true });
              }}
              className={cn('onboarding-step', `onboarding-step--${stepConfig.id}`)}
            >
              <div
                ref={headingRef}
                tabIndex={-1}
                className="onboarding-step-heading"
                aria-label={stepConfig.eyebrow ? undefined : stepConfig.title}
              >
                {stepConfig.eyebrow && (
                  <OnboardingHeading
                    step={currentStep}
                    eyebrow={stepConfig.eyebrow}
                    title={stepConfig.title}
                    accent={stepConfig.accent}
                    description={stepConfig.description}
                  />
                )}
              </div>
              {renderStepContent(steps[currentStep].id)}
            </m.div>
          </AnimatePresence>
        </div>

        {currentStep > 0 && (
          <footer className="onboarding-footer">
            <button type="button" onClick={goBack} disabled={isLoading} className="onboarding-back">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" /> Back
            </button>
            {currentStep < steps.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="onboarding-primary"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{' '}
                    Saving preferences…
                  </>
                ) : (
                  <>
                    {isLastQuestion ? 'See my plan' : 'Continue'}
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </footer>
        )}
      </section>
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
