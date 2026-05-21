import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  BadgeCheck,
  BookOpen,
  Calendar,
  Clock,
  Crown,
  Flame,
  Headphones,
  Mic,
  PenTool,
  Target,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// All dashboard sub-components loaded as part of the Dashboard chunk.
// Dashboard itself is already route-level lazy-loaded from App.jsx,
// so these become a single download — no waterfall, no blank cards.
const WeeklyMomentumChart = React.lazy(() => import('../components/WeeklyMomentumChart'));
const SkillMapCard = React.lazy(() => import('../components/SkillMapCard'));

import DashboardSkeleton from '../components/DashboardSkeleton';
import HeroCard from '../components/HeroCard';
import ModuleCards from '../components/ModuleCards';
import useDashboardData from '../hooks/useDashboardData';
const EngagementWidget = React.lazy(() => import('../components/EngagementWidget'));
const AILearningPathCard = React.lazy(() => import('@/components/dashboard/AILearningPathCard'));
const PerformanceSummaryCard = React.lazy(() => import('../components/PerformanceSummaryCard'));
const WeakestLinkCard = React.lazy(() => import('../components/WeakestLinkCard'));
const OnboardingCard = React.lazy(() => import('../components/OnboardingCard'));
const CambridgeTestsCard = React.lazy(() => import('../components/CambridgeTestsCard'));
const StudyResourcesHub = React.lazy(() => import('../components/StudyResourcesHub'));
import { Suspense } from 'react';

// Optimized animation variants - use CSS transitions where possible
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } }, // Faster stagger for snappier load
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }, // Snappier duration
};

const statsContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};

// Module card config
const moduleCards = [
  {
    key: 'reading',
    title: 'Reading',
    description: 'Build speed and accuracy.',
    icon: BookOpen,
    href: createPageUrl('Reading'),
    gradient: 'from-blue-600 to-cyan-600',
  },
  {
    key: 'writing',
    title: 'Writing',
    description: 'Structure, coherence, band tactics.',
    icon: PenTool,
    href: createPageUrl('Writing'),
    gradient: 'from-orange-600 to-amber-600',
  },
  {
    key: 'listening',
    title: 'Listening',
    description: 'Train focus and note strategy.',
    icon: Headphones,
    href: createPageUrl('Listening'),
    gradient: 'from-violet-600 to-fuchsia-600',
  },
  {
    key: 'speaking',
    title: 'Speaking',
    description: 'Fluency, range, confidence.',
    icon: Mic,
    href: createPageUrl('Speaking'),
    gradient: 'from-rose-600 to-orange-600',
  },
];

function clamp01(value) {
  const n = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(1, n));
}

export default function Dashboard() {
  const { user: authUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    user,
    isLoading,
    recentTests,
    weeklyProgress,
    aiLoading,
    aiPath,
    aiTasks,
    aiFocus,
    aiProgress,
    aiFocusLoading,
    radarData,
    stats,
    cambridgeTests,
    weakestSkill,
    studyResources,
    resourcesLoading,
  } = useDashboardData(authUser, authLoading);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingHighlight, setOnboardingHighlight] = useState(null);

  const primaryActionsRef = useRef(null);
  const quickLaunchRef = useRef(null);
  const insightsRef = useRef(null);

  useEffect(() => {
    // Don't evaluate while still loading user data
    if (isLoading || !user) {
      return;
    }

    const dismissed = window.localStorage.getItem('dashboardV3:onboardingDismissed') === '1';

    // Check localStorage first for fast path (set by AuthContext on sign-in)
    const localOnboardingCompleted = window.localStorage.getItem('onboarding_completed') === 'true';

    // Redirect new users who haven't completed onboarding to the onboarding flow
    if (user?.onboarding_completed === false && !localOnboardingCompleted) {
      navigate('/onboarding', { replace: true });
      return;
    }

    // For the reminder card, we check if they have actual target data.
    // onboarding_completed flag just means they've seen/skipped the full-page onboarding.
    const hasTargetData = !!(user?.target_band_score && user?.test_date);

    // Only show Quick Start if not dismissed AND they don't have target data yet
    setShowOnboarding(!dismissed && !hasTargetData);
  }, [
    user?.onboarding_completed,
    user?.target_band_score,
    user?.test_date,
    isLoading,
    user,
    navigate,
  ]);

  useEffect(() => {
    if (!onboardingHighlight) return;
    const t = window.setTimeout(() => setOnboardingHighlight(null), 1600);
    return () => window.clearTimeout(t);
  }, [onboardingHighlight]);

  // Memoized calculations
  const progressToTarget = useMemo(() => {
    const avg = Number(stats.avgScore);
    const target = Number(stats.targetScore) || 7.0;
    if (!Number.isFinite(avg) || !Number.isFinite(target) || target <= 0) return 0;
    return clamp01(avg / target);
  }, [stats.avgScore, stats.targetScore]);

  const recommended = useMemo(() => {
    const entries = Object.entries(stats.moduleAverages || {});
    const available = entries.filter(([, v]) => Number.isFinite(v) && v > 0);
    const weakest = available.sort((a, b) => a[1] - b[1])[0]?.[0] || 'reading';
    return moduleCards.find((mod) => mod.key === weakest) || moduleCards[0];
  }, [stats.moduleAverages]);

  const daysToExam = useMemo(() => {
    if (!user?.test_date) return null;
    const target = new Date(user.test_date);
    if (Number.isNaN(target.getTime())) return null;
    const diff = target.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [user?.test_date]);

  const { dateLabel, greeting } = useMemo(() => {
    const now = new Date();
    const label = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const hour = now.getHours();
    const greet = 'Hi';
    return { dateLabel: label, greeting: greet };
  }, []);

  // Onboarding callbacks
  const onboardingFocusPrimary = useCallback(() => {
    primaryActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setOnboardingHighlight('primary');
  }, []);

  const onboardingFocusQuick = useCallback(() => {
    quickLaunchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setOnboardingHighlight('quick');
  }, []);

  const onboardingFocusInsights = useCallback(() => {
    insightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setOnboardingHighlight('insights');
  }, []);

  const onboardingSteps = useMemo(() => {
    const needsTarget = !user?.target_band_score;
    const needsDate = !user?.test_date;
    const needsFirstTest = (stats.totalTests || 0) === 0;
    return [
      {
        id: 'profile',
        title: needsTarget || needsDate ? 'Finish setup' : 'Profile ready',
        description:
          needsTarget || needsDate ? 'Set target band and exam date.' : 'Goals and date are set.',
        done: !needsTarget && !needsDate,
        href: createPageUrl('Onboarding'),
        focus: onboardingFocusPrimary,
      },
      {
        id: 'launch',
        title: needsFirstTest ? 'Take your first test' : 'Keep momentum',
        description: needsFirstTest
          ? 'Start with a quick Reading test.'
          : 'Launch a targeted session in one click.',
        done: !needsFirstTest,
        href: createPageUrl('Reading'),
        focus: onboardingFocusQuick,
      },
      {
        id: 'insights',
        title: 'See your plan',
        description: 'Use insights to pick the next best action.',
        done: false,
        href: createPageUrl('LearningPath'),
        focus: onboardingFocusInsights,
      },
    ];
  }, [
    stats.totalTests,
    user,
    onboardingFocusPrimary,
    onboardingFocusQuick,
    onboardingFocusInsights,
  ]);

  const dismissOnboarding = useCallback(() => {
    window.localStorage.setItem('dashboardV3:onboardingDismissed', '1');
    setShowOnboarding(false);
  }, []);

  if (isLoading) return <DashboardSkeleton data-oid=":binn6-" />;

  return (
    <div
      className="relative min-h-screen pb-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 transition-colors duration-500 overflow-hidden isolate"
      data-oid="ht.2yi4"
    >
      {/* Enhanced Premium Background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        data-oid="hskxaal"
      >
        {/* Multi-layered gradient mesh */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops)),rgba(99,102,241,0.12)_0%,transparent_40%),radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops)),rgba(168,85,247,0.08)_0%,transparent_40%),radial-gradient(ellipse_at_center,_var(--tw-gradient-stops)),rgba(59,130,246,0.06)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops)),rgba(99,102,241,0.2)_0%,transparent_40%),radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops)),rgba(168,85,247,0.15)_0%,transparent_40%),radial-gradient(ellipse_at_center,_var(--tw-gradient-stops)),rgba(59,130,246,0.1)_0%,transparent_50%)]"
          data-oid="45bv.q-"
        />

        {/* Enhanced grid pattern with perspective */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#6366f104_1px,transparent_1px),linear-gradient(to_bottom,#6366f104_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)]"
          data-oid="e1fr11u"
        />

        {/* Subtle animated gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 dark:to-black/10 animate-pulse"
          data-oid="7rth-uv"
        />
      </div>

      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 relative z-10"
        data-oid="sa9heal"
      >
        {/* Header */}
        <m.header variants={itemVariants} className="space-y-6" data-oid="-l:v0.c">
          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            data-oid="qqtbbbx"
          >
            <div className="flex-1" data-oid="1y.i40n">
              <div className="flex items-center gap-2" data-oid="ofvx95c">
                <Badge
                  variant="outline"
                  className="px-3 py-1 rounded-full bg-slate-500/5 dark:bg-slate-400/5 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm"
                  data-oid="vjkq9d_"
                >
                  {dateLabel}
                </Badge>
                {user?.subscription_tier === 'premium' ? (
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 backdrop-blur-md border border-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300"
                    data-oid="9tgmcle"
                  >
                    <Crown
                      className="w-3 h-3 fill-purple-600/20 dark:fill-purple-400/20"
                      data-oid="rx3ewwh"
                    />
                    PREMIUM
                  </Badge>
                ) : user?.subscription_tier === 'pro' ? (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300"
                    data-oid="pro-badge"
                  >
                    <Zap
                      className="w-3 h-3 fill-blue-600/20 dark:fill-blue-400/20"
                      data-oid="pro-icon"
                    />
                    PRO
                  </Badge>
                ) : null}
              </div>
              <h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3 leading-tight"
                data-oid="yxy9dml"
              >
                {greeting},{' '}
                <span className="text-indigo-600 dark:text-indigo-400" data-oid=".wf7_d9">
                  {user?.full_name?.split(' ')[0] || user?.username || 'Learner'}
                </span>{' '}
                👋
              </h1>
              <p
                className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-medium max-w-xl mt-2"
                data-oid="2wz92qz"
              >
                You're{' '}
                <span className="text-indigo-600 dark:text-indigo-400 font-bold" data-oid="n3ifs4w">
                  {progressToTarget * 100 === 0
                    ? 'just getting started'
                    : `${Math.round(progressToTarget * 100)}% of the way`}
                </span>{' '}
                {user?.target_band_score ? (
                  <>to your target band {user.target_band_score}.</>
                ) : (
                  <>on your IELTS success journey.</>
                )}
              </p>
            </div>

            <div
              className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4"
              data-oid="5idu9qr"
            >
              {/* Floating Stats Bar - Premium Design */}
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'grid grid-cols-2 md:flex md:flex-row items-center xl:items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-0 md:p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full xl:w-auto overflow-hidden',
                  'hover:border-indigo-500/30 dark:hover:border-indigo-500/40 transition-all duration-300'
                )}
                data-oid="_y7fk07"
              >
                {/* Streak */}
                <div
                  className="flex items-center gap-2 px-4 py-3 md:px-3 md:py-1 border-r border-b md:border-b-0 border-slate-100 dark:border-white/5"
                  data-oid="r3_nfnv"
                >
                  <div
                    className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-500/20"
                    data-oid=".6.5oe3"
                  >
                    <Flame
                      className="w-4.5 h-4.5 text-orange-700 dark:text-orange-300 fill-orange-500/30 dark:fill-orange-400/30"
                      data-oid="cp6oanu"
                    />
                  </div>
                  <div className="flex flex-col" data-oid="yrxhgsj">
                    <span
                      className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none"
                      data-oid="1nfohli"
                    >
                      Streak
                    </span>
                    <span
                      className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                      data-oid="n6u8r2o"
                    >
                      {stats.streak}{' '}
                      <span
                        className="text-xs text-slate-600 dark:text-slate-400 font-bold lowercase"
                        data-oid="28x:eto"
                      >
                        days
                      </span>
                    </span>
                  </div>
                </div>

                {/* Level / XP */}
                <div
                  className="flex items-center gap-2 px-4 py-3 md:px-3 md:py-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5"
                  data-oid="dlodwpk"
                >
                  <div
                    className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20"
                    data-oid="8x3rf_e"
                  >
                    <Crown
                      className="w-4.5 h-4.5 text-amber-700 dark:text-amber-300 fill-amber-500/30 dark:fill-amber-400/30"
                      data-oid="b2t20cy"
                    />
                  </div>
                  <div className="flex flex-col" data-oid="b-yf8th">
                    <div className="flex items-center gap-1.5" data-oid="zr:fgrw">
                      <span
                        className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none"
                        data-oid=":0d74a6"
                      >
                        Level {Math.floor((stats.totalTests || 0) / 5) + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1" data-oid="r8:50tr">
                      <span
                        className="text-base font-black text-slate-900 dark:text-white leading-none"
                        data-oid="wfoe.7k"
                      >
                        {stats.totalTests || 0}{' '}
                        <span
                          className="text-xs text-slate-600 dark:text-slate-400 font-bold lowercase"
                          data-oid="4ci-bcx"
                        >
                          XP
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Average */}
                <div
                  className="flex items-center gap-2 px-4 py-3 md:px-3 md:py-1 border-r border-slate-100 dark:border-white/5"
                  data-oid="rx1gh91"
                >
                  <div
                    className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20"
                    data-oid="s0dfo8u"
                  >
                    <BadgeCheck
                      className="w-4.5 h-4.5 text-blue-700 dark:text-blue-300 fill-blue-500/20 dark:fill-blue-400/20"
                      data-oid="ujrzpo0"
                    />
                  </div>
                  <div className="flex flex-col" data-oid="ejndc4c">
                    <span
                      className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none"
                      data-oid="z-oy4-q"
                    >
                      Current
                    </span>
                    <span
                      className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                      data-oid="mva1c3c"
                    >
                      {stats.avgScore}{' '}
                      <span
                        className="text-xs text-slate-600 dark:text-slate-400 font-bold lowercase"
                        data-oid="dltn9u7"
                      >
                        Avg
                      </span>
                    </span>
                  </div>
                </div>

                {/* Time Today */}
                <div
                  className="flex items-center gap-2 px-4 py-3 md:px-3 md:py-1"
                  data-oid="y8txs-."
                >
                  <div
                    className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20"
                    data-oid="sb3l:-5"
                  >
                    <Clock
                      className="w-4.5 h-4.5 text-indigo-700 dark:text-indigo-300"
                      data-oid="abn:a0g"
                    />
                  </div>
                  <div className="flex flex-col" data-oid="7xffhj3">
                    <span
                      className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none"
                      data-oid="h7jalz-"
                    >
                      Today
                    </span>
                    <span
                      className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                      data-oid="e1uebgw"
                    >
                      {stats.todayMinutes}{' '}
                      <span
                        className="text-xs text-slate-600 dark:text-slate-400 font-bold lowercase"
                        data-oid="xtgodfe"
                      >
                        min
                      </span>
                    </span>
                  </div>
                </div>
              </m.div>

              <Button
                asChild
                size="lg"
                className="rounded-full bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 px-8 h-12 border-0 shadow-lg dark:shadow-indigo-500/20 w-full md:w-auto xl:w-auto overflow-hidden group/btn relative"
                data-oid="7dk3o4t"
              >
                <Link to={recommended.href} data-oid="28az_6k">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]"
                    data-oid="20p9z4x"
                  />

                  <Zap className="w-4 h-4 mr-2 fill-current" data-oid="ixj0uso" />
                  <span className="font-black tracking-tight" data-oid="y34-n:g">
                    Resume {recommended.title}
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </m.header>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-12 gap-5 lg:gap-6 auto-rows-max" data-oid=":xn8rdp">
          {/* Row 1: Hero & Focus */}
          <div className="col-span-12 lg:col-span-8" data-oid="0rq3.ic">
            <m.div variants={itemVariants} data-oid="rcbo.47">
              <HeroCard
                recommended={recommended}
                progressToTarget={progressToTarget}
                stats={stats}
                data-oid="z.fqqs5"
              />
            </m.div>
          </div>

          <div className="col-span-12 lg:col-span-4" data-oid="u34ydy_">
            <div className="h-full" data-oid="rjpzhj8">
              <Suspense
                fallback={
                  <div className="h-full min-h-[300px] w-full bg-slate-100 dark:bg-slate-900/40 rounded-[2rem] animate-pulse" />
                }
              >
                <AILearningPathCard
                  focus={aiFocus}
                  progress={aiProgress}
                  isLoading={aiFocusLoading}
                  data-oid="j0q_txy"
                />
              </Suspense>
            </div>
          </div>

          {/* Row 2: Momentum & Skill Map */}
          <div className="col-span-12 lg:col-span-8" data-oid="mz2acx:">
            <m.div variants={itemVariants} className="h-full" data-oid="mjbybw-">
              <Suspense
                fallback={
                  <div className="h-[280px] w-full bg-slate-100 dark:bg-slate-900/40 rounded-[2rem] animate-pulse" />
                }
              >
                <WeeklyMomentumChart weeklyProgress={weeklyProgress} data-oid="321tcy3" />
              </Suspense>
            </m.div>
          </div>

          <div className="col-span-12 lg:col-span-4" data-oid="-c825t3">
            <m.div variants={itemVariants} className="h-full" data-oid="vxyymb5">
              <Suspense
                fallback={
                  <div className="h-[280px] w-full bg-slate-100 dark:bg-slate-900/40 rounded-[2rem] animate-pulse" />
                }
              >
                <SkillMapCard
                  radarData={radarData}
                  totalTests={stats.totalTests}
                  data-oid="i50m33k"
                />
              </Suspense>
            </m.div>
          </div>

          {/* Row 3: Module Launchpad, Performance & Milestones */}
          <div className="col-span-12 lg:col-span-5" data-oid="ns_cfji">
            <ModuleCards
              moduleCards={moduleCards}
              stats={stats}
              quickLaunchRef={quickLaunchRef}
              onboardingHighlight={onboardingHighlight}
              data-oid="csb:2u-"
            />
          </div>

          <div className="col-span-12 lg:col-span-4" data-oid="w93bdf-">
            <m.div
              variants={itemVariants}
              className="h-full [content-visibility:auto] [contain-intrinsic-size:auto_300px]"
              data-oid="-kckdv0"
            >
              <Suspense
                fallback={
                  <div className="h-full min-h-[300px] w-full bg-slate-100 dark:bg-slate-900/40 rounded-[2rem] animate-pulse" />
                }
              >
                <PerformanceSummaryCard
                  recentTests={recentTests}
                  stats={stats}
                  data-oid="943hwgk"
                />
              </Suspense>
            </m.div>
          </div>

          <div className="col-span-12 lg:col-span-3" data-oid="jrz27xx">
            <m.div
              variants={itemVariants}
              className="h-full [content-visibility:auto] [contain-intrinsic-size:auto_300px]"
              data-oid=":eke800"
            >
              <Suspense
                fallback={
                  <div className="h-full min-h-[300px] w-full bg-slate-100 dark:bg-slate-900/40 rounded-[2rem] animate-pulse" />
                }
              >
                <WeakestLinkCard weakestSkill={weakestSkill} data-oid="774s1u3" />
              </Suspense>
            </m.div>
          </div>

          {/* Row 4: Primary Training Section & Engagement */}
          <div className="col-span-12 lg:col-span-8 flex flex-col" data-oid="l1q5hg4">
            <m.div
              variants={itemVariants}
              className="flex-1 [content-visibility:auto] [contain-intrinsic-size:auto_400px]"
              data-oid="mpq:5vl"
            >
              <Suspense
                fallback={
                  <div className="h-full min-h-[400px] w-full bg-slate-100 dark:bg-slate-900/40 rounded-[2rem] animate-pulse" />
                }
              >
                <CambridgeTestsCard
                  cambridgeTests={cambridgeTests}
                  user={user}
                  data-oid="o_mq5hu"
                />
              </Suspense>
            </m.div>
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col" data-oid="e4osgw.">
            <div
              className="space-y-5 lg:space-y-6 flex-1 flex flex-col [content-visibility:auto] [contain-intrinsic-size:auto_400px]"
              data-oid="6e8qz4o"
            >
              {showOnboarding && (
                <Suspense
                  fallback={
                    <div className="h-full min-h-[200px] w-full bg-slate-100 dark:bg-slate-900/40 rounded-[2rem] animate-pulse" />
                  }
                >
                  <OnboardingCard
                    showOnboarding={showOnboarding}
                    onboardingSteps={onboardingSteps}
                    dismissOnboarding={dismissOnboarding}
                    onboardingHighlight={onboardingHighlight}
                    data-oid="3nv8lk7"
                  />
                </Suspense>
              )}
              <m.div variants={itemVariants} className="flex-1" data-oid="2z:3akc">
                <Suspense
                  fallback={
                    <div className="h-full min-h-[200px] w-full bg-slate-100 dark:bg-slate-900/40 rounded-[2rem] animate-pulse" />
                  }
                >
                  <EngagementWidget dailyActivity={stats.dailyActivity} data-oid="iicgew:" />
                </Suspense>
              </m.div>
            </div>
          </div>

          {/* Footer Activity - Full width secondary */}
          <div className="col-span-12" data-oid="nuweh2n">
            <m.div
              variants={itemVariants}
              className="[content-visibility:auto] [contain-intrinsic-size:auto_400px]"
              data-oid="ax3smkt"
            >
              <Suspense
                fallback={
                  <div className="h-full min-h-[400px] w-full bg-slate-100 dark:bg-slate-900/40 rounded-[2rem] animate-pulse" />
                }
              >
                <StudyResourcesHub
                  initialResources={studyResources}
                  isLoading={resourcesLoading}
                  data-oid="mqx1sgg"
                />
              </Suspense>
            </m.div>
          </div>
        </div>
      </m.div>
    </div>
  );
}
