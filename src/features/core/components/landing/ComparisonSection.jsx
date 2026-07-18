import React from 'react';
import { m } from 'framer-motion';
import { Check, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
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
    aiPro: 'Instant, examiner-grade corrections & band estimates',
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
    aiPro: 'Free plan available / Premium starts at $15.99 / month',
    status: 'pro-win',
  },
];

function ComparisonTable({ categoriesList }) {
  return (
    <table className="w-full min-w-[800px] border-collapse text-left">
      <thead>
        <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <th className="p-5 w-[25%]">Platform feature</th>
          <th className="p-5 w-[25%]">Traditional Centers</th>
          <th className="p-5 w-[25%]">Generic AI (e.g. ChatGPT)</th>
          <th className="p-5 w-[25%] text-primary dark:text-blue-400 bg-primary/5 dark:bg-blue-500/5 rounded-t-[20px] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-[#6256ed]" />
            <span className="flex items-center gap-1.5 justify-center">
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              IELTS Ai Pro
            </span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-semibold text-slate-655 dark:text-slate-300">
        {categoriesList.map((item, idx) => (
          <tr key={idx} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5">
            <td className="p-5 font-extrabold text-slate-900 dark:text-white">{item.feature}</td>
            <td className="p-5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{item.traditional}</span>
              </div>
            </td>
            <td className="p-5">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{item.genericAi}</span>
              </div>
            </td>
            <td className="p-5 font-bold text-slate-800 dark:text-slate-100 bg-primary/5 dark:bg-blue-500/5 last:rounded-b-[20px] border-x border-primary/10 dark:border-blue-500/10">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white leading-relaxed">
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

export default function ComparisonSection({ viewport }) {
  return (
    <SoftSection id="comparison" className="scroll-mt-24 py-16 md:py-24 bg-background">
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="The IELTS Ai Pro Advantage"
          title="See how we stack up"
          script="against other options."
          description="Traditional classrooms are slow and expensive. Generic AI lacks official test rubrics. IELTS Ai Pro gives you the best of both worlds."
          viewport={viewport}
        />

        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6 }}
          className="mt-12 overflow-x-auto rounded-[32px] border border-slate-100 bg-white/50 dark:border-white/5 dark:bg-slate-950/20 p-2 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.06)] backdrop-blur-md"
        >
          <ComparisonTable categoriesList={categories} />
        </m.div>

        {/* Small guarantee text card below the table */}
        <m.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewport}
          className="mt-8 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 p-5 flex flex-col md:flex-row items-center gap-4 text-center md:text-left justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#eff0ff] to-[#e7e9ff] dark:from-slate-900 dark:to-slate-850 text-[#5262ef] border border-[#dadcff]/60 shadow-sm">
              <Sparkles className="h-5 w-5 fill-current" />
            </span>
            <div>
              <b className="block text-sm text-slate-900 dark:text-white font-extrabold">
                Ready to make the switch?
              </b>
              <small className="text-slate-455 block mt-0.5 font-bold">
                Try our free practice tools and get estimated IELTS band scores instantly.
              </small>
            </div>
          </div>
        </m.div>
      </div>
    </SoftSection>
  );
}
