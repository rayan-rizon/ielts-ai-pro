import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Lock,
  PenTool,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

const features = [
  {
    icon: Compass,
    title: 'Adaptive Study Roadmap',
    description:
      'A step-by-step IELTS study plan that automatically adjusts to your target exam date.',
    highlights: ['Fits your target exam date', '4 structured preparation phases'],
    tag: 'Stage 1 – 4',
    iconBg:
      'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 ring-1 ring-indigo-200/80 dark:ring-indigo-800/40',
    tagStyle:
      'bg-indigo-100/70 text-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40',
  },
  {
    icon: Target,
    title: 'Target Weak Question Types',
    description:
      'Detects the exact question types you get wrong and gives you focused practice to fix them.',
    highlights: ['Weakness pattern tracking', 'Focused recovery drills'],
    tag: 'Auto-Diagnostic',
    iconBg:
      'bg-rose-100/80 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-rose-200/80 dark:ring-rose-800/40',
    tagStyle:
      'bg-rose-100/70 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40',
  },
  {
    icon: Activity,
    title: 'Real Practice Score Level',
    description:
      'Calculates your true IELTS band score range from actual practice test performance.',
    highlights: ['Verified band score range', 'Proof of exam readiness'],
    tag: 'Verified Evidence',
    iconBg:
      'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-200/80 dark:ring-emerald-800/40',
    tagStyle:
      'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40',
  },
  {
    icon: PenTool,
    title: 'Cambridge Tests & AI Scoring',
    description:
      'Practice official Cambridge IELTS tests with instant AI band scores for Writing & Speaking.',
    highlights: ['Official Cambridge tests', 'Instant AI essay evaluation'],
    tag: 'Full Access',
    iconBg:
      'bg-amber-100/80 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 ring-1 ring-amber-200/80 dark:ring-amber-800/40',
    tagStyle:
      'bg-amber-100/70 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40',
  },
];

const Upgrade = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100/70 py-10 sm:py-14 dark:bg-slate-950">
      {/* Background glow accent */}
      <div
        className="pointer-events-none absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
        {/* Main Content Container Card */}
        <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-xl sm:p-9 dark:border-white/10 dark:bg-slate-900">
          {/* Header Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 text-center"
          >
            {/* Unified Hero Access Badge */}
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-indigo-100/90 bg-indigo-50/80 p-1.5 pr-4 shadow-sm backdrop-blur transition-transform duration-200 hover:scale-[1.02] dark:border-indigo-500/30 dark:bg-indigo-950/60">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900">
                  <Crown className="h-2 w-2 text-white" aria-hidden="true" />
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Sparkles
                  className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400"
                  aria-hidden="true"
                />
                Pro & Premium Access
              </span>
            </div>

            <h1 className="mb-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl dark:text-white">
              Unlock Your{' '}
              <span className="text-indigo-600 dark:text-indigo-400">AI Learning Path</span>
            </h1>
            <p className="mx-auto max-w-lg text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
              Get complete access to your personalized IELTS study roadmap, real-time readiness
              scoring, targeted weakness repair, and official Cambridge test evaluations.
            </p>
          </motion.div>

          {/* 4 Contrast Feature Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.06, duration: 0.3 }}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-slate-800/80 dark:hover:bg-slate-800"
              >
                <div>
                  <div className="mb-3.5 flex items-center justify-between">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs ${feature.iconBg}`}
                    >
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${feature.tagStyle}`}
                    >
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-950 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>

                  {/* Highlights List with Circular Check Icons */}
                  <div className="mt-4 space-y-2 border-t border-slate-200/80 pt-3 dark:border-white/10">
                    {feature.highlights.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Upgraded High-Impact CTA Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-6 text-center text-white shadow-xl sm:p-8"
          >
            {/* Background glow circle */}
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-3.5">
              <h2 className="text-xl font-black text-white sm:text-2xl">
                Ready to reach your target score?
              </h2>
              <p className="mx-auto max-w-md text-xs leading-relaxed text-indigo-200/90">
                Unlock your full AI study roadmap, adaptive practice, and instant score evaluations.
              </p>

              <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-11 w-full rounded-full bg-white px-8 text-xs font-black text-indigo-950 shadow-lg transition-all hover:bg-indigo-50 hover:scale-[1.02] active:scale-95 sm:w-auto border-0"
                >
                  <Link to={createPageUrl('Pricing')}>
                    <Sparkles className="mr-2 h-4 w-4 text-indigo-600" />
                    View Plans & Pricing
                    <ArrowRight className="ml-1.5 h-4 w-4 text-indigo-600" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-11 w-full rounded-full bg-white/10 px-6 text-xs font-bold text-white backdrop-blur transition-all hover:bg-white/20 sm:w-auto"
                >
                  <Link to={createPageUrl('Dashboard')}>Maybe Later</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-[11px] font-medium text-indigo-200/80">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Cancel anytime
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Instant access
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  24/7 AI coach
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
