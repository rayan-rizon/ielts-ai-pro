import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import {
  Activity,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Mail,
  MessageSquare,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import {
  AdminButton,
  CARD_PRESENCE_VARIANTS,
  Empty,
  MICRO,
  MUTED,
  NUM,
  Notice,
  PANEL,
  PanelHeader,
  Pill,
  SectionLabel,
  StatCell,
  StatRail,
  TILE,
  TITLE,
  WELL,
} from '@/components/admin/ui/primitives';
import AutopilotMessagePreviewDialog from './dialogs/AutopilotMessagePreviewDialog';
import RecommendationCard, { severityMeta } from './autopilot/RecommendationCard';
import AutopilotAutomations from './autopilot/AutopilotAutomations';
import { useCopilotState } from './autopilot/useCopilotState';
import ExpiryTimer from '@/components/shared/ExpiryTimer';

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

const CHANNEL_LABELS = {
  in_app: 'In-app message',
  email: 'Email',
  banner: 'In-app banner',
  push: 'Push notification',
};

const channelName = (channel) => CHANNEL_LABELS[channel] || 'Message';

const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not checked yet';

const OUTCOME_STATUS_MAP = {
  sent: 'Awaiting response',
  approved: 'Processing — check delivery',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const hasDeliveryEvent = (deliveries = [], key) => deliveries.some((d) => Boolean(d[key]));

const hasDeliveryFailure = (item, deliveries = []) =>
  item.status === 'failed' || deliveries.some((d) => d.status === 'failed');

function getOutcomeStatus(item) {
  const deliveries = item.marketing_deliveries || [];
  if (hasDeliveryFailure(item, deliveries)) {
    return { label: 'Needs attention', tone: 'fault' };
  }
  if (item.outcome?.settled_purchase && item.sent_at) {
    return { label: 'Payment recorded', tone: 'ok' };
  }
  if (hasDeliveryEvent(deliveries, 'clicked_at')) {
    return { label: 'Clicked', tone: 'ok' };
  }
  if (hasDeliveryEvent(deliveries, 'viewed_at')) {
    return { label: 'Seen', tone: 'ok' };
  }
  const defaultLabel = OUTCOME_STATUS_MAP[item.status] || 'Held back';
  return { label: defaultLabel, tone: 'neutral' };
}

function ReviewCardHeader({ item }) {
  const Icon = item.recommended_channel === 'email' ? Mail : MessageSquare;
  const isPaidConversion = item.objective === 'paid_conversion';
  const learnerName = item.learner?.full_name || '1 learner';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 px-3 py-2 dark:border-white/[0.07]">
      <span
        className={cn(
          MICRO,
          MUTED,
          'inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-300'
        )}
      >
        <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        {channelName(item.recommended_channel)}
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        {isPaidConversion && <Pill tone="accent">Subscription</Pill>}
        <span className={cn(MICRO, MUTED, 'max-w-full truncate')}>{learnerName}</span>
      </span>
    </div>
  );
}

function hasSubjectHeader(item) {
  if (item.recommended_channel !== 'email') return false;
  const subject = item.content?.subject;
  if (!subject) return false;
  return subject !== item.content.title;
}

function getDispatchTiming(channel) {
  if (channel === 'in_app' || channel === 'banner') {
    return 'Show on the next eligible visit';
  }
  return 'Send after approval, if still eligible';
}

function ReviewCardWell({ content, showSubject }) {
  return (
    <div className={cn(WELL, 'my-2.5 break-words rounded-lg p-2.5')}>
      {showSubject && <p className={cn(MICRO, MUTED, 'mb-2')}>Subject: {content.subject}</p>}
      <p className="text-[11px] font-extrabold leading-snug text-stone-900 dark:text-stone-50">
        {content?.title}
      </p>
      <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-stone-600 dark:text-stone-300">
        {content?.message}
      </p>
      <p className="mt-1.5 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
        {content?.cta_label || 'Continue'} →
      </p>
    </div>
  );
}

function ReviewCardMessage({ item }) {
  const showSubject = hasSubjectHeader(item);
  const timing = getDispatchTiming(item.recommended_channel);
  const title = LABELS[item.playbook_key] || 'Help this learner';

  return (
    <>
      <h3 className={cn(TITLE, 'leading-snug')}>{title}</h3>
      <p className={cn(MUTED, 'mt-1 line-clamp-2 text-[10px] font-medium leading-relaxed')}>
        {item.rationale}
      </p>
      <ReviewCardWell content={item.content} showSubject={showSubject} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn(MUTED, 'text-[10px] font-medium leading-snug')}>{timing}</p>
        <ExpiryTimer expiresAt={item.expires_at} prefix="Review available" />
      </div>
    </>
  );
}

function ReviewCardEvidence({ item }) {
  const evidence = item.evidence || [];
  const modelNote = item.model_metadata?.generated_at
    ? 'AI draft based on this evidence.'
    : 'Prepared from a verified automation rule.';

  return (
    <details className="mt-2 text-[11px]">
      <summary
        className={cn(
          MICRO,
          MUTED,
          'cursor-pointer py-1 hover:text-stone-700 dark:hover:text-stone-200'
        )}
      >
        Why this action?
      </summary>
      <ul className="mt-1 list-disc space-y-1 break-words pl-4 text-stone-600 dark:text-stone-300">
        {evidence.map((fact, i) => (
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
        {modelNote} Eligibility and contact limits are checked again before sending.
      </p>
    </details>
  );
}

function ReviewCardActions({ item, busy, expired, actionsEnabled, act }) {
  const canPerformAction = !busy && !expired && actionsEnabled;
  return (
    <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-stone-200/80 pt-2.5 dark:border-white/[0.07]">
      <AdminButton
        size="sm"
        disabled={!canPerformAction}
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
        size="sm"
        variant="outline"
        disabled={!canPerformAction}
        loading={busy === `draft-${item.id}`}
        onClick={() =>
          act(`draft-${item.id}`, () => MarketingService.generateInterventionCopy(item.id), 'draft')
        }
      >
        <Sparkles className="h-3.5 w-3.5" /> Rewrite
      </AdminButton>
      <AdminButton
        size="sm"
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
  );
}

function ReviewCard({ item, busy, act, actionsEnabled = true }) {
  const expired = new Date(item.expires_at).getTime() <= Date.now();
  return (
    <article className={cn(PANEL, 'flex min-w-0 flex-col overflow-hidden')}>
      <ReviewCardHeader item={item} />
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <ReviewCardMessage item={item} />
        <ReviewCardEvidence item={item} />
        <ReviewCardActions
          item={item}
          busy={busy}
          expired={expired}
          actionsEnabled={actionsEnabled}
          act={act}
        />
      </div>
    </article>
  );
}

function OutcomeRow({ item }) {
  const { label, tone } = getOutcomeStatus(item);
  const timestamp = item.sent_at || item.updated_at;
  const returnedToPractice = Boolean(item.outcome?.practice_returned && item.sent_at);

  return (
    <div className={cn(TILE, 'p-2.5')}>
      <div className="flex flex-wrap items-start justify-between gap-1.5">
        <p className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-stone-800 dark:text-stone-100">
          {LABELS[item.playbook_key] || 'Learner message'}
        </p>
        <Pill tone={tone}>{label}</Pill>
      </div>
      <p className={cn(MICRO, MUTED, 'mt-1 normal-case tracking-normal text-[10px] font-medium')}>
        {channelName(item.recommended_channel)} · {dateLabel(timestamp)}
      </p>
      {item.suppression_reason && (
        <p className={cn(MUTED, 'mt-1 break-words text-[10px] font-medium')}>
          {item.suppression_reason.replaceAll('_', ' ')}
        </p>
      )}
      {returnedToPractice && (
        <p className={cn(MUTED, 'mt-1 text-[10px] font-medium')}>
          Returned to practice after delivery
        </p>
      )}
    </div>
  );
}

function getPrepareButtonConfig(actionsEnabled, recommendationsCount) {
  if (actionsEnabled) {
    return {
      label: 'Prepare actions',
      icon: Sparkles,
    };
  }
  if (recommendationsCount > 0) {
    const plural = recommendationsCount === 1 ? '' : 's';
    return {
      label: `Review ${recommendationsCount} admin action${plural}`,
      icon: Search,
    };
  }
  return {
    label: 'Review setup',
    icon: Search,
  };
}

function isMonitorDelayed(monitor) {
  if (!monitor?.created_at) return false;
  return Date.now() - new Date(monitor.created_at).getTime() > 30 * 60000;
}

function resolveMonitorLabel(monitor, monitorError, delayed) {
  if (monitorError) return 'Check failed';
  if (delayed) return 'Check delayed';
  if (monitor?.model_metadata?.source === 'scheduled') return 'Monitoring';
  if (monitor) return 'Checked manually';
  return 'Awaiting first check';
}

function resolveMonitorTone(needsAttention, monitor) {
  if (needsAttention) return 'warn';
  if (monitor) return 'ok';
  return 'neutral';
}

function getMonitorStatus(monitor, setupPending) {
  const delayed = isMonitorDelayed(monitor);
  const monitorError = monitor?.model_metadata?.error;
  const rawLabel = resolveMonitorLabel(monitor, monitorError, delayed);
  const needsAttention = Boolean(setupPending || monitorError || delayed);

  return {
    delayed,
    monitorError,
    label: setupPending ? 'Review mode' : rawLabel,
    tone: resolveMonitorTone(needsAttention, monitor),
  };
}

function handleApprovalFeedback(result) {
  if (result.status === 'sent') {
    toast.success('Approved. Delivery started; results will appear here.');
    return;
  }
  if (result.status === 'failed') {
    toast.error(result.reason || 'Delivery failed. Check recent activity.');
    return;
  }
  toast.info(result.reason || 'Action held back after checking the latest learner state.');
}

function handleActionFeedback(result, kind, setPrepared) {
  if (kind === 'approval') {
    handleApprovalFeedback(result);
    return;
  }
  if (kind === 'prepare') {
    setPrepared(result);
    toast.success(`${result.created || 0} actions prepared for approval`);
    return;
  }
  if (kind === 'draft') {
    toast.success('New draft ready to review');
    return;
  }
  if (kind === 'dismiss') {
    toast.success('Action dismissed');
    return;
  }
  if (kind === 'recommendation') {
    const message = result.status === 'dismissed' ? 'Suggestion dismissed' : 'Added to follow-up';
    toast.success(message);
    return;
  }
  toast.success('Automation updated');
}

function sortRecommendations(items = []) {
  return [...items].sort((a, b) => severityMeta(b.severity).rank - severityMeta(a.severity).rank);
}

function countEnabledPolicies(policies = []) {
  return policies.filter((p) => Boolean(p.enabled)).length;
}

function getAutopilotWarnings(prepared, monitor) {
  if (prepared?.warnings) return prepared.warnings;
  if (monitor?.model_metadata?.warnings) return monitor.model_metadata.warnings;
  return [];
}

function useCopilotPolling(refresh, isLocked, generation) {
  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden && !isLocked()) {
        refresh();
      }
    }, 30000);
    return () => {
      clearInterval(timer);
      generation.current += 1;
    };
  }, [refresh, isLocked, generation]);
}

const isPolicyOrRecommendation = (kind) => kind === 'policy' || kind === 'recommendation';

function useCopilotActions({ refresh, onRefresh, setPrepared }) {
  const [busy, setBusy] = useState('');
  const lock = useRef(false);

  const isLocked = useCallback(() => lock.current, []);

  const act = useCallback(
    async (key, action, kind) => {
      if (lock.current) return;
      lock.current = true;
      setBusy(key);
      try {
        const result = await action();
        handleActionFeedback(result, kind, setPrepared);
        await refresh();
        if (isPolicyOrRecommendation(kind)) {
          await onRefresh();
        }
      } catch (err) {
        toast.error(err.message || 'Action could not be completed');
        await refresh();
      } finally {
        lock.current = false;
        setBusy('');
      }
    },
    [refresh, onRefresh, setPrepared]
  );

  return { busy, isLocked, act };
}

function useAutopilotWorkspace({ autopilot, onRefresh }) {
  const { state, error, offset, setOffset, generation, refresh } = useCopilotState(0);
  const [previewPolicy, setPreviewPolicy] = useState(null);
  const [prepared, setPrepared] = useState(null);
  const actionQueueRef = useRef(null);

  const { busy, isLocked, act } = useCopilotActions({
    refresh,
    onRefresh,
    setPrepared,
  });

  useCopilotPolling(refresh, isLocked, generation);

  const policies = autopilot?.policies || [];
  const monitor = state?.monitor;
  const monitorInfo = getMonitorStatus(monitor, Boolean(state?.setupPending));
  const actionsEnabled = state?.available !== false;
  const queue = state?.queue || [];
  const recommendations = sortRecommendations(autopilot?.recommendations);
  const actionCount = queue.length + recommendations.length;
  const enabledPolicies = countEnabledPolicies(policies);

  return {
    state,
    error,
    busy,
    offset,
    setOffset,
    previewPolicy,
    setPreviewPolicy,
    prepared,
    actionQueueRef,
    policies,
    refresh,
    act,
    monitor,
    monitorInfo,
    actionsEnabled,
    queue,
    recommendations,
    actionCount,
    enabledPolicies,
  };
}

function AutopilotStatsBar({
  queueLength,
  recommendationsLength,
  enabledPolicies,
  totalPolicies,
  monitorCreatedAt,
  monitorInfo,
}) {
  return (
    <StatRail className="grid-cols-2 sm:grid-cols-4">
      <StatCell
        label="Learner messages"
        value={queueLength.toLocaleString()}
        sub="Awaiting your approval"
      />
      <StatCell
        label="Admin actions"
        value={recommendationsLength.toLocaleString()}
        sub="Evidence-led suggestions"
      />
      <StatCell
        label="Automations on"
        value={`${enabledPolicies}/${totalPolicies}`}
        sub="Preparing messages for review"
      />
      <StatCell label="Monitoring" sub={dateLabel(monitorCreatedAt)}>
        <span className="flex">
          <Pill tone={monitorInfo.tone}>{monitorInfo.label}</Pill>
        </span>
      </StatCell>
    </StatRail>
  );
}

function AutopilotBanners({ monitorError, prepared, warnings = [] }) {
  const hasContent = Boolean(monitorError || prepared || warnings.length > 0);
  if (!hasContent) return null;

  return (
    <div className="space-y-1.5 border-t border-stone-200/80 px-4 py-2.5 dark:border-white/[0.07]">
      {monitorError && (
        <div role="alert">
          <Notice tone="fault" title={monitorError} />
        </div>
      )}
      {prepared && (
        <p role="status" className={cn(MUTED, 'text-[11px] font-medium')}>
          {prepared.created || 0} prepared · {prepared.drafted || 0} AI drafts ·{' '}
          {prepared.suppressed || 0} held back. Nothing sent.
        </p>
      )}
      {warnings.map((warning, i) => (
        <p
          key={i}
          className={cn(MICRO, 'text-[rgb(var(--signal-warn))] normal-case tracking-normal')}
        >
          {warning}
        </p>
      ))}
    </div>
  );
}

function AutopilotHeaderControls({
  busy,
  error,
  state,
  actionsEnabled,
  recommendationsCount,
  actionQueueRef,
  refresh,
  act,
}) {
  const config = getPrepareButtonConfig(actionsEnabled, recommendationsCount);
  const Icon = config.icon;
  const isBusy = Boolean(busy);
  const isPrepareDisabled = isBusy || Boolean(error) || !state;

  const onPrepare = () => {
    if (!actionsEnabled) {
      if (actionQueueRef.current) {
        actionQueueRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    act('prepare', () => MarketingService.prepareCopilotActions(), 'prepare');
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <a
        href="/dashboard/notification-preview"
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-xs font-bold text-stone-700 transition-all duration-150 ease-smooth-out hover:bg-stone-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:border-white/15 dark:bg-[#131315] dark:text-stone-200 dark:hover:bg-white/5 dark:focus-visible:ring-offset-[#131315]"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Learner preview
      </a>
      <AdminButton variant="ghost" onClick={refresh} disabled={isBusy} aria-label="Refresh Copilot">
        <RefreshCcw className="h-3.5 w-3.5" />
        Refresh
      </AdminButton>
      <AdminButton disabled={isPrepareDisabled} loading={busy === 'prepare'} onClick={onPrepare}>
        <Icon className="h-4 w-4" />
        {config.label}
      </AdminButton>
    </div>
  );
}

function AutopilotHeaderStats({ workspace }) {
  const {
    state,
    error,
    busy,
    policies,
    refresh,
    act,
    monitor,
    monitorInfo,
    actionsEnabled,
    queue,
    recommendations,
    enabledPolicies,
    actionQueueRef,
    prepared,
  } = workspace;

  const warnings = getAutopilotWarnings(prepared, monitor);

  return (
    <div className={cn(PANEL, 'overflow-hidden')}>
      <div className="flex flex-col justify-between gap-2.5 border-b border-stone-200/80 px-4 py-3 sm:flex-row sm:items-start sm:gap-3 dark:border-white/[0.07]">
        <div className="min-w-0 flex-1">
          <SectionLabel accent="accent">Subscription Copilot</SectionLabel>
          <p className={cn(TITLE, 'mt-1')}>Review queue</p>
        </div>
        <AutopilotHeaderControls
          busy={busy}
          error={error}
          state={state}
          actionsEnabled={actionsEnabled}
          recommendationsCount={recommendations.length}
          actionQueueRef={actionQueueRef}
          refresh={refresh}
          act={act}
        />
      </div>
      <AutopilotStatsBar
        queueLength={queue.length}
        recommendationsLength={recommendations.length}
        enabledPolicies={enabledPolicies}
        totalPolicies={policies.length}
        monitorCreatedAt={monitor?.created_at}
        monitorInfo={monitorInfo}
      />
      <AutopilotBanners
        monitorError={monitorInfo.monitorError}
        prepared={prepared}
        warnings={warnings}
      />
    </div>
  );
}

function AutopilotStatusNotices({ workspace }) {
  const { state, error } = workspace;
  return (
    <>
      {state?.setupPending && (
        <Notice
          tone="warn"
          icon={ShieldCheck}
          className="-mt-2"
          title="Copilot actions need the worker update."
        >
          Insights below are still available.
        </Notice>
      )}
      {error && (
        <div
          role="alert"
          className={cn(PANEL, 'p-4 text-xs font-bold text-[rgb(var(--signal-fault))]')}
        >
          {error}
        </div>
      )}
    </>
  );
}

function AutopilotPagination({ offset, total, busy, onPrevious, onNext }) {
  if (total <= 20) return null;
  const currentEnd = Math.min(offset + 20, total);
  const isPreviousDisabled = offset === 0 || Boolean(busy);
  const isNextDisabled = offset + 20 >= total || Boolean(busy);

  return (
    <div className={cn(PANEL, 'flex items-center justify-between gap-2 px-3 py-2')}>
      <AdminButton size="sm" variant="outline" disabled={isPreviousDisabled} onClick={onPrevious}>
        Previous
      </AdminButton>
      <span className={cn(NUM, MICRO, MUTED)}>
        {offset + 1}–{currentEnd} of {total}
      </span>
      <AdminButton size="sm" variant="outline" disabled={isNextDisabled} onClick={onNext}>
        Next
      </AdminButton>
    </div>
  );
}

function AutopilotActionQueue({ workspace, onNavigate }) {
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const {
    state,
    busy,
    actionsEnabled,
    act,
    recommendations,
    actionCount,
    offset,
    setOffset,
    actionQueueRef,
  } = workspace;
  const queue = state?.queue || [];
  const visibleQueue = showAllMessages ? queue : queue.slice(0, 3);
  const visibleRecommendations = showAllInsights ? recommendations : recommendations.slice(0, 3);
  const hiddenMessageCount = Math.max(0, queue.length - 3);
  const hiddenRecommendationCount = Math.max(0, recommendations.length - 3);

  return (
    <div ref={actionQueueRef} className="min-w-0 scroll-mt-4 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2 dark:border-white/[0.07]">
        <SectionLabel accent={actionCount ? 'warn' : 'ok'}>Priority actions</SectionLabel>
        <span className={cn(MICRO, MUTED)}>
          {actionCount} action{actionCount === 1 ? '' : 's'} ready
        </span>
      </div>
      {actionCount > 0 ? (
        <>
          <div className="grid grid-cols-1 items-start gap-2.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {visibleQueue.map((item) => (
                <m.div
                  key={item.id}
                  layout="position"
                  variants={CARD_PRESENCE_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ReviewCard item={item} busy={busy} actionsEnabled={actionsEnabled} act={act} />
                </m.div>
              ))}
              {visibleRecommendations.map((item) => (
                <m.div
                  key={item.id}
                  layout="position"
                  variants={CARD_PRESENCE_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <RecommendationCard item={item} busy={busy} act={act} onNavigate={onNavigate} />
                </m.div>
              ))}
            </AnimatePresence>
          </div>
          {(hiddenMessageCount > 0 || hiddenRecommendationCount > 0) && (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {hiddenMessageCount > 0 && (
                <AdminButton
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAllMessages((value) => !value)}
                  aria-expanded={showAllMessages}
                >
                  {showAllMessages
                    ? 'Show fewer messages'
                    : `Show ${hiddenMessageCount} more messages`}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-150 ease-out',
                      showAllMessages && 'rotate-180'
                    )}
                  />
                </AdminButton>
              )}
              {hiddenRecommendationCount > 0 && (
                <AdminButton
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAllInsights((value) => !value)}
                  aria-expanded={showAllInsights}
                >
                  {showAllInsights
                    ? 'Show fewer insights'
                    : `Show ${hiddenRecommendationCount} more insights`}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-150 ease-out',
                      showAllInsights && 'rotate-180'
                    )}
                  />
                </AdminButton>
              )}
            </div>
          )}
        </>
      ) : (
        <div className={PANEL}>
          <Empty icon={CheckCircle2} title="You are caught up">
            No learner message or admin action needs a decision right now.
          </Empty>
        </div>
      )}
      <AutopilotPagination
        offset={offset}
        total={state?.total || 0}
        busy={busy}
        onPrevious={() => setOffset(Math.max(0, offset - 20))}
        onNext={() => setOffset(offset + 20)}
      />
    </div>
  );
}

function AutopilotResultsMonitor({ history = [] }) {
  return (
    <aside className={cn(PANEL, 'min-w-0 overflow-hidden')}>
      <PanelHeader
        label="Results monitor"
        title="What happened after approved learner messages"
        description="A payment after a message is an observed result, not proof the message caused it."
        accent="accent"
      >
        <Activity className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
      </PanelHeader>
      {history.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5 p-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {history.map((item) => (
            <OutcomeRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="p-3.5">
          <div className={cn(WELL, 'flex items-center gap-2 rounded-lg p-3')}>
            <CheckCircle2 className="h-4 w-4 text-stone-400" />
            <p className={cn(MUTED, 'text-[11px] font-medium')}>
              Results appear after an approved message is delivered.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

export default function AutopilotPanel({ autopilot, onRefresh, onNavigate }) {
  const workspace = useAutopilotWorkspace({ autopilot, onRefresh });
  const { state, error, busy, previewPolicy, setPreviewPolicy, act } = workspace;

  return (
    <section aria-label="Subscription Copilot" className="space-y-4">
      <AutopilotHeaderStats workspace={workspace} />
      <AutopilotStatusNotices workspace={workspace} />

      {!state && !error && (
        <div
          role="status"
          className={cn(PANEL, 'h-48 animate-pulse bg-stone-100 p-4 text-xs dark:bg-white/[0.04]')}
        >
          Loading review queue…
        </div>
      )}

      {state && (
        <div className="space-y-4">
          <AutopilotActionQueue workspace={workspace} onNavigate={onNavigate} />
          <AutopilotResultsMonitor history={state.history} />
        </div>
      )}

      <AutopilotAutomations
        policies={autopilot?.policies || []}
        labels={LABELS}
        monitor={state?.monitor}
        busy={busy}
        error={error}
        act={act}
        onPreviewPolicy={setPreviewPolicy}
      />

      <AutopilotMessagePreviewDialog
        policy={previewPolicy}
        open={Boolean(previewPolicy)}
        onOpenChange={(open) => !open && setPreviewPolicy(null)}
      />
    </section>
  );
}
