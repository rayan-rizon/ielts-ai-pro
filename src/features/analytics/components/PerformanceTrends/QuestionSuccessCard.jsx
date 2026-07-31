import React from 'react';
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
import QuestionTypeTable from './QuestionTypeTable';
import { getQuestionSuccessSummary } from './SharedHelpers';

export default function QuestionSuccessCard({ stats }) {
  const data = stats?.typeAccuracy || [];
  const summary = getQuestionSuccessSummary(data);
  const weakest = data.length ? [...data].sort((a, b) => a.accuracy - b.accuracy)[0] : null;

  return (
    <section className={cn(PANEL, 'flex h-[360px] flex-col p-4')}>
      <PanelTitle
        label="Question types"
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

      <div className="-mr-1 flex-1 overflow-y-auto pr-1">
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
  );
}
