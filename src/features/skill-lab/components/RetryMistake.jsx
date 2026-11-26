import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { MUTED, PANEL, Pill, TILE, WELL } from '@/features/dashboard/components/primitives.jsx';
import RetryGuide from './RetryGuide';

function Answer({ label, text, tone }) {
  return (
    <>
      <dt className={MUTED}>{label}</dt>
      <dd className={cn('break-words font-semibold', tone && `text-[rgb(var(--signal-${tone}))]`)}>
        {text}
      </dd>
    </>
  );
}

function RevealCard({ row }) {
  return (
    <article className={cn(TILE, 'space-y-2 p-3')} aria-label={`Question ${row.number} answer`}>
      <header className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold">
          {row.number}. {row.prompt}
        </p>
        <Pill tone={row.nowCorrect ? 'ok' : 'fault'}>
          {row.nowCorrect ? 'Correct now' : 'Not correct'}
        </Pill>
      </header>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <Answer
          label="Now"
          text={row.nowText || 'Left blank'}
          tone={row.nowCorrect ? 'ok' : 'fault'}
        />
        <Answer label="Last time" text={row.lastText} />
        <Answer label="Correct answer" text={row.correctText} tone="ok" />
      </dl>
      {row.why && <p className={cn(WELL, 'rounded-lg p-2.5 text-xs leading-relaxed')}>{row.why}</p>}
    </article>
  );
}

/** Before the reveal only the question inputs show, passed in as children. */
export function RetryPanel({ revealed, rows, isListening, children }) {
  if (revealed) {
    return (
      <div className="space-y-2.5">
        {rows.map((row) => (
          <RevealCard key={row.key} row={row} />
        ))}
      </div>
    );
  }
  return (
    <>
      <RetryGuide numbers={rows.map((row) => row.number)} isListening={isListening} />
      {children}
    </>
  );
}

export function RetryBar({ revealed, canReveal, busy, onReveal, onContinue }) {
  return (
    <div className="sticky bottom-0 z-20 pb-[env(safe-area-inset-bottom,0px)]">
      <div className={cn(PANEL, 'flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3')}>
        {revealed ? (
          <Button disabled={busy} className="ml-auto gap-1.5" onClick={onContinue}>
            Try new questions
            <ArrowRight size={14} aria-hidden="true" />
          </Button>
        ) : (
          <>
            <Button variant="outline" disabled={busy} onClick={onContinue}>
              Skip to new questions
            </Button>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {!canReveal && <p className={`text-xs ${MUTED}`}>Answer at least one to see why</p>}
              <Button disabled={busy || !canReveal} onClick={onReveal}>
                Show answer
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
