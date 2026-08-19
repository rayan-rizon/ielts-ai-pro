import React, { useState } from 'react';
import { m } from 'framer-motion';
import Headphones from 'lucide-react/icons/headphones';
import BookOpen from 'lucide-react/icons/book-open';
import PenLine from 'lucide-react/icons/pen-line';
import Mic from 'lucide-react/icons/mic';
import Target from 'lucide-react/icons/target';
import TrendingUp from 'lucide-react/icons/trending-up';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Clock from 'lucide-react/icons/clock';
import { roundOverallBand, getRecommendation } from './calculatorData';
import { panelClass, railLabelClass } from './calculatorStyles';

const TARGET_OPTIONS = ['6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

function sliderFill(value, min, max) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #6256ef 0%, #6256ef ${pct}%, var(--calc-track) ${pct}%)`,
  };
}

function SkillRow({ name, value, set, icon: Icon, description }) {
  return (
    <div className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors duration-200 hover:bg-[#f8f8fe] dark:hover:bg-white/[0.03] sm:px-5">
      <span className="row-span-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-[#ded9ff] bg-[#f2f0ff] text-[#6256ef] transition-transform duration-200 group-hover:scale-105 dark:border-violet-400/15 dark:bg-violet-500/[0.07] dark:text-violet-300">
        <Icon className="h-4.5 w-4.5 stroke-2" />
      </span>
      <div className="min-w-0">
        <span className="block truncate text-[13.5px] font-extrabold leading-tight tracking-[-0.015em] text-[#0b1230] dark:text-white">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-medium leading-tight text-[#7b84a1] dark:text-slate-400">
          {description}
        </span>
      </div>
      <strong className="self-center text-[19px] font-black leading-none tabular-nums tracking-[-0.04em] text-[#0b1230] dark:text-white">
        {value.toFixed(1)}
      </strong>
      <input
        type="range"
        min="4.0"
        max="9.0"
        step="0.5"
        value={value}
        aria-label={`${name} band score`}
        onChange={(e) => set(parseFloat(e.target.value))}
        className="calc-range col-span-2 h-1.5 w-full cursor-pointer appearance-none rounded-full"
        style={sliderFill(value, 4, 9)}
      />
    </div>
  );
}

function MiniStat({ label, value, tone = 'neutral' }) {
  return (
    <div className="min-w-0">
      <span className={railLabelClass}>{label}</span>
      <strong
        className={`mt-1 block text-[17px] font-black leading-none tabular-nums tracking-[-0.03em] ${
          tone === 'good'
            ? 'text-[#128468] dark:text-emerald-400'
            : tone === 'warn'
              ? 'text-[#a86a12] dark:text-amber-400'
              : 'text-[#0b1230] dark:text-white'
        }`}
      >
        {value}
      </strong>
    </div>
  );
}

function AdviceRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border border-[#e3e5f5] bg-[#f5f6fc] text-[#6256ef] dark:border-white/10 dark:bg-white/[0.04] dark:text-violet-300">
        <Icon className="h-3.5 w-3.5 stroke-2" />
      </span>
      <div className="min-w-0">
        <span className={railLabelClass}>{label}</span>
        <p className="mt-1 text-[12.5px] font-semibold leading-5 text-[#2c3757] dark:text-slate-300">
          {children}
        </p>
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
      description: 'Conversations & lectures',
    },
    {
      name: 'Reading',
      value: reading,
      set: setReading,
      icon: BookOpen,
      description: 'Skimming & comprehension',
    },
    {
      name: 'Writing',
      value: writing,
      set: setWriting,
      icon: PenLine,
      description: 'Structure, vocabulary & grammar',
    },
    {
      name: 'Speaking',
      value: speaking,
      set: setSpeaking,
      icon: Mic,
      description: 'Fluency & pronunciation',
    },
  ];

  const average = (listening + reading + writing + speaking) / 4;
  const overallBand = roundOverallBand(average);
  const recommendation = getRecommendation(overallBand);

  const targetBand = parseFloat(target);
  const gap = Math.round((targetBand - overallBand) * 2) / 2;
  const onTrack = gap <= 0;
  const weakest = skills.reduce((min, s) => (s.value < min.value ? s : min), skills[0]);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-5">
      {/* Inputs */}
      <div className="flex flex-col gap-4 lg:col-span-7 lg:gap-5">
        <section className={panelClass}>
          <header className="flex items-baseline justify-between gap-3 border-b border-[#eceef8] px-4 py-3 dark:border-white/8 sm:px-5">
            <h3 className="text-[13px] font-extrabold tracking-[-0.015em] text-[#0b1230] dark:text-white">
              Your skill scores
            </h3>
            <span className={railLabelClass}>Band 4.0 – 9.0</span>
          </header>
          <div className="divide-y divide-[#f1f2f9] dark:divide-white/6">
            {skills.map((skill) => (
              <SkillRow key={skill.name} {...skill} />
            ))}
          </div>
        </section>

        <section className={panelClass}>
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b border-[#eceef8] px-4 py-3 dark:border-white/8 sm:px-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-[#ffd9df] bg-[#fff1f3] text-[#d64a63] dark:border-rose-400/15 dark:bg-rose-500/[0.08] dark:text-rose-300">
                <Target className="h-3.5 w-3.5 stroke-2" />
              </span>
              <h3 className="text-[13px] font-extrabold tracking-[-0.015em] text-[#0b1230] dark:text-white">
                Target band
              </h3>
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Target band">
              {TARGET_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={target === option}
                  onClick={() => setTarget(option)}
                  className={`h-7 min-w-[40px] rounded-lg px-2 text-[11.5px] font-black tabular-nums transition-colors duration-150 ${
                    target === option
                      ? 'bg-[#6256ef] text-white'
                      : 'bg-[#f3f4fb] text-[#5c6687] hover:bg-[#e8eaf6] dark:bg-white/[0.05] dark:text-slate-400 dark:hover:bg-white/10'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </header>
          <p
            className="flex items-start gap-2.5 px-4 py-3 text-[12.5px] font-semibold leading-5 text-[#2c3757] dark:text-slate-300 sm:px-5"
            aria-live="polite"
          >
            <TrendingUp
              className={`mt-0.5 h-4 w-4 shrink-0 stroke-2 ${onTrack ? 'text-[#128468] dark:text-emerald-400' : 'text-[#c88418] dark:text-amber-400'}`}
            />
            {onTrack ? (
              <span>
                Your <strong className="font-black">{overallBand.toFixed(1)}</strong> meets the{' '}
                {target} target — confirm it with a full mock test.
              </span>
            ) : (
              <span>
                <strong className="font-black">{gap.toFixed(1)}</strong> below the {target} target.
                Lifting{' '}
                <strong className="font-black text-[#a86a12] dark:text-amber-400">
                  {weakest.name} {weakest.value.toFixed(1)}
                </strong>{' '}
                raises the average fastest.
              </span>
            )}
          </p>
        </section>
      </div>

      {/* Result */}
      <section className={`${panelClass} lg:col-span-5`}>
        <header className="flex items-center justify-between gap-3 border-b border-[#eceef8] px-4 py-3 dark:border-white/8 sm:px-5">
          <h3 className={railLabelClass}>Estimated overall band</h3>
          <span className="rounded-full border border-[#ded9ff] bg-[#f2f0ff] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e50ee] dark:border-violet-400/20 dark:bg-violet-500/[0.09] dark:text-violet-300">
            {recommendation.level}
          </span>
        </header>

        <div className="flex items-center gap-5 px-4 py-4 sm:px-5">
          <div className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-[#eceef8] dark:text-white/10"
              />
              <m.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#6256ef"
                strokeWidth="6"
                strokeDasharray="282.7"
                animate={{ strokeDashoffset: 282.7 - (282.7 * overallBand) / 9 }}
                transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                strokeLinecap="round"
              />
            </svg>
            <strong className="text-[38px] font-black leading-none tabular-nums tracking-[-0.06em] text-[#0b1230] dark:text-white">
              {overallBand.toFixed(1)}
            </strong>
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-3.5">
            <MiniStat label="Raw average" value={average.toFixed(2)} />
            <MiniStat
              label={onTrack ? 'Target met' : 'To target'}
              value={onTrack ? `${target} ✓` : `+${gap.toFixed(1)}`}
              tone={onTrack ? 'good' : 'warn'}
            />
            <MiniStat label="Weakest skill" value={weakest.name} />
            <MiniStat label="Study load" value={`${recommendation.hours.split(' hours')[0]} hrs`} />
          </div>
        </div>

        <p className="border-t border-[#f1f2f9] px-4 py-3 text-[12.5px] font-medium leading-5 text-[#5c6687] dark:border-white/6 dark:text-slate-400 sm:px-5">
          {recommendation.desc}
        </p>

        <div className="divide-y divide-[#f1f2f9] border-t border-[#f1f2f9] dark:divide-white/6 dark:border-white/6">
          <AdviceRow icon={Target} label="Focus area">
            {recommendation.focus}
          </AdviceRow>
          <AdviceRow icon={Clock} label="Study time">
            {recommendation.hours}
          </AdviceRow>
        </div>

        <div className="px-4 pb-4 pt-3.5 sm:px-5">
          <button
            type="button"
            onClick={handlePrimaryCta}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#6256ef] text-[12px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_12px_28px_-14px_rgba(98,86,239,0.9)] transition-colors duration-200 hover:bg-[#5246e4] active:scale-[0.995]"
          >
            Start focused practice
            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </section>
    </div>
  );
}
