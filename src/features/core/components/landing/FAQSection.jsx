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
  Star,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GlassPanel, SoftSection } from './LandingSection';

const learners = [
  'https://i.pravatar.cc/100?img=33',
  'https://i.pravatar.cc/100?img=47',
  'https://i.pravatar.cc/100?img=12',
  'https://i.pravatar.cc/100?img=32',
];

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

function TrustedLearnersCard() {
  return (
    <GlassPanel className="relative overflow-hidden rounded-[28px] p-6 sm:p-7">
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[#d7d2ff]/55 blur-3xl" />
      <div className="relative z-10 flex items-center gap-3 text-sm font-extrabold text-[#0f172a] dark:text-violet-200">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e6fcf5] text-[#0ca678] dark:bg-emerald-400/15 dark:text-emerald-400">
          <Globe className="h-5 w-5" />
        </span>
        Trusted by IELTS Learners Worldwide
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-2 divide-x divide-[#dfe4ef] dark:divide-white/10">
        <div className="pr-5">
          <b className="block text-3xl font-black tracking-[-.04em] text-[#0f172a] dark:text-white">
            10,000+
          </b>
          <span className="mt-1 block text-xs font-bold text-[#64748b] dark:text-slate-400">
            Active Learners
          </span>
        </div>
        <div className="pl-6">
          <b className="block text-3xl font-black tracking-[-.04em] text-[#0f172a] dark:text-white">
            4.9/5
          </b>
          <div className="mt-1 flex gap-0.5 text-[#f5b82e]" aria-label="4.9 out of 5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <span className="mt-1 block text-xs font-bold text-[#64748b] dark:text-slate-400">
            Average Rating
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-7 flex items-center gap-4">
        <span className="flex shrink-0 -space-x-2.5" aria-hidden="true">
          {learners.map((avatar, index) => (
            <img
              key={index}
              src={avatar}
              alt={`Student ${index + 1}`}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm dark:border-[#15182a]"
            />
          ))}
          <span className="flex h-10 min-w-10 items-center justify-center rounded-full border-2 border-white bg-[#f0edff] px-2 text-[11px] font-black text-[#5140db] dark:border-[#15182a]">
            10K+
          </span>
        </span>
        <span className="text-xs font-bold leading-5 text-[#556277] dark:text-slate-300">
          Learners achieving their dream band scores
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
    <SoftSection id="faq" className="scroll-mt-24 py-16 md:py-24" data-oid="_3z_paz">
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
