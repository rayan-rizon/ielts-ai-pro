import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const EngagementWidget = React.memo(({ dailyActivity = {} }) => {
  // Generate last 84 days (12 weeks) to fit sidebar better
  const weeks = useMemo(() => {
    const totalDays = 84;
    const days = [];
    const today = new Date();

    // Generate dates going back in time
    for (let i = 0; i < totalDays; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (totalDays - 1 - i));
      days.push(d);
    }

    // Group by weeks for column-major layout (Standard Calendar Heatmap)
    const weeksData = [];
    let currentWeek = [];

    days.forEach((date) => {
      // Use YYYY-MM-DD (local) for stable matching between JS and Postgres
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const count = dailyActivity[dateStr] || 0;

      // Intensity mapping (0-4 like GitHub)
      let intensity = 0;
      if (count > 0) intensity = 1;
      if (count > 2) intensity = 2;
      if (count > 4) intensity = 3;
      if (count > 6) intensity = 4;

      currentWeek.push({ date, dateStr, count, intensity });

      // If it's Saturday (6) or last day of array, push week
      if (date.getDay() === 6 || date === days[days.length - 1]) {
        weeksData.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeksData;
  }, [dailyActivity]);

  // Color map
  const getColor = (intensity) => {
    switch (intensity) {
      case 1:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-700/30';
      case 2:
        return 'bg-blue-200 dark:bg-blue-600/60 border-blue-300 dark:border-blue-500/50';
      case 3:
        return 'bg-blue-400 dark:bg-blue-500 border-blue-500 dark:border-blue-400 shadow-sm';
      case 4:
        return 'bg-blue-600 dark:bg-blue-400 border-blue-700 dark:border-blue-300 shadow-[0_0_12px_rgba(37,99,235,0.4)] dark:shadow-[0_0_15px_rgba(96,165,250,0.6)]';
      default:
        // Fallback, though usually handled by the component logic now
        return 'bg-white/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50';
    }
  };

  return (
    <Card
      className={cn(
        'relative rounded-2xl transition-all duration-300 overflow-hidden group h-full flex flex-col',
        'bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl',
        'border border-white/60 dark:border-white/[0.12]',
        'shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        'hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.2)] dark:hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.6)]',
        'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
      )}
      data-oid="4dgh0kh"
    >
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"
        data-oid="hm6saey"
      />

      {/* Dynamic Gradient Overlay - Made more subtle to match Skill Matrix */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-indigo-500/5"
        data-oid="opj4a9r"
      />

      <CardHeader className="p-4 pb-0 relative z-10" data-oid="d88298x">
        <div className="flex items-center justify-between" data-oid="tty22xw">
          <CardTitle
            className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5"
            data-oid="f1atz4q"
          >
            <div
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-sm transition-transform group-hover:rotate-12"
              data-oid="5vqr977"
            >
              <Activity
                className="w-4 h-4 transition-transform duration-500 group-hover:scale-110"
                data-oid="1_4wiyb"
              />
            </div>
            <div data-oid="1cng8oz">
              <span className="tracking-tight" data-oid="cd_:gl-">
                Activity Hub
              </span>
              <p
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-6"
                data-oid="xn1km3q"
              >
                PERFORMANCE PULSE
              </p>
            </div>
          </CardTitle>

          <div
            className="flex gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5"
            data-oid="9alfodk"
          >
            <div
              className="w-2.5 h-2.5 rounded-full bg-blue-300 dark:bg-blue-800/60"
              data-oid="abpak-:"
            />

            <div
              className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-600/60 shadow-sm"
              data-oid="a08vk5r"
            />

            <div
              className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400/80 shadow-md"
              data-oid="_zk0z49"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent
        className="relative p-6 pt-2 flex-1 flex flex-col justify-center z-10"
        data-oid="zxfz524"
      >
        <div
          className="relative w-full bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm group/heatmap overflow-hidden min-h-[160px] flex items-center justify-center"
          data-oid="-ui3chd"
        >
          {/* Subtle Glow behind the heatmap - strengthened */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-indigo-500/[0.03] dark:from-blue-500/[0.08] dark:to-indigo-500/[0.08] pointer-events-none"
            data-oid="q85zzw1"
          />

          <TooltipProvider delayDuration={0} data-oid="grid-tooltip-provider">
            <div className="flex gap-2 min-w-max relative z-10 justify-center" data-oid="0fk3x1i">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-2" data-oid=":1fvh2m">
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const dayData = week[dayIdx];
                    if (!dayData) {
                      return (
                        <div
                          key={dayIdx}
                          className="w-3.5 h-3.5 rounded-[4px] bg-transparent"
                          data-oid="9alz25o"
                        />
                      );
                    }

                    return (
                      <Tooltip key={dayIdx} data-oid="ob4y1_3">
                        <TooltipTrigger asChild data-oid="d-cn9tm">
                          <div
                            className={cn(
                              'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] border transition-all duration-200 cursor-pointer',
                              'hover:scale-125 hover:z-20 relative hover:shadow-lg',
                              dayData.intensity === 0
                                ? 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400'
                                : getColor(dayData.intensity)
                            )}
                            data-oid="ubtw9wq"
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-slate-900 border-none py-3 px-4 rounded-xl shadow-2xl backdrop-blur-xl z-50 min-w-[140px]"
                          data-oid="9zs505-"
                        >
                          <div className="flex flex-col gap-1.5" data-oid="tooltip-container">
                            <div
                              className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                              data-oid="oimq4cm"
                            >
                              {dayData.date.toLocaleDateString([], {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div
                              className="text-base font-black text-white flex items-center justify-between gap-3"
                              data-oid="q3v5ztt"
                            >
                              <span data-oid="sessions-count">
                                {dayData.count} Session{dayData.count !== 1 ? 's' : ''}
                              </span>
                              <div
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  dayData.intensity === 0
                                    ? 'bg-slate-700'
                                    : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                                )}
                                data-oid="2e.skra"
                              />
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
});

EngagementWidget.displayName = 'EngagementWidget';

export default EngagementWidget;
