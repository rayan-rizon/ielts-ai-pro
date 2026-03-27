import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass, Star, Flag, Activity, Calendar, Zap, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';

function MilestoneMarker({ band, achieved, current, isTarget }) {
  const isPast = achieved && !current;
  const isCurrent = current;
  const isFinalGoal = isTarget;
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
            {/* Top Indicator Label */}
            <div className="absolute -top-11 whitespace-nowrap z-30" data-oid="90agmhg">
              {isCurrent && (
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  data-oid="kp4mko9"
                >
                  <Badge
                    className="bg-indigo-600 text-[10px] text-white border-0 font-black px-3 py-1 rounded-full shadow-lg shadow-indigo-500/30 uppercase tracking-[0.1em]"
                    data-oid="npy:uyn"
                  >
                    You are here
                  </Badge>
                </motion.div>
              )}
              {isFinalGoal && (
                <Badge
                  className="bg-rose-500 text-[10px] text-white border-0 font-black px-3 py-1 rounded-full shadow-lg shadow-rose-500/40 uppercase tracking-[0.1em] ring-2 ring-rose-500/20"
                  data-oid="q3kdcug"
                >
                  Your Goal
                </Badge>
              )}
            </div>

            {/* Pin Visual */}
            {(isCurrent || isFinalGoal) && (
              <div
                className={cn(
                  'absolute -top-6 w-px h-10 z-10 transition-colors duration-500',
                  isCurrent
                    ? 'bg-gradient-to-b from-indigo-500 to-indigo-500/20'
                    : 'bg-gradient-to-b from-rose-500 to-rose-500/20'
                )}
                data-oid="zklq9qo"
              />
            )}

            {/* Node */}
            <motion.div
              whileHover={{ scale: 1.15, rotate: 5 }}
              className={cn(
                'relative z-20 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl border-2',
                isPast &&
                  'bg-emerald-500 border-white dark:border-slate-900 text-white shadow-emerald-500/20',
                isCurrent &&
                  'bg-indigo-600 border-white dark:border-slate-900 text-white shadow-2xl shadow-indigo-500/50 ring-4 ring-indigo-500/15 scale-110',
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

            {/* Static Label Below */}
            <div className="mt-2 text-center" data-oid="_gflt84">
              <p
                className={cn(
                  'text-[11px] font-black uppercase tracking-[0.15em] transition-colors',
                  isPast && 'text-emerald-500 opacity-90',
                  isCurrent && 'text-indigo-600 dark:text-indigo-400',
                  isFinalGoal && 'text-rose-500',
                  isFuture && 'text-slate-400 opacity-50 font-bold'
                )}
                data-oid="h-_:ayy"
              >
                {isPast
                  ? 'Mastered'
                  : isCurrent
                    ? `Band ${formatBand(band)}`
                    : isFinalGoal
                      ? `Target`
                      : `Band ${band}`}
              </p>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-slate-900 text-white border-0 py-2 px-3 rounded-xl shadow-2xl"
        >
          <div className="text-[10px] font-bold space-y-1">
            <p className="uppercase tracking-widest text-slate-400">Milestone Details</p>
            <p className="text-sm font-black">Band {formatBand(band)} Mastery</p>
            <p className="font-medium text-slate-300">
              {isPast
                ? 'Great job! You have surpassed this level.'
                : isCurrent
                  ? 'Your current skill level based on recent tests.'
                  : isFinalGoal
                    ? 'Your ultimate target score for the exam.'
                    : `Focus on hitting this milestone in ${band + 1} more points.`}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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

    // Use onboarding date if provided, otherwise estimate
    const targetExamDate = testDate ? new Date(testDate) : null;
    const today = new Date();
    let estimatedDays = null;
    let isScheduled = false;

    if (targetExamDate && targetExamDate > today) {
      const diffTime = targetExamDate.getTime() - today.getTime();
      estimatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isScheduled = true;
    } else if (testHistory && testHistory.length > 0) {
      // Standard estimation based on research (approx 150-200 study hours per band)
      const scoreGap = Math.max(0, targetBand - currentBand);

      // Intensive: ~3 months per band | Moderate: ~6 months per band | Casual: ~9 months per band
      const daysPerBand = studyPace === 'intensive' ? 90 : studyPace === 'moderate' ? 180 : 270;
      estimatedDays = Math.ceil(scoreGap * daysPerBand);

      // Minimum "Safety Buffer" if they are at their target
      if (scoreGap <= 0 && currentBand > 0) estimatedDays = 14;
    }

    // Bug fix: actual progress as % of target, not hardcoded
    const progressPercentage =
      targetBand > 0 ? Math.min(100, Math.round((currentBand / targetBand) * 100)) : 0;

    // Bug fix: find the actual next milestone above currentBand
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

  if (!journeyData.currentBand && !journeyData.targetBand) return null;

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid=".q.oeea">
      <Card
        className="rounded-3xl border border-border/40 bg-white dark:bg-slate-950 shadow-xl min-h-[420px] h-full flex flex-col relative group transition-all duration-500 hover:shadow-2xl hover:border-indigo-500/20"
        data-oid="c:6z8yh"
      >
        {/* Visual Polish Elements */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"
          data-oid="hfqtprc"
        />

        <CardHeader className="p-4 pb-1 relative z-10" data-oid="jcj5vnw">
          <div className="flex items-center justify-between gap-4" data-oid="-zy2wbx">
            <div className="flex items-center gap-4" data-oid="e_y5zp5">
              <div
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 transform group-hover:rotate-6 transition-transform duration-500"
                data-oid="r3_d1rn"
              >
                <Compass className="w-6 h-6 text-white" data-oid="q1ru8ig" />
              </div>
              <div className="space-y-1.5" data-oid="58qle6d">
                <CardTitle
                  className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none"
                  data-oid="1s0z7hy"
                >
                  Journey Tracker
                </CardTitle>
                <div className="flex items-center gap-2" data-oid="7vd9e:5">
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                    data-oid="-7hzl8k"
                  />
                  <p
                    className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]"
                    data-oid=":3qmtfi"
                  >
                    Live Adaptive Roadmap
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3" data-oid="pitbrk0">
              <div className="hidden sm:flex flex-col items-end" data-oid="cu4ehu1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Target Score
                </span>
                <span className="text-lg font-black text-rose-500 leading-tight">
                  Band {journeyData.targetBand}
                </span>
              </div>
              <div className="w-px h-8 bg-border/40 hidden sm:block" data-oid="divider" />
              <div className="flex flex-col items-end" data-oid="b-e_lmw">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Estimated Arrival
                </span>
                <div className="flex items-center gap-1.5 text-indigo-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-lg font-black leading-tight">
                    {journeyData.estimatedDays ? `${journeyData.estimatedDays} Days` : 'TBD'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-1 flex-1 flex flex-col relative z-10" data-oid="4f9_.49">
          {/* Main Roadmap Section */}
          <div className="relative w-full pt-16 pb-12 px-4 mb-2" data-oid="-_8scpc">
            {/* Main Path Line */}
            <div
              className="absolute top-[2.25rem] left-8 right-8 h-2 bg-slate-100 dark:bg-white/5 rounded-full"
              data-oid="9xqxgwm"
            />

            {/* Glowing Filled Path */}
            <div
              className="absolute top-[2.25rem] left-8 right-8 h-2 overflow-hidden rounded-full"
              data-oid="0mxp45o"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${journeyData.progressPercentage}%` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-gradient-to-r from-emerald-400 via-indigo-500 to-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                data-oid="pnk3jmi"
              />
            </div>

            {/* Path Nodes */}
            <div
              className="relative flex justify-between items-start select-none"
              data-oid="j3o-tse"
            >
              {journeyData.milestones.map((milestone) => (
                <MilestoneMarker key={milestone.band} {...milestone} data-oid="df84:1l" />
              ))}
            </div>
          </div>

          {/* Insights & Next Steps Section */}
          <div className="mt-auto grid grid-cols-1 md:grid-cols-3 gap-3" data-oid="insights">
            {journeyData.currentBand > 0 ? (
              <>
                <InsightCard
                  icon={TrendingUp}
                  title="Current Standing"
                  value={`Band ${formatBand(journeyData.currentBand)}`}
                  description={`You are ${journeyData.progressPercentage}% of the way to your goal.`}
                  color="text-indigo-600"
                  bgColor="bg-indigo-500/5"
                />
                <InsightCard
                  icon={Zap}
                  title="Next Milestone"
                  value={`Band ${formatBand(journeyData.nextMilestoneBand)}`}
                  description={`Only ${formatBand(journeyData.scoreGap)} band away from your goal.`}
                  color="text-emerald-500"
                  bgColor="bg-emerald-500/5"
                />
                <InsightCard
                  icon={Activity}
                  title="Projected Pace"
                  value={studyPace.charAt(0).toUpperCase() + studyPace.slice(1)}
                  description="Based on your daily activity levels."
                  color="text-amber-500"
                  bgColor="bg-amber-500/5"
                />
              </>
            ) : (
              <div
                className="col-span-1 md:col-span-3 rounded-2x border border-dashed border-border/40 bg-muted/10 p-6 flex flex-col items-center justify-center text-center space-y-3"
                data-oid="empty-internal"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
                <div className="max-w-sm space-y-1">
                  <h4 className="text-base font-black text-foreground">Begin Your Journey</h4>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                    Take your first practice test to unlock your personalized band score predictions
                    on this roadmap.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InsightCard({ icon: Icon, title, value, description, color, bgColor }) {
  return (
    <div
      className={cn(
        'p-3 rounded-2xl border border-border/30 transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-white dark:bg-slate-900 group/insight',
        bgColor
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover/insight:scale-110',
            bgColor,
            color
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </span>
      </div>
      <div className="space-y-1">
        <div className={cn('text-xl font-black leading-tight', color)}>{value}</div>
        <p className="text-[11px] font-bold text-muted-foreground/80 leading-snug">{description}</p>
      </div>
    </div>
  );
}
