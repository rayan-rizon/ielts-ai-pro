import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Mail,
  MessageSquare,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import { AdminButton } from '@/components/admin/ui/primitives';
import {
  PANEL,
  WELL,
  TILE,
  NUM,
  MICRO,
  TITLE,
  MUTED,
  Pill,
} from '@/features/dashboard/components/primitives';
import AutopilotMessagePreviewDialog from './dialogs/AutopilotMessagePreviewDialog';
import { familiarRecommendationTitle, familiarRecommendationText } from './recommendationLanguage';

const LABELS = {
  first_practice: 'Start a first practice',
  next_practice: 'Suggest the next practice',
  subscriber_feature_help: 'Help a subscriber use their plan',
  quota_upgrade: 'Offer more AI feedback',
  re_engagement: 'Bring a learner back',
  cancellation_support: 'Help before a plan ends',
  referral_bonus_reminder: 'Use available referral credit',
  score_plateau: 'Help improve a steady score',
  incomplete_test: 'Resume a saved test',
  exam_countdown: 'Prepare for an upcoming exam',
  checkout_recovery: 'Help complete an upgrade',
};
const channelName = (channel) =>
  ({
    in_app: 'In-app message',
    email: 'Email',
    banner: 'In-app banner',
    push: 'Push notification',
  })[channel] || 'Message';
const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not checked yet';

const RECOMMENDATION_META = {
  messaging: { label: 'Message', tab: 'campaigns', action: 'Open campaigns' },
  journey: { label: 'Automation', tab: 'journeys', action: 'Open automations' },
  product: { label: 'Learner flow', tab: 'performance', action: 'View performance' },
  payment: { label: 'Payment', tab: 'journeys', action: 'Review recovery' },
  channel: { label: 'Channel', tab: 'performance', action: 'Compare channels' },
};

const severityMeta = (severity) =>
  ({
    urgent: { label: 'Urgent', tone: 'fault', rank: 3 },
    attention: { label: 'Attention', tone: 'warn', rank: 2 },
    opportunity: { label: 'Opportunity', tone: 'accent', rank: 1 },
  })[severity] || { label: 'Review', tone: 'neutral', rank: 0 };

const evidenceValue = (value) => {
  if (value === null || typeof value === 'undefined') return 'Observed';
  if (typeof value === 'object') return 'Available';
  return String(value);
};

function ReviewCard({ item, busy, act, actionsEnabled = true }) {
  const expired = new Date(item.expires_at).getTime() <= Date.now();
  const Icon = item.recommended_channel === 'email' ? Mail : MessageSquare;
  return (
    <article className={cn(TILE, 'p-4 min-w-0')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold">
          <Icon className="h-4 w-4 text-[#5a63df]" />
          {channelName(item.recommended_channel)}
          {item.objective === 'paid_conversion' && <Pill tone="accent">Subscription</Pill>}
        </span>
        <span className={cn(MICRO, MUTED, 'max-w-full truncate')}>
          {item.learner?.full_name || '1 learner'}
        </span>
      </div>
      <h3 className={cn(TITLE, 'mt-3')}>{LABELS[item.playbook_key] || 'Help this learner'}</h3>
      <p className={cn(MUTED, 'mt-1 text-xs leading-relaxed')}>{item.rationale}</p>
      <div className={cn(WELL, 'my-3 rounded-lg p-3 break-words')}>
        {item.recommended_channel === 'email' &&
          item.content?.subject &&
          item.content.subject !== item.content.title && (
            <p className="mb-2 text-xs font-semibold">Subject: {item.content.subject}</p>
          )}
        <p className="text-sm font-semibold">{item.content?.title}</p>
        <p className="mt-1 text-xs leading-relaxed">{item.content?.message}</p>
        <p className="mt-2 text-xs font-semibold text-[#5a63df]">
          {item.content?.cta_label || 'Continue'} →
        </p>
      </div>
      <p className={cn(MUTED, 'text-[11px]')}>
        {['in_app', 'banner'].includes(item.recommended_channel)
          ? 'Show on the next eligible visit'
          : 'Send after approval, if still eligible'}{' '}
        · {expired ? 'Expired' : `Valid until ${dateLabel(item.expires_at)}`}
      </p>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer py-1 text-stone-500">Why this action?</summary>
        <ul className="mt-1 space-y-1 pl-4 list-disc break-words">
          {(item.evidence || []).map((fact, i) => (
            <li key={i}>
              {String(fact.metric || 'Signal').replaceAll('_', ' ')}:{' '}
              {String(fact.value ?? 'Observed')}
            </li>
          ))}
        </ul>
        <p className={cn(MUTED, 'mt-2 break-all')}>Opens {item.destination}</p>
        {item.recommended_channel === 'email' && item.learner?.email && (
          <p className={cn(MUTED, 'mt-1 break-all')}>To {item.learner.email}</p>
        )}
        <p className={cn(MUTED, 'mt-1')}>
          {item.model_metadata?.generated_at
            ? 'AI draft based on this evidence.'
            : 'Prepared from a verified automation rule.'}{' '}
          Eligibility and contact limits are checked again before sending.
        </p>
      </details>
      <div className="mt-3 flex flex-wrap gap-2">
        <AdminButton
          disabled={Boolean(busy) || expired || !actionsEnabled}
          loading={busy === `approve-${item.id}`}
          onClick={() =>
            act(
              `approve-${item.id}`,
              () => MarketingService.approveIntervention(item.id, item.updated_at),
              'approval'
            )
          }
        >
          <Check className="h-3.5 w-3.5" /> Approve message
        </AdminButton>
        <AdminButton
          variant="outline"
          disabled={Boolean(busy) || expired || !actionsEnabled}
          loading={busy === `draft-${item.id}`}
          onClick={() =>
            act(
              `draft-${item.id}`,
              () => MarketingService.generateInterventionCopy(item.id),
              'draft'
            )
          }
        >
          <Sparkles className="h-3.5 w-3.5" /> Rewrite
        </AdminButton>
        <AdminButton
          variant="ghost"
          disabled={Boolean(busy) || !actionsEnabled}
          onClick={() =>
            act(
              `dismiss-${item.id}`,
              () => MarketingService.dismissIntervention(item.id, item.updated_at),
              'dismiss'
            )
          }
        >
          Dismiss
        </AdminButton>
      </div>
    </article>
  );
}

function OutcomeRow({ item }) {
  const deliveries = item.marketing_deliveries || [];
  const clicked = deliveries.some((d) => d.clicked_at);
  const seen = deliveries.some((d) => d.viewed_at);
  const failed = item.status === 'failed' || deliveries.some((d) => d.status === 'failed');
  const label = failed
    ? 'Needs attention'
    : item.outcome?.settled_purchase && item.sent_at
      ? 'Payment recorded'
      : clicked
        ? 'Clicked'
        : seen
          ? 'Seen'
          : item.status === 'sent'
            ? 'Awaiting response'
            : item.status === 'approved'
              ? 'Processing — check delivery'
              : item.status === 'cancelled'
                ? 'Cancelled'
                : item.status === 'expired'
                  ? 'Expired'
                  : 'Held back';
  return (
    <div className="border-t border-stone-200/70 py-3 dark:border-white/[0.07]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold">{LABELS[item.playbook_key] || 'Learner message'}</p>
        <Pill tone={failed ? 'fault' : clicked || seen ? 'ok' : 'neutral'}>{label}</Pill>
      </div>
      <p className={cn(MUTED, 'mt-1 text-[11px]')}>
        {channelName(item.recommended_channel)} · {dateLabel(item.sent_at || item.updated_at)}
      </p>
      {item.suppression_reason && (
        <p className="mt-1 break-words text-[11px]">
          {item.suppression_reason.replaceAll('_', ' ')}
        </p>
      )}
      {item.outcome?.practice_returned && item.sent_at && (
        <p className="mt-1 text-[11px]">Returned to practice after delivery</p>
      )}
    </div>
  );
}

function RecommendationCard({ item, busy, act, onNavigate }) {
  const category = RECOMMENDATION_META[item.category] || RECOMMENDATION_META.product;
  const severity = severityMeta(item.severity);
  const tracking = ['accepted', 'measuring'].includes(item.status);
  const evidence = Array.isArray(item.evidence) ? item.evidence.slice(0, 3) : [];

  return (
    <article className={cn(TILE, 'min-w-0 overflow-hidden p-4')}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={severity.tone}>{severity.label}</Pill>
        <span className={cn(MICRO, MUTED)}>{category.label}</span>
        {item.source === 'ai' && (
          <span className={cn(MICRO, 'ml-auto inline-flex items-center gap-1 text-[#5a63df]')}>
            <Sparkles className="h-3 w-3" /> AI found
          </span>
        )}
      </div>

      <h3 className={cn(TITLE, 'mt-3 leading-snug')}>{familiarRecommendationTitle(item.title)}</h3>

      <div className={cn(WELL, 'mt-3 rounded-lg p-3')}>
        <p className={cn(MICRO, 'text-[#5a63df]')}>Next</p>
        <p className="mt-1 text-xs font-medium leading-relaxed">
          {familiarRecommendationText(item.proposed_action)}
        </p>
      </div>

      {(item.summary || evidence.length > 0) && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer py-1 text-stone-500">
            Why this action
            {evidence.length
              ? ` · ${evidence.length} signal${evidence.length === 1 ? '' : 's'}`
              : ''}
          </summary>
          {item.summary && (
            <p className={cn(MUTED, 'mt-1 leading-relaxed')}>
              {familiarRecommendationText(item.summary)}
            </p>
          )}
          {!!evidence.length && (
            <dl className="mt-2 grid gap-1.5" aria-label="Evidence">
              {evidence.map((fact, index) => (
                <div
                  key={`${fact.metric || 'signal'}-${index}`}
                  className="flex justify-between gap-3"
                >
                  <dt className={MUTED}>{String(fact.metric || 'Signal').replaceAll('_', ' ')}</dt>
                  <dd className={cn(NUM, 'text-right font-semibold')}>
                    {evidenceValue(fact.value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </details>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <AdminButton size="sm" onClick={() => onNavigate?.(category.tab)}>
          {category.action} <ArrowUpRight className="h-3.5 w-3.5" />
        </AdminButton>
        {tracking ? (
          <Pill tone="ok">
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
    </article>
  );
}

export default function AutopilotPanel({ autopilot, onRefresh, onNavigate }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [offset, setOffset] = useState(0);
  const [previewPolicy, setPreviewPolicy] = useState(null);
  const [prepared, setPrepared] = useState(null);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const generation = useRef(0);
  const lock = useRef(false);
  const actionQueueRef = useRef(null);
  const policies = autopilot?.policies || [];
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const result = await MarketingService.getCopilotState(offset);
      if (request !== generation.current) return;
      if (offset && !result.queue?.length) {
        setOffset(Math.max(0, offset - 20));
        return;
      }
      setState(result);
      setError('');
    } catch (err) {
      if (request === generation.current) setError(err.message || 'Could not refresh Copilot');
    }
  }, [offset]);
  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden && !lock.current) refresh();
    }, 30000);
    return () => {
      clearInterval(timer);
      generation.current += 1;
    };
  }, [refresh]);
  const act = async (key, action, kind) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(key);
    try {
      const result = await action();
      if (kind === 'approval') {
        if (result.status === 'sent')
          toast.success('Approved. Delivery started; results will appear here.');
        else if (result.status === 'failed')
          toast.error(result.reason || 'Delivery failed. Check recent activity.');
        else
          toast.info(result.reason || 'Action held back after checking the latest learner state.');
      } else if (kind === 'prepare') {
        setPrepared(result);
        toast.success(`${result.created || 0} actions prepared for approval`);
      } else if (kind === 'draft') toast.success('New draft ready to review');
      else if (kind === 'dismiss') toast.success('Action dismissed');
      else if (kind === 'recommendation')
        toast.success(
          result.status === 'dismissed' ? 'Suggestion dismissed' : 'Added to follow-up'
        );
      else toast.success('Automation updated');
      await refresh();
      if (['policy', 'recommendation'].includes(kind)) await onRefresh();
    } catch (err) {
      toast.error(err.message || 'Action could not be completed');
      await refresh();
    } finally {
      lock.current = false;
      setBusy('');
    }
  };
  const monitor = state?.monitor;
  const delayed = monitor && Date.now() - new Date(monitor.created_at).getTime() > 30 * 60000;
  const monitorError = monitor?.model_metadata?.error;
  const actionsEnabled = state?.available !== false;
  const monitorLabel = monitorError
    ? 'Check failed'
    : delayed
      ? 'Check delayed'
      : monitor
        ? monitor.model_metadata?.source === 'scheduled'
          ? 'Monitoring'
          : 'Checked manually'
        : 'Awaiting first check';
  const queue = state?.queue || [];
  const recommendations = [...(autopilot?.recommendations || [])].sort(
    (a, b) => severityMeta(b.severity).rank - severityMeta(a.severity).rank
  );
  const visibleRecommendations = showAllRecommendations
    ? recommendations
    : recommendations.slice(0, queue.length ? 2 : 4);
  const actionCount = queue.length + recommendations.length;
  const enabledPolicies = policies.filter((policy) => policy.enabled).length;
  return (
    <section aria-label="Subscription Copilot" className="space-y-4">
      <div className={cn(PANEL, 'p-4 sm:p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={cn(MICRO, 'text-[#5a63df]')}>Subscription Copilot</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Decide what happens next</h2>
            <p className={cn(MUTED, 'mt-1 text-xs')}>
              Review learner messages and the few admin actions that matter now.
            </p>
          </div>
          <AdminButton
            disabled={Boolean(busy) || Boolean(error) || !state}
            loading={busy === 'prepare'}
            onClick={() => {
              if (!actionsEnabled) {
                actionQueueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
              }
              act('prepare', () => MarketingService.prepareCopilotActions(), 'prepare');
            }}
          >
            {actionsEnabled ? <Sparkles className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            {actionsEnabled
              ? 'Prepare actions'
              : recommendations.length
                ? `Review ${recommendations.length} admin action${recommendations.length === 1 ? '' : 's'}`
                : 'Review setup'}
          </AdminButton>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-stone-200/70 pt-3 dark:border-white/[0.07]">
          <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <span className="text-xs">
              <span className={cn(NUM, 'text-lg font-bold')}>{queue.length}</span> learner{' '}
              {queue.length === 1 ? 'message' : 'messages'}
            </span>
            <span className="text-xs">
              <span className={cn(NUM, 'text-lg font-bold')}>{recommendations.length}</span> admin{' '}
              {recommendations.length === 1 ? 'action' : 'actions'}
            </span>
            <span className="text-xs">
              <span className={cn(NUM, 'text-lg font-bold')}>{enabledPolicies}</span> automations on
            </span>
            <Pill
              tone={
                state?.setupPending
                  ? 'warn'
                  : monitorError || delayed
                    ? 'warn'
                    : monitor
                      ? 'ok'
                      : 'neutral'
              }
            >
              {state?.setupPending ? 'Review mode' : monitorLabel}
            </Pill>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={Boolean(busy)}
            className="ml-auto inline-flex items-center gap-1 py-1 text-xs text-[#5a63df]"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        {monitorError && (
          <p role="alert" className="mt-2 text-xs text-[rgb(var(--signal-fault))]">
            {monitorError}
          </p>
        )}
        {prepared && (
          <p role="status" className="mt-2 text-xs">
            {prepared.created || 0} prepared · {prepared.drafted || 0} AI drafts ·{' '}
            {prepared.suppressed || 0} held back. Nothing sent.
          </p>
        )}
        {(prepared?.warnings || monitor?.model_metadata?.warnings || []).map((warning, i) => (
          <p key={i} className="mt-1 text-xs text-[rgb(var(--signal-warn))]">
            {warning}
          </p>
        ))}
      </div>
      {state?.setupPending && (
        <div className={cn(WELL, '-mt-2 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2')}>
          <ShieldCheck className="h-4 w-4 shrink-0 text-[rgb(var(--signal-warn))]" />
          <p className="min-w-0 flex-1 text-xs">
            <span className="font-semibold">Copilot actions need the worker update.</span>{' '}
            <span className={MUTED}>Insights below are still available.</span>
          </p>
          <Pill tone="warn">Worker setup pending</Pill>
        </div>
      )}
      {error && (
        <div role="alert" className={cn(PANEL, 'p-4 text-sm text-[rgb(var(--signal-fault))]')}>
          {error}
        </div>
      )}
      {!state && !error && (
        <div role="status" className={cn(PANEL, 'h-48 animate-pulse p-4 text-xs')}>
          Loading review queue…
        </div>
      )}
      {state && (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div ref={actionQueueRef} className="min-w-0 scroll-mt-4 space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h3 className={TITLE}>Priority actions</h3>
              <span className={cn(MICRO, MUTED)}>
                {actionCount} action{actionCount === 1 ? '' : 's'} ready
              </span>
            </div>
            {queue.map((item) => (
              <ReviewCard
                key={item.id}
                item={item}
                busy={busy}
                actionsEnabled={actionsEnabled}
                act={act}
              />
            ))}
            {!!visibleRecommendations.length && (
              <div className={cn('grid gap-3', queue.length ? 'grid-cols-1' : 'md:grid-cols-2')}>
                {visibleRecommendations.map((item) => (
                  <RecommendationCard
                    key={item.id}
                    item={item}
                    busy={busy}
                    act={act}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
            {!actionCount && (
              <div className={cn(PANEL, 'p-7 text-center')}>
                <CheckCircle2 className="mx-auto h-6 w-6 text-[rgb(var(--signal-ok))]" />
                <p className="mt-3 text-sm font-semibold">You are caught up</p>
                <p className={cn(MUTED, 'mt-1 text-xs')}>
                  No learner message or admin action needs a decision right now.
                </p>
              </div>
            )}
            {recommendations.length > visibleRecommendations.length && (
              <AdminButton
                variant="outline"
                className="w-full"
                onClick={() => setShowAllRecommendations(true)}
              >
                Show all {recommendations.length} admin actions
              </AdminButton>
            )}
            {showAllRecommendations && recommendations.length > (queue.length ? 2 : 4) && (
              <AdminButton
                variant="ghost"
                className="w-full"
                onClick={() => setShowAllRecommendations(false)}
              >
                Show fewer actions
              </AdminButton>
            )}
            {state.total > 20 && (
              <div className="flex items-center justify-between gap-2">
                <AdminButton
                  variant="outline"
                  disabled={!offset || Boolean(busy)}
                  onClick={() => setOffset(Math.max(0, offset - 20))}
                >
                  Previous
                </AdminButton>
                <span className="text-xs">
                  {offset + 1}–{Math.min(offset + 20, state.total)} of {state.total}
                </span>
                <AdminButton
                  variant="outline"
                  disabled={offset + 20 >= state.total || Boolean(busy)}
                  onClick={() => setOffset(offset + 20)}
                >
                  Next
                </AdminButton>
              </div>
            )}
          </div>
          <aside className={cn(PANEL, 'min-w-0 p-4 xl:sticky xl:top-4')}>
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#5a63df]" />
              <h3 className={TITLE}>Results monitor</h3>
            </div>
            <p className={cn(MUTED, 'mb-3 text-xs')}>
              What happened after approved learner messages.
            </p>
            {(state.history || []).map((item) => (
              <OutcomeRow key={item.id} item={item} />
            ))}
            {!state.history?.length && (
              <div className={cn(WELL, 'rounded-lg p-4')}>
                <p className="text-xs font-semibold">No results yet</p>
                <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-[11px]">
                  <span className={cn(NUM, 'text-[#5a63df]')}>01</span>
                  <span className={MUTED}>Approve a learner message</span>
                  <span className={cn(NUM, 'text-[#5a63df]')}>02</span>
                  <span className={MUTED}>Copilot confirms delivery or suppression</span>
                  <span className={cn(NUM, 'text-[#5a63df]')}>03</span>
                  <span className={MUTED}>Seen, clicked, returned, or subscribed appears here</span>
                </div>
              </div>
            )}
            <p className={cn(MUTED, 'mt-3 text-[10px]')}>
              A payment after a message is an observed result, not proof the message caused it.
            </p>
          </aside>
        </div>
      )}
      <details className={cn(PANEL, 'p-4')}>
        <summary className="cursor-pointer text-xs font-semibold">
          Automations & monitoring{' '}
          <span className={cn(MUTED, 'ml-2')}>
            {policies.filter((p) => p.enabled).length} enabled
          </span>
        </summary>
        <p className={cn(MUTED, 'my-3 text-xs')}>
          Enabled automations prepare messages for approval. The scheduled worker checks every 15
          minutes; this page refreshes every 30 seconds.
        </p>
        {monitor?.model_metadata?.learners_scanned >= monitor?.model_metadata?.scan_limit && (
          <p className="mb-3 text-xs text-[rgb(var(--signal-warn))]">
            The last check reached its {monitor.model_metadata.scan_limit}-learner limit; coverage
            is partial.
          </p>
        )}
        <div className="divide-y divide-stone-200/70 dark:divide-white/[0.07]">
          {policies.map((policy) => (
            <div key={policy.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <label
                htmlFor={`policy-${policy.id}`}
                className="min-w-0 flex-1 text-xs font-semibold"
              >
                {LABELS[policy.playbook_key] || policy.name}
              </label>
              <AdminButton size="sm" variant="ghost" onClick={() => setPreviewPolicy(policy)}>
                Preview
              </AdminButton>
              <Switch
                id={`policy-${policy.id}`}
                checked={policy.enabled}
                disabled={Boolean(busy) || Boolean(error)}
                aria-label={`Enable ${LABELS[policy.playbook_key] || policy.name}`}
                onCheckedChange={(enabled) =>
                  act(
                    policy.id,
                    () =>
                      MarketingService.updateAutopilotPolicy(policy.id, {
                        enabled,
                        mode: 'review',
                      }),
                    'policy'
                  )
                }
              />
            </div>
          ))}
        </div>
      </details>
      <AutopilotMessagePreviewDialog
        policy={previewPolicy}
        open={Boolean(previewPolicy)}
        onOpenChange={(open) => !open && setPreviewPolicy(null)}
      />
    </section>
  );
}
