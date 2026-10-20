import React from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FilePenLine,
  Mic2,
  Route,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, PANEL } from '@/features/dashboard/components/primitives';

function GuideTableOfContents({ tableOfContents, activeHeadingId }) {
  return (
    <nav aria-label="Guide contents" className={cn(PANEL, 'p-4 sm:p-5')}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.13em] text-[#5a63df] dark:text-indigo-300">
          In this guide
        </span>
        <span className="text-[10px] font-bold text-slate-400">
          {tableOfContents.length} topics
        </span>
      </div>
      <div className="mt-3.5 space-y-1">
        {tableOfContents.map((item, index) => {
          const isActive = activeHeadingId === item.id;
          return (
            <a
              key={`${item.id}-${index}`}
              href={`#${item.id}`}
              className={cn(
                'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-150',
                isActive
                  ? 'bg-[#5a63df]/10 text-[#5a63df] font-extrabold dark:bg-indigo-500/20 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-indigo-300'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black transition-colors',
                  isActive
                    ? 'bg-[#5a63df] text-white'
                    : 'bg-[#5a63df]/10 text-[#5a63df] group-hover:bg-[#5a63df]/20 dark:bg-indigo-500/20 dark:text-indigo-300'
                )}
              >
                {index + 1}
              </span>
              <span className="truncate">{item.title}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function GuideNextStepCard({ outcomeText, skillCode, isStarting, onPractice }) {
  return (
    <section className={cn(PANEL, 'p-4 sm:p-5')}>
      <IconChip icon={Route} size="md" />
      <h2 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">Your next step</h2>
      <p className={cn('mt-2 text-xs font-medium leading-5', MUTED)}>{outcomeText}</p>
      <Button
        onClick={() => onPractice(skillCode)}
        disabled={isStarting}
        className="mt-3.5 w-full rounded-xl bg-[#5a63df] text-xs font-extrabold text-white shadow-xs transition hover:bg-[#4a52c9] active:scale-[0.99]"
      >
        {skillCode ? 'Practise this skill' : 'Start mixed practice'}{' '}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </section>
  );
}

function getCompletionHelperText(guideProgressUnavailable, isCompleted) {
  if (guideProgressUnavailable) {
    return 'Your guide progress is temporarily unavailable. Please try again later.';
  }
  if (isCompleted) {
    return 'This is saved to your Grammar Lab progress. You can change it whenever you need.';
  }
  return 'Mark it complete only after you have worked through the guide and its checks.';
}

function getCompletionButtonText(guideProgressUnavailable, isCompleted) {
  if (guideProgressUnavailable) return 'Progress unavailable';
  return isCompleted ? 'Mark as incomplete' : 'Mark guide complete';
}

function GuideCompletionCard({
  isCompleted,
  guideProgressUnavailable,
  isUpdatingCompletion,
  onSetCompletion,
}) {
  const helperText = getCompletionHelperText(guideProgressUnavailable, isCompleted);
  const buttonText = getCompletionButtonText(guideProgressUnavailable, isCompleted);

  return (
    <section className={cn(PANEL, 'p-4 sm:p-5')}>
      <div className="flex items-center gap-2">
        <CheckCircle2
          className={cn(
            'h-4 w-4',
            isCompleted
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 dark:text-slate-500'
          )}
        />
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
          {isCompleted ? 'Guide completed' : 'Finished this guide?'}
        </h2>
      </div>
      <p className={cn('mt-2 text-xs font-medium leading-5', MUTED)}>{helperText}</p>
      <Button
        type="button"
        onClick={() => onSetCompletion?.(!isCompleted)}
        disabled={!onSetCompletion || isUpdatingCompletion || guideProgressUnavailable}
        variant={isCompleted ? 'outline' : 'default'}
        className={cn(
          'mt-3.5 w-full rounded-xl text-xs font-extrabold transition active:scale-[0.99]',
          !isCompleted && 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
        )}
      >
        {buttonText}
      </Button>
    </section>
  );
}

function GuideWorkbookUnitsNav({ previousGuide, nextGuide }) {
  if (!previousGuide && !nextGuide) return null;

  return (
    <nav aria-label="Guide navigation" className={cn(PANEL, 'grid grid-cols-2 gap-2 p-2.5')}>
      {previousGuide ? (
        <Link
          to={`/grammar/guides/${previousGuide.slug}`}
          className="rounded-lg p-2 text-left text-[11px] font-extrabold text-slate-500 transition hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-indigo-300"
        >
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Previous
          </span>
          ← {previousGuide.label}
        </Link>
      ) : (
        <span />
      )}
      {nextGuide && (
        <Link
          to={`/grammar/guides/${nextGuide.slug}`}
          className="rounded-lg p-2 text-right text-[11px] font-extrabold text-[#5a63df] transition hover:bg-[#f4f3fb] dark:hover:bg-white/5"
        >
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Next
          </span>
          {nextGuide.label} →
        </Link>
      )}
    </nav>
  );
}

const IELTS_QUICK_LINKS = [
  { to: '/writing', label: 'Writing practice', icon: FilePenLine },
  { to: '/speaking', label: 'Speaking practice', icon: Mic2 },
  { to: '/learning-path', label: 'AI Learning Path', icon: Sparkles },
];

function GuideIeltsLinks() {
  return (
    <section className={cn(PANEL, 'p-4 sm:p-5')}>
      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Apply it in IELTS</h2>
      <div className="mt-3 space-y-2">
        {IELTS_QUICK_LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between rounded-lg border border-[#e2e5f2] px-3 py-2.5 text-xs font-extrabold text-slate-700 transition hover:border-[#c9cdf3] hover:text-[#5a63df] dark:border-white/10 dark:text-slate-200 dark:hover:border-indigo-500/30 dark:hover:text-indigo-300"
          >
            <span className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-[#5a63df]" />
              {item.label}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function GuideSidebar({
  tableOfContents,
  activeHeadingId,
  outcomeText,
  skillCode,
  isStarting,
  isCompleted,
  guideProgressUnavailable,
  isUpdatingCompletion,
  previousGuide,
  nextGuide,
  onPractice,
  onSetCompletion,
}) {
  return (
    <aside className="space-y-3.5 lg:sticky lg:top-6">
      <GuideTableOfContents tableOfContents={tableOfContents} activeHeadingId={activeHeadingId} />

      <GuideNextStepCard
        outcomeText={outcomeText}
        skillCode={skillCode}
        isStarting={isStarting}
        onPractice={onPractice}
      />

      <GuideCompletionCard
        isCompleted={isCompleted}
        guideProgressUnavailable={guideProgressUnavailable}
        isUpdatingCompletion={isUpdatingCompletion}
        onSetCompletion={onSetCompletion}
      />

      <GuideWorkbookUnitsNav previousGuide={previousGuide} nextGuide={nextGuide} />

      <GuideIeltsLinks />

      <div className="hidden items-center gap-2 px-2 text-[11px] font-bold text-slate-400 lg:flex">
        <BarChart3 className="h-3.5 w-3.5" />
        Practice evidence stays separate from IELTS band scores.
      </div>
    </aside>
  );
}
