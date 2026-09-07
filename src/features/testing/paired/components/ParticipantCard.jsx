import React from 'react';
import { MICRO, MUTED, NUM, Pill, WELL } from '@/features/dashboard/components/primitives.jsx';
import { ReiconCheck } from '@/components/ui/reicon';
import { CheckCircle2, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';

function initials(name) {
  const cleaned = (name || '?').replace(/[()]/g, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

function getMemberState(member) {
  if (member.submitted_at) {
    return { label: 'Submitted', tone: 'ok', icon: CheckCircle2 };
  }
  if (member.ready) {
    return { label: 'Ready', tone: 'accent', icon: ReiconCheck };
  }
  return { label: 'Not ready', tone: 'neutral', icon: UserRound };
}

function ParticipantCardHeader({ displayName, isMine, status }) {
  const StatusIcon = status.icon;
  const alreadyHasYou = /\byou\b/i.test(displayName);

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold',
            isMine
              ? 'bg-[#5a63df] text-white shadow-2xs'
              : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
          )}
          aria-hidden="true"
        >
          {initials(displayName)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
            {displayName}
            {isMine && !alreadyHasYou && (
              <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
            )}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span
              className={cn('h-1.5 w-1.5 rounded-full', isMine ? 'bg-[#5a63df]' : 'bg-slate-400')}
            />
            {isMine ? 'Your private attempt' : 'Study partner'}
          </p>
        </div>
      </div>
      <Pill tone={status.tone}>
        <StatusIcon className="h-3 w-3" />
        {status.label}
      </Pill>
    </div>
  );
}

function ParticipantScoreStats({ summary, displayName }) {
  if (!summary) return null;

  return (
    <div className="mt-2.5 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[#5a63df]/25 bg-gradient-to-br from-[#5a63df]/[0.07] to-transparent p-2 sm:p-2.5 dark:border-[#8f97ff]/30 dark:from-[#5a63df]/15">
          <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>estimated band</p>
          <p
            className={cn(
              NUM,
              'mt-0.5 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white'
            )}
          >
            {summary.bandScore.toFixed(1)}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {summary.percentage}% score rate
          </p>
        </div>
        <div className="rounded-xl border border-[#e8e6f5] bg-[#f8f7fd] p-2 sm:p-2.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <p className={cn(MICRO, MUTED)}>Correct answers</p>
          <p
            className={cn(
              NUM,
              'mt-0.5 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white'
            )}
          >
            {summary.correctAnswers}
            <span className="text-xs font-normal text-slate-400">/40</span>
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {40 - summary.correctAnswers} incorrect
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#eceafa] bg-[#f8f7fd] px-2.5 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-600 dark:text-slate-300">Accuracy rate</span>
          <span className={cn(NUM, 'font-bold text-slate-800 dark:text-slate-200')}>
            {summary.percentage}%
          </span>
        </div>
        <div
          role="meter"
          aria-label={`${displayName} accuracy rate`}
          aria-valuenow={summary.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${summary.percentage}% accuracy`}
          className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#eceaf6] dark:bg-white/[0.08]"
        >
          <div
            className="h-full rounded-full bg-[#5a63df] transition-all duration-500 dark:bg-[#7b84f7]"
            style={{ width: `${summary.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ParticipantLobbyStatus({ member, StatusIcon }) {
  const isLocked = Boolean(member.submitted_at);
  const title = isLocked
    ? 'Attempt locked'
    : member.ready
      ? 'Ready to start'
      : 'Waiting for readiness';
  const description = isLocked
    ? 'Your answers are safely saved.'
    : member.ready
      ? 'You will start on the shared countdown.'
      : 'This student has not joined the start line yet.';

  return (
    <div
      className={cn(
        WELL,
        'mt-2.5 flex items-center gap-2.5 rounded-lg border border-[#eceafa] p-2 sm:p-2.5 dark:border-white/[0.06]'
      )}
    >
      <div
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-md',
          member.ready
            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400'
        )}
      >
        <StatusIcon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{title}</p>
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function ParticipantCardFooter({ member }) {
  if (member.interrupted) {
    return (
      <p className="mt-2 text-xs text-[rgb(var(--signal-warn))]">
        Connection or playback was interrupted.
      </p>
    );
  }
  if (member.finish_reason === 'deadline') {
    return (
      <p className="mt-2 text-xs text-[rgb(var(--signal-warn))]">
        Time expired. Last server-saved answers were submitted.
      </p>
    );
  }
  if (member.finish_reason === 'left') {
    return <p className="mt-2 text-xs text-slate-500">Left before finishing.</p>;
  }
  return null;
}

export default function ParticipantCard({ member, isMine, complete }) {
  const status = getMemberState(member);
  const displayName = member.display_name || 'Anonymous';

  return (
    <section
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border p-3 sm:p-3.5 transition-all',
        isMine
          ? 'border-[#5a63df]/35 bg-white shadow-xs ring-1 ring-[#5a63df]/15 dark:border-[#8f97ff]/30 dark:bg-[#15141d]'
          : 'border-[#e4e2f0] bg-white dark:border-white/[0.08] dark:bg-[#121118]'
      )}
    >
      <div>
        <ParticipantCardHeader displayName={displayName} isMine={isMine} status={status} />
        {complete && member.summary ? (
          <ParticipantScoreStats summary={member.summary} displayName={displayName} />
        ) : (
          <ParticipantLobbyStatus member={member} StatusIcon={status.icon} />
        )}
      </div>
      <ParticipantCardFooter member={member} />
    </section>
  );
}
