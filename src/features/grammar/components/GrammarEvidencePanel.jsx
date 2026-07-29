import { useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  FilePenLine,
  Mic2,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';
import GrammarEvidenceBadge from './GrammarEvidenceBadge';

const SOURCES = [
  {
    source: 'writing',
    title: 'Writing grammar',
    description: 'From your scored Writing responses.',
    route: '/writing',
    action: 'Open Writing',
    icon: FilePenLine,
    accent: 'indigo',
  },
  {
    source: 'speaking',
    title: 'Speaking grammar',
    description: 'From your scored Speaking transcripts.',
    route: '/speaking',
    action: 'Open Speaking',
    icon: Mic2,
    accent: 'emerald',
  },
];

function formattedDate(value) {
  if (!value) return 'No evaluated result yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Evidence saved';
  return `Updated ${new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date)}`;
}

function EvidenceSourceCard({ source, signal }) {
  const Icon = source.icon;
  const hasEvidence = Number(signal?.observations || 0) > 0;
  const control = hasEvidence
    ? Math.max(0, Math.min(100, Math.round(Number(signal?.mastery || 0) * 100)))
    : 0;
  const isSpeaking = source.accent === 'emerald';

  return (
    <article
      className={cn(
        'group relative min-h-[148px] overflow-hidden rounded-2xl border bg-white/90 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white/[0.035]',
        isSpeaking
          ? 'border-emerald-100 hover:border-emerald-300 dark:border-emerald-400/15'
          : 'border-indigo-100 hover:border-indigo-300 dark:border-indigo-400/15'
      )}
    >
      <span
        className={cn(
          'absolute inset-y-3 left-0 w-1 rounded-r-full',
          isSpeaking ? 'bg-emerald-500' : 'bg-indigo-500'
        )}
      />
      <div className="flex items-start gap-2.5 pl-1">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
            isSpeaking
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20'
              : 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/20'
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-black text-slate-950 dark:text-white">{source.title}</h3>
            {hasEvidence ? (
              <GrammarEvidenceBadge
                evidenceClass={signal.evidenceClass}
                observations={signal.observations}
                compact
              />
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-extrabold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                Not connected
              </span>
            )}
          </div>

          {hasEvidence ? (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span>Grammar control</span>
                <span className="font-black text-slate-800 dark:text-white">{control}%</span>
              </div>
              <Progress
                value={control}
                aria-label={`${source.title} estimated grammar control`}
                className="mt-1.5 h-1.5 bg-slate-100 dark:bg-white/10"
                indicatorClassName={isSpeaking ? 'bg-emerald-500' : 'bg-indigo-500'}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                  <CalendarClock className="h-3 w-3" />
                  {formattedDate(signal.lastPracticedAt)}
                </span>
                <Link
                  to={source.route}
                  className={cn(
                    'inline-flex items-center gap-1 text-[9px] font-extrabold transition',
                    isSpeaking
                      ? 'text-emerald-700 hover:text-emerald-900 dark:text-emerald-300'
                      : 'text-indigo-700 hover:text-indigo-900 dark:text-indigo-300'
                  )}
                >
                  {source.action}{' '}
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2 text-[10px] font-medium leading-4 text-slate-500 dark:text-slate-400">
                {source.description}
              </p>
              <p className="mt-1 text-[9px] font-semibold text-slate-400">
                Complete one scored practice to connect it.
              </p>
              <Link
                to={source.route}
                className={cn(
                  'mt-2 inline-flex items-center gap-1 text-[9px] font-extrabold transition',
                  isSpeaking
                    ? 'text-emerald-700 hover:text-emerald-900 dark:text-emerald-300'
                    : 'text-indigo-700 hover:text-indigo-900 dark:text-indigo-300'
                )}
              >
                {source.action}{' '}
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function GrammarEvidencePanel({
  criterionEvidence,
  access,
  inProgressAttempt,
  isStarting,
  onStartDiagnostic,
  onResume,
}) {
  const evidenceBySource = new Map(
    (criterionEvidence || []).map((signal) => [signal.source, signal])
  );
  const evidenceCount = SOURCES.filter(
    (source) => Number(evidenceBySource.get(source.source)?.observations || 0) > 0
  ).length;
  const diagnosticAvailable = Boolean(access?.isPaid || access?.diagnosticAvailable);
  const actionDisabled = isStarting || (!inProgressAttempt && !diagnosticAvailable);
  const actionLabel = inProgressAttempt
    ? 'Resume active grammar practice'
    : diagnosticAvailable
      ? 'Find what to practise'
      : 'Level check already used';
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const activeSource = SOURCES[activeSourceIndex];

  return (
    <section
      id="grammar-evidence"
      className="relative h-full scroll-mt-6 overflow-hidden bg-gradient-to-br from-white via-[#faf9ff] to-[#f2f0ff] p-4 sm:p-5 dark:from-[#10131f] dark:to-[#10131f]"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] shadow-sm ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300">
            <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
              Grammar from your tests
            </h2>
            <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">
              Your Writing and Speaking results, in one place.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-[#d8dcfa] bg-white/90 px-2.5 py-1 text-[9px] font-extrabold text-[#505bdd] shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          {evidenceCount}/2 connected
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Writing and Speaking grammar results"
        className="relative mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5"
      >
        {SOURCES.map((source, index) => {
          const Icon = source.icon;
          const isActive = activeSourceIndex === index;
          const connected = Number(evidenceBySource.get(source.source)?.observations || 0) > 0;
          return (
            <button
              key={source.source}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSourceIndex(index)}
              className={cn(
                'flex h-8 items-center justify-center gap-1.5 rounded-lg text-[10px] font-extrabold transition',
                isActive
                  ? 'bg-white text-[#505bdd] shadow-sm dark:bg-white/10 dark:text-indigo-200'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {source.source === 'writing' ? 'Writing' : 'Speaking'}
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  connected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="relative mt-2.5">
        <EvidenceSourceCard
          source={activeSource}
          signal={evidenceBySource.get(activeSource.source)}
        />
      </div>

      <div className="relative mt-2.5 rounded-2xl border border-[#dfe3fa] bg-white/75 p-3 dark:border-white/10 dark:bg-white/[0.035]">
        <div className="flex items-start gap-2.5">
          <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-[#5963d9]" />
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              Turn this result into a target
            </div>
            <p className="mt-1 text-[10px] font-medium leading-4 text-slate-500 dark:text-slate-400">
              A level check finds which of the six skills needs practice.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (inProgressAttempt ? onResume(inProgressAttempt.id) : onStartDiagnostic())}
          disabled={actionDisabled}
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#5661e9] px-4 text-[11px] font-extrabold text-white shadow-[0_10px_20px_-14px_rgba(76,87,225,0.9)] transition hover:bg-[#4853d6] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isStarting ? (
            <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ScanSearch className="mr-2 h-3.5 w-3.5" />
          )}
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
