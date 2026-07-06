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

        {/* Enhanced grid pattern with top-fading radial mask */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]"
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
