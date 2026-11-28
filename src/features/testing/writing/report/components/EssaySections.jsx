/** The essay's shape paragraph by paragraph, and the marked essay itself. */
import React from 'react';
import { cn } from '@/lib/cn';
import { paragraphName } from './paragraphName';
import { CARD, HEADING, MUTED_TEXT } from './reportStyles';

const BAR = {
  ok: 'bg-[#16966c]',
  warn: 'bg-[#ba7c1a]',
  fault: 'bg-[#c93c34]',
};
const TEXT = {
  ok: 'text-[#0b6b4c] dark:text-[#7fe0bb]',
  warn: 'text-[#7a4f0c] dark:text-[#f5c870]',
  fault: 'text-[#a3302a] dark:text-[#ff9a92]',
};

/** The paragraph with the most marked mistakes, or null when none has any. */
export function weakestIndex(essayMap) {
  const worst = [...essayMap].sort((a, b) => b.mistakes - a.mistakes)[0];
  return worst?.mistakes ? worst.index : null;
}

const toneOf = (paragraph, weakest) => {
  if (!paragraph.mistakes) return 'ok';
  return paragraph.index === weakest ? 'fault' : 'warn';
};

function statusOf(t, paragraph, tone) {
  if (tone === 'ok') return t('mapClean');
  const count = t('mapToFix', { count: paragraph.mistakes });
  return tone === 'fault' ? `${t('fixFirst')} · ${count}` : count;
}

export function EssayMapCard({ t, essayMap }) {
  if (!essayMap.length) return null;
  const weakest = weakestIndex(essayMap);
  return (
    <section
      className={cn(CARD, 'space-y-3.5 p-4 @2xl:px-6 @2xl:py-[22px]')}
      aria-labelledby="writing-map-title"
    >
      <h2 id="writing-map-title" className={HEADING}>
        {t('mapTitle')}
      </h2>
      <ol className="flex flex-wrap gap-x-1.5 gap-y-4">
        {essayMap.map((paragraph) => {
          const tone = toneOf(paragraph, weakest);
          return (
            // Longer paragraphs take more of the row, so the shape reads at a glance.
            <li
              key={paragraph.index}
              className="flex min-w-0 flex-col gap-1.5"
              style={{ flex: `${paragraph.share} 1 13rem` }}
            >
              <span className={cn('h-1.5 rounded-full', BAR[tone])} aria-hidden="true" />
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[13.5px] font-extrabold text-[#12142b] dark:text-white">
                  {paragraphName(t, paragraph)}
                </span>
                <span className={cn('font-mono text-[11.5px]', MUTED_TEXT)}>
                  {t('wordsCount', { count: paragraph.words })}
                </span>
              </span>
              <span className={cn('text-[12.5px] font-bold', TEXT[tone])}>
                {statusOf(t, paragraph, tone)}
              </span>
              {paragraph.note && (
                <span className="text-[13px] leading-normal text-[#2a2f47] dark:text-slate-300">
                  {paragraph.note}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function MarkedEssayCard({ t, children }) {
  return (
    <section
      className={cn(CARD, 'flex h-full flex-col space-y-3 p-4 @2xl:px-7 @2xl:py-6')}
      aria-labelledby="writing-essay-title"
    >
      <h2 id="writing-essay-title" className={HEADING}>
        {t('markedTitle')}
      </h2>
      <div>{children}</div>
    </section>
  );
}
