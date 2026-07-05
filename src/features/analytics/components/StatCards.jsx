import React from 'react';
import { Target, Flag, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconWrapper } from './AnalyticsHeader';
import { ITEM_VARIANTS } from '../constants';
import { getBandLabel, formatBand } from '../utils';

export default function StatCards({ stats, progressToTarget }) {
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

  const cards = [
    {
      title: isOfficialBand ? 'Predicted Band' : 'Your Score',
      value: displayScore,
      badge: currentLabel,
      icon: Target,
      color: 'bg-primary',
      trend: hasScoreData ? stats.improvement : '--',
      trendLabel: 'Your Improvement',
      progress: progressToTarget,
      footerType: 'progress',
      subtitle: isOfficialBand
        ? modulesWithData < 4
          ? `${modulesWithData}/4 modules scored`
          : 'All modules scored'
        : null,
    },
    {
      title: 'Your Goal',
      value: formatBand(stats.targetScore),
      badge: targetLabel,
      icon: Flag,
      color: 'bg-amber-500',
      footerType: 'gap',
    },
    {
      title: 'Study Effort',
      value: `${stats.studyHours}h`,
      icon: Clock,
      color: 'bg-emerald-500',
      trend: `${Math.abs(stats.studyHoursTrend)}%`,
      trendIcon: TrendingUp,
      trendPositive: stats.studyHoursTrend >= 0,
      footerType: 'intensity',
    },
    {
      title: 'Words Learned',
      value: stats.vocabCount,
      icon: BookOpen,
      color: 'bg-indigo-500',
      footerType: 'vocab',
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
            'rounded-2xl border border-border/30 bg-white/85 dark:bg-slate-950/60 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden relative hover:-translate-y-0.5 h-full min-h-[110px]',
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
            className="p-3 md:p-3.5 h-full flex flex-col justify-between relative z-10"
            data-oid="ls.-irc"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5" data-oid="96yih:u">
              <div className="space-y-0.5 min-w-0" data-oid="v.erel8">
                <p
                  className="text-[9px] font-black uppercase text-muted-foreground/75 tracking-wider"
                  data-oid="4b9v7am"
                >
                  {card.title}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 min-w-0" data-oid="1ilsr:u">
                  <h2
                    className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none"
                    data-oid="ockgv13"
                  >
                    {card.value}
                  </h2>
                  {card.badge && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-lg text-[8px] px-1.5 py-0 border-0 font-bold tracking-tight max-w-[90px] truncate',
                        card.color === 'bg-primary'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
                      )}
                      data-oid="99pvpe:"
                    >
                      {card.badge}
                    </Badge>
                  )}
                </div>
                {card.subtitle && (
                  <p className="text-[8px] font-bold text-muted-foreground/60 tracking-wide truncate">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <IconWrapper
                icon={card.icon}
                color={card.color}
                className="p-1 shadow-sm group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
                data-oid="g1z:dm:"
              />
            </div>

            <div className="space-y-1 mt-auto" data-oid="0fi1-6p">
              {card.footerType === 'progress' && (
                <>
                  <div className="flex items-end justify-between px-0.5" data-oid="ydynymb">
                    <span
                      className="text-[9px] font-bold text-muted-foreground/70 tracking-wide"
                      data-oid="ewuwdg0"
                    >
                      {card.trendLabel}
                    </span>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[8px] font-black',
                        !hasScoreData
                          ? 'text-muted-foreground'
                          : Number(card.trend) >= 0
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                      )}
                      data-oid="84ll69k"
                    >
                      {hasScoreData && Number(card.trend) > 0 ? '+' : ''}
                      {card.trend}
                    </div>
                  </div>
                  <div
                    className="h-1 w-full bg-muted/50 rounded-full overflow-hidden"
                    data-oid="79-f5sg"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${card.progress}%` }}
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      data-oid="y9_lels"
                    />
                  </div>
                </>
              )}

              {card.footerType === 'gap' && (
                <div className="flex flex-col gap-0.5" data-oid="j3eh6pb">
                  <p
                    className="text-[9px] font-bold text-muted-foreground/70 tracking-wide"
                    data-oid="66__cxl"
                  >
                    Remaining Gap
                  </p>
                  <div
                    className="text-[10px] font-bold text-foreground leading-snug"
                    data-oid="8q0-un5"
                  >
                    {!hasScoreData ? (
                      <span className="text-muted-foreground" data-oid="no-score-gap">
                        Complete a scored test
                      </span>
                    ) : Number(stats.avgScore) >= Number(stats.targetScore) ? (
                      <span className="text-emerald-500 font-black" data-oid="s7-xcvy">
                        Goal Achieved!
                      </span>
                    ) : (
                      <span data-oid="o3_ltkg">
                        Need{' '}
                        <span className="text-amber-500 font-black" data-oid=".ph.yiv">
                          {formatBand(Number(stats.targetScore) - Number(stats.avgScore))}
                        </span>{' '}
                        band score
                      </span>
                    )}
                  </div>
                </div>
              )}

              {card.footerType === 'intensity' && (
                <div className="flex flex-col gap-0.5" data-oid="88u_3h:">
                  <p
                    className="text-[9px] font-bold text-muted-foreground/70 tracking-wide"
                    data-oid="4-52n2o"
                  >
                    Study Pattern
                  </p>
                  <div className="flex items-center justify-between gap-2" data-oid="omjuv_g">
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-md',
                        card.trendPositive
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-500/10 text-rose-600'
                      )}
                      data-oid="efcknqk"
                    >
                      {card.trendIcon && (
                        <card.trendIcon
                          className={cn('w-2 h-2', !card.trendPositive && 'rotate-180')}
                          data-oid="1qsnatw"
                        />
                      )}
                      {card.trend}
                    </div>
                    <div
                      className="text-[8px] font-black text-foreground/70 bg-muted/60 px-1.5 py-0.5 rounded-md whitespace-nowrap"
                      data-oid="_ak2o:8"
                    >
                      {averageMinutes ? `${averageMinutes} min/test` : 'No timing yet'}
                    </div>
                  </div>
                </div>
              )}

              {card.footerType === 'vocab' && (
                <div className="flex flex-col gap-0.5" data-oid="023wg95">
                  <p
                    className="text-[9px] font-bold text-muted-foreground/70 tracking-wide"
                    data-oid="7333r.4"
                  >
                    Library Status
                  </p>
                  <div className="text-[10px] font-bold text-foreground" data-oid="vpufnxb">
                    Active Entries
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.section>
  );
}
