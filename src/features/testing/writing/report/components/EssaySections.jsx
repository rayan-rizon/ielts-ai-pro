import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PANEL } from '@/features/dashboard/components/primitives.jsx';
import { paragraphName } from './paragraphName';
import { HAIRLINE, HEADING, QUIET_BUTTON } from './reportStyles';
import { MarkedText } from './MarkedText';

const tone = (mistakes) => (mistakes === 0 ? 'ok' : mistakes === 1 ? 'warn' : 'fault');

const BAR = {
  ok: 'bg-[rgb(var(--signal-ok))]',
  warn: 'bg-[rgb(var(--signal-warn))]',
  fault: 'bg-[rgb(var(--signal-fault))]',
};
const TEXT = {
  ok: 'text-[rgb(var(--signal-ok))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  fault: 'text-[rgb(var(--signal-fault))]',
};

function Key({ t }) {
  const items = [
    ['keyMistake', 'bg-[rgb(var(--signal-fault))]'],
    ['keyBetter', 'bg-[rgb(var(--signal-warn))]'],
    ['keyGood', 'bg-[rgb(var(--signal-ok))]'],
  ];
  return (
    <ul className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
      {items.map(([key, color]) => (
        <li key={key} className="inline-flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', color)} aria-hidden="true" />
          {t(key)}
        </li>
      ))}
    </ul>
  );
}

/** One paragraph in the map: its size, what needs fixing and the examiner's note. */
function ParagraphRow({ t, paragraph }) {
  const color = tone(paragraph.mistakes);
  return (
    <li
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2.5 border-t py-2',
        HAIRLINE
      )}
    >
      <span className={cn('h-2 w-2 self-center rounded-full', BAR[color])} aria-hidden="true" />
      <span className="min-w-0 text-[13px] font-bold text-slate-900 dark:text-white">
        {paragraphName(t, paragraph)}
        <span className="ms-2 text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
          {t('wordsCount', { count: paragraph.words })}
        </span>
      </span>
      <span className={cn('text-end text-[12px] font-bold', TEXT[color])}>
        {paragraph.mistakes ? t('mapToFix', { count: paragraph.mistakes }) : t('mapClean')}
      </span>
      {paragraph.note && (
        <span className="col-start-2 col-end-4 text-[12.5px] leading-snug text-slate-600 dark:text-slate-300">
          {paragraph.note}
        </span>
      )}
    </li>
  );
}

/**
 * The learner's essay in one card: its shape paragraph by paragraph, and the
 * text itself with numbered marks when opened.
 */
export function EssayCard({ t, essayMap, marked }) {
  const [open, setOpen] = useState(false);
  if (!essayMap.length) return null;
  return (
    <section className={cn(PANEL, 'p-4')} aria-labelledby="writing-essay-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="writing-essay-title" className={HEADING}>
          {t('mapTitle')}
        </h2>
        <button
          type="button"
          className={QUIET_BUTTON}
          aria-expanded={open}
          aria-controls="writing-marked-body"
          onClick={() => setOpen((value) => !value)}
        >
          {t(open ? 'essayHide' : 'essayShow')}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-[rotate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
              open && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="mt-3 flex h-2 gap-1" aria-hidden="true" dir="ltr">
        {essayMap.map((paragraph) => (
          <span
            key={paragraph.index}
            className={cn('min-w-1.5 rounded-full', BAR[tone(paragraph.mistakes)])}
            style={{ flex: `${paragraph.share} 1 0%` }}
          />
        ))}
      </div>
      <ol className="mt-2">
        {essayMap.map((paragraph) => (
          <ParagraphRow key={paragraph.index} t={t} paragraph={paragraph} />
        ))}
      </ol>
      {open && (
        <div
          id="writing-marked-body"
          className={cn(
            'space-y-3 border-t pt-3 transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-opacity motion-reduce:starting:translate-y-0',
            HAIRLINE
          )}
        >
          <Key t={t} />
          {marked.map((segments, index) => (
            <MarkedText key={index} segments={segments} className="text-[15px]" />
          ))}
        </div>
      )}
    </section>
  );
}
