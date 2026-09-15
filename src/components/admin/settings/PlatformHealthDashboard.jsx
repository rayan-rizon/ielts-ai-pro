import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  PlatformHealth,
  HEALTH_WINDOWS,
  STATUS_LABEL,
  CATEGORY_LABEL,
} from '@/features/admin/services/PlatformHealth';
import { createPageUrl } from '@/utils';
import {
  isMaintenanceActive,
  isMaintenanceScheduled,
  normalizeMaintenance,
  relativeTime,
} from '@/lib/communications';
import { AdminPageSkeleton } from '@/components/admin/ui/primitives';

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

const SERVICE_OWNER = {
  ai: 'AI runtime',
  payments: 'Billing operations',
  content: 'Content operations',
  communications: 'Messaging operations',
  platform: 'Platform operations',
};

const SERVICE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Needs action' },
  { key: 'ai', label: 'AI & Speech' },
  { key: 'payments', label: 'Payments' },
  { key: 'content', label: 'Content' },
  { key: 'communications', label: 'Communications' },
  { key: 'platform', label: 'Platform' },
];

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
  inFlight: 'In flight',
  stuck: 'Stuck',
  usersAffected: 'Learners',
  oldestStuckMinutes: 'Oldest',
  webhookEvents: 'Webhooks',
  processedEvents: 'Processed',
  failedEvents: 'Failed',
  eventFailureRate: 'Failure rate',
  recordedPayments: 'Recorded',
  recordedAmount: 'Amount',
  pending: 'Pending',
  approvedInWindow: 'Approved',
  oldestPendingHours: 'Oldest',
  activePassages: 'Active tests',
  readyPassages: 'Ready tests',
  brokenPassages: 'Broken tests',
  sessionsInWindow: 'Sessions',
  size: 'Size',
  connections: 'Conns',
  maxConnections: 'Max conns',
  connectionUtilization: 'Conn. usage',
  authAccountsInWindow: 'New Auth accounts',
  profilesInWindow: 'New profiles',
  orphanProfiles: 'Historical accounts',
  actionableProfileGaps: 'Actionable gaps',
  unactivatedAccounts: 'Unactivated',
  oldestOrphanHours: 'Oldest',
  oldestActionableHours: 'Oldest actionable',
  completedSessions: 'Completed tests',
  failedEvaluations: 'Failed results',
  stuckEvaluations: 'Stalled results',
  accepted: 'Accepted',
  failedDispatches: 'Failed',
  skipped: 'Disabled',
  dispatchFailureRate: 'Failure rate',
  cronActive: 'Cron active',
  lastCronStatus: 'Latest cron',
  lastRunRecorded: 'App run recorded',
  lastRunAgeHours: 'Last app run',
  lastRunAccepted: 'Accepted',
  lastRunFailed: 'Failed',
  openrouterCalls: 'OpenRouter DeepSeek',
  deepseekCalls: 'Reading DeepSeek',
  lunaCalls: 'Reading Luna',
  glmCalls: 'GLM 5.3 Flash',
  openrouterLunaCalls: 'OpenRouter Luna',
  directDeepseekCalls: 'Direct DeepSeek',
  geminiCalls: 'Gemini calls',
  cachedResponses: 'Served from cache',
  unknownProviderCalls: 'Unattributed',
  upstreamFailures: 'Provider failures',
  upstreamFailureRate: 'Provider failure rate',
  recoveredFallbacks: 'Recovered',
  servedCalls: 'Served',
  estimatedCostUsd: 'Est. cost',
};

const ALARM_KEYS = new Set([
  'errors',
  'unrecoverable',
  'credentialErrors',
  'stuck',
  'failedEvents',
  'brokenPassages',
  'actionableProfileGaps',
  'failedEvaluations',
  'stuckEvaluations',
  'failedDispatches',
  'lastRunFailed',
  // `upstreamFailures` is deliberately not an alarm. It counts provider calls
  // that failed *and then recovered* — the fallback chain doing its job. The
  // alarm belongs on `errors`, which counts failures the learner actually felt.
  // Flagging both made a self-healed blip read as an incident.
]);

const PERCENT_METRICS = new Set([
  'errorRate',
  'upstreamFailureRate',
  'completionRate',
  'eventFailureRate',
  'dispatchFailureRate',
  'connectionUtilization',
]);
const HOUR_METRICS = new Set(['oldestPendingHours', 'oldestOrphanHours', 'oldestActionableHours']);

const formatMinutes = (value) => {
  const minutes = Number(value);
  return minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`;
};

const METRIC_FORMATTERS = {
  p95LatencyMs: (value) => `${(Number(value) / 1000).toFixed(1)}s`,
  lastRunAgeHours: (value) => `${value}h ago`,
  oldestStuckMinutes: formatMinutes,
  estimatedCostUsd: (value) => `$${Number(value).toFixed(6)}`,
};

const NULL_METRIC_LABELS = {
  lastRunAgeHours: 'No recorded run',
  estimatedCostUsd: 'Not recorded',
};

const formatMissingMetric = (key) => NULL_METRIC_LABELS[key] || '—';

const fmt = (key, value) => {
  if (value === null || value === undefined) {
    return formatMissingMetric(key);
  }
  if (PERCENT_METRICS.has(key)) return `${value}%`;
  if (HOUR_METRICS.has(key)) return `${value}h`;
  if (METRIC_FORMATTERS[key]) return METRIC_FORMATTERS[key](value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return typeof value === 'number' ? value.toLocaleString() : String(value);
};

/** Internal fields that qualify another metric rather than standing alone. */
const HIDDEN_METRICS = new Set(['costedCalls']);

const HEADLINE_KEY = {
  speech_transcription: 'errorRate',
  pronunciation_assessment: 'completionRate',
  ai_feedback: 'errorRate',
  ai_text_providers: 'errorRate',
  ai_quota_reservations: 'stuck',
  speech_synthesis: 'errorRate',
  payments_stripe: 'eventFailureRate',
  payments_manual: 'pending',
  database: 'connectionUtilization',
  auth_provisioning: 'actionableProfileGaps',
  test_result_delivery: 'failedEvaluations',
  email_dispatch: 'dispatchFailureRate',
  scheduled_automation: 'lastCronStatus',
};

const headlineFor = (service) => {
  const m = service.metrics || {};
  const key =
    HEADLINE_KEY[service.key] ||
    (service.key?.startsWith('content_') ? 'readyPassages' : Object.keys(m)[0]);
  return { label: METRIC_LABEL[key] || key || '', value: fmt(key, m[key]) };
};

/**
 * Metrics that stay on the card when null, because "we did not measure this"
 * is itself the operator-relevant fact. Dropping the tile would read as though
 * the metric does not exist; rendering 0 would assert a measurement we do not
 * have.
 */
const NULLABLE_METRICS = new Set(['estimatedCostUsd']);

const metricsFor = (service) =>
  Object.entries(service.metrics || {}).filter(
    ([key, value]) =>
      !HIDDEN_METRICS.has(key) &&
      ((value !== null && value !== undefined) || NULLABLE_METRICS.has(key))
  );

const ownerFor = (service) => SERVICE_OWNER[service.category] || 'Platform operations';
const evidenceFor = (service) => service.source || 'Service telemetry';
const providerFor = (service) => service.provider || ownerFor(service);
const incidentLabel = (count) => `${count} incident${count === 1 ? '' : 's'}`;
const statusBucketFor = (status) => {
  if (status === 'down' || status === 'unconfigured') return 'down';
  if (status === 'degraded' || status === 'attention') return 'degraded';
  return status === 'idle' ? 'idle' : 'operational';
};
const occurrenceCount = (incident) => Number(incident.occurrences || 1);

const exactTimestamp = (value) => {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    timeZoneName: 'short',
  }).format(date);
};

const ExactTime = ({ value }) => (
  <time dateTime={value || undefined} title={value || undefined}>
    {exactTimestamp(value)}
  </time>
);

const isEarlierDate = (dateStr, baselineStr) =>
  !baselineStr || new Date(dateStr) < new Date(baselineStr);

const isLaterDate = (dateStr, baselineStr) =>
  !baselineStr || new Date(dateStr) > new Date(baselineStr);

const updateIncidentBoundaries = (summary, incident) => {
  if (incident.first_seen && isEarlierDate(incident.first_seen, summary.firstSeen)) {
    summary.firstSeen = incident.first_seen;
  }
  if (incident.last_seen && isLaterDate(incident.last_seen, summary.lastSeen)) {
    summary.lastSeen = incident.last_seen;
  }
};

const aggregateIncidents = (incidents) => {
  const counts = {};
  const summaries = {};

  incidents.forEach((incident) => {
    const occurrences = occurrenceCount(incident);
    counts[incident.service] = (counts[incident.service] || 0) + occurrences;

    const summary = summaries[incident.service] || {
      firstSeen: null,
      lastSeen: null,
      occurrences: 0,
    };
    updateIncidentBoundaries(summary, incident);
    summary.occurrences += occurrences;
    summaries[incident.service] = summary;
  });

  return { counts, summaries };
};

const summarizeHealth = (health, incidents) => {
  const services = health?.services || [];
  const counts = { down: 0, degraded: 0, operational: 0, idle: 0 };

  services.forEach((service) => {
    counts[statusBucketFor(service.status)] += 1;
  });

  const { counts: incidentCounts, summaries: incidentSummaries } = aggregateIncidents(incidents);

  return {
    services,
    problems: services.filter(
      (service) => service.status !== 'operational' && service.status !== 'idle'
    ),
    counts,
    total: services.length,
    serviceLabels: Object.fromEntries(services.map((service) => [service.key, service.label])),
    incidentCounts,
    incidentSummaries,
  };
};

const filterServices = (services, activeFilter, rawQuery) => {
  const query = rawQuery.trim().toLowerCase();
  return services.filter((service) => {
    const isAttention = service.status !== 'operational' && service.status !== 'idle';
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'attention' && isAttention) ||
      service.category === activeFilter;
    if (!matchesFilter) return false;
    if (!query) return true;
    return [
      service.label,
      service.provider,
      service.impact,
      service.source,
      service.key,
      CATEGORY_LABEL[service.category],
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
};

const filterIncidents = (incidents, services) => {
  const visibleKeys = new Set(services.map((service) => service.key));
  return incidents.filter((incident) => visibleKeys.has(incident.service));
};

const overviewFor = (counts, total) => {
  const allClear = counts.down === 0 && counts.degraded === 0;
  const headline = allClear ? 'Nominal' : counts.down > 0 ? 'Fault' : 'Degraded';
  const accent =
    counts.down > 0
      ? 'text-[rgb(var(--signal-fault))]'
      : counts.degraded > 0
        ? 'text-[rgb(var(--signal-warn))]'
        : 'text-[rgb(var(--signal-ok))]';
  return {
    allClear,
    headline,
    accent,
    pct: (value) => (total > 0 ? (value / total) * 100 : 0),
    legend: [
      { label: 'Fault', n: counts.down, cls: FAULT_BG },
      { label: 'Degraded', n: counts.degraded, cls: WARN_BG },
      { label: 'Nominal', n: counts.operational, cls: OK_BG },
      { label: 'Idle', n: counts.idle, cls: IDLE_BG },
    ],
  };
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
  speech_synthesis: {
    how: 'Inspect the TTS incident message first. Authentication errors require the Google TTS key to be corrected; transient provider failures already fall back to browser speech and should be monitored for recurrence.',
  },
  ai_feedback: {
    how: 'Use the incident list to separate rate limits, provider authentication, malformed output and application errors. Restore the failing dependency, then run one real learner-shaped scoring request before considering the service recovered.',
  },
  ai_text_providers: {
    how: 'Provider failures that returned a deterministic or routed fallback are degraded, not learner-blocking. Investigate the recorded provider and fallback reason; only treat “Errors” as lost learner results. After correcting credentials, routing, or rate limits, verify one real request through the normal learner flow.',
  },
  speech_transcription: {
    how: 'Cloudflare returned no speech for some valid clips. Speaking tests now retry Whisper without voice-activity detection before using Gemini, then preserve a reliable browser transcript when both providers reject the clip. If fallback use stays high, inspect the recorded audio type, attempt count and recovery flags, then test the learner’s microphone input. Any “Lost” count above zero is a scoring failure that needs immediate investigation.',
  },
  payments_stripe: {
    how: 'Webhook events are arriving but no payment row is being written. Confirm STRIPE_WEBHOOK_SECRET matches the endpoint and that handle_stripe_event is reaching its payment_requests insert.',
  },
  payments_manual: {
    how: 'Approve or reject the waiting requests in the Payments tab. Each one is a learner who has paid but is still on the free tier.',
  },
  database: {
    how: 'Connection pressure is calculated against Postgres max_connections. Find long-lived or duplicate clients before raising the limit; verify pooling and close leaked connections, then refresh this view.',
  },
  auth_provisioning: {
    how: 'Compare the affected Auth IDs with public.users. Backfill only accounts that still exist and should have a learner profile, then inspect the signup trigger and profile-upsert logs before removing any abandoned accounts.',
  },
  test_result_delivery: {
    how: 'Open the affected sessions in Test Management and inspect their evaluation_status. Retry provider failures only when the saved answers and prompt are intact; do not fabricate a score for incomplete submissions.',
  },
  email_dispatch: {
    how: 'Use the incident message to distinguish a missing Resend key, provider rejection, or disabled template. Verify the sender domain and run one admin test email after correcting the configuration.',
  },
  scheduled_automation: {
    how: 'A successful cron row only proves the HTTP request was queued. If no app run follows, inspect the pg_net response and Edge Function logs, then verify the Vault URL and scheduler credential. The job retries from 00:00–02:00 UTC and claims each date once; confirm one completed scheduled_email_runs row appears within 36 hours.',
  },
};

const repairFor = (service) => {
  if (REPAIRS[service.key]) return REPAIRS[service.key];
  if (service.key?.startsWith('content_')) {
    return {
      how: 'Open the affected tests in Content Management and supply the missing questions or required listening audio. The card only counts tests that are actually learner-ready.',
    };
  }
  return null;
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
            'inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-white/15 px-2.5 py-1.5 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-all duration-150 ease-smooth-out active:scale-95 disabled:opacity-50'
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

const ProblemIncidentSummary = ({ incidentSummary }) => {
  if (!incidentSummary?.lastSeen) return null;
  const isRange =
    incidentSummary.firstSeen && incidentSummary.firstSeen !== incidentSummary.lastSeen;

  return (
    <div className="mt-2 grid gap-1 rounded-md border border-stone-200 bg-stone-50/70 px-2.5 py-2 dark:border-white/[0.07] dark:bg-black/10 break-words min-w-0">
      {isRange ? (
        <>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 break-words')}>
            First observed{' '}
            <strong className="text-stone-700 dark:text-stone-200 break-words [overflow-wrap:anywhere]">
              <ExactTime value={incidentSummary.firstSeen} />
            </strong>
          </p>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 break-words')}>
            Latest observed{' '}
            <strong className="text-stone-700 dark:text-stone-200 break-words [overflow-wrap:anywhere]">
              <ExactTime value={incidentSummary.lastSeen} />
            </strong>
          </p>
        </>
      ) : (
        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 break-words')}>
          Occurred{' '}
          <strong className="text-stone-700 dark:text-stone-200 break-words [overflow-wrap:anywhere]">
            <ExactTime value={incidentSummary.lastSeen} />
          </strong>
        </p>
      )}
    </div>
  );
};

const ProblemRepairDetails = ({ repairInstructions, repair, onRepaired }) => (
  <details className="group mt-2.5 rounded-md border border-stone-200 dark:border-white/8 bg-white dark:bg-white/2">
    <summary
      className={cn(
        MICRO,
        'flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-stone-700 dark:text-stone-200'
      )}
    >
      Repair steps
      <ChevronDown className="h-3.5 w-3.5 text-stone-400 transition-transform group-open:rotate-180" />
    </summary>
    <div className="border-t border-stone-200 dark:border-white/[0.07] px-3 pb-3 pt-2.5">
      <p className="text-[11px] font-medium text-stone-600 dark:text-stone-300 leading-relaxed">
        {repairInstructions}
      </p>
      {repair?.action && <RepairButton repair={repair} onRepaired={onRepaired} />}
    </div>
  </details>
);

/* Prioritised read-out, shown only for services that need the admin to act. */
const ProblemPanel = ({ service, index, incidentCount = 0, incidentSummary, onRepaired }) => {
  const signal = SIGNAL[service.status] || SIGNAL.idle;
  const { Icon } = signal;
  const metrics = metricsFor(service);
  const repair = repairFor(service);
  const repairInstructions =
    repair?.how || 'Review the incident evidence and restore the failing dependency.';

  return (
    <div
      className={cn(
        PANEL,
        'relative overflow-hidden w-full min-w-0 max-w-full animate-in fade-in slide-in-from-bottom-1'
      )}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
    >
      <span className={cn('absolute left-0 top-0 h-full w-[3px]', signal.rail)} />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold tracking-tight text-stone-900 dark:text-stone-50 truncate">
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

        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-3 mb-1')}>Learner impact</p>
        <p className="text-[11px] font-medium text-stone-700 dark:text-stone-200 leading-relaxed">
          {service.impact}
        </p>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg border border-stone-200 dark:border-white/[0.07] bg-stone-50/70 dark:bg-black/10 p-2.5 w-full min-w-0">
          {metrics.slice(0, 4).map(([key, value]) => (
            <div key={key} className="min-w-0">
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate')}>
                {METRIC_LABEL[key] || key}
              </p>
              <p
                className={cn(
                  NUM,
                  'text-sm font-bold mt-0.5',
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

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-dashed border-stone-200 dark:border-white/[0.07] pt-2.5">
          <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 shrink-0')}>
            Owner{' '}
            <strong className="text-stone-700 dark:text-stone-200">{ownerFor(service)}</strong>
          </span>
          <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 shrink-0')}>
            {incidentLabel(incidentCount)}
          </span>
          <span
            className={cn(
              MICRO,
              'text-stone-500 dark:text-stone-400 truncate max-w-full block min-w-0'
            )}
          >
            Evidence {evidenceFor(service)}
          </span>
        </div>

        <ProblemIncidentSummary incidentSummary={incidentSummary} />

        <ProblemRepairDetails
          repairInstructions={repairInstructions}
          repair={repair}
          onRepaired={onRepaired}
        />
      </div>
    </div>
  );
};

const ServiceDetails = ({ service, metrics, incidentSummary }) => {
  const signal = SIGNAL[service.status] || SIGNAL.idle;
  const { Icon } = signal;

  return (
    <div className="border-t border-stone-200 dark:border-white/[0.07] bg-stone-50/50 dark:bg-black/10 px-3.5 sm:px-4 py-3.5 sm:py-4">
      <div className="sm:hidden flex items-start justify-between gap-2 mb-3">
        <p className="text-[11px] font-medium text-stone-600 dark:text-stone-300 leading-relaxed min-w-0">
          {service.impact}
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 shrink-0',
            MICRO,
            signal.pill
          )}
        >
          <Icon className="w-2.5 h-2.5" />
          {STATUS_LABEL[service.status]}
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
          {metrics.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate')}>
                {METRIC_LABEL[key] || key}
              </p>
              <p
                className={cn(
                  NUM,
                  'mt-1 text-sm font-bold text-stone-900 dark:text-stone-50 truncate'
                )}
              >
                {fmt(key, value)}
              </p>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed lg:border-l lg:border-stone-200 lg:dark:border-white/[0.07] lg:pl-4">
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1')}>Evidence</p>
          <p className="font-semibold break-words [overflow-wrap:anywhere]">
            {evidenceFor(service)}
          </p>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-3 mb-1')}>Owner</p>
          <p className="font-semibold">{ownerFor(service)}</p>
          {incidentSummary?.lastSeen && (
            <>
              <p className={cn(MICRO, 'mt-3 mb-1 text-stone-500 dark:text-stone-400')}>
                Latest incident
              </p>
              <p className={cn(NUM, 'font-semibold')}>
                <ExactTime value={incidentSummary.lastSeen} />
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ServiceRow = ({ service, incidentSummary }) => {
  const [expanded, setExpanded] = useState(false);
  const signal = SIGNAL[service.status] || SIGNAL.idle;
  const { Icon } = signal;
  const headline = headlineFor(service);
  const metrics = metricsFor(service);

  return (
    <div className={cn(PANEL, 'relative overflow-hidden w-full min-w-0 max-w-full')}>
      <span className={cn('absolute left-0 top-0 h-full w-[2px]', signal.rail)} />
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className={cn(
          'w-full grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(160px,0.9fr)_minmax(180px,1.4fr)_auto] md:grid-cols-[minmax(200px,0.9fr)_minmax(240px,1.4fr)_auto] items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 text-left',
          'hover:bg-stone-50/80 dark:hover:bg-white/2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400'
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('w-2 h-2 rounded-full shrink-0', signal.dot)} />
            <p className="text-xs font-extrabold tracking-tight text-stone-900 dark:text-stone-50 truncate">
              {service.label}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1 ml-4">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate')}>
              {providerFor(service)}
            </p>
            {service.status !== 'operational' && (
              <span
                className={cn(
                  'sm:hidden inline-flex items-center gap-0.5 rounded px-1 py-0.2 border text-[8px] font-bold uppercase tracking-wider',
                  signal.pill
                )}
              >
                <Icon className="w-2 h-2" />
                {STATUS_LABEL[service.status]}
              </span>
            )}
          </div>
        </div>
        <p className="hidden sm:block min-w-0 text-[11px] font-medium text-stone-600 dark:text-stone-300 truncate">
          {service.impact}
        </p>
        <div className="flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
          <div className="text-right">
            <p className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}>
              {headline.value}
            </p>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
              {headline.label}
            </p>
          </div>
          <span
            className={cn(
              'hidden sm:inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5',
              MICRO,
              signal.pill
            )}
          >
            <Icon className="w-2.5 h-2.5" />
            {STATUS_LABEL[service.status]}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-stone-400 transition-transform duration-200 ease-smooth-out',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="service-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ServiceDetails service={service} metrics={metrics} incidentSummary={incidentSummary} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const filterCountFor = (filterKey, total, problems, services) => {
  if (filterKey === 'all') return total;
  if (filterKey === 'attention') return problems.length;
  return services.filter((service) => service.category === filterKey).length;
};

const ServiceDirectory = ({
  services,
  problems,
  total,
  serviceFilter,
  serviceQuery,
  filteredServices,
  incidentSummaries,
  onFilterChange,
  onQueryChange,
}) => (
  <section className="space-y-3 xl:order-1 w-full min-w-0 max-w-full">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
          <span className="w-4 h-px bg-stone-300 dark:bg-stone-700" />
          Service directory
        </h3>
        <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-300">
          Find any AI provider, API, payment, content, or platform dependency.
        </p>
      </div>
      <label className="relative block w-full sm:w-72 shrink-0">
        <span className="sr-only">Search services</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          value={serviceQuery}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search provider or service..."
          className="h-9 w-full rounded-md border border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] pl-9 pr-8 text-xs font-medium text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/50"
        />
        {serviceQuery && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </label>
    </div>

    <div
      className="flex gap-1.5 overflow-x-auto w-full min-w-0 max-w-full pb-1.5 -mx-1 px-1 sm:mx-0 sm:px-0 scrollbar-none sm:scrollbar-thin"
      role="group"
      aria-label="Filter services"
    >
      {SERVICE_FILTERS.map((filter) => (
        <button
          key={filter.key}
          type="button"
          aria-pressed={serviceFilter === filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            MICRO,
            'shrink-0 rounded-md border px-2.5 py-1.5 transition-all duration-150 ease-smooth-out active:scale-95',
            serviceFilter === filter.key
              ? 'border-stone-800 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950'
              : 'border-stone-300 bg-white text-stone-600 hover:text-stone-900 dark:border-white/15 dark:bg-[#131315] dark:text-stone-300 dark:hover:text-white'
          )}
        >
          {filter.label}{' '}
          <span className={NUM}>{filterCountFor(filter.key, total, problems, services)}</span>
        </button>
      ))}
    </div>

    <div className="space-y-2">
      {filteredServices.length > 0 ? (
        filteredServices.map((service) => (
          <ServiceRow
            key={service.key}
            service={service}
            incidentSummary={incidentSummaries[service.key]}
          />
        ))
      ) : (
        <div className={cn(PANEL, 'px-4 py-10 text-center')}>
          <p className="text-xs font-bold text-stone-700 dark:text-stone-200">No services match</p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            Clear the search or choose another category.
          </p>
        </div>
      )}
    </div>
  </section>
);

/**
 * Read-only mirror of maintenance mode.
 *
 * The switch itself moved to Admin → Communications → Maintenance, where it
 * sits with its message, window and bypass allowlist. Two switches writing the
 * same setting from two screens is how the old boolean-only version stayed
 * quietly broken; this reports state and links to the one control.
 */
const MaintenanceStatusCard = ({ maintenance }) => {
  const config = normalizeMaintenance(maintenance);
  const active = isMaintenanceActive(config);
  const scheduled = isMaintenanceScheduled(config);
  const dot = active ? FAULT_BG : scheduled ? WARN_BG : OK_BG;

  return (
    <div className={cn(PANEL, 'p-4 flex flex-col justify-between')}>
      <div>
        <p
          className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1.5')}
        >
          <ShieldCheck className="w-3 h-3" />
          Maintenance
        </p>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
              <span className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                {active ? 'Site offline' : scheduled ? 'Scheduled' : 'Site online'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium leading-snug">
              {active
                ? 'Non-admin users are seeing the maintenance page.'
                : scheduled
                  ? `Window opens ${relativeTime(config.starts_at)}.`
                  : 'All users have access.'}
            </p>
          </div>
          <Link
            to={`${createPageUrl('AdminPanel')}?tab=notifications&view=maintenance`}
            className="self-start shrink-0 inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 dark:border-white/15 px-3 h-8 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors active:scale-95"
          >
            <Wrench className="w-3 h-3" />
            Configure
          </Link>
        </div>
      </div>
    </div>
  );
};

const PlatformErrorPanel = ({ error, onRetry }) => (
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
          onClick={onRetry}
          className={cn(
            MICRO,
            'mt-1 rounded-md border border-stone-300 dark:border-white/15 px-2.5 py-1.5 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-all duration-150 ease-smooth-out active:scale-95'
          )}
        >
          Retry
        </button>
      </div>
    </div>
  </div>
);

const PlatformConsoleHeader = ({
  counts,
  total,
  health,
  hours,
  setHours,
  refreshing,
  onRefresh,
  problems,
}) => {
  const { allClear, headline, accent, pct, legend } = overviewFor(counts, total);

  return (
    <div
      className={cn(
        PANEL,
        'relative overflow-hidden bg-stone-50 dark:bg-[#0E0E10] border-stone-200 dark:border-white/[0.07]'
      )}
    >
      {/* dot-grid texture for instrument-panel atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,rgb(168_162_158/0.45)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.14)_1px,transparent_0)] bg-size-[14px_14px]"
      />
      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5">
          <div className="min-w-0">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Platform status</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1.5">
              <h3
                className={cn(
                  'text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] leading-none',
                  accent
                )}
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
                {' operational'}
              </span>
            </div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-2">
              {allClear
                ? 'No user-facing failures detected in this window.'
                : `${problems.length} service${problems.length === 1 ? '' : 's'} need admin action. Start with learner-blocking faults, then reduce degraded fallbacks.`}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start shrink-0">
            <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
              <SelectTrigger
                aria-label="Health window"
                className={cn(
                  MICRO,
                  'h-8 flex-1 sm:w-[135px] rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-700 dark:text-stone-200'
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
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              className="h-8 w-8 shrink-0 grid place-items-center rounded-md border border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-500 hover:text-stone-900 dark:hover:text-white transition-all duration-150 ease-smooth-out active:scale-90 disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Signal bar */}
        <div className="mt-5 flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-stone-200 dark:bg-white/6">
          {legend
            .filter((s) => s.n > 0)
            .map((s) => (
              <div key={s.label} className={s.cls} style={{ width: `${pct(s.n)}%` }} />
            ))}
        </div>
        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-y-2 gap-x-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
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
          </div>
          {health?.generatedAt && (
            <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 shrink-0')}>
              Updated <ExactTime value={health.generatedAt} />
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-lg border border-stone-200 dark:border-white/[0.07] bg-stone-200 dark:bg-white/[0.07]">
          {[
            { label: 'Blocking', value: counts.down, note: 'Unavailable or unconfigured' },
            { label: 'Needs action', value: counts.degraded, note: 'Degraded or delayed' },
            { label: 'Healthy', value: counts.operational, note: 'Operating normally' },
            { label: 'No traffic', value: counts.idle, note: 'No requests in window' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/90 dark:bg-[#131315] px-3.5 py-3 flex flex-col justify-between"
            >
              <div>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>{item.label}</p>
                <p className={cn(NUM, 'mt-1 text-xl font-bold text-stone-900 dark:text-stone-50')}>
                  {item.value}
                </p>
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-stone-500 dark:text-stone-400 leading-snug">
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActionQueueSection = ({ problems, incidentCounts, incidentSummaries, onRepaired }) => (
  <section className="space-y-3 xl:order-2 xl:sticky xl:top-4 w-full min-w-0 max-w-full">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
      <div>
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
          <span className={cn('w-4 h-px', FAULT_BG)} />
          Action queue
        </h3>
        <p className="mt-1.5 text-xs font-medium text-stone-600 dark:text-stone-300">
          Ordered by severity. Each item shows learner impact, evidence, owner, and a repair path.
        </p>
      </div>
      <span className={cn(NUM, 'text-xs font-bold text-stone-500 dark:text-stone-400')}>
        {problems.length} open
      </span>
    </div>
    <div className="space-y-2.5 xl:max-h-[760px] xl:overflow-y-auto xl:pr-1">
      {problems.map((service, i) => (
        <ProblemPanel
          key={service.key}
          service={service}
          index={i}
          incidentCount={incidentCounts[service.key] || 0}
          incidentSummary={incidentSummaries[service.key]}
          onRepaired={onRepaired}
        />
      ))}
    </div>
  </section>
);

const IncidentEvidenceItem = ({ incident, serviceLabel }) => {
  const isRecovered = incident.outcome === 'recovered';
  const isTimeRange = incident.first_seen && incident.first_seen !== incident.last_seen;

  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-stone-100 dark:border-white/5 last:border-0">
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
          isRecovered ? 'bg-amber-500' : FAULT_BG
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-200 break-words [overflow-wrap:anywhere] leading-snug">
          {incident.message}
        </p>
        {isRecovered && (
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            Recovered — a fallback returned a usable result.
          </p>
        )}
        <p className={cn(MICRO, 'mt-1 text-stone-500 dark:text-stone-400')}>{serviceLabel}</p>
        <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-[10px] font-semibold text-stone-500 dark:text-stone-400">
          {isTimeRange && (
            <span>
              First observed <ExactTime value={incident.first_seen} />
            </span>
          )}
          <span>
            {incident.first_seen === incident.last_seen ? 'Occurred' : 'Latest observed'}{' '}
            <ExactTime value={incident.last_seen} />
          </span>
        </div>
      </div>
      <span
        className={cn(
          NUM,
          'text-[11px] font-bold text-stone-500 dark:text-stone-400 shrink-0 ml-1'
        )}
      >
        ×{incident.occurrences}
      </span>
    </div>
  );
};

const IncidentEvidenceSection = ({ filteredIncidents, serviceLabels, incidentsError }) => (
  <section className="space-y-2.5">
    <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
      <span className="w-4 h-px bg-stone-300 dark:bg-stone-700" />
      Incident evidence
    </h3>
    <div className={cn(PANEL, 'p-4')}>
      <div className="flex items-center justify-between mb-3">
        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
          Persisted operational incidents in this window
        </p>
        <span className={cn(NUM, 'text-[11px] font-bold text-stone-500 dark:text-stone-400')}>
          {filteredIncidents.length}
        </span>
      </div>
      {incidentsError ? (
        <div className="rounded-md border border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)] px-3 py-2.5">
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
            Health status loaded, but incident details did not: {incidentsError}
          </p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 py-8 text-center">
          No recorded incidents match this service view.
        </p>
      ) : (
        <div className="space-y-px max-h-[280px] overflow-y-auto">
          {filteredIncidents.map((incident, i) => (
            <IncidentEvidenceItem
              key={`${incident.service}-${i}`}
              incident={incident}
              serviceLabel={serviceLabels[incident.service] || incident.service}
            />
          ))}
        </div>
      )}
    </div>
  </section>
);

const PlatformActivitySection = ({ health, maintenance }) => (
  <section className="space-y-2.5 pt-1 border-t border-stone-200/80 dark:border-white/[0.07]">
    <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}>
      <span className="w-4 h-px bg-stone-300 dark:bg-stone-700" />
      Activity &amp; controls
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className={cn(PANEL, 'p-4')}>
        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-3')}>
          Platform activity in this window
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Signups', value: health?.activity?.signups },
            { label: 'Active', value: health?.activity?.activeUsers },
            { label: 'Sessions', value: health?.activity?.testSessions },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <p
                className={cn(
                  NUM,
                  'text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 leading-none truncate'
                )}
              >
                {Number(item.value || 0).toLocaleString()}
              </p>
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-1.5 truncate')}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <MaintenanceStatusCard maintenance={maintenance} />
    </div>
  </section>
);

const PlatformHealthDashboard = ({ maintenance, onLoadingChange }) => {
  const [hours, setHours] = useState(24);
  const [health, setHealth] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [incidentsError, setIncidentsError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [serviceQuery, setServiceQuery] = useState('');
  const requestId = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const currentRequest = ++requestId.current;
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const [healthData, incidentResult] = await Promise.all([
          PlatformHealth.get(hours),
          PlatformHealth.incidents(hours)
            .then((data) => ({ data, error: null }))
            .catch((incidentError) => ({ data: [], error: incidentError })),
        ]);
        if (currentRequest !== requestId.current) return;

        if (incidentResult.error) {
          console.error('Failed to load platform incidents:', incidentResult.error);
          setIncidentsError(incidentResult.error.message || 'Unable to load incident details');
        } else {
          setIncidentsError(null);
        }

        setHealth(healthData);
        setIncidents(incidentResult.data);
      } catch (err) {
        if (currentRequest !== requestId.current) return;
        console.error('Failed to load platform health:', err);
        setError(err.message || 'Unable to load platform health');
        if (silent) toast.error('Could not refresh platform health');
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [hours]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Poll only while the document is visible; refresh immediately when the admin returns.
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    const interval = setInterval(refreshIfVisible, 60000);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [load]);

  const { services, problems, counts, total, serviceLabels, incidentCounts, incidentSummaries } =
    useMemo(() => summarizeHealth(health, incidents), [health, incidents]);
  const filteredServices = useMemo(
    () => filterServices(services, serviceFilter, serviceQuery),
    [serviceFilter, serviceQuery, services]
  );
  const filteredIncidents = useMemo(
    () => filterIncidents(incidents, filteredServices),
    [filteredServices, incidents]
  );

  if (loading) {
    return <AdminPageSkeleton kpis={4} panels={2} />;
  }

  if (error) {
    return <PlatformErrorPanel error={error} onRetry={() => load()} />;
  }

  return (
    <div className="animate-panel-in space-y-5">
      <PlatformConsoleHeader
        counts={counts}
        total={total}
        health={health}
        hours={hours}
        setHours={setHours}
        refreshing={refreshing}
        onRefresh={() => load({ silent: true })}
        problems={problems}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] items-start gap-4 w-full min-w-0 max-w-full">
        {problems.length > 0 && (
          <ActionQueueSection
            problems={problems}
            incidentCounts={incidentCounts}
            incidentSummaries={incidentSummaries}
            onRepaired={() => load({ silent: true })}
          />
        )}

        <ServiceDirectory
          services={services}
          problems={problems}
          total={total}
          serviceFilter={serviceFilter}
          serviceQuery={serviceQuery}
          filteredServices={filteredServices}
          incidentSummaries={incidentSummaries}
          onFilterChange={setServiceFilter}
          onQueryChange={setServiceQuery}
        />
      </div>

      <IncidentEvidenceSection
        filteredIncidents={filteredIncidents}
        serviceLabels={serviceLabels}
        incidentsError={incidentsError}
      />

      <PlatformActivitySection health={health} maintenance={maintenance} />
    </div>
  );
};

export default PlatformHealthDashboard;
