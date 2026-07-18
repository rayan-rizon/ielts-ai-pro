import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles, Target, LineChart, Star } from 'lucide-react';
import { GlassPanel, SoftSection } from './LandingSection';

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
    detail: 'Track progress and reach your band with confidence.',
    colorClass:
      'text-blue-600 bg-blue-500/5 border-blue-500/15 dark:text-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20',
  },
];

const learners = [
  'https://i.pravatar.cc/100?img=33',
  'https://i.pravatar.cc/100?img=47',
  'https://i.pravatar.cc/100?img=12',
  'https://i.pravatar.cc/100?img=32',
];

export default function CTABanner({ handlePrimaryCta, viewport }) {
  const reduceMotion = useReducedMotion();

  return (
    <SoftSection className="py-8 md:py-10 lg:py-12">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-5 md:px-8">
        <m.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassPanel className="relative overflow-hidden rounded-[24px] border-slate-200/90 dark:border-white/10 px-5 py-6 text-left sm:px-7 sm:py-8 md:rounded-[32px] md:px-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[#c9f6ea]/45 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-36 right-[8%] h-[28rem] w-[28rem] rounded-full bg-[#ced4ff]/55 blur-[100px]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.3),transparent_48%,rgba(130,112,255,.05))]" />

            <div className="relative z-10 grid h-full items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12 xl:gap-16">
              {/* Left Column: Heading, Subheading, and Benefits */}
              <div className="space-y-5">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#ddd8ff] bg-gradient-to-r from-[#f1edff]/90 to-white/75 px-4 py-1.5 text-[11px] font-extrabold text-[#4f35d8] shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:from-violet-400/10 dark:to-white/5 dark:text-violet-200">
                    <Sparkles className="h-3.5 w-3.5" /> Take the Next Step
                  </span>

                  <h2 className="mt-4 text-balance text-[clamp(2rem,3.2vw,3.2rem)] font-black leading-[1.02] tracking-[-0.055em] text-[#07142f] dark:text-white">
                    <span className="block">Your Best IELTS Score is</span>
                    <span className="relative inline-block font-handwritten mt-2 bg-gradient-to-r from-[#a456ef] via-[#6951ed] to-[#3e70f3] bg-clip-text pb-2.5 text-[1.02em] leading-[1.08] tracking-[-0.025em] text-transparent">
                      One Click Away!
                      <svg
                        className="absolute bottom-0 left-0 w-full h-3 text-[#7384f8]"
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
                </div>

                <p className="max-w-2xl text-[15px] font-semibold leading-6 text-[#26344f] dark:text-slate-200">
                  Join thousands of learners who are improving every day with AI-powered practice
                  and expert feedback.
                </p>

                {/* Benefits List */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/50 dark:border-white/5">
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
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-sm mt-0.5 ${colorClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-[#15213a] dark:text-white leading-snug">
                          {label}
                        </h4>
                        <p className="mt-1 text-xs text-[#667287] dark:text-slate-400 font-medium leading-relaxed">
                          {detail}
                        </p>
                      </div>
                    </m.div>
                  ))}
                </div>
              </div>

              {/* Right Column: CTA Action Card */}
              <m.div
                animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative flex justify-center lg:justify-end"
              >
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="group relative block w-full max-w-[290px] overflow-hidden rounded-[24px] border border-slate-250 bg-white text-left shadow-[0_20px_45px_-10px_rgba(82,98,239,0.25)] dark:shadow-[0_25px_50px_-15px_rgba(0,0,0,0.6)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_50px_-8px_rgba(82,98,239,0.3)] hover:border-slate-350 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7664f2]/30 dark:border-white/15 dark:bg-[#0b0f19]"
                >
                  <span className="relative flex items-center justify-between overflow-hidden bg-gradient-to-br from-[#7638ea] via-[#6244ee] to-[#216ff0] px-5 py-5 text-white">
                    <span className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
                    <span className="relative z-10 pr-2">
                      <b className="block text-base font-black tracking-[-.035em] leading-tight">
                        Start Your Free <br /> Test
                      </b>
                      <span className="mt-2.5 block max-w-[12rem] text-[11px] leading-relaxed text-white/80 font-medium">
                        Get personalized feedback in just a few minutes.
                      </span>
                    </span>
                    <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#543ee4] shadow-md transition-transform duration-300 group-hover:translate-x-1.5">
                      <ArrowRight className="h-4.5 w-4.5" />
                    </span>
                  </span>

                  <span className="flex items-center gap-2.5 bg-slate-50/70 dark:bg-[#080c14] px-5 py-3 border-t border-slate-200/60 dark:border-white/10">
                    <span className="flex shrink-0 -space-x-2.5" aria-hidden="true">
                      {learners.map((avatar, index) => (
                        <img
                          key={index}
                          src={avatar}
                          alt={`Student ${index + 1}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm dark:border-[#1a1c31]"
                        />
                      ))}
                    </span>
                    <span className="text-[11px] font-bold leading-tight text-[#1b2841] dark:text-white">
                      Join 10,000+ successful learners
                    </span>
                  </span>
                </button>

                <Sparkles className="pointer-events-none absolute -right-2 -top-7 h-7 w-7 text-[#9c84ee] sm:-right-7 animate-pulse" />
                <Sparkles className="pointer-events-none absolute -right-4 top-24 h-5 w-5 text-[#b398f1] sm:-right-8 animate-pulse" />
              </m.div>
            </div>
          </GlassPanel>
        </m.div>
      </div>
    </SoftSection>
  );
}
