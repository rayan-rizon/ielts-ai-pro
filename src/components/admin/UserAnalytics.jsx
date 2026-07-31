import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, UserCheck, Award, Target } from 'lucide-react';
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
  PANEL,
  MICRO,
  NUM,
  STAGGER_CONTAINER,
  FADE_UP,
  SectionLabel,
} from './ui/primitives';

const TIER_PILL = {
  premium:
    'text-violet-600 dark:text-violet-400 border-violet-300/50 dark:border-violet-800/60 bg-violet-500/[0.06]',
  pro: 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)]',
  free: 'text-stone-500 border-stone-200 dark:border-white/10 bg-stone-500/[0.04]',
};

const UserAnalytics = ({
  stats = {},
  analyticsData = {},
  selectedRange = '30D',
  onRangeChange,
  isDataLoading = false,
}) => {
  const { userGrowthData = [], recentSignups = [] } = analyticsData;

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
        {[
          {
            label: 'Total Community',
            value: stats.totalUsers || 0,
            sub: 'Registered learners',
            icon: Users,
          },
          {
            label: 'Premium Conversion',
            value: stats.premiumUsers || 0,
            sub: `${stats.conversionRate || 0}% rate`,
            icon: Award,
          },
          {
            label: 'Completed Sessions',
            value: stats.completedTests || 0,
            sub: 'Finished test sessions',
            icon: Target,
          },
        ].map((item) => (
          <div key={item.label} className={cn(PANEL, 'py-2.5 px-3.5')}>
            <div className="flex items-center gap-1.5 mb-1">
              <p className={cn(MICRO, 'text-stone-400')}>{item.label}</p>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span
                  className={cn(
                    NUM,
                    'text-xl font-bold text-stone-900 dark:text-stone-50 leading-none'
                  )}
                >
                  {item.value.toLocaleString()}
                </span>
                <p className={cn(MICRO, 'text-stone-400 mt-1')}>{item.sub}</p>
              </div>
              <item.icon className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Growth Chart */}
      <motion.div variants={FADE_UP}>
        <div className={cn(PANEL, 'overflow-hidden')}>
          {/* Chart header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-200/80 dark:border-white/[0.07]">
            <SectionLabel>Growth Trajectory</SectionLabel>
            <div className="flex items-center gap-1 p-0.5 bg-stone-100 dark:bg-white/[0.04] rounded-lg border border-stone-200/80 dark:border-white/[0.07]">
              {['30D', '90D', '1Y'].map((range) => (
                <button
                  key={range}
                  onClick={() => onRangeChange?.(range)}
                  disabled={isDataLoading}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-all',
                    MICRO,
                    range === selectedRange
                      ? 'bg-white dark:bg-[#131315] text-stone-900 dark:text-stone-50 shadow-2xs'
                      : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200',
                    isDataLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Chart body */}
          <div className="p-4 relative min-h-[280px]">
            {isDataLoading && (
              <div className="absolute inset-0 z-10 bg-white/60 dark:bg-[#131315]/60 backdrop-blur-[2px] flex items-center justify-center rounded-b-xl">
                <Activity className="w-5 h-5 text-stone-400 animate-pulse" />
              </div>
            )}
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={userGrowthData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className={cn(PANEL, 'p-3 shadow-xl')}>
                            <p className={cn(MICRO, 'text-stone-400 mb-1')}>{label}</p>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span
                                className={cn(
                                  NUM,
                                  'text-base font-bold text-stone-900 dark:text-stone-50'
                                )}
                              >
                                {payload[0].value.toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-stone-400">learners</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUsersUA)"
                    animationDuration={1200}
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
            <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>Latest learning community arrivals</p>
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
                            'text-stone-400 font-mono normal-case tracking-normal truncate'
                          )}
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border',
                          TIER_PILL[tier] || TIER_PILL.free
                        )}
                      >
                        {tier}
                      </Badge>
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
                        <p className={cn(MICRO, 'text-stone-400')}>joined</p>
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
                <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>New signups will appear here</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserAnalytics;
