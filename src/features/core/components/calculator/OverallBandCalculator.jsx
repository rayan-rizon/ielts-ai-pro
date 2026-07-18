import React, { useState } from 'react';
import { m } from 'framer-motion';
import Headphones from 'lucide-react/icons/headphones';
import BookOpen from 'lucide-react/icons/book-open';
import PenLine from 'lucide-react/icons/pen-line';
import Mic from 'lucide-react/icons/mic';
import Sparkles from 'lucide-react/icons/sparkles';
import Target from 'lucide-react/icons/target';
import TrendingUp from 'lucide-react/icons/trending-up';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Clock from 'lucide-react/icons/clock';
import { Button } from '@/components/ui/button';
import { roundOverallBand, getRecommendation } from './calculatorData';

const TARGET_OPTIONS = ['6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

function BandSliderRow({ name, value, set, icon: Icon, color, description }) {
  return (
    <div className="group flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-white/5 dark:bg-slate-950 dark:shadow-none dark:hover:border-white/10 dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${color}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-[15px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                {name}
              </span>
              <span className="mt-1 block text-xs font-semibold text-slate-400 dark:text-slate-500 leading-none">
                {description}
              </span>
            </div>
          </div>
          <strong className="text-xl font-black text-slate-900 dark:text-white leading-none">
            {value.toFixed(1)}
          </strong>
        </div>

        <div className="pt-1.5">
          <input
            type="range"
            min="4.0"
            max="9.0"
            step="0.5"
            value={value}
            aria-label={`${name} band score`}
            onChange={(e) => set(parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-primary dark:bg-slate-800"
            style={{
              background: `linear-gradient(to right, #5262ef 0%, #5262ef ${((value - 4) / 5) * 100}%, #e2e8f0 ${((value - 4) / 5) * 100}%)`,
            }}
          />
        </div>
      </div>

      <div className="mt-3.5 flex justify-between px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span>4.0</span>
        <span>6.5</span>
        <span>9.0</span>
      </div>
    </div>
  );
}

export default function OverallBandCalculator({ handlePrimaryCta }) {
  const [listening, setListening] = useState(6.5);
  const [reading, setReading] = useState(6.5);
  const [writing, setWriting] = useState(6.0);
  const [speaking, setSpeaking] = useState(6.0);
  const [target, setTarget] = useState('7.0');

  const skills = [
    {
      name: 'Listening',
      value: listening,
      set: setListening,
      icon: Headphones,
      color: 'text-blue-500 bg-blue-500/10',
      description: 'Lectures, conversations & details',
    },
    {
      name: 'Reading',
      value: reading,
      set: setReading,
      icon: BookOpen,
      color: 'text-indigo-500 bg-indigo-500/10',
      description: 'Skimming, scanning & comprehension',
    },
    {
      name: 'Writing',
      value: writing,
      set: setWriting,
      icon: PenLine,
      color: 'text-violet-500 bg-violet-500/10',
      description: 'Essay structure, vocabulary & grammar',
    },
    {
      name: 'Speaking',
      value: speaking,
      set: setSpeaking,
      icon: Mic,
      color: 'text-emerald-500 bg-emerald-500/10',
      description: 'Fluency, pronunciation & coherence',
    },
  ];

  const average = (listening + reading + writing + speaking) / 4;
  const overallBand = roundOverallBand(average);
  const recommendation = getRecommendation(overallBand);

  const targetBand = parseFloat(target);
  const gap = Math.round((targetBand - overallBand) * 2) / 2;
  const weakest = skills.reduce((min, s) => (s.value < min.value ? s : min), skills[0]);

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-12">
      <div className="grid h-full gap-4 sm:grid-cols-2 lg:col-span-7">
        {skills.map((skill) => (
          <BandSliderRow key={skill.name} {...skill} />
        ))}

        {/* Target band tracker */}
        <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:border-slate-200 dark:border-white/5 dark:bg-slate-950 dark:shadow-none sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Target className="h-4.5 w-4.5" />
              </span>
              <div>
                <span className="block text-[15px] font-extrabold text-slate-800 dark:text-slate-200">
                  Your target band
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Compare your estimate with your goal
                </span>
              </div>
            </div>
            <div className="flex gap-1.5" role="group" aria-label="Target band">
              {TARGET_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTarget(option)}
                  className={`h-9 min-w-[44px] rounded-xl px-2 text-[13px] font-extrabold transition-all hover:scale-105 active:scale-95 ${
                    target === option
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`mt-4 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[13px] font-bold leading-relaxed border transition-all duration-300 ${
              gap <= 0
                ? 'bg-emerald-50/80 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300'
                : 'bg-amber-50/80 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300'
            }`}
            aria-live="polite"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                gap <= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              {gap <= 0 ? (
                <span>
                  Your estimated {overallBand.toFixed(1)} meets your {target} target. Confirm it
                  with a full mock test before exam day.
                </span>
              ) : (
                <span>
                  You are <strong className="font-extrabold">{gap.toFixed(1)}</strong> below your{' '}
                  {target} target. Raising your weakest skill —{' '}
                  <span className="font-extrabold text-amber-700 dark:text-amber-400">
                    {weakest.name} ({weakest.value.toFixed(1)})
                  </span>{' '}
                  — lifts the average fastest.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result card */}
      <div className="lg:col-span-5">
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[32px] border border-white/50 bg-white/70 p-6 shadow-[0_24px_55px_-30px_rgba(30,41,59,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70 sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Estimated Overall Band
            </span>

            <div className="relative mb-5 flex h-36 w-36 items-center justify-center rounded-full border border-slate-100 bg-white shadow-md dark:border-white/5 dark:bg-slate-900">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="6"
                  className="dark:stroke-slate-800"
                />
                <m.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#5262ef"
                  strokeWidth="6"
                  strokeDasharray="276.4"
                  animate={{ strokeDashoffset: 276.4 - (276.4 * overallBand) / 9 }}
                  transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <strong className="block text-[46px] font-black leading-none tracking-tight text-slate-900 dark:text-white">
                  {overallBand.toFixed(1)}
                </strong>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  avg {average.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-primary shadow-sm">
              <Sparkles className="h-3 w-3" />
              {recommendation.level}
            </div>

            <p className="max-w-[320px] text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
              {recommendation.desc}
            </p>
          </div>

          <div className="relative z-10 mt-7 space-y-4 border-t border-slate-100 pt-6 text-left dark:border-white/5">
            <div className="rounded-2xl border border-slate-100/50 bg-slate-50 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-slate-900/40 dark:hover:bg-slate-900/60">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Target className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Priority Focus Area
                </span>
              </div>
              <p className="text-[13px] font-bold leading-relaxed text-slate-800 dark:text-slate-200">
                {recommendation.focus}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100/50 bg-slate-50 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-slate-900/40 dark:hover:bg-slate-900/60">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Recommended Study Time
                </span>
              </div>
              <p className="text-[13px] font-bold leading-relaxed text-slate-800 dark:text-slate-200">
                {recommendation.hours}
              </p>
            </div>

            <Button
              onClick={handlePrimaryCta}
              size="lg"
              className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-[#6256ed] text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              Start Focused Practice
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
