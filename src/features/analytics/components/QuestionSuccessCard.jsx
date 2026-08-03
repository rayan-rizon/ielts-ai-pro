import React from 'react';
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
import QuestionTypeTable from './QuestionTypeTable';
import { getQuestionSuccessSummary } from './questionTypeHelpers';

/**
 * Measured accuracy per IELTS question format, weakest first.
 *
 * This replaced the dashboard's mastery panel on this page. Both ranked
 * question types weakest-first; this one is counted from graded answers
 * (`correct / total`) rather than an estimated mastery probability, so it is
 * the version that can be checked against a learner's own paper.
 */
export default function QuestionSuccessCard({ stats }) {
  const data = stats?.typeAccuracy || [];
  const summary = getQuestionSuccessSummary(data);
  const weakest = data.length ? [...data].sort((a, b) => a.accuracy - b.accuracy)[0] : null;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Question types"
          accent
          tip="Accuracy per IELTS question format across every graded test in this period."
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

        <div className="-mr-1 max-h-[268px] flex-1 overflow-y-auto pr-1">
          <QuestionTypeTable data={data} />
        </div>

        <PanelFootnote>
          {summary.total ? (
            weakest ? (
              <>
                Weakest format is <span className="font-bold">{weakest.type}</span> at{' '}
                <span className={cn(NUM, 'font-bold')}>{weakest.accuracy}</span>%.
              </>
            ) : null
          ) : (
            'Reading and Listening tests populate this list.'
          )}
        </PanelFootnote>
      </section>
    </m.div>
  );
}
