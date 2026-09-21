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
import { WordByWordText } from '@/components/ui/word-by-word-text';

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

function TrustedLearnersCard() {
  return (
    <GlassPanel className="relative overflow-hidden isolate transform-gpu mask-[linear-gradient(white,white)] rounded-[22px] p-4 sm:p-4.5 border border-violet-200/80 bg-linear-to-br/srgb from-white via-violet-50/30 to-purple-50/40 dark:border-white/10 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:via-[#131315] dark:to-[#131315] shadow-[0_12px_32px_-15px_rgba(109,85,238,0.12)] dark:shadow-none backdrop-blur-xl dark:backdrop-blur-none transition-all duration-300 hover:border-violet-300 hover:shadow-[0_16px_38px_-12px_rgba(109,85,238,0.18)] dark:hover:border-violet-400/40">
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl dark:bg-[#5a63df]/10" />

      <div className="relative z-10 flex items-center gap-3">
        <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr/srgb from-[#6d55e8] to-[#8b5cf6] text-white shadow-sm shadow-violet-500/30 dark:shadow-none">
          <Globe className="h-4.5 w-4.5" />
        </span>
        <h4 className="text-xs sm:text-sm font-extrabold tracking-tight text-[#0f172a] dark:text-slate-100">
          IELTS Practice Across Four Skills
        </h4>
      </div>

      <div className="relative z-10 mt-3 grid grid-cols-2 gap-3 rounded-xl bg-white/90 dark:bg-white/4 p-2.5 px-3.5 border border-violet-100 dark:border-white/10 shadow-xs dark:shadow-none backdrop-blur-md dark:backdrop-blur-none">
        <div className="pr-2">
          <b className="block text-xl sm:text-2xl font-black tracking-tight text-[#6d55e8] dark:text-violet-300">
            Four
          </b>
          <span className="mt-0.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
            IELTS Skills
          </span>
        </div>
        <div className="pl-3.5 border-l border-violet-100 dark:border-violet-500/30">
          <b className="block text-xl sm:text-2xl font-black tracking-tight text-[#0f172a] dark:text-white">
            0–9
          </b>
          <span className="mt-0.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Estimated Band Scale
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-2.5 pt-0.5">
        <SkillBadgeStack size="sm" />
        <span className="text-[11px] font-semibold leading-tight text-slate-600 dark:text-slate-300">
          Build a routine around your target band and completed practice
        </span>
      </div>
    </GlassPanel>
  );
}

function StillNeedHelpCard({ handlePrimaryCta }) {
  return (
    <div className="relative pb-2">
      <GlassPanel className="relative overflow-hidden isolate rounded-[24px] border border-[#e2e5fa] bg-white/95 p-5 sm:p-6 pr-28 sm:pr-36 shadow-[0_18px_45px_-22px_rgba(79,66,220,0.20)] backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:to-[#131315] dark:backdrop-blur-none">
        <div className="flex gap-4 items-start">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ded9ff] bg-[#f2f0ff] text-[#6256ef] shadow-sm dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300">
            <Headphones className="h-5.5 w-5.5 stroke-[2.2]" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#101836] dark:text-white">
              Still need help?
            </h3>
            <p className="mt-0.5 text-xs sm:text-[13px] font-medium text-[#56617f] dark:text-slate-400">
              Our support team is just a message away.
            </p>
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="mt-3.5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#6256ef] hover:bg-[#5246e0] active:scale-[0.97] px-5 text-xs font-black text-white shadow-md shadow-[#6256ef]/25 transition-all duration-200 cursor-pointer"
            >
              <span>Contact Support</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Floating Tape Sticky Note */}
      <div className="absolute right-2 -bottom-1 sm:right-4 z-20 rotate-3 transition hover:rotate-0 duration-300 select-none">
        <div className="relative rounded-2xl border border-[#ded9ff] bg-linear-to-b/srgb from-[#f6f4ff] to-[#eae5ff] p-3 pb-3.5 shadow-lg shadow-[#6256ef]/15 dark:border-violet-500/30 dark:from-violet-950 dark:to-indigo-950 w-[112px] text-center">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-white/90 dark:bg-white/20 border border-black/5 rounded-xs rotate-1 shadow-2xs" />
          <span className="font-handwritten text-[12px] font-black text-[#5e50ee] dark:text-violet-200 block leading-tight">
            We&apos;re here for you! 💜
          </span>
        </div>
        <svg
          className="absolute -left-9 -bottom-6 w-14 h-10 text-[#6256ef]/40 dark:text-violet-400/50 hidden sm:block"
          fill="none"
          viewBox="0 0 50 30"
        >
          <path
            d="M10 5 C 25 25, 45 25, 45 25"
            stroke="currentColor"
            strokeWidth="1.75"
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
      className="group overflow-hidden rounded-[20px] border border-[#e1e5f1] bg-white/72 px-5 shadow-[0_16px_45px_-34px_rgba(38,50,105,.6)] backdrop-blur-2xl transition-all duration-300 data-[state=open]:border-[#bdb7ff] data-[state=open]:bg-white/82 dark:border-white/10 dark:bg-white/3 dark:backdrop-blur-none dark:hover:border-violet-500/30 dark:hover:bg-white/5 dark:data-[state=open]:border-violet-500/40 dark:data-[state=open]:bg-white/6 dark:data-[state=open]:shadow-none sm:px-6"
    >
      <AccordionTrigger className="group py-5 text-left text-[15px] font-extrabold tracking-[-.02em] text-[#14213b] hover:no-underline dark:text-slate-100 sm:text-base [&>svg]:text-[#938fe3] dark:[&>svg]:text-violet-400">
        <span className="flex items-center gap-4 pr-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0edff] text-[#5d4fe5] dark:bg-violet-500/20 dark:text-violet-300 dark:border dark:border-violet-500/30 group-data-[state=open]:bg-[#5d4fe5] group-data-[state=open]:text-white dark:group-data-[state=open]:bg-violet-600 dark:group-data-[state=open]:text-white transition-colors duration-200">
            <Plus className="h-4 w-4 group-data-[state=open]:hidden" />
            <Minus className="hidden h-4 w-4 group-data-[state=open]:block" />
          </span>
          {faq.q}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-6 pl-13 pr-8 text-sm font-medium leading-7 text-[#5e6a7e] dark:text-slate-300 sm:text-[15px]">
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
      className="scroll-mt-24 bg-white dark:bg-[#08080a] py-16 md:py-24 relative overflow-hidden"
      data-oid="_3z_paz"
    >
      {/* Dark mode background glow accents */}
      <div className="pointer-events-none absolute left-1/4 top-1/3 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px] dark:block hidden dark:bg-[#5a63df]/10" />
      <div className="pointer-events-none absolute right-1/4 bottom-10 h-80 w-80 rounded-full bg-indigo-600/10 blur-[100px] dark:block hidden dark:bg-[#5a63df]/8" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5 md:px-8">
        <m.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          className="mb-12 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ded9ff] bg-[#f2f0ff]/75 px-5 py-2 text-xs font-black uppercase tracking-[.12em] text-[#5e50ee] shadow-[0_8px_24px_-8px_rgba(98,86,239,0.22)] backdrop-blur-md dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-200">
            <HelpCircle className="h-4 w-4 text-[#6256ef] dark:text-violet-300" /> FAQ
          </span>
        </m.div>

        <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 xl:gap-16">
          <m.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <h2 className="text-balance text-[clamp(2.45rem,4.2vw,4.1rem)] font-black leading-[1.02] tracking-tight text-[#07142f] dark:text-white">
              <WordByWordText text="Got Questions?" startIndex={0} /> <br />
              <WordByWordText text="We've Got" startIndex={2} /> <br />
              <span className="relative inline-block font-handwritten mt-1 pb-3.5 text-[0.8em] leading-[1.08] tracking-normal">
                <WordByWordText
                  text="Answers."
                  startIndex={4}
                  wordClassName="bg-linear-to-r/srgb from-[#4b72ee] via-[#5f55ee] to-[#8355e9] dark:from-indigo-400 dark:via-violet-400 dark:to-purple-300 bg-clip-text text-transparent"
                />
                <svg
                  className="animate-word-enter absolute bottom-0 left-0 w-full h-3 text-[#7790f5] dark:text-violet-400 opacity-80"
                  style={{ '--word-delay': '380ms' }}
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
              <span
                className="inline-block relative -top-5 ml-3 text-[#77d7c8] dark:text-teal-300"
                aria-hidden="true"
              >
                <svg
                  className="h-6 w-6 stroke-current fill-none"
                  viewBox="0 0 24 24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                >
                  <path d="M4 12h4M6 6l3 3M6 18l3-3" />
                </svg>
              </span>
            </h2>

            <m.p
              variants={reveal}
              className="mt-6 max-w-md text-[15px] font-medium leading-relaxed text-[#59657a] dark:text-slate-300"
            >
              Everything you need to know about IELTS Ai Pro—from features to plans. Can&apos;t find
              what you&apos;re looking for? We&apos;re here to help!
            </m.p>

            <m.div variants={reveal} className="mt-5">
              <TrustedLearnersCard />
            </m.div>

            <m.div variants={reveal} className="mt-4 relative">
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
            <Send className="ml-auto mt-5 h-9 w-9 -rotate-12 text-[#7bd6c7] dark:text-teal-300 opacity-85" />
          </m.div>
        </div>

        <Sparkles className="pointer-events-none absolute left-[42%] top-44 hidden h-7 w-7 text-[#77d7c8] dark:text-teal-300 opacity-80 lg:block" />
      </div>
    </SoftSection>
  );
}

export default memo(FAQSection);
