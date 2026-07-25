import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';

const GAUGE_PATH = 'M 26 132 A 94 94 0 0 1 214 132';

function ForecastGauge({ likelihood, available }) {
  const reduceMotion = useReducedMotion();
  const progress = available ? likelihood : 0;

  return (
    <div
      className="relative mx-auto mt-1 h-[125px] w-full max-w-[240px] sm:h-[135px]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 150" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="scorePredictorArc" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#7157f5" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path
          d={GAUGE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="17"
          strokeLinecap="round"
          className="text-slate-100 dark:text-slate-800/80"
        />
        <motion.path
          d={GAUGE_PATH}
          fill="none"
          stroke="url(#scorePredictorArc)"
          strokeWidth="17"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 100 - progress }}
          transition={{ duration: reduceMotion ? 0 : 0.95, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-[8px] text-center flex flex-col items-center">
        <p className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
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

  const outlook = !hasForecast
    ? 'Complete three scored sessions to unlock a personalised forecast.'
    : direction >= 0.25
      ? 'Your recent trend is moving in the right direction. Keep the momentum going.'
      : direction <= -0.25
        ? 'Build a steadier practice rhythm to improve this outlook.'
        : 'Continue your current pace while focusing on your weakest section.';

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950">
        <CardContent className="flex flex-1 flex-col justify-between p-4 sm:p-4.5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                    Score Predictor
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    What can you achieve?
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-violet-200/60 bg-violet-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                PRO
              </span>
            </div>

            <ForecastGauge likelihood={likelihood} available={hasForecast} />

            <div className="text-center mt-1">
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 sm:text-sm">
                  {hasForecast
                    ? `Estimated likelihood of Band ${formatBand(target)}+`
                    : 'Forecast needs more scored practice'}
                </p>
                {hasForecast && direction !== 0 && (
                  <span
                    className={
                      direction > 0
                        ? 'flex items-center text-[10px] font-black text-emerald-600 dark:text-emerald-400'
                        : 'flex items-center text-[10px] font-black text-amber-600 dark:text-amber-400'
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
              <p className="mx-auto mt-1 max-w-xs text-[11px] font-medium leading-normal text-slate-500 dark:text-slate-400 line-clamp-2">
                {outlook}
              </p>
            </div>
          </div>

          <div className="mt-2.5">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-1.5 text-center dark:border-white/5 dark:bg-white/[0.03]">
              {[
                ['Current', hasForecast ? formatBand(current.score) : '—'],
                ['30 Days', hasForecast ? formatBand(projection.score) : '—'],
                ['Evidence', hasForecast ? `${projection.sampleSize} tests` : 'Need 3'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg bg-white py-1.5 px-1 border border-slate-100/80 dark:border-white/5 dark:bg-slate-900/60"
                >
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-black text-slate-950 dark:text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 flex items-center justify-center gap-1 text-[9.5px] font-medium leading-tight text-slate-400">
              <Sparkles className="h-3 w-3 shrink-0 text-violet-500" />
              Conservative trend estimate from scored practice.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
