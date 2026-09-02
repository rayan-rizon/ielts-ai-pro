import { useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
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
import { IconChip, MUTED, Pill, TILE } from '@/features/dashboard/components/primitives';
import GrammarEvidenceBadge from './GrammarEvidenceBadge';

const SOURCES = [
  {
    source: 'writing',
    title: 'Writing grammar',
    description: 'From your scored Writing responses.',
    route: '/writing',
    action: 'Take a Writing test',
    icon: FilePenLine,
    accent: 'indigo',
  },
  {
    source: 'speaking',
    title: 'Speaking grammar',
    description: 'From your scored Speaking transcripts.',
    route: '/speaking',
    action: 'Take a Speaking test',
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
        'group relative overflow-hidden rounded-lg border bg-white/95 p-3 transition hover:-translate-y-0.5 dark:bg-white/[0.035]',
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
      <div className="flex items-start gap-3 pl-1">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
            isSpeaking
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20'
              : 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/20'
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
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
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                  <CalendarClock className="h-3 w-3" />
                  {formattedDate(signal.lastPracticedAt)}
                </span>
                <Link
                  to={source.route}
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-extrabold transition',
                    isSpeaking
                      ? 'text-emerald-700 hover:text-emerald-900 dark:text-emerald-300'
                      : 'text-indigo-700 hover:text-indigo-900 dark:text-indigo-300'
                  )}
                >
                  {source.action}{' '}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-1.5 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">
                {source.description}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                Complete one scored practice to connect it.
              </p>
              <Link
                to={source.route}
                className={cn(
                  'mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold transition',
                  isSpeaking
                    ? 'text-emerald-700 hover:text-emerald-900 dark:text-emerald-300'
                    : 'text-indigo-700 hover:text-indigo-900 dark:text-indigo-300'
                )}
              >
                {source.action}{' '}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
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
      className="relative h-full scroll-mt-6 overflow-hidden p-4 sm:p-4.5"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#5a63df]/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconChip icon={ShieldCheck} size="lg" />
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              Grammar from your tests
            </h2>
            <p className={cn('mt-0.5 text-[11px] font-medium leading-4', MUTED)}>
              Evaluated Writing and Speaking tests update this automatically.
            </p>
          </div>
        </div>
        <Pill tone="accent">{evidenceCount}/2 connected</Pill>
      </div>

      <LayoutGroup id="grammar-evidence-source-tabs">
        <div
          role="tablist"
          aria-label="Writing and Speaking grammar results"
          className="relative mt-2.5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/90 p-0.5 dark:bg-white/5"
        >
          {SOURCES.map((source, index) => {
            const Icon = source.icon;
            const isActive = activeSourceIndex === index;
            const connected = Number(evidenceBySource.get(source.source)?.observations || 0) > 0;
            return (
              <motion.button
                key={source.source}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSourceIndex(index)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative flex h-8 items-center justify-center gap-1.5 rounded-lg text-[11px] font-extrabold transition-colors',
                  isActive
                    ? 'text-[#5a63df] dark:text-indigo-200'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="grammar-evidence-active-tab"
                    className="absolute inset-0 rounded-lg bg-white shadow-xs dark:bg-white/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center justify-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {source.source === 'writing' ? 'Writing' : 'Speaking'}
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      connected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    )}
                  />
                </span>
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="relative mt-2.5">
        <EvidenceSourceCard
          source={activeSource}
          signal={evidenceBySource.get(activeSource.source)}
        />
      </div>

      <div className={cn(TILE, 'relative mt-2.5 p-3')}>
        <div className="flex items-center gap-2.5">
          <ScanSearch className="h-4.5 w-4.5 shrink-0 text-[#5a63df]" />
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              Find the exact skill to practise
            </div>
            <p className={cn('mt-0.5 text-[11px] font-medium leading-4', MUTED)}>
              If test evidence is broad, one level check selects the right practice and guides.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (inProgressAttempt ? onResume(inProgressAttempt.id) : onStartDiagnostic())}
          disabled={actionDisabled}
          className="mt-2.5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition hover:bg-[#4a52c9] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isStarting ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ScanSearch className="mr-2 h-4 w-4" />
          )}
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
