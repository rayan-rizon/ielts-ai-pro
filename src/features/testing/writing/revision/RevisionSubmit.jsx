/** Under the revision box: what changed so far, and spending the one check. */
import React, { useEffect, useState } from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, NUM, Pill, TILE } from '@/features/dashboard/components/primitives';
import { PRIMARY_BUTTON, QUIET_BUTTON } from '../report/components/reportStyles';

const words = (count) => `${count} ${count === 1 ? 'word' : 'words'}`;

/** Why the check cannot be used yet, or an empty string. */
function blockedBecause({ changed, unfinished }) {
  if (!changed) return 'Change your answer first.';
  if (unfinished) {
    return 'Finish your last sentence with a full stop. A cut-off ending lowers your score.';
  }
  return '';
}

/** Worth knowing before spending the check, though neither one blocks it. */
function cautions(summary) {
  const notes = [];
  if (summary.small) {
    notes.push(
      `You changed ${words(Math.max(summary.added, summary.removed))}. An edit this small rarely raises a score.`
    );
  }
  if (summary.belowMinimum) {
    notes.push(`Your draft is under ${summary.minimum} words, which limits Task Response.`);
  }
  return notes;
}

function EditCounts({ summary }) {
  const enough = !summary.belowMinimum;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Pill tone={enough ? 'ok' : 'warn'}>
        <span className={NUM}>
          {summary.words} / {summary.minimum} words
        </span>
      </Pill>
      {summary.added > 0 && (
        <Pill tone="neutral">
          <span className={NUM}>+{words(summary.added)}</span>
        </Pill>
      )}
      {summary.removed > 0 && (
        <Pill tone="neutral">
          <span className={NUM}>−{words(summary.removed)}</span>
        </Pill>
      )}
    </div>
  );
}

function ConfirmCheck({ summary, onConfirm, onCancel }) {
  return (
    <div
      role="group"
      aria-labelledby="revision-confirm-title"
      className={cn(
        TILE,
        'space-y-2 p-3 duration-200 animate-in fade-in-0 motion-reduce:animate-none'
      )}
    >
      <p id="revision-confirm-title" className="text-[13.5px] font-extrabold">
        Use your one check?
      </p>
      <p className="text-[12.5px] leading-snug text-slate-600 dark:text-slate-300">
        You get one check for this answer. It uses 1 writing task review.
      </p>
      {cautions(summary).map((note) => (
        <p key={note} className="flex items-start gap-1.5 text-[12.5px] leading-snug">
          <CircleAlert
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-warn))]"
            aria-hidden="true"
          />
          {note}
        </p>
      ))}
      <div className="flex flex-wrap gap-2 pt-0.5">
        <button type="button" className={PRIMARY_BUTTON} onClick={onConfirm}>
          Use my check
        </button>
        <button type="button" className={cn(QUIET_BUTTON, 'min-h-10')} onClick={onCancel}>
          Keep editing
        </button>
      </div>
    </div>
  );
}

export function RevisionSubmit({ summary, draft, busy, checking, onCheck }) {
  const [asking, setAsking] = useState(false);
  // Any further typing changes what would be checked, so ask again.
  useEffect(() => setAsking(false), [draft]);
  const blocked = blockedBecause(summary);
  const working = busy || checking;

  const confirm = () => {
    setAsking(false);
    onCheck();
  };

  return (
    <div className="space-y-2.5">
      <EditCounts summary={summary} />
      {asking ? (
        <ConfirmCheck summary={summary} onConfirm={confirm} onCancel={() => setAsking(false)} />
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className={cn('text-[12px] leading-snug', MUTED)} role="status">
            {blocked || 'One check for this answer. It uses 1 writing task review.'}
          </p>
          <button
            type="button"
            className={cn(
              PRIMARY_BUTTON,
              'shrink-0 disabled:cursor-not-allowed disabled:opacity-45'
            )}
            disabled={Boolean(blocked) || working}
            onClick={() => setAsking(true)}
          >
            {working && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {working ? 'Checking revision…' : 'Check my revision'}
          </button>
        </div>
      )}
    </div>
  );
}
