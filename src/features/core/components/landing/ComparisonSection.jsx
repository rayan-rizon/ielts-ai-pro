import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Check, Sparkles, ArrowRight, Building2, Bot } from 'lucide-react';
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

function DesktopComparisonTable({ categoriesList }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[640px] md:min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="px-3 sm:px-5 md:px-6 py-3.5 sm:py-4 w-[28%] font-extrabold text-slate-900 dark:text-white">
              Platform Feature
            </th>
            <th className="px-3 sm:px-5 md:px-6 py-3.5 sm:py-4 w-[24%] font-bold text-slate-600 dark:text-slate-300">
              Traditional Centers
            </th>
            <th className="px-3 sm:px-5 md:px-6 py-3.5 sm:py-4 w-[24%] font-bold text-slate-600 dark:text-slate-300">
              Generic AI (e.g. ChatGPT)
            </th>
            <th className="px-3 sm:px-5 md:px-6 py-3.5 sm:py-4 w-[24%] bg-violet-50/80 dark:bg-violet-950/40 border-x border-violet-200/60 dark:border-violet-800/40 text-center">
              <div className="inline-flex items-center gap-1.5 text-[#6d55e8] dark:text-violet-300 font-extrabold text-[11px] sm:text-xs tracking-wider whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 text-[#6d55e8] dark:text-violet-300 shrink-0" />
                IELTS AI PRO
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {categoriesList.map((item, idx) => (
            <tr
              key={idx}
              className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
            >
              <td className="px-3 sm:px-5 md:px-6 py-3.5 sm:py-4 font-bold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                {item.feature}
              </td>
              <td className="px-3 sm:px-5 md:px-6 py-3.5 sm:py-4 text-slate-600 dark:text-slate-300 font-medium text-[11.5px] sm:text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                  <span>{item.traditional}</span>
                </div>
              </td>
              <td className="px-3 sm:px-5 md:px-6 py-3.5 sm:py-4 text-slate-600 dark:text-slate-300 font-medium text-[11.5px] sm:text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                  <span>{item.genericAi}</span>
                </div>
              </td>
              <td className="px-3 sm:px-5 md:px-6 py-3.5 sm:py-4 bg-violet-50/40 dark:bg-violet-950/20 border-x border-violet-100 dark:border-violet-900/30">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-violet-100 text-[#6d55e8] dark:bg-violet-900/60 dark:text-violet-300 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-white leading-snug">
                    {item.aiPro}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileComparisonTable({ categoriesList }) {
  const [compareTarget, setCompareTarget] = useState('traditional');

  return (
    <div className="md:hidden space-y-3 p-3">
      {/* Segmented Control Toggle */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setCompareTarget('traditional')}
          className={cn(
            'flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5',
            compareTarget === 'traditional'
              ? 'bg-white dark:bg-slate-900 text-[#6d55e8] dark:text-violet-300 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          vs Traditional
        </button>
        <button
          type="button"
          onClick={() => setCompareTarget('genericAi')}
          className={cn(
            'flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5',
            compareTarget === 'genericAi'
              ? 'bg-white dark:bg-slate-900 text-[#6d55e8] dark:text-violet-300 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Bot className="w-3.5 h-3.5 shrink-0" />
          vs Generic AI
        </button>
      </div>

      {/* Head-to-Head Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-[11.5px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              <th className="py-2.5 px-3 w-[36%]">Feature</th>
              <th className="py-2.5 px-2.5 w-[32%] text-slate-500">
                {compareTarget === 'traditional' ? 'Traditional' : 'Generic AI'}
              </th>
              <th className="py-2.5 px-2.5 w-[32%] bg-[#6d55e8]/10 dark:bg-[#6d55e8]/20 text-[#6d55e8] dark:text-violet-300 text-center font-black">
                IELTS AI PRO
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {categoriesList.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white leading-tight">
                  {item.feature}
                </td>
                <td className="py-2.5 px-2.5 text-slate-500 dark:text-slate-400 leading-tight font-medium">
                  {compareTarget === 'traditional' ? item.traditional : item.genericAi}
                </td>
                <td className="py-2.5 px-2.5 bg-[#6d55e8]/5 dark:bg-[#6d55e8]/10 border-l border-[#6d55e8]/15">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#6d55e8] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white leading-tight">
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
  return (
    <SoftSection
      id="comparison"
      className="scroll-mt-24 py-10 sm:py-16 md:py-20 bg-white dark:bg-[#070a16] relative overflow-hidden"
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 md:px-8">
        <SectionHeading
          eyebrow="The IELTS Ai Pro Advantage"
          title="See how we stack up"
          script="against other options."
          description="Compare classroom feedback, generic AI tools, and criterion-based IELTS practice feedback."
          viewport={viewport}
        />

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5 }}
          className="mt-6 sm:mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
        >
          {/* Mobile Comparison Table with Interactive Toggle */}
          <MobileComparisonTable categoriesList={categories} />

          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block">
            <DesktopComparisonTable categoriesList={categories} />
          </div>
        </m.div>

        {/* CTA banner below table */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          className="mt-5 sm:mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left justify-between"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#6d55e8]/10 text-[#6d55e8] dark:bg-[#6d55e8]/20 dark:text-violet-300 flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <b className="block text-sm text-slate-900 dark:text-white font-bold">
                Ready to make the switch?
              </b>
              <small className="text-slate-500 dark:text-slate-400 block text-xs">
                Try our free practice tools and get estimated IELTS band scores instantly.
              </small>
            </div>
          </div>
          {handlePrimaryCta && (
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#6d55e8] hover:bg-[#5b43d6] text-white font-bold text-xs px-5 py-2.5 transition duration-150 shrink-0 w-full sm:w-auto"
            >
              Start Free Test
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </m.div>
      </div>
    </SoftSection>
  );
}
