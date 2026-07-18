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
        <div className="h-full rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:border-white/5 dark:bg-slate-950 dark:shadow-none sm:p-7">
          {/* Test selector */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Select test section for conversion"
          >
            {TEST_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTestKey(key)}
                className={`h-10 rounded-xl px-4 text-[13px] font-extrabold transition-all ${
                  testKey === key
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {RAW_SCORE_TABLES[key].label}
              </button>
            ))}
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-end justify-between">
              <label
                htmlFor="raw-score-slider"
                className="text-[15px] font-extrabold text-slate-800 dark:text-slate-200"
              >
                Correct answers
              </label>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
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
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-primary dark:bg-slate-800"
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
            className="mt-6 flex items-center gap-5 rounded-2xl bg-primary/[0.06] px-5 py-4 dark:bg-white/[0.04]"
            aria-live="polite"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#6256ed] shadow-lg shadow-primary/25">
              <strong className="text-2xl font-black text-white">{band.toFixed(1)}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Estimated band · {active.label}
              </span>
              <p className="mt-1 text-[13px] font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                {raw} correct answers converts to approximately Band {band.toFixed(1)}.
              </p>
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-relaxed text-slate-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {active.note} Conversion tables are typical values; exact thresholds vary slightly
            between test versions.
          </p>
        </div>
      </div>

      {/* Reference table */}
      <div className="lg:col-span-5">
        <div className="h-full rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:border-white/5 dark:bg-slate-950 dark:shadow-none sm:p-7">
          <h3 className="text-[15px] font-extrabold text-slate-800 dark:text-slate-200">
            {active.label}: score to band
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-5 gap-y-1.5">
            {rows.map((row) => {
              const isActive = row.band === band.toFixed(1);
              return (
                <li
                  key={row.band}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] font-bold transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="tabular-nums">{row.range}</span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
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
