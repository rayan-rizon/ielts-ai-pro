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
import { ArrowDownRight, ArrowUpRight, ChevronRight, Clock, ShieldCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import ServiceStatusStrip from '../ServiceStatusStrip';
import { NUM, MICRO, PANEL, Kpi, InfoTip, Tip } from '../ui/primitives';

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

const pctChange = (value, previous) => {
  if (!previous) return value > 0 ? 100 : null;
  return Math.round(((value - previous) / previous) * 100);
};

const Delta = ({ value, previous, invert = false }) => {
  const change = pctChange(value, previous);
  if (change === null || change === 0) {
    return <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>flat</span>;
  }

  const isGood = invert ? change < 0 : change > 0;
  const Icon = change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-bold',
        isGood ? 'text-[rgb(var(--signal-ok))]' : 'text-[rgb(var(--signal-fault))]'
      )}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(change)}%
    </span>
  );
};

const OverviewHeader = ({ dateLabel, greeting, totalUsers, days, onDaysChange }) => (
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
          {totalUsers}
        </span>{' '}
        learners on the platform
      </p>
    </div>
    <Select value={String(days)} onValueChange={(value) => onDaysChange(Number(value))}>
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
        {WINDOWS.map((window) => (
          <SelectItem key={window.days} value={String(window.days)}>
            {window.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </m.header>
);

const SignupsKpi = ({ kpis, displayDays }) => (
  <Kpi
    label={`Signups · ${displayDays}d`}
    value={kpis.signups?.value ?? 0}
    delta={<Delta value={kpis.signups?.value} previous={kpis.signups?.prev} />}
    sub={`${kpis.signups?.prev ?? 0} previous period`}
    tip={`New accounts in the last ${displayDays} days vs. the previous period.`}
  />
);

const ActiveUsersKpi = ({ kpis, displayDays }) => (
  <Kpi
    label={`Active users · ${displayDays}d`}
    value={kpis.active?.value ?? kpis.active?.wau ?? 0}
    live
    delta={<Delta value={kpis.active?.value ?? kpis.active?.wau} previous={kpis.active?.prev} />}
    sub={`${kpis.active?.dau ?? 0} today · ${kpis.active?.mau ?? 0} monthly`}
    tip={`Learners active in the last ${displayDays} days vs. the previous period.`}
  />
);

const StickinessKpi = ({ kpis }) => (
  <Kpi
    label="Stickiness"
    value={`${kpis.active?.stickiness ?? 0}%`}
    sub="Daily ÷ monthly actives"
    tip="Share of monthly active users active today."
  />
);

const PayingKpi = ({ kpis }) => (
  <Kpi
    label="Paying"
    value={kpis.paying?.total ?? 0}
    sub={`${kpis.paying?.conversion ?? 0}% of users · ${kpis.paying?.premium ?? 0} premium`}
    tip="Pro and Premium users as a share of all signups."
  />
);

const RevenueKpi = ({ kpis, displayDays }) => (
  <Kpi
    label={`Revenue · ${displayDays}d`}
    value={`$${Number(kpis.revenue?.usd ?? 0).toFixed(2)}`}
    delta={<Delta value={kpis.revenue?.usd} previous={kpis.revenue?.prevUsd} />}
    sub={`৳${Number(kpis.revenue?.bdt ?? 0).toLocaleString()} BDT approved`}
    tip="Paid revenue by currency, deduplicated by transaction ID."
  />
);

const AiSpendKpi = ({ kpis, displayDays }) => (
  <Kpi
    label={`AI spend · ${displayDays}d`}
    value={`$${Number(kpis.aiCost?.usd ?? 0).toFixed(2)}`}
    delta={<Delta value={kpis.aiCost?.usd} previous={kpis.aiCost?.prevUsd} invert />}
    sub={`$${Number(kpis.aiCost?.perActiveUser ?? 0).toFixed(3)} per active · ${kpis.aiCost?.pricedCalls ?? 0}/${kpis.aiCost?.totalCalls ?? 0} calls priced`}
    tip="Reported AI provider cost. Unpriced calls are excluded."
  />
);

const OverviewKpis = ({ kpis, displayDays }) => (
  <m.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
    <SignupsKpi kpis={kpis} displayDays={displayDays} />
    <ActiveUsersKpi kpis={kpis} displayDays={displayDays} />
    <StickinessKpi kpis={kpis} />
    <PayingKpi kpis={kpis} />
    <RevenueKpi kpis={kpis} displayDays={displayDays} />
    <AiSpendKpi kpis={kpis} displayDays={displayDays} />
  </m.div>
);

const actionUrl = (action) => {
  const status = action.subscriptionStatus
    ? `&subscriptionStatus=${encodeURIComponent(action.subscriptionStatus)}`
    : '';
  return `${createPageUrl('AdminPanel')}?tab=${action.tab}${status}`;
};

const ActionQueue = ({ actions }) => (
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
              to={actionUrl(action)}
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
                  <span className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}>
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
);

const FunnelStep = ({ step, previousUsers, top, isWorst }) => {
  const share = (step.users / top) * 100;
  const dropPct =
    previousUsers === null
      ? null
      : Math.round(((previousUsers - step.users) / (previousUsers || 1)) * 100);
  const highlight = isWorst && dropPct > 0;

  return (
    <div>
      {dropPct > 0 && (
        <div className="flex items-center gap-1.5 pl-1 pb-1">
          <span className="w-px h-2.5 bg-stone-200 dark:bg-white/10" />
          <span
            className={cn(
              MICRO,
              highlight ? 'text-[rgb(var(--signal-fault))]' : 'text-stone-500 dark:text-stone-400'
            )}
          >
            −{dropPct}% drop{highlight ? ' · biggest leak' : ''}
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Tip
          content={
            previousUsers === null
              ? `${step.users} signed up`
              : `${step.users} of ${top} (${Math.round(share)}%) reached this step${dropPct > 0 ? ` — lost ${dropPct}% since the previous step` : ''}`
          }
        >
          <div className="relative flex-1 h-8 rounded-md bg-stone-100 dark:bg-white/[0.04] overflow-hidden cursor-default">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-md transition-[width] duration-700',
                highlight ? 'bg-[rgb(var(--signal-fault)/0.22)]' : 'bg-[rgb(var(--signal-ok)/0.18)]'
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
        </Tip>
        <span
          className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50 w-10 text-right')}
        >
          {step.users}
        </span>
      </div>
    </div>
  );
};

const Funnel = ({ steps }) => {
  const top = steps[0]?.users || 1;
  const activationDrops = steps.slice(1, -1).map((step, index) => {
    const previous = steps[index]?.users || 1;
    return (previous - step.users) / previous;
  });
  const worstIndex = activationDrops.length
    ? activationDrops.indexOf(Math.max(...activationDrops)) + 1
    : -1;

  return (
    <div className="space-y-2.5">
      {steps.map((step, index) => (
        <FunnelStep
          key={step.key}
          step={step}
          previousUsers={index === 0 ? null : steps[index - 1].users}
          top={top}
          isWorst={index === worstIndex}
        />
      ))}
    </div>
  );
};

const FunnelPanel = ({ steps }) => (
  <m.div variants={itemVariants} className="col-span-12 lg:col-span-8">
    <div className={cn(PANEL, 'p-4 h-full')}>
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Activation funnel · all time
          </h3>
          <InfoTip>
            User progress through key product milestones. Red marks the largest drop-off.
          </InfoTip>
        </div>
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>share of signups</span>
      </div>
      <Funnel steps={steps} />
    </div>
  </m.div>
);

const trendLabel = (key) => {
  if (key === 'testUsers') return 'Test takers';
  if (key === 'active') return 'Last seen';
  return 'Signups';
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-[#131315] px-3 py-2 shadow-lg">
      <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1')}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-[11px] font-bold text-stone-800 dark:text-stone-100">
          {trendLabel(entry.dataKey)}: <span className={NUM}>{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const TrendPanel = ({ trend, usesTestUsers }) => {
  const comparisonLabel = usesTestUsers ? 'Test takers' : 'Last seen';
  return (
    <m.div variants={itemVariants} className="col-span-12 lg:col-span-8">
      <div className={cn(PANEL, 'p-4 h-full flex flex-col')}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Signups vs {comparisonLabel.toLowerCase()}
          </h3>
          <div className="flex items-center gap-3">
            <span
              className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}
            >
              <span className="w-2 h-0.5 rounded-full bg-[rgb(var(--signal-ok))]" /> Signups
            </span>
            <span
              className={cn(MICRO, 'text-stone-500 dark:text-stone-400 flex items-center gap-1.5')}
            >
              <span className="w-2 h-0.5 rounded-full bg-stone-400" /> {comparisonLabel}
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
              <Tooltip cursor={{ stroke: 'rgba(120,113,108,0.35)' }} content={<TrendTooltip />} />
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
                dataKey={usesTestUsers ? 'testUsers' : 'active'}
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
  );
};

const RecentSignupsPanel = ({ users }) => (
  <m.div variants={itemVariants} className="col-span-12 lg:col-span-4">
    <div className={cn(PANEL, 'p-4 h-full flex flex-col justify-between')}>
      <div>
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-2')}>Latest signups</h3>
        <div className="space-y-px">
          {users.slice(0, 5).map((user) => (
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
          {users.length === 0 && (
            <p className="text-xs text-stone-500 dark:text-stone-400 py-6 text-center font-medium">
              No signups yet.
            </p>
          )}
        </div>
      </div>
    </div>
  </m.div>
);

const RetentionCell = ({ cohort, week }) => {
  const isMature = cohort[week] !== null && cohort[week] !== undefined;
  const percentage = isMature && cohort.size ? Math.round((cohort[week] / cohort.size) * 100) : 0;
  const backgroundColor = isMature
    ? `rgb(var(--signal-ok) / ${percentage === 0 ? 0.05 : 0.12 + (percentage / 100) * 0.55})`
    : 'rgb(var(--signal-idle) / 0.08)';

  return (
    <td className="px-0.5">
      <Tip
        content={
          isMature
            ? `${cohort[week]} of ${cohort.size} ran a test`
            : 'This cohort has not reached this week yet'
        }
      >
        <div
          className="h-7 rounded grid place-items-center transition-transform duration-150 hover:scale-[1.08] cursor-default"
          style={{ backgroundColor }}
        >
          <span
            className={cn(
              NUM,
              'text-[10px] font-bold',
              !isMature || percentage === 0
                ? 'text-stone-400 dark:text-stone-600'
                : 'text-stone-800 dark:text-stone-50'
            )}
          >
            {isMature ? `${percentage}%` : '—'}
          </span>
        </div>
      </Tip>
    </td>
  );
};

const RetentionGrid = ({ cohorts }) => {
  const weeks = ['w0', 'w1', 'w2', 'w3'];
  if (!cohorts.length) {
    return (
      <p className="text-xs text-stone-500 dark:text-stone-400 py-8 text-center font-medium">
        Not enough history yet.
      </p>
    );
  }

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
            {weeks.map((week, index) => (
              <th
                key={week}
                className={cn(
                  MICRO,
                  'text-stone-500 dark:text-stone-400 text-center font-bold pb-1'
                )}
              >
                W{index}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.cohort}>
              <td className="text-[11px] font-extrabold text-stone-800 dark:text-stone-100 pr-3 whitespace-nowrap">
                {cohort.cohort}
              </td>
              <td className={cn(NUM, 'text-[11px] text-stone-500 text-right pr-2')}>
                {cohort.size}
              </td>
              {weeks.map((week) => (
                <RetentionCell key={week} cohort={cohort} week={week} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RetentionPanel = ({ cohorts }) => (
  <m.div variants={itemVariants} className="col-span-12 lg:col-span-7">
    <div className={cn(PANEL, 'p-4 h-full')}>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Weekly retention by signup cohort
          </h3>
          <InfoTip>
            Weekly return rate by signup cohort. Darker cells mean more users returned.
          </InfoTip>
        </div>
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>% who ran a test</span>
      </div>
      <RetentionGrid cohorts={cohorts} />
    </div>
  </m.div>
);

const EngagementBar = ({ label, value, total }) => {
  const share = total ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 w-28 shrink-0')}>{label}</span>
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
        {value}
      </span>
    </div>
  );
};

const EngagementPanel = ({ engagement, economics, displayDays }) => {
  const rows = [
    { label: 'Tried a test', value: engagement.startedUsers ?? 0 },
    { label: 'Returned (2+)', value: engagement.repeatUsers ?? 0 },
    { label: 'Power users (5+)', value: engagement.powerUsers ?? 0 },
  ];
  return (
    <m.div variants={itemVariants} className="col-span-12 lg:col-span-5">
      <div className={cn(PANEL, 'p-4 h-full flex flex-col gap-4')}>
        <div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Engagement depth</h3>
              <InfoTip>Share of test takers who returned for 2+ or 5+ tests.</InfoTip>
            </div>
            <span className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}>
              {engagement.repeatRate ?? 0}%
              <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 ml-1.5')}>
                come back
              </span>
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {rows.map((row) => (
              <EngagementBar
                key={row.label}
                label={row.label}
                value={row.value}
                total={engagement.startedUsers}
              />
            ))}
          </div>
        </div>
        <div className="pt-3 border-t border-dashed border-stone-200 dark:border-white/[0.07] grid grid-cols-2 gap-4">
          <div>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              AI cost / completed test · {displayDays}d
            </p>
            <p className={cn(NUM, 'text-lg font-bold text-stone-900 dark:text-stone-50 mt-1')}>
              ${Number(economics.costPerCompletedTest ?? 0).toFixed(4)}
            </p>
          </div>
          <div>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              AI cost / current paying user · {displayDays}d
            </p>
            <p className={cn(NUM, 'text-lg font-bold text-stone-900 dark:text-stone-50 mt-1')}>
              ${Number(economics.costPerPayingUser ?? 0).toFixed(4)}
            </p>
          </div>
          <div>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              Mock / practice · all time
            </p>
            <p className={cn(NUM, 'text-lg font-bold text-stone-900 dark:text-stone-50 mt-1')}>
              {engagement.mockSessions ?? 0}
              <span className="text-stone-500 dark:text-stone-400">
                {' '}
                / {engagement.practiceSessions ?? 0}
              </span>
            </p>
            {(engagement.otherModeSessions ?? 0) > 0 && (
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
                {engagement.otherModeSessions} other mode
              </p>
            )}
          </div>
          <div>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Cost data coverage</p>
            <p
              className={cn(
                NUM,
                'text-lg font-bold mt-1',
                (economics.costCoverage ?? 0) < 80
                  ? 'text-[rgb(var(--signal-warn))]'
                  : 'text-stone-900 dark:text-stone-50'
              )}
            >
              {economics.costCoverage ?? 0}%
            </p>
          </div>
        </div>
      </div>
    </m.div>
  );
};

const formatHour12 = (hour) => {
  if (hour === null || hour === undefined) return '—';
  const period = hour < 12 ? 'AM' : 'PM';
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}:00 ${period}`;
};

const HourlyActivityPanel = ({ hourly, maxHourly, peakHour }) => (
  <m.div variants={itemVariants} className="col-span-12 lg:col-span-6">
    <div className={cn(PANEL, 'p-4 h-full flex flex-col justify-between')}>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Activity by hour · last 30 days
          </h3>
          <InfoTip>Test sessions by hour in Bangladesh time (GMT+6).</InfoTip>
        </div>
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
          peak{' '}
          <span className={cn(NUM, 'text-stone-700 dark:text-stone-200')}>
            {formatHour12(peakHour)}
          </span>{' '}
          BDT
        </span>
      </div>
      <div className="flex gap-[3px] h-32 pt-4">
        {hourly.map((entry, index) => {
          const share = maxHourly ? (entry.sessions / maxHourly) * 100 : 0;
          return (
            <Tip
              key={entry.hour}
              content={`${formatHour12(entry.hour)} BDT — ${entry.sessions} session${entry.sessions === 1 ? '' : 's'}`}
            >
              <div className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                <div className="w-full flex-1 flex items-end">
                  <m.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(share, 2)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.008, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                      'w-full rounded-sm transition-colors',
                      entry.hour === peakHour
                        ? 'bg-[rgb(var(--signal-ok))]'
                        : 'bg-[rgb(var(--signal-ok)/0.28)] group-hover:bg-[rgb(var(--signal-ok)/0.55)]'
                    )}
                  />
                </div>
                {entry.hour % 3 === 0 && (
                  <span className={cn(NUM, 'text-[8px] text-stone-500 dark:text-stone-400')}>
                    {entry.hour}
                  </span>
                )}
              </div>
            </Tip>
          );
        })}
      </div>
    </div>
  </m.div>
);

const ModuleEngagementPanel = ({ modules }) => (
  <m.div variants={itemVariants} className="col-span-12 lg:col-span-6">
    <div className={cn(PANEL, 'p-4 h-full flex flex-col justify-between')}>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Module engagement</h3>
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
          completion = sessions finished, not scores
        </span>
      </div>
      <div className="space-y-1">
        {modules.map((module) => {
          const isWeak = module.completion < 50;
          return (
            <div
              key={module.module}
              className="grid grid-cols-12 items-center gap-3 py-2.5 px-1.5 -mx-1.5 rounded-md border-b border-stone-100 dark:border-white/[0.05] last:border-0 hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              <span className="col-span-3 sm:col-span-2 text-[11px] font-extrabold text-stone-900 dark:text-stone-50">
                {module.module}
              </span>
              <span className={cn(NUM, 'col-span-3 sm:col-span-2 text-[11px] text-stone-500')}>
                {module.users} users
              </span>
              <span className={cn(NUM, 'col-span-3 sm:col-span-2 text-[11px] text-stone-500')}>
                {module.sessions} sessions
              </span>
              <div className="col-span-12 sm:col-span-5 order-last sm:order-none">
                <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-white/[0.05] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width] duration-700 ease-out',
                      isWeak ? 'bg-[rgb(var(--signal-warn))]' : 'bg-[rgb(var(--signal-ok))]'
                    )}
                    style={{ width: `${module.completion}%` }}
                  />
                </div>
              </div>
              <span
                className={cn(
                  NUM,
                  'col-span-3 sm:col-span-1 text-[11px] font-bold text-right',
                  isWeak ? 'text-[rgb(var(--signal-warn))]' : 'text-stone-900 dark:text-stone-50'
                )}
              >
                {module.completion}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </m.div>
);

const CHANNEL_LABELS = {
  paid_social: 'Paid social (Meta ads)',
  paid_search: 'Paid search (Google ads)',
  organic_search: 'Organic search',
  organic_social: 'Organic social',
  referral: 'Referral',
  email: 'Email',
  direct: 'Direct',
  other: 'Other',
  unknown: 'Unknown',
};

const CHANNEL_COLORS = {
  paid_social: 'bg-[#1877F2]',
  paid_search: 'bg-[rgb(var(--signal-ok))]',
  organic_search: 'bg-[rgb(var(--signal-ok))]',
  organic_social: 'bg-[#1877F2]',
  referral: 'bg-[rgb(var(--signal-warn))]',
  email: 'bg-stone-400',
  direct: 'bg-stone-400',
  other: 'bg-stone-300',
  unknown: 'bg-stone-200 dark:bg-white/10',
};

const SignupChannelsPanel = ({ channels, displayDays }) => {
  const total = channels.reduce((sum, row) => sum + (row.signups || 0), 0);
  const max = channels.reduce((peak, row) => Math.max(peak, row.signups || 0), 0);

  return (
    <m.div variants={itemVariants} className="col-span-12 lg:col-span-6">
      <div className={cn(PANEL, 'p-4 h-full flex flex-col justify-between')}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Signups by channel · last {displayDays}d
          </h3>
          <InfoTip>
            First-touch channel captured from UTM params, Google/Meta click ids, and referrer at
            landing. "Unknown" is signups from before this was tracked.
          </InfoTip>
        </div>
        <div className="space-y-1">
          {channels.map((row) => {
            const key = row.channel || 'unknown';
            const share = total > 0 ? Math.round((100 * (row.signups || 0)) / total) : 0;
            const width = max > 0 ? Math.max(4, Math.round((100 * (row.signups || 0)) / max)) : 0;
            return (
              <div
                key={key}
                className="grid grid-cols-12 items-center gap-3 py-2.5 px-1.5 -mx-1.5 rounded-md border-b border-stone-100 dark:border-white/[0.05] last:border-0 hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <span className="col-span-5 sm:col-span-4 text-[11px] font-extrabold text-stone-900 dark:text-stone-50 truncate">
                  {CHANNEL_LABELS[key] || key}
                </span>
                <div className="col-span-12 sm:col-span-5 order-last sm:order-none">
                  <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-white/[0.05] overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-700 ease-out',
                        CHANNEL_COLORS[key] || 'bg-stone-300'
                      )}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
                <span className={cn(NUM, 'col-span-4 sm:col-span-2 text-[11px] text-stone-500')}>
                  {row.signups} signups
                </span>
                <span
                  className={cn(
                    NUM,
                    'col-span-3 sm:col-span-1 text-[11px] font-bold text-right text-stone-900 dark:text-stone-50'
                  )}
                >
                  {share}%
                </span>
              </div>
            );
          })}
          {channels.length === 0 && (
            <p className="text-xs text-stone-500 dark:text-stone-400 py-6 text-center font-medium">
              No signups in this window.
            </p>
          )}
        </div>
      </div>
    </m.div>
  );
};

const objectOrEmpty = (value) => value || {};
const arrayOrEmpty = (value) => value || [];
const windowOrFallback = (value, fallback) => value ?? fallback;

export const AdminOverviewSections = ({
  data,
  days,
  dateLabel,
  greeting,
  onDaysChange,
  hourly,
  maxHourly,
  peakHour,
}) => {
  const kpis = objectOrEmpty(data.kpis);
  const engagement = objectOrEmpty(data.engagement);
  const economics = objectOrEmpty(data.economics);
  const displayDays = windowOrFallback(data.windowDays, days);

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-8"
    >
      <OverviewHeader
        dateLabel={dateLabel}
        greeting={greeting}
        totalUsers={data.totals?.users ?? 0}
        days={days}
        onDaysChange={onDaysChange}
      />
      <m.div variants={itemVariants}>
        <ServiceStatusStrip />
      </m.div>
      <OverviewKpis kpis={kpis} displayDays={displayDays} />
      <div className="grid grid-cols-12 gap-3">
        <ActionQueue actions={arrayOrEmpty(data.actions)} />
        <FunnelPanel steps={arrayOrEmpty(data.funnel)} />
        <TrendPanel
          trend={arrayOrEmpty(data.trend)}
          usesTestUsers={data.trendMetric === 'testUsers'}
        />
        <RecentSignupsPanel users={arrayOrEmpty(data.recentSignups)} />
        <RetentionPanel cohorts={arrayOrEmpty(data.retention)} />
        <EngagementPanel engagement={engagement} economics={economics} displayDays={displayDays} />
        <HourlyActivityPanel hourly={hourly} maxHourly={maxHourly} peakHour={peakHour} />
        <ModuleEngagementPanel modules={arrayOrEmpty(data.modules)} />
        <SignupChannelsPanel channels={arrayOrEmpty(data.channels)} displayDays={displayDays} />
      </div>
    </m.div>
  );
};
