import React from 'react';
import { FileText, Cpu, CheckCircle2, Award } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Submit Your Practice',
    desc: 'Type your essay or record your voice directly into our AI test interface.',
    icon: FileText,
    color:
      'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-500/20',
    badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  },
  {
    step: '02',
    title: 'Instant AI Scoring',
    desc: 'Evaluated instantly using official Cambridge criteria for Task Response, Grammar, and Vocabulary.',
    icon: Cpu,
    color:
      'from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-500/20',
    badgeBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  },
  {
    step: '03',
    title: 'Smart Error Fixes',
    desc: 'Get sentence-by-sentence corrections for grammar mistakes, vocabulary, and structural clarity.',
    icon: CheckCircle2,
    color:
      'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20',
    badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  {
    step: '04',
    title: 'Target Band Roadmap',
    desc: 'Receive targeted drill recommendations to boost your score to Band 7.5+.',
    icon: Award,
    color:
      'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20',
    badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
];

export default function TechSpotlightSection() {
  return (
    <section className="py-16 md:py-24 px-6 relative border-t border-slate-200/60 dark:border-white/[0.07]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14 space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 block">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">
            How It Works in 4 Steps
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            From practice submission to detailed band report in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((item, idx) => (
            <div
              key={idx}
              className="group rounded-[24px] border border-slate-200/80 dark:border-white/10 bg-linear-to-br from-white via-slate-50/50 to-white dark:bg-linear-to-b dark:from-[#131315] dark:to-[#131315] p-6 relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-none hover:border-indigo-500/30 dark:hover:border-[#5a63df]/30 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${item.badgeBg}`}>
                  STEP {item.step}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl bg-linear-to-br ${item.color} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
