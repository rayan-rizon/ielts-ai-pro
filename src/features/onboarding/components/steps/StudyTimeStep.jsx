import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { BarChart3, CalendarClock, Coffee, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, NUM } from '@/features/dashboard/components/primitives';
import StudyAvailabilityEditor from '@/features/learning/components/StudyAvailabilityEditor';
import OnboardingChoice from '../OnboardingChoice';

const PRESETS = [
  {
    title: '1–3 hours',
    description: 'A little, consistently',
    icon: Coffee,
    days: { monday: 40, wednesday: 40, saturday: 40 },
    min: 60,
    max: 180,
  },
  {
    title: '4–7 hours',
    description: 'A balanced weekly routine',
    icon: BarChart3,
    days: { monday: 60, wednesday: 60, friday: 60, saturday: 120 },
    min: 240,
    max: 420,
  },
  {
    title: '8–12 hours',
    description: 'Room for focused practice',
    icon: Zap,
    days: { monday: 120, tuesday: 120, thursday: 120, friday: 120, saturday: 120 },
    min: 480,
    max: 720,
  },
];

const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
// Bars scale against the longest day, never less than two hours, so a light
// week still reads as light.
const MIN_CEILING = 120;

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** A seven-bar readout of the week the presets or the editor produce. */
function WeekStrip({ days }) {
  const minutes = WEEK.reduce((sum, day) => sum + (Number(days[day]) || 0), 0);
  const activeDays = WEEK.filter((day) => Number(days[day]) > 0).length;
  const ceiling = Math.max(MIN_CEILING, ...WEEK.map((day) => Number(days[day]) || 0));
  return (
    <div className="onboarding-week" data-rise style={{ '--i': 7 }}>
      <div className="onboarding-week__bars" aria-hidden="true">
        {WEEK.map((day) => {
          const value = Number(days[day]) || 0;
          return (
            <div key={day} className={cn('onboarding-week__day', value > 0 && 'is-active')}>
              <span className="onboarding-week__track">
                <span
                  className="onboarding-week__fill"
                  style={{ '--h': `${Math.min(100, (value / ceiling) * 100)}%` }}
                />
              </span>
              <span className={cn(MICRO, 'onboarding-week__label')}>{day.slice(0, 2)}</span>
            </div>
          );
        })}
      </div>
      <div className="onboarding-week__total" aria-live="polite">
        <span className={cn(NUM, 'onboarding-week__minutes')}>{formatDuration(minutes)}</span>
        <span className={cn(MICRO, 'onboarding-week__caption')}>
          <span className={NUM}>{activeDays}</span> {activeDays === 1 ? 'day' : 'days'} a week
        </span>
      </div>
    </div>
  );
}

export default function StudyTimeStep({ studyHoursGoal, studyAvailability, onChangeAvailability }) {
  const [customize, setCustomize] = useState(false);
  const editorRef = useRef(null);
  const reduceMotion = useReducedMotion();
  // The editor opens below the fold of the fixed-height frame; bring it into
  // view so opening it visibly does something.
  useEffect(() => {
    if (!customize) return;
    editorRef.current?.scrollIntoView?.({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [customize, reduceMotion]);
  const days = studyAvailability?.days || {};
  const minutes = Object.values(days).reduce((sum, value) => sum + (Number(value) || 0), 0);
  return (
    <div className="onboarding-study">
      <div className="onboarding-choice-grid">
        {PRESETS.map((preset, index) => (
          <OnboardingChoice
            key={preset.title}
            {...preset}
            index={index}
            selected={!customize && minutes >= preset.min && minutes <= preset.max}
            onClick={() => {
              setCustomize(false);
              onChangeAvailability({ ...studyAvailability, days: preset.days });
            }}
          />
        ))}
        <OnboardingChoice
          title="My own schedule"
          description="Pick your days and minutes"
          icon={CalendarClock}
          index={3}
          selected={customize}
          onClick={() => setCustomize(true)}
        />
      </div>
      <WeekStrip days={days} />
      <div className="onboarding-study__footer" data-rise style={{ '--i': 8 }}>
        <p>A steady routine beats a perfect schedule. You can adjust it anytime.</p>
        <button
          type="button"
          className="onboarding-text-button"
          aria-expanded={customize}
          onClick={() => setCustomize((open) => !open)}
        >
          {customize ? 'Hide daily limits' : 'Adjust days & minutes'}
        </button>
      </div>
      {customize && (
        <div ref={editorRef} className="onboarding-study__editor">
          <StudyAvailabilityEditor
            value={studyAvailability}
            legacyWeeklyHours={studyHoursGoal}
            onChange={onChangeAvailability}
            compact
          />
        </div>
      )}
    </div>
  );
}
