import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bot, Flag, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';
import { buildJourneyMilestones, isBand } from './bandJourneyUtils';

function positionSteps(steps) {
  const values = steps.map((step) => step.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(0.5, maxValue - minValue);

  return steps.map((step, index) => ({
    ...step,
    x: steps.length === 1 ? 50 : 9 + (index * 82) / (steps.length - 1),
    y: Math.max(24, Math.min(78, 76 - ((step.value - minValue) / range) * 50)),
  }));
}

function smoothPath(points) {
  if (!points.length) return '';
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const control = Math.max(5, (point.x - previous.x) * 0.45);
    return `${path} C ${previous.x + control} ${previous.y}, ${point.x - control} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function MilestoneLabel({ step, isCurrent, isTarget, isFuture }) {
  const tone = isCurrent
    ? 'text-violet-700 dark:text-violet-200'
    : isTarget
      ? 'text-slate-950 dark:text-white'
      : isFuture
        ? 'text-emerald-600 dark:text-emerald-300'
        : 'text-blue-600 dark:text-blue-300';

  return (
    <div
      className={cn(
        'absolute left-1/2 w-16 -translate-x-1/2 text-center sm:w-28',
        isCurrent || isTarget ? 'top-full mt-3' : 'bottom-full mb-3'
      )}
    >
      <p className={cn('text-[15px] font-black leading-none tracking-tight sm:text-xl', tone)}>
        {formatBand(step.value)}
      </p>
      <p className="mt-1 text-[8px] font-extrabold leading-tight text-slate-500 dark:text-slate-400 sm:mt-1.5 sm:text-[10px]">
        {step.label}
      </p>
    </div>
  );
}

function CurrentMarker() {
  return (
    <div
      className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 flex-col items-center"
      aria-hidden="true"
    >
      <Bot className="h-6 w-6 rounded-full bg-violet-100 p-1 text-violet-600 shadow-sm dark:bg-violet-500/15 dark:text-violet-200 sm:h-8 sm:w-8 sm:p-1.5" />
      <span className="-mt-1 h-3 w-1 rounded-full bg-violet-300 dark:bg-violet-500/40 sm:h-4 sm:w-1.5" />
    </div>
  );
}

function TargetMarker() {
  return (
    <div
      className="absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 flex-col items-center"
      aria-hidden="true"
    >
      <Flag className="h-6 w-6 fill-amber-400 text-amber-500 sm:h-8 sm:w-8" strokeWidth={2.2} />
      <span className="-mt-1 h-4 w-1 rounded-full bg-amber-400 sm:h-5 sm:w-1.5" />
    </div>
  );
}

export default function BandScoreJourney({ currentScore, targetScore, testHistory = [] }) {
  const reduceMotion = useReducedMotion();
  const journey = useMemo(() => {
    const validHistory = testHistory.filter((item) => isBand(item?.score));
    const current = isBand(currentScore) ? Number(currentScore) : 0;
    const target = isBand(targetScore) && Number(targetScore) > 0 ? Number(targetScore) : 7;
    const baseline = validHistory.length ? Number(validHistory[0].score) : current;
    const steps = positionSteps(buildJourneyMilestones({ baseline, current, target }));
    const currentIndex = Math.max(
      0,
      steps.findIndex((step) => step.keys.includes('current'))
    );

    return {
      current,
      steps,
      currentIndex,
      fullPath: smoothPath(steps),
      reachedPath: smoothPath(steps.slice(0, currentIndex + 1)),
      futurePath: smoothPath(steps.slice(currentIndex)),
    };
  }, [currentScore, targetScore, testHistory]);

  if (!journey.current) {
    return (
      <motion.div variants={ITEM_VARIANTS} className="h-full">
        <Card className="h-full rounded-[22px] border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950">
          <CardContent className="flex min-h-60 flex-col items-center justify-center text-center">
            <Sparkles className="mb-3 h-8 w-8 text-indigo-300" />
            <p className="font-bold text-slate-900 dark:text-white">
              Your journey starts with a scored test
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Complete any IELTS module to establish a real baseline.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="h-full overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-[0_16px_45px_-34px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-slate-950">
        <CardHeader className="px-5 pb-0 pt-5 sm:px-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <div>
              <CardTitle className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Your Band Journey
              </CardTitle>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Your personalised path to success
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-3 pb-5 pt-3 sm:px-5">
          <div className="overflow-hidden pb-2">
            <div
              className="relative h-[250px] min-w-0 sm:h-[300px]"
              data-testid="band-journey-path"
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="journeyReached" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#7057f5" />
                  </linearGradient>
                  <linearGradient id="journeyFuture" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#54c987" />
                    <stop offset="72%" stopColor="#54c987" />
                    <stop offset="100%" stopColor="#f5a623" />
                  </linearGradient>
                </defs>
                <path
                  d={journey.fullPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="text-slate-100 dark:text-white/10"
                />
                <motion.path
                  d={journey.reachedPath}
                  fill="none"
                  stroke="url(#journeyReached)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.85, ease: 'easeOut' }}
                />
                {journey.futurePath ? (
                  <motion.path
                    d={journey.futurePath}
                    fill="none"
                    stroke="url(#journeyFuture)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="7 7"
                    vectorEffect="non-scaling-stroke"
                    pathLength="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      delay: reduceMotion ? 0 : 0.55,
                      duration: reduceMotion ? 0 : 0.8,
                      ease: 'easeOut',
                    }}
                  />
                ) : null}
              </svg>

              {journey.steps.map((step, index) => {
                const isCurrent = step.keys.includes('current');
                const isTarget = step.keys.includes('target');
                const isBaseline = step.keys.includes('baseline');
                const isFuture = index > journey.currentIndex;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: reduceMotion ? 0 : index * 0.09,
                      type: 'spring',
                      stiffness: 240,
                    }}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${step.x}%`, top: `${step.y}%` }}
                  >
                    {isCurrent ? <CurrentMarker /> : null}
                    {isTarget ? <TargetMarker /> : null}
                    <MilestoneLabel
                      step={step}
                      isCurrent={isCurrent}
                      isTarget={isTarget}
                      isFuture={isFuture}
                    />
                    <div
                      className={cn(
                        'relative flex h-8 w-8 items-center justify-center rounded-full border-4 shadow-md sm:h-10 sm:w-10 sm:border-[5px]',
                        isCurrent
                          ? 'h-10 w-10 border-violet-200 bg-violet-600 ring-6 ring-violet-100/80 dark:border-violet-800 dark:ring-violet-500/10 sm:h-12 sm:w-12 sm:ring-8'
                          : isTarget
                            ? 'border-amber-200 bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-500/10'
                            : isBaseline
                              ? 'border-slate-200 bg-slate-400 ring-4 ring-slate-100 dark:border-slate-700 dark:ring-white/5'
                              : isFuture
                                ? 'border-emerald-200 bg-emerald-500 ring-4 ring-emerald-100 dark:border-emerald-800 dark:ring-emerald-500/10'
                                : 'border-blue-200 bg-blue-500 ring-4 ring-blue-100 dark:border-blue-800 dark:ring-blue-500/10'
                      )}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-white" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
