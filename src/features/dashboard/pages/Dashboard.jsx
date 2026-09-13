import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { AlertTriangle, BookOpen, Headphones, Mic, PenTool } from 'lucide-react';
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
    return val >= 0;
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
    studyResources,
    resourcesLoading,
    hasError,
    retry,
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

  if (hasError) {
    return (
      <main className="grid min-h-full place-items-center bg-[#f8f8fb] px-4 py-16 text-slate-950 dark:bg-[#08080a] dark:text-white">
        <section className="w-full max-w-lg rounded-xl border border-rose-200 bg-white p-6 text-center dark:border-rose-400/20 dark:bg-[#18181c]">
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-600 dark:text-rose-300" />
          <h1 className="mt-3 text-lg font-extrabold">Dashboard data could not be loaded</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your saved results are unchanged. Retry before relying on the numbers shown here.
          </p>
          <button
            type="button"
            onClick={() => retry?.()}
            className="mt-4 h-9 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white hover:bg-[#4a52c9]"
          >
            Retry dashboard
          </button>
        </section>
      </main>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pb-10 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
        {/* Subtle dot grid runs the full page with zero heavy blur or neon washes */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.08] dark:opacity-[0.12]"
        />

        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-[1440px] space-y-4"
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
