import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { BookOpen, Headphones, Mic, PenTool } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';

import DashboardSkeleton from '../components/DashboardSkeleton';
import DashboardHeader from '../components/DashboardHeader';
import DashboardGrid from '../components/DashboardGrid';
import useDashboardData from '../hooks/useDashboardData';
import useDashboardOnboarding from '../hooks/useDashboardOnboarding';

// Optimized animation variants - use CSS transitions where possible
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } }, // Faster stagger for snappier load
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

function calculateProgressToTarget(stats) {
  if (!stats) {
    return 0;
  }
  const avg = Number(stats.avgScore);
  let target = Number(stats.targetScore);
  if (!target) {
    target = 7.0;
  }

  const isAvgValid = Number.isFinite(avg);
  const isTargetValid = Number.isFinite(target);

  if (!isAvgValid) {
    return 0;
  }
  if (!isTargetValid) {
    return 0;
  }
  if (target <= 0) {
    return 0;
  }

  return clamp01(avg / target);
}

function determineRecommendedModule(stats) {
  if (!stats) {
    return moduleCards[0];
  }
  const moduleAverages = stats.moduleAverages;
  if (!moduleAverages) {
    return moduleCards[0];
  }

  const entries = Object.entries(moduleAverages);
  const available = entries.filter((item) => {
    const val = item[1];
    const isNumber = Number.isFinite(val);
    if (!isNumber) {
      return false;
    }
    return val > 0;
  });

  let weakest = 'reading';
  if (available.length > 0) {
    available.sort((a, b) => a[1] - b[1]);
    const firstItem = available[0];
    if (firstItem) {
      weakest = firstItem[0];
    }
  }

  const matched = moduleCards.find((mod) => mod.key === weakest);
  if (matched) {
    return matched;
  }
  return moduleCards[0];
}

export default function Dashboard() {
  const { user: authUser, loading: authLoading } = useAuth();
  const {
    user,
    isLoading,
    recentTests,
    weeklyProgress,
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

  const {
    showOnboarding,
    onboardingHighlight,
    onboardingSteps,
    dismissOnboarding,
    quickLaunchRef,
  } = useDashboardOnboarding(user, stats, isLoading);

  // Memoized calculations
  const progressToTarget = useMemo(() => calculateProgressToTarget(stats), [stats]);
  const recommended = useMemo(() => determineRecommendedModule(stats), [stats]);

  const { dateLabel, greeting } = useMemo(() => {
    const now = new Date();
    const label = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const greet = 'Hi';
    return { dateLabel: label, greeting: greet };
  }, []);

  if (isLoading) return <DashboardSkeleton data-oid=":binn6-" />;

  return (
    <div
      className="relative min-h-screen pb-14 bg-gradient-to-b from-[#f8f5fe]/80 via-[#fcfaff] to-white dark:from-[#0d091e] dark:via-[#090716] dark:to-[#070914] transition-colors duration-300 overflow-hidden isolate"
      data-oid="ht.2yi4"
    >
      {/* Performance-Optimized Ambient Background Glows */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden contain-strict"
        data-oid="hskxaal"
      >
        <div className="absolute -left-32 top-10 h-[32rem] w-[32rem] rounded-full bg-violet-200/20 blur-[120px] dark:bg-violet-600/10 transform-gpu" />
        <div className="absolute -right-32 top-1/4 h-[36rem] w-[36rem] rounded-full bg-purple-200/15 blur-[130px] dark:bg-purple-600/10 transform-gpu" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(109,85,238,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(109,85,238,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]"
          data-oid="e1fr11u"
        />
      </div>

      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-3.5 sm:p-5 md:p-6 lg:p-7 max-w-[1540px] mx-auto space-y-5 lg:space-y-6 relative z-10"
        data-oid="sa9heal"
      >
        {/* Header */}
        <DashboardHeader
          dateLabel={dateLabel}
          greeting={greeting}
          user={user}
          progressToTarget={progressToTarget}
          stats={stats}
          recommended={recommended}
        />

        <DashboardGrid
          user={user}
          recentTests={recentTests}
          weeklyProgress={weeklyProgress}
          aiFocus={aiFocus}
          aiProgress={aiProgress}
          aiFocusLoading={aiFocusLoading}
          radarData={radarData}
          stats={stats}
          cambridgeTests={cambridgeTests}
          weakestSkill={weakestSkill}
          studyResources={studyResources}
          resourcesLoading={resourcesLoading}
          recommended={recommended}
          progressToTarget={progressToTarget}
          showOnboarding={showOnboarding}
          onboardingSteps={onboardingSteps}
          dismissOnboarding={dismissOnboarding}
          onboardingHighlight={onboardingHighlight}
          quickLaunchRef={quickLaunchRef}
          moduleCards={moduleCards}
        />
      </m.div>
    </div>
  );
}
