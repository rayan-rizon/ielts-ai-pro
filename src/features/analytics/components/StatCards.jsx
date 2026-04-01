import React from 'react';
import { Target, Flag, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconWrapper } from './AnalyticsHeader';
import { ITEM_VARIANTS } from '../constants';
import { getBandLabel, formatBand } from '../utils';

export default function StatCards({ stats, progressToTarget }) {
  if (!stats) return null;

  // Use predictedOverallBand (official IELTS formula) if available, else fall back to avgScore
  const displayScore =
    stats.predictedOverallBand != null
      ? String(
          stats.predictedOverallBand % 1 === 0
            ? stats.predictedOverallBand.toFixed(1)
            : stats.predictedOverallBand
        )
      : stats.avgScore;
  const isOfficialBand = stats.predictedOverallBand != null;
  const modulesWithData = stats.modulesWithData || 0;

  const currentLabel = getBandLabel(displayScore);
  const targetLabel = getBandLabel(stats.targetScore);

  const cards = [
    {
      title: isOfficialBand ? 'Predicted Band' : 'Your Score',
      value: displayScore,
      badge: currentLabel,
      icon: Target,
      color: 'bg-primary',
      trend: stats.improvement,
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
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      data-oid="50fp0ug"
    >
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={cn(
            'rounded-2xl border bg-card/95 backdrop-blur-md shadow-md hover:shadow-2xl transition-all duration-300 group overflow-hidden relative hover:-translate-y-1 h-full min-h-[128px]',
            card.color === 'bg-primary'
              ? 'border-primary/30 hover:shadow-primary/20'
              : card.color === 'bg-amber-500'
                ? 'border-amber-500/30 hover:shadow-amber-500/20'
                : card.color === 'bg-emerald-500'
                  ? 'border-emerald-500/30 hover:shadow-emerald-500/20'
                  : 'border-indigo-500/30 hover:shadow-indigo-500/20'
          )}
          data-oid="9zz1f00"
        >
          <CardContent
            className="p-4 h-full flex flex-col justify-between relative z-10"
            data-oid="ls.-irc"
          >
            <div className="flex items-start justify-between mb-2" data-oid="96yih:u">
              <div className="space-y-1" data-oid="v.erel8">
                <p
                  className="text-[11px] font-bold text-muted-foreground/80 tracking-wide"
                  data-oid="4b9v7am"
                >
                  {card.title}
                </p>
                <div className="flex items-center gap-2" data-oid="1ilsr:u">
                  <h2
                    className="text-2xl md:text-3xl font-black text-foreground tracking-tighter leading-none"
                    data-oid="ockgv13"
                  >
                    {card.value}
                  </h2>
                  {card.badge && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-lg text-[10px] px-2 py-0.5 border-0 font-bold tracking-tight',
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
                  <p className="text-[9px] font-bold text-muted-foreground/60 tracking-wide">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <IconWrapper
                icon={card.icon}
                color={card.color}
                className="p-1.5 shadow-sm group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                data-oid="g1z:dm:"
              />
            </div>

            <div className="space-y-1.5 mt-auto" data-oid="0fi1-6p">
              {card.footerType === 'progress' && (
                <>
                  <div className="flex items-end justify-between px-0.5" data-oid="ydynymb">
                    <span
                      className="text-[10px] font-bold text-muted-foreground/70 tracking-wide"
                      data-oid="ewuwdg0"
                    >
                      {card.trendLabel}
                    </span>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[9px] font-black',
                        Number(card.trend) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      )}
                      data-oid="84ll69k"
                    >
                      {Number(card.trend) > 0 ? '+' : ''}
                      {card.trend}
                    </div>
                  </div>
                  <div
                    className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden"
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
                    className="text-[10px] font-bold text-muted-foreground/70 tracking-wide"
                    data-oid="66__cxl"
                  >
                    Remaining Gap
                  </p>
                  <div className="text-xs font-bold text-foreground truncate" data-oid="8q0-un5">
                    {Number(stats.avgScore) >= Number(stats.targetScore) ? (
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
                <div className="flex flex-col gap-1" data-oid="88u_3h:">
                  <p
                    className="text-[10px] font-bold text-muted-foreground/70 tracking-wide"
                    data-oid="4-52n2o"
                  >
                    Study Pattern
                  </p>
                  <div className="flex items-center justify-between gap-2" data-oid="omjuv_g">
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md',
                        card.trendPositive
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-500/10 text-rose-600'
                      )}
                      data-oid="efcknqk"
                    >
                      {card.trendIcon && (
                        <card.trendIcon
                          className={cn('w-2.5 h-2.5', !card.trendPositive && 'rotate-180')}
                          data-oid="1qsnatw"
                        />
                      )}
                      {card.trend}
                    </div>
                    <div
                      className="text-[9px] font-black text-foreground/70 bg-muted/60 px-1.5 py-0.5 rounded-md"
                      data-oid="_ak2o:8"
                    >
                      {Math.round(
                        Object.values(stats.efficiency).reduce((a, b) => a + b, 0) /
                          (Object.values(stats.efficiency).filter((v) => v > 0).length || 1)
                      )}{' '}
                      min/test
                    </div>
                  </div>
                </div>
              )}

              {card.footerType === 'vocab' && (
                <div className="flex flex-col gap-0.5" data-oid="023wg95">
                  <p
                    className="text-[10px] font-bold text-muted-foreground/70 tracking-wide"
                    data-oid="7333r.4"
                  >
                    Library Status
                  </p>
                  <div className="text-xs font-bold text-foreground" data-oid="vpufnxb">
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
