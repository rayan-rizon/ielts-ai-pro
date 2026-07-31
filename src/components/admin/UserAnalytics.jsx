import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, UserCheck } from 'lucide-react';
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
import {
  AdminPageHeader,
  Kpi,
  PANEL,
  MICRO,
  NUM,
  PILL_BASE,
  pillTone,
  STAGGER_CONTAINER,
  FADE_UP,
  SectionLabel,
} from './ui/primitives';

const tierTone = (tier) => (tier && tier !== 'free' ? pillTone('accent') : pillTone('neutral'));

const UserAnalytics = ({
  stats = {},
  analyticsData = {},
  selectedRange = '30D',
  onRangeChange,
  isDataLoading = false,
}) => {
  const { userGrowthData = [], recentSignups = [] } = analyticsData;

  // The RPC returns new signups per period; the running total is a more
  // useful "is the community growing" read at a glance, so derive it here
  // rather than round-tripping to the server for it.
  const growthWithCumulative = useMemo(() => {
    let running = 0;
    return userGrowthData.map((point) => {
      running += Number(point.users) || 0;
      return { ...point, cumulative: running };
    });
  }, [userGrowthData]);

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-6 pt-12 md:pt-0"
    >
      {/* Header */}
      <motion.div variants={FADE_UP}>
        <AdminPageHeader
          title="User Analytics"
          description="Monitor registration trends, user growth, and learner engagement metrics"
        />
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={FADE_UP} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi
          label="Total community"
          value={(stats.totalUsers || 0).toLocaleString()}
          sub="Registered learners"
          tip="Everyone who has ever created an account, regardless of whether they're still active."
        />
        <Kpi
          label="Premium conversion"
          value={(stats.premiumUsers || 0).toLocaleString()}
          sub={`${stats.conversionRate || 0}% of all users`}
          tip="Users on a Pro or Premium plan, and what share of the total community that represents."
        />
        <Kpi
          label="Completed sessions"
          value={(stats.completedTests || 0).toLocaleString()}
          sub="Finished test sessions"
          tip="Test sessions marked complete — a volume metric, not a score. Where they scored isn't shown here."
        />
      </motion.div>

      {/* Growth Chart */}
      <motion.div variants={FADE_UP}>
        <div className={cn(PANEL, 'overflow-hidden')}>
          {/* Chart header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-200/80 dark:border-white/[0.07]">
            <SectionLabel>Growth Trajectory</SectionLabel>
            <div className="flex items-center gap-1 p-0.5 bg-stone-100 dark:bg-white/[0.04] rounded-lg border border-stone-200/80 dark:border-white/[0.07]">
              {['30D', '90D', '1Y'].map((range) => {
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
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200',
                      isDataLoading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="userAnalyticsRangePill"
                        className="absolute inset-0 bg-white dark:bg-[#131315] rounded-md shadow-2xs"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative">{range}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart body */}
          <div className="p-4 relative min-h-[280px]">
            {isDataLoading && (
              <div className="absolute inset-0 z-10 bg-white/60 dark:bg-[#131315]/60 backdrop-blur-[2px] flex items-center justify-center rounded-b-xl">
                <Activity className="w-5 h-5 text-stone-500 dark:text-stone-400 animate-pulse" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <span
                className={cn(
                  MICRO,
                  'text-stone-500 dark:text-stone-400 flex items-center gap-1.5'
                )}
              >
                <span className="w-2 h-0.5 rounded-full bg-indigo-500" />
                New signups
              </span>
              <span
                className={cn(
                  MICRO,
                  'text-stone-500 dark:text-stone-400 flex items-center gap-1.5'
                )}
              >
                <span
                  className="w-2 h-0.5 rounded-full bg-stone-400 dark:bg-stone-500"
                  style={{ borderTop: '1.5px dashed' }}
                />
                Cumulative
              </span>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={growthWithCumulative}
                  margin={{ top: 10, right: 10, left: -14, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsersUA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148,163,184,0.15)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    tickMargin={10}
                  />
                  <YAxis
                    yAxisId="new"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    yAxisId="cumulative"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    cursor={{ stroke: 'rgba(120,113,108,0.35)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const newCount = payload.find((p) => p.dataKey === 'users')?.value ?? 0;
                      const cumulative =
                        payload.find((p) => p.dataKey === 'cumulative')?.value ?? 0;
                      return (
                        <div className={cn(PANEL, 'p-3 shadow-xl min-w-[150px]')}>
                          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5')}>
                            {label}
                          </p>
                          <div className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="flex items-center gap-1.5 text-stone-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              New
                            </span>
                            <span
                              className={cn(NUM, 'font-bold text-stone-800 dark:text-stone-100')}
                            >
                              {newCount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[11px] mt-0.5">
                            <span className="flex items-center gap-1.5 text-stone-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                              Cumulative
                            </span>
                            <span
                              className={cn(NUM, 'font-bold text-stone-800 dark:text-stone-100')}
                            >
                              {cumulative.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    yAxisId="new"
                    type="monotone"
                    dataKey="users"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUsersUA)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={1000}
                  />
                  <Area
                    yAxisId="cumulative"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#a8a29e"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    fill="none"
                    activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Signups */}
      <motion.div variants={FADE_UP}>
        <div className={cn(PANEL, 'overflow-hidden')}>
          <div className="p-4 border-b border-stone-200/80 dark:border-white/[0.07]">
            <SectionLabel>Recent Signups</SectionLabel>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
              Latest learning community arrivals
            </p>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-white/[0.04]">
            {recentSignups.length > 0 ? (
              recentSignups.map((user) => {
                const tier = (user.subscription_tier || 'free').toLowerCase();
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-stone-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/[0.06] border border-stone-200/80 dark:border-white/[0.07] flex items-center justify-center shrink-0">
                        <span className={cn(MICRO, 'text-stone-600 dark:text-stone-300')}>
                          {(
                            user.full_name?.charAt(0) ||
                            user.email?.charAt(0) ||
                            '?'
                          ).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-stone-50 truncate">
                          {user.full_name || 'learner_' + user.id.slice(0, 4)}
                        </p>
                        <p
                          className={cn(
                            MICRO,
                            'text-stone-500 dark:text-stone-400 font-mono normal-case tracking-normal truncate'
                          )}
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn(PILL_BASE, tierTone(tier))}>{tier}</span>
                      <div className="text-right hidden sm:block">
                        <p
                          className={cn(
                            NUM,
                            'text-xs font-bold text-stone-700 dark:text-stone-200'
                          )}
                        >
                          {new Date(user.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>joined</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center">
                <UserCheck className="w-7 h-7 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                  No recent registrants
                </p>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
                  New signups will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserAnalytics;
