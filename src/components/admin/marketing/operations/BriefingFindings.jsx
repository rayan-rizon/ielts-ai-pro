import { CircleCheck, ChevronRight } from 'lucide-react';
import { WELL, TILE, TITLE, MUTED, Pill } from '@/components/admin/ui/primitives';
import { cn } from '@/lib/cn';
import { date } from './operationsConstants';

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
  const windowLabel = item.measurement_window || 'Not recorded';

  return (
    <article className={cn(TILE, 'p-3')}>
      <Pill tone={tone}>{item.severity}</Pill>
      <h3 className={cn(TITLE, 'mt-2 text-[12px]')}>{item.title}</h3>
      <p className="mt-1.5 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
        {item.summary}
      </p>
      <p className={cn(MUTED, 'mt-2 text-[10px]')}>
        Sample: {item.sample_size} · Created {date(item.created_at)} · Window: {windowLabel}
      </p>
      <details className="mt-2 text-[10.5px]">
        <summary className="cursor-pointer text-stone-500 hover:text-stone-800 dark:hover:text-stone-300">
          Supporting evidence
        </summary>
        <pre
          className={cn(
            WELL,
            'mt-1 max-h-40 overflow-auto rounded p-2 text-[10px] whitespace-pre-wrap break-words'
          )}
        >
          {JSON.stringify(item.evidence, null, 2)}
        </pre>
      </details>
      <p className="mt-2 text-[11px] font-semibold text-stone-800 dark:text-stone-200">
        Suggested step: {item.proposed_action}
      </p>
      <a
        href="#autopilot-recommendations"
        className="mt-2 inline-block text-[11px] font-semibold text-[#5a63df] hover:underline"
      >
        Review recommendation →
      </a>
    </article>
  );
}

function BriefingFindingsList({ items }) {
  return (
    <details className="group mt-3 rounded-lg border border-stone-200/80 px-3 py-1.5 text-xs dark:border-white/[0.07]">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1.5 text-[11px] font-bold text-stone-800 dark:text-stone-200">
        <ChevronRight
          className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-90"
          aria-hidden="true"
        />
        Needs attention ({items.length})
      </summary>
      <div className="grid gap-2 py-2 lg:grid-cols-3">
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
