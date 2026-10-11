import React, { useState } from 'react';
import {
  CalendarCheck2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Hourglass,
  Scale,
  Sprout,
  TreeDeciduous,
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import { cn } from '@/lib/cn';
import { IconChip, MICRO, NUM, PANEL } from '@/features/dashboard/components/primitives';
import OnboardingChoice from '../OnboardingChoice';

// Each pace gets its own glyph so the rows scan apart at a glance, growing
// from a sprint to a tree. Three months is flagged because it is the window
// the Exam Pass is built around.
const OPTIONS = [
  {
    weeks: 4,
    title: 'Within 1 month',
    description: 'Focused study',
    meta: '4 wk',
    icon: Crosshair,
  },
  { weeks: 8, title: 'Within 2 months', description: 'Balanced pace', meta: '8 wk', icon: Scale },
  {
    weeks: 12,
    title: 'Within 3 months',
    description: 'Room to build every skill',
    meta: '12 wk',
    icon: Sprout,
    badge: 'Recommended',
  },
  {
    weeks: 16,
    title: 'Within 4 months',
    description: 'Steady, unhurried prep',
    meta: '16 wk',
    icon: TreeDeciduous,
  },
];

// Booking windows rarely open more than a year out; two keeps late planners in.
const BOOKING_HORIZON_YEARS = 2;

function ExamTicket({ examDate, isEstimate, today }) {
  if (!examDate) {
    return (
      <div className="onboarding-ticket is-empty" role="status">
        <IconChip icon={Hourglass} tone="accent" size="md" />
        <p>
          <strong>No date yet?</strong> Pick an estimate — a target keeps the plan paced.
        </p>
      </div>
    );
  }
  const days = differenceInCalendarDays(examDate, today);
  const weeks = Math.round(days / 7);
  return (
    <div className="onboarding-ticket" role="status">
      <IconChip icon={isEstimate ? CalendarClock : CalendarCheck2} tone="accent" size="md" />
      <div className="min-w-0">
        <p className={cn(MICRO, 'onboarding-ticket__label')}>
          {isEstimate ? 'Estimated exam' : 'Exam day'}
        </p>
        <p key={examDate.toISOString()} className="onboarding-ticket__date">
          {format(examDate, isEstimate ? 'MMMM yyyy' : 'EEEE, d MMMM yyyy')}
          {isEstimate && (
            <span className="onboarding-ticket__approx">
              {' '}
              · around the {format(examDate, 'do')}
            </span>
          )}
        </p>
      </div>
      <div className="onboarding-ticket__countdown">
        <span className={cn(NUM, 'onboarding-ticket__days')}>{days}</span>
        <span className={cn(MICRO, 'onboarding-ticket__unit')}>
          {days === 1 ? 'day' : 'days'}
          {days >= 7 && ` · ${weeks} wk`}
        </span>
      </div>
    </div>
  );
}

function ExamCalendar({ today, examDate, isEstimate, month, onMonthChange, onSelect }) {
  const [direction, setDirection] = useState(1);
  const lastMonth = startOfMonth(addYears(today, BOOKING_HORIZON_YEARS));
  const canGoBack = isAfter(month, startOfMonth(today));
  const canGoForward = isBefore(month, lastMonth);

  const go = (delta) => {
    setDirection(delta);
    onMonthChange(addMonths(month, delta));
  };

  // Shade the run-up from tomorrow to the day before the exam.
  const prepRange =
    examDate && differenceInCalendarDays(examDate, today) > 1
      ? { from: addDays(today, 1), to: subDays(examDate, 1) }
      : undefined;

  return (
    <div className={cn(PANEL, 'onboarding-calendar')} data-rise style={{ '--i': 4 }}>
      <div className="onboarding-calendar__head">
        <div>
          <p className={cn(MICRO, 'onboarding-eyebrow')}>Already booked?</p>
          <p className="onboarding-calendar__month" aria-live="polite">
            {format(month, 'MMMM')} <span className={NUM}>{format(month, 'yyyy')}</span>
          </p>
        </div>
        <div className="onboarding-calendar__nav">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!canGoBack}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!canGoForward}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        key={format(month, 'yyyy-MM')}
        className="onboarding-calendar__grid"
        data-direction={direction > 0 ? 'next' : 'prev'}
      >
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={onMonthChange}
          weekStartsOn={1}
          fixedWeeks
          showOutsideDays
          disableNavigation
          fromDate={today}
          toDate={addYears(today, BOOKING_HORIZON_YEARS)}
          selected={!isEstimate && examDate ? examDate : undefined}
          onSelect={(date) => date && onSelect(startOfDay(date))}
          modifiers={{
            prep: prepRange ? [prepRange] : [],
            estimate: isEstimate && examDate ? [examDate] : [],
          }}
          modifiersClassNames={{
            prep: 'is-prep',
            estimate: 'is-estimate',
          }}
          formatters={{ formatWeekdayName: (day) => format(day, 'EEEEE') }}
          classNames={{
            months: 'onboarding-calendar__months',
            month: 'onboarding-calendar__monthgrid',
            caption: 'sr-only',
            table: 'onboarding-calendar__table',
            head_row: 'onboarding-calendar__row',
            head_cell: 'onboarding-calendar__weekday',
            row: 'onboarding-calendar__row',
            cell: 'onboarding-calendar__cell',
            day: 'onboarding-calendar__day',
            day_selected: 'is-selected',
            day_today: 'is-today',
            day_disabled: 'is-disabled',
            day_outside: 'is-outside',
            day_hidden: 'invisible',
          }}
        />
      </div>
      <div className="onboarding-calendar__legend" aria-hidden="true">
        <span>
          <i className="is-today-dot" /> Today
        </span>
        <span>
          <i className="is-prep-swatch" /> Prep window
        </span>
        <span>
          <i className="is-exam-swatch" /> Exam
        </span>
      </div>
    </div>
  );
}

export default function TimelineStep({ timelineType, estimatedWeeks, testDate, onChangeTimeline }) {
  const today = startOfDay(new Date());
  const isEstimate = timelineType === 'estimated' && Boolean(estimatedWeeks);
  const examDate =
    timelineType === 'specific' && testDate
      ? startOfDay(new Date(testDate))
      : isEstimate
        ? addWeeks(today, estimatedWeeks)
        : null;

  const [month, setMonth] = useState(() => startOfMonth(examDate || today));

  // Picking an estimate carries the calendar to that month, so the learner sees
  // where the plan is aiming rather than an unchanged grid.
  const showMonthOf = (date) => {
    if (differenceInCalendarMonths(date, month) !== 0) setMonth(startOfMonth(date));
  };

  return (
    <div className="onboarding-timeline">
      <div className="onboarding-timeline__estimates">
        <p className={cn(MICRO, 'onboarding-eyebrow')} data-rise style={{ '--i': 3 }}>
          Not booked yet? Estimate
        </p>
        <div className="onboarding-timeline-rows">
          {OPTIONS.map((option, index) => (
            <OnboardingChoice
              key={option.weeks}
              icon={option.icon}
              title={option.title}
              description={option.description}
              meta={option.meta}
              badge={option.badge}
              index={index + 1}
              compact
              selected={isEstimate && estimatedWeeks === option.weeks}
              onClick={() => {
                showMonthOf(addWeeks(today, option.weeks));
                onChangeTimeline({
                  timeline_type: 'estimated',
                  estimated_weeks: option.weeks,
                  test_date: null,
                });
              }}
            />
          ))}
        </div>
      </div>

      <ExamCalendar
        today={today}
        examDate={examDate}
        isEstimate={isEstimate}
        month={month}
        onMonthChange={setMonth}
        onSelect={(date) =>
          onChangeTimeline({
            timeline_type: 'specific',
            estimated_weeks: null,
            test_date: date,
          })
        }
      />

      <div className="onboarding-timeline__ticket" data-rise style={{ '--i': 6 }}>
        <ExamTicket examDate={examDate} isEstimate={isEstimate} today={today} />
      </div>
    </div>
  );
}
