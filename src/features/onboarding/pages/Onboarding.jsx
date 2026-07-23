import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackAppEvent } from '@/lib/tracking';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { createPageUrl } from '@/utils';
import { generateAdaptiveLearningPath } from '@/utils/api';
import { toast } from 'sonner';
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

      trackAppEvent('onboarding_completed', {
        target_band_score: formData.target_band_score,
        weak_area: formData.weak_area,
        study_hours_goal: formData.study_hours_goal,
        has_test_date: !!(formData.test_date || formData.estimated_weeks),
      });
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
      <div
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/20 flex items-center justify-center"
        data-oid="tasraut"
      >
        <div className="text-center space-y-4" data-oid=".bepr3z">
          <div
            className="w-12 h-12 mx-auto border-4 border-primary/30 border-t-primary rounded-full animate-spin"
            data-oid="95lmq19"
          />
          <p className="text-muted-foreground" data-oid="lq0pz8c">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/20 flex items-start sm:items-center justify-center p-4 pt-16 pb-8 sm:py-4 relative overflow-y-auto"
      data-oid=":mui1d4"
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" data-oid="6nf1ex9">
        <div
          className="absolute top-[-20%] left-[-10%] w-[60rem] h-[60rem] rounded-full bg-primary/5 blur-[120px]"
          data-oid=":.va2gg"
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50rem] h-[50rem] rounded-full bg-violet-500/5 blur-[120px]"
          data-oid="ir:4v7s"
        />
      </div>

      <Card
        className="w-full max-w-xl relative z-10 shadow-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden"
        data-oid="ia3ge0f"
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 w-full" data-oid="wsoeduj">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-violet-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            data-oid="he83hba"
          />
        </div>

        {/* Step indicator */}
        <div
          className="px-4 sm:px-8 pt-4 sm:pt-6 pb-2 flex items-center justify-between"
          data-oid="fau3crn"
        >
          <div className="flex items-center gap-3" data-oid="r6uj4un">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center"
              data-oid="9hsnwbn"
            >
              <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" data-oid="5zdz3xy" />
            </div>
            <div data-oid="8he7spd">
              <div
                className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-400 font-medium uppercase tracking-wider"
                data-oid="ibcc962"
              >
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8 pt-2" data-oid="mqkrm2y">
          <div className="mb-4" data-oid=":6odu3j">
            <h1
              className="text-xl font-black tracking-tight mb-1 text-foreground dark:text-white"
              data-oid="6n:j:1i"
            >
              {steps[currentStep].title}
            </h1>
            <p
              className="text-sm text-muted-foreground dark:text-slate-300 font-medium"
              data-oid="jxfmair"
            >
              {steps[currentStep].description}
            </p>
          </div>

          <div
            className="min-h-[200px] sm:min-h-[260px] flex flex-col justify-center"
            data-oid="uruh-9o"
          >
            <AnimatePresence mode="wait" custom={direction} data-oid="6blz-2r">
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full"
                data-oid="bdstzta"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"
            data-oid="cw.jk3p"
          >
            {currentStep > 0 ? (
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={isLoading || currentStep === steps.length - 1}
                className="gap-2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-secondary/80 dark:hover:bg-slate-800 transition-all font-semibold px-2 sm:px-4"
                data-oid=".hqw.mw"
              >
                <ChevronLeft className="w-4 h-4" data-oid="06h_scg" />
                Back
              </Button>
            ) : (
              <div data-oid="4zf6a21" />
            )}

            <div
              className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start"
              data-oid="6j3trvp"
            >
              {currentStep < steps.length - 1 && (
                <Button
                  variant="ghost"
                  onClick={skipOnboarding}
                  className="text-muted-foreground dark:text-slate-400 font-bold hover:text-foreground dark:hover:text-white hover:bg-secondary/50 dark:hover:bg-slate-800 transition-all text-[10px] uppercase tracking-widest px-2"
                  disabled={isLoading}
                  data-oid="gfe4zem"
                >
                  Skip for now
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                size="lg"
                className="rounded-xl px-6 sm:px-8 shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-white font-bold h-10 sm:h-12 text-sm sm:text-base"
                data-oid="xj:91xs"
              >
                {isLoading ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      data-oid="a-9:ia:"
                    />
                    Creating Plan...
                  </>
                ) : currentStep === steps.length - 1 ? (
                  'Finish'
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4" data-oid="9qcooki" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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
