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
      tone: 'bg-[#6d55e8]/10 text-[#6d55e8] dark:bg-[#6d55e8]/20 dark:text-[#8875f0] border-[#6d55e8]/20',
      badgeTone: 'bg-[#6d55e8]/15 text-[#6d55e8] dark:bg-[#6d55e8]/25 dark:text-[#a090f5]',
      subtitle: predictedBandSubtitle,
    },
    {
      title: 'Your Goal',
      value: formatBand(stats.targetScore),
      badge: targetLabel,
      icon: Flag,
      tone: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20',
      badgeTone: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300',
      subtitle: goalSubtitle,
    },
    {
      title: 'Study Effort',
      value: `${stats.studyHours}h`,
      icon: Clock,
      tone: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20',
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
      tone: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border-sky-500/20',
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
            className="group relative flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 p-2.5 sm:p-3 shadow-2xs backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-xs"
            data-oid="9zz1f00"
          >
            <CardContent
              className="p-0 flex items-center justify-between w-full gap-2.5"
              data-oid="ls.-irc"
            >
              <div className="min-w-0 space-y-0.5" data-oid="v.erel8">
                <p
                  className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 leading-none"
                  data-oid="4b9v7am"
                >
                  {card.title}
                </p>
                <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap" data-oid="1ilsr:u">
                  <h2
                    className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white leading-none"
                    data-oid="ockgv13"
                  >
                    {card.value}
                  </h2>
                  {card.badge && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full text-[9.5px] px-2 py-0.5 border-0 font-extrabold uppercase tracking-wider shadow-2xs',
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
                        'rounded-full text-[9.5px] px-2 py-0.5 border-0 font-extrabold tracking-wider shadow-2xs',
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
                  'flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 shadow-2xs',
                  card.tone
                )}
                data-oid="g1z:dm:"
              >
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </motion.section>
  );
}
