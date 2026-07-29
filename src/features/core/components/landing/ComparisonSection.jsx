import React, { useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { Check, Sparkles, ArrowRight, Building2, Bot, X } from 'lucide-react';
import { SectionHeading, SoftSection } from './LandingSection';
import { cn } from '@/lib/cn';

const categories = [
  {
    feature: 'Official IELTS Rubric Alignment',
    traditional: 'Vague instructor notes',
    genericAi: 'No official band sub-scores',
    aiPro: 'Official band scores & criteria',
  },
  {
    feature: 'Speaking Pronunciation Analysis',
    traditional: 'Limited live feedback',
    genericAi: 'Text only (no voice checks)',
    aiPro: 'Instant pronunciation feedback',
  },
  {
    feature: 'Feedback Delivery Time',
    traditional: '2 to 5 days wait',
    genericAi: 'Instant basic text',
    aiPro: 'Instant detailed feedback',
  },
  {
    feature: 'Study Personalization',
    traditional: 'Same class for everyone',
    genericAi: 'Needs manual prompts',
    aiPro: 'Auto study plan for weak areas',
  },
  {
    feature: 'Monthly Pricing',
    traditional: '$150 – $400 / month',
    genericAi: 'Free to $20 / month',
    aiPro: 'Free plan / Pro from $9.99 / mo',
  },
];

const smoothLoop = { ease: [0.45, 0, 0.55, 1] };

function DesktopComparisonTable({ categoriesList, reduceMotion }) {
  return (
    <div className="overflow-x-auto scrollbar-none">
      <table className="w-full min-w-[680px] border-collapse text-left md:min-w-full">
        <thead>
          <tr className="border-b border-[#e9e7fa] bg-[#faf9ff]/80 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#737d9b] dark:border-white/10 dark:bg-slate-900/60">
            <th className="w-[28%] px-4 sm:px-6 py-4 font-black text-[#101836] dark:text-white">
              PLATFORM FEATURE
            </th>
            <th className="w-[24%] px-4 sm:px-6 py-4 font-bold text-[#56617f] dark:text-slate-300">
              TRADITIONAL CENTERS
            </th>
            <th className="w-[24%] px-4 sm:px-6 py-4 font-bold text-[#56617f] dark:text-slate-300">
              GENERIC AI (E.G. CHATGPT)
            </th>
            <th className="w-[24%] border-x border-[#ded9ff] bg-gradient-to-b from-[#f2f0ff] to-[#eae5ff]/60 px-4 sm:px-6 py-4 text-center dark:border-violet-500/20 dark:from-violet-950/50 dark:to-indigo-950/30">
              <div className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#ded9ff] bg-white px-3 py-1 text-xs font-black text-[#5e50ee] shadow-sm backdrop-blur-sm dark:border-violet-500/30 dark:bg-slate-900 dark:text-violet-300">
                <Sparkles className="h-3.5 w-3.5 text-[#6256ef] dark:text-violet-300" />
                IELTS AI PRO
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eeeafd] text-xs dark:divide-white/5">
          {categoriesList.map((item, idx) => (
            <m.tr
              key={item.feature}
              initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group/row transition-colors hover:bg-[#f6f4ff]/80 dark:hover:bg-violet-950/20"
            >
              <td className="px-4 sm:px-6 py-4 font-extrabold text-[#101836] text-xs sm:text-[13px] dark:text-white">
                {item.feature}
              </td>
              <td className="px-4 sm:px-6 py-4 text-[#56617f] font-medium text-[11.5px] sm:text-[12.5px] dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c8c5e6] shrink-0 dark:bg-slate-700" />
                  <span>{item.traditional}</span>
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4 text-[#56617f] font-medium text-[11.5px] sm:text-[12.5px] dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c8c5e6] shrink-0 dark:bg-slate-700" />
                  <span>{item.genericAi}</span>
                </div>
              </td>
              <td className="border-x border-[#ded9ff]/80 bg-[#f2f0ff]/40 px-4 sm:px-6 py-4 transition-colors group-hover/row:bg-[#eae5ff]/60 dark:border-violet-500/20 dark:bg-violet-950/20">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#6256ef] text-white shadow-2xs dark:bg-violet-500">
                    <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                  </span>
                  <span className="font-extrabold text-xs sm:text-[13px] text-[#101836] dark:text-white leading-snug">
                    {item.aiPro}
                  </span>
                </div>
              </td>
            </m.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileComparisonTable({ categoriesList, reduceMotion }) {
  const [compareTarget, setCompareTarget] = useState('traditional');

  return (
    <div className="md:hidden space-y-3 p-3 sm:p-4">
      {/* Segmented Control Toggle */}
      <div className="flex rounded-xl bg-[#f2f0ff] p-1 border border-[#ded9ff] dark:border-white/10 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setCompareTarget('traditional')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5',
            compareTarget === 'traditional'
              ? 'bg-white text-[#5e50ee] shadow-sm dark:bg-violet-950 dark:text-violet-300'
              : 'text-[#737d9b] hover:text-[#101836] dark:text-slate-400'
          )}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          vs Traditional
        </button>
        <button
          type="button"
          onClick={() => setCompareTarget('genericAi')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5',
            compareTarget === 'genericAi'
              ? 'bg-white text-[#5e50ee] shadow-sm dark:bg-violet-950 dark:text-violet-300'
              : 'text-[#737d9b] hover:text-[#101836] dark:text-slate-400'
          )}
        >
          <Bot className="w-3.5 h-3.5 shrink-0" />
          vs Generic AI
        </button>
      </div>

      {/* Head-to-Head Table */}
      <div className="rounded-2xl border border-[#ded9ff] bg-white overflow-hidden shadow-sm dark:border-white/10 dark:bg-slate-900">
        <table className="w-full text-left border-collapse text-[11.5px]">
          <thead>
            <tr className="border-b border-[#e9e7fa] bg-[#faf9ff] text-[10px] font-extrabold uppercase text-[#737d9b] tracking-wider dark:border-white/10 dark:bg-slate-950">
              <th className="py-3 px-3.5 w-[36%]">Feature</th>
              <th className="py-3 px-2.5 w-[32%] text-[#56617f]">
                {compareTarget === 'traditional' ? 'Traditional' : 'Generic AI'}
              </th>
              <th className="py-3 px-2.5 w-[32%] bg-[#f2f0ff] text-[#5e50ee] text-center font-black dark:bg-violet-950/40 dark:text-violet-300">
                IELTS AI PRO
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eeeafd] dark:divide-white/5">
            {categoriesList.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 px-3.5 font-extrabold text-[#101836] leading-tight dark:text-white">
                  {item.feature}
                </td>
                <td className="py-3 px-2.5 text-[#56617f] leading-tight font-medium dark:text-slate-400">
                  {compareTarget === 'traditional' ? item.traditional : item.genericAi}
                </td>
                <td className="py-3 px-2.5 bg-[#f2f0ff]/50 border-l border-[#ded9ff]/80 dark:bg-violet-950/20 dark:border-violet-500/20">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#6256ef] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span className="font-bold text-[#101836] leading-tight dark:text-white">
                      {item.aiPro}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparisonSection({ viewport, handlePrimaryCta }) {
  const reduceMotion = useReducedMotion();

  return (
    <SoftSection
      id="comparison"
      className="scroll-mt-24 py-16 lg:py-24 bg-[#faf9ff] dark:bg-[#070914] relative overflow-hidden"
    >
      <div className="relative z-10 mx-auto max-w-[1300px] px-5 md:px-8">
        <SectionHeading
          eyebrow="THE IELTS AI PRO ADVANTAGE"
          title="See how we stack up"
          script="against other options."
          description="Compare classroom feedback, generic AI tools, and criterion-based IELTS practice feedback."
          viewport={viewport}
        />

        {/* Main Comparison Card matching FeaturesSection cardClass styling */}
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 rounded-[26px] border border-[#e2e5fa] bg-white/95 shadow-[0_20px_50px_-25px_rgba(79,66,220,0.22)] backdrop-blur-md dark:border-white/10 dark:bg-[#0d1020]/95 overflow-hidden"
        >
          {/* Mobile View Toggle */}
          <MobileComparisonTable categoriesList={categories} reduceMotion={reduceMotion} />

          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block">
            <DesktopComparisonTable categoriesList={categories} reduceMotion={reduceMotion} />
          </div>
        </m.div>

        {/* Bottom CTA Callout Bar */}
        <m.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 rounded-[22px] border border-[#e2e5fa] bg-gradient-to-r from-white/95 via-[#faf9ff] to-[#f4f2ff] p-5 sm:p-6 shadow-[0_18px_40px_-22px_rgba(79,66,220,0.20)] backdrop-blur-md dark:border-white/10 dark:from-[#0d1020] dark:via-[#0a0c1a] dark:to-[#070914] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left justify-between"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ded9ff] bg-[#f2f0ff] text-[#6256ef] shadow-sm dark:border-violet-500/20 dark:bg-violet-950/60 dark:text-violet-300">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <b className="block text-base text-[#101836] font-black dark:text-white">
                Ready to make the switch?
              </b>
              <p className="mt-0.5 text-xs font-medium text-[#56617f] dark:text-slate-400">
                Try our free practice tools and get estimated IELTS band scores instantly.
              </p>
            </div>
          </div>

          {handlePrimaryCta && (
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#6256ef] hover:bg-[#5246e0] active:scale-[0.97] transition-all duration-200 text-white font-black text-xs px-6 py-3.5 shadow-md shadow-[#6256ef]/25 shrink-0 w-full sm:w-auto cursor-pointer"
            >
              <span>Start Free Test</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}
        </m.div>
      </div>
    </SoftSection>
  );
}
