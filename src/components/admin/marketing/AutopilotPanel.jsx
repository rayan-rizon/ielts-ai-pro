import { useMemo, useState } from 'react';
import {
  Activity,
  BrainCircuit,
  Check,
  FlaskConical,
  Mail,
  MessageSquare,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import AutopilotMessagePreviewDialog from './dialogs/AutopilotMessagePreviewDialog';
import { channelLabel, deliveryPathLabel, deliveryStrategyFor } from './autopilotDeliveryStrategy';
import { familiarRecommendationText, familiarRecommendationTitle } from './recommendationLanguage';
import {
  AdminButton,
  BODY,
  Empty,
  Kpi,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelHeader,
  Pill,
  TILE,
  WELL,
} from '@/components/admin/ui/primitives';

const PLAYBOOK_COPY = {
  first_practice: {
    short: 'First practice',
    title: 'Choose a first activity',
    detail: 'Offers one useful place to start after onboarding.',
  },
  next_practice: {
    short: 'Next practice',
    title: 'Suggest a next activity',
    detail: 'Builds on a learner’s first saved result.',
  },
  subscriber_feature_help: {
    short: 'Plan features',
    title: 'Help learners use their plan',
    detail: 'Points paid learners to a feature they already have.',
  },
  quota_upgrade: {
    short: 'More AI feedback',
    title: 'Explain AI feedback options',
    detail: 'Shows plan options only after a verified free limit.',
  },
  re_engagement: {
    short: 'Return to practice',
    title: 'Make returning easy',
    detail: 'Offers one manageable next step after a break.',
  },
  cancellation_support: {
    short: 'Plan ending',
    title: 'Support a plan ending',
    detail: 'Shows progress and plan settings before access changes.',
  },
  referral_bonus_reminder: {
    short: 'Referral credit',
    title: 'Remind about referral credit',
    detail: 'Shows a verified credit before it expires.',
  },
  score_plateau: {
    short: 'Improve a steady score',
    title: 'Focus on one weak area',
    detail: 'Suggests focused practice after similar results below a learner’s goal.',
  },
  incomplete_test: {
    short: 'Saved test',
    title: 'Continue a saved test',
    detail: 'Brings learners back only when their saved progress can be resumed.',
  },
  exam_countdown: {
    short: 'Exam plan',
    title: 'Prepare for an upcoming exam',
    detail: 'Updates the study plan at 30, 15, and 7 days before a confirmed exam.',
  },
  checkout_recovery: {
    short: 'Upgrade help',
    title: 'Help finish an upgrade',
    detail: 'Offers payment help when a checkout is still incomplete.',
  },
};

const RECOMMENDATION_LABELS = {
  severity: { urgent: 'Urgent', attention: 'Check', opportunity: 'Idea' },
  category: {
    messaging: 'Messages',
    journey: 'Automation',
    product: 'Product',
    payment: 'Payment',
    channel: 'Channel',
  },
};

const channelIcon = { email: Mail, in_app: MessageSquare, banner: Activity, push: Sparkles };
const statusTone = (status) => {
  if (['sent', 'approved', 'implemented', 'resolved'].includes(status)) return 'ok';
  if (['failed', 'urgent'].includes(status)) return 'fault';
  if (['needs_approval', 'attention', 'new'].includes(status)) return 'warn';
  return 'neutral';
};

function Evidence({ evidence = [] }) {
  if (!evidence.length) return <span className={cn(MICRO, MUTED)}>No evidence attached</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {evidence.slice(0, 4).map((item, index) => (
        <span
          key={`${item.metric}-${index}`}
          className={cn(
            WELL,
            'rounded px-2 py-1 text-[10px] font-semibold text-stone-600 dark:text-stone-300'
          )}
        >
          {String(item.metric || 'signal').replaceAll('_', ' ')} ·{' '}
          {Array.isArray(item.value) ? item.value.join(', ') : String(item.value ?? 'observed')}
        </span>
      ))}
    </div>
  );
}

export default function AutopilotPanel({ autopilot, onRefresh }) {
  const [busy, setBusy] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [previewPolicy, setPreviewPolicy] = useState(null);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const policies = autopilot?.policies || [];
  const recommendations = autopilot?.recommendations || [];
  const interventions = autopilot?.interventions || [];
  const counts = autopilot?.counts || {};

  const enabled = policies.filter((policy) => policy.enabled).length;
  const auto = policies.filter(
    (policy) => policy.enabled && policy.mode === 'guardrailed_auto'
  ).length;
  const awaiting = interventions.filter((item) => item.status === 'needs_approval');

  const execute = async (key, action, success) => {
    setBusy(key);
    try {
      const result = await action();
      toast.success(typeof success === 'function' ? success(result) : success);
      await onRefresh();
    } catch (error) {
      toast.error(error.message || 'Autopilot action failed');
    } finally {
      setBusy('');
    }
  };

  const runPreview = async () => {
    setBusy('preview');
    try {
      const result = await MarketingService.runAutopilot({ dryRun: true });
      setPreviewResult(result);
      toast.success('Preview refreshed — nothing was sent');
    } catch (error) {
      toast.error(error.message || 'Could not prepare the preview');
    } finally {
      setBusy('');
    }
  };

  const channelTotals = useMemo(
    () =>
      (autopilot?.channels || []).map((row) => ({
        ...row,
        rate: Number(row.deliveries)
          ? (100 * Number(row.clicked || 0)) / Number(row.deliveries)
          : 0,
      })),
    [autopilot?.channels]
  );

  return (
    <section className="mb-4 space-y-4" aria-labelledby="retention-autopilot-title">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-stone-200/80 pb-2 dark:border-white/[0.07]">
        <div>
          <p className={cn(MICRO, MUTED)}>Personalized retention</p>
          <h2
            id="retention-autopilot-title"
            className="mt-1 text-sm font-extrabold text-stone-900 dark:text-stone-50"
          >
            Learner Autopilot
          </h2>
        </div>
        <div className="max-w-xl text-right">
          <Pill tone="accent">Primary coordinator</Pill>
          <p className={cn(BODY, 'mt-1 text-[10px]')}>
            Chooses one useful route and keeps existing journeys from doubling up.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi
          label="Active"
          value={`${enabled}/${policies.length}`}
          sub={`${auto} auto-send`}
          className="py-2"
        />
        <Kpi
          label="To review"
          value={Number(counts.prepared || 0).toLocaleString()}
          sub="Ready for approval"
          className="py-2"
        />
        <Kpi
          label="Sent · 30d"
          value={Number(counts.sent || 0).toLocaleString()}
          sub="One route per learner"
          className="py-2"
        />
        <Kpi
          label="Held back"
          value={Number(counts.suppressed || 0).toLocaleString()}
          sub="Limits or changed context"
          className="py-2"
        />
      </div>

      <div className={cn(PANEL, 'overflow-hidden')}>
        <PanelHeader
          label="Automation controls"
          title="Review delivery and learner help"
          accent={enabled ? 'ok' : 'idle'}
        >
          <AdminButton variant="outline" loading={busy === 'preview'} onClick={runPreview}>
            <FlaskConical className="h-3.5 w-3.5" /> Preview
          </AdminButton>
          <AdminButton
            variant="outline"
            loading={busy === 'analyze'}
            onClick={() =>
              execute(
                'analyze',
                () => MarketingService.analyzeAutopilot(),
                'Analysis and admin recommendations refreshed'
              )
            }
          >
            <BrainCircuit className="h-3.5 w-3.5" /> Analyze
          </AdminButton>
          <AdminButton
            loading={busy === 'reconcile'}
            onClick={() =>
              execute(
                'reconcile',
                () => MarketingService.runAutopilot(),
                (result) => `${result.created || 0} interventions prepared`
              )
            }
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Reconcile now
          </AdminButton>
        </PanelHeader>
        {previewResult && (
          <div className="border-b border-stone-200/80 bg-[#faf9ff] p-3.5 dark:border-white/[0.07] dark:bg-[#100f15]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={cn(MICRO, MUTED)}>Preview results</p>
                <p className="mt-1 text-[12px] font-extrabold text-stone-900 dark:text-stone-50">
                  {Number(previewResult.matched || 0).toLocaleString()} learners have one next
                  action
                </p>
                <p className={cn(BODY, 'mt-1')}>
                  No messages were sent. The preview contains counts only, never learner names.
                </p>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className={cn(NUM, 'text-sm font-extrabold')}>
                    {Number(previewResult.learners_scanned || 0).toLocaleString()}
                  </p>
                  <p className={cn(MICRO, MUTED)}>checked</p>
                </div>
                <div>
                  <p className={cn(NUM, 'text-sm font-extrabold')}>
                    {Number(previewResult.suppressed || 0).toLocaleString()}
                  </p>
                  <p className={cn(MICRO, MUTED)}>held back</p>
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-1.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(previewResult.automation_preview || []).map((item) => (
                <div
                  key={item.playbook_key}
                  className={cn(
                    TILE,
                    'flex items-center justify-between gap-3 rounded-md px-2.5 py-2'
                  )}
                >
                  <span className="truncate text-[11px] font-bold text-stone-700 dark:text-stone-200">
                    {PLAYBOOK_COPY[item.playbook_key]?.short || item.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {!item.enabled && <Pill>Paused</Pill>}
                    {Object.entries(item.selected_channels || {}).map(([channel, count]) => (
                      <Pill key={channel}>
                        {channelLabel(channel)} · {count}
                      </Pill>
                    ))}
                    <span className={cn(NUM, 'text-[11px] font-extrabold')}>
                      {item.matched || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {!!Object.keys(previewResult.suppressed_by_reason || {}).length && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(previewResult.suppressed_by_reason).map(([reason, count]) => (
                  <Pill key={reason}>
                    {reason.replaceAll('_', ' ')} · {count}
                  </Pill>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="grid gap-px bg-stone-200/80 dark:bg-white/[0.07] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {policies.map((policy) => {
            const copy = PLAYBOOK_COPY[policy.playbook_key] || {};
            const path = deliveryPathLabel(policy);
            const strategy = deliveryStrategyFor(policy);
            return (
              <div
                key={policy.id}
                className={cn(
                  'group relative flex flex-col justify-between bg-white p-3 transition-colors duration-150 dark:bg-[#131315]',
                  !policy.enabled && 'bg-stone-50/50 dark:bg-[#111113]'
                )}
              >
                {/* Upper content zone */}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className={cn(MICRO, MUTED, 'truncate')}>
                          {copy.short || policy.objective}
                        </p>
                        {!policy.enabled && (
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-stone-600 dark:bg-white/[0.06] dark:text-stone-300">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[12px] font-extrabold tracking-tight text-stone-900 line-clamp-1 dark:text-stone-50">
                        {copy.title || policy.name}
                      </p>
                    </div>
                    <Switch
                      checked={policy.enabled}
                      disabled={busy === policy.id}
                      aria-label={`Enable ${copy.title || policy.name}`}
                      onCheckedChange={(checked) =>
                        execute(
                          policy.id,
                          () =>
                            MarketingService.updateAutopilotPolicy(policy.id, { enabled: checked }),
                          checked
                            ? `${copy.title || policy.name} enabled`
                            : `${copy.title || policy.name} paused`
                        )
                      }
                      className="shrink-0"
                    />
                  </div>

                  <p className={cn(BODY, 'mt-1.5 line-clamp-2 text-[10px] leading-snug')}>
                    {copy.detail}
                  </p>

                  <div className={cn(WELL, 'mt-2 rounded-md px-2 py-1.5')}>
                    <div className="flex items-center gap-1.5 text-[9px] font-semibold text-stone-600 dark:text-stone-300">
                      <MessageSquare className="h-3 w-3 shrink-0 text-[#5a63df]" />
                      <span className="truncate">Active: {path.active}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-semibold text-stone-500 dark:text-stone-400">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">Away: {path.away}</span>
                    </div>
                    {strategy.remaining.length > 0 && (
                      <p className={cn(MICRO, MUTED, 'mt-1 text-[8px]')}>
                        Backup: {strategy.remaining.map(channelLabel).join(' + ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lower pinned zone */}
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-stone-200/80 pt-2 dark:border-white/[0.07]">
                  <button
                    type="button"
                    disabled={!policy.enabled || busy === policy.id}
                    aria-label={`Change ${copy.title || policy.name} mode; currently ${policy.mode === 'review' ? 'review first' : 'auto send'}`}
                    onClick={() =>
                      execute(
                        policy.id,
                        () =>
                          MarketingService.updateAutopilotPolicy(policy.id, {
                            mode: policy.mode === 'review' ? 'guardrailed_auto' : 'review',
                          }),
                        'Automation mode updated'
                      )
                    }
                    className={cn(
                      'group/mode inline-flex items-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                      policy.enabled
                        ? 'cursor-pointer hover:brightness-95 active:scale-95 dark:hover:brightness-110'
                        : 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Pill tone={policy.mode === 'guardrailed_auto' ? 'ok' : 'warn'}>
                      {policy.mode === 'review' ? 'Review first' : 'Auto send'}
                    </Pill>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewPolicy(policy)}
                    className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] font-bold text-stone-500 transition-colors hover:bg-[#5a63df]/6 hover:text-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-stone-400"
                  >
                    <Play className="h-3 w-3 fill-current opacity-70" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 border-t border-stone-200/80 bg-stone-50/60 px-3 py-2 dark:border-white/[0.07] dark:bg-white/[0.025]">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]" />
          <p className="text-[10px] font-medium text-stone-600 dark:text-stone-300">
            One helpful message at a time. Payment checks, quiet hours, snoozes, and contact limits
            are checked again before delivery.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div id="autopilot-recommendations" className={cn(PANEL, 'overflow-hidden')}>
          <PanelHeader
            label="AI recommendations"
            title="Clear next steps"
            accent={recommendations.length ? 'warn' : 'ok'}
          >
            <div className="flex items-center gap-2">
              {recommendations.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllRecommendations((shown) => !shown)}
                  className="text-[10px] font-bold text-[#5a63df] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
                >
                  {showAllRecommendations ? 'Show less' : `Show all ${recommendations.length}`}
                </button>
              )}
              <Pill tone={recommendations.length ? 'warn' : 'ok'}>
                {recommendations.length || 'clear'}
              </Pill>
            </div>
          </PanelHeader>
          {recommendations.length ? (
            <div className="divide-y divide-stone-200/80 dark:divide-white/[0.07]">
              {recommendations.slice(0, showAllRecommendations ? 5 : 3).map((recommendation) => (
                <div
                  key={recommendation.id}
                  id={`recommendation-${recommendation.id}`}
                  className="scroll-mt-4 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Pill tone={statusTone(recommendation.severity)}>
                          {RECOMMENDATION_LABELS.severity[recommendation.severity] || 'Check'}
                        </Pill>
                        <span className={cn(MICRO, MUTED)}>
                          {RECOMMENDATION_LABELS.category[recommendation.category] || 'Autopilot'}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[12px] font-extrabold text-stone-900 dark:text-stone-50">
                        {familiarRecommendationTitle(recommendation.title)}
                      </p>
                      <p className={cn(BODY, 'mt-1 text-[10px] leading-snug')}>
                        {familiarRecommendationText(recommendation.summary)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        NUM,
                        'shrink-0 text-[11px] font-bold text-stone-700 dark:text-stone-200'
                      )}
                    >
                      {Number(recommendation.sample_size || 0)}{' '}
                      {Number(recommendation.sample_size || 0) === 1 ? 'learner' : 'learners'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        WELL,
                        'min-w-0 flex-1 rounded-md px-2 py-1 text-[10px] font-semibold text-stone-700 dark:text-stone-200'
                      )}
                    >
                      <span className="text-stone-500 dark:text-stone-400">Next step: </span>
                      {familiarRecommendationText(recommendation.proposed_action)}
                    </span>
                    <AdminButton
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        execute(
                          `rec-${recommendation.id}`,
                          () =>
                            MarketingService.updateRecommendation(recommendation.id, 'accepted'),
                          'Recommendation marked as reviewed'
                        )
                      }
                    >
                      <Check className="h-3 w-3" /> Mark reviewed
                    </AdminButton>
                    <AdminButton
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        execute(
                          `rec-${recommendation.id}`,
                          () =>
                            MarketingService.updateRecommendation(recommendation.id, 'dismissed'),
                          'Recommendation hidden'
                        )
                      }
                    >
                      Hide
                    </AdminButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={ShieldCheck} title="No active recommendations">
              Run an analysis after enough delivery and outcome evidence exists.
            </Empty>
          )}
        </div>

        <div className="space-y-4">
          <div className={cn(PANEL, 'overflow-hidden')}>
            <PanelHeader label="Channels" title="Delivery and response" accent="accent" />
            {channelTotals.length ? (
              channelTotals.map((row) => {
                const Icon = channelIcon[row.channel] || Activity;
                return (
                  <div
                    key={row.channel}
                    className="grid grid-cols-[1fr_repeat(4,auto)] items-center gap-3 border-t border-stone-200/80 px-3.5 py-3 dark:border-white/[0.07]"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="text-[11px] font-bold capitalize">
                        {row.channel.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={cn(NUM, 'text-[11px] font-bold')}>{Number(row.exposed || 0)}</p>
                      <p className={cn(MICRO, MUTED)}>seen</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(NUM, 'text-[11px] font-bold')}>{row.rate.toFixed(1)}%</p>
                      <p className={cn(MICRO, MUTED)}>click</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(NUM, 'text-[11px] font-bold')}>
                        {Number(row.negative || 0)}
                      </p>
                      <p className={cn(MICRO, MUTED)}>negative</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(NUM, 'text-[11px] font-bold')}>{Number(row.failed || 0)}</p>
                      <p className={cn(MICRO, MUTED)}>failed</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <Empty>Channel evidence appears after delivery.</Empty>
            )}
          </div>

          <div className={cn(PANEL, 'overflow-hidden')}>
            <PanelHeader
              label="Prepared interventions"
              title="Review queue"
              accent={awaiting.length ? 'warn' : 'idle'}
            >
              <Pill tone={awaiting.length ? 'warn' : 'neutral'}>{awaiting.length}</Pill>
            </PanelHeader>
            {awaiting.length ? (
              awaiting.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="border-t border-stone-200/80 p-3.5 dark:border-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-extrabold text-stone-900 dark:text-stone-50">
                        {PLAYBOOK_COPY[item.playbook_key]?.short || item.playbook_key}
                      </p>
                      <p className={cn(BODY, 'mt-1')}>{item.rationale}</p>
                    </div>
                    <Pill tone="warn">review</Pill>
                  </div>
                  <div className="mt-2">
                    <Evidence evidence={item.evidence} />
                  </div>
                  <div className={cn(WELL, 'mt-3 rounded-lg p-2.5')}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(MICRO, MUTED)}>Learner-facing copy</p>
                      {item.model_metadata?.generated_at && <Pill tone="accent">AI draft</Pill>}
                    </div>
                    <p className="mt-1 text-[11px] font-extrabold text-stone-800 dark:text-stone-100">
                      {item.content?.title}
                    </p>
                    <p className={cn(BODY, 'mt-1')}>{item.content?.message}</p>
                  </div>
                  <AdminButton
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    loading={busy === `copy-${item.id}`}
                    onClick={() =>
                      execute(
                        `copy-${item.id}`,
                        () => MarketingService.generateInterventionCopy(item.id),
                        'AI copy draft refreshed for review'
                      )
                    }
                  >
                    <Sparkles className="h-3 w-3" /> Improve copy
                  </AdminButton>
                  <AdminButton
                    className="ml-2 mt-3"
                    size="sm"
                    loading={busy === item.id}
                    onClick={() =>
                      execute(
                        item.id,
                        () => MarketingService.approveIntervention(item.id),
                        'Intervention approved and processed'
                      )
                    }
                  >
                    <Play className="h-3 w-3" /> Approve
                  </AdminButton>
                </div>
              ))
            ) : (
              <Empty icon={ShieldCheck} title="Nothing waiting for review">
                Review-first automations place eligible learner suggestions here.
              </Empty>
            )}
          </div>
        </div>
      </div>

      <AutopilotMessagePreviewDialog
        policy={previewPolicy}
        open={Boolean(previewPolicy)}
        onOpenChange={(open) => !open && setPreviewPolicy(null)}
      />
    </section>
  );
}
