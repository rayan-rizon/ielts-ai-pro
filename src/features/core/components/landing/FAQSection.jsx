import React, { memo } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Globe,
  Headphones,
  HelpCircle,
  Minus,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GlassPanel, SoftSection } from './LandingSection';
import SkillBadgeStack from './SkillBadgeStack';

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

function TrustedLearnersCard() {
  return (
    <GlassPanel className="relative overflow-hidden rounded-[22px] p-4.5 sm:p-5 border border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-slate-900/85 shadow-[0_12px_35px_-12px_rgba(15,23,42,0.05)] dark:shadow-[0_15px_35px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-violet-300/50 dark:hover:border-violet-500/30">
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl dark:bg-violet-600/15" />

      <div className="relative z-10 flex items-center gap-2.5">
        <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/12 to-purple-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-300 shadow-2xs">
          <Globe className="h-4.5 w-4.5" />
        </span>
        <h4 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
          IELTS Practice Across Four Skills
        </h4>
      </div>

      <div className="relative z-10 mt-3.5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 p-3 py-2.5 border border-slate-200/60 dark:border-white/5">
        <div className="pr-2">
          <b className="block text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Four
          </b>
          <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            IELTS Skills
          </span>
        </div>
        <div className="pl-3.5 border-l border-slate-200/60 dark:border-white/10">
          <b className="block text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            0–9
          </b>
          <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Estimated Band Scale
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-3.5 flex items-center gap-3">
        <SkillBadgeStack size="sm" />
        <span className="text-[11px] font-semibold leading-snug text-slate-600 dark:text-slate-300">
          Build a routine around your target band and completed practice
        </span>
      </div>
    </GlassPanel>
  );
}

function StillNeedHelpCard({ handlePrimaryCta }) {
  return (
    <div className="mt-6 relative pb-4">
      <GlassPanel className="relative overflow-hidden rounded-[24px] p-6 pr-24 sm:pr-32 border border-[#d6ceff]/40 dark:border-violet-500/20">
        <div className="flex gap-4 items-start">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f0edff] text-[#5c4fe5] dark:bg-violet-400/15 dark:text-violet-200">
            <Headphones className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-[#0f172a] dark:text-white">
              Still need help?
            </h3>
            <p className="mt-1 text-xs font-medium text-[#64748b] dark:text-slate-400">
              Our support team is just a message away.
            </p>
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2468ed] to-[#6658ef] px-4 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5"
            >
              Contact Support <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Floating Tape Sticky Note */}
      <div className="absolute right-0 bottom-[-5px] sm:right-4 z-20 rotate-6 transition hover:rotate-2 duration-300 select-none">
        <div className="relative bg-[#ebe6ff] dark:bg-violet-950/80 p-4 pb-5 rounded-md shadow-lg border border-[#d6ceff]/50 w-[110px] text-center">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white/60 dark:bg-white/10 rounded-sm rotate-2 shadow-sm" />
          <span className="font-handwritten text-[13px] font-bold text-[#4c3de0] dark:text-violet-200 block leading-tight">
            We&apos;re here for you! 💜
          </span>
        </div>
        <svg
          className="absolute -left-10 -bottom-8 w-16 h-12 text-[#938fe3]/60 hidden sm:block"
          fill="none"
          viewBox="0 0 50 30"
        >
          <path
            d="M10 5 C 25 25, 45 25, 45 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function FAQAccordionItem({ faq, index }) {
  return (
    <AccordionItem
      value={`item-${index}`}
      className="group overflow-hidden rounded-[20px] border border-[#e1e5f1] bg-white/72 px-5 shadow-[0_16px_45px_-34px_rgba(38,50,105,.6)] backdrop-blur-2xl transition-colors data-[state=open]:border-[#bdb7ff] data-[state=open]:bg-white/82 dark:border-white/10 dark:bg-white/[.055] dark:data-[state=open]:border-violet-400/35 sm:px-6"
    >
      <AccordionTrigger className="group py-5 text-left text-[15px] font-extrabold tracking-[-.02em] text-[#14213b] hover:no-underline dark:text-white sm:text-base [&>svg]:text-[#938fe3]">
        <span className="flex items-center gap-4 pr-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0edff] text-[#5d4fe5] dark:bg-violet-400/15 dark:text-violet-200">
            <Plus className="h-4 w-4 group-data-[state=open]:hidden" />
            <Minus className="hidden h-4 w-4 group-data-[state=open]:block" />
          </span>
          {faq.q}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-6 pl-[3.25rem] pr-8 text-sm font-medium leading-7 text-[#5e6a7e] dark:text-slate-300 sm:text-[15px]">
        {faq.a}
      </AccordionContent>
    </AccordionItem>
  );
}

function FAQSection({ faqs, viewport, handlePrimaryCta }) {
  const reduceMotion = useReducedMotion();

  return (
    <SoftSection
      id="faq"
      className="scroll-mt-24 bg-white dark:bg-[#070a16] py-16 md:py-24"
      data-oid="_3z_paz"
    >
      <div className="relative z-10 mx-auto max-w-[1380px] px-5 md:px-8">
        <m.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          className="mb-12 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ddd8ff] bg-[#f1eeff]/90 px-5 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-[#503be1] shadow-sm dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
            <HelpCircle className="h-4 w-4" /> FAQ
          </span>
        </m.div>

        <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 xl:gap-16">
          <m.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            {/* Redesigned Title with Rays */}
            <m.h2
              variants={reveal}
              className="text-balance text-[clamp(2.45rem,4.2vw,4.1rem)] font-black leading-[1.02] tracking-[-.025em] text-[#07142f] dark:text-white"
            >
              Got Questions? <br />
              We&apos;ve Got <br />
              <span className="relative inline-block font-handwritten mt-1 bg-gradient-to-r from-[#4b72ee] via-[#5f55ee] to-[#8355e9] bg-clip-text pb-3.5 text-[0.8em] leading-[1.08] tracking-normal text-transparent">
                Answers.
                <svg
                  className="absolute bottom-0 left-0 w-full h-3 text-[#7790f5] opacity-80"
                  viewBox="0 0 200 10"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 3C60 7 140 7 198 3"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="inline-block relative -top-5 ml-3 text-[#77d7c8]" aria-hidden="true">
                <svg
                  className="h-6 w-6 stroke-current fill-none"
                  viewBox="0 0 24 24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                >
                  <path d="M4 12h4M6 6l3 3M6 18l3-3" />
                </svg>
              </span>
            </m.h2>

            <m.p
              variants={reveal}
              className="mt-6 max-w-md text-[15px] font-medium leading-relaxed text-[#59657a] dark:text-slate-300"
            >
              Everything you need to know about IELTS Ai Pro—from features to plans. Can&apos;t find
              what you&apos;re looking for? We&apos;re here to help!
            </m.p>

            <m.div variants={reveal} className="mt-8">
              <TrustedLearnersCard />
            </m.div>

            <m.div variants={reveal} className="mt-6 relative pb-4">
              <StillNeedHelpCard handlePrimaryCta={handlePrimaryCta} />
            </m.div>
          </m.div>

          <m.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          >
            <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
              {faqs.map((faq, index) => (
                <m.div key={faq.q} variants={reveal}>
                  <FAQAccordionItem faq={faq} index={index} />
                </m.div>
              ))}
            </Accordion>
            <Send className="ml-auto mt-5 h-9 w-9 -rotate-12 text-[#7bd6c7] opacity-75" />
          </m.div>
        </div>

        <Sparkles className="pointer-events-none absolute left-[42%] top-44 hidden h-7 w-7 text-[#77d7c8] opacity-70 lg:block" />
      </div>
    </SoftSection>
  );
}

export default memo(FAQSection);
