import { useState, useEffect, useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Cpu,
  CreditCard,
  Database,
  Library,
  Loader2,
  Moon,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  PlatformHealth,
  HEALTH_WINDOWS,
  STATUS_LABEL,
  CATEGORY_LABEL,
} from '@/features/admin/services/PlatformHealth';
import { Tip } from '@/components/admin/ui/primitives';

/*
 * Instrument-panel treatment: graphite surfaces, hairline rules, and exactly
 * three signal colours. Numbers are the subject, so every value is set in a
 * tabular mono face and the chrome stays quiet.
 */

const NUM = 'font-mono tabular-nums tracking-tight';
const MICRO = 'text-[9px] font-bold uppercase tracking-[0.14em]';
const PANEL =
  'rounded-xl border border-stone-200/80 dark:border-white/[0.07] bg-white dark:bg-[#131315]';

// Signal tokens live in index.css so light/dark variants swap in one place.
const FAULT_BG = 'bg-[rgb(var(--signal-fault))]';
const WARN_BG = 'bg-[rgb(var(--signal-warn))]';
const OK_BG = 'bg-[rgb(var(--signal-ok))]';
const IDLE_BG = 'bg-[rgb(var(--signal-idle))]';

const FAULT_PILL =
  'text-[rgb(var(--signal-fault))] border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.08)]';
const WARN_PILL =
  'text-[rgb(var(--signal-warn))] border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.08)]';

const SIGNAL = {
  down: { rail: FAULT_BG, dot: FAULT_BG, pill: FAULT_PILL, Icon: AlertOctagon },
  unconfigured: { rail: FAULT_BG, dot: FAULT_BG, pill: FAULT_PILL, Icon: SlidersHorizontal },
  degraded: { rail: WARN_BG, dot: WARN_BG, pill: WARN_PILL, Icon: AlertTriangle },
  attention: { rail: WARN_BG, dot: WARN_BG, pill: WARN_PILL, Icon: AlertTriangle },
  operational: {
    rail: OK_BG,
    dot: OK_BG,
    pill: 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.08)]',
    Icon: CheckCircle2,
  },
  idle: {
    rail: IDLE_BG,
    dot: IDLE_BG,
    pill: 'text-[rgb(var(--signal-idle))] border-[rgb(var(--signal-idle)/0.35)] bg-[rgb(var(--signal-idle)/0.08)]',
    Icon: Moon,
  },
};

const FAULT_TEXT = 'text-[rgb(var(--signal-fault))]';

const CATEGORY_ICON = { ai: Cpu, payments: CreditCard, content: Library, platform: Database };

const METRIC_LABEL = {
  attempts: 'Attempts',
  errors: 'Errors',
  errorRate: 'Error rate',
  fallbacks: 'Fallbacks',
  unrecoverable: 'Lost',
  p95LatencyMs: 'p95',
  requested: 'Requested',
  completed: 'Completed',
  completionRate: 'Completion',
  credentialErrors: 'Cred. errors',
  cacheHits: 'Cache hits',
  stuck: 'Stuck',
  webhookEvents: 'Webhooks',
  recordedPayments: 'Recorded',
  recordedAmount: 'Amount',
  pending: 'Pending',
  approvedInWindow: 'Approved',
  oldestPendingHours: 'Oldest',
  activePassages: 'Active tests',
  sessionsInWindow: 'Sessions',
  size: 'Size',
  connections: 'Conns',
};

const ALARM_KEYS = new Set(['errors', 'unrecoverable', 'credentialErrors', 'stuck']);

const fmt = (key, value) => {
  if (value === null || value === undefined) return '—';
  if (key === 'p95LatencyMs') return `${(Number(value) / 1000).toFixed(1)}s`;
  if (key === 'errorRate' || key === 'completionRate') return `${value}%`;
  if (key === 'oldestPendingHours') return `${value}h`;
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const HEADLINE_KEY = {
  speech_transcription: 'errorRate',
  pronunciation_assessment: 'completionRate',
  ai_feedback: 'errorRate',
  ai_quota_reservations: 'stuck',
  speech_synthesis: 'attempts',
  payments_stripe: 'recordedPayments',
  payments_manual: 'pending',
  database: 'size',
};

const headlineFor = (service) => {
  const m = service.metrics || {};
  const key =
    HEADLINE_KEY[service.key] ||
    (service.key?.startsWith('content_') ? 'activePassages' : Object.keys(m)[0]);
  return { label: METRIC_LABEL[key] || key || '', value: fmt(key, m[key]) };
};

/*
 * Remediation guidance per service. Only faults with a safe, self-contained
 * server-side repair get a button; the rest explain what to change, because a
 * provider outage or a bad API key cannot be fixed from this screen.
 */
const REPAIRS = {
  ai_quota_reservations: {
    how: 'Each stranded reservation still counts against the learner’s daily quota, so they lose a request they never got. Releasing them deletes the phantom rows and hands the quota back. The underlying cause is an edge function exiting before it finalises the reservation.',
    action: {
      label: 'Release stuck reservations',
      confirm:
        'This permanently deletes the stranded reservation rows and returns the quota to those learners. Completed usage records are not touched.',
      run: (dryRun) => PlatformHealth.releaseStuckReservations({ dryRun }),
    },
  },
  pronunciation_assessment: {
    how: 'Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in the Supabase edge function secrets, then redeploy processSpeakingSession. Until then speaking tests silently return without a pronunciation score.',
  },
  speech_transcription: {
    how: 'Cloudflare Whisper is rejecting the audio rather than being down — check the recorder’s encoding, sample rate and minimum clip length before blaming the provider. Every failure here falls through to the slower Gemini path, and when that fails too the learner gets no score at all.',
  },
  payments_stripe: {
    how: 'Webhook events are arriving but no payment row is being written. Confirm STRIPE_WEBHOOK_SECRET matches the endpoint and that handle_stripe_event is reaching its payment_requests insert.',
  },
  payments_manual: {
    how: 'Approve or reject the waiting requests in the Payments tab. Each one is a learner who has paid but is still on the free tier.',
  },
};

const RepairButton = ({ repair, onRepaired }) => {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const runPreview = async () => {
    try {
      setBusy(true);
      setPreview(await repair.action.run(true));
    } catch (err) {
      toast.error(err.message || 'Could not preview the repair');
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    try {
      setBusy(true);
      const result = await repair.action.run(false);
      toast.success(
        `Released ${result.deleted} reservation(s) across ${result.usersAffected} learner(s)`
      );
      setPreview(null);
      onRepaired?.();
    } catch (err) {
      toast.error(err.message || 'Repair failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2.5">
      {!preview ? (
        <button
          onClick={runPreview}
          disabled={busy}
          className={cn(
            MICRO,
            'inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-white/15 px-2.5 py-1.5 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50'
          )}
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
          {repair.action.label}
        </button>
      ) : (
        <div className="rounded-lg border border-[rgb(var(--signal-warn)/0.35)] bg-[rgb(var(--signal-warn)/0.06)] p-3">
          <p className="text-[11px] font-bold text-stone-800 dark:text-stone-100">
            {preview.matched} reservation(s) across {preview.usersAffected} learner(s) will be
            released.
          </p>
          <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-snug">
            {repair.action.confirm}
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={apply}
              disabled={busy || preview.matched === 0}
              className={cn(
                MICRO,
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-white bg-[rgb(var(--signal-fault))] hover:opacity-90 transition-opacity disabled:opacity-40'
              )}
            >
              {busy && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirm release
            </button>
            <button
              onClick={() => setPreview(null)}
              disabled={busy}
              className={cn(MICRO, 'px-2 py-1.5 text-stone-500 hover:text-stone-800')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* Expanded read-out, shown only for services that need the admin to act. */
const ProblemPanel = ({ service, index, onRepaired }) => {
  const signal = SIGNAL[service.status] || SIGNAL.idle;
  const { Icon } = signal;
  const metrics = Object.entries(service.metrics || {}).filter(
    ([, v]) => v !== null && v !== undefined
  );
  const repair = REPAIRS[service.key];

  return (
    <div
      className={cn(PANEL, 'relative overflow-hidden animate-in fade-in slide-in-from-bottom-1')}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
    >
      <span className={cn('absolute left-0 top-0 h-full w-[3px]', signal.rail)} />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-[13px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 truncate">
              {service.label}
            </h4>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-1 truncate')}>
              {service.provider}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5 border',
              MICRO,
              signal.pill
            )}
          >
            <Icon className="w-2.5 h-2.5" />
            {STATUS_LABEL[service.status]}
          </span>
        </div>

        <p className="text-xs font-medium text-stone-600 dark:text-stone-300 leading-relaxed mt-3">
          {service.impact}
        </p>

        <div className="mt-4 pt-3 border-t border-dashed border-stone-200 dark:border-white/[0.07] grid grid-cols-3 gap-x-4 gap-y-3">
          {metrics.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate')}>
                {METRIC_LABEL[key] || key}
              </p>
              <p
                className={cn(
                  NUM,
                  'text-base font-bold mt-0.5',
                  ALARM_KEYS.has(key) && Number(value) > 0
                    ? FAULT_TEXT
                    : 'text-stone-900 dark:text-stone-50'
                )}
              >
                {fmt(key, value)}
              </p>
            </div>
          ))}
        </div>

        {/* How to actually clear this fault */}
        {repair && (
          <div className="mt-3 pt-3 border-t border-dashed border-stone-200 dark:border-white/[0.07]">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5')}>How to fix</p>
            <p className="text-[11px] font-medium text-stone-600 dark:text-stone-300 leading-relaxed">
              {repair.how}
            </p>
            {repair.action && <RepairButton repair={repair} onRepaired={onRepaired} />}
          </div>
        )}
      </div>
    </div>
  );
};

/* Dense read-out so all services stay on one screen. */
const ServiceTile = ({ service }) => {
  const signal = SIGNAL[service.status] || SIGNAL.idle;
  const headline = headlineFor(service);
  const alarming = service.status === 'down' || service.status === 'unconfigured';

  return (
    <Tip content={service.impact}>
      <div
        className={cn(
          PANEL,
          'relative overflow-hidden flex items-center gap-3 px-3.5 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-stone-300 dark:hover:border-white/20 hover:shadow-sm cursor-default'
        )}
      >
        <span className={cn('absolute left-0 top-0 h-full w-[2px]', signal.rail)} />
        <span className="relative flex h-1.5 w-1.5 shrink-0 ml-0.5">
          {alarming && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                signal.dot
              )}
            />
          )}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', signal.dot)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 truncate leading-tight">
            {service.label}
          </p>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate mt-0.5')}>
            {headline.label}
          </p>
        </div>
        <span
          className={cn(
            NUM,
            'text-sm font-bold shrink-0',
            alarming ? FAULT_TEXT : 'text-stone-900 dark:text-stone-50'
          )}
        >
          {headline.value}
        </span>
      </div>
    </Tip>
  );
};

const PlatformHealthDashboard = ({ maintenanceMode, onToggleMaintenance, isUpdating }) => {
  const [hours, setHours] = useState(24);
  const [health, setHealth] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const [healthData, incidentData] = await Promise.all([
          PlatformHealth.get(hours),
          PlatformHealth.incidents(hours).catch(() => []),
        ]);

        setHealth(healthData);
        setIncidents(incidentData);
      } catch (err) {
        console.error('Failed to load platform health:', err);
        setError(err.message || 'Unable to load platform health');
        if (silent) toast.error('Could not refresh platform health');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [hours]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Poll while the tab is open so a live outage surfaces without a manual refresh.
  useEffect(() => {
    const interval = setInterval(() => load({ silent: true }), 60000);
    return () => clearInterval(interval);
  }, [load]);

  const { problems, grouped, counts, total } = useMemo(() => {
    const services = health?.services || [];
    const bucket = { down: 0, degraded: 0, operational: 0, idle: 0 };

    services.forEach((s) => {
      if (s.status === 'down' || s.status === 'unconfigured') bucket.down += 1;
      else if (s.status === 'degraded' || s.status === 'attention') bucket.degraded += 1;
      else if (s.status === 'idle') bucket.idle += 1;
      else bucket.operational += 1;
    });

    return {
      problems: services.filter((s) => s.status !== 'operational' && s.status !== 'idle'),
      grouped: services.reduce((acc, s) => {
        (acc[s.category] ||= []).push(s);
        return acc;
      }, {}),
      counts: bucket,
      total: services.length,
    };
  }, [health]);

  if (loading) {
    return (
      <div className="min-h-[320px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-stone-500 dark:text-stone-400 animate-spin" />
        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Polling services</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(PANEL, 'relative overflow-hidden')}>
        <span className={cn('absolute left-0 top-0 h-full w-[3px]', FAULT_BG)} />
        <div className="p-5 pl-6 flex items-start gap-3">
          <AlertOctagon className={cn('w-5 h-5 shrink-0 mt-0.5', FAULT_TEXT)} />
          <div className="space-y-2">
            <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
              Could not load platform health
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">{error}</p>
            <button
              onClick={() => load()}
              className={cn(
                MICRO,
                'mt-1 rounded-md border border-stone-300 dark:border-white/15 px-2.5 py-1.5 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors'
              )}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allClear = counts.down === 0 && counts.degraded === 0;
  const headline = allClear ? 'Nominal' : counts.down > 0 ? 'Fault' : 'Degraded';
  const accent =
    counts.down > 0
      ? 'text-[rgb(var(--signal-fault))]'
      : counts.degraded > 0
        ? 'text-[rgb(var(--signal-warn))]'
        : 'text-[rgb(var(--signal-ok))]';
  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);

  const legend = [
    { label: 'Fault', n: counts.down, cls: FAULT_BG },
    { label: 'Degraded', n: counts.degraded, cls: WARN_BG },
    { label: 'Nominal', n: counts.operational, cls: OK_BG },
    { label: 'Idle', n: counts.idle, cls: IDLE_BG },
  ];

  return (
    <div className="space-y-5">
      {/* Console header */}
      <div
        className={cn(
          PANEL,
          'relative overflow-hidden bg-stone-50 dark:bg-[#0E0E10] border-stone-200 dark:border-white/[0.07]'
        )}
      >
        {/* dot-grid texture for instrument-panel atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,rgb(168_162_158/0.45)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.14)_1px,transparent_0)] [background-size:14px_14px]"
        />
        <div className="relative p-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="min-w-0">
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Platform status</p>
              <div className="flex items-baseline gap-3 mt-1.5">
                <h3
                  className={cn('text-3xl font-extrabold tracking-[-0.03em] leading-none', accent)}
                >
                  {headline}
                </h3>
                <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  <span className={cn(NUM, 'text-xs font-bold text-stone-500 dark:text-stone-300')}>
                    {counts.operational}
                  </span>
                  {' of '}
                  <span className={cn(NUM, 'text-xs font-bold text-stone-500 dark:text-stone-300')}>
                    {total}
                  </span>
                  {' healthy'}
                </span>
              </div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-2">
                {allClear
                  ? 'No user-facing failures detected in this window.'
                  : problems.map((p) => p.label).join(' · ')}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
                <SelectTrigger
                  aria-label="Health window"
                  className={cn(
                    MICRO,
                    'h-8 w-[135px] rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-700 dark:text-stone-200'
                  )}
                >
                  <Clock className="mr-1.5 h-3 w-3 text-stone-500 dark:text-stone-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_WINDOWS.map((w) => (
                    <SelectItem key={w.hours} value={String(w.hours)}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => load({ silent: true })}
                disabled={refreshing}
                aria-label="Refresh"
                className="h-8 w-8 grid place-items-center rounded-md border border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Signal bar */}
          <div className="mt-5 flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-stone-200 dark:bg-white/[0.06]">
            {legend
              .filter((s) => s.n > 0)
              .map((s) => (
                <div key={s.label} className={s.cls} style={{ width: `${pct(s.n)}%` }} />
              ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
            {legend.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <span className={cn('w-1.5 h-1.5 rounded-full', l.cls)} />
                <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>{l.label}</span>
                <span
                  className={cn(NUM, 'text-[11px] font-bold text-stone-700 dark:text-stone-200')}
                >
                  {l.n}
                </span>
              </span>
            ))}
            <span className={cn(MICRO, 'text-stone-500 dark:text-stone-600 ml-auto')}>
              {health?.generatedAt && new Date(health.generatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Needs attention */}
      {problems.length > 0 && (
        <section className="space-y-2.5">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
            <span className={cn('w-4 h-px', FAULT_BG)} />
            Needs attention
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {problems.map((service, i) => (
              <ProblemPanel
                key={service.key}
                service={service}
                index={i}
                onRepaired={() => load({ silent: true })}
              />
            ))}
          </div>
        </section>
      )}

      {/* All services */}
      <section className="space-y-3.5">
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
          <span className="w-4 h-px bg-stone-300 dark:bg-stone-700" />
          All services
        </h3>
        {Object.entries(grouped).map(([category, services]) => {
          const CatIcon = CATEGORY_ICON[category] || Activity;
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <CatIcon className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  {CATEGORY_LABEL[category] || category}
                </span>
                <span className="flex-1 h-px bg-stone-200 dark:bg-white/[0.06]" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {services.map((service) => (
                  <ServiceTile key={service.key} service={service} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Diagnostics — still health telemetry, so it keeps the same eyebrow
          pattern as "Needs attention" / "All services" above. Full width: a
          squeezed half-column just wrapped every message onto three lines. */}
      <section className="space-y-2.5">
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
          <span className="w-4 h-px bg-stone-300 dark:bg-stone-700" />
          Recent errors
        </h3>
        <div className={cn(PANEL, 'p-4')}>
          <div className="flex items-center justify-between mb-3">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              Provider-level failures in this window
            </p>
            <span className={cn(NUM, 'text-[11px] font-bold text-stone-500 dark:text-stone-400')}>
              {incidents.length}
            </span>
          </div>
          {incidents.length === 0 ? (
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 py-8 text-center">
              No provider errors in this window.
            </p>
          ) : (
            <div className="space-y-px max-h-[280px] overflow-y-auto">
              {incidents.map((incident, i) => (
                <div
                  key={`${incident.service}-${i}`}
                  className="flex items-start gap-2.5 py-2.5 border-b border-stone-100 dark:border-white/[0.05] last:border-0"
                >
                  <span className={cn('w-1 h-1 rounded-full mt-1.5 shrink-0', FAULT_BG)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-200 break-words leading-snug">
                      {incident.message}
                    </p>
                    <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-1')}>
                      {incident.service} · {new Date(incident.last_seen).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      NUM,
                      'text-[11px] font-bold text-stone-500 dark:text-stone-400 shrink-0'
                    )}
                  >
                    ×{incident.occurrences}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Activity & controls — deliberately set apart from the fault/status
          telemetry above with its own divider: these aren't health signals,
          they're general product activity and an admin-facing switch. */}
      <section className="space-y-2.5 pt-1 border-t border-stone-200/80 dark:border-white/[0.07]">
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
          <span className="w-4 h-px bg-stone-300 dark:bg-stone-700" />
          Activity &amp; controls
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className={cn(PANEL, 'p-4')}>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-3')}>
              Platform activity in this window
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Signups', value: health?.activity?.signups },
                { label: 'Active', value: health?.activity?.activeUsers },
                { label: 'Sessions', value: health?.activity?.testSessions },
              ].map((item) => (
                <div key={item.label}>
                  <p
                    className={cn(
                      NUM,
                      'text-2xl font-bold text-stone-900 dark:text-stone-50 leading-none'
                    )}
                  >
                    {Number(item.value || 0).toLocaleString()}
                  </p>
                  <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-1.5')}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(PANEL, 'p-4')}>
            <p
              className={cn(
                MICRO,
                'text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1.5'
              )}
            >
              <ShieldCheck className="w-3 h-3" />
              Maintenance
            </p>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <Label className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                  Maintenance Mode
                </Label>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium leading-snug">
                  Restrict access for non-admin users.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isUpdating && (
                  <Loader2 className="w-4 h-4 animate-spin text-stone-500 dark:text-stone-400" />
                )}
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={onToggleMaintenance}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlatformHealthDashboard;
