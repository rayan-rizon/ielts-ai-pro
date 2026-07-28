import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Check,
  Lightbulb,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { buildActivityUrl } from '@/features/learning/utils/activityRoutes';
import { GlassCard, SuccessParticles, ModuleBadge } from '../SharedComponents';
import {
  dayLabels,
  dayNames,
  formatSkillName,
  getTodayIndex,
} from '../../hooks/useLearningPathData';
import { formatTaskTitle } from '../../utils/learningUtils';
import { moduleConfig } from '../../utils/moduleConfig';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

const WeekSchedule = ({
  selectedDayIndex,
  setSelectedDayIndex,
  currentTasks,
  activityByKey,
  onToggleTask,
  onQuickComplete,
  skillIndex,
  className,
  loading = false,
}) => {
  const navigate = useNavigate();
  const todayIndex = getTodayIndex();

  if (loading) {
    return (
      <GlassCard className={cn('p-3 sm:p-4 md:p-5', className)}>
        <div className="space-y-3 sm:space-y-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary/70" />
            </div>
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-44 rounded-full" />
              <Skeleton className="h-3.5 w-64 max-w-full rounded-full" />
            </div>
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-12 rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-[75%] rounded-full" />
                  <Skeleton className="h-3.5 w-[60%] rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      className={cn('p-3 sm:p-4 md:p-5 border-t-2 border-t-sky-400/40', className)}
      data-oid="k:z60o0"
    >
      <div
        className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4"
        data-oid="-6_4l0:"
      >
        <div data-oid="rl7b860">
          <h2
            className="text-xl sm:text-2xl font-black tracking-tight dark:text-white flex items-center gap-2"
            data-oid="izdy.z."
          >
            <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" data-oid="ng3_32y" />
            This Week’s Schedule
          </h2>
          <p
            className="text-xs sm:text-sm text-muted-foreground font-semibold leading-relaxed"
            data-oid="tl40py7"
          >
            Start one task, then mark it done when you finish.
          </p>
        </div>

        <div className="flex items-center gap-2 max-w-full">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-8 px-3 text-[10px] font-black uppercase tracking-[0.12em] border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-200 hover:bg-sky-50 dark:hover:bg-sky-500/10"
            onClick={() => setSelectedDayIndex(todayIndex)}
          >
            Today
          </Button>

          <div
            className="flex items-center overflow-x-auto no-scrollbar mask-gradient-x p-1.5 bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/70 backdrop-blur-md max-w-full"
            role="tablist"
            aria-label="Select day for weekly schedule"
            data-oid="8_x9:bt"
          >
            {dayLabels.map((l, i) => {
              const isToday = i === todayIndex;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={selectedDayIndex === i}
                  aria-current={isToday ? 'date' : undefined}
                  onClick={() => setSelectedDayIndex(i)}
                  className={cn(
                    'relative px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-all z-10 shrink-0',
                    selectedDayIndex === i
                      ? 'text-slate-900 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  )}
                  data-oid="uel67uy"
                >
                  {selectedDayIndex === i && (
                    <m.div
                      layoutId="day-tab-bg"
                      className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl shadow-md -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      data-oid="z3glpw6"
                    />
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    {l}
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2.5"
        data-oid="jilo2e:"
      >
        {currentTasks.length > 0 ? (
          currentTasks.map((t, idx) => {
            const task =
              typeof t === 'string'
                ? {
                    title: t,
                    module: t.toLowerCase().includes('reading')
                      ? 'reading'
                      : t.toLowerCase().includes('writing')
                        ? 'writing'
                        : t.toLowerCase().includes('listening')
                          ? 'listening'
                          : 'speaking',
                    estimated_time: 30,
                  }
                : t;
            const config = moduleConfig[task.module] || moduleConfig.reading;
            const activityKey = task.activity_key || `${dayNames[selectedDayIndex]}_${idx}`;
            const record = activityByKey[activityKey];
            const isDone = !!record?.is_completed;
            const outcomeScore = record?.outcome_score;
            const skillTargets =
              Array.isArray(task.skill_targets) && task.skill_targets.length
                ? task.skill_targets
                : Array.isArray(record?.skill_targets)
                  ? record.skill_targets
                  : [];
            const primarySkill = skillTargets?.[0] || null;
            const primarySkillInfo = primarySkill && skillIndex ? skillIndex[primarySkill] : null;

            return (
              <m.div
                key={idx}
                variants={itemVariants}
                onClick={() => onToggleTask(dayNames[selectedDayIndex], idx)}
                className={cn(
                  'group relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer',
                  isDone
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-white/80 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-700/75 hover:bg-sky-50/70 dark:hover:bg-sky-500/10 hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/5 shadow-sm'
                )}
                data-oid="ermp4:s"
              >
                <SuccessParticles active={isDone} data-oid="bbzsiln" />

                <div
                  className={cn(
                    'w-8 h-8 rounded-lg border flex items-center justify-center transition-all shrink-0',
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-zinc-200 dark:border-zinc-700 group-hover:border-primary'
                  )}
                  data-oid="s38igeg"
                >
                  {isDone ? (
                    <Check className="w-5 h-5 stroke-[4px]" data-oid="gat-syr" />
                  ) : (
                    <div
                      className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-primary transition-colors"
                      data-oid="3i7rlm6"
                    />
                  )}
                </div>

                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden',
                    config.bg
                  )}
                  data-oid="q489cju"
                >
                  <div
                    className={cn('absolute inset-0 bg-gradient-to-br opacity-20', config.gradient)}
                    data-oid="r08w6et"
                  />
                  <config.icon
                    className={cn('w-5 h-5 relative z-10', config.color)}
                    data-oid="fqj8j0m"
                  />
                </div>

                <div className="flex-1 min-w-0" data-oid="4evgrp8">
                  <div className="flex flex-wrap items-center gap-2 mb-1" data-oid="5iu:rs8">
                    <ModuleBadge module={task.module} data-oid="mhr365i" />
                    <span
                      className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5"
                      data-oid=".i7g4_b"
                    >
                      <Clock className="w-3.5 h-3.5" data-oid="rlnxr1h" />
                      {task.estimated_time} MINS
                    </span>
                    {isDone && outcomeScore && (
                      <Badge
                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] font-black h-5 px-2 rounded-full"
                        data-oid="9.f-r-o"
                      >
                        {Math.round(outcomeScore)}%
                      </Badge>
                    )}
                  </div>
                  <h3
                    className={cn(
                      'text-base font-black tracking-tight leading-tight break-words [overflow-wrap:anywhere]',
                      isDone
                        ? 'text-slate-400 dark:text-slate-500 line-through opacity-60'
                        : 'text-slate-900 dark:text-white'
                    )}
                    data-oid="50nkp:8"
                  >
                    {formatTaskTitle(task.title)}
                  </h3>
                  {!isDone && (
                    <div
                      className="flex items-start gap-2 mt-2 text-[10px] font-bold text-slate-500 dark:text-slate-300 leading-relaxed"
                      data-oid="806sbg:"
                    >
                      <Lightbulb
                        className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5"
                        data-oid="3_wl4x_"
                      />

                      <div className="line-clamp-2" data-oid="zcsvybm">
                        {(task.description ? formatTaskTitle(task.description) : null) ||
                          primarySkillInfo?.why ||
                          (primarySkill
                            ? `Targets: ${formatSkillName(primarySkill)}`
                            : `Build ${task.module} consistency under time pressure.`)}
                      </div>
                    </div>
                  )}
                  {!!skillTargets?.length && !isDone && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2" data-oid="ns8pwx8">
                      <span
                        className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md"
                        data-oid="40gntya"
                      >
                        TARGETS
                      </span>
                      {skillTargets.slice(0, 2).map((sc) => (
                        <span
                          key={sc}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50/90 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-500/20"
                          data-oid="18gd:_l"
                        >
                          {formatSkillName(sc)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-sky-500/10 hover:text-sky-700 dark:hover:text-sky-300 transition-colors shrink-0"
                  aria-label={`Open ${task.module} practice`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(buildActivityUrl(task));
                  }}
                  data-oid="::t83e5"
                >
                  <ArrowUpRight className="w-5 h-5" data-oid="i5fya:o" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'rounded-xl transition-colors shrink-0',
                    isDone ? 'opacity-40' : 'hover:bg-emerald-500/10 hover:text-emerald-600'
                  )}
                  disabled={isDone}
                  aria-label="Quick mark task complete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickComplete(dayNames[selectedDayIndex], idx, t);
                  }}
                  data-oid="n3t-3o0"
                >
                  <CheckCircle2 className="w-5 h-5" data-oid="e56ng6y" />
                </Button>
              </m.div>
            );
          })
        ) : (
          <div
            className="flex flex-col items-center justify-center py-24 text-center space-y-6"
            data-oid="32u0goy"
          >
            <div className="relative" data-oid=".4hl8qj">
              <div
                className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse"
                data-oid="jkvyvfp"
              />

              <div
                className="w-28 h-28 rounded-2xl bg-white dark:bg-white/[0.04] flex items-center justify-center relative z-10 border border-slate-200 dark:border-white/[0.08] shadow-xl"
                data-oid="nk559r0"
              >
                <Rocket className="w-14 h-14 text-indigo-500 animate-float" data-oid="xs6.3:7" />
              </div>
            </div>
            <div className="space-y-2" data-oid="i..dqw-">
              <h3
                className="text-2xl font-black dark:text-white tracking-tight italic"
                data-oid="au6lwts"
              >
                Light Practice Day
              </h3>
              <p
                className="text-sm text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed"
                data-oid="a2hcl0c"
              >
                No tasks are scheduled today. Do one short practice to keep your rhythm.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  buildActivityUrl({
                    module: 'listening',
                    routing: { route: 'listening', mode: 'practice' },
                  })
                )
              }
              className="rounded-2xl border-primary/20 hover:bg-primary/5 text-primary font-bold text-xs"
              data-oid="6k6mj-0"
            >
              Explore Practice Library
            </Button>
          </div>
        )}
      </m.div>
    </GlassCard>
  );
};

export default memo(WeekSchedule);
