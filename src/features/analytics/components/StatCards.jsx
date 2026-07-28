import React from 'react';
import { Award, Target, Timer, BookMarked } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { ITEM_VARIANTS } from '../constants';
import { getBandLabel, formatBand } from '../utils';

export default function StatCards({ stats, _progressToTarget }) {
  if (!stats) return null;

  const hasScoreData = (stats.scoredTests ?? stats.totalTests ?? 0) > 0;
  const modulesWithData = stats.modulesWithData || 0;
  const hasOverallEstimate = stats.overallEstimate != null && modulesWithData === 4;
  const displayScore = !hasScoreData
    ? '--'
    : hasOverallEstimate
      ? String(
          stats.overallEstimate % 1 === 0 ? stats.overallEstimate.toFixed(1) : stats.overallEstimate
        )
      : stats.avgScore;

  const currentLabel = hasScoreData ? getBandLabel(displayScore) : 'No score yet';
  const targetLabel = getBandLabel(stats.targetScore);
  const efficiencyValues = Object.values(stats.efficiency || {}).filter(
    (value) => Number(value) > 0
  );
  const averageMinutes = efficiencyValues.length
    ? Math.round(
        efficiencyValues.reduce((sum, value) => sum + Number(value), 0) / efficiencyValues.length
      )
    : null;

  const scoredText = hasOverallEstimate
    ? 'Latest score from all 4 modules'
    : 'Completed-practice average';
  const improvementVal = parseFloat(stats.improvement);
  const trendText =
    hasScoreData && improvementVal !== 0
      ? ` • ${improvementVal > 0 ? '▲' : '▼'} ${Math.abs(improvementVal)} bands`
      : '';
  const scoreSubtitle = `${scoredText}${trendText}`;

  const scoreForGoal = hasOverallEstimate ? Number(stats.overallEstimate) : Number(stats.avgScore);
  const gap = Number(stats.targetScore) - scoreForGoal;
  const goalSubtitle = !hasScoreData
    ? 'Awaiting test scores'
    : gap <= 0
      ? 'Target achieved!'
      : `${formatBand(gap)} ${gap === 1 ? 'band' : 'bands'} to target`;

  const studySubtitle = averageMinutes ? `${averageMinutes} min/test average` : 'No timing data';
  const vocabSubtitle = 'Active vocabulary entries';

  const cards = [
    {
      title: hasOverallEstimate ? 'Overall estimate' : 'Practice average',
      value: displayScore,
      badge: currentLabel,
      icon: Award,
      iconBg:
        'bg-[#efedff] text-[#5661e9] ring-1 ring-[#5661e9]/20 dark:bg-indigo-500/20 dark:text-indigo-300',
      badgeTone:
        'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20',
      subtitle: scoreSubtitle,
    },
    {
      title: 'Your Goal',
      value: formatBand(stats.targetScore),
      badge: targetLabel,
      icon: Target,
      iconBg:
        'bg-[#efedff] text-[#5661e9] ring-1 ring-[#5661e9]/20 dark:bg-indigo-500/20 dark:text-indigo-300',
      badgeTone:
        'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20',
      subtitle: goalSubtitle,
    },
    {
      title: 'Study Effort',
      value:
        Number(stats.studyMinutes) > 0 && Number(stats.studyMinutes) < 60
          ? `${stats.studyMinutes}m`
          : `${Number(stats.studyHours || 0).toFixed(1)}h`,
      icon: Timer,
      iconBg:
        'bg-[#efedff] text-[#5661e9] ring-1 ring-[#5661e9]/20 dark:bg-indigo-500/20 dark:text-indigo-300',
      subtitle: studySubtitle,
      trendBadge:
        stats.studyHoursTrend != null && stats.studyHoursTrend !== 0
          ? {
              text: `${stats.studyHoursTrend >= 0 ? '+' : ''}${stats.studyHoursTrend}%`,
              isPositive: stats.studyHoursTrend >= 0,
            }
          : null,
    },
    {
      title: 'Saved Vocabulary',
      value: stats.vocabCount,
      icon: BookMarked,
      iconBg:
        'bg-[#efedff] text-[#5661e9] ring-1 ring-[#5661e9]/20 dark:bg-indigo-500/20 dark:text-indigo-300',
      subtitle: vocabSubtitle,
    },
  ];

  return (
    <motion.section
      variants={ITEM_VARIANTS}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="group relative flex items-center justify-between rounded-[20px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] px-3.5 py-3 shadow-[0_15px_35px_-28px_rgba(48,58,128,0.4)] transition-all duration-200"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 leading-none">
                {card.title}
              </p>
              <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                <h2 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-950 dark:text-white leading-none">
                  {card.value}
                </h2>
                {card.badge && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full text-[9px] px-2 py-0.5 border-0 font-extrabold uppercase tracking-wider shadow-2xs',
                      card.badgeTone
                    )}
                  >
                    {card.badge}
                  </Badge>
                )}
                {card.trendBadge && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full text-[9px] px-2 py-0.5 border-0 font-extrabold tracking-wider shadow-2xs',
                      card.trendBadge.isPositive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                    )}
                  >
                    {card.trendBadge.text}
                  </Badge>
                )}
              </div>
              <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 leading-tight truncate">
                {card.subtitle}
              </p>
            </div>

            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-108 shadow-xs ml-2',
                card.iconBg
              )}
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
            </div>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
