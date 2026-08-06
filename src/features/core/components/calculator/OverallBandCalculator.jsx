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
import { roundOverallBand, getRecommendation } from './calculatorData';

const TARGET_OPTIONS = ['6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

function BandSliderRow({ name, value, set, icon: Icon, color, description }) {
  return (
    <div className="group flex h-full flex-col justify-between rounded-[22px] border border-slate-200/90 bg-white/90 p-5 shadow-[0_10px_35px_-12px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40 hover:shadow-xl dark:border-white/10 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:to-[#131315] dark:backdrop-blur-none dark:shadow-none dark:hover:border-white/15 relative overflow-hidden">
      <div className="space-y-3.5 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 shadow-2xs ${color}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-[14.5px] font-extrabold text-slate-950 dark:text-white leading-tight">
                {name}
              </span>
              <span className="mt-0.5 block text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug">
                {description}
              </span>
            </div>
          </div>
          <strong className="text-2xl font-black text-slate-950 dark:text-white leading-none">
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
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-indigo-600 dark:bg-white/8"
            style={{
              background: `linear-gradient(to right, #5262ef 0%, #5262ef ${((value - 4) / 5) * 100}%, #e2e8f0 ${((value - 4) / 5) * 100}%)`,
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-between px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 relative z-10">
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
      color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
      description: 'Lectures, conversations & details',
    },
    {
      name: 'Reading',
      value: reading,
      set: setReading,
      icon: BookOpen,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      description: 'Skimming, scanning & comprehension',
    },
    {
      name: 'Writing',
      value: writing,
      set: setWriting,
      icon: PenLine,
      color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
      description: 'Essay structure, vocabulary & grammar',
    },
    {
      name: 'Speaking',
      value: speaking,
      set: setSpeaking,
      icon: Mic,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
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
        <div className="flex h-full flex-col justify-between rounded-[22px] border border-slate-200/90 bg-white/90 p-5 shadow-[0_10px_35px_-12px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/40 dark:border-white/10 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:to-[#131315] dark:backdrop-blur-none dark:shadow-none dark:hover:border-white/15 sm:col-span-2 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <span className="block text-[14.5px] font-extrabold text-slate-950 dark:text-white leading-tight">
                  Your target band
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Compare your estimate with your goal
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Target band">
              {TARGET_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTarget(option)}
                  className={`h-9 min-w-[42px] rounded-xl px-2.5 text-xs font-black transition-all duration-200 hover:scale-105 active:scale-95 ${
                    target === option
                      ? 'bg-linear-to-r/srgb from-indigo-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`mt-5 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-xs sm:text-[13px] font-bold leading-relaxed border transition-all duration-300 ${
              gap <= 0
                ? 'bg-emerald-50/80 border-emerald-200/70 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300'
                : 'bg-amber-50/80 border-amber-200/70 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300'
            }`}
            aria-live="polite"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                gap <= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <TrendingUp className="h-4.5 w-4.5" />
            </span>
            <div>
              {gap <= 0 ? (
                <span>
                  Your estimated {overallBand.toFixed(1)} meets your {target} target. Confirm it
                  with a full mock test before exam day.
                </span>
              ) : (
                <span>
                  You are <strong className="font-black">{gap.toFixed(1)}</strong> below your{' '}
                  {target} target. Raising your weakest skill —{' '}
                  <span className="font-black text-amber-700 dark:text-amber-400">
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
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] md:rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:to-[#131315] dark:backdrop-blur-none dark:shadow-none sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-500/10 dark:bg-[#5a63df]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Estimated Overall Band
            </span>

            <div className="relative mb-5 flex h-36 w-36 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 shadow-md dark:border-white/10 dark:bg-white/4 dark:shadow-none">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="6"
                  className="dark:stroke-white/10"
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
                <strong className="block text-[46px] font-black leading-none tracking-tight text-slate-950 dark:text-white">
                  {overallBand.toFixed(1)}
                </strong>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  avg {average.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-linear-to-r/srgb from-indigo-50/90 via-purple-50/80 to-white/90 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:border-indigo-500/30 dark:from-indigo-950/80 dark:via-purple-950/60 dark:to-slate-900/90 dark:text-indigo-300 shadow-sm backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              {recommendation.level}
            </div>

            <p className="max-w-[320px] text-xs sm:text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
              {recommendation.desc}
            </p>
          </div>

          <div className="relative z-10 mt-6 space-y-3.5 border-t border-slate-200/60 pt-6 text-left dark:border-white/10">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Target className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Priority Focus Area
                </span>
              </div>
              <p className="text-xs sm:text-[13px] font-bold leading-relaxed text-slate-900 dark:text-slate-200">
                {recommendation.focus}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Recommended Study Time
                </span>
              </div>
              <p className="text-xs sm:text-[13px] font-bold leading-relaxed text-slate-900 dark:text-slate-200">
                {recommendation.hours}
              </p>
            </div>

            <button
              onClick={handlePrimaryCta}
              className="mt-4 w-full h-12 rounded-2xl bg-linear-to-r/srgb from-[#5246ea] via-[#6352f0] to-[#2b72f0] hover:from-[#4438dd] hover:to-[#1a64e0] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Start Focused Practice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
