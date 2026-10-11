import React, { useEffect, useRef } from 'react';
import { Check, Mic, Square, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Bar, MUTED, NUM, TILE } from '@/features/dashboard/components/primitives';
import useRehearsal from '../../hooks/useRehearsal';
import { checkRehearsal, formatSeconds, targetFor } from '../../utils/speakingReportInsights';
import { PRIMARY_BUTTON, QUIET_BUTTON, TEXT_BUTTON } from './reportStyles';

export default function RehearsalPanel({ answer, issues, onSave, onClose }) {
  const rehearsal = useRehearsal();
  const savedRef = useRef(false);
  const target = targetFor(answer);
  const result =
    rehearsal.status === 'done'
      ? checkRehearsal({
          answer,
          issues,
          transcript: rehearsal.transcript,
          seconds: rehearsal.seconds,
        })
      : null;

  useEffect(() => {
    if (!result || savedRef.current) return;
    savedRef.current = true;
    onSave({
      seconds: rehearsal.seconds,
      words: result.words,
      passed: result.checks.filter((check) => check.pass).length,
      total: result.checks.length,
      at: new Date().toISOString(),
    });
  }, [result, rehearsal.seconds, onSave]);

  const tryAgain = () => {
    savedRef.current = false;
    rehearsal.reset();
  };

  return (
    <div className={cn(TILE, 'mt-3 p-3')} role="region" aria-label="Answer this question again">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
          Answer it again
        </p>
        <button
          type="button"
          onClick={() => {
            rehearsal.reset();
            onClose();
          }}
          aria-label="Close"
          className={cn(TEXT_BUTTON, 'text-slate-400 dark:text-slate-500')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {rehearsal.status === 'idle' && (
        <>
          <p className={cn('mt-1 text-[12.5px] leading-relaxed', MUTED)}>
            Use the stronger answer for ideas, but don’t read it word for word. Try to speak for{' '}
            {target.label}.
            {rehearsal.supportsTranscript
              ? ' Your browser writes down what you say. Nothing is saved or sent.'
              : ' This browser can’t write down speech, so we only check how long you spoke.'}
          </p>
          <button type="button" className={cn(PRIMARY_BUTTON, 'mt-3')} onClick={rehearsal.start}>
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            Start speaking
          </button>
        </>
      )}

      {rehearsal.status === 'recording' && (
        <div className="mt-2" aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(var(--signal-fault))] opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[rgb(var(--signal-fault))]" />
            </span>
            <span className={cn(NUM, 'text-[20px] font-extrabold text-slate-900 dark:text-white')}>
              {formatSeconds(rehearsal.seconds * 1000)}
            </span>
            <span className={cn('text-[12px]', MUTED)}>target {target.label}</span>
          </div>
          <Bar className="mt-2" value={(rehearsal.seconds / target.seconds) * 100} />
          {rehearsal.supportsTranscript && (
            <p className="mt-2 min-h-10 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
              {rehearsal.transcript || <span className={MUTED}>Listening…</span>}
            </p>
          )}
          <button type="button" className={cn(QUIET_BUTTON, 'mt-2')} onClick={rehearsal.stop}>
            <Square className="h-3 w-3 fill-current" aria-hidden="true" />
            Stop
          </button>
        </div>
      )}

      {rehearsal.status === 'error' && (
        <p className="mt-2 text-[12.5px] font-semibold text-[rgb(var(--signal-fault))]">
          {rehearsal.error}
        </p>
      )}

      {result && (
        <div className="mt-2" aria-live="polite">
          <p className="text-[12.5px] text-slate-700 dark:text-slate-200">
            Before:{' '}
            <span className={cn(NUM, 'font-bold')}>
              {answer.durationMs != null ? formatSeconds(answer.durationMs) : '—'}, {answer.words}{' '}
              words
            </span>
            . Now:{' '}
            <span className={cn(NUM, 'font-bold')}>
              {formatSeconds(rehearsal.seconds * 1000)}
              {result.hasTranscript ? `, ${result.words} words` : ''}
            </span>
            .
          </p>
          <ul className="mt-2 space-y-1.5">
            {result.checks.map((check) => (
              <li key={check.id} className="flex items-start gap-2 text-[12.5px]">
                <span
                  className={cn(
                    'mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full',
                    check.pass
                      ? 'bg-[rgb(var(--signal-ok)/0.15)] text-[rgb(var(--signal-ok))]'
                      : 'bg-[rgb(var(--signal-warn)/0.15)] text-[rgb(var(--signal-warn))]'
                  )}
                  aria-hidden="true"
                >
                  {check.pass ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  ) : (
                    <X className="h-2.5 w-2.5" strokeWidth={3} />
                  )}
                </span>
                <span className="text-slate-800 dark:text-slate-100">
                  <span className="sr-only">{check.pass ? 'Met: ' : 'Not yet: '}</span>
                  {check.label}
                  <span className={cn('ml-1.5', MUTED)}>{check.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {rehearsal.transcript && (
            <p className={cn('mt-2 text-[12px] italic leading-relaxed', MUTED)}>
              “{rehearsal.transcript}”
            </p>
          )}
          <p className={cn('mt-2 text-[11.5px]', MUTED)}>
            This is a quick check, not a band score.
          </p>
          <button type="button" className={cn(QUIET_BUTTON, 'mt-2')} onClick={tryAgain}>
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
