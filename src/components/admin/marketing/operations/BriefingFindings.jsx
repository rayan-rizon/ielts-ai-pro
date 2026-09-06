import { CircleCheck, ChevronRight } from 'lucide-react';
import { WELL, MUTED, Pill } from '@/components/admin/ui/primitives';
import { cn } from '@/lib/cn';
import { familiarRecommendationTitle } from '../recommendationLanguage';
import { date } from './operationsConstants';

const SEVERITY_LABELS = {
  urgent: 'Urgent',
  attention: 'Check',
  opportunity: 'Idea',
};

const CATEGORY_LABELS = {
  messaging: 'Messages',
  journey: 'Automation',
  product: 'Product',
  payment: 'Payment',
  channel: 'Channel',
};

function EmptyBriefingWell({ lastAnalysisAt }) {
  return (
    <div
      className={cn(
        WELL,
        'mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-stone-200/80 px-3 py-2 text-xs dark:border-white/[0.07]'
      )}
      title="No evidence-backed findings are available. This is not a full health check."
    >
      <CircleCheck
        className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]"
        aria-hidden="true"
      />
      <span className="text-[11px] font-bold text-stone-900 dark:text-stone-100">
        No new findings
      </span>
      <span className={cn(MUTED, 'text-[10.5px]')}>Last checked {date(lastAnalysisAt)}</span>
    </div>
  );
}

function BriefingFindingCard({ item }) {
  const tone = item.severity === 'urgent' ? 'fault' : 'warn';

  return (
    <article className="flex min-w-0 items-center gap-2 border-t border-stone-200/80 py-2 first:border-t-0 dark:border-white/[0.07]">
      <Pill tone={tone}>{SEVERITY_LABELS[item.severity] || 'Check'}</Pill>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-stone-900 dark:text-stone-100">
          {familiarRecommendationTitle(item.title)}
        </p>
        <p className={cn(MUTED, 'text-[9px]')}>
          {CATEGORY_LABELS[item.category] || 'Autopilot'} · {Number(item.sample_size || 0)}{' '}
          {Number(item.sample_size || 0) === 1 ? 'learner' : 'learners'}
        </p>
      </div>
      <a
        href={`#recommendation-${item.id}`}
        className="shrink-0 text-[10px] font-bold text-[#5a63df] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
      >
        Review
      </a>
    </article>
  );
}

function BriefingFindingsList({ items }) {
  return (
    <details className="group mt-3 rounded-lg border border-stone-200/80 px-3 py-1 text-xs dark:border-white/[0.07]">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1.5 text-[11px] font-bold text-stone-800 dark:text-stone-200">
        <ChevronRight
          className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-90"
          aria-hidden="true"
        />
        {items.length} {items.length === 1 ? 'item' : 'items'} to review
      </summary>
      <div className="pb-1">
        {items.map((item) => (
          <BriefingFindingCard key={item.id} item={item} />
        ))}
      </div>
    </details>
  );
}

export function BriefingFindings({ brief }) {
  if (!brief) return null;

  if (brief.items.length === 0) {
    return <EmptyBriefingWell lastAnalysisAt={brief.last_analysis?.created_at} />;
  }

  return <BriefingFindingsList items={brief.items} />;
}
