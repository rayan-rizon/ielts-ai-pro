import React from 'react';
import { Check, CheckCircle2, ClipboardPaste, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEPS = [
  {
    Icon: ClipboardPaste,
    title: 'Paste Your Essay',
    text: 'Add your IELTS Writing Task 1 or Task 2 essay (150+ words).',
    iconBg: 'bg-emerald-50/80',
    iconColor: 'text-emerald-600',
    cardBg: 'bg-gradient-to-br from-emerald-50/20 to-white',
    borderClass: 'border-emerald-500/15',
    hoverClass: 'hover:from-emerald-50/35 hover:to-emerald-50/5',
  },
  {
    Icon: PenLine,
    title: 'Get AI Feedback',
    text: 'Our AI analyzes your writing and checks key assessment criteria.',
    iconBg: 'bg-indigo-50/80',
    iconColor: 'text-indigo-600',
    cardBg: 'bg-gradient-to-br from-indigo-50/20 to-white',
    borderClass: 'border-indigo-500/15',
    hoverClass: 'hover:from-indigo-50/35 hover:to-indigo-50/5',
  },
  {
    Icon: CheckCircle2,
    title: 'Improve & Score Higher',
    text: 'Review suggestions, learn from mistakes, and write even better.',
    iconBg: 'bg-emerald-50/80',
    iconColor: 'text-emerald-600',
    cardBg: 'bg-gradient-to-br from-emerald-50/20 to-white',
    borderClass: 'border-emerald-500/15',
    hoverClass: 'hover:from-emerald-50/35 hover:to-emerald-50/5',
  },
];

const FEATURES = [
  'Instant, detailed feedback in seconds',
  'Covers all IELTS Writing assessment criteria',
  'Find grammar, vocabulary & structure mistakes',
  'Perfect for self-study and exam preparation',
  '3 free feedback reports with simple sign-up',
];

function StepCard({ step, index, totalSteps }) {
  return (
    <article
      className={cn(
        'relative flex flex-col justify-between h-full rounded-2xl border p-5 sm:p-6 text-center transition-all duration-300 group hover:-translate-y-1',
        step.cardBg,
        step.borderClass,
        'shadow-none',
        step.hoverClass
      )}
    >
      <div>
        <span className="absolute left-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-xs font-black text-white shadow-sm">
          {index + 1}
        </span>
        <div
          className={cn(
            'mx-auto grid h-12 w-12 place-items-center rounded-full',
            step.iconBg,
            step.iconColor
          )}
        >
          <step.Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-5 text-sm font-extrabold text-[#0d1740]">{step.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">{step.text}</p>
      </div>
      {index < totalSteps - 1 && (
        <div className="absolute -right-6 top-1/2 z-10 hidden -translate-y-1/2 md:block">
          <svg
            className="h-5 w-5 text-indigo-400/80 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
            />
          </svg>
        </div>
      )}
    </article>
  );
}

export default function HowItWorksSection() {
  return (
    <section className="bg-[#f3f5ff] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-indigo-100 bg-white shadow-[0_16px_60px_rgba(79,70,229,.06)]">
          <div className="grid lg:grid-cols-[1.12fr_.88fr]">
            <div className="bg-slate-50/30 p-5 sm:p-6 lg:border-r lg:border-indigo-100 lg:p-8">
              <div className="flex flex-col items-start">
                <span className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">
                  Step by step
                </span>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  How It Works
                </h2>
              </div>
              <div className="mt-8 w-full">
                <div className="grid gap-4 md:grid-cols-3 w-full">
                  {STEPS.map((step, index) => (
                    <StepCard
                      key={step.title}
                      step={step}
                      index={index}
                      totalSteps={STEPS.length}
                    />
                  ))}
                </div>
              </div>
            </div>

            <aside className="relative overflow-hidden p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-violet-100 blur-2xl" />
              <div>
                <span className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">
                  Features
                </span>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Why Use Our Writing Checker?
                </h2>
                <div className="grid sm:grid-cols-[1.3fr_.7fr] items-center gap-4 mt-6">
                  <ul className="relative space-y-4 text-sm font-bold text-slate-700">
                    {FEATURES.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-slate-700 font-semibold text-xs leading-5">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="relative mx-auto max-w-[140px] sm:max-w-none">
                    <img
                      src="/writing-illustration.png"
                      alt="Illustration of a learner reviewing Academic IELTS Writing feedback on a laptop"
                      className="w-full h-auto object-contain rounded-2xl"
                      width="240"
                      height="240"
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
