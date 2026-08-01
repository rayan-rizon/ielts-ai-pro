import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Library } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import {
  Empty,
  FootNum,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Ring,
  TILE,
} from './primitives';

/**
 * Lexical resource is a quarter of the writing and speaking band, and it is the
 * one thing on this page a student can move on a day with no time for a full
 * test. The due count is the call to action; the ring is the standing.
 */
const VocabularyCard = React.memo(({ vocabStats }) => {
  const total = Number(vocabStats?.totalWords) || 0;
  const mastered = Number(vocabStats?.masteredWords) || 0;
  const due = Number(vocabStats?.dueWords) || 0;
  const pct = Number(vocabStats?.masteryPercentage) || 0;

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label="Vocabulary"
        tip="Words in your deck. Mastered means review level 4 or higher."
        action={
          <Link
            to={createPageUrl('Vocabulary')}
            className={cn(
              MICRO,
              'inline-flex items-center gap-0.5 text-slate-500 transition-colors hover:text-[#5a63df] dark:text-slate-400'
            )}
          >
            Open <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />

      {total === 0 ? (
        <Empty icon={Library} className="flex-1 content-center">
          No words saved yet — add words while you practise and they schedule themselves here.
        </Empty>
      ) : (
        <div className="flex flex-1 items-center gap-4">
          <Ring value={pct} label={`${pct}%`} sublabel="known" />

          {/* Was two stacked lines next to a fixed 64px ring — on a wide card that
              left the whole right half empty. TILE tiles in a 2-col grid actually
              use the space the flex-1 wrapper already claims. */}
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5">
            <div className={cn(TILE, 'p-2.5')}>
              <p className={cn(MICRO, MUTED)}>In deck</p>
              <p
                className={cn(
                  NUM,
                  'mt-0.5 text-lg font-extrabold leading-none text-slate-900 dark:text-slate-50'
                )}
              >
                {total}
              </p>
            </div>
            <div className={cn(TILE, 'p-2.5')}>
              <p className={cn(MICRO, MUTED)}>Mastered</p>
              <p
                className={cn(
                  NUM,
                  'mt-0.5 text-lg font-extrabold leading-none text-slate-900 dark:text-slate-50'
                )}
              >
                {mastered}
              </p>
            </div>
          </div>
        </div>
      )}

      {total > 0 && due > 0 ? (
        <Link
          to={createPageUrl('Vocabulary')}
          className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#5a63df] px-3 text-xs font-bold text-white transition-all duration-150 hover:bg-[#4a52c9] active:scale-[0.98]"
        >
          Review {due} due
          <ChevronRight className="h-3 w-3" />
        </Link>
      ) : (
        <PanelFootnote>
          {total > 0 ? (
            <>
              nothing due — next words unlock as the <FootNum>{total}</FootNum> in your deck come
              round
            </>
          ) : (
            <>spaced repetition schedules each word for you</>
          )}
        </PanelFootnote>
      )}
    </div>
  );
});

VocabularyCard.displayName = 'VocabularyCard';

export default VocabularyCard;
