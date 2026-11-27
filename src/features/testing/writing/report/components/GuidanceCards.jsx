import React from 'react';
import { AlertTriangle, Check, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, PANEL, WELL } from '@/features/dashboard/components/primitives.jsx';
import { BODY, ENGLISH, HAIRLINE, HEADING, PRIMARY_BUTTON, TEXT_BUTTON } from './reportStyles';
import { CheckMark } from './reportUi';

function EvidenceQuote({ t, text, onShow }) {
  if (!text) return null;
  return (
    <figure className={cn(WELL, 'mt-3 rounded-lg px-3 py-2')}>
      <figcaption className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
        {t('fromEssay')}
      </figcaption>
      <blockquote
        className="mt-0.5 font-serif text-[14px] leading-relaxed text-slate-800 [overflow-wrap:anywhere] dark:text-slate-100"
        {...ENGLISH}
      >
        “{text}”
      </blockquote>
      {onShow && (
        <button type="button" className={TEXT_BUTTON} onClick={onShow}>
          {t('showInEssay')}
        </button>
      )}
    </figure>
  );
}

const showPassage = (onShowInEssay, text) =>
  onShowInEssay && text ? () => onShowInEssay({ originalText: text }) : null;

export function NextStepCard({ t, step, score, onShowInEssay, onRevise }) {
  if (!step) {
    return (
      <section className={cn(PANEL, 'p-4')}>
        <h2 className={HEADING}>{t('noProblemTitle')}</h2>
        <p className={cn('mt-1', BODY)}>{t('noProblemBody')}</p>
      </section>
    );
  }
  return (
    <section
      className={cn(PANEL, 'border-[#5a63df]/40 p-4 dark:border-[#8f97ff]/35 @md:p-5')}
      aria-labelledby="writing-next-step-title"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#5a63df] px-2.5 py-0.5 text-[11.5px] font-bold text-white">
          {t('nextStep')}
        </span>
        {step.criterion && (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600 dark:text-slate-300">
            <bdi {...ENGLISH}>{step.criterion}</bdi>
            {score != null && <span className={NUM}>{score.toFixed(1)}</span>}
          </span>
        )}
      </div>
      <h2
        id="writing-next-step-title"
        className="mt-2 text-[20px] font-extrabold leading-snug tracking-[-0.015em] text-slate-900 dark:text-white"
      >
        {step.title}
      </h2>
      {step.body && <p className={cn('mt-1.5 max-w-[66ch] text-[14px]', BODY)}>{step.body}</p>}
      <EvidenceQuote
        t={t}
        text={step.evidenceText}
        onShow={showPassage(onShowInEssay, step.evidenceText)}
      />
      {onRevise && (
        <div className="mt-4">
          <button type="button" className={PRIMARY_BUTTON} onClick={onRevise}>
            <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
            {t('reviseAnswer')}
          </button>
        </div>
      )}
    </section>
  );
}

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
    <section className={cn(PANEL, 'p-4')} aria-labelledby="writing-chart-title">
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
    <section className={cn(PANEL, 'p-4')} aria-labelledby="writing-also-title">
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
    <section className={cn(PANEL, 'p-4')} aria-labelledby="writing-strengths-title">
      <h2 id="writing-strengths-title" className={HEADING}>
        {t('strengthsTitle')}
      </h2>
      <ul className="mt-2.5 space-y-2">
        {strengths.map((strength, index) => (
          <li key={`${index}-${strength}`} className={cn('flex items-start gap-2', BODY)}>
            <Check
              className="mt-1 h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]"
              strokeWidth={3}
              aria-hidden="true"
            />
            {strength}
          </li>
        ))}
      </ul>
    </section>
  );
}
