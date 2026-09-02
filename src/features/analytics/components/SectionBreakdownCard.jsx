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
  Pill,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';
import { buildPacingSummary, sectionUnitLabel } from '../hooks/analyticsCalculations';
import { ITEM_VARIANTS } from '../constants';

/**
 * Pace against the exam limit, as one slim gauge line.
 *
 * Deliberately not another labelled meter bar — the card below it is a column
 * chart, and this row is a single reading, so it gets the thinnest possible
 * treatment rather than competing for attention with the data it introduces.
 */
function PaceStrip({ pace }) {
  if (!pace || pace.averageMinutes == null) return null;

  const limit = pace.benchmarkMinutes;
  const used = pace.averageMinutes;
  const delta = pace.deltaMinutes;
  const onPace = Math.abs(delta) <= 3;
  const over = delta > 3;
  // Track is scaled to whichever is longer so an overrun stays visible instead
  // of clipping to a full bar with the limit marker pushed off the edge.
  const scaleMax = Math.max(used, limit) || 1;
  const pct = (used / scaleMax) * 100;
  const limitPct = (limit / scaleMax) * 100;

  return (
    <Tip
      content={`You average ${used} minutes on ${pace.label}; the exam allows ${limit}. The notch marks the limit.`}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn(MICRO, MUTED, 'shrink-0')}>{pace.label} pace</span>
        <div className={cn('relative h-1.5 flex-1 overflow-hidden rounded-full', WELL)}>
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-[width] duration-700',
              over ? 'bg-[rgb(var(--signal-warn))]' : 'bg-[#5a63df]'
            )}
            style={{ width: `${pct}%` }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-slate-500/80 dark:bg-white/60"
            style={{ left: `${limitPct}%` }}
          />
        </div>
        <span
          className={cn(NUM, 'shrink-0 text-[10px] font-bold text-slate-700 dark:text-slate-200')}
        >
          {used}/{limit}m
        </span>
        <Pill tone={onPace ? 'ok' : over ? 'warn' : 'neutral'}>
          {onPace ? 'On pace' : over ? `${delta}m over` : `${Math.abs(delta)}m under`}
        </Pill>
      </div>
    </Tip>
  );
}

/**
 * Where inside a test the marks go — drawn in test order, left to right.
 *
 * This was a ranked list of horizontal bars, which was both the third such list
 * in a row on the page and the wrong shape for the question: position is a
 * *sequence*, and a candidate who holds up through passage one and collapses on
 * passage three has a clock problem that only shows up when the positions are
 * read in the order they are actually sat. Columns in natural order show that
 * drop-off; a weakest-first ranking actively hid it.
 */
function PositionColumns({ groups }) {
  return (
    <div className="flex flex-1 items-end gap-4">
      {groups.map((group) => (
        <div key={group.module} className="min-w-0 flex-1">
          <div className="flex items-end gap-1.5">
            {group.rows.map((row) => (
              <Tip
                key={row.section}
                content={`${row.module} ${sectionUnitLabel(row.module).toLowerCase()} ${row.position} — ${row.correct} of ${row.total} correct${row.avgMinutes != null ? `, ${row.avgMinutes} min average` : ''}`}
              >
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span
                    className={cn(
                      NUM,
                      'text-[10px] font-bold',
                      row.isWeakest
                        ? 'text-[rgb(var(--signal-warn))]'
                        : 'text-slate-700 dark:text-slate-200'
                    )}
                  >
                    {row.accuracy}%
                  </span>
                  <div className={cn('relative h-[86px] w-full overflow-hidden rounded-md', WELL)}>
                    <div
                      className={cn(
                        'absolute inset-x-0 bottom-0 rounded-md transition-[height] duration-700',
                        row.isWeakest ? 'bg-[rgb(var(--signal-warn)/0.55)]' : 'bg-[#5a63df]/70'
                      )}
                      style={{ height: `${Math.max(row.accuracy, 2)}%` }}
                    />
                  </div>
                  <span className={cn(NUM, MICRO, MUTED)}>{row.position}</span>
                </div>
              </Tip>
            ))}
          </div>
          <p
            className={cn(
              MICRO,
              MUTED,
              'mt-2 truncate border-t border-[#eceafa] pt-1.5 text-center dark:border-white/[0.07]'
            )}
          >
            {group.module} {sectionUnitLabel(group.module).toLowerCase()}s
          </p>
        </div>
      ))}
    </div>
  );
}

export default function SectionBreakdownCard({ sectionPerformance = [], efficiency, coverage }) {
  const pace = useMemo(() => buildPacingSummary(efficiency || {})[0], [efficiency]);
  const hasPartialCoverage =
    coverage?.objectiveSessions > 0 && coverage.sectionSessions < coverage.objectiveSessions;

  const { groups, worst } = useMemo(() => {
    const rows = [...sectionPerformance];
    if (!rows.length) return { groups: [], worst: null };

    const lowest = rows.reduce((low, row) => (row.accuracy < low.accuracy ? row : low), rows[0]);

    // Natural test order within each module — the sequence is the whole point.
    const byModule = new Map();
    rows
      .sort((a, b) => a.module.localeCompare(b.module) || a.position - b.position)
      .forEach((row) => {
        if (!byModule.has(row.module)) byModule.set(row.module, []);
        byModule.get(row.module).push({ ...row, isWeakest: row.section === lowest.section });
      });

    return {
      groups: [...byModule.entries()].map(([module, moduleRows]) => ({
        module,
        rows: moduleRows,
      })),
      worst: lowest,
    };
  }, [sectionPerformance]);

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Accuracy by position"
          tip="Accuracy for each passage or part in the order you sit them — this is where a timing problem shows up as a late drop-off."
        />

        <PaceStrip pace={pace} />

        {groups.length === 0 ? (
          <Empty icon={LayoutList} className="flex-1 content-center">
            Complete a Reading or Listening test to see accuracy per passage or part.
          </Empty>
        ) : (
          <PositionColumns groups={groups} />
        )}

        <PanelFootnote>
          {hasPartialCoverage ? (
            <>
              Breakdown available for{' '}
              <span className={cn(NUM, 'font-bold')}>{coverage.sectionSessions}</span> of{' '}
              <span className={cn(NUM, 'font-bold')}>{coverage.objectiveSessions}</span> graded
              Reading/Listening tests in this period.
            </>
          ) : worst ? (
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
