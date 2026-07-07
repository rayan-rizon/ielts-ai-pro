import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, AlertTriangle, TrendingUp, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { QUESTION_TYPE_LABELS } from './utils';

const StatCard = ({
  icon: Icon,
  title,
  value,
  unit,
  delay = 0,
  _colorClass,
  borderClass,
  bgClass,
  iconColorClass,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative overflow-hidden group h-full"
  >
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center border',
            bgClass,
            borderClass
          )}
        >
          <Icon className={cn('w-4 h-4', iconColorClass)} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
        <span className="text-lg font-bold text-slate-400">{unit}</span>
      </div>
    </div>
  </motion.div>
);

const HighlightCard = ({ title, stat, type, icon: Icon, colorTheme, delay = 0 }) => {
  const themes = {
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500',
    },
    rose: {
      bg: 'bg-rose-500/10',
      icon: 'text-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      bar: 'bg-rose-500',
    },
  };
  const t = themes[colorTheme];

  return (
    <motion.div
      initial={{ opacity: 0, x: type === 'strength' ? -10 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative overflow-hidden group"
    >
      <div className="relative">
        <div className="flex items-center gap-2 mb-2.5">
          <div className={cn('w-6 h-6 rounded flex items-center justify-center', t.bg)}>
            <Icon className={cn('w-3.5 h-3.5', t.icon)} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 truncate">
          {stat.label}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', t.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${stat.accuracy}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <span className={cn('text-[11px] font-black', t.text)}>{stat.accuracy}%</span>
        </div>
        <div className="text-[10px] text-slate-400 font-medium mt-1.5 flex justify-between">
          <span>Performance</span>
          <span>
            {stat.correct}/{stat.total} correct
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const AllTypesList = ({ types }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.4 }}
    className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-slate-950/50 border border-slate-100 dark:border-slate-800"
  >
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
      All Question Types
    </p>
    <div className="space-y-2">
      {types.slice(0, 5).map((qType, idx) => (
        <div key={qType.type} className="flex items-center gap-3">
          <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">
            {qType.label}
          </span>
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                qType.accuracy >= 70
                  ? 'bg-emerald-500'
                  : qType.accuracy >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${qType.accuracy}%` }}
              transition={{ duration: 0.5, delay: 0.5 + idx * 0.05 }}
            />
          </div>
          <span
            className={cn(
              'text-xs font-bold w-8 text-right',
              qType.accuracy >= 70
                ? 'text-emerald-600 dark:text-emerald-400'
                : qType.accuracy >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {qType.accuracy}%
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

function calculateStats(typeStats, propTotalQuestions, propCorrectAnswers) {
  if (!typeStats) return null;

  const entries = Object.entries(typeStats);
  if (entries.length === 0) return null;

  const typeCorrect = entries.reduce((acc, [, s]) => acc + s.correct, 0);
  const typeTotal = entries.reduce((acc, [, s]) => acc + s.total, 0);

  const totalCorrect = propCorrectAnswers ?? typeCorrect;
  const totalQuestions = propTotalQuestions ?? typeTotal;
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const sorted = entries
    .map(([type, s]) => ({
      type,
      label:
        QUESTION_TYPE_LABELS[type] ||
        type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      ...s,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const improvementPotential = sorted.reduce((acc, type) => acc + (type.total - type.correct), 0);

  return {
    overallAccuracy,
    totalCorrect,
    totalQuestions,
    strongest: sorted[0],
    weakest: sorted[sorted.length - 1],
    questionTypes: sorted.length,
    allTypes: sorted,
    improvementPotential,
  };
}

export const DetailedSkillBreakdown = ({
  typeStats,
  _sectionStats,
  _testType = 'reading',
  totalQuestions: propTotalQuestions,
  correctAnswers: propCorrectAnswers,
  _bandScore,
  isLocked = false,
  _onUpgrade,
}) => {
  const stats = useMemo(
    () => calculateStats(typeStats, propTotalQuestions, propCorrectAnswers),
    [typeStats, propTotalQuestions, propCorrectAnswers]
  );

  if (!stats) return null;

  return (
    <div className="space-y-5 relative" data-oid="esrvnvs">
      <div className="flex items-center gap-2" data-oid=".-202bj">
        <div
          className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 dark:border-indigo-800/50"
          data-oid="fejbbo5"
        >
          <BarChart3 className="w-4 h-4 text-indigo-500" data-oid="t9m2ov8" />
        </div>
        <h3
          className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest"
          data-oid="-gai707"
        >
          Performance Details
        </h3>
        {isLocked && <Lock className="w-3 h-3 text-slate-400 ml-auto" data-oid="ju-nvr1" />}
      </div>

      <div className={cn('relative', isLocked && 'min-h-[300px]')} data-oid="buxjet:">
        <div className="space-y-4" data-oid="6.uxfls">
          <div className="grid grid-cols-2 gap-3" data-oid="3xaqc1o">
            <StatCard
              icon={Target}
              title="Accuracy"
              value={stats.overallAccuracy}
              unit="%"
              colorClass="text-indigo-500"
              bgClass="bg-indigo-500/10"
              borderClass="border-indigo-500/20"
              iconColorClass="text-indigo-500"
            />
            <StatCard
              icon={BarChart3}
              title="Question Types"
              value={stats.questionTypes}
              unit="tested"
              delay={0.1}
              colorClass="text-blue-500"
              bgClass="bg-blue-500/10"
              borderClass="border-blue-500/20"
              iconColorClass="text-blue-500"
            />

            {stats.improvementPotential > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="col-span-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
              >
                <div className="p-1.5 bg-amber-500/20 rounded-lg shrink-0">
                  <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                    Growth Opportunity
                  </p>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 truncate">
                    Mastering current mistakes could boost score by +0.5 band
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3" data-oid="g:t68x9">
            {stats.strongest && (
              <HighlightCard
                title="Top Strength"
                stat={stats.strongest}
                type="strength"
                icon={Target}
                colorTheme="emerald"
                delay={0.2}
              />
            )}
            {stats.weakest && (
              <HighlightCard
                title="Focus Area"
                stat={stats.weakest}
                type="weakness"
                icon={AlertTriangle}
                colorTheme="rose"
                delay={0.3}
              />
            )}
          </div>

          {stats.allTypes.length > 2 && <AllTypesList types={stats.allTypes} />}
        </div>
      </div>
    </div>
  );
};
