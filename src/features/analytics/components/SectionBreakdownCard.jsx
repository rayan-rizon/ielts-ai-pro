import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { LayoutList } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  WELL,
} from '@/features/dashboard/components/primitives';
import { sectionUnitLabel } from '../hooks/analyticsCalculations';
import { ITEM_VARIANTS } from '../constants';

/**
 * Accuracy by passage / part position, not just by module.
 *
 * A band 6 Reading average can hide a candidate who nails passages one and two
 * and collapses on three — a clock problem, not a comprehension one. This is
 * the only place on the page that breaks a module down by position instead of
 * averaging it away, and it is built entirely from `sectionStats` +
 * `passageTimes`, both already recorded and previously unused.
 */
export default function SectionBreakdownCard({ sectionPerformance = [] }) {
  const rows = useMemo(
    () => [...sectionPerformance].sort((a, b) => a.accuracy - b.accuracy).slice(0, 6),
    [sectionPerformance]
  );

  const worst = rows[0];

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Accuracy by position"
          tip="Accuracy for each passage or part position — reveals whether marks are lost early or late in a test."
        />

        {rows.length === 0 ? (
          <Empty icon={LayoutList} className="flex-1 content-center">
            Complete a Reading or Listening test to see accuracy per passage or part.
          </Empty>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.section} className="flex items-center gap-2.5">
                <div className={cn('relative h-7 flex-1 overflow-hidden rounded-md', WELL)}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-md bg-[#5a63df]/[0.16] transition-[width] duration-700"
                    style={{ width: `${row.accuracy}%` }}
                  />
                  <div className="relative flex h-full items-center justify-between px-2.5">
                    <span className="truncate text-[10.5px] font-extrabold text-slate-800 dark:text-slate-100">
                      {row.module.charAt(0).toUpperCase() + row.module.slice(1)}{' '}
                      {sectionUnitLabel(row.module)} {row.position}
                    </span>
                    {row.avgMinutes != null ? (
                      <span className={cn(MICRO, MUTED, 'shrink-0')}>
                        <span className={NUM}>{row.avgMinutes}</span>m avg
                      </span>
                    ) : null}
                  </div>
                </div>
                <span
                  className={cn(
                    NUM,
                    'w-9 shrink-0 text-right text-sm font-bold text-slate-900 dark:text-slate-50'
                  )}
                >
                  {row.accuracy}%
                </span>
              </div>
            ))}
          </div>
        )}

        <PanelFootnote>
          {worst ? (
            <>
              Weakest is{' '}
              <span className="font-bold capitalize">
                {worst.module} {sectionUnitLabel(worst.module).toLowerCase()} {worst.position}
              </span>{' '}
              at <span className={cn(NUM, 'font-bold')}>{worst.accuracy}</span>%.
            </>
          ) : (
            'Built from every graded passage or part, oldest to newest.'
          )}
        </PanelFootnote>
      </section>
    </m.div>
  );
}
