import { ArrowUpRight, CheckCircle2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import {
  AdminButton,
  MICRO,
  MUTED,
  NUM,
  Pill,
  SectionLabel,
  TILE,
  TITLE,
  WELL,
} from '@/components/admin/ui/primitives';
import { familiarRecommendationTitle, familiarRecommendationText } from '../recommendationLanguage';

export const RECOMMENDATION_META = {
  messaging: { label: 'Message', tab: 'campaigns', action: 'Open campaigns' },
  journey: { label: 'Automation', tab: 'journeys', action: 'Open automations' },
  product: { label: 'Learner flow', tab: 'performance', action: 'View performance' },
  payment: { label: 'Payment', tab: 'journeys', action: 'Review recovery' },
  channel: { label: 'Channel', tab: 'performance', action: 'Compare channels' },
};

export const SEVERITY_CONFIG = {
  urgent: { label: 'Urgent', tone: 'fault', rank: 3 },
  attention: { label: 'Attention', tone: 'warn', rank: 2 },
  opportunity: { label: 'Opportunity', tone: 'accent', rank: 1 },
};

export const severityMeta = (severity) =>
  SEVERITY_CONFIG[severity] || { label: 'Review', tone: 'neutral', rank: 0 };

const evidenceValue = (value) => {
  if (value === null || typeof value === 'undefined') return 'Observed';
  if (typeof value === 'object') return 'Available';
  return String(value);
};

function RecommendationSignals({ summary, evidence }) {
  if (!summary && !evidence.length) return null;
  const signalCountText = evidence.length
    ? ` · ${evidence.length} signal${evidence.length === 1 ? '' : 's'}`
    : '';

  return (
    <details className="mt-2 text-[11px]">
      <summary
        className={cn(
          MICRO,
          MUTED,
          'cursor-pointer select-none py-1 transition-colors duration-quick ease-smooth-out hover:text-stone-700 dark:hover:text-stone-200'
        )}
      >
        Why this action{signalCountText}
      </summary>
      {summary && (
        <p className={cn(MUTED, 'mt-1 font-medium leading-relaxed')}>
          {familiarRecommendationText(summary)}
        </p>
      )}
      {evidence.length > 0 && (
        <dl className="mt-2 grid gap-1.5" aria-label="Evidence">
          {evidence.map((fact, index) => (
            <div key={`${fact.metric || 'signal'}-${index}`} className="flex justify-between gap-3">
              <dt className={cn(MUTED, 'font-medium')}>
                {String(fact.metric || 'Signal').replaceAll('_', ' ')}
              </dt>
              <dd className={cn(NUM, 'text-right font-bold text-stone-800 dark:text-stone-100')}>
                {evidenceValue(fact.value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </details>
  );
}

function RecommendationActions({ item, category, tracking, busy, act, onNavigate }) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-stone-200/80 pt-2.5 dark:border-white/[0.10]">
      <AdminButton size="sm" onClick={() => onNavigate?.(category.tab)}>
        {category.action} <ArrowUpRight className="h-3.5 w-3.5" />
      </AdminButton>
      {tracking ? (
        <Pill tone="ok" className="animate-in fade-in zoom-in-95 duration-quick">
          <CheckCircle2 className="h-3 w-3" /> Tracking
        </Pill>
      ) : (
        <AdminButton
          size="sm"
          variant="outline"
          disabled={Boolean(busy)}
          loading={busy === `track-${item.id}`}
          onClick={() =>
            act(
              `track-${item.id}`,
              () => MarketingService.updateRecommendation(item.id, 'measuring'),
              'recommendation'
            )
          }
        >
          Track this
        </AdminButton>
      )}
      <AdminButton
        size="sm"
        variant="ghost"
        aria-label={`Dismiss ${familiarRecommendationTitle(item.title)}`}
        disabled={Boolean(busy)}
        onClick={() =>
          act(
            `dismiss-recommendation-${item.id}`,
            () => MarketingService.updateRecommendation(item.id, 'dismissed'),
            'recommendation'
          )
        }
      >
        <X className="h-3.5 w-3.5" /> Dismiss
      </AdminButton>
    </div>
  );
}

export default function RecommendationCard({ item, busy, act, onNavigate }) {
  const category = RECOMMENDATION_META[item.category] || RECOMMENDATION_META.product;
  const severity = severityMeta(item.severity);
  const tracking = ['accepted', 'measuring'].includes(item.status);
  const evidence = Array.isArray(item.evidence) ? item.evidence.slice(0, 3) : [];

  return (
    <article
      className={cn(
        TILE,
        'flex min-w-0 flex-col overflow-hidden p-3 transition-all duration-200 ease-smooth-out hover:border-stone-300 dark:hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xs'
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={severity.tone}>{severity.label}</Pill>
        <span className={cn(MICRO, MUTED)}>{category.label}</span>
        {item.source === 'ai' && (
          <span
            className={cn(
              MICRO,
              'ml-auto inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400'
            )}
          >
            <Sparkles className="h-3 w-3" /> AI found
          </span>
        )}
      </div>

      <h3 className={cn(TITLE, 'mt-2 leading-snug')}>{familiarRecommendationTitle(item.title)}</h3>

      <div className={cn(WELL, 'mt-2 rounded-lg p-2.5')}>
        <SectionLabel accent="accent">Next</SectionLabel>
        <p className="mt-1.5 line-clamp-4 text-[10px] font-medium leading-relaxed text-stone-700 dark:text-stone-200">
          {familiarRecommendationText(item.proposed_action)}
        </p>
      </div>

      <RecommendationSignals summary={item.summary} evidence={evidence} />

      <RecommendationActions
        item={item}
        category={category}
        tracking={tracking}
        busy={busy}
        act={act}
        onNavigate={onNavigate}
      />
    </article>
  );
}
