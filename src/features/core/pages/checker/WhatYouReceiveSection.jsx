import React from 'react';
import { BookOpen, Info, Link, Target, Type } from 'lucide-react';
import { cn } from '@/lib/cn';

const CRITERIA = [
  {
    Icon: Target,
    label: 'Task Response',
    score: '6.5',
    color: 'text-emerald-600',
    text: 'Addresses the task well with relevant ideas, though some details could be more specific.',
  },
  {
    Icon: Link,
    label: 'Coherence & Cohesion',
    score: '6.0',
    color: 'text-amber-500',
    text: 'Organisation is clear in parts, but paragraphing and linking can be improved.',
  },
  {
    Icon: BookOpen,
    label: 'Lexical Resource',
    score: '6.5',
    color: 'text-emerald-600',
    text: 'Good range of vocabulary with some precise word choice. Try more less common items.',
  },
  {
    Icon: Type,
    label: 'Grammatical Range',
    score: '6.5',
    color: 'text-emerald-600',
    text: 'Uses a variety of structures with good control. Minor errors present.',
  },
];

function BandDial() {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - 6.5 / 9);

  return (
    <div className="relative mt-6 flex items-center justify-center">
      <svg className="h-28 w-28 transform -rotate-90">
        <circle cx="56" cy="56" r={radius} stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="#10b981"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900">6.5</span>
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
          Good
        </span>
      </div>
    </div>
  );
}

function CriterionColumn({ criterion, isLast }) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between items-center text-center pt-6 md:pt-0',
        isLast ? 'md:pl-4' : 'md:px-4'
      )}
    >
      <div>
        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-violet-600 shadow-sm">
          <criterion.Icon className="h-4.5 w-4.5" />
        </div>
        <h3 className="mt-3 text-xs font-black text-slate-800">{criterion.label}</h3>
        <span className={cn('block text-2xl font-black mt-2', criterion.color)}>
          {criterion.score}
        </span>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 font-medium px-1">
          {criterion.text}
        </p>
      </div>
      <button
        type="button"
        className="mt-4 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-100 hover:border-indigo-200 rounded-lg py-1 px-3 w-full transition shadow-sm bg-white"
      >
        View feedback
      </button>
    </div>
  );
}

export default function WhatYouReceiveSection() {
  return (
    <section id="what-you-receive" className="scroll-mt-24 py-10 sm:py-12 bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-indigo-100 bg-white p-5 sm:p-6 lg:p-8 shadow-[0_16px_48px_rgba(79,70,229,0.035)]">
          <div className="grid gap-8 lg:grid-cols-[0.32fr_0.68fr] lg:items-center">
            <div className="flex flex-col items-start max-w-md">
              <span className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">
                What you receive
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                What you receive
              </h2>
              <div className="w-12 h-1 bg-indigo-600 rounded-full mt-3" />
              <p className="mt-5 text-sm leading-relaxed text-slate-600 font-medium">
                A clear, criterion-based report with an estimated band (practice only) and
                actionable feedback to help you improve.
              </p>
              <div className="relative mt-8 flex items-start gap-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/40 p-4">
                <Info className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                <p className="text-xs leading-relaxed text-indigo-700 font-bold">
                  This is a practice estimate based on AI analysis and is not a result from an IELTS
                  examiner.
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-[28px] border border-indigo-50 bg-slate-50/50 p-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.005),0_8px_30px_rgba(79,70,229,.05)]">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="flex flex-col items-center text-center pb-6 md:pb-0 md:pr-4">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Estimated band
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                    (Practice estimate)
                  </span>
                  <BandDial />
                </div>
                {CRITERIA.map((criterion, idx) => (
                  <CriterionColumn
                    key={criterion.label}
                    criterion={criterion}
                    isLast={idx === CRITERIA.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
