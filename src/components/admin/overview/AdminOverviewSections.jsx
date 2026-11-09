import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import WorldMap, { regions as worldMapRegions } from 'react-svg-worldmap';
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
  Globe2,
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
import ServiceStatusStrip from '../ServiceStatusStrip';
import { SignupSourceMark, channelMeta } from '../shared/signupChannel';
import { countryName, countryShortLabel } from '../shared/country';
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

const WORLD_MAP_CODES = new Set(worldMapRegions.map(({ code }) => code.toLowerCase()));

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
      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mt-1">
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
          'h-8 w-full sm:w-[140px] rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-700 dark:text-stone-200'
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

const ActiveUsersKpi = ({ kpis, displayDays }) => {
  const active = kpis.active || {};
  const comparisonReady =
    active.comparisonReady === true && active.comparisonBasis === 'daily_activity_history';
  const hasExactCalendarMetrics = active.comparisonBasis === 'daily_activity_history';
  const comparisonDate = active.comparisonAvailableOn
    ? new Date(`${active.comparisonAvailableOn}T00:00:00+06:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Dhaka',
      })
    : null;

  return (
    <Kpi
      label={`Active users · ${displayDays}d`}
      value={active.value ?? active.wau ?? 0}
      live
      delta={
        comparisonReady ? (
          <Delta value={active.value ?? active.wau} previous={active.prev} />
        ) : (
          <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500')}>
            {hasExactCalendarMetrics ? 'baseline building' : 'history pending'}
          </span>
        )
      }
      sub={
        hasExactCalendarMetrics
          ? `${active.today ?? 0} today BDT · ${active.last30Days ?? 0} last 30d`
          : 'Exact daily breakdown unavailable'
      }
      tip={
        !hasExactCalendarMetrics
          ? `Unique signed-in learners active during the current ${displayDays}-day Bangladesh calendar window. Exact daily and comparison history requires the activity-history migration.`
          : comparisonReady
            ? `Unique signed-in learners active during the current ${displayDays}-day Bangladesh calendar window vs. the complete previous window.`
            : `Unique signed-in learners active during the current ${displayDays}-day Bangladesh calendar window. The first exact comparison${comparisonDate ? ` is available ${comparisonDate}` : ' is still building'}; incomplete historical data is never shown as a trend.`
      }
    />
  );
};

const StickinessKpi = ({ kpis }) => {
  const hasExactCalendarMetrics = kpis.active?.comparisonBasis === 'daily_activity_history';

  return (
    <Kpi
      label="Stickiness"
      value={hasExactCalendarMetrics ? `${kpis.active?.stickiness ?? 0}%` : '—'}
      sub={hasExactCalendarMetrics ? 'Today BDT ÷ last 30d' : 'Exact daily basis pending'}
      tip="Share of learners active in the last 30 Bangladesh calendar days who were active today."
    />
  );
};

const PayingKpi = ({ kpis }) => (
  <Kpi
    label="Paying"
    value={kpis.paying?.total ?? 0}
    sub={`${kpis.paying?.conversion ?? 0}% of users · ${kpis.paying?.premium ?? 0} premium`}
    tip="Pro and Premium users with a recorded successful payment, as a share of all signups."
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
              className="group flex items-start gap-2.5 p-2.5 -mx-1 rounded-lg hover:bg-stone-50 dark:hover:bg-white/3 hover:translate-x-0.5 active:scale-[0.99] transition-all duration-150"
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
      <div className="flex items-center gap-2 sm:gap-3">
        <Tip
          content={
            previousUsers === null
              ? `${step.users} signed up`
              : `${step.users} of ${top} (${Math.round(share)}%) reached this step${dropPct > 0 ? ` — lost ${dropPct}% since the previous step` : ''}`
          }
        >
          <div className="relative flex-1 h-8 rounded-md bg-stone-100 dark:bg-white/4 overflow-hidden cursor-default">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-md transition-[width] duration-700',
                highlight ? 'bg-[rgb(var(--signal-fault)/0.22)]' : 'bg-[rgb(var(--signal-ok)/0.18)]'
              )}
              style={{ width: `${Math.max(share, 3)}%` }}
            />
            <div className="relative h-full flex items-center justify-between px-2.5 sm:px-3">
              <span className="text-[11px] font-extrabold text-stone-800 dark:text-stone-100 truncate">
                {step.label}
              </span>
              <span
                className={cn(NUM, 'text-[11px] font-bold text-stone-500 shrink-0 ml-1.5 sm:ml-2')}
              >
                {Math.round(share)}%
              </span>
            </div>
          </div>
        </Tip>
        <span
          className={cn(
            NUM,
            'text-sm font-bold text-stone-900 dark:text-stone-50 w-9 sm:w-10 text-right shrink-0'
          )}
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
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-2 mb-4">
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
    <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-[#131315] px-3 py-2 shadow-xs">
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
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-3">
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

/**
 * What the signup list can honestly say about a learner's onboarding.
 *
 * The panel always shows the newest accounts, so someone who signed up two
 * minutes ago and is still answering questions would otherwise read as a
 * failure. Median time from signup to a finished questionnaire is under two
 * minutes, so anything younger than the grace window is still in flight, not
 * lost. "Skipped" is called out separately because it satisfies the routing
 * gate without producing any answers.
 */
const ONBOARDING_GRACE_MS = 30 * 60 * 1000;

const onboardingStatusLabel = (user) => {
  // What they did with the price outranks the onboarding state: "Chose Pro"
  // already implies they finished setup, and it is the more useful fact.
  if (user.onboarding_plan_clicked === 'pro') return 'Chose Pro';
  if (user.onboarding_plan_clicked === 'premium') return 'Chose Premium';
  if (user.onboarding_offer_exit === 'free') return 'Stayed free';

  if (user.onboarding_completed) {
    return user.onboarding_outcome === 'skipped' ? 'Skipped setup' : 'Onboarded';
  }

  const createdAt = user.created_at ? new Date(user.created_at).getTime() : NaN;
  if (Number.isFinite(createdAt) && Date.now() - createdAt < ONBOARDING_GRACE_MS) {
    return 'Signing up';
  }
  return 'Not onboarded';
};

/**
 * What the onboarding plan offer did, summarised above the signups it describes.
 *
 * The offer is the last onboarding step and the only place a learner is asked
 * for money before using anything, so it lives with the arrivals list rather
 * than in a panel of its own: the strip gives the rate, the rows below give the
 * individual. Missing history is named in words — a learner who onboarded
 * before this tracking shipped is not the same as one who saw a price and
 * walked away.
 */
const OFFER_PARTS = [
  { key: 'clickedPro', label: 'Pro' },
  { key: 'clickedPremium', label: 'Premium' },
  { key: 'continuedFree', label: 'free' },
  { key: 'leftUndecided', label: 'undecided' },
];

const OfferSummary = ({ offer, displayDays }) => {
  const answered = offer.answered ?? 0;
  const sawOffer = offer.sawOffer ?? 0;

  if (answered === 0) {
    return (
      <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
        Plan offer · nobody finished onboarding in {displayDays}d
      </p>
    );
  }

  if (sawOffer === 0) {
    return (
      <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
        Plan offer · no data yet — {answered} onboarded before tracking started
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
        Plan offer ·{' '}
        <span className={cn(NUM, 'font-bold text-stone-800 dark:text-stone-100')}>
          {Math.round((sawOffer / answered) * 100)}%
        </span>{' '}
        of {answered} reached a price
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {OFFER_PARTS.map((part) => (
          <span key={part.key} className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            <span className={cn(NUM, 'font-bold text-stone-800 dark:text-stone-100')}>
              {offer[part.key] ?? 0}
            </span>{' '}
            {part.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const RecentSignupsPanel = ({ users, offer, displayDays }) => (
  <m.div variants={itemVariants} className="col-span-12 lg:col-span-4">
    <div className={cn(PANEL, 'p-4 h-full flex flex-col justify-between')}>
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Latest signups</h3>
          <InfoTip>
            The newest accounts, and what each did when the onboarding plan prices appeared on the
            final step.
          </InfoTip>
        </div>
        <div className="mb-2 border-b border-stone-100 pb-2 dark:border-white/5">
          <OfferSummary offer={offer} displayDays={displayDays} />
        </div>
        <div className="space-y-px">
          {users.slice(0, 5).map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2.5 py-1.5 px-1.5 -mx-1.5 rounded-md border-b border-stone-100 dark:border-white/5 last:border-0 hover:bg-stone-50 dark:hover:bg-white/3 transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-stone-100 dark:bg-white/6 grid place-items-center text-[9px] font-black text-stone-500 dark:text-stone-300 shrink-0">
                {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-extrabold text-stone-900 dark:text-stone-50 leading-tight">
                  <span className="truncate">{user.full_name || user.email?.split('@')[0]}</span>
                  <SignupSourceMark channel={user.signup_channel} source={user.signup_utm_source} />
                </p>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate')}>
                  {countryShortLabel(user.country)} · {onboardingStatusLabel(user)}
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
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[320px] sm:min-w-0 border-separate border-spacing-y-1">
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
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-2 mb-3">
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
  const pct = Math.round(share);
  return (
    <Tip content={`${label} — ${value} user${value === 1 ? '' : 's'} (${pct}% of test takers)`}>
      <div className="flex items-center gap-3 cursor-default group">
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 w-28 shrink-0')}>
          {label}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-stone-100 dark:bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-[rgb(var(--signal-ok))] group-hover:brightness-125 transition-all duration-200"
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
    </Tip>
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
  <m.div variants={itemVariants} className="col-span-12 xl:col-span-4">
    <div className={cn(PANEL, 'p-4 h-full flex flex-col justify-between')}>
      <div className="mb-3 grid min-w-0 gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="flex min-w-0 items-start gap-1.5">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Activity by hour · last 30 days
          </h3>
          <InfoTip>Test sessions by hour in Bangladesh time (GMT+6).</InfoTip>
        </div>
        <span
          className={cn(
            MICRO,
            'whitespace-nowrap text-stone-500 dark:text-stone-400 sm:text-right'
          )}
        >
          peak{' '}
          <span className={cn(NUM, 'text-stone-700 dark:text-stone-200')}>
            {formatHour12(peakHour)}
          </span>{' '}
          BDT
        </span>
      </div>
      <div className="flex gap-[2px] sm:gap-[3px] h-32 pt-4">
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
  <m.div variants={itemVariants} className="col-span-12 xl:col-span-4">
    <div className={cn(PANEL, 'p-4 h-full flex flex-col')}>
      <div className="mb-3 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Module engagement</h3>
        <span
          className={cn(MICRO, 'max-w-[18rem] text-stone-500 dark:text-stone-400 sm:text-right')}
        >
          completion = sessions finished, not scores
        </span>
      </div>
      <div className="space-y-1">
        {modules.map((module) => {
          const isWeak = module.completion < 50;
          return (
            <Tip
              key={module.module}
              content={`${module.module} Module — ${module.completion}% completion rate (${module.users} users, ${module.sessions} sessions finished)`}
            >
              <div className="group -mx-1 flex flex-col gap-1.5 sm:grid sm:grid-cols-[minmax(4.5rem,1.15fr)_minmax(0,0.8fr)_minmax(4.75rem,0.95fr)_minmax(2.5rem,0.7fr)_2.75rem] sm:items-center sm:gap-2 rounded-md border-b border-stone-100 px-2 sm:px-1 py-2 text-[11px] transition-colors last:border-0 hover:bg-stone-50 dark:border-white/5 dark:hover:bg-white/3">
                <div className="flex items-center justify-between gap-2 min-w-0 sm:contents">
                  <span className="min-w-0 truncate font-extrabold text-stone-900 dark:text-stone-50">
                    {module.module}
                  </span>
                  <span
                    className={cn(
                      NUM,
                      'min-w-0 font-bold text-right whitespace-nowrap sm:hidden',
                      isWeak
                        ? 'text-[rgb(var(--signal-warn))]'
                        : 'text-stone-900 dark:text-stone-50'
                    )}
                  >
                    {module.completion}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 sm:contents">
                  <div className="flex items-center gap-1.5 text-stone-500 sm:contents">
                    <span className={cn(NUM, 'text-[10px] sm:text-[11px] sm:text-right')}>
                      {module.users} users
                    </span>
                    <span className="text-stone-300 dark:text-stone-600 sm:hidden">·</span>
                    <span className={cn(NUM, 'text-[10px] sm:text-[11px] sm:text-right')}>
                      {module.sessions} sessions
                    </span>
                  </div>

                  <div className="min-w-[60px] flex-1 max-w-[120px] sm:max-w-none sm:min-w-0">
                    <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-white/5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width] duration-700 ease-out group-hover:brightness-125',
                          isWeak ? 'bg-[rgb(var(--signal-warn))]' : 'bg-[rgb(var(--signal-ok))]'
                        )}
                        style={{ width: `${module.completion}%` }}
                      />
                    </div>
                  </div>

                  <span
                    className={cn(
                      NUM,
                      'hidden sm:block min-w-0 font-bold text-right whitespace-nowrap',
                      isWeak
                        ? 'text-[rgb(var(--signal-warn))]'
                        : 'text-stone-900 dark:text-stone-50'
                    )}
                  >
                    {module.completion}%
                  </span>
                </div>
              </div>
            </Tip>
          );
        })}
      </div>
    </div>
  </m.div>
);

const SignupChannelsPanel = ({ channels, displayDays }) => {
  const total = channels.reduce((sum, row) => sum + (row.signups || 0), 0);
  const max = channels.reduce((peak, row) => Math.max(peak, row.signups || 0), 0);

  return (
    <m.div variants={itemVariants} className="col-span-12 xl:col-span-4">
      <div className={cn(PANEL, 'p-4 h-full flex flex-col')}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Signups by channel · last {displayDays}d
          </h3>
          <InfoTip>
            First-touch channel from campaign tags and landing referrers, including AI tools. Social
            clicks without paid evidence stay unverified. Missing signals are not guessed.
          </InfoTip>
        </div>
        <div className="space-y-1">
          {channels.map((row) => {
            const key = row.channel || 'unknown';
            const share = total > 0 ? Math.round((100 * (row.signups || 0)) / total) : 0;
            const width = max > 0 ? Math.max(4, Math.round((100 * (row.signups || 0)) / max)) : 0;
            return (
              <Tip
                key={key}
                content={`${channelMeta(key).label} — ${row.signups} signups (${share}% of total signups)`}
              >
                <div className="group -mx-1 flex flex-col gap-1.5 sm:grid sm:grid-cols-[minmax(5.5rem,1.35fr)_minmax(2.5rem,1fr)_minmax(4.5rem,0.85fr)_2.5rem] sm:items-center sm:gap-2 rounded-md border-b border-stone-100 px-2 sm:px-1 py-2 text-[11px] transition-colors last:border-0 hover:bg-stone-50 dark:border-white/5 dark:hover:bg-white/3">
                  <div className="flex items-center justify-between gap-2 min-w-0 sm:contents">
                    <span className="min-w-0 truncate font-extrabold text-stone-900 dark:text-stone-50">
                      {channelMeta(key).short}
                    </span>
                    <div className="flex items-center gap-1.5 sm:hidden shrink-0">
                      <span className={cn(NUM, 'text-stone-500 text-[10px]')}>
                        {row.signups} signups
                      </span>
                      <span className="text-stone-300 dark:text-stone-600">·</span>
                      <span
                        className={cn(
                          NUM,
                          'font-bold text-stone-900 dark:text-stone-50 text-[10px]'
                        )}
                      >
                        {share}%
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 w-full sm:w-auto">
                    <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-white/5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width] duration-700 ease-out group-hover:brightness-125',
                          channelMeta(key).bar
                        )}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={cn(
                      NUM,
                      'hidden sm:block min-w-0 truncate text-right text-stone-500'
                    )}
                  >
                    {row.signups} signups
                  </span>
                  <span
                    className={cn(
                      NUM,
                      'hidden sm:block min-w-0 whitespace-nowrap text-right font-bold text-stone-900 dark:text-stone-50'
                    )}
                  >
                    {share}%
                  </span>
                </div>
              </Tip>
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

const MarketChoroplethMap = ({ mapData, maxSignups, displayDays }) => {
  const countryStyle = ({ countryValue }) => {
    const intensity = countryValue ? 0.28 + 0.72 * (countryValue / maxSignups) : 0;
    return {
      fill: countryValue ? `rgba(90, 99, 223, ${intensity})` : 'rgba(120, 113, 108, 0.11)',
      stroke: 'rgba(120, 113, 108, 0.32)',
      strokeWidth: 0.55,
      outline: 'none',
    };
  };

  return (
    <div className="min-w-0 border-b border-stone-200/80 bg-[#fbfafc] p-3 sm:p-4 lg:border-b-0 lg:border-r dark:border-white/[0.07] dark:bg-[#100f15]">
      <div
        className="mx-auto w-full max-w-[34rem] overflow-hidden"
        data-testid="signup-country-map"
      >
        <span className="sr-only">
          New user signup country map for the last {displayDays} days.
        </span>
        <WorldMap
          data={mapData}
          valueSuffix=" signups"
          size="responsive"
          backgroundColor="transparent"
          borderColor="rgba(120, 113, 108, 0.32)"
          tooltipBgColor="#292524"
          tooltipTextColor="#ffffff"
          styleFunction={countryStyle}
          tooltipTextFunction={({ countryName: mapCountryName, countryValue }) =>
            `${mapCountryName}: ${countryValue ?? 0} signup${countryValue === 1 ? '' : 's'}`
          }
        />
      </div>
      <div
        className={cn(
          MICRO,
          'mt-1 flex items-center justify-center gap-2 text-stone-500 dark:text-stone-400'
        )}
      >
        <span>Signup volume</span>
        <span className="h-1.5 w-20 rounded-full bg-gradient-to-r from-[#5a63df]/20 to-[#5a63df]" />
        <span>higher</span>
      </div>
    </div>
  );
};

const MarketRankingList = ({ visibleMarkets }) => (
  <div className="divide-y divide-stone-100 bg-white lg:grid lg:grid-rows-8 lg:h-[448px] dark:divide-white/5 dark:bg-[#131315]">
    {visibleMarkets.map((market, index) => (
      <div
        key={market.country}
        className="group flex flex-col justify-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5 transition-colors hover:bg-stone-50 dark:hover:bg-white/[0.035]"
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                NUM,
                'w-3.5 shrink-0 text-center text-[10px] font-bold text-stone-400 dark:text-stone-500'
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                NUM,
                'grid h-6 w-7 sm:h-7 sm:w-8 shrink-0 place-items-center rounded-md border border-stone-200/80 bg-stone-50 text-[9px] font-black text-stone-600 transition-colors group-hover:border-stone-300 group-hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:text-stone-300 dark:group-hover:bg-white/[0.075]'
              )}
            >
              {countryShortLabel(market.country)}
            </span>
            <p className="truncate text-xs font-extrabold text-stone-900 dark:text-stone-50">
              {countryName(market.country)}
            </p>
            <span
              className={cn(
                NUM,
                'shrink-0 text-[10px] font-bold text-stone-500 dark:text-stone-400'
              )}
            >
              {market.share ?? 0}%
            </span>
          </div>
          <div className="shrink-0 flex items-baseline gap-1 text-right">
            <span
              className={cn(
                NUM,
                'text-sm sm:text-base font-bold leading-none text-stone-900 dark:text-stone-50'
              )}
            >
              {market.signups ?? 0}
            </span>
            <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500')}>signups</span>
          </div>
        </div>
        <div
          className={cn(
            MICRO,
            'flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-6 sm:pl-[2.125rem] text-stone-500 dark:text-stone-400'
          )}
        >
          <span>{market.activationRate ?? 0}% onboarded</span>
          <span className="text-stone-300 dark:text-stone-600 select-none">·</span>
          <span>{market.practiceRate ?? 0}% practice</span>
          <span className="text-stone-300 dark:text-stone-600 select-none">·</span>
          <span>{market.paidRate ?? 0}% paid</span>
        </div>
      </div>
    ))}
  </div>
);

const MarketSnapshotPanel = ({ markets, marketMap, summary, displayDays }) => {
  const visibleMarkets = markets
    .filter((market) => market.country && market.country !== 'unknown')
    .slice(0, 8);
  // The list is a top-8 ranking; the choropleth shades every identified
  // country in the window, so long windows do not leave most of the map blank.
  const mapMarkets = (marketMap?.length ? marketMap : markets).filter(
    (market) => market.country && WORLD_MAP_CODES.has(market.country.toLowerCase())
  );
  const mapData = mapMarkets.map((market) => ({
    country: market.country.toLowerCase(),
    value: market.signups ?? 0,
  }));
  const maxSignups = Math.max(...mapMarkets.map((market) => market.signups ?? 0), 1);

  return (
    <m.div variants={itemVariants} className="col-span-12">
      <div className={cn(PANEL, 'overflow-hidden')}>
        <div className="flex flex-col gap-2 border-b border-stone-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.07]">
          <div className="flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5 text-stone-400" />
            <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              Signup markets · last {displayDays}d
            </h3>
            <InfoTip>
              First-touch country resolved from the signup IP. It is directional market attribution,
              not proof of residence or nationality.
            </InfoTip>
          </div>
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            <span className={cn(NUM, 'text-stone-800 dark:text-stone-100')}>
              {summary.coverageRate ?? 0}%
            </span>{' '}
            identified · {summary.unknownSignups ?? 0} unknown · {summary.countries ?? 0} countries
          </p>
        </div>
        {visibleMarkets.length ? (
          <div className="grid min-w-0 items-start gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
            <MarketChoroplethMap
              mapData={mapData}
              maxSignups={maxSignups}
              displayDays={displayDays}
            />
            <MarketRankingList visibleMarkets={visibleMarkets} />
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-xs font-medium text-stone-500 dark:text-stone-400">
            Market signals appear after a learner signs up in this window.
          </p>
        )}
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
        <RecentSignupsPanel
          users={arrayOrEmpty(data.recentSignups)}
          offer={objectOrEmpty(data.onboardingOffer)}
          displayDays={displayDays}
        />
        <RetentionPanel cohorts={arrayOrEmpty(data.retention)} />
        <EngagementPanel engagement={engagement} economics={economics} displayDays={displayDays} />
        <HourlyActivityPanel hourly={hourly} maxHourly={maxHourly} peakHour={peakHour} />
        <ModuleEngagementPanel modules={arrayOrEmpty(data.modules)} />
        <SignupChannelsPanel channels={arrayOrEmpty(data.channels)} displayDays={displayDays} />
        <MarketSnapshotPanel
          markets={arrayOrEmpty(data.markets)}
          marketMap={arrayOrEmpty(data.marketMap)}
          summary={objectOrEmpty(data.geoSummary)}
          displayDays={displayDays}
        />
      </div>
    </m.div>
  );
};
