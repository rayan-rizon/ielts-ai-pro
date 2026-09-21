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
import Minus from 'lucide-react/icons/minus';
import Plus from 'lucide-react/icons/plus';
import { roundOverallBand, getRecommendation } from './calculatorData';
import { panelClass, railLabelClass } from './calculatorStyles';
import { IconChip, NUM, MICRO, MUTED, WELL } from '@/features/dashboard/components/primitives.jsx';

const TARGET_OPTIONS = ['6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

function sliderFill(value, min, max) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #5a63df 0%, #5a63df ${pct}%, var(--calc-track, #e6e8f5) ${pct}%)`,
  };
}

function SkillRow({ name, value, set, icon: Icon, tone, description }) {
  const handleStep = (step) => {
    const next = Math.round((value + step) * 2) / 2;
    if (next >= 4.0 && next <= 9.0) {
      set(next);
    }
  };

  return (
    <div className="group p-3.5 transition-colors duration-150 hover:bg-[#fbfbfe] dark:hover:bg-white/[0.02] sm:px-5 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconChip icon={Icon} tone={tone} size="sm" />
          <div className="min-w-0">
            <span className="block truncate text-[13.5px] font-extrabold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">
              {name}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium leading-tight text-slate-500 dark:text-slate-400">
              {description}
            </span>
          </div>
        </div>

        {/* Stepper Buttons and Value Display */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleStep(-0.5)}
            disabled={value <= 4.0}
            aria-label={`Decrease ${name} band`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-600 transition-all duration-150 hover:border-[#5a63df]/40 hover:bg-[#f4f3fb] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <Minus className="h-3 w-3 stroke-[2.5]" />
          </button>

          <span
            className={`${NUM} inline-flex w-10 justify-center text-[17px] font-black text-slate-900 dark:text-white`}
          >
            {value.toFixed(1)}
          </span>

          <button
            type="button"
            onClick={() => handleStep(0.5)}
            disabled={value >= 9.0}
            aria-label={`Increase ${name} band`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-600 transition-all duration-150 hover:border-[#5a63df]/40 hover:bg-[#f4f3fb] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <Plus className="h-3 w-3 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Slider Input with Ticks */}
      <div className="mt-2.5 px-0.5">
        <input
          type="range"
          min="4.0"
          max="9.0"
          step="0.5"
          value={value}
          aria-label={`${name} band score`}
          onChange={(e) => set(parseFloat(e.target.value))}
          className="calc-range h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={sliderFill(value, 4, 9)}
        />
        <div className="mt-1 flex justify-between text-[9.5px] font-bold text-slate-400 dark:text-slate-500">
          <span>4.0</span>
          <span>5.0</span>
          <span>6.0</span>
          <span>7.0</span>
          <span>8.0</span>
          <span>9.0</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = 'neutral' }) {
  return (
    <div className="min-w-0">
      <span className={`${MICRO} ${MUTED}`}>{label}</span>
      <strong
        className={`${NUM} mt-1 block text-base font-black sm:text-[17px] ${
          tone === 'good'
            ? 'text-emerald-600 dark:text-emerald-400'
            : tone === 'warn'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-900 dark:text-white'
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
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-violet-300">
        <Icon className="h-3.5 w-3.5 stroke-2" />
      </span>
      <div className="min-w-0">
        <span className={`${MICRO} ${MUTED}`}>{label}</span>
        <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300 sm:text-[12.5px]">
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
      tone: 'accent',
      description: 'Conversations & lectures',
    },
    {
      name: 'Reading',
      value: reading,
      set: setReading,
      icon: BookOpen,
      tone: 'ok',
      description: 'Skimming & comprehension',
    },
    {
      name: 'Writing',
      value: writing,
      set: setWriting,
      icon: PenLine,
      tone: 'accent',
      description: 'Structure, vocabulary & grammar',
    },
    {
      name: 'Speaking',
      value: speaking,
      set: setSpeaking,
      icon: Mic,
      tone: 'warn',
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
          <header className="flex items-center justify-between gap-3 border-b border-[#e4e2f0] px-4 py-3 dark:border-white/[0.07] sm:px-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Your skill scores
            </h3>
            <span className={`${MICRO} ${MUTED}`}>Band 4.0 – 9.0</span>
          </header>
          <div className="divide-y divide-[#f0eff8] dark:divide-white/[0.05]">
            {skills.map((skill) => (
              <SkillRow key={skill.name} {...skill} />
            ))}
          </div>
        </section>

        <section className={panelClass}>
          <header className="flex flex-col gap-3 border-b border-[#e4e2f0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.07] sm:px-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#5a63df]/10 text-[#5a63df] dark:text-violet-300">
                <Target className="h-3.5 w-3.5 stroke-2" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Target band
              </h3>
            </div>
            {/* Segmented Control Track: distinct buttons with min-width, never overlapping */}
            <div
              className="flex flex-wrap items-center justify-center gap-1 rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] p-1 dark:border-white/10 dark:bg-[#100f16]"
              role="group"
              aria-label="Target band"
            >
              {TARGET_OPTIONS.map((option) => {
                const isSelected = target === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setTarget(option)}
                    className={`${NUM} flex h-8 min-w-[38px] sm:min-w-[42px] items-center justify-center rounded-lg px-2 text-xs font-black transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#5a63df] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#5a63df] dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </header>

          <p
            className="flex items-start gap-2.5 px-4 py-3 text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300 sm:px-5"
            aria-live="polite"
          >
            <TrendingUp
              className={`mt-0.5 h-4 w-4 shrink-0 stroke-2 ${
                onTrack
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            />
            {onTrack ? (
              <span>
                Your{' '}
                <strong className={`${NUM} font-black text-slate-900 dark:text-white`}>
                  {overallBand.toFixed(1)}
                </strong>{' '}
                meets the {target} target — confirm it with a full mock test.
              </span>
            ) : (
              <span>
                <strong className={`${NUM} font-black text-slate-900 dark:text-white`}>
                  {gap.toFixed(1)}
                </strong>{' '}
                below the {target} target. Lifting{' '}
                <strong className="font-extrabold text-amber-700 dark:text-amber-400">
                  {weakest.name} ({weakest.value.toFixed(1)})
                </strong>{' '}
                raises the average fastest.
              </span>
            )}
          </p>
        </section>
      </div>

      {/* Result Panel (Sticky on desktop so learner keeps visual feedback while adjusting) */}
      <section className={`${panelClass} lg:col-span-5 lg:sticky lg:top-24 lg:self-start`}>
        <header className="flex items-center justify-between gap-3 border-b border-[#e4e2f0] px-4 py-3 dark:border-white/[0.07] sm:px-5">
          <h3 className={`${MICRO} ${MUTED}`}>Estimated overall band</h3>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-[#5e50ee] dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-200">
            {recommendation.level}
          </span>
        </header>

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 lg:flex-row lg:items-center lg:gap-5">
            <div className="relative mx-auto flex h-[96px] w-[96px] shrink-0 items-center justify-center sm:mx-0">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-[#e8eaf6] dark:text-white/10"
                />
                <m.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#5a63df"
                  strokeWidth="6"
                  strokeDasharray="282.7"
                  animate={{ strokeDashoffset: 282.7 - (282.7 * overallBand) / 9 }}
                  transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                  strokeLinecap="round"
                />
              </svg>
              <strong
                className={`${NUM} text-[34px] font-black leading-none text-slate-900 dark:text-white sm:text-[38px]`}
              >
                {overallBand.toFixed(1)}
              </strong>
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 rounded-xl border border-[#e4e2f0]/70 bg-[#f9f8fe] p-3 dark:border-white/[0.06] dark:bg-white/[0.03] sm:grid-cols-4 lg:grid-cols-2">
              <MiniStat label="Raw average" value={average.toFixed(2)} />
              <MiniStat
                label={onTrack ? 'Target met' : 'To target'}
                value={onTrack ? `${target} ✓` : `+${gap.toFixed(1)}`}
                tone={onTrack ? 'good' : 'warn'}
              />
              <MiniStat label="Weakest skill" value={weakest.name} />
              <MiniStat
                label="Study load"
                value={`${recommendation.hours.split(' hours')[0]} hrs`}
              />
            </div>
          </div>
        </div>

        <p className="border-t border-[#f0eff8] px-4 py-3 text-xs font-medium leading-relaxed text-slate-600 dark:border-white/[0.05] dark:text-slate-300 sm:px-5">
          {recommendation.desc}
        </p>

        <div className="divide-y divide-[#f0eff8] border-t border-[#f0eff8] dark:divide-white/[0.05] dark:border-white/[0.05]">
          <AdviceRow icon={Target} label="Focus area">
            {recommendation.focus}
          </AdviceRow>
          <AdviceRow icon={Clock} label="Study time">
            {recommendation.hours}
          </AdviceRow>
        </div>

        <div className="p-4 sm:p-5">
          <button
            type="button"
            onClick={handlePrimaryCta}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5a63df] text-xs font-extrabold uppercase tracking-[0.08em] text-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4a53cf] active:scale-[0.98]"
          >
            Start focused practice
            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </section>
    </div>
  );
}
