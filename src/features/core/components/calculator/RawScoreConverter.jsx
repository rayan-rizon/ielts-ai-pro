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

const TEST_KEYS = ['listening', 'readingAcademic', 'readingGeneral'];

function StepButton({ label, icon: Icon, onClick, disabled }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#e3e5f5] bg-white text-[#5c6687] transition-colors duration-150 hover:border-[#c9c6f7] hover:text-[#6256ef] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-violet-400/30 dark:hover:text-violet-300"
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
      <section className={`${panelClass} lg:col-span-7`}>
        <header
          className="flex flex-wrap gap-1.5 border-b border-[#eceef8] px-4 py-3 dark:border-white/8 sm:px-5"
          role="group"
          aria-label="Select test section for conversion"
        >
          {TEST_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={testKey === key}
              onClick={() => setTestKey(key)}
              className={`${segmentBaseClass} ${testKey === key ? segmentActiveClass : segmentIdleClass}`}
            >
              {RAW_SCORE_TABLES[key].label}
            </button>
          ))}
        </header>

        <div className="px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="raw-score-slider" className={railLabelClass}>
              Correct answers
            </label>
            <div className="flex items-center gap-2">
              <StepButton
                label="One fewer correct answer"
                icon={Minus}
                onClick={() => setRaw((n) => clamp(n - 1))}
                disabled={raw <= 0}
              />
              <span className="w-[62px] text-center text-[22px] font-black leading-none tabular-nums tracking-[-0.045em] text-[#0b1230] dark:text-white">
                {raw}
                <span className="text-[13px] font-bold text-[#9aa2ba] dark:text-slate-500">
                  /40
                </span>
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
            className="calc-range mt-3.5 h-1.5 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, #6256ef 0%, #6256ef ${(raw / 40) * 100}%, var(--calc-track) ${(raw / 40) * 100}%)`,
            }}
          />
          <div className="mt-2 flex justify-between text-[10px] font-black tabular-nums tracking-[0.1em] text-[#a3aabf] dark:text-slate-600">
            <span>0</span>
            <span>20</span>
            <span>40</span>
          </div>
        </div>

        <div
          className="flex items-center gap-4 border-t border-[#f1f2f9] bg-[#f8f8fe] px-4 py-3.5 dark:border-white/6 dark:bg-white/[0.03] sm:px-5"
          aria-live="polite"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-[#6256ef]">
            <strong className="text-[19px] font-black tabular-nums tracking-[-0.04em] text-white">
              {band.toFixed(1)}
            </strong>
          </div>
          <div className="min-w-0">
            <span className={railLabelClass}>Estimated band · {active.label}</span>
            <p className="mt-1 text-[12.5px] font-semibold leading-5 text-[#2c3757] dark:text-slate-300">
              {raw} of 40 correct ≈ Band {band.toFixed(1)}.
            </p>
          </div>
        </div>

        <p className="flex items-start gap-2 px-4 py-3 text-[11.5px] font-medium leading-5 text-[#7b84a1] dark:text-slate-500 sm:px-5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-2 text-[#6256ef] dark:text-violet-400" />
          <span>
            {active.note} Typical values — thresholds vary slightly between test versions.
          </span>
        </p>
      </section>

      {/* Reference table */}
      <section className={`${panelClass} lg:col-span-5`}>
        <header className="flex items-baseline justify-between gap-3 border-b border-[#eceef8] px-4 py-3 dark:border-white/8 sm:px-5">
          <h3 className="text-[13px] font-extrabold tracking-[-0.015em] text-[#0b1230] dark:text-white">
            {active.label}
          </h3>
          <span className={railLabelClass}>Correct → band</span>
        </header>
        <ul className="grid grid-flow-col grid-cols-2 grid-rows-6 gap-x-3 px-4 py-2 sm:px-5">
          {rows.map((row) => {
            const isActive = row.band === band.toFixed(1);
            return (
              <li
                key={row.band}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] font-bold tabular-nums transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#f2f0ff] text-[#5e50ee] dark:bg-violet-500/[0.12] dark:text-violet-300'
                    : 'text-[#5c6687] hover:bg-[#f6f7fc] dark:text-slate-400 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span>{row.range}</span>
                <span className={isActive ? 'font-black' : 'font-extrabold'}>{row.band}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
