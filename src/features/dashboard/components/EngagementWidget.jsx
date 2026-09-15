import React, { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { FootNum, MICRO, MUTED, PANEL, PanelFootnote, PanelTitle, Tip } from './primitives';

const TOTAL_DAYS = 84; // 12 weeks
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function toLocalKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// `date.toLocaleDateString(undefined, opts)` builds a fresh Intl.DateTimeFormat
// on every call. The grid used to format each of its 84 cells twice per render
// — once for the tooltip, once for the aria-label — which is 168 formatter
// constructions for 84 distinct strings. One reused formatter, and the strings
// computed alongside the grid, costs nothing per render.
const DATE_LABEL_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

/**
 * Twelve weeks of practice as a heat grid. Opacity encodes volume — same
 * technique as the admin retention grid — so the whole quarter reads as one
 * texture rather than a wall of categorical colours.
 */
const EngagementWidget = React.memo(({ dailyActivity = {} }) => {
  const { weeks, activeDays, totalSessions, best } = useMemo(() => {
    const today = new Date();
    const todayKey = toLocalKey(today);
    const days = [];

    for (let i = TOTAL_DAYS - 1; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const count = Number(dailyActivity[toLocalKey(date)]) || 0;
      const isToday = toLocalKey(date) === todayKey;
      const dateLabel = DATE_LABEL_FORMAT.format(date);
      const sessions = `${count} session${count === 1 ? '' : 's'}`;

      days.push({
        date,
        count,
        isToday,
        tip:
          isToday && count === 0
            ? `Today · No sessions yet — sit a test to log Day 1`
            : `${sessions} · ${dateLabel}`,
        ariaLabel: `${sessions} on ${dateLabel}${isToday ? ' (Today)' : ''}`,
      });
    }

    const grouped = [];
    let current = new Array(days[0].date.getDay()).fill(null);
    for (const day of days) {
      current.push(day);
      if (day.date.getDay() === 6) {
        grouped.push(current);
        current = [];
      }
    }
    if (current.length) grouped.push(current);

    return {
      weeks: grouped,
      activeDays: days.filter((day) => day.count > 0).length,
      totalSessions: days.reduce((sum, day) => sum + day.count, 0),
      best: days.reduce((max, day) => Math.max(max, day.count), 0),
    };
  }, [dailyActivity]);

  // Scale opacity against the busiest day so the grid stays readable whether
  // the user does one session a week or ten.
  const ceiling = Math.max(best, 4);
  const opacityFor = (count) => (count === 0 ? 0.05 : 0.18 + (count / ceiling) * 0.62);

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label="Practice history · 12w"
        tip="Darker = more sessions that day."
        action={
          <div className="flex items-center gap-1.5">
            <span className={cn(MICRO, MUTED)}>less</span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 4].map((step) => (
                <span
                  key={step}
                  className="h-2.5 w-2.5 rounded-[3px]"
                  style={{
                    backgroundColor: `rgb(var(--panel-accent-tint) / ${opacityFor(step)})`,
                  }}
                />
              ))}
            </div>
            <span className={cn(MICRO, MUTED)}>more</span>
          </div>
        }
      />

      {/* Columns are flex-1 so the grid always spans the full card width — a
          fixed pixel cell size left a dead gap on wide cards since 12 weeks of
          14px squares rarely matched the column's actual width. aspect-square
          keeps each cell true regardless of how wide that ends up being. */}
      <div className="flex flex-1 items-stretch gap-1.5">
        <div className="flex w-5 shrink-0 flex-col gap-1">
          {DAY_LABELS.map((label, index) => (
            <span key={index} className={cn(MICRO, MUTED, 'flex flex-1 items-center leading-none')}>
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-1 gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-1 flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const day = week[dayIndex];
                if (!day) return <span key={dayIndex} className="aspect-square w-full" />;
                const isToday = day.isToday;
                return (
                  <Tip key={dayIndex} content={day.tip}>
                    <button
                      type="button"
                      aria-label={day.ariaLabel}
                      className={cn(
                        'aspect-square w-full rounded-[3px] transition-transform duration-100 ease-smooth-out hover:scale-[1.25] active:scale-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5a63df]',
                        isToday &&
                          'ring-1 ring-[#5a63df] dark:ring-[#8f97ff] ring-offset-1 dark:ring-offset-[#141319]'
                      )}
                      style={{
                        backgroundColor: `rgb(var(--panel-accent-tint) / ${opacityFor(day.count)})`,
                      }}
                    />
                  </Tip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <PanelFootnote>
        {totalSessions > 0 ? (
          <>
            <FootNum>{totalSessions}</FootNum> sessions across <FootNum>{activeDays}</FootNum> of{' '}
            <FootNum>84</FootNum> days
          </>
        ) : (
          <>today is day 1 · complete any paper to log your first session</>
        )}
      </PanelFootnote>
    </div>
  );
});

EngagementWidget.displayName = 'EngagementWidget';

export default EngagementWidget;
