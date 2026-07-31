import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import { AnalyticsService } from '@/features/admin/services/AnalyticsService';
import ServiceStatusStrip from './ServiceStatusStrip';
import { NUM, MICRO, PANEL, Kpi, InfoTip, Tip } from './ui/primitives';

const SEVERITY = {
  high: 'bg-[rgb(var(--signal-fault))]',
  medium: 'bg-[rgb(var(--signal-warn))]',
  low: 'bg-[rgb(var(--signal-idle))]',
};

const WINDOWS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

const pctChange = (value, prev) => {
  if (!prev) return value > 0 ? 100 : null;
  return Math.round(((value - prev) / prev) * 100);
};

const Delta = ({ value, prev, invert = false }) => {
  const change = pctChange(value, prev);
  if (change === null || change === 0) {
    return <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>flat</span>;
  }
  // On cost, up is bad — invert flips which direction reads as good.
  const good = invert ? change < 0 : change > 0;
  const Icon = change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-bold',
        good ? 'text-[rgb(var(--signal-ok))]' : 'text-[rgb(var(--signal-fault))]'
      )}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(change)}%
    </span>
  );
};

/* The single most useful visual here: where people fall out of the product. */
const Funnel = ({ steps }) => {
  const top = steps[0]?.users || 1;
  const drops = steps.map((s, i) =>
    i === 0 ? 0 : (steps[i - 1].users - s.users) / (steps[i - 1].users || 1)
  );
  // The final free-to-paid step is always the steepest drop in a freemium
  // product, so exclude it — the useful signal is where activation leaks.
  const activationDrops = drops.slice(0, -1);
  const worst =
    activationDrops.length > 1
      ? activationDrops.indexOf(Math.max(...activationDrops.slice(1)))
      : -1;

  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => {
        const share = (step.users / top) * 100;
        const dropPct = i === 0 ? null : Math.round(drops[i] * 100);
        const isWorst = i === worst && dropPct > 0;

        return (
          <div key={step.key}>
            {dropPct > 0 && (
              <div className="flex items-center gap-1.5 pl-1 pb-1">
                <span className="w-px h-2.5 bg-stone-200 dark:bg-white/10" />
                <span
                  className={cn(
                    MICRO,
                    isWorst
                      ? 'text-[rgb(var(--signal-fault))]'
                      : 'text-stone-500 dark:text-stone-400'
                  )}
                >
                  −{dropPct}% drop{isWorst ? ' · biggest leak' : ''}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 h-8 rounded-md bg-stone-100 dark:bg-white/[0.04] overflow-hidden">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-md transition-[width] duration-700',
                    isWorst
                      ? 'bg-[rgb(var(--signal-fault)/0.22)]'
                      : 'bg-[rgb(var(--signal-ok)/0.18)]'
                  )}
                  style={{ width: `${Math.max(share, 3)}%` }}
                />
                <div className="relative h-full flex items-center justify-between px-3">
                  <span className="text-[11px] font-extrabold text-stone-800 dark:text-stone-100 truncate">
                    {step.label}
                  </span>
                  <span className={cn(NUM, 'text-[11px] font-bold text-stone-500 shrink-0 ml-2')}>
                    {Math.round(share)}%
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  NUM,
                  'text-sm font-bold text-stone-900 dark:text-stone-50 w-10 text-right'
                )}
              >
                {step.users}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* Cohort grid — the clearest way to see whether anyone actually comes back. */
const RetentionGrid = ({ cohorts }) => {
  if (!cohorts.length) {
    return (
      <p className="text-xs text-stone-500 dark:text-stone-400 py-8 text-center font-medium">
        Not enough history yet.
      </p>
    );
  }

  const weeks = ['w0', 'w1', 'w2', 'w3'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-1">
        <thead>
          <tr>
            <th
              className={cn(MICRO, 'text-stone-500 dark:text-stone-400 text-left font-bold pb-1')}
            >
              Cohort
            </th>
            <th
              className={cn(
                MICRO,
                'text-stone-500 dark:text-stone-400 text-right font-bold pb-1 pr-2'
              )}
            >
              Size
            </th>
            {weeks.map((w, i) => (
              <th
                key={w}
                className={cn(
                  MICRO,
                  'text-stone-500 dark:text-stone-400 text-center font-bold pb-1'
                )}
              >
                W{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.cohort}>
              <td className="text-[11px] font-extrabold text-stone-800 dark:text-stone-100 pr-3 whitespace-nowrap">
                {c.cohort}
              </td>
              <td className={cn(NUM, 'text-[11px] text-stone-500 text-right pr-2')}>{c.size}</td>
              {weeks.map((w) => {
                const pct = c.size ? Math.round((c[w] / c.size) * 100) : 0;
                return (
                  <td key={w} className="px-0.5">
                    <Tip content={`${c[w]} of ${c.size} ran a test`}>
                      <div
                        className="h-7 rounded grid place-items-center transition-transform duration-150 hover:scale-[1.08] cursor-default"
                        style={{
                          // Opacity encodes retention so the row reads as a heat strip.
                          backgroundColor: `rgb(var(--signal-ok) / ${pct === 0 ? 0.05 : 0.12 + (pct / 100) * 0.55})`,
                        }}
                      >
                        <span
                          className={cn(
                            NUM,
                            'text-[10px] font-bold',
                            pct === 0
                              ? 'text-stone-400 dark:text-stone-600'
                              : 'text-stone-800 dark:text-stone-50'
                          )}
                        >
                          {pct}%
                        </span>
                      </div>
                    </Tip>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminOverview = () => {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await AnalyticsService.getOverview(days));
    } catch (err) {
      console.error('Error loading admin overview:', err);
      setError(err.message || 'Unable to load overview');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const { dateLabel, greeting } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    return {
      dateLabel: now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      greeting: hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening',
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 text-stone-500 dark:text-stone-400 animate-spin" />
        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Loading overview</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(PANEL, 'p-6 max-w-md')}>
        <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
          Could not load the overview
        </p>
        <p className="text-xs text-stone-500 mt-1">{error}</p>
        <button
          onClick={load}
          className={cn(
            MICRO,
            'mt-3 rounded-md border border-stone-300 dark:border-white/15 px-2.5 py-1.5 text-stone-700 dark:text-stone-200'
          )}
        >
          Retry
        </button>
      </div>
    );
  }

  const k = data?.kpis || {};
  const eng = data?.engagement || {};
  const econ = data?.economics || {};
  const actions = data?.actions || [];
  const modules = data?.modules || [];
  const trend = data?.trend || [];
  const hourly = data?.hourly || [];
  const maxHourly = hourly.reduce((max, h) => Math.max(max, h.sessions), 0);
  const peakHour = maxHourly ? (hourly.find((h) => h.sessions === maxHourly)?.hour ?? null) : null;

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-8"
    >
      {/* Header */}
      <m.header
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
      >
        <div>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>{dateLabel}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mt-1">
            {greeting}, Admin
          </h1>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1">
            <span className={cn(NUM, 'font-bold text-stone-700 dark:text-stone-200')}>
              {data?.totals?.users ?? 0}
            </span>{' '}
            learners on the platform
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger
            aria-label="Overview window"
            className={cn(
              MICRO,
              'h-8 w-[140px] rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-700 dark:text-stone-200'
            )}
          >
            <Clock className="mr-1.5 h-3 w-3 text-stone-500 dark:text-stone-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOWS.map((w) => (
              <SelectItem key={w.days} value={String(w.days)}>
                {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </m.header>

      <m.div variants={itemVariants}>
        <ServiceStatusStrip />
      </m.div>

      {/* KPI band */}
      <m.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi
          label={`Signups · ${days}d`}
          value={k.signups?.value ?? 0}
          delta={<Delta value={k.signups?.value} prev={k.signups?.prev} />}
          sub={`${k.signups?.prev ?? 0} previous period`}
          tip={`New accounts created in the last ${days} days. The arrow compares it with the ${days} days before that.`}
        />
        <Kpi
          label="Active users"
          value={k.active?.wau ?? 0}
          live
          delta={<Delta value={k.active?.wau} prev={k.active?.prev} />}
          sub={`${k.active?.dau ?? 0} today · ${k.active?.mau ?? 0} monthly`}
          tip="Weekly active users — people who opened the app in the last 7 days. The green light means this number is live."
        />
        <Kpi
          label="Stickiness"
          value={`${k.active?.stickiness ?? 0}%`}
          sub="Daily ÷ monthly actives"
          tip="Of everyone who used the app this month, what share used it today. Above 20% is healthy; it tells you whether people use the app as a habit or only once."
        />
        <Kpi
          label="Paying"
          value={k.paying?.total ?? 0}
          sub={`${k.paying?.conversion ?? 0}% of users · ${k.paying?.premium ?? 0} premium`}
          tip="Users on a Pro or Premium plan, and what share of all signups that represents."
        />
        <Kpi
          label={`AI spend · ${days}d`}
          value={`$${Number(k.aiCost?.usd ?? 0).toFixed(2)}`}
          delta={<Delta value={k.aiCost?.usd} prev={k.aiCost?.prevUsd} invert />}
          sub={`$${Number(k.aiCost?.perActiveUser ?? 0).toFixed(3)} per active · ${k.aiCost?.pricedCalls ?? 0}/${k.aiCost?.totalCalls ?? 0} calls priced`}
          tip="What the AI providers cost you. Rising cost shows red. Only calls that report a price are counted, so treat this as a floor, not the full bill."
        />
      </m.div>

      <div className="grid grid-cols-12 gap-3">
        {/* Action queue */}
        <m.div variants={itemVariants} className="col-span-12 lg:col-span-4">
          <div className={cn(PANEL, 'p-4 h-full')}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Needs you</h3>
              <span className={cn(NUM, 'text-[11px] font-bold text-stone-500 dark:text-stone-400')}>
                {actions.length}
              </span>
            </div>
            {actions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ShieldCheck className="w-6 h-6 text-[rgb(var(--signal-ok))] opacity-60" />
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-2">
                  Nothing waiting on you.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {actions.map((action) => (
                  <Link
                    key={action.key}
                    to={`${createPageUrl('AdminPanel')}?tab=${action.tab}`}
                    className="group flex items-start gap-2.5 p-2.5 -mx-1 rounded-lg hover:bg-stone-50 dark:hover:bg-white/[0.03] hover:translate-x-0.5 active:scale-[0.99] transition-all duration-150"
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                        SEVERITY[action.severity] || SEVERITY.low
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}
                        >
                          {action.count}
                        </span>
                        <span className="text-[11px] font-extrabold text-stone-800 dark:text-stone-100 leading-tight">
                          {action.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium mt-0.5 leading-snug">
                        {action.detail}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-600 dark:group-hover:text-stone-300 shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </m.div>

        {/* Activation funnel */}
        <m.div variants={itemVariants} className="col-span-12 lg:col-span-8">
          <div className={cn(PANEL, 'p-4 h-full')}>
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Activation funnel · all time
                </h3>
                <InfoTip>
                  How far people get through the product. Each bar is the number of users who
                  reached that step. The red label marks the step losing the most people — the
                  free-to-paid step is excluded because it is always the biggest drop.
                </InfoTip>
              </div>
              <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                share of signups
              </span>
            </div>
            <Funnel steps={data?.funnel || []} />
          </div>
        </m.div>

        {/* Trend */}
        <m.div variants={itemVariants} className="col-span-12 lg:col-span-8">
          <div className={cn(PANEL, 'p-4 h-full flex flex-col')}>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                Signups vs active users
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    MICRO,
                    'text-stone-500 dark:text-stone-400 flex items-center gap-1.5'
                  )}
                >
                  <span className="w-2 h-0.5 rounded-full bg-[rgb(var(--signal-ok))]" />
                  Signups
                </span>
                <span
                  className={cn(
                    MICRO,
                    'text-stone-500 dark:text-stone-400 flex items-center gap-1.5'
                  )}
                >
                  <span className="w-2 h-0.5 rounded-full bg-stone-400" />
                  Active
                </span>
              </div>
            </div>
            <div className="h-[210px] sm:h-[220px] w-full flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ovSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--signal-ok))" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="rgb(var(--signal-ok))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(120,113,108,0.18)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a8a29e', fontSize: 9, fontWeight: 700 }}
                    tickMargin={8}
                    minTickGap={16}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tick={{ fill: '#a8a29e', fontSize: 9, fontWeight: 700 }}
                  />
                  <Tooltip
                    cursor={{ stroke: 'rgba(120,113,108,0.35)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-[#131315] px-3 py-2 shadow-lg">
                          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1')}>
                            {label}
                          </p>
                          {payload.map((p) => (
                            <p
                              key={p.dataKey}
                              className="text-[11px] font-bold text-stone-800 dark:text-stone-100 capitalize"
                            >
                              {p.dataKey}: <span className={NUM}>{p.value}</span>
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stroke="rgb(var(--signal-ok))"
                    strokeWidth={2}
                    fill="url(#ovSignups)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={900}
                  />
                  <Area
                    type="monotone"
                    dataKey="active"
                    stroke="#a8a29e"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    fill="none"
                    activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </m.div>

        {/* Recent signups */}
        <m.div variants={itemVariants} className="col-span-12 lg:col-span-4">
          <div className={cn(PANEL, 'p-4 h-full flex flex-col justify-between')}>
            <div>
              <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-2')}>
                Latest signups
              </h3>
              <div className="space-y-px">
                {(data?.recentSignups || []).slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2.5 py-1.5 px-1.5 -mx-1.5 rounded-md border-b border-stone-100 dark:border-white/[0.05] last:border-0 hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="w-6 h-6 rounded-md bg-stone-100 dark:bg-white/[0.06] grid place-items-center text-[9px] font-black text-stone-500 dark:text-stone-300 shrink-0">
                      {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-extrabold text-stone-900 dark:text-stone-50 truncate leading-tight">
                        {user.full_name || user.email?.split('@')[0]}
                      </p>
                      <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate')}>
                        {user.onboarding_completed ? 'Onboarded' : 'Not onboarded'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn(NUM, 'text-[10px] font-bold text-stone-500')}>
                        {new Date(user.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      {user.subscription_tier && user.subscription_tier !== 'free' && (
                        <p className={cn(MICRO, 'text-[rgb(var(--signal-ok))]')}>
                          {user.subscription_tier}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {(data?.recentSignups || []).length === 0 && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 py-6 text-center font-medium">
                    No signups yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </m.div>

        {/* Cohort retention */}
        <m.div variants={itemVariants} className="col-span-12 lg:col-span-7">
          <div className={cn(PANEL, 'p-4 h-full')}>
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Weekly retention by signup cohort
                </h3>
                <InfoTip>
                  Each row is everyone who signed up that week. W0 is the share who took a test in
                  their signup week, W1 the share who came back the week after, and so on. Darker
                  means more people returned — empty cells mean nobody came back.
                </InfoTip>
              </div>
              <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                % who ran a test
              </span>
            </div>
            <RetentionGrid cohorts={data?.retention || []} />
          </div>
        </m.div>

        {/* Engagement depth + unit economics */}
        <m.div variants={itemVariants} className="col-span-12 lg:col-span-5">
          <div className={cn(PANEL, 'p-4 h-full flex flex-col gap-4')}>
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Engagement depth
                </h3>
                <span className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}>
                  {eng.repeatRate ?? 0}%
                  <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 ml-1.5')}>
                    come back
                  </span>
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { label: 'Tried a test', n: eng.startedUsers ?? 0 },
                  { label: 'Returned (2+)', n: eng.repeatUsers ?? 0 },
                  { label: 'Power users (5+)', n: eng.powerUsers ?? 0 },
                ].map((row) => {
                  const share = eng.startedUsers ? (row.n / eng.startedUsers) * 100 : 0;
                  return (
                    <div key={row.label} className="flex items-center gap-3">
                      <span
                        className={cn(MICRO, 'text-stone-500 dark:text-stone-400 w-28 shrink-0')}
                      >
                        {row.label}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-stone-100 dark:bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[rgb(var(--signal-ok))]"
                          style={{ width: `${Math.max(share, 1)}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          NUM,
                          'text-[11px] font-bold text-stone-700 dark:text-stone-200 w-8 text-right'
                        )}
                      >
                        {row.n}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-stone-200 dark:border-white/[0.07] grid grid-cols-2 gap-4">
              <div>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Cost / completed test
                </p>
                <p className={cn(NUM, 'text-lg font-bold text-stone-900 dark:text-stone-50 mt-1')}>
                  ${Number(econ.costPerCompletedTest ?? 0).toFixed(4)}
                </p>
              </div>
              <div>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Cost / paying user
                </p>
                <p className={cn(NUM, 'text-lg font-bold text-stone-900 dark:text-stone-50 mt-1')}>
                  ${Number(econ.costPerPayingUser ?? 0).toFixed(4)}
                </p>
              </div>
              <div>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Mock vs practice</p>
                <p className={cn(NUM, 'text-lg font-bold text-stone-900 dark:text-stone-50 mt-1')}>
                  {eng.mockSessions ?? 0}
                  <span className="text-stone-500 dark:text-stone-400">
                    {' '}
                    / {eng.practiceSessions ?? 0}
                  </span>
                </p>
              </div>
              <div>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Cost data coverage
                </p>
                <p
                  className={cn(
                    NUM,
                    'text-lg font-bold mt-1',
                    (econ.costCoverage ?? 0) < 80
                      ? 'text-[rgb(var(--signal-warn))]'
                      : 'text-stone-900 dark:text-stone-50'
                  )}
                >
                  {econ.costCoverage ?? 0}%
                </p>
              </div>
            </div>
          </div>
        </m.div>

        {/* When the platform is actually used */}
        <m.div variants={itemVariants} className="col-span-12 lg:col-span-6">
          <div className={cn(PANEL, 'p-4 h-full flex flex-col justify-between')}>
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Activity by hour · last 30 days
                </h3>
                <InfoTip>
                  Test sessions grouped by hour of day (UTC). Use the quiet hours for deploys,
                  migrations and maintenance mode, and make sure support covers the busy ones.
                </InfoTip>
              </div>
              <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                peak{' '}
                <span className={cn(NUM, 'text-stone-700 dark:text-stone-200')}>
                  {peakHour === null ? '—' : `${String(peakHour).padStart(2, '0')}:00`}
                </span>{' '}
                UTC
              </span>
            </div>
            <div className="flex items-end gap-[3px] h-32 pt-4">
              {hourly.map((h, i) => {
                const share = maxHourly ? (h.sessions / maxHourly) * 100 : 0;
                return (
                  <Tip
                    key={h.hour}
                    content={`${String(h.hour).padStart(2, '0')}:00 UTC — ${h.sessions} session${h.sessions === 1 ? '' : 's'}`}
                  >
                    <div className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                      <div className="w-full flex-1 flex items-end">
                        <m.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(share, 2)}%` }}
                          transition={{ duration: 0.5, delay: i * 0.008, ease: [0.23, 1, 0.32, 1] }}
                          className={cn(
                            'w-full rounded-sm transition-colors',
                            h.hour === peakHour
                              ? 'bg-[rgb(var(--signal-ok))]'
                              : 'bg-[rgb(var(--signal-ok)/0.28)] group-hover:bg-[rgb(var(--signal-ok)/0.55)]'
                          )}
                        />
                      </div>
                      {h.hour % 3 === 0 && (
                        <span className={cn(NUM, 'text-[8px] text-stone-500 dark:text-stone-400')}>
                          {h.hour}
                        </span>
                      )}
                    </div>
                  </Tip>
                );
              })}
            </div>
          </div>
        </m.div>

        {/* Module engagement */}
        <m.div variants={itemVariants} className="col-span-12 lg:col-span-6">
          <div className={cn(PANEL, 'p-4 h-full flex flex-col justify-between')}>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Module engagement</h3>
              <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                completion = sessions finished, not scores
              </span>
            </div>
            <div className="space-y-1">
              {modules.map((mod) => {
                const weak = mod.completion < 50;
                return (
                  <div
                    key={mod.module}
                    className="grid grid-cols-12 items-center gap-3 py-2.5 px-1.5 -mx-1.5 rounded-md border-b border-stone-100 dark:border-white/[0.05] last:border-0 hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="col-span-3 sm:col-span-2 text-[11px] font-extrabold text-stone-900 dark:text-stone-50">
                      {mod.module}
                    </span>
                    <span
                      className={cn(NUM, 'col-span-3 sm:col-span-2 text-[11px] text-stone-500')}
                    >
                      {mod.users} users
                    </span>
                    <span
                      className={cn(NUM, 'col-span-3 sm:col-span-2 text-[11px] text-stone-500')}
                    >
                      {mod.sessions} sessions
                    </span>
                    <div className="col-span-12 sm:col-span-5 order-last sm:order-none">
                      <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-white/[0.05] overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-[width] duration-700 ease-out',
                            weak ? 'bg-[rgb(var(--signal-warn))]' : 'bg-[rgb(var(--signal-ok))]'
                          )}
                          style={{ width: `${mod.completion}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={cn(
                        NUM,
                        'col-span-3 sm:col-span-1 text-[11px] font-bold text-right',
                        weak
                          ? 'text-[rgb(var(--signal-warn))]'
                          : 'text-stone-900 dark:text-stone-50'
                      )}
                    >
                      {mod.completion}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </m.div>
      </div>
    </m.div>
  );
};

export default AdminOverview;
