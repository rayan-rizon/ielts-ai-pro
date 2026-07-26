import React from 'react';
import { m } from 'framer-motion';
import { Check, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { SectionHeading, SoftSection } from './LandingSection';

const categories = [
  {
    feature: 'Official IELTS Rubric Alignment',
    traditional: 'Subjective / Vague feedback from instructors',
    genericAi: 'Unstructured text guesses (no official band sub-scores)',
    aiPro: 'Full evaluation across all 4 band criteria with sub-scores',
    status: 'pro-win',
  },
  {
    feature: 'Speaking Pronunciation Analysis',
    traditional: 'Limited live speaking feedback during class',
    genericAi: 'Text input only (no speech/pronunciation checks)',
    aiPro: 'Fluency, coherence, and acoustic pronunciation estimates',
    status: 'pro-win',
  },
  {
    feature: 'Feedback Delivery Time',
    traditional: '2 to 5 business days per essay/mock test',
    genericAi: 'Instant but generic text outputs',
    aiPro: 'Criterion-based corrections and practice band estimates',
    status: 'pro-win',
  },
  {
    feature: 'Study Personalization',
    traditional: 'Fixed schedule with standard class curriculum',
    genericAi: 'Static prompt replies (requires manual prompt building)',
    aiPro: 'Adaptive study plans customized to performance gaps',
    status: 'pro-win',
  },
  {
    feature: 'Monthly Pricing',
    traditional: '$150 – $400 / month (plus expensive textbook sets)',
    genericAi: 'Free to $20 / month',
    aiPro: 'Free plan available / Pro plan starts at $9.99 / month',
    status: 'pro-win',
  },
];

function ComparisonTable({ categoriesList }) {
  return (
    <table className="w-full min-w-[800px] border-collapse text-left">
      <thead>
        <tr className="border-b border-slate-200/60 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
          <th className="px-6 py-5 w-[25%] font-black">Platform feature</th>
          <th className="px-6 py-5 w-[25%] font-black">Traditional Centers</th>
          <th className="px-6 py-5 w-[25%] font-black">Generic AI (e.g. ChatGPT)</th>
          <th className="px-6 py-5 w-[25%] text-indigo-650 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-[24px] relative overflow-hidden border-x border-t border-indigo-100/70 dark:border-indigo-500/20 text-center">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#a456ef] via-[#6951ed] to-[#3e70f3]" />
            <span className="flex items-center gap-1.5 justify-center font-black">
              <Sparkles className="h-3.5 w-3.5 fill-indigo-500/80 text-indigo-500 animate-pulse" />
              IELTS Ai Pro
            </span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200/60 dark:divide-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300">
        {categoriesList.map((item, idx) => (
          <tr key={idx} className="transition-colors hover:bg-slate-50/30 dark:hover:bg-white/5">
            <td className="px-6 py-5 font-extrabold text-slate-900 dark:text-white text-[13px] leading-snug">
              {item.feature}
            </td>
            <td className="px-6 py-5">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100/80 dark:bg-slate-900 text-slate-400/80 dark:text-slate-600 mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                </span>
                <span className="text-[12.5px] text-slate-550 dark:text-slate-450 leading-relaxed font-medium">
                  {item.traditional}
                </span>
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100/80 dark:bg-slate-900 text-slate-400/80 dark:text-slate-600 mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                </span>
                <span className="text-[12.5px] text-slate-550 dark:text-slate-450 leading-relaxed font-medium">
                  {item.genericAi}
                </span>
              </div>
            </td>
            <td className="px-6 py-5 font-bold bg-indigo-50/20 dark:bg-indigo-500/5 border-x border-indigo-100/50 dark:border-indigo-500/15 last:rounded-b-[24px] last:border-b last:border-indigo-100/50 dark:last:border-indigo-500/15">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_3px_10px_-2px_rgba(16,185,129,0.35)] mt-0.5">
                  <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                </span>
                <span className="font-extrabold text-[13px] text-slate-900 dark:text-white leading-relaxed">
                  {item.aiPro}
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ComparisonSection({ viewport, handlePrimaryCta }) {
  return (
    <SoftSection
      id="comparison"
      className="scroll-mt-24 py-16 md:py-24 bg-background relative overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-gradient-to-tr from-indigo-500/10 via-violet-500/5 to-teal-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="The IELTS Ai Pro Advantage"
          title="See how we stack up"
          script="against other options."
          description="Compare classroom feedback, generic AI tools, and criterion-based IELTS practice feedback."
          viewport={viewport}
        />

        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6 }}
          className="mt-12 overflow-x-auto rounded-[24px] md:rounded-[32px] border border-slate-200/80 bg-white/[0.65] dark:border-white/10 dark:bg-[#070b15]/40 p-3 shadow-[0_32px_64px_-24px_rgba(15,23,42,0.08)] dark:shadow-[0_40px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-xl"
        >
          <ComparisonTable categoriesList={categories} />
        </m.div>

        {/* Small guarantee text card below the table */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          className="mt-8 rounded-[20px] border border-slate-200/80 dark:border-white/10 bg-gradient-to-r from-indigo-50/50 via-white/80 to-teal-50/30 dark:from-indigo-950/20 dark:via-slate-950/30 dark:to-emerald-950/10 p-5 md:p-6 flex flex-col md:flex-row items-center gap-5 text-center md:text-left justify-between shadow-[0_12px_36px_-15px_rgba(82,98,239,0.12)] backdrop-blur-xl"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="h-5.5 w-5.5 fill-white/10" />
            </span>
            <div>
              <b className="block text-base text-slate-900 dark:text-white font-black tracking-tight">
                Ready to make the switch?
              </b>
              <small className="text-slate-500 dark:text-slate-400 block mt-1 font-bold text-xs sm:text-[13px] leading-normal">
                Try our free practice tools and get estimated IELTS band scores instantly.
              </small>
            </div>
          </div>
          {handlePrimaryCta && (
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7638ea] to-[#216ff0] hover:from-[#6229d1] hover:to-[#175cdb] text-white font-extrabold text-[13px] px-6 py-3 shadow-[0_10px_25px_-5px_rgba(82,98,239,0.3)] transition duration-200 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            >
              Start Free Test
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          )}
        </m.div>
      </div>
    </SoftSection>
  );
}
