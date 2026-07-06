import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        return 'bg-blue-200 dark:bg-blue-600';
      case 2:
        return 'bg-blue-400 dark:bg-blue-400';
      case 3:
      case 4:
        return 'bg-blue-600 dark:bg-blue-300';
      default:
        // Fallback
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  return (
    <Card
      className={cn(
        'relative rounded-2xl h-full flex flex-col',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'shadow-sm'
      )}
      data-oid="4dgh0kh"
    >
      <CardHeader className="p-5 sm:p-6 pb-2 relative z-10" data-oid="d88298x">
        <div className="flex flex-col gap-2" data-oid="tty22xw">
          <div className="flex items-center justify-between gap-3" data-oid="f1atz4q">
            <div className="flex items-center gap-2.5 min-w-0">
              <Calendar
                className="w-5 h-5 text-blue-600 dark:text-blue-500 shrink-0"
                data-oid="1_4wiyb"
              />
              <CardTitle
                className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate"
                data-oid="cd_:gl-"
              >
                Activity Hub
              </CardTitle>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shrink-0"
              data-oid="9alfodk"
            >
              <span
                className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider"
                data-oid="intensity-label"
              >
                Intensity
              </span>
              <div className="flex gap-0.5" data-oid="intensity-dots">
                <div className={cn('w-2 h-2 rounded-full', getColor(1))} data-oid="abpak-:" />
                <div className={cn('w-2 h-2 rounded-full', getColor(2))} data-oid="a08vk5r" />
                <div className={cn('w-2 h-2 rounded-full', getColor(3))} data-oid="_zk0z49" />
              </div>
            </div>
          </div>

          <p
            className="text-xs text-slate-500 dark:text-slate-400 leading-normal"
            data-oid="xn1km3q"
          >
            Your daily test activity over the last 12 weeks.
          </p>
        </div>
      </CardHeader>

      <CardContent
        className="relative px-5 py-6 sm:px-6 pt-4 flex-1 flex flex-col justify-center z-10"
        data-oid="zxfz524"
      >
        <div
          className="relative w-full flex items-center justify-start min-h-[160px] overflow-x-auto overflow-y-hidden pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          data-oid="-ui3chd"
        >
          <TooltipProvider delayDuration={0} data-oid="grid-tooltip-provider">
            <div
              className="flex gap-1.5 sm:gap-2 min-w-max relative z-10 mx-auto px-2"
              data-oid="0fk3x1i"
            >
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1.5 sm:gap-2" data-oid=":1fvh2m">
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const dayData = week[dayIdx];
                    if (!dayData) {
                      return (
                        <div
                          key={dayIdx}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-transparent"
                          data-oid="9alz25o"
                        />
                      );
                    }

                    return (
                      <Tooltip key={dayIdx} data-oid="ob4y1_3">
                        <TooltipTrigger asChild data-oid="d-cn9tm">
                          <div
                            className={cn(
                              'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 cursor-pointer hover:scale-125 hover:z-20 relative hover:shadow-lg',
                              getColor(dayData.intensity),
                              dayData.intensity === 0 && 'hover:bg-blue-100 dark:hover:bg-slate-700'
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
