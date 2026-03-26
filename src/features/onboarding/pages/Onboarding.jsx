import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addWeeks, addMonths } from 'date-fns';
import {
  CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Target,
  Brain,
  Clock,
  Sparkles,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  Rocket,
  Timer,
  Zap,
  CheckCircle2,
  Trophy,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { generateAdaptiveLearningPath } from '@/utils/api';
import { toast } from 'sonner';

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
    title: 'How many hours can you study weekly?',
    description: 'Be realistic — consistency beats intensity.',
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

// Module options for focus area
const modules = [
  {
    id: 'reading',
    label: 'Reading',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    description: 'Comprehension & speed',
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: PenTool,
    color: 'from-orange-500 to-amber-500',
    description: 'Essays & tasks',
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
    color: 'from-violet-500 to-purple-500',
    description: 'Audio & notes',
  },
  {
    id: 'speaking',
    label: 'Speaking',
    icon: Mic,
    color: 'from-rose-500 to-pink-500',
    description: 'Fluency & confidence',
  },
];

// Estimated timeline options
const timelineOptions = [
  { id: '2weeks', label: '2 Weeks', weeks: 2, description: 'Intensive prep' },
  { id: '1month', label: '1 Month', weeks: 4, description: 'Focused study' },
  { id: '2months', label: '2 Months', weeks: 8, description: 'Balanced pace' },
  { id: '3months', label: '3 Months', weeks: 12, description: 'Comprehensive' },
  { id: 'custom', label: 'Pick Date', weeks: 0, description: 'Choose exact date' },
];

// Study hours options
const studyHoursOptions = [
  { value: 5, label: '5 hrs', description: 'Light' },
  { value: 10, label: '10 hrs', description: 'Moderate' },
  { value: 15, label: '15 hrs', description: 'Dedicated' },
  { value: 20, label: '20+ hrs', description: 'Intensive' },
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
    study_hours_goal: 10,
    weak_area: null,
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    setIsCheckingStatus(true);
    try {
      // We no longer automatically redirect away from the onboarding page.
      // This allows users to re-enter the guided flow even if they skipped it initially.
      // The Login.jsx redirect will only send new users here.
    } catch (error) {
      console.warn('Failed to check onboarding status:', error); // If we can't verify, allow onboarding to proceed
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
      // Submitting data on the last input screen
      await submitData();
      goNext();
    } else if (currentStep === steps.length - 1) {
      // Final confirmation on the 'complete' screen
      finishOnboarding();
    } else {
      goNext();
    }
  };

  const submitData = async () => {
    setIsLoading(true);
    try {
      // Calculate actual test date from estimated weeks if needed
      let actualTestDate = formData.test_date;
      if (formData.timeline_type === 'estimated' && formData.estimated_weeks) {
        actualTestDate = addWeeks(new Date(), formData.estimated_weeks);
      }

      // Build the update payload - only include fields that have values
      const updatePayload = {
        onboarding_completed: true,
      };

      // Add optional fields only if they have values
      if (formData.target_band_score) {
        updatePayload.target_band_score = formData.target_band_score;
      }
      if (actualTestDate) {
        updatePayload.test_date = actualTestDate.toISOString();
      }
      if (formData.weak_area) {
        updatePayload.weak_area = formData.weak_area;
      }
      if (formData.study_hours_goal) {
        updatePayload.study_hours_goal = formData.study_hours_goal;
      }

      console.log('Saving onboarding preferences:', updatePayload);

      // Save User Preferences - the updateMyUserData handles both new and existing users
      const updatedUser = await User.updateMyUserData(updatePayload);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('onboarding_completed', 'true');
      }

      // Trigger AI Path Generation in background (completely optional)
      // Don't await this - let it run in background
      if (updatedUser?.id) {
        generateAdaptiveLearningPath().catch((pathError) => {
          // 403 = free tier user, path generation requires Pro — expected, not an error
          if (pathError?.status === 403) return;
          console.warn('AI path generation skipped (background):', pathError?.message || pathError);
        });
      }

      toast.success('Preferences saved!', {
        description: 'Your personalized study plan is being generated.',
      });
    } catch (error) {
      console.error('Onboarding save error:', error);
      console.error('Error details:', error?.message, error?.code, error?.details);

      // Provide more specific error messages
      let errorMessage = 'Could not save your preferences. Please try again.';
      let errorTitle = 'Error saving profile';

      if (
        error?.message?.includes('not logged in') ||
        error?.message?.includes('User not logged in')
      ) {
        errorMessage = 'Please log in again to continue.';
        errorTitle = 'Session expired';
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'Please check your internet connection and try again.';
        errorTitle = 'Connection error';
      } else if (error?.code === '42501' || error?.message?.includes('permission denied')) {
        errorMessage = 'Permission denied. Please try logging out and back in.';
        errorTitle = 'Access issue';
      } else if (
        error?.code === '23505' ||
        error?.message?.includes('unique constraint') ||
        error?.message?.includes('ON CONFLICT')
      ) {
        // Handle unique constraint violations - likely the profile already exists
        // Try to just update the onboarding flag
        try {
          await User.updateMyUserData({ onboarding_completed: true });
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('onboarding_completed', 'true');
          }
          toast.success('Preferences saved!', {
            description: 'Your personalized study plan is being generated.',
          });
          goNext();
          return;
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
          errorMessage = 'Profile update conflict. Please refresh the page and try again.';
          errorTitle = 'Update conflict';
        }
      } else if (error?.message) {
        // Show the actual error message for debugging
        errorMessage = error.message;
      }

      toast.error(errorTitle, { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const finishOnboarding = () => {
    navigate(createPageUrl('Dashboard'));
  };

  // Skip onboarding entirely - mark as completed with defaults
  const skipOnboarding = async () => {
    setIsLoading(true);
    try {
      // Just mark onboarding as completed with default values
      await User.updateMyUserData({
        onboarding_completed: true,
      });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('onboarding_completed', 'true');
      }
      toast.info('Onboarding skipped', {
        description: 'You can complete your profile later from the dashboard.',
      });
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Skip onboarding error:', error);
      // Even if saving fails, try to navigate to dashboard
      toast.warning('Could not save preferences, but continuing...');
      navigate(createPageUrl('Dashboard'));
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current step can proceed
  const canProceed = () => {
    switch (steps[currentStep]?.id) {
      case 'timeline':
        return formData.timeline_type === 'specific'
          ? !!formData.test_date
          : !!formData.estimated_weeks;
      case 'focus':
        return !!formData.weak_area;
      default:
        return true;
    }
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
        return (
          <div className="text-center space-y-5 py-4" data-oid="8mzhnvn">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto"
              data-oid="oc5mlwr"
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-primary/60 to-violet-500/60 rounded-[1.5rem] blur-2xl animate-pulse dark:from-primary/80 dark:to-violet-600/80"
                data-oid="k-q27.q"
              />

              <div
                className="relative w-full h-full bg-gradient-to-br from-primary via-indigo-600 to-violet-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-primary/40 border-2 border-white/30 dark:border-white/40"
                data-oid="r51jk_j"
              >
                <Sparkles
                  className="w-10 h-10 sm:w-16 sm:h-16 text-white drop-shadow-lg"
                  data-oid="9q:5zib"
                />

                {/* Decorative floating elements */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-3 -right-3 w-6 h-6 sm:w-8 sm:h-8 bg-white/20 dark:bg-white/30 backdrop-blur-md rounded-lg border-2 border-white/30 dark:border-white/40 flex items-center justify-center shadow-lg"
                  data-oid="bp_z7sa"
                >
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" data-oid="27bww:v" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute -bottom-2 -left-4 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 dark:bg-white/30 backdrop-blur-md rounded-xl border-2 border-white/30 dark:border-white/40 flex items-center justify-center shadow-lg"
                  data-oid="b.yzdcq"
                >
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" data-oid="opf5c:4" />
                </motion.div>
              </div>
            </motion.div>

            <div className="space-y-3 px-2 sm:px-6" data-oid="h2.gsll">
              <p
                className="text-base sm:text-lg font-medium text-foreground dark:text-white leading-relaxed balance"
                data-oid="q8tqi6f"
              >
                Get a{' '}
                <span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600 font-black dark:from-primary dark:to-violet-400"
                  data-oid="a090:_9"
                >
                  personalized AI study plan
                </span>{' '}
                tailored to your schedule and weaknesses.
              </p>

              <div className="flex flex-col items-center gap-2 pt-1" data-oid="hyt2jhz">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 dark:bg-primary/30 rounded-full border-2 border-primary/40 dark:border-primary/50 text-[9px] sm:text-[10px] font-black text-primary dark:text-white shadow-md tracking-wider uppercase"
                  data-oid="fldw6rv"
                >
                  <Timer
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary dark:text-white"
                    data-oid="hpyfne."
                  />
                  <span data-oid="f1xiza5">{'Prep time: < 2 mins'}</span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-2" data-oid="ymbj:z8">
                    {[1, 2, 3, 4].map((i) => (
                      <img
                        key={i}
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                        alt="User"
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background dark:border-slate-800 ring-2 ring-primary/10 dark:ring-primary/20 shadow-lg"
                        data-oid="08swkcd"
                      />
                    ))}
                    <div
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background dark:border-slate-800 bg-secondary dark:bg-slate-700 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-muted-foreground dark:text-white ring-2 ring-primary/10 dark:ring-primary/20"
                      data-oid="3-u0.8d"
                    >
                      +15k
                    </div>
                  </div>
                  <p
                    className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-muted-foreground/80 dark:text-slate-300"
                    data-oid="i8cl:4n"
                  >
                    Joined by 15k+ serious learners
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'target':
        return (
          <div className="space-y-10 py-6" data-oid="zf8dx6y">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center relative"
              data-oid="hjx0rp8"
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 blur-[60px] rounded-full -z-10"
                data-oid="_esz2b5"
              />

              <div className="relative inline-flex flex-col items-center" data-oid="gt:il:1">
                <div
                  className="text-7xl font-black bg-gradient-to-br from-primary via-indigo-500 to-violet-600 bg-clip-text text-transparent drop-shadow-sm dark:from-primary dark:via-indigo-400 dark:to-violet-400"
                  data-oid="p9fp_w1"
                >
                  {formData.target_band_score.toFixed(1)}
                </div>
                <Badge
                  variant="secondary"
                  className="mt-1 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-secondary/80 dark:bg-slate-700 text-foreground dark:text-white backdrop-blur-sm"
                  data-oid="hn-dpv5"
                >
                  Expert Target
                </Badge>
              </div>
            </motion.div>

            <div className="px-6 space-y-6" data-oid="-ywyw-b">
              <div className="relative pt-6" data-oid="-f3abe.">
                <Slider
                  defaultValue={[7.0]}
                  min={4.0}
                  max={9.0}
                  step={0.5}
                  value={[formData.target_band_score]}
                  onValueChange={(val) => setFormData({ ...formData, target_band_score: val[0] })}
                  className="w-full relative z-10"
                  data-oid="gbef9yl"
                />
              </div>
              <div className="flex justify-between px-1" data-oid="h0tkkbv">
                {[4.0, 5.0, 6.0, 7.0, 8.0, 9.0].map((score) => (
                  <div key={score} className="flex flex-col items-center gap-2" data-oid="3iy-5t-">
                    <div
                      className={cn(
                        'w-1 h-1 rounded-full transition-all duration-300',
                        formData.target_band_score === score ? 'bg-primary scale-150' : 'bg-border'
                      )}
                      data-oid="5f2c28p"
                    />

                    <span
                      className={cn(
                        'text-[10px] transition-all duration-300 font-bold tracking-tighter',
                        formData.target_band_score === score
                          ? 'text-primary scale-125 dark:text-primary'
                          : 'text-muted-foreground dark:text-slate-400'
                      )}
                      data-oid="k0derq:"
                    >
                      {score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-start gap-3"
                data-oid="x4kg6by"
              >
                <div
                  className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
                  data-oid="yafxg_e"
                >
                  <Brain className="w-4 h-4 text-primary" data-oid="xseyjks" />
                </div>
                <p
                  className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed"
                  data-oid="odqck.w"
                >
                  Most Ivy League universities require a{' '}
                  <span className="text-foreground dark:text-white font-bold" data-oid="6sffuri">
                    7.5+
                  </span>
                  . We'll adjust your learning path to hit this mark.
                </p>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-8 py-4" data-oid="-x4dz-d">
            <div className="grid grid-cols-2 gap-4 px-2" data-oid="dh5yx7y">
              {timelineOptions.slice(0, 4).map((option) => {
                const isSelected =
                  formData.timeline_type === 'estimated' &&
                  formData.estimated_weeks === option.weeks;

                return (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        timeline_type: 'estimated',
                        estimated_weeks: option.weeks,
                        test_date: null,
                      });
                    }}
                    className={cn(
                      'relative p-4 rounded-[1.25rem] border-2 transition-all duration-300 text-left group overflow-hidden',
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xl shadow-primary/10'
                        : 'border-border bg-card/50 dark:bg-slate-800 dark:border-slate-700 hover:dark:bg-slate-800/80 hover:border-primary/40'
                    )}
                    data-oid="7v4s.mk"
                  >
                    <div className="relative z-10 flex flex-col h-full" data-oid="kx2vg5w">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all duration-300',
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-secondary dark:bg-white/10 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        )}
                        data-oid="f8z9rf_"
                      >
                        <Timer className="w-4 h-4" data-oid="zone9tj" />
                      </div>
                      <div
                        className={cn(
                          'text-base font-black tracking-tight mb-0.5',
                          isSelected
                            ? 'text-foreground dark:text-white'
                            : 'text-muted-foreground dark:text-slate-300 group-hover:text-foreground dark:group-hover:text-white'
                        )}
                        data-oid="m:2_p9z"
                      >
                        {option.label}
                      </div>
                      <div
                        className="text-[10px] text-muted-foreground dark:text-slate-400 font-medium"
                        data-oid="dmrfpgu"
                      >
                        {option.description}
                      </div>
                    </div>

                    {isSelected && (
                      <div
                        className="absolute top-4 right-4 animate-in zoom-in duration-300"
                        data-oid=":sebd-8"
                      >
                        <div
                          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          data-oid="3whk46n"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" data-oid=".42bl6i" />
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="px-2" data-oid="ts5xga2">
              <Button
                variant="outline"
                className={cn(
                  'w-full h-14 rounded-xl border-2 flex items-center justify-between px-5 transition-all duration-300',
                  formData.timeline_type === 'specific'
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 text-foreground ring-1 ring-primary/20'
                    : 'border-border bg-card/50 dark:bg-slate-800 dark:border-slate-700 hover:dark:bg-slate-800/80 hover:border-primary/40 text-muted-foreground dark:text-slate-300 hover:text-foreground'
                )}
                onClick={() => {
                  setFormData({
                    ...formData,
                    timeline_type: 'specific',
                    estimated_weeks: null,
                  });
                }}
                data-oid="2n7pke9"
              >
                <div className="flex items-center gap-3" data-oid="zf69p3p">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center',
                      formData.timeline_type === 'specific'
                        ? 'bg-primary text-white'
                        : 'bg-secondary dark:bg-white/10'
                    )}
                    data-oid="bnu9o16"
                  >
                    <CalendarIcon className="w-4 h-4" data-oid="etwv1ry" />
                  </div>
                  <div className="text-left" data-oid="4j0x7ru">
                    <div
                      className="text-sm font-black tracking-tight text-foreground dark:text-white"
                      data-oid="h7h6u4s"
                    >
                      Pick a specific date
                    </div>
                    <div
                      className="text-[10px] font-bold opacity-70 uppercase tracking-widest dark:text-slate-400"
                      data-oid="b:xz0n2"
                    >
                      For detailed scheduling
                    </div>
                  </div>
                </div>
                {formData.timeline_type === 'specific' && formData.test_date && (
                  <span
                    className="text-xs font-black bg-primary text-white px-3 py-1 rounded-full animate-in fade-in slide-in-from-right-4"
                    data-oid="oixg416"
                  >
                    {format(formData.test_date, 'MMM d, yyyy')}
                  </span>
                )}
                <ChevronRight
                  className={cn(
                    'w-5 h-5 transition-transform',
                    formData.timeline_type === 'specific' ? 'rotate-90 opacity-40' : 'opacity-20'
                  )}
                  data-oid="p9x802u"
                />
              </Button>
            </div>

            <AnimatePresence data-oid="5l.jo_o">
              {formData.timeline_type === 'specific' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col items-center pt-2 overflow-hidden"
                  data-oid="ev8m8vd"
                >
                  <div
                    className="p-1 bg-secondary/30 rounded-3xl border border-border/50 backdrop-blur-md"
                    data-oid=":hwolz6"
                  >
                    <Calendar
                      mode="single"
                      selected={formData.test_date}
                      onSelect={(date) => setFormData({ ...formData, test_date: date })}
                      disabled={(date) => date < new Date()}
                      className="rounded-2xl"
                      data-oid="3zu.i_9"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {formData.timeline_type === 'estimated' && formData.estimated_weeks && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground dark:text-slate-400 pt-4"
                data-oid="szi7:by"
              >
                Estimated exam date:{' '}
                <span className="text-foreground dark:text-white font-black" data-oid="z:ubbon">
                  {format(addWeeks(new Date(), formData.estimated_weeks), 'MMMM d, yyyy')}
                </span>
              </motion.div>
            )}

            <p
              className="text-xs text-muted-foreground dark:text-slate-400 text-center pt-2"
              data-oid="l7jp32d"
            >
              💡 Consistency beats intensity. Pick a timeline you can stick to.
            </p>
          </div>
        );

      case 'studyTime':
        return (
          <div className="space-y-10 py-4" data-oid="ufzb:o-">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center relative"
              data-oid="ps2-m-3"
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full -z-10"
                data-oid="p590iu-"
              />

              <div className="relative inline-flex flex-col items-center" data-oid="en:g_w_">
                <div
                  className="text-7xl font-black bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400"
                  data-oid="3m0.tb8"
                >
                  {formData.study_hours_goal}
                  <span className="text-2xl ml-1.5 opacity-80 dark:opacity-90" data-oid="hl--28:">
                    hrs
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="mt-1 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/30"
                  data-oid="h1sm:nb"
                >
                  Weekly Commitment
                </Badge>
              </div>
            </motion.div>

            <div className="grid grid-cols-4 gap-3 px-2" data-oid="mq6vi.5">
              {studyHoursOptions.map((option) => {
                const isSelected = formData.study_hours_goal === option.value;
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, study_hours_goal: option.value })}
                    className={cn(
                      'relative p-3 rounded-xl border-2 transition-all duration-300 text-center group bg-transparent overflow-hidden',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xl shadow-emerald-500/10'
                        : 'border-border bg-card/50 dark:bg-slate-800 dark:border-slate-700 hover:dark:bg-slate-800/80 hover:border-emerald-500/40'
                    )}
                    data-oid=".sg2kwu"
                  >
                    <div className="relative z-10" data-oid="vmta9sn">
                      <div
                        className={cn(
                          'text-xl font-black transition-colors mb-0.5',
                          isSelected
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-foreground/80 group-hover:text-emerald-500 dark:text-slate-300 dark:group-hover:text-emerald-400'
                        )}
                        data-oid="zj13ppr"
                      >
                        {option.value}
                      </div>
                      <div
                        className="text-[9px] font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-tight"
                        data-oid="_wqd5qy"
                      >
                        {option.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="px-6 space-y-4" data-oid="xzkvm-o">
              <Slider
                min={5}
                max={25}
                step={1}
                value={[formData.study_hours_goal]}
                onValueChange={(val) => setFormData({ ...formData, study_hours_goal: val[0] })}
                className="w-full"
                data-oid="v5:8xu:"
              />

              <div
                className="flex justify-between text-[10px] font-black text-muted-foreground dark:text-slate-400 uppercase tracking-widest px-1"
                data-oid="62du_ab"
              >
                <span data-oid="y0yr2e1">Steady</span>
                <span data-oid="4212tt0">Balanced</span>
                <span data-oid="rnnvmgn">Intensive</span>
              </div>
            </div>

            <div
              className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10 flex items-center gap-4 mx-2"
              data-oid="lc3.dai"
            >
              <div
                className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"
                data-oid="uco5glj"
              >
                <Trophy className="w-5 h-5 text-emerald-600" data-oid="5k9_j8s" />
              </div>
              <p
                className="text-xs text-muted-foreground dark:text-slate-400 leading-snug"
                data-oid="ahf6zfc"
              >
                Learners who commit to{' '}
                <span className="text-foreground dark:text-white font-bold" data-oid="kt838:r">
                  15+ hours
                </span>{' '}
                weekly are 3x more likely to reach Band 8.0.
              </p>
            </div>
          </div>
        );

      case 'focus':
        return (
          <div className="grid grid-cols-2 gap-4 py-4 px-2" data-oid="fqr1nxi">
            {modules.map((m) => {
              const Icon = m.icon;
              const isSelected = formData.weak_area === m.id;

              return (
                <motion.button
                  key={m.id}
                  onClick={() => setFormData({ ...formData, weak_area: m.id })}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'relative p-5 rounded-[1.5rem] border-2 text-left transition-all duration-500 group overflow-hidden h-36 flex flex-col justify-between',
                    isSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-2xl shadow-primary/20'
                      : 'border-border bg-card/40 dark:bg-slate-800 dark:border-slate-700 hover:dark:bg-slate-800/80 hover:border-primary/30 hover:bg-card/60'
                  )}
                  data-oid="7zfq8kj"
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-500',
                      isSelected
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-secondary dark:bg-white/10 group-hover:bg-primary/10 group-hover:text-primary'
                    )}
                    data-oid="7agspu."
                  >
                    <Icon className="w-5 h-5" data-oid="0p2o-bs" />
                  </div>

                  <div data-oid="as._o2p">
                    <div
                      className={cn(
                        'text-lg font-black tracking-tight transition-colors duration-300',
                        isSelected
                          ? 'text-foreground dark:text-white'
                          : 'text-muted-foreground dark:text-slate-300 group-hover:text-foreground dark:group-hover:text-white'
                      )}
                      data-oid="1ghgppn"
                    >
                      {m.label}
                    </div>
                    <div
                      className="text-[10px] font-bold text-muted-foreground/60 dark:text-slate-400 uppercase tracking-widest leading-none mt-1"
                      data-oid="5dpeqb6"
                    >
                      {m.description}
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="focus-check"
                      className="absolute top-6 right-6"
                      data-oid="9ignol1"
                    >
                      <div
                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        data-oid="gqz2pg7"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" data-oid="vhhbvuy" />
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-10 py-10" data-oid="g36r_4y">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative w-32 h-32 mx-auto"
              data-oid="dzju5wb"
            >
              <div
                className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full animate-pulse"
                data-oid="377f25r"
              />

              <div
                className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-4 border-white/20"
                data-oid="rppej60"
              >
                <Rocket className="w-14 h-14 text-white" data-oid="fm:c_5v" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-3 -right-3 w-10 h-10 bg-amber-500 rounded-xl shadow-lg border-2 border-white flex items-center justify-center"
                data-oid="dik0yyx"
              >
                <Star className="w-5 h-5 text-white fill-white" data-oid="sde2p95" />
              </motion.div>
            </motion.div>

            <div className="space-y-3" data-oid="aekf2j7">
              <h3
                className="text-3xl font-black tracking-tighter text-foreground dark:text-white"
                data-oid="s8x9znw"
              >
                You're All Set!
              </h3>
              <p
                className="text-muted-foreground dark:text-slate-300 text-base px-8 leading-snug"
                data-oid="ly-4cjt"
              >
                Your personalized path to{' '}
                <span
                  className="text-foreground dark:text-white font-black underline decoration-primary decoration-4"
                  data-oid=":k9yeoo"
                >
                  Band {formData.target_band_score.toFixed(1)}
                </span>{' '}
                is ready. Let's make it happen.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const StepIcon = steps[currentStep]?.icon || Brain;

  // Show loading while checking onboarding status
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
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/20 flex items-center justify-center p-4 relative overflow-hidden"
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

        <CardContent className="px-4 sm:px-8 pb-4 sm:pb-6 pt-2" data-oid="mqkrm2y">
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
            className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"
            data-oid="cw.jk3p"
          >
            {
              currentStep > 0 ? (
                <Button
                  variant="ghost"
                  onClick={goBack}
                  disabled={isLoading || currentStep === steps.length - 1}
                  className="gap-2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-secondary/80 dark:hover:bg-slate-800 transition-all font-semibold"
                  data-oid=".hqw.mw"
                >
                  <ChevronLeft className="w-4 h-4" data-oid="06h_scg" />
                  Back
                </Button>
              ) : (
                <div data-oid="4zf6a21" />
              )

              // Spacetime placeholder
            }

            <div className="flex items-center gap-2" data-oid="6j3trvp">
              {currentStep < steps.length - 1 && (
                <Button
                  variant="ghost"
                  onClick={skipOnboarding}
                  className="text-muted-foreground dark:text-slate-400 mr-2 font-bold hover:text-foreground dark:hover:text-white hover:bg-secondary/50 dark:hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
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
                className="rounded-xl px-8 shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-white font-bold"
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
