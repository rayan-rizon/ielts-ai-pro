import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Check,
  Lightbulb,
  Rocket,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { GlassCard, SuccessParticles, ModuleBadge } from '../SharedComponents';
import { dayLabels, dayNames, formatSkillName } from '../../hooks/useLearningPathData';
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
}) => {
  const navigate = useNavigate();

  return (
    <GlassCard className={cn('p-4 md:p-6 min-h-[450px]', className)} data-oid="k:z60o0">
      <div
        className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6"
        data-oid="-6_4l0:"
      >
        <div data-oid="rl7b860">
          <h2
            className="text-2xl font-black tracking-tight dark:text-white flex items-center gap-2"
            data-oid="izdy.z."
          >
            <Calendar className="w-6 h-6 text-primary" data-oid="ng3_32y" />
            This Week’s Schedule
          </h2>
          <p
            className="text-sm text-muted-foreground font-semibold leading-relaxed"
            data-oid="tl40py7"
          >
            Tap a task to save your result. Use Quick Done if you don’t have numbers.
          </p>
        </div>

        <div
          className="flex items-center overflow-x-auto no-scrollbar mask-gradient-x p-2 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-md max-w-full"
          data-oid="8_x9:bt"
        >
          {dayLabels.map((l, i) => (
            <button
              key={i}
              onClick={() => setSelectedDayIndex(i)}
              className={cn(
                'relative px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all z-10 shrink-0',
                selectedDayIndex === i
                  ? 'text-primary'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
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
              {l}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" data-oid="8x.gd_p">
        <m.div
          key={selectedDayIndex}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
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
              const activityKey = `${dayNames[selectedDayIndex]}_${idx}`;
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
                    'group relative overflow-hidden flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all cursor-pointer',
                    isDone
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/[0.08] hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 shadow-sm'
                  )}
                  data-oid="ermp4:s"
                >
                  <SuccessParticles active={isDone} data-oid="bbzsiln" />

                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all shrink-0',
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
                        className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary transition-colors"
                        data-oid="3i7rlm6"
                      />
                    )}
                  </div>

                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden',
                      config.bg
                    )}
                    data-oid="q489cju"
                  >
                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-20',
                        config.gradient
                      )}
                      data-oid="r08w6et"
                    />
                    <config.icon
                      className={cn('w-6 h-6 relative z-10', config.color)}
                      data-oid="fqj8j0m"
                    />
                  </div>

                  <div className="flex-1 min-w-0" data-oid="4evgrp8">
                    <div className="flex items-center gap-3 mb-1" data-oid="5iu:rs8">
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
                        'text-lg font-black tracking-tight leading-tight',
                        isDone
                          ? 'text-slate-400 dark:text-slate-500 line-through opacity-60'
                          : 'text-slate-900 dark:text-white'
                      )}
                      data-oid="50nkp:8"
                    >
                      {task.title}
                    </h3>
                    {!isDone && (
                      <div
                        className="flex items-start gap-2 mt-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed"
                        data-oid="806sbg:"
                      >
                        <Lightbulb
                          className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5"
                          data-oid="3_wl4x_"
                        />

                        <div className="line-clamp-2" data-oid="zcsvybm">
                          {task.description ||
                            primarySkillInfo?.why ||
                            (primarySkill
                              ? `Targets: ${formatSkillName(primarySkill)}`
                              : `Build ${task.module} consistency under time pressure.`)}
                        </div>
                      </div>
                    )}
                    {!!skillTargets?.length && !isDone && (
                      <div className="flex flex-wrap items-center gap-2 mt-2" data-oid="ns8pwx8">
                        <span
                          className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                          data-oid="40gntya"
                        >
                          TARGETS
                        </span>
                        {skillTargets.slice(0, 2).map((sc) => (
                          <span
                            key={sc}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400"
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
                    className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        createPageUrl(task.module.charAt(0).toUpperCase() + task.module.slice(1))
                      );
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
                  className="w-28 h-28 rounded-3xl bg-white dark:bg-white/[0.04] flex items-center justify-center relative z-10 border border-slate-200 dark:border-white/[0.08] shadow-xl"
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
                  Active Recovery Day
                </h3>
                <p
                  className="text-sm text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed"
                  data-oid="a2hcl0c"
                >
                  No tasks scheduled for today. Take this time to review your notes or practice
                  freely.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('Listening'))}
                className="rounded-2xl border-primary/20 hover:bg-primary/5 text-primary font-bold text-xs"
                data-oid="6k6mj-0"
              >
                Explore Practice Library
              </Button>
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </GlassCard>
  );
};

export default memo(WeekSchedule);
