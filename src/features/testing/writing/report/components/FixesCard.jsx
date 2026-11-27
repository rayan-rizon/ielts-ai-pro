import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { PANEL, WELL } from '@/features/dashboard/components/primitives.jsx';
import { BODY, ENGLISH, FOCUS_RING, HEADING, TEXT_BUTTON } from './reportStyles';
import { CheckMark } from './reportUi';

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
    <p className="font-serif text-[14.5px] leading-snug [overflow-wrap:anywhere]" {...ENGLISH}>
      <span
        className={cn(
          'text-slate-900 dark:text-slate-100',
          item.replacement &&
            'text-slate-500 line-through decoration-[rgb(var(--signal-fault))] decoration-2 dark:text-slate-400'
        )}
      >
        {item.original}
      </span>
      {item.replacement && (
        <>
          <span aria-hidden="true" className="px-1.5 text-slate-400">
            →
          </span>
          <span className="sr-only">{t('changeTo')}: </span>
          <span className="font-semibold text-[rgb(var(--signal-ok))]">{item.replacement}</span>
        </>
      )}
    </p>
  );
}

function FixRow({ t, item, done, onToggle, onShowInEssay }) {
  return (
    <li className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={t(done ? 'fixedAria' : 'markFixedAria', { original: item.original })}
        onClick={onToggle}
        className={cn(
          '-m-2 shrink-0 rounded-full p-2 cursor-pointer transition-[scale] duration-150 ease-out active:scale-90 motion-reduce:active:scale-100',
          FOCUS_RING
        )}
      >
        <CheckMark done={done} />
      </button>
      <span className="mt-px w-4 shrink-0 text-center font-mono text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
        {item.n}
      </span>
      <div className={cn('min-w-0 flex-1 transition-opacity duration-150', done && 'opacity-55')}>
        <Correction t={t} item={item} />
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
    <section className={cn(PANEL, 'p-4')} aria-labelledby="writing-fixes-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="writing-fixes-title" className={HEADING}>
          {t('fixTitle')}
        </h2>
        {total > 0 && (
          <span
            className={cn(
              'text-[12px] font-semibold',
              doneCount === total
                ? 'text-[rgb(var(--signal-ok))]'
                : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {t('fixedCount', { done: doneCount, total })}
          </span>
        )}
      </div>
      {total > 0 && (
        <div className={cn('mt-2 h-1.5 overflow-hidden rounded-full', WELL)} aria-hidden="true">
          {/* Scaled, not resized, so ticking never triggers layout. */}
          <div
            className="h-full w-full rounded-full bg-[rgb(var(--signal-ok))] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            style={{
              transform: `scaleX(${doneCount / total})`,
              transformOrigin: t.rtl ? 'right' : 'left',
            }}
          />
        </div>
      )}
      {total === 0 ? (
        <p className={cn('mt-1', BODY)}>{t('fixNone')}</p>
      ) : (
        <>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">{t('fixHint')}</p>
          <div className="mt-3 space-y-4">
            {groups.map((group) => {
              const practice = PRACTICE_LINKS[group.skill];
              return (
                <div key={group.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                      {group.label}
                    </h3>
                    {practice && (
                      <Link to={practice.to} className={TEXT_BUTTON}>
                        {t(practice.label)}
                      </Link>
                    )}
                  </div>
                  <ul className="mt-2 divide-y divide-[#eceafa] dark:divide-white/[0.07]">
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
