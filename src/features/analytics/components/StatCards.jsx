import React from 'react';
import { Target, Flag, Clock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconWrapper } from './AnalyticsHeader';
import { ITEM_VARIANTS } from '../constants';
import { getBandLabel, formatBand } from '../utils';

export default function StatCards({ stats, _progressToTarget }) {
  if (!stats) return null;

  const hasScoreData = (stats.scoredTests ?? stats.totalTests ?? 0) > 0;

  // Use predictedOverallBand (official IELTS formula) if available, else fall back to avgScore
  const displayScore = !hasScoreData
    ? '--'
    : stats.predictedOverallBand != null
      ? String(
          stats.predictedOverallBand % 1 === 0
            ? stats.predictedOverallBand.toFixed(1)
            : stats.predictedOverallBand
        )
      : stats.avgScore;
  const isOfficialBand = stats.predictedOverallBand != null;
  const modulesWithData = stats.modulesWithData || 0;

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

  // 1. Predicted Band Subtitle
  const scoredText = isOfficialBand
    ? modulesWithData < 4
      ? `${modulesWithData}/4 scored`
      : 'All modules scored'
    : 'Score average';
  const improvementVal = parseFloat(stats.improvement);
  const trendText =
    hasScoreData && improvementVal !== 0
      ? ` • ${improvementVal > 0 ? '▲' : '▼'} ${Math.abs(improvementVal)} bands`
      : '';
  const predictedBandSubtitle = `${scoredText}${trendText}`;

  // 2. Your Goal Subtitle
  const gap = Number(stats.targetScore) - Number(stats.avgScore);
  const goalSubtitle = !hasScoreData
    ? 'Awaiting test scores'
    : gap <= 0
      ? 'Target achieved!'
      : `Gap: -${formatBand(gap)} band score`;

  // 3. Study Effort Subtitle
  const studySubtitle = averageMinutes ? `${averageMinutes} min/test average` : 'No timing data';

  // 4. Words Learned Subtitle
  const vocabSubtitle = 'Active vocabulary entries';

  const cards = [
    {
      title: isOfficialBand ? 'Predicted Band' : 'Your Score',
      value: displayScore,
      badge: currentLabel,
      icon: Target,
      color: 'bg-primary',
      subtitle: predictedBandSubtitle,
    },
    {
      title: 'Your Goal',
      value: formatBand(stats.targetScore),
      badge: targetLabel,
      icon: Flag,
      color: 'bg-amber-500',
      subtitle: goalSubtitle,
    },
    {
      title: 'Study Effort',
      value: `${stats.studyHours}h`,
      icon: Clock,
      color: 'bg-emerald-500',
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
      title: 'Words Learned',
      value: stats.vocabCount,
      icon: BookOpen,
      color: 'bg-indigo-500',
      subtitle: vocabSubtitle,
    },
  ];

  return (
    <motion.section
      variants={ITEM_VARIANTS}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 h-full"
      data-oid="50fp0ug"
    >
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={cn(
            'rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden relative hover:-translate-y-0.5 h-full flex flex-col justify-center min-h-[105px]',
            card.color === 'bg-primary'
              ? 'hover:border-primary/30 hover:shadow-primary/5'
              : card.color === 'bg-amber-500'
                ? 'hover:border-amber-500/30 hover:shadow-amber-500/5'
                : card.color === 'bg-emerald-500'
                  ? 'hover:border-emerald-500/30 hover:shadow-emerald-500/5'
                  : 'hover:border-indigo-500/30 hover:shadow-indigo-500/5'
          )}
          data-oid="9zz1f00"
        >
          {/* Decorative Grid Pattern & Soft Glows */}
          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:12px_12px] group-hover:opacity-[0.02] dark:group-hover:opacity-[0.04] transition-opacity duration-300"
            data-oid="card-grid"
          />
          <div
            className={cn(
              'absolute top-0 right-0 w-28 h-28 rounded-full blur-[40px] -mr-14 -mt-14 pointer-events-none transition-all duration-300 group-hover:scale-110',
              card.color === 'bg-primary'
                ? 'bg-primary/10 dark:bg-primary/20'
                : card.color === 'bg-amber-500'
                  ? 'bg-amber-500/10 dark:bg-amber-500/20'
                  : card.color === 'bg-emerald-500'
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20'
                    : 'bg-indigo-500/10 dark:bg-indigo-500/20'
            )}
            data-oid="card-glow"
          />

          <CardContent
            className="p-3 sm:p-3.5 flex flex-col justify-center relative z-10"
            data-oid="ls.-irc"
          >
            <div className="flex items-start justify-between gap-3" data-oid="96yih:u">
              <div className="space-y-1 min-w-0" data-oid="v.erel8">
                <p
                  className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider leading-none"
                  data-oid="4b9v7am"
                >
                  {card.title}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 min-w-0" data-oid="1ilsr:u">
                  <h2
                    className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none"
                    data-oid="ockgv13"
                  >
                    {card.value}
                  </h2>
                  {card.badge && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full text-[9px] px-2 py-0.5 border-0 font-extrabold uppercase tracking-wider max-w-[110px] truncate shadow-sm',
                        card.color === 'bg-primary'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      )}
                      data-oid="99pvpe:"
                    >
                      {card.badge}
                    </Badge>
                  )}
                  {card.trendBadge && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full text-[9px] px-2 py-0.5 border-0 font-extrabold tracking-wider shadow-sm',
                        card.trendBadge.isPositive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-450'
                      )}
                    >
                      {card.trendBadge.text}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-350 leading-relaxed truncate">
                  {card.subtitle}
                </p>
              </div>
              <IconWrapper
                icon={card.icon}
                color={card.color}
                className="p-1.5 shadow-sm group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100 shrink-0"
                data-oid="g1z:dm:"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.section>
  );
}
