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
  score_plateau: {
    short: 'Plateau',
    detail: 'Three comparable, distinct results below target plus four quiet days.',
  },
  incomplete_test: {
    short: 'Resume',
    detail: 'Saved answers remain resumable after two inactive hours.',
  },
  exam_countdown: {
    short: 'Countdown',
    detail: 'A confirmed exam date reaches 30, 15, or 7 days.',
  },
  checkout_recovery: {
    short: 'Checkout',
    detail: 'A server-recorded checkout remains unsettled after 30 minutes.',
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
  const policies = autopilot?.policies || [];
  const recommendations = autopilot?.recommendations || [];
  const interventions = autopilot?.interventions || [];
  const channels = autopilot?.channels || [];
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

  const channelTotals = useMemo(
    () =>
      channels.map((row) => ({
        ...row,
        rate: Number(row.deliveries)
          ? (100 * Number(row.clicked || 0)) / Number(row.deliveries)
          : 0,
      })),
    [channels]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi
          label="Playbooks enabled"
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
          <AdminButton
            variant="outline"
            loading={busy === 'preview'}
            onClick={() =>
              execute(
                'preview',
                () => MarketingService.runAutopilot({ dryRun: true }),
                (result) => `${result.matched || 0} eligible learners in this preview`
              )
            }
          >
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
        <div className="grid gap-px bg-stone-200/80 dark:bg-white/[0.07] md:grid-cols-4">
          {policies.map((policy) => {
            const copy = PLAYBOOK_COPY[policy.playbook_key] || {};
            return (
              <div key={policy.id} className="bg-white p-3.5 dark:bg-[#131315]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={cn(MICRO, MUTED)}>{copy.short || policy.objective}</p>
                    <p className="mt-1 text-[12px] font-extrabold text-stone-900 dark:text-stone-50">
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
                  />
                </div>
                <p className={cn(BODY, 'mt-2')}>{copy.detail}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(policy.allowed_channels || []).map((channel) => (
                    <Pill key={channel}>{channel.replace('_', ' ')}</Pill>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-stone-200/80 pt-2.5 dark:border-white/[0.07]">
                  <span className={cn(MICRO, MUTED)}>Mode</span>
                  <button
                    type="button"
                    disabled={!policy.enabled || busy === policy.id}
                    onClick={() =>
                      execute(
                        policy.id,
                        () =>
                          MarketingService.updateAutopilotPolicy(policy.id, {
                            mode: policy.mode === 'review' ? 'guardrailed_auto' : 'review',
                          }),
                        'Playbook mode updated'
                      )
                    }
                    className="disabled:opacity-40"
                  >
                    <Pill tone={policy.mode === 'guardrailed_auto' ? 'ok' : 'warn'}>
                      {policy.mode === 'review' ? 'review first' : 'auto · guarded'}
                    </Pill>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={cn(PANEL, 'overflow-hidden')}>
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
                    className="grid grid-cols-[1fr_repeat(3,auto)] items-center gap-4 border-t border-stone-200/80 px-3.5 py-3 dark:border-white/[0.07]"
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
                Enabled review-mode playbooks will place eligible interventions here.
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
    </div>
  );
}
