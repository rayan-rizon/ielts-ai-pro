import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass, Star, Flag, Calendar, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';

function MarkerTopLabel({ isCurrent, isFinalGoal }) {
  if (!isCurrent && !isFinalGoal) return null;
  return (
    <div className="absolute -top-11 whitespace-nowrap z-30" data-oid="90agmhg">
      {isCurrent && (
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          data-oid="kp4mko9"
        >
          <Badge
            className="bg-indigo-600 dark:bg-indigo-500 text-[10px] text-white border-0 font-black px-3 py-1 rounded-full shadow-lg shadow-indigo-500/30 tracking-[0.1em]"
            data-oid="npy:uyn"
          >
            Where You Are
          </Badge>
        </motion.div>
      )}
      {isFinalGoal && (
        <Badge
          className="bg-rose-500 text-[10px] text-white border-0 font-black px-3 py-1 rounded-full shadow-lg shadow-rose-500/40 tracking-[0.1em] ring-2 ring-rose-500/20"
          data-oid="q3kdcug"
        >
          Your Goal
        </Badge>
      )}
    </div>
  );
}

function MarkerPin({ isCurrent, isFinalGoal }) {
  if (!isCurrent && !isFinalGoal) return null;
  return (
    <div
      className={cn(
        'absolute -top-6 w-px h-10 z-10 transition-colors duration-500',
        isCurrent
          ? 'bg-gradient-to-b from-indigo-500 to-indigo-500/20'
          : 'bg-gradient-to-b from-rose-500 to-rose-500/20'
      )}
      data-oid="zklq9qo"
    />
  );
}

function MarkerNode({ isPast, isCurrent, isFinalGoal, isFuture, band }) {
  return (
    <motion.div
      whileHover={{ scale: 1.15, rotate: 5 }}
      className={cn(
        'relative z-20 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl border-2',
        isPast &&
          'bg-emerald-500 border-white dark:border-slate-900 text-white shadow-emerald-500/20',
        isCurrent &&
          'bg-indigo-600 dark:bg-indigo-500 border-white dark:border-slate-900 text-white shadow-2xl shadow-indigo-500/50 ring-4 ring-indigo-500/15 scale-110',
        isFinalGoal &&
          'bg-white dark:bg-slate-800 border-rose-500 text-rose-500 shadow-xl shadow-rose-500/20 scale-105',
        isFuture &&
          'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-400'
      )}
      data-oid="6lq9osa"
    >
      {isPast ? (
        <Star className="w-5 h-5 fill-white" data-oid="d_x2q:c" />
      ) : isFinalGoal ? (
        <Flag className="w-5 h-5 fill-rose-500/10" data-oid="mra6sa3" />
      ) : (
        <span
          className={cn(
            'text-sm font-black',
            isCurrent ? 'text-white' : 'text-slate-500 dark:text-slate-400'
          )}
          data-oid="03ywjra"
        >
          {band}
        </span>
      )}
    </motion.div>
  );
}

function MarkerCaption({ isPast, isCurrent, isFinalGoal, isFuture, band }) {
  return (
    <div className="mt-2 text-center" data-oid="_gflt84">
      <p
        className={cn(
          'text-[11px] font-black tracking-[0.15em] transition-colors',
          isPast && 'text-emerald-500 opacity-90',
          isCurrent && 'text-indigo-600 dark:text-indigo-400',
          isFinalGoal && 'text-rose-500',
          isFuture && 'text-slate-400 opacity-50 font-bold'
        )}
        data-oid="h-_:ayy"
      >
        {isPast
          ? 'Achieved'
          : isCurrent
            ? `Band ${formatBand(band)}`
            : isFinalGoal
              ? `Goal`
              : `Band ${band}`}
      </p>
    </div>
  );
}

function MarkerTooltipContent({ isPast, isCurrent, isFinalGoal, band }) {
  return (
    <TooltipContent
      side="bottom"
      className="bg-slate-900 text-white border-0 py-2 px-3 rounded-xl shadow-2xl"
    >
      <div className="text-[10px] font-bold space-y-1">
        <p className="tracking-widest text-slate-400">Milestone Details</p>
        <p className="text-sm font-black">Band {formatBand(band)} Mastery</p>
        <p className="font-medium text-slate-300">
          {isPast
            ? 'Great job! You have reached this level.'
            : isCurrent
              ? 'Your current skill level.'
              : isFinalGoal
                ? 'Your final target score.'
                : `Your next target.`}
        </p>
      </div>
    </TooltipContent>
  );
}

function MilestoneMarker({ band, achieved, current, isTarget }) {
  const isPast = achieved && !current;
  const isFuture = !achieved && !current && !isTarget;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: band * 0.05 + 0.5 }}
            className="relative flex flex-col items-center group/marker min-w-[70px] cursor-default"
            data-oid="jx9f0.s"
          >
            <MarkerTopLabel isCurrent={current} isFinalGoal={isTarget} />
            <MarkerPin isCurrent={current} isFinalGoal={isTarget} />
            <MarkerNode
              isPast={isPast}
              isCurrent={current}
              isFinalGoal={isTarget}
              isFuture={isFuture}
              band={band}
            />
            <MarkerCaption
              isPast={isPast}
              isCurrent={current}
              isFinalGoal={isTarget}
              isFuture={isFuture}
              band={band}
            />
          </motion.div>
        </TooltipTrigger>
        <MarkerTooltipContent
          isPast={isPast}
          isCurrent={current}
          isFinalGoal={isTarget}
          band={band}
        />
      </Tooltip>
    </TooltipProvider>
  );
}

function JourneyHeader({ targetBand, estimatedDays }) {
  return (
    <CardHeader className="p-5 pb-2 relative z-10" data-oid="jcj5vnw">
      <div className="flex items-center justify-between gap-4" data-oid="-zy2wbx">
        <div className="flex items-center gap-4" data-oid="e_y5zp5">
          <div
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-primary flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0 transform group-hover:rotate-6 transition-transform duration-500"
            data-oid="r3_d1rn"
          >
            <Compass className="w-6 h-6 text-white" data-oid="q1ru8ig" />
          </div>
          <div className="space-y-1.5" data-oid="58qle6d">
            <CardTitle
              className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none"
              data-oid="1s0z7hy"
            >
              Your Goal Path
            </CardTitle>
            <div className="flex items-center gap-2" data-oid="7vd9e:5">
              <div
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                data-oid="-7hzl8k"
              />
              <p
                className="text-[11px] font-black text-slate-400 tracking-[0.2em]"
                data-oid=":3qmtfi"
              >
                Personalized for You
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3" data-oid="pitbrk0">
          <div className="hidden sm:flex flex-col items-end" data-oid="cu4ehu1">
            <span className="text-[10px] font-black text-slate-400 tracking-widest">
              Target Score
            </span>
            <span className="text-lg font-black text-rose-500 leading-tight">
              Band {targetBand}
            </span>
          </div>
          <div className="w-px h-8 bg-border/40 hidden sm:block" data-oid="divider" />
          <div className="flex flex-col items-end" data-oid="b-e_lmw">
            <span className="text-[10px] font-black text-slate-400 tracking-widest">
              Estimated Arrival
            </span>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
              <span className="text-lg font-black leading-tight">
                {estimatedDays ? `${estimatedDays} Days` : 'TBD'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  );
}

function JourneyRoadmap({ progressPercentage, milestones }) {
  return (
    <div className="relative w-full pt-12 pb-6 px-4 mb-1" data-oid="-_8scpc">
      <div
        className="absolute top-[2.25rem] left-8 right-8 h-2 bg-slate-100 dark:bg-white/5 rounded-full"
        data-oid="9xqxgwm"
      />
      <div
        className="absolute top-[2.25rem] left-8 right-8 h-2 overflow-hidden rounded-full"
        data-oid="0mxp45o"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          className="h-full bg-gradient-to-r from-cyan-400 via-sky-500 to-primary shadow-[0_0_20px_rgba(56,189,248,0.4)]"
          data-oid="pnk3jmi"
        />
      </div>
      <div className="relative flex justify-between items-start select-none" data-oid="j3o-tse">
        {milestones.map((milestone) => (
          <MilestoneMarker key={milestone.band} {...milestone} data-oid="df84:1l" />
        ))}
      </div>
    </div>
  );
}

function JourneyGauge({ progressPercentage }) {
  return (
    <div
      className="md:col-span-2 flex flex-col items-center justify-center relative select-none group/gauge"
      data-oid="radial-gauge-container"
    >
      <div
        className="relative w-44 h-44 flex items-center justify-center transform group-hover/gauge:scale-105 transition-transform duration-500"
        data-oid="gauge-wrapper"
      >
        <svg
          className="w-44 h-44 transform -rotate-90 overflow-visible filter drop-shadow-[0_4px_16px_rgba(99,102,241,0.15)]"
          viewBox="0 0 100 100"
          data-oid="gauge-svg"
        >
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#7f8cff" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-slate-100 dark:stroke-slate-800 fill-none"
            strokeWidth="8"
            data-oid="gauge-base"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#progressGrad)"
            className="fill-none opacity-40 blur-[4px]"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 263.89 }}
            animate={{
              strokeDashoffset: 263.89 - (263.89 * progressPercentage) / 100,
            }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            strokeDasharray="263.89"
            data-oid="gauge-glow"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#progressGrad)"
            className="fill-none drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 263.89 }}
            animate={{
              strokeDashoffset: 263.89 - (263.89 * progressPercentage) / 100,
            }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            strokeDasharray="263.89"
            data-oid="gauge-progress"
          />
        </svg>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center mt-0.5"
          data-oid="gauge-readout"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.6 }}
            className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight leading-none drop-shadow-sm"
            data-oid="gauge-percentage"
          >
            {progressPercentage}%
          </motion.span>
          <span
            className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1.5"
            data-oid="gauge-sublabel"
          >
            Reached
          </span>
        </div>
      </div>
    </div>
  );
}

function JourneyChecklist({ recommendations }) {
  return (
    <div
      className="md:col-span-3 flex flex-col justify-center space-y-3"
      data-oid="pathway-focus-container"
    >
      <div className="space-y-0.5" data-oid="pathway-header">
        <div className="flex items-center gap-2" data-oid="pathway-title-row">
          <Badge
            className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-0 font-black px-1.5 py-0.5 text-[8px] uppercase tracking-wider rounded-md"
            data-oid="pathway-badge"
          >
            Action Plan
          </Badge>
        </div>
        <h4
          className="text-sm font-black text-slate-850 dark:text-white tracking-tight"
          data-oid="pathway-heading"
        >
          Milestone Focus Areas
        </h4>
      </div>

      <div className="space-y-3" data-oid="pathway-checklist">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.1, duration: 0.4 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-white/5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-indigo-500/30 group/step cursor-default"
            data-oid={`pathway-step-${idx}`}
          >
            <div
              className="mt-0.5 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 transition-all duration-300 group-hover/step:bg-indigo-100 dark:group-hover/step:bg-indigo-500/20 ring-1 ring-indigo-500/20"
              data-oid={`pathway-step-check-${idx}`}
            >
              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[3px]" />
            </div>
            <p
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed group-hover/step:text-slate-900 dark:group-hover:text-white transition-colors pt-0.5"
              data-oid={`pathway-step-text-${idx}`}
            >
              {rec}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EmptyJourneyState() {
  return (
    <div className="mt-auto pt-4" data-oid="insights">
      <div
        className="rounded-2xl border border-dashed border-border/40 bg-muted/10 p-5 flex flex-col items-center justify-center text-center space-y-3"
        data-oid="empty-internal"
      >
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
          <Star className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
        </div>
        <div className="max-w-sm space-y-1">
          <h4 className="text-sm font-black text-foreground">Begin Your Journey</h4>
          <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
            Take your first practice test to unlock your personalized band score predictions on this
            roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BandScoreJourney({
  currentScore,
  targetScore,
  testHistory = [],
  testDate,
  studyPace = 'moderate',
}) {
  const journeyData = useMemo(() => {
    const milestones = [5.0, 6.0, 7.0, 8.0, 9.0];
    const currentBand = Math.floor(Number(currentScore) * 10) / 10 || 0;
    const targetBand = Math.floor(Number(targetScore) * 10) / 10 || 7.5;

    const targetExamDate = testDate ? new Date(testDate) : null;
    const today = new Date();
    let estimatedDays = null;
    let isScheduled = false;

    if (targetExamDate && targetExamDate > today) {
      const diffTime = targetExamDate.getTime() - today.getTime();
      estimatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isScheduled = true;
    } else if (testHistory && testHistory.length > 0) {
      const scoreGap = Math.max(0, targetBand - currentBand);
      const daysPerBand = studyPace === 'intensive' ? 90 : studyPace === 'moderate' ? 180 : 270;
      estimatedDays = Math.ceil(scoreGap * daysPerBand);
      if (scoreGap <= 0 && currentBand > 0) estimatedDays = 14;
    }

    const progressPercentage =
      targetBand > 0 ? Math.min(100, Math.round((currentBand / targetBand) * 100)) : 0;
    const nextMilestoneBand = milestones.find((m) => m > currentBand) ?? targetBand;

    const milestoneData = milestones.map((band) => {
      const isAchieved = currentBand >= band;
      const isCurrentPoint = Math.abs(currentBand - band) < 0.3;
      const isAimingFor = Math.abs(targetBand - band) < 0.3;

      return {
        band,
        achieved: isAchieved,
        current: isCurrentPoint,
        isTarget: isAimingFor,
      };
    });

    return {
      milestones: milestoneData,
      progressPercentage,
      estimatedDays,
      isScheduled,
      currentBand,
      targetBand,
      nextMilestoneBand,
      scoreGap: Math.max(0, targetBand - currentBand),
    };
  }, [currentScore, targetScore, testHistory, testDate, studyPace]);

  const recommendations = useMemo(() => {
    const band = journeyData.currentBand;
    if (band === 0) return [];
    if (band < 5.0) {
      return [
        'Strengthen core sentence structures & basic grammar rules.',
        'Build topic-based vocabulary lists with standard academic synonyms.',
        'Practice listening to slow, clear English monologues & conversations.',
      ];
    }
    if (band < 6.0) {
      return [
        'Practice cohesive devices & linking words in Writing Task 1 & 2.',
        'Enhance Speaking fluency by recording and self-analyzing your answers.',
        'Learn key skimming & scanning strategies for complex Reading paragraphs.',
      ];
    }
    if (band < 7.0) {
      return [
        'Master complex grammar structures and actively reduce lexical errors.',
        'Address writing prompt criteria directly with strong, clear thesis claims.',
        'Practice reading under strict timing constraints to build pace.',
      ];
    }
    return [
      'Refine lexical resource using highly natural, advanced academic collocations.',
      'Develop sophisticated discourse markers to sound more spontaneous.',
      'Analyze subtle semantic nuances in high-tier Reading test tasks.',
    ];
  }, [journeyData.currentBand]);

  if (!journeyData.currentBand && !journeyData.targetBand) return null;

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid=".q.oeea">
      <Card
        className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/80 shadow-xl min-h-[350px] h-full flex flex-col relative group transition-all duration-500 hover:shadow-2xl hover:border-indigo-500/30 overflow-hidden"
        data-oid="c:6z8yh"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-rose-500/5 opacity-50 dark:opacity-20 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"
          data-oid="hfqtprc"
        />

        <JourneyHeader
          targetBand={journeyData.targetBand}
          estimatedDays={journeyData.estimatedDays}
        />

        <CardContent
          className="p-4 pt-1 flex-1 flex flex-col justify-between relative z-10"
          data-oid="4f9_.49"
        >
          <JourneyRoadmap
            progressPercentage={journeyData.progressPercentage}
            milestones={journeyData.milestones}
          />

          {journeyData.currentBand > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
              className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-8 py-6 my-2 border-t border-b border-slate-100/80 dark:border-white/5 relative items-center justify-between"
              data-oid="trajectory-visualizer"
            >
              <JourneyGauge progressPercentage={journeyData.progressPercentage} />
              <JourneyChecklist recommendations={recommendations} />
            </motion.div>
          )}

          {journeyData.currentBand === 0 && <EmptyJourneyState />}
        </CardContent>
      </Card>
    </motion.div>
  );
}
