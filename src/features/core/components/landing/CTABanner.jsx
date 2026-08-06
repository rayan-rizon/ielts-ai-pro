import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles, Target, LineChart, Star, Check } from 'lucide-react';
import { GlassPanel, SoftSection } from './LandingSection';
import SkillBadgeStack from './SkillBadgeStack';

const benefits = [
  {
    icon: Target,
    label: 'Set Your Goal',
    detail: 'Tell us your target band score.',
    colorClass:
      'text-violet-600 bg-violet-500/5 border-violet-500/15 dark:text-violet-300 dark:bg-violet-500/10 dark:border-violet-500/20',
  },
  {
    icon: LineChart,
    label: 'Practice Smart',
    detail: 'Get AI feedback and improve faster.',
    colorClass:
      'text-emerald-600 bg-emerald-500/5 border-emerald-500/15 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20',
  },
  {
    icon: Star,
    label: 'Achieve More',
    detail: 'Track progress and reach your band.',
    colorClass:
      'text-blue-600 bg-blue-500/5 border-blue-500/15 dark:text-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20',
  },
];

function CTABannerHeader() {
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-linear-to-r/srgb from-violet-100/90 to-indigo-50/80 px-3.5 py-1 text-[11px] font-extrabold text-violet-700 shadow-xs backdrop-blur-xl dark:border-violet-400/30 dark:from-violet-500/20 dark:to-indigo-500/15 dark:text-violet-200 dark:shadow-[0_0_15px_rgba(167,139,250,0.15)]">
        <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" /> Take the Next Step
      </span>

      <h2 className="mt-3.5 text-balance text-[clamp(1.85rem,3vw,3rem)] font-black leading-[1.05] tracking-tight text-slate-900 dark:text-white">
        <span>Your Best IELTS Score is </span>
        <span className="relative inline-block font-handwritten bg-linear-to-r/srgb from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-[1.02em] leading-[1.08] tracking-tight text-transparent">
          One Click Away!
          <svg
            className="absolute bottom-0 left-0 w-full h-2.5 text-violet-500 dark:text-violet-300"
            viewBox="0 0 200 10"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M2 3C60 7 140 7 198 3"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </h2>

      <p className="mt-2.5 max-w-xl text-sm sm:text-[15px] font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
        Join thousands of learners improving every day with AI-powered practice and expert feedback.
      </p>
    </div>
  );
}

function CTABannerBenefits({ reduceMotion, viewport }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 border-t border-slate-200/60 dark:border-white/10">
      {benefits.map(({ icon: Icon, label, detail, colorClass }, index) => (
        <m.div
          key={label}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ delay: 0.12 + index * 0.07, duration: 0.4 }}
          className="flex items-start gap-2.5 text-left"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-xs mt-0.5 ${colorClass}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {label}
            </h4>
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
              {detail}
            </p>
          </div>
        </m.div>
      ))}
    </div>
  );
}

function CTABannerActionCard({ handlePrimaryCta, reduceMotion }) {
  return (
    <m.div
      animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className="relative flex justify-center lg:justify-end"
    >
      <button
        type="button"
        onClick={handlePrimaryCta}
        className="group relative block w-full max-w-full sm:max-w-[350px] lg:max-w-[365px] overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-violet-400/25 bg-white dark:bg-[#131315] text-left shadow-[0_20px_45px_-10px_rgba(82,98,239,0.22)] dark:shadow-none transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_50px_-8px_rgba(82,98,239,0.35)] dark:hover:shadow-sm hover:border-slate-300 dark:hover:border-violet-400/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7664f2]/30 transform-gpu"
      >
        <span className="relative flex items-center justify-between overflow-hidden bg-[#6256ef] px-5 sm:px-6 py-5 text-white">
          <span className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-white/15 blur-2xl" />

          <span className="relative z-10 pr-2 flex-1 space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-cyan-200 animate-pulse" /> Free Practice Included
            </span>
            <div>
              <b className="block text-lg font-black tracking-[-.03em] leading-tight">
                Start Your Free Test
              </b>
              <span className="mt-1 block text-xs leading-relaxed text-white/90 font-medium">
                Get fast, criterion-based Writing and Speaking practice feedback.
              </span>
            </div>
            <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] font-bold text-white/90">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 backdrop-blur-sm">
                <Check className="w-3 h-3 text-cyan-300" /> Band 0-9 Estimate
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 backdrop-blur-sm">
                <Check className="w-3 h-3 text-cyan-300" /> No Card Needed
              </span>
            </div>
          </span>

          <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#543ee4] shadow-md transition-transform duration-300 group-hover:translate-x-1.5 ml-2">
            <ArrowRight className="h-5 w-5" />
          </span>
        </span>

        <span className="flex items-center gap-3 bg-slate-50 dark:bg-[#131315] px-5 sm:px-6 py-3 border-t border-slate-200/60 dark:border-white/10">
          <SkillBadgeStack size="sm" variant="avatars" />
          <span className="text-xs font-bold leading-tight text-slate-800 dark:text-white">
            Reading, Listening, Writing, and Speaking practice
          </span>
        </span>
      </button>

      <Sparkles className="pointer-events-none absolute -right-2 -top-5 h-6 w-6 text-purple-400 sm:-right-4 animate-pulse" />
    </m.div>
  );
}

export default function CTABanner({ handlePrimaryCta, viewport }) {
  const reduceMotion = useReducedMotion();

  return (
    <SoftSection className="bg-linear-to-b/srgb from-[#f4f7fc] to-[#eef2f8] dark:from-[#08080a] dark:to-[#08080a] py-8 md:py-12 lg:py-14">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-5 md:px-8">
        <m.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative overflow-hidden rounded-[24px] border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:to-[#131315] px-5 py-6 text-left sm:px-7 sm:py-7 md:rounded-[32px] md:px-8 lg:px-10 lg:py-8 shadow-2xl dark:shadow-none backdrop-blur-2xl dark:backdrop-blur-none">
            <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-indigo-400/20 dark:bg-[#5a63df]/10 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-36 right-[8%] h-112 w-112 rounded-full bg-purple-400/20 dark:bg-[#5a63df]/8 blur-[100px]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.3),transparent_48%,rgba(130,112,255,.05))] dark:bg-none" />

            <div className="relative z-10 grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 xl:gap-10">
              <div className="space-y-4">
                <CTABannerHeader />
                <CTABannerBenefits reduceMotion={reduceMotion} viewport={viewport} />
              </div>
              <CTABannerActionCard
                handlePrimaryCta={handlePrimaryCta}
                reduceMotion={reduceMotion}
              />
            </div>
          </div>
        </m.div>
      </div>
    </SoftSection>
  );
}
