import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { BookOpen, Headphones, Mic, PenTool } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

import DashboardSkeleton from '../components/DashboardSkeleton';
import DashboardHeader from '../components/DashboardHeader';
import DashboardGrid from '../components/DashboardGrid';
import useDashboardData from '../hooks/useDashboardData';
import useDashboardOnboarding from '../hooks/useDashboardOnboarding';

// Matches the admin panel's stagger so both surfaces enter the same way.
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
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
    stats,
    cambridgeTests,
    weakestSkill,
    skillProficiency,
    vocabStats,
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
    <TooltipProvider delayDuration={150}>
      <main
        className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pb-10 text-slate-950 dark:bg-[#0b0a10] dark:text-white sm:px-4 md:px-5 md:py-5"
        data-oid="ht.2yi4"
      >
        {/* Dot grid runs the full page + two soft washes top-right / bottom-left for balance */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.5px,transparent_1.5px)] bg-[size:24px_24px] opacity-[0.12] dark:opacity-[0.16]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 -z-0 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.4),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.12),transparent_70%)]"
        />

        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-[1440px] space-y-4"
          data-oid="sa9heal"
        >
          {/* Header */}
          <DashboardHeader
            dateLabel={dateLabel}
            greeting={greeting}
            user={user}
            stats={stats}
            recommended={recommended}
          />

          <DashboardGrid
            user={user}
            recentTests={recentTests}
            weeklyProgress={weeklyProgress}
            aiFocus={aiFocus}
            stats={stats}
            cambridgeTests={cambridgeTests}
            weakestSkill={weakestSkill}
            skillProficiency={skillProficiency}
            vocabStats={vocabStats}
            studyResources={studyResources}
            resourcesLoading={resourcesLoading}
            recommended={recommended}
            showOnboarding={showOnboarding}
            onboardingSteps={onboardingSteps}
            dismissOnboarding={dismissOnboarding}
            onboardingHighlight={onboardingHighlight}
            quickLaunchRef={quickLaunchRef}
          />
        </m.div>
      </main>
    </TooltipProvider>
  );
}
