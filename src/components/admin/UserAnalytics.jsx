import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Globe2,
  LineChart,
  MousePointerClick,
  UserCheck,
  UserRoundCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/cn';
import { channelMeta, SignupSourceMark } from './shared/signupChannel';
import { countryName, countryShortLabel, normalizeCountryCode } from './shared/country';
import {
  AdminPageHeader,
  Empty,
  Kpi,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PILL_BASE,
  FunnelStep,
  PanelHeader,
  STAGGER_CONTAINER,
  FADE_UP,
  Pill,
  pillTone,
} from './ui/primitives';

const RANGES = ['30D', '90D', '1Y'];
const RANGE_LABEL = { '30D': 'last 30 days', '90D': 'last 90 days', '1Y': 'last 12 months' };

const tierTone = (tier) => (tier && tier !== 'free' ? pillTone('accent') : pillTone('neutral'));

/** Recharts needs literal colours; these are the stone/indigo values the panel system uses. */
const AXIS = { fill: '#a8a29e', fontSize: 10, fontWeight: 700 };
const GRID = 'rgba(168,162,158,0.22)';
const INK = '#6366f1';
const TRACE = '#a8a29e';

const rate = (value) => `${Number(value || 0).toFixed(Number(value || 0) % 1 ? 1 : 0)}%`;

const MarketBreakdown = ({ rows = [], summary = {}, selectedRange }) => {
  const maxSignups = rows.reduce((maximum, row) => Math.max(maximum, Number(row.signups) || 0), 0);

  return (
    <div className={cn(PANEL, 'flex max-h-[440px] flex-col overflow-hidden')}>
      <PanelHeader
        label="Market signals"
        title={`Signup country · ${RANGE_LABEL[selectedRange]}`}
        description="First-touch IP country at signup. Rates describe this signup cohort's current progress."
      >
        <Pill tone={Number(summary.coverageRate || 0) >= 80 ? 'ok' : 'warn'}>
          {rate(summary.coverageRate)} covered
        </Pill>
      </PanelHeader>
      {rows.length ? (
        <div className="min-h-0 flex-1 divide-y divide-stone-100 overflow-y-auto px-4 dark:divide-white/5">
          {rows.map((row) => {
            const code = normalizeCountryCode(row.country);
            const width = maxSignups ? Math.max(3, (Number(row.signups) / maxSignups) * 100) : 0;
            return (
              <div key={code} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        NUM,
                        'grid h-7 w-8 shrink-0 place-items-center rounded-md border border-stone-200/80 bg-stone-50 text-[10px] font-black text-stone-600 dark:border-white/10 dark:bg-white/[0.045] dark:text-stone-300'
                      )}
                    >
                      {countryShortLabel(code)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold text-stone-900 dark:text-stone-50">
                        {countryName(code)}
                      </p>
                      <p className={cn(MICRO, MUTED)}>{rate(row.share)} of signups</p>
                    </div>
                  </div>
                  <span className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}>
                    {Number(row.signups || 0).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/5">
                  <div
                    className="h-full rounded-full bg-indigo-500/70 transition-[width] duration-700 dark:bg-indigo-400/70"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <div className={cn(MICRO, MUTED, 'mt-2 flex flex-wrap gap-x-4 gap-y-1')}>
                  <span>Onboarded {rate(row.activationRate)}</span>
                  <span>Practiced {rate(row.practiceRate)}</span>
                  <span>Paid {rate(row.paidRate)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={Globe2} title="No market data yet">
          Country signals appear after a learner signs up in this period.
        </Empty>
      )}
      <div className="border-t border-stone-200/80 px-4 py-2.5 dark:border-white/[0.07]">
        <p className={cn(MICRO, MUTED)}>
          {Number(summary.identifiedSignups || 0).toLocaleString()} identified ·{' '}
          {Number(summary.unknownSignups || 0).toLocaleString()} unknown ·{' '}
          {Number(summary.countries || 0).toLocaleString()} countries
        </p>
      </div>
    </div>
  );
};

const AcquisitionQuality = ({ rows = [], selectedRange }) => (
  <div className={cn(PANEL, 'flex max-h-[440px] flex-col overflow-hidden')}>
    <PanelHeader
      label="Acquisition quality"
      title={`First-touch channels · ${RANGE_LABEL[selectedRange]}`}
      description="Volume and downstream progress for users acquired in this period."
    />
    {rows.length ? (
      <div className="min-h-0 flex-1 divide-y divide-stone-100 overflow-y-auto px-4 dark:divide-white/5">
        {rows.map((row) => {
          const meta = channelMeta(row.channel || 'unknown');
          return (
            <div key={row.channel || 'unknown'} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                  <span className="truncate text-[11px] font-extrabold text-stone-900 dark:text-stone-50">
                    {meta.label}
                  </span>
                </div>
                <span className={cn(NUM, 'text-xs font-bold text-stone-900 dark:text-stone-50')}>
                  {Number(row.signups || 0).toLocaleString()} signups
                </span>
              </div>
              <div className={cn(MICRO, MUTED, 'mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-5')}>
                <span>Onboarded {rate(row.activationRate)}</span>
                <span>Practiced {rate(row.practiceRate)}</span>
                <span>Paid {rate(row.paidRate)}</span>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <Empty icon={MousePointerClick} title="No acquisition data yet">
        First-touch channels appear after registrations in this period.
      </Empty>
    )}
  </div>
);

const OperatorRead = ({ geography = [], channels = [], summary = {}, newUsers = 0 }) => {
  const knownMarkets = geography.filter((row) => normalizeCountryCode(row.country) !== 'unknown');
  const topMarket = knownMarkets[0];
  const qualityMarket = [...knownMarkets]
    .filter((row) => Number(row.signups) >= 5)
    .sort((left, right) => Number(right.practiceRate) - Number(left.practiceRate))[0];
  const qualityChannel = [...channels]
    .filter((row) => Number(row.signups) >= 5 && row.channel !== 'unknown')
    .sort((left, right) => Number(right.practiceRate) - Number(left.practiceRate))[0];
  const coverage = Number(summary.coverageRate || 0);

  const findings = [
    topMarket
      ? {
          label: 'Largest observed market',
          value: `${countryName(topMarket.country)} supplied ${topMarket.signups} signups (${rate(topMarket.share)}).`,
        }
      : {
          label: 'Market volume',
          value: 'No identified signup country is available in this range.',
        },
    qualityMarket
      ? {
          label: 'Strongest practice signal',
          value: `${countryName(qualityMarket.country)} reached ${rate(qualityMarket.practiceRate)} practice among markets with at least 5 signups.`,
        }
      : {
          label: 'Sample confidence',
          value:
            'No country has 5 signups yet, so conversion-rate comparisons are too fragile for budget decisions.',
        },
    qualityChannel
      ? {
          label: 'Channel quality',
          value: `${channelMeta(qualityChannel.channel).label} reached ${rate(qualityChannel.practiceRate)} practice from ${qualityChannel.signups} signups.`,
        }
      : {
          label: 'Channel quality',
          value: 'Channel cohorts are still too small for a stable quality comparison.',
        },
    {
      label: 'Geo confidence',
      value:
        Number(newUsers) === 0
          ? 'No signups occurred in this range.'
          : `${rate(coverage)} of signups have an identified country; ${Number(summary.unknownSignups || 0)} remain unknown.`,
      tone: coverage >= 80 ? 'ok' : 'warn',
    },
  ];

  return (
    <div className={cn(PANEL, 'overflow-hidden')}>
      <PanelHeader
        label="Operator read"
        title="What the cohort currently supports"
        description="Directional analysis with minimum-sample and coverage guards."
      />
      <div className="divide-y divide-stone-100 dark:divide-white/5">
        {findings.map((finding) => (
          <div key={finding.label} className="flex gap-3 px-4 py-3">
            <span
              className={cn(
                'mt-1 h-3 w-0.5 shrink-0 rounded-full',
                finding.tone === 'warn'
                  ? 'bg-[rgb(var(--signal-warn))]'
                  : finding.tone === 'ok'
                    ? 'bg-[rgb(var(--signal-ok))]'
                    : 'bg-indigo-500'
              )}
            />
            <div>
              <p className={cn(MICRO, MUTED)}>{finding.label}</p>
              <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-stone-700 dark:text-stone-200">
                {finding.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserAnalytics = ({
  stats = {},
  analyticsData = {},
  selectedRange = '30D',
  onRangeChange,
  isDataLoading = false,
}) => {
  const {
    userGrowthData = [],
    recentSignups = [],
    funnel = [],
    geography = [],
    acquisitionChannels = [],
  } = analyticsData;
  const engagement = stats.engagement || {};
  const geoSummary = stats.geoSummary || {};

  // The RPC returns new signups per period; the running total is the more
  // useful "is the community growing" read, so it is derived here rather than
  // round-tripping to the server for it.
  const growth = useMemo(() => {
    let running = 0;
    return userGrowthData.map((point) => {
      running += Number(point.signups) || 0;
      return { ...point, cumulative: running };
    });
  }, [userGrowthData]);

  const newInPeriod = useMemo(
    () => userGrowthData.reduce((total, point) => total + (Number(point.signups) || 0), 0),
    [userGrowthData]
  );

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-6 pt-12 md:pt-0"
    >
      <motion.div variants={FADE_UP}>
        <AdminPageHeader
          title="User Analytics"
          description="Acquisition, activation, practice, and conversion — with one consistent time window."
        >
          {/* The range drives every figure on the page, so it belongs beside the
              page title rather than inside one chart's header. */}
          <div className="flex items-center gap-1 rounded-lg border border-stone-200/80 bg-stone-100 p-0.5 dark:border-white/[0.07] dark:bg-white/[0.04]">
            {RANGES.map((range) => {
              const isActive = range === selectedRange;
              return (
                <button
                  key={range}
                  onClick={() => onRangeChange?.(range)}
                  disabled={isDataLoading}
                  className={cn(
                    'relative px-2.5 py-1 rounded-md transition-all active:scale-95',
                    MICRO,
                    isActive
                      ? 'text-stone-900 dark:text-stone-50'
                      : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200',
                    isDataLoading && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="userAnalyticsRangePill"
                      className="absolute inset-0 rounded-md bg-white shadow-2xs dark:bg-[#131315]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative">{range}</span>
                </button>
              );
            })}
          </div>
        </AdminPageHeader>
      </motion.div>

      <motion.div
        variants={FADE_UP}
        className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6"
      >
        <Kpi
          label="Total community"
          value={(stats.totalUsers || 0).toLocaleString()}
          sub="Registered learners"
          tip="All registered accounts, active or not."
        />
        <Kpi
          label={`New signups · ${selectedRange}`}
          value={newInPeriod.toLocaleString()}
          sub={`Signups in the ${RANGE_LABEL[selectedRange]}`}
          tip="Sum of the growth series below, not a projection."
        />
        <Kpi
          label="Activation rate"
          value={`${stats.activationRate || 0}%`}
          sub="New signups who finished onboarding"
          tip="Current onboarding status of learners who registered in this selected period."
        />
        <Kpi
          label="Practice reach"
          value={(stats.testers || 0).toLocaleString()}
          sub={`${(stats.completedTests || 0).toLocaleString()} completed sessions`}
          tip="Distinct learners who started practice during the selected period, plus completed sessions."
        />
        <Kpi
          label="Active reach"
          value={`${engagement.activeRate || 0}%`}
          sub={`${Number(stats.activeUsers || 0).toLocaleString()} active learners`}
          tip={`Share of all registered learners active during the ${RANGE_LABEL[selectedRange]}.`}
        />
        <Kpi
          label="Repeat practice"
          value={`${engagement.repeatRate || 0}%`}
          sub={`${Number(engagement.repeatTesters || 0).toLocaleString()} learners returned`}
          tip="Share of learners with practice in this period who started at least two sessions."
        />
      </motion.div>

      {/* Chart and arrivals sit side by side so the page reads in one screen
          instead of three stacked full-width bands. */}
      <motion.div variants={FADE_UP} className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className={cn(PANEL, 'flex flex-col overflow-hidden')}>
          <PanelHeader label="Growth trajectory" title={`Signups · ${RANGE_LABEL[selectedRange]}`}>
            <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
              <span className="h-0.5 w-2.5 rounded-full bg-indigo-500" />
              Signups
            </span>
            <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
              <span className="h-0.5 w-2.5 rounded-full bg-stone-400 dark:bg-stone-500" />
              Cumulative
            </span>
          </PanelHeader>

          <div className="relative min-h-[300px] flex-1 p-4">
            {isDataLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-white/75 dark:bg-[#131315]/75">
                <Activity className="h-5 w-5 animate-pulse text-stone-500 dark:text-stone-400" />
              </div>
            )}
            {growth.length ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growth} margin={{ top: 8, right: 6, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsersUA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={INK} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={INK} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={AXIS}
                      tickMargin={10}
                    />
                    <YAxis
                      yAxisId="new"
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={AXIS}
                    />
                    <YAxis
                      yAxisId="cumulative"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={AXIS}
                    />
                    <Tooltip
                      cursor={{ stroke: 'rgba(120,113,108,0.35)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const rows = [
                          [
                            'Signups',
                            payload.find((p) => p.dataKey === 'signups')?.value ?? 0,
                            INK,
                          ],
                          [
                            'Cumulative',
                            payload.find((p) => p.dataKey === 'cumulative')?.value ?? 0,
                            TRACE,
                          ],
                        ];
                        return (
                          <div className={cn(PANEL, 'min-w-[150px] p-3 shadow-xs')}>
                            <p className={cn(MICRO, MUTED, 'mb-1.5')}>{label}</p>
                            {rows.map(([name, value, colour]) => (
                              <div
                                key={name}
                                className="mt-0.5 flex items-center justify-between gap-3 text-[11px]"
                              >
                                <span className={cn('flex items-center gap-1.5', MUTED)}>
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: colour }}
                                  />
                                  {name}
                                </span>
                                <span
                                  className={cn(
                                    NUM,
                                    'font-bold text-stone-800 dark:text-stone-100'
                                  )}
                                >
                                  {Number(value).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Area
                      yAxisId="new"
                      type="monotone"
                      dataKey="signups"
                      stroke={INK}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorUsersUA)"
                      activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                      animationDuration={900}
                    />
                    <Area
                      yAxisId="cumulative"
                      type="monotone"
                      dataKey="cumulative"
                      stroke={TRACE}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      fill="none"
                      activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                      animationDuration={900}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                icon={LineChart}
                title="No signups in this range"
                className="h-[300px] justify-center"
              >
                Widen the range, or wait for the first registration in this period.
              </Empty>
            )}
          </div>
        </div>

        <div className={cn(PANEL, 'flex flex-col overflow-hidden')}>
          <PanelHeader label="Recent signups" title="Latest arrivals" />
          <div className="max-h-[380px] flex-1 divide-y divide-stone-100 overflow-y-auto dark:divide-white/5">
            {recentSignups.length ? (
              recentSignups.map((user) => {
                const tier = (user.subscription_tier || 'free').toLowerCase();
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 transition-colors hover:bg-stone-50/60 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-200/80 bg-stone-100 dark:border-white/[0.07] dark:bg-white/[0.06]">
                        <span className={cn(MICRO, 'text-stone-600 dark:text-stone-300')}>
                          {(
                            user.full_name?.charAt(0) ||
                            user.email?.charAt(0) ||
                            '?'
                          ).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-50">
                          {user.full_name || `learner_${user.id.slice(0, 4)}`}
                        </p>
                        <p
                          className={cn(NUM, 'truncate text-[10px] font-medium', MUTED)}
                          title={user.email}
                        >
                          {user.email}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={cn(NUM, MICRO, MUTED)}>
                            {countryShortLabel(user.country)}
                          </span>
                          <SignupSourceMark
                            channel={user.signup_channel}
                            source={user.signup_utm_source}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={cn(PILL_BASE, tierTone(tier))}>{tier}</span>
                      <span className={cn(NUM, 'text-[10px] font-bold', MUTED)}>
                        {new Date(user.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <Empty icon={UserCheck} title="No recent registrants">
                New signups appear here as soon as an account is created.
              </Empty>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={FADE_UP} className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <MarketBreakdown rows={geography} summary={geoSummary} selectedRange={selectedRange} />
        <AcquisitionQuality rows={acquisitionChannels} selectedRange={selectedRange} />
      </motion.div>

      <motion.div variants={FADE_UP} className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className={cn(PANEL, 'overflow-hidden')}>
          <PanelHeader
            label="Activation funnel"
            title={`New users · ${RANGE_LABEL[selectedRange]}`}
            description="Each step shows what learners who signed up in this period have done so far."
          />
          <div className="space-y-2.5 p-4">
            {funnel.length ? (
              funnel.map((step, index) => {
                const first = Number(funnel[0]?.users || 0);
                const previous = Number(funnel[index - 1]?.users || first);
                const value = Number(step.users || 0);
                return (
                  <FunnelStep
                    key={step.label}
                    label={step.label}
                    value={value.toLocaleString()}
                    share={first ? (value / first) * 100 : 0}
                    drop={index ? (previous ? ((previous - value) / previous) * 100 : 0) : 0}
                    isFirst={index === 0}
                  />
                );
              })
            ) : (
              <Empty icon={UserRoundCheck} title="No new users yet">
                The activation funnel appears after the first registration in this period.
              </Empty>
            )}
          </div>
          <div className="border-t border-stone-200/80 px-4 py-2.5 dark:border-white/[0.07]">
            <p className={cn(MICRO, MUTED)}>
              All-time paid conversion ·{' '}
              <span className={cn(NUM, 'text-stone-800 dark:text-stone-100')}>
                {stats.conversionRate || 0}%
              </span>
            </p>
          </div>
        </div>
        <OperatorRead
          geography={geography}
          channels={acquisitionChannels}
          summary={geoSummary}
          newUsers={stats.newUsers}
        />
      </motion.div>
    </motion.div>
  );
};

export default UserAnalytics;
