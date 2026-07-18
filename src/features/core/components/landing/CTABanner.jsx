import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, ChevronRight, Star } from 'lucide-react';
import { GlassPanel, SoftSection } from './LandingSection';
import DashboardMockup from './DashboardMockup';

const learners = [
  ['A', '#efb5aa'],
  ['R', '#75a9ed'],
  ['S', '#9c8de8'],
  ['K', '#62bc9d'],
];

export default function CTABanner({ handlePrimaryCta, handlePricing, viewport }) {
  const reduceMotion = useReducedMotion();
  return (
    <SoftSection className="py-12 md:py-16">
      <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassPanel className="relative overflow-hidden rounded-[32px] px-6 py-10 md:px-12 md:py-12 lg:px-14 lg:py-12 text-left">
            <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#bdf2e5]/40 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-32 right-[-3rem] h-96 w-96 rounded-full bg-[#cfd6ff]/50 blur-[90px]" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Column: Content */}
              <div className="lg:col-span-7 flex flex-col items-start">
                <div className="inline-flex items-center gap-3 rounded-full border border-white bg-white/65 px-4 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <div className="flex -space-x-2">
                    {learners.map(([letter, color]) => (
                      <span
                        key={letter}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white"
                        style={{ backgroundColor: color }}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#42506a] dark:text-slate-200">
                    Trusted by 10,000+ learners
                  </span>
                  <span className="hidden gap-0.5 text-amber-400 sm:flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                </div>

                <h2 className="mt-5 text-balance text-[clamp(2.1rem,4.5vw,3.6rem)] font-black leading-[1.02] tracking-[-.05em] text-[#07142f] dark:text-white">
                  Your target band is{' '}
                  <span
                    className="font-normal tracking-[-.035em] text-[#5262ef] block sm:inline-block"
                    style={{
                      fontFamily: "'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive",
                    }}
                  >
                    closer than you think.
                  </span>
                </h2>

                <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[#5b687d] dark:text-slate-300">
                  Start with a free band assessment, get clear AI feedback, and follow a plan built
                  around the score you want.
                </p>

                <div className="mt-6 flex flex-col items-center justify-start gap-3 sm:flex-row w-full sm:w-auto">
                  <button
                    onClick={handlePrimaryCta}
                    className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#2468ed] to-[#6658ef] px-6 text-xs font-extrabold text-white shadow-[0_12px_24px_-12px_rgba(61,83,225,.6)] transition hover:-translate-y-0.5 sm:w-auto"
                  >
                    Start free test <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handlePricing}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-[#d7dfed] bg-white/70 px-6 text-xs font-extrabold text-[#17233e] shadow-sm transition hover:-translate-y-0.5 hover:border-[#5262ef] dark:border-white/10 dark:bg-white/5 dark:text-white sm:w-auto"
                  >
                    Explore plans <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-start gap-x-5 gap-y-2 text-[10px] font-bold text-[#68758a]">
                  {['No credit card required', 'Instant band assessment', 'Cancel anytime'].map(
                    (item) => (
                      <span key={item} className="flex items-center gap-1.5">
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#e8f8f2] text-[#218b75]">
                          <Check className="h-2 w-2" />
                        </span>
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Right Column: Visual Mockup & Floating Card */}
              <div className="lg:col-span-5 relative w-full lg:flex items-center justify-center hidden">
                <div className="w-full max-w-[420px] scale-[0.82] xl:scale-[0.9] origin-right transition-transform duration-500 hover:scale-[0.85] xl:hover:scale-[0.93]">
                  <DashboardMockup />
                </div>

                <m.div
                  animate={reduceMotion ? {} : { y: [0, -6, 0], x: [0, 2, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -left-4 bottom-4 p-3 rounded-2xl bg-white/95 dark:bg-[#070b17]/95 border border-white/50 dark:border-white/10 shadow-xl backdrop-blur-md flex items-center gap-3 w-fit scale-[0.85]"
                >
                  <img
                    src="/ielts-hero-student.webp"
                    alt="Student practicing"
                    className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-inner"
                  />
                  <div>
                    <p className="text-[10px] font-black text-[#07142f] dark:text-white">Rayan</p>
                    <p className="text-[8px] font-bold text-emerald-500">Writing Band 8.0</p>
                  </div>
                </m.div>
              </div>
            </div>
          </GlassPanel>
        </m.div>
      </div>
    </SoftSection>
  );
}
