import React from 'react';
import { m } from 'framer-motion';
import { CalendarClock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';
import { ITEM_VARIANTS } from '../constants';

function rhythmCopy(rhythm) {
  if (!rhythm || rhythm.activeDays === 0) return 'No sessions in this period yet.';
  if (rhythm.daysSinceLast > 6) {
    return `It has been ${rhythm.daysSinceLast} days since your last session.`;
  }
  if (rhythm.consistency >= 60) return 'Regular practice — this is what moves a band score.';
  if (rhythm.consistency >= 30)
    return 'Practice is patchy. A steady daily habit beats occasional long sessions.';
  return 'Practice is sparse. A short session most days will help more than one long one.';
}

/**
 * How the learner practises, not just how much.
 *
 * Two signals neither existed anywhere on this page: whether practice is
 * spread across the week or crammed into one sitting, and whether revising an
 * answer actually helps this specific learner or just burns their clock. Both
 * are answerable from data already recorded on every session; neither was
 * being asked.
 */
export default function PracticeHabitsCard({ practiceRhythm, behaviour }) {
  const rhythm = practiceRhythm || {
    activeDays: 0,
    spanDays: 0,
    consistency: 0,
    daysSinceLast: null,
  };
  const hasRevisionSignal = behaviour?.hasSignal;
  const edge = behaviour?.revisionEdge;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Practice habits"
          tip="How consistently you practise, and whether changing an answer tends to help or hurt you."
        />

        <div className="grid grid-cols-2 gap-2.5">
          <div className={cn(TILE, 'p-3')}>
            <div className="flex items-center gap-1.5">
              <CalendarClock
                className="h-3 w-3 text-[#5a63df] dark:text-[#a9afff]"
                strokeWidth={2.25}
              />
              <span className={cn(MICRO, MUTED)}>Consistency</span>
            </div>
            <p className="mt-1.5 flex items-baseline gap-1">
              <span className={cn(NUM, 'text-xl font-extrabold text-slate-900 dark:text-slate-50')}>
                {rhythm.consistency}
              </span>
              <span className={cn(MICRO, MUTED)}>%</span>
            </p>
            <p className={cn(MICRO, MUTED, 'mt-1')}>
              <span className={NUM}>{rhythm.activeDays}</span> active of{' '}
              <span className={NUM}>{rhythm.spanDays}</span> days
            </p>
          </div>

          <div className={cn(TILE, 'p-3')}>
            <div className="flex items-center gap-1.5">
              <RefreshCw
                className="h-3 w-3 text-[#5a63df] dark:text-[#a9afff]"
                strokeWidth={2.25}
              />
              <span className={cn(MICRO, MUTED)}>Revision edge</span>
            </div>
            {hasRevisionSignal && edge != null ? (
              <>
                <p className="mt-1.5 flex items-baseline gap-1">
                  <span
                    className={cn(
                      NUM,
                      'text-xl font-extrabold',
                      edge >= 0 ? 'text-[rgb(var(--signal-ok))]' : 'text-[rgb(var(--signal-fault))]'
                    )}
                  >
                    {edge > 0 ? '+' : ''}
                    {edge}
                  </span>
                  <span className={cn(MICRO, MUTED)}>pts</span>
                </p>
                <p className={cn(MICRO, MUTED, 'mt-1')}>
                  {edge >= 3
                    ? 'Revising answers is helping you.'
                    : edge <= -3
                      ? 'Revising answers is costing you marks.'
                      : 'No clear difference either way.'}
                </p>
              </>
            ) : (
              <p className={cn(MICRO, MUTED, 'mt-1.5')}>
                Not enough revised questions yet to tell.
              </p>
            )}
          </div>
        </div>

        {behaviour?.hasTiming ? (
          <div className="mt-2.5 flex items-center gap-2">
            {behaviour.rushed > 0 ? (
              <Pill tone="warn">
                <span className={NUM}>{behaviour.rushed}</span> rushed (&lt;20s)
              </Pill>
            ) : null}
            {behaviour.overanalysed > 0 ? (
              <Pill tone="accent">
                <span className={NUM}>{behaviour.overanalysed}</span> overthought (&gt;2.5m)
              </Pill>
            ) : null}
          </div>
        ) : null}

        <PanelFootnote>{rhythmCopy(rhythm)}</PanelFootnote>
      </section>
    </m.div>
  );
}
