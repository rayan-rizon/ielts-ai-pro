import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
} from '@/features/dashboard/components/primitives';
import { ITEM_VARIANTS } from '../constants';
import QuestionTypeChart from './QuestionTypeChart';
import { getQuestionSuccessSummary, marksLost } from './questionTypeHelpers';

/**
 * Measured accuracy per IELTS question format.
 *
 * This replaced the dashboard's mastery panel on this page. Both ranked
 * question types weakest-first; this one is counted from graded answers
 * (`correct / total`) rather than an estimated mastery probability, so it is
 * the version that can be checked against a learner's own paper.
 */
const EMPTY = [];

export default function QuestionSuccessCard({ stats }) {
  const data = stats?.typeAccuracy || EMPTY;
  const summary = getQuestionSuccessSummary(data);

  // The format bleeding the most marks — the one row worth acting on, and the
  // same ordering the grid itself uses.
  const costliest = useMemo(() => {
    if (!data.length) return null;
    return [...data].sort((a, b) => marksLost(b) - marksLost(a) || a.accuracy - b.accuracy)[0];
  }, [data]);

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Question types"
          accent
          tip="Accuracy per IELTS question format across every graded test in this period, ordered by how many marks each one is costing you."
          action={
            summary.total ? (
              <span className={cn(MICRO, MUTED)}>
                <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
                  {summary.accuracy}
                </span>
                % overall
              </span>
            ) : (
              <Pill tone="neutral">No data</Pill>
            )
          }
        />

        {/* `min-h-0` is what lets a flex child actually scroll rather than just
            growing. No height cap here — the chart inside stretches its own
            rows to fill this box, so capping it only reintroduced the gap
            between the last bar and the footnote. */}
        <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
          <QuestionTypeChart data={data} />
        </div>

        <PanelFootnote>
          {summary.total && costliest ? (
            <>
              <span className="font-bold capitalize">{costliest.type.replace(/_/g, ' ')}</span> is
              costing you the most —{' '}
              <span className={cn(NUM, 'font-bold')}>{marksLost(costliest)}</span> marks lost.
            </>
          ) : (
            'Reading and Listening tests populate this list.'
          )}
        </PanelFootnote>
      </section>
    </m.div>
  );
}
