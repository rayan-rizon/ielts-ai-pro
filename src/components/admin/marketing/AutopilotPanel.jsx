import { useMemo, useState } from 'react';
import {
  Activity,
  BrainCircuit,
  Check,
  CirclePause,
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
    short: 'Getting started',
    detail: 'Helps a learner choose a useful first activity after onboarding.',
  },
  next_practice: {
    short: 'Next step',
    detail: 'Uses the first saved result to suggest one relevant follow-up activity.',
  },
  subscriber_feature_help: {
    short: 'Plan guidance',
    detail: 'Helps paid learners find useful features already included in their plan.',
  },
  quota_upgrade: {
    short: 'AI feedback access',
    detail: 'Explains plan options only after a free learner repeatedly reaches a verified limit.',
  },
  re_engagement: {
    short: 'Return support',
    detail: 'Offers one manageable next step to a learner with established practice history.',
  },
  cancellation_support: {
    short: 'Plan ending',
    detail: 'Shows progress and plan settings before a scheduled subscription end.',
  },
  referral_bonus_reminder: {
    short: 'Bonus reminder',
    detail: 'Shows verified unused referral credits shortly before they expire.',
  },
  score_plateau: {
    short: 'Steady score support',
    detail:
      'Suggests focused practice when comparable results stay steady below the learner’s goal.',
  },
  incomplete_test: {
    short: 'Saved test',
    detail: 'Reminds a learner when meaningful test progress is safely saved.',
  },
  exam_countdown: {
    short: 'Exam plan',
    detail: 'Adapts the study plan at 30, 15, and 7 days before a confirmed exam.',
  },
  checkout_recovery: {
    short: 'Checkout help',
    detail: 'Offers payment help when a started checkout remains incomplete.',
  },
};

const channelIcon = { email: Mail, in_app: MessageSquare, banner: Activity, push: Sparkles };
const channelLabel = (channel) =>
  ({ in_app: 'In app', banner: 'Dashboard banner', email: 'Email', push: 'Opt-in push' })[
    channel
  ] || channel;
const policyChannels = (policy) => {
  const allowed = policy.allowed_channels || [];
  const configured = Array.isArray(policy.config?.channel_priority)
    ? policy.config.channel_priority.filter((channel) => allowed.includes(channel))
    : [];
  return [...configured, ...allowed.filter((channel) => !configured.includes(channel))];
};
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
            AI Autopilot
          </h2>
        </div>
        <div className="max-w-xl text-right">
          <Pill tone="accent">Primary coordinator</Pill>
          <p className={cn(BODY, 'mt-1 text-[10px]')}>
            Coordinates learner help, existing journeys, contact limits, and channel outcomes.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi
          label="Automations active"
          value={`${enabled}/${policies.length}`}
          sub={`${auto} guardrailed auto`}
        />
        <Kpi
          label="Needs review"
          value={Number(counts.prepared || 0).toLocaleString()}
          sub="Prepared from current evidence"
        />
        <Kpi
          label="Sent · 30 days"
          value={Number(counts.sent || 0).toLocaleString()}
          sub="Across coordinated channels"
        />
        <Kpi
          label="Stayed quiet"
          value={Number(counts.suppressed || 0).toLocaleString()}
          sub="Expired, cancelled, or suppressed"
        />
      </div>

      <div className={cn(PANEL, 'overflow-hidden')}>
        <PanelHeader
          label="Control room"
          title="Observe, help, measure"
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
            return (
              <div
                key={policy.id}
                className={cn(
                  'group relative flex flex-col justify-between bg-white p-4 transition-colors duration-150 dark:bg-[#131315]',
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
                      <p className="mt-1 text-[13px] font-extrabold tracking-tight text-stone-900 line-clamp-1 dark:text-stone-50">
                        {policy.name}
                      </p>
                    </div>
                    <Switch
                      checked={policy.enabled}
                      disabled={busy === policy.id}
                      aria-label={`Enable ${policy.name}`}
                      onCheckedChange={(checked) =>
                        execute(
                          policy.id,
                          () =>
                            MarketingService.updateAutopilotPolicy(policy.id, { enabled: checked }),
                          checked ? `${policy.name} enabled` : `${policy.name} paused`
                        )
                      }
                      className="shrink-0"
                    />
                  </div>

                  <p
                    className={cn(
                      BODY,
                      'mt-2 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300'
                    )}
                  >
                    {copy.detail}
                  </p>

                  <div className="mt-auto pt-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-2.5 w-2.5 shrink-0 text-indigo-500/80 dark:text-indigo-400/80" />
                      <span
                        className={cn(
                          MICRO,
                          'text-[9px] font-bold text-indigo-600 dark:text-indigo-400'
                        )}
                      >
                        One channel per learner
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {policyChannels(policy).map((channel, index) => {
                        const Icon = channelIcon[channel];
                        return (
                          <Pill
                            key={channel}
                            tone={index === 0 ? 'accent' : 'neutral'}
                            className="inline-flex items-center gap-1 text-[8.5px] font-medium py-0.5"
                          >
                            {Icon && <Icon className="h-2.5 w-2.5 shrink-0 opacity-75" />}
                            <span>
                              {index === 0 ? 'Preferred' : 'Fallback'} · {channelLabel(channel)}
                            </span>
                          </Pill>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Lower pinned zone */}
                <div className="mt-4 border-t border-stone-200/80 pt-3 dark:border-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <span className={cn(MICRO, MUTED)}>Mode</span>
                    <button
                      type="button"
                      disabled={!policy.enabled || busy === policy.id}
                      title={
                        policy.enabled
                          ? 'Click to toggle between Auto-Guarded and Review-First'
                          : 'Enable automation to change mode'
                      }
                      aria-label={`Toggle mode: currently ${policy.mode === 'review' ? 'review first' : 'auto guarded'}`}
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
                        'group/mode inline-flex items-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500',
                        policy.enabled
                          ? 'cursor-pointer hover:brightness-95 active:scale-95 dark:hover:brightness-110'
                          : 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <Pill tone={policy.mode === 'guardrailed_auto' ? 'ok' : 'warn'}>
                        {policy.mode === 'review' ? 'review first' : 'auto · guarded'}
                      </Pill>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewPolicy(policy)}
                    className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-stone-200/90 bg-stone-50/70 py-1.5 px-2.5 text-[10.5px] font-bold text-stone-700 transition-all hover:border-[#5a63df]/30 hover:bg-[#5a63df]/5 hover:text-[#5a63df] active:scale-[0.99] dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-stone-300 dark:hover:border-[#5a63df]/40 dark:hover:bg-[#5a63df]/10 dark:hover:text-stone-100"
                  >
                    <Play className="h-3 w-3 fill-current opacity-70" />
                    <span>Preview learner message</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid gap-px border-t border-stone-200/80 bg-stone-200/80 dark:border-white/[0.07] dark:bg-white/[0.07] sm:grid-cols-2">
          <div className="flex items-start gap-3 bg-white p-3.5 dark:bg-[#131315]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--signal-ok))]" />
            <div>
              <p className={cn(MICRO, MUTED)}>Always-on protection</p>
              <p className="mt-0.5 text-[11px] font-extrabold text-stone-900 dark:text-stone-50">
                Broken-flow protection
              </p>
              <p className={cn(BODY, 'mt-1 text-[10.5px]')}>
                Holds back checkout promotion while payment is pending and surfaces delivery
                failures for admin review.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white p-3.5 dark:bg-[#131315]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--signal-ok))]" />
            <div>
              <p className={cn(MICRO, MUTED)}>Always-on protection</p>
              <p className="mt-0.5 text-[11px] font-extrabold text-stone-900 dark:text-stone-50">
                Contact-pressure protection
              </p>
              <p className={cn(BODY, 'mt-1 text-[10.5px]')}>
                Coordinates limits, snoozes, dismissals, and negative feedback across every channel.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div id="autopilot-recommendations" className={cn(PANEL, 'overflow-hidden')}>
          <PanelHeader
            label="Admin recommendations"
            title="What deserves attention"
            accent={recommendations.length ? 'warn' : 'ok'}
          >
            <Pill tone={recommendations.length ? 'warn' : 'ok'}>
              {recommendations.length || 'clear'}
            </Pill>
          </PanelHeader>
          {recommendations.length ? (
            <div className="divide-y divide-stone-200/80 dark:divide-white/[0.07]">
              {recommendations.slice(0, 8).map((recommendation) => (
                <div key={recommendation.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Pill tone={statusTone(recommendation.severity)}>
                          {recommendation.severity}
                        </Pill>
                        <span className={cn(MICRO, MUTED)}>{recommendation.category}</span>
                      </div>
                      <p className="mt-2 text-[12px] font-extrabold text-stone-900 dark:text-stone-50">
                        {recommendation.title}
                      </p>
                      <p className={cn(BODY, 'mt-1')}>{recommendation.summary}</p>
                    </div>
                    <span
                      className={cn(
                        NUM,
                        'shrink-0 text-[11px] font-bold text-stone-700 dark:text-stone-200'
                      )}
                    >
                      n={Number(recommendation.sample_size || 0)}
                    </span>
                  </div>
                  <div className={cn(WELL, 'mt-3 rounded-lg p-2.5')}>
                    <p className={cn(MICRO, MUTED)}>Suggested step</p>
                    <p className="mt-1 text-[11px] font-semibold text-stone-700 dark:text-stone-200">
                      {recommendation.proposed_action}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <AdminButton
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        execute(
                          `rec-${recommendation.id}`,
                          () =>
                            MarketingService.updateRecommendation(recommendation.id, 'accepted'),
                          'Recommendation accepted'
                        )
                      }
                    >
                      <Check className="h-3 w-3" /> Accept
                    </AdminButton>
                    <AdminButton
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        execute(
                          `rec-${recommendation.id}`,
                          () =>
                            MarketingService.updateRecommendation(recommendation.id, 'dismissed'),
                          'Recommendation dismissed'
                        )
                      }
                    >
                      Dismiss
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
              <Empty icon={CirclePause} title="Queue is clear">
                Active review-first automations will place eligible suggestions here.
              </Empty>
            )}
          </div>
        </div>
      </div>

      <div className={cn(TILE, 'flex items-start gap-2 p-3')}>
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--signal-ok))]" />
        <p className={cn(BODY, 'text-[10px]')}>
          The server rechecks eligibility before delivery, shares one cross-channel contact limit,
          keeps learner-reported feelings out of commercial targeting, and records why it sent or
          stayed quiet.
        </p>
      </div>
      <AutopilotMessagePreviewDialog
        policy={previewPolicy}
        open={Boolean(previewPolicy)}
        onOpenChange={(open) => !open && setPreviewPolicy(null)}
      />
    </section>
  );
}
