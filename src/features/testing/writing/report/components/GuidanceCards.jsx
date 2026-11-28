import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, WELL } from '@/features/dashboard/components/primitives.jsx';
import { BODY, CARD, ENGLISH, HAIRLINE, HEADING, TEXT_BUTTON } from './reportStyles';
import { CheckMark } from './reportUi';

const showPassage = (onShowInEssay, text) =>
  onShowInEssay && text ? () => onShowInEssay({ originalText: text }) : null;

export function ChartCheckCard({ t, check }) {
  if (!check) return null;
  const covered = check.features.filter((feature) => feature.covered).length;
  const matched = check.status === 'ok';
  const signal = matched ? 'ok' : check.status === 'fault' ? 'fault' : 'warn';
  const chip = {
    ok: 'bg-[rgb(var(--signal-ok)/0.12)] text-[rgb(var(--signal-ok))]',
    warn: 'bg-[rgb(var(--signal-warn)/0.12)] text-[rgb(var(--signal-warn))]',
    fault: 'bg-[rgb(var(--signal-fault)/0.12)] text-[rgb(var(--signal-fault))]',
  }[signal];
  const Icon = matched ? Check : AlertTriangle;
  return (
    <section
      className={cn(CARD, 'p-4 @2xl:px-6 @2xl:py-[22px]')}
      aria-labelledby="writing-chart-title"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full', chip)}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <h2 id="writing-chart-title" className={HEADING}>
            {t(matched ? 'chartRight' : 'chartCheck')}
          </h2>
          <p className={cn('mt-0.5', BODY)}>{check.message}</p>
        </div>
      </div>

      {check.features.length > 0 && (
        <div className={cn('mt-3 border-t pt-3', HAIRLINE)}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
              {t('mainFeatures')}
            </h3>
            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
              {t('featuresMentioned', { covered, total: check.features.length })}
            </span>
          </div>
          <ul className="mt-2 space-y-2">
            {check.features.map((feature, index) => (
              <li key={`${index}-${feature.text}`} className="flex items-start gap-2.5">
                <CheckMark done={feature.covered} />
                <span className={cn('min-w-0', BODY)}>
                  {feature.text}
                  {!feature.covered && (
                    <span className="block text-[12px] font-semibold text-[rgb(var(--signal-warn))]">
                      {t('featureMissing')}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function AlsoWorkOn({ t, priorities, onShowInEssay }) {
  if (priorities.length === 0) return null;
  return (
    <section
      className={cn(CARD, 'p-4 @2xl:px-6 @2xl:py-[22px]')}
      aria-labelledby="writing-also-title"
    >
      <h2 id="writing-also-title" className={HEADING}>
        {t('alsoWorkOn')}
      </h2>
      <ol className="mt-2">
        {priorities.map((priority, index) => (
          <li
            key={`${index}-${priority.issue}`}
            className={cn('flex gap-3 border-t py-2.5 last:pb-0', HAIRLINE)}
          >
            <span
              className={cn(
                WELL,
                NUM,
                'grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11.5px] font-bold text-slate-700 dark:text-slate-200'
              )}
              aria-hidden="true"
            >
              {index + 2}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-snug text-slate-900 dark:text-white">
                {priority.issue || priority.action}
              </p>
              {priority.issue && priority.action && (
                <p className={cn('mt-0.5', BODY)}>{priority.action}</p>
              )}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3">
                {priority.criterion && (
                  <bdi
                    className="text-[12px] font-semibold text-slate-500 dark:text-slate-400"
                    {...ENGLISH}
                  >
                    {priority.criterion}
                  </bdi>
                )}
                {showPassage(onShowInEssay, priority.evidenceText) && (
                  <button
                    type="button"
                    className={cn(TEXT_BUTTON, 'min-h-7 text-[12px]')}
                    onClick={showPassage(onShowInEssay, priority.evidenceText)}
                  >
                    {t('showInEssay')}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StrengthsCard({ t, strengths }) {
  if (strengths.length === 0) return null;
  return (
    <section
      className={cn(CARD, 'flex h-full flex-col p-4 @2xl:px-6 @2xl:py-[22px]')}
      aria-labelledby="writing-strengths-title"
    >
      <h2 id="writing-strengths-title" className={HEADING}>
        {t('strengthsTitle')}
      </h2>
      <ul className="mt-3 divide-y divide-[#eeedf6] dark:divide-white/[0.07]">
        {strengths.map((strength, index) => (
          <li
            key={`${index}-${strength}`}
            className={cn('flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0', BODY)}
          >
            <span
              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[rgb(var(--signal-ok)/0.14)] text-[rgb(var(--signal-ok))]"
              aria-hidden="true"
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">{strength}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
