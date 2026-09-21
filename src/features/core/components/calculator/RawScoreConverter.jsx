import React, { useState } from 'react';
import Minus from 'lucide-react/icons/minus';
import Plus from 'lucide-react/icons/plus';
import Info from 'lucide-react/icons/info';
import { RAW_SCORE_TABLES, rawScoreToBand, tableRows } from './calculatorData';
import {
  panelClass,
  railLabelClass,
  segmentActiveClass,
  segmentBaseClass,
  segmentIdleClass,
} from './calculatorStyles';
import { NUM, MICRO, MUTED } from '@/features/dashboard/components/primitives.jsx';

const TEST_KEYS = ['listening', 'readingAcademic', 'readingGeneral'];

function StepButton({ label, icon: Icon, onClick, disabled }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-600 transition-all duration-150 hover:border-[#5a63df]/40 hover:bg-[#f4f3fb] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10"
    >
      <Icon className="h-3.5 w-3.5 stroke-[2.5]" />
    </button>
  );
}

export default function RawScoreConverter() {
  const [testKey, setTestKey] = useState('listening');
  const [raw, setRaw] = useState(30);

  const band = rawScoreToBand(testKey, raw);
  const rows = tableRows(testKey);
  const active = RAW_SCORE_TABLES[testKey];
  const clamp = (n) => Math.max(0, Math.min(40, n));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-5">
      {/* Interactive Conversion Tool */}
      <section className={`${panelClass} lg:col-span-7`}>
        <header
          className="border-b border-[#e4e2f0] p-2.5 dark:border-white/[0.07] sm:p-3"
          role="group"
          aria-label="Select test section for conversion"
        >
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] p-1 dark:border-white/10 dark:bg-[#100f16]">
            {TEST_KEYS.map((key) => {
              const isSelected = testKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setTestKey(key)}
                  className={`flex-1 sm:flex-initial rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#5a63df] text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-[#5a63df] dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {RAW_SCORE_TABLES[key].label}
                </button>
              );
            })}
          </div>
        </header>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="raw-score-slider" className={`${MICRO} ${MUTED}`}>
              Correct answers (out of 40)
            </label>
            <div className="flex items-center gap-2">
              <StepButton
                label="One fewer correct answer"
                icon={Minus}
                onClick={() => setRaw((n) => clamp(n - 1))}
                disabled={raw <= 0}
              />
              <span
                className={`${NUM} w-16 text-center text-2xl font-black text-slate-900 dark:text-white`}
              >
                {raw}
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/40</span>
              </span>
              <StepButton
                label="One more correct answer"
                icon={Plus}
                onClick={() => setRaw((n) => clamp(n + 1))}
                disabled={raw >= 40}
              />
            </div>
          </div>

          <input
            id="raw-score-slider"
            type="range"
            min="0"
            max="40"
            step="1"
            value={raw}
            onChange={(e) => setRaw(parseInt(e.target.value, 10))}
            className="calc-range mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, #5a63df 0%, #5a63df ${(raw / 40) * 100}%, var(--calc-track, #e6e8f5) ${(raw / 40) * 100}%)`,
            }}
          />
          <div
            className={`${NUM} mt-2 flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500`}
          >
            <span>0</span>
            <span>10</span>
            <span>20</span>
            <span>30</span>
            <span>40</span>
          </div>
        </div>

        {/* Result Callout Box */}
        <div
          className="mx-4 mb-4 flex items-center gap-4 rounded-xl border border-[#e4e2f0] bg-[#f9f8fe] p-3.5 dark:border-white/[0.07] dark:bg-white/[0.03] sm:mx-5"
          aria-live="polite"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5a63df] text-white shadow-2xs">
            <strong className={`${NUM} text-xl font-black`}>{band.toFixed(1)}</strong>
          </div>
          <div className="min-w-0">
            <span className={`${MICRO} ${MUTED}`}>Estimated Band · {active.label}</span>
            <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200 sm:text-[13px]">
              <strong className={`${NUM} font-black text-slate-900 dark:text-white`}>{raw}</strong>{' '}
              of 40 correct ≈ Band{' '}
              <strong className={`${NUM} font-black text-[#5a63df] dark:text-violet-300`}>
                {band.toFixed(1)}
              </strong>
              .
            </p>
          </div>
        </div>

        <p className="flex items-start gap-2 border-t border-[#f0eff8] px-4 py-3 text-[11px] font-medium leading-relaxed text-slate-500 dark:border-white/[0.05] dark:text-slate-400 sm:px-5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-2 text-[#5a63df] dark:text-violet-400" />
          <span>
            {active.note} Typical values — official raw thresholds vary slightly between test
            versions based on difficulty.
          </span>
        </p>
      </section>

      {/* Reference Table (Sticky on desktop) */}
      <section className={`${panelClass} lg:col-span-5 lg:sticky lg:top-24 lg:self-start`}>
        <header className="flex items-center justify-between gap-3 border-b border-[#e4e2f0] px-4 py-3 dark:border-white/[0.07] sm:px-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {active.label} Scale
          </h3>
          <span className={`${MICRO} ${MUTED}`}>Correct → Band</span>
        </header>

        <ul className="grid grid-flow-col grid-cols-2 grid-rows-6 gap-x-3 gap-y-1.5 p-3 sm:p-4">
          {rows.map((row) => {
            const isActive = row.band === band.toFixed(1);
            return (
              <li
                key={row.band}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold tabular-nums transition-colors duration-150 ${
                  isActive
                    ? 'border border-[#ded9ff] bg-[#f2f0ff] text-[#5e50ee] font-black dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300'
                    : 'text-slate-600 hover:bg-[#f4f3fb] dark:text-slate-400 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span>{row.range} correct</span>
                <span
                  className={`${NUM} ${isActive ? 'font-black text-[#5e50ee] dark:text-violet-300' : 'text-slate-900 dark:text-white'}`}
                >
                  Band {row.band}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
