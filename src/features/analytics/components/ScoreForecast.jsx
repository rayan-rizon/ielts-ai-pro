import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';

const GAUGE_PATH = 'M 26 132 A 94 94 0 0 1 214 132';

function ForecastGauge({ likelihood, available }) {
  const reduceMotion = useReducedMotion();
  const progress = available ? likelihood : 0;

  return (
    <div className="relative mx-auto mt-4 h-[188px] w-full max-w-[320px]" aria-hidden="true">
      <svg viewBox="0 0 240 150" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="scorePredictorArc" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#6246ea" />
            <stop offset="100%" stopColor="#b86cf5" />
          </linearGradient>
        </defs>
        <path
          d={GAUGE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="13"
          strokeLinecap="round"
          className="text-violet-50 dark:text-white/10"
        />
        <motion.path
          d={GAUGE_PATH}
          fill="none"
          stroke="url(#scorePredictorArc)"
          strokeWidth="13"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 100 - progress }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-[14px] text-center">
        <p className="text-6xl font-black tracking-[-0.06em] text-violet-600 dark:text-violet-300 sm:text-7xl">
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
      <Card className="flex h-full min-h-[350px] flex-col overflow-hidden rounded-[22px] border-violet-100 bg-white shadow-[0_16px_45px_-34px_rgba(15,23,42,0.55)] dark:border-violet-500/20 dark:bg-slate-950">
        <CardContent className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-xl">
                Score Predictor
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                What can you achieve?
              </p>
            </div>
            <span className="rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              Premium
            </span>
          </div>

          <ForecastGauge likelihood={likelihood} available={hasForecast} />

          <div className="text-center">
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 sm:text-base">
              {hasForecast
                ? `Estimated likelihood of Band ${formatBand(target)}+`
                : 'Forecast needs more scored practice'}
            </p>
            <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              {outlook}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-violet-100 rounded-2xl border border-violet-100 bg-violet-50/50 px-2 py-3 text-center dark:divide-violet-500/15 dark:border-violet-500/15 dark:bg-violet-500/5">
            {[
              ['Current', hasForecast ? formatBand(current.score) : '—'],
              ['30 days', hasForecast ? formatBand(projection.score) : '—'],
              ['Evidence', hasForecast ? `${projection.sampleSize} tests` : 'Need 3'],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 px-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {label}
                </p>
                <p className="mt-1 truncate text-xs font-black text-slate-800 dark:text-slate-100">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[10px] font-medium leading-relaxed text-slate-400">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />A conservative trend
            estimate from completed scored practice, not an official IELTS prediction.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
