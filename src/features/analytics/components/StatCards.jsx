import React from 'react';
import { Target, Flag, Clock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      tone: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/20',
      badgeTone: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
      subtitle: predictedBandSubtitle,
    },
    {
      title: 'Your Goal',
      value: formatBand(stats.targetScore),
      badge: targetLabel,
      icon: Flag,
      tone: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20',
      badgeTone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
      subtitle: goalSubtitle,
    },
    {
      title: 'Study Effort',
      value: `${stats.studyHours}h`,
      icon: Clock,
      tone: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20',
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
      tone: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/20',
      subtitle: vocabSubtitle,
    },
  ];

  return (
    <motion.section
      variants={ITEM_VARIANTS}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      data-oid="50fp0ug"
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className="group relative flex min-h-[78px] flex-col justify-center rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xs dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-white/20"
            data-oid="9zz1f00"
          >
            <CardContent className="p-0" data-oid="ls.-irc">
              <div className="flex items-center justify-between gap-2.5" data-oid="96yih:u">
                <div className="min-w-0 space-y-0.5" data-oid="v.erel8">
                  <p
                    className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none"
                    data-oid="4b9v7am"
                  >
                    {card.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0" data-oid="1ilsr:u">
                    <h2
                      className="text-xl font-black tracking-tight text-slate-950 dark:text-white leading-none"
                      data-oid="ockgv13"
                    >
                      {card.value}
                    </h2>
                    {card.badge && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-md text-[9px] px-1.5 py-0.5 border-0 font-extrabold uppercase tracking-wide max-w-[95px] truncate shadow-2xs',
                          card.badgeTone
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
                          'rounded-md text-[9px] px-1.5 py-0.5 border-0 font-extrabold tracking-wide shadow-2xs',
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
                    'flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border p-2 transition-transform duration-200 group-hover:scale-105',
                    card.tone
                  )}
                  data-oid="g1z:dm:"
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </motion.section>
  );
}
