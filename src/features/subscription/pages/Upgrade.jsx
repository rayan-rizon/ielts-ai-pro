import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Check,
  Compass,
  Lock,
  PenTool,
  Sparkles,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';

const FEATURES = [
  {
    icon: Compass,
    tone: 'accent',
    title: 'Adaptive study roadmap',
    description: 'A step-by-step plan that adjusts automatically to your target exam date.',
    highlights: ['Fits your target exam date', '4 structured preparation stages'],
  },
  {
    icon: Target,
    tone: 'rose',
    title: 'Find weak question types',
    description:
      'See which IELTS formats are costing marks and which ones should be practised next.',
    highlights: ['Question-type ranking', 'Exact error drill-downs'],
  },
  {
    icon: Activity,
    tone: 'emerald',
    title: 'Advanced progress analytics',
    description:
      'Go beyond basic score history with readiness, criteria, and test-position analysis.',
    highlights: ['Readiness evidence', '90-day and all-time views'],
  },
  {
    icon: PenTool,
    tone: 'amber',
    title: 'Cambridge tests & AI scoring',
    description: 'Official Cambridge IELTS tests with instant AI scoring for Writing & Speaking.',
    highlights: ['Official Cambridge test bank', 'Instant essay evaluation'],
  },
];

/**
 * In-app upsell interstitial — the page a locked feature routes to before the
 * full plan comparison at /pricing. Kept short and specific to what the
 * learner just hit a wall on, rather than restating the whole pricing table.
 */
const Upgrade = () => {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-6 dark:bg-[#08080a] sm:px-4 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 mx-auto max-w-3xl"
      >
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <IconChip icon={Lock} tone="accent" size="md" />
            <Pill tone="accent">
              <Sparkles className="h-3 w-3" />
              Pro & Premium
            </Pill>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Upgrade your IELTS preparation
          </h1>
          <p className={cn('mx-auto mt-2 max-w-lg text-[13px] font-medium leading-relaxed', MUTED)}>
            Keep basic progress tracking free, then unlock unlimited AI assistance, deeper
            diagnosis, personalised next steps, and official Cambridge mock tests.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + index * 0.05, duration: 0.25 }}
              className={cn(
                PANEL,
                'flex flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12'
              )}
            >
              <IconChip icon={feature.icon} tone={feature.tone} size="md" />
              <h3 className="mt-3 text-[14px] font-extrabold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className={cn('mt-1 text-[12.5px] leading-relaxed', MUTED)}>
                {feature.description}
              </p>

              <div className="mt-3 space-y-1.5 border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
                {feature.highlights.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check
                      className="h-3 w-3 shrink-0 text-[rgb(var(--signal-ok))]"
                      strokeWidth={3}
                    />
                    <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.25 }}
          className={cn(TILE, 'mt-4 flex flex-col items-center gap-3 p-5 text-center sm:p-6')}
        >
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Ready to reach your target band?
          </h2>
          <p className={cn('max-w-sm text-[12.5px] leading-relaxed', MUTED)}>
            Compare plans and pick the one that fits your prep timeline.
          </p>

          <div className="flex w-full flex-col items-center gap-2.5 pt-1 sm:w-auto sm:flex-row">
            <Link
              to={createPageUrl('Pricing')}
              className={cn(
                MICRO,
                'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-7 text-white',
                'transition-all duration-150 hover:bg-[#4a52c9] active:scale-[0.99] sm:w-auto'
              )}
            >
              View plans & pricing
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to={createPageUrl('Dashboard')}
              className={cn(
                MICRO,
                'inline-flex h-11 w-full items-center justify-center rounded-lg px-6 text-slate-500',
                'transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white sm:w-auto'
              )}
            >
              Maybe later
            </Link>
          </div>
        </m.div>
      </m.div>
    </div>
  );
};

export default Upgrade;
