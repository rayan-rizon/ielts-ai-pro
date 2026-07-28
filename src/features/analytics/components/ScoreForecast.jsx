import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';

const GAUGE_PATH = 'M 18 132 A 102 102 0 0 1 222 132';

function ForecastGauge({ likelihood, available }) {
  const reduceMotion = useReducedMotion();
  const progress = available ? likelihood : 0;

  return (
    <div
      className="relative mx-auto my-2 h-[165px] w-full max-w-[290px] sm:h-[180px]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 145" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="scorePredictorArcGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <path
          d={GAUGE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="22"
          strokeLinecap="round"
          className="text-slate-100 dark:text-slate-800"
        />
        <motion.path
          d={GAUGE_PATH}
          fill="none"
          stroke="url(#scorePredictorArcGrad)"
          strokeWidth="22"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 100 - progress }}
          transition={{ duration: reduceMotion ? 0 : 0.95, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-[12px] text-center flex flex-col items-center justify-center">
        <p className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl leading-none">
          {available ? `${progress}%` : '—'}
        </p>
      </div>
    </div>
  );
}

export default function ScoreForecast({ forecastData = [], targetScore }) {
  const projection = useMemo(
    () => forecastData.find((point) => point.date === '+30 Days') || null,
    [forecastData]
  );
  const current = useMemo(
    () => forecastData.find((point) => point.date === 'Now') || null,
    [forecastData]
  );
  const hasForecast = Boolean(
    projection && current && Number.isFinite(projection.targetLikelihood)
  );
  const target = Number(targetScore) || 7;
  const likelihood = hasForecast ? projection.targetLikelihood : 0;
  const direction = hasForecast ? Number(projection.score) - Number(current.score) : 0;

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950">
        <CardContent className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div className="flex flex-col flex-1 justify-between">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
                    Score Predictor
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Target reach probability
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                PRO
              </span>
            </div>

            <ForecastGauge likelihood={likelihood} available={hasForecast} />

            <div className="text-center my-1">
              <div className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200/70 bg-gradient-to-r from-indigo-50/40 to-slate-50/60 px-3.5 py-1.5 dark:border-white/10 dark:from-indigo-950/30 dark:to-slate-900/50">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {hasForecast
                    ? `Likelihood of Band ${formatBand(target)}+`
                    : 'Forecast needs more practice'}
                </p>
                {hasForecast && direction !== 0 && (
                  <span
                    className={
                      direction > 0
                        ? 'inline-flex items-center text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400'
                        : 'inline-flex items-center text-[10.5px] font-bold text-amber-600 dark:text-amber-400'
                    }
                  >
                    {direction > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {direction > 0 ? `+${direction.toFixed(1)}` : direction.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full pt-2">
            {[
              ['Current', hasForecast ? formatBand(current.score) : '—'],
              ['30 Days', hasForecast ? formatBand(projection.score) : '—'],
              ['Evidence', hasForecast ? `${projection.sampleSize} tests` : 'Need 3'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-gradient-to-b from-indigo-50/30 via-slate-50/50 to-slate-50/30 py-2.5 px-1 text-center dark:border-white/10 dark:from-indigo-950/20 dark:via-slate-900/40 dark:to-slate-950/60"
              >
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                  {label}
                </span>
                <span className="mt-0.5 truncate text-sm font-bold text-slate-950 dark:text-white">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
