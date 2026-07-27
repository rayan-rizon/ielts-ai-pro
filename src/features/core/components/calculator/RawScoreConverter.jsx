import React, { useState } from 'react';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import Info from 'lucide-react/icons/info';
import { RAW_SCORE_TABLES, rawScoreToBand, tableRows } from './calculatorData';

const TEST_KEYS = ['listening', 'readingAcademic', 'readingGeneral'];

export default function RawScoreConverter() {
  const [testKey, setTestKey] = useState('listening');
  const [raw, setRaw] = useState(30);

  const band = rawScoreToBand(testKey, raw);
  const rows = tableRows(testKey);
  const active = RAW_SCORE_TABLES[testKey];

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="h-full rounded-[24px] border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-[0_12px_35px_-12px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
          {/* Test selector */}
          <div
            className="flex flex-wrap gap-2.5"
            role="group"
            aria-label="Select test section for conversion"
          >
            {TEST_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTestKey(key)}
                className={`h-10 rounded-xl px-4 text-xs font-black transition-all duration-200 hover:scale-105 active:scale-95 ${
                  testKey === key
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {RAW_SCORE_TABLES[key].label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <label
                htmlFor="raw-score-slider"
                className="text-[15px] font-extrabold text-slate-950 dark:text-white"
              >
                Correct answers
              </label>
              <span className="text-2xl font-black text-slate-950 dark:text-white">
                {raw}
                <span className="text-sm font-bold text-slate-400"> / 40</span>
              </span>
            </div>
            <input
              id="raw-score-slider"
              type="range"
              min="0"
              max="40"
              step="1"
              value={raw}
              onChange={(e) => setRaw(parseInt(e.target.value, 10))}
              className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-indigo-600 dark:bg-slate-800"
              style={{
                background: `linear-gradient(to right, #5262ef 0%, #5262ef ${(raw / 40) * 100}%, #e2e8f0 ${(raw / 40) * 100}%)`,
              }}
            />
            <div className="mt-2.5 flex justify-between px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>0</span>
              <span>20</span>
              <span>40</span>
            </div>
          </div>

          <div
            className="mt-7 flex items-center gap-5 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-white/90 p-5 dark:border-indigo-500/30 dark:from-indigo-950/80 dark:via-purple-950/60 dark:to-slate-900/90 backdrop-blur-xl shadow-sm"
            aria-live="polite"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25">
              <strong className="text-2xl font-black text-white">{band.toFixed(1)}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Estimated band · {active.label}
              </span>
              <p className="mt-1 text-xs sm:text-[13px] font-bold leading-relaxed text-slate-800 dark:text-slate-200">
                {raw} correct answers converts to approximately Band {band.toFixed(1)}.
              </p>
            </div>
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs font-semibold leading-relaxed text-slate-400 dark:text-slate-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            {active.note} Conversion tables are typical values; exact thresholds vary slightly
            between test versions.
          </p>
        </div>
      </div>

      {/* Reference table */}
      <div className="lg:col-span-5">
        <div className="h-full rounded-[24px] border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-[0_12px_35px_-12px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
          <h3 className="text-[15px] font-extrabold text-slate-950 dark:text-white">
            {active.label}: score to band
          </h3>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
            {rows.map((row) => {
              const isActive = row.band === band.toFixed(1);
              return (
                <li
                  key={row.band}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-[13px] font-extrabold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="tabular-nums">{row.range}</span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />}
                    {row.band}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
