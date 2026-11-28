import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';
import {
  BODY,
  CARD,
  ENGLISH,
  FOCUS_RING,
  HEADING,
  HAIRLINE,
  MUTED_TEXT,
  TEXT_BUTTON,
} from './reportStyles';

function useFixedItems(reportKey) {
  const storageKey = reportKey ? `writing-fixed:${reportKey}` : null;
  const [fixed, setFixed] = useState(() => {
    if (!storageKey) return [];
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(fixed));
    } catch {
      // Storage can be unavailable (private mode); ticks then last for this visit.
    }
  }, [fixed, storageKey]);
  const toggle = (key) =>
    setFixed((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  return { fixed, toggle };
}

const PRACTICE_LINKS = {
  grammar: { to: '/grammar', label: 'practiseGrammar' },
  vocabulary: { to: '/vocabulary', label: 'practiseVocabulary' },
};

/** "wrote → change to" on one line when there is a replacement; advice stays advice. */
function Correction({ t, item }) {
  return (
    <span className="text-[14px] leading-normal [overflow-wrap:anywhere]" {...ENGLISH}>
      <span
        className={cn(
          'text-[#12142b] dark:text-slate-100',
          item.replacement &&
            'text-[#6b7186] line-through decoration-[#c93c34] decoration-2 dark:text-slate-400'
        )}
      >
        {item.original}
      </span>
      {item.replacement && (
        <>
          <span aria-hidden="true" className="px-1.5">
            →
          </span>
          <span className="sr-only">{t('changeTo')}: </span>
          <b className="text-[#12142b] dark:text-white">{item.replacement}</b>
        </>
      )}
    </span>
  );
}

function Tick({ done }) {
  return (
    <span
      className={cn(
        'grid h-5 w-5 place-items-center rounded-[5px] border-2 transition-colors duration-150',
        done
          ? 'border-[#16966c] bg-[#16966c] text-white'
          : 'border-[#c9c6e6] bg-white dark:border-white/25 dark:bg-transparent'
      )}
      aria-hidden="true"
    >
      {done && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}
    </span>
  );
}

function FixRow({ t, item, done, onToggle, onShowInEssay }) {
  return (
    <li className={cn('flex items-start gap-2.5 border-t py-[11px]', HAIRLINE)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={t(done ? 'fixedAria' : 'markFixedAria', { original: item.original })}
        onClick={onToggle}
        className={cn(
          '-m-2 shrink-0 rounded-lg p-2 cursor-pointer transition-[scale] duration-150 ease-out active:scale-90 motion-reduce:active:scale-100',
          FOCUS_RING
        )}
      >
        <Tick done={done} />
      </button>
      <div className={cn('min-w-0 flex-1 transition-opacity duration-150', done && 'opacity-55')}>
        <p>
          <span className="me-1.5 font-mono text-[10.5px] font-bold text-[#a3302a] dark:text-[#ff9a92]">
            {item.n}
          </span>
          <Correction t={t} item={item} />
        </p>
        {!item.replacement && item.advice && (
          <p
            className="mt-0.5 text-[13px] leading-snug text-slate-800 dark:text-slate-100"
            dir="auto"
          >
            <span className="font-bold">{t('whatToDo')}: </span>
            <span>{item.advice}</span>
          </p>
        )}
        {item.explanation && (
          <p
            className="mt-0.5 text-[12.5px] leading-snug text-slate-500 dark:text-slate-400"
            dir="auto"
          >
            {item.explanation}
          </p>
        )}
        {item.annotation && onShowInEssay && (
          <button
            type="button"
            className={cn(TEXT_BUTTON, 'min-h-7 text-[12px]')}
            onClick={() => onShowInEssay(item.annotation)}
          >
            {t('showInEssay')}
          </button>
        )}
      </div>
    </li>
  );
}

export function FixesCard({ t, groups, onShowInEssay, reportKey }) {
  const { fixed, toggle } = useFixedItems(reportKey);
  const keys = groups.flatMap((group) => group.items.map((item) => `${group.id}:${item.original}`));
  const total = keys.length;
  const doneCount = keys.filter((key) => fixed.includes(key)).length;
  return (
    <section
      className={cn(CARD, 'flex h-full flex-col p-4 @2xl:p-[22px]')}
      aria-labelledby="writing-fixes-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="writing-fixes-title" className={cn(HEADING, 'text-[16px]')}>
          {t('fixTitle')}
        </h2>
        {total > 0 ? (
          <span
            className={cn(
              'text-[12.5px] font-bold',
              doneCount === total ? 'text-[#0b6b4c] dark:text-[#7fe0bb]' : MUTED_TEXT
            )}
          >
            {t('fixedCount', { done: doneCount, total })}
          </span>
        ) : (
          <span
            className="grid h-6 w-6 place-items-center rounded-full bg-[rgb(var(--signal-ok)/0.14)] text-[rgb(var(--signal-ok))]"
            aria-hidden="true"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      {total > 0 && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f4f3fb] dark:bg-white/[0.06]"
          aria-hidden="true"
        >
          {/* Scaled, not resized, so ticking never triggers layout. */}
          <div
            className="h-full w-full rounded-full bg-[#16966c] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            style={{
              transform: `scaleX(${doneCount / total})`,
              transformOrigin: t.rtl ? 'right' : 'left',
            }}
          />
        </div>
      )}
      {total === 0 ? (
        <div className="mt-3 flex flex-1 flex-col justify-center rounded-xl border border-[rgb(var(--signal-ok)/0.2)] bg-[rgb(var(--signal-ok)/0.05)] p-4 dark:border-[rgb(var(--signal-ok)/0.18)] dark:bg-[rgb(var(--signal-ok)/0.06)]">
          <div className="flex items-start gap-2.5">
            <span
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[rgb(var(--signal-ok)/0.16)] text-[rgb(var(--signal-ok))]"
              aria-hidden="true"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <p className={cn('min-w-0 flex-1', BODY)}>{t('fixNone')}</p>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">{t('fixHint')}</p>
          <div className="mt-3 space-y-4">
            {groups.map((group) => {
              const practice = PRACTICE_LINKS[group.skill];
              return (
                <div key={group.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3
                      className={cn(
                        'text-[12.5px] font-extrabold',
                        group.items.some((item) => item.annotation?.severity !== 'suggestion')
                          ? 'text-[#a3302a] dark:text-[#ff9a92]'
                          : 'text-[#7a4f0c] dark:text-[#f5c870]'
                      )}
                    >
                      {group.label}
                    </h3>
                    {practice && (
                      <Link to={practice.to} className={TEXT_BUTTON}>
                        {t(practice.label)}
                      </Link>
                    )}
                  </div>
                  <ul className="mt-2">
                    {group.items.map((item, index) => {
                      const key = `${group.id}:${item.original}`;
                      return (
                        <FixRow
                          key={`${key}-${index}`}
                          t={t}
                          item={item}
                          done={fixed.includes(key)}
                          onToggle={() => toggle(key)}
                          onShowInEssay={onShowInEssay}
                        />
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
