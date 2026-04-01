import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ITEM_VARIANTS } from '../constants';

export default function ActivityHeatmap({ rawSessions }) {
  const { heatmapData, stats } = useMemo(() => {
    const data = {};
    const now = new Date();
    // Show last 6 months
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Group sessions by date
    rawSessions.forEach((s) => {
      const date = new Date(s.completed_at || s.created_at).toISOString().split('T')[0];
      data[date] = (data[date] || 0) + 1;
    });

    const weeks = [];
    let currentWeek = [];
    let activeDays = 0;
    let totalSessions = rawSessions.length;

    // Calculate Current Streak
    let currentStreak = 0;
    let tempDate = new Date();
    while (true) {
      const dateStr = tempDate.toISOString().split('T')[0];
      if (data[dateStr]) {
        currentStreak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        // Allow for "today" to be empty if yesterday was active
        if (currentStreak === 0) {
          tempDate.setDate(tempDate.getDate() - 1);
          const yesterdayStr = tempDate.toISOString().split('T')[0];
          if (data[yesterdayStr]) {
            // Check yesterday
            continue;
          }
        }
        break;
      }
    }

    // Fill from startDate to now
    let iter = new Date(startDate);
    // Align iter to the beginning of the week (Sunday = 0)
    iter.setDate(iter.getDate() - iter.getDay());

    while (iter <= now || currentWeek.length > 0) {
      const dateStr = iter.toISOString().split('T')[0];
      const count = data[dateStr] || 0;
      if (count > 0) activeDays++;

      currentWeek.push({
        date: new Date(iter),
        count,
        dateStr,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      iter.setDate(iter.getDate() + 1);
      if (iter > now && currentWeek.length === 0) break;
    }

    return {
      heatmapData: weeks,
      stats: {
        activeDays,
        totalSessions,
        currentStreak,
      },
    };
  }, [rawSessions]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    heatmapData.forEach((week, i) => {
      const month = week[0].date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: week[0].date.toLocaleString('default', { month: 'short' }),
          index: i,
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [heatmapData]);

  const getColor = (count) => {
    if (count === 0) return 'bg-muted/30';
    if (count === 1) return 'bg-primary/20';
    if (count === 2) return 'bg-primary/40';
    if (count === 3) return 'bg-primary/60';
    return 'bg-primary';
  };

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid="yyxmdvt">
      <Card
        className="rounded-2xl border-border/50 bg-card/75 backdrop-blur shadow-sm overflow-hidden hover:shadow-xl transition-all h-[400px] flex flex-col"
        data-oid="87flb7t"
      >
        <CardHeader className="pb-2" data-oid="y8-w6ke">
          <div
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            data-oid="081cc9_"
          >
            <div className="space-y-1" data-oid="m0gkfay">
              <CardTitle
                className="text-xl font-black text-foreground flex items-center gap-2"
                data-oid="rkxuwh0"
              >
                <Calendar className="w-5 h-5 text-primary" data-oid="88_ai4b" />
                Study Consistency
              </CardTitle>
              <CardDescription data-oid="pu2grdr">
                Your daily test activity over the last 6 months.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-4" data-oid="lq:hgu_">
              <div
                className="flex items-center gap-4 px-4 py-2 bg-muted/30 rounded-2xl border border-border/50"
                data-oid="czxqnz:"
              >
                <div className="text-center border-r border-border/50 pr-4" data-oid="giu2jzi">
                  <div
                    className={cn(
                      'text-xs font-black text-primary leading-none',
                      stats.currentStreak > 0 && 'animate-pulse'
                    )}
                    data-oid="w1ylf09"
                  >
                    {stats.currentStreak}
                  </div>
                  <div
                    className="text-[8px] font-bold text-muted-foreground tracking-widest mt-1"
                    data-oid="uas034-"
                  >
                    Streak
                  </div>
                </div>
                <div className="text-center border-r border-border/50 pr-4" data-oid="i-cx82f">
                  <div
                    className="text-xs font-black text-foreground leading-none"
                    data-oid="vndeco4"
                  >
                    {stats.activeDays}
                  </div>
                  <div
                    className="text-[8px] font-bold text-muted-foreground tracking-widest mt-1"
                    data-oid="10o8762"
                  >
                    Days
                  </div>
                </div>
                <div className="text-center" data-oid="ms49ife">
                  <div
                    className="text-xs font-black text-foreground leading-none"
                    data-oid=".rp8xss"
                  >
                    {stats.totalSessions}
                  </div>
                  <div
                    className="text-[8px] font-bold text-muted-foreground tracking-widest mt-1"
                    data-oid="7z4mnl5"
                  >
                    Tests
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-3 bg-primary/5 px-3 py-1.5 rounded-2xl border border-primary/10"
                data-oid="cuiujf_"
              >
                <span
                  className="text-[10px] font-black text-primary tracking-widest"
                  data-oid="62ic_:9"
                >
                  Intensity
                </span>
                <div className="flex items-center gap-1" data-oid="kzkb2ru">
                  <div className="w-2.5 h-2.5 rounded-sm bg-muted/40" data-oid=":._fuj9" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" data-oid="w2mvto6" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" data-oid="25nxpfg" />
                  <div
                    className="w-2.5 h-2.5 rounded-sm bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                    data-oid="dcpg_kp"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent
          className="pt-0 overflow-x-auto scrollbar-none flex-1 flex flex-col"
          data-oid="0g:--n."
        >
          <div className="min-w-[700px] py-2" data-oid="t6_x84b">
            <div className="flex gap-1 mb-2 ml-8" data-oid=":n6n__x">
              {monthLabels.map((m, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      'text-[10px] font-black tracking-widest transition-colors',
                      isEven ? 'text-primary' : 'text-muted-foreground/60'
                    )}
                    style={{
                      marginLeft:
                        i === 0 ? 0 : `${(m.index - monthLabels[i - 1].index) * 14 - 12}px`,
                    }}
                    data-oid="t41hq2b"
                  >
                    {m.label}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1" data-oid="6csqzzi">
              <div className="flex flex-col gap-1 pr-3 pt-0.5" data-oid=".dob4zu">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div
                    key={day}
                    className="h-2.5 text-[8px] font-black text-muted-foreground/50 tracking-tighter leading-none flex items-center justify-end w-6"
                    data-oid="t.lzg51"
                  >
                    {i % 2 === 1 ? day : ''}
                  </div>
                ))}
              </div>
              <TooltipProvider delayDuration={0} data-oid="1sej.n-">
                <div className="flex gap-1.5" data-oid="afbzt6.">
                  {heatmapData.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1.5" data-oid="wom-ukf">
                      {week.map((day, dayIdx) => (
                        <Tooltip key={dayIdx} data-oid="l6422ih">
                          <TooltipTrigger asChild data-oid="katmbzy">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: (weekIdx * 7 + dayIdx) * 0.001,
                                type: 'spring',
                                stiffness: 300,
                                damping: 20,
                              }}
                              whileHover={{
                                scale: 1.4,
                                zIndex: 20,
                                transition: { duration: 0.1 },
                              }}
                              className={cn(
                                'w-2.5 h-2.5 rounded-full transition-all cursor-pointer ring-offset-background hover:ring-2 hover:ring-primary/50 relative overflow-hidden',
                                getColor(day.count),
                                day.count > 0 && 'shadow-[0_0_4px_rgba(var(--primary),0.2)]'
                              )}
                              data-oid="mi0ttee"
                            >
                              {day.count > 3 && (
                                <div
                                  className="absolute inset-0 bg-white/20 animate-pulse"
                                  data-oid="u0dyl_:"
                                />
                              )}
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent
                            className="rounded-xl border-border/70 bg-card/95 backdrop-blur-xl px-3 py-2 shadow-2xl border-opacity-50"
                            data-oid="qyb6-ju"
                          >
                            <div className="flex flex-col gap-0.5" data-oid="8duw2b0">
                              <p
                                className="text-[10px] font-black text-primary tracking-widest"
                                data-oid="svgo6_e"
                              >
                                {day.date.toLocaleDateString(undefined, { weekday: 'long' })}
                              </p>
                              <div className="flex items-center gap-2" data-oid="gnq.z2x">
                                {day.count > 0 && (
                                  <Zap
                                    className="w-3 h-3 text-amber-500 fill-amber-500"
                                    data-oid="g3qvltl"
                                  />
                                )}
                                <p
                                  className="text-xs font-black text-foreground"
                                  data-oid="my78nad"
                                >
                                  {day.count} {day.count === 1 ? 'test' : 'tests'} completed
                                </p>
                              </div>
                              <p
                                className="text-[9px] font-bold text-muted-foreground border-t border-border/30 mt-1 pt-1"
                                data-oid="gtkey.i"
                              >
                                {day.date.toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>

          <div className="mt-auto relative group" data-oid="uiz.tkm">
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/2 to-transparent rounded-xl border border-primary/10 group-hover:border-primary/30 transition-all"
              data-oid="pak8scq"
            />

            <div className="relative p-5 flex items-center gap-5" data-oid="ptcs1gr">
              <div
                className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                data-oid="v92-ant"
              >
                <Zap className="w-6 h-6 fill-primary-foreground/20" data-oid="xuw31ys" />
              </div>
              <div className="flex-1 space-y-1.5" data-oid="wem9net">
                <div className="flex items-center gap-2" data-oid="yije0l5">
                  <span
                    className="text-xs font-black text-foreground tracking-tight"
                    data-oid="0-paq0r"
                  >
                    Consistency is Key
                  </span>
                  <Badge
                    className="bg-primary/10 text-primary border-0 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full"
                    data-oid="-9.mz_m"
                  >
                    Insight
                  </Badge>
                </div>
                <p
                  className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-lg"
                  data-oid="tkrcemf"
                >
                  Students who practice at least{' '}
                  <span className="text-primary font-black" data-oid="-aie8vv">
                    3 days a week
                  </span>{' '}
                  improve their band score{' '}
                  <span className="text-foreground font-black italic" data-oid="r7k4aki">
                    2x faster
                  </span>
                  .
                  {stats.currentStreak > 0 ? (
                    <span className="ml-1 text-primary/80" data-oid="ljvla6-">
                      You're on a {stats.currentStreak}-day heater!
                    </span>
                  ) : (
                    ' Start a streak today!'
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
