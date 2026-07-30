import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Activity,
  TrendingUp,
  UserCheck,
  Award,
  BarChart3,
  Target,
  ChevronRight,
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

const UserAnalytics = ({
  stats = {},
  analyticsData = {},
  selectedRange = '30D',
  onRangeChange,
  isDataLoading = false,
}) => {
  const { userGrowthData = [], recentSignups = [] } = analyticsData;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-6 pt-12 md:pt-0"
      data-oid="6o_vgjg"
    >
      {/* Header Section */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-1"
        data-oid="x.6bi2i"
      >
        <motion.div variants={itemVariants} className="space-y-0.5 min-w-0" data-oid="fpvh1xc">
          <h2
            className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5"
            data-oid="s-nvif-"
          >
            <div
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-2xs shrink-0"
              data-oid="j_zqisa"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" data-oid="1mxkow0" />
            </div>
            <span className="truncate">User Analytics</span>
          </h2>
          <p
            className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 ml-1"
            data-oid="w-_12:7"
          >
            Monitor registration trends, user growth, and learner engagement metrics
          </p>
        </motion.div>
      </div>

      {/* Compact KPI Grid (2 Columns on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5" data-oid="2ki0x24">
        {[
          {
            title: 'Total Community',
            value: stats.totalUsers || 0,
            icon: Users,
            color: 'indigo',
            description: 'Registered learners',
          },
          {
            title: 'Premium Conversion',
            value: stats.premiumUsers || 0,
            trend: `${stats.conversionRate || 0}%`,
            icon: Award,
            color: 'emerald',
            description: 'Pro & Premium users',
          },
          {
            title: 'Completed Sessions',
            value: stats.completedTests || 0,
            icon: Target,
            color: 'blue',
            description: 'Finished test sessions',
          },
        ].map((item, index) => (
          <motion.div key={index} variants={itemVariants} data-oid="muj-bk:">
            <Card
              className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden"
              data-oid="3sdk21e"
            >
              <CardContent className="p-3.5 px-4" data-oid=":i0afil">
                <div className="flex items-center justify-between" data-oid="mia:.wn">
                  <div className="space-y-0.5" data-oid=".f-p_kr">
                    <p
                      className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                      data-oid="h9yk:nc"
                    >
                      {item.title}
                    </p>
                    <div className="flex items-baseline gap-2" data-oid="val-row">
                      <h3
                        className="text-xl font-black text-slate-950 dark:text-white leading-none"
                        data-oid="ofoy91v"
                      >
                        {item.value.toLocaleString()}
                      </h3>
                      {item.trend && (
                        <span
                          className="text-[10px] font-extrabold text-slate-500"
                          data-oid="q54atgw"
                        >
                          {item.trend}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'p-2.5 rounded-xl border shrink-0',
                      item.color === 'indigo' &&
                        'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-900',
                      item.color === 'emerald' &&
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900',
                      item.color === 'rose' &&
                        'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900',
                      item.color === 'blue' &&
                        'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900'
                    )}
                    data-oid="mx5t8e0"
                  >
                    <item.icon className="w-4 h-4" data-oid="vf9e6gd" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 gap-4" data-oid="igh71.8">
        {/* Growth Chart */}
        <motion.div variants={itemVariants} data-oid="v:bl04s">
          <Card
            className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden"
            data-oid="vvw3:h5"
          >
            <CardHeader
              className="pb-2 p-4 flex flex-row items-center justify-between"
              data-oid="nuwrbeb"
            >
              <CardTitle
                className="text-base font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2"
                data-oid="nenkpkm"
              >
                <div
                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shrink-0"
                  data-oid="tr-icon"
                >
                  <TrendingUp
                    className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                    data-oid="xgkk9-9"
                  />
                </div>
                Growth Trajectory
              </CardTitle>
              <div className="flex items-center gap-2" data-oid="controls">
                <div
                  className="bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded-xl border border-slate-200/80 dark:border-white/5 flex gap-1"
                  data-oid="fum8s9f"
                >
                  {['30D', '90D', '1Y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => onRangeChange?.(range)}
                      disabled={isDataLoading}
                      className={cn(
                        'px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all',
                        range === selectedRange
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white',
                        isDataLoading && 'opacity-50 cursor-not-allowed'
                      )}
                      data-oid="jeq9s6d"
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 relative min-h-[280px]" data-oid="opoldrj">
              {isDataLoading && (
                <div
                  className="absolute inset-0 z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl"
                  data-oid="load-over"
                >
                  <Activity
                    className="w-6 h-6 text-indigo-600 animate-pulse"
                    data-oid="pulse-act"
                  />
                </div>
              )}
              <div className="h-[280px] w-full mt-2" data-oid="2nk.nrq">
                <ResponsiveContainer width="100%" height="100%" data-oid="4adlh-a">
                  <AreaChart
                    data={userGrowthData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    data-oid="g0chnp5"
                  >
                    <defs data-oid="bfpgtmu">
                      <linearGradient id="colorUsersV2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(148, 163, 184, 0.2)"
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
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                                {label}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                <span className="text-base font-black text-slate-950 dark:text-white">
                                  {payload[0].value.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-slate-500">Learners</span>
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
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorUsersV2)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section: Recent Registrations */}
      <div className="grid grid-cols-1 gap-4" data-oid="6tyx8k-">
        {/* Recent Registrations Table */}
        <motion.div variants={itemVariants} data-oid="2ur.p_v">
          <Card
            className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden"
            data-oid="sx:ofyv"
          >
            <CardHeader
              className="flex flex-row items-center justify-between p-4 pb-2"
              data-oid="yvxb11s"
            >
              <div data-oid="z6cebiy">
                <CardTitle
                  className="text-base font-black tracking-tight flex items-center gap-2 text-slate-950 dark:text-white"
                  data-oid="5xk8eza"
                >
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <UserCheck
                      className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                      data-oid="fzltvl-"
                    />
                  </div>
                  Recent Signups
                </CardTitle>
                <CardDescription
                  className="font-semibold text-xs text-slate-500 dark:text-slate-400 ml-1 mt-0.5"
                  data-oid="amy5u24"
                >
                  Latest learning community arrivals
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1" data-oid="wlhb9u6">
              <div className="space-y-1" data-oid="wsyb62s">
                {recentSignups.length > 0 ? (
                  recentSignups.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all border border-transparent hover:border-slate-200/60 dark:hover:border-white/5 group/row"
                      data-oid="56ccbci"
                    >
                      <div className="flex items-center gap-3" data-oid="n:is3ee">
                        <div
                          className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs"
                          data-oid="wes-4wo"
                        >
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <div data-oid="shxiivr">
                          <p
                            className="font-black text-xs text-slate-950 dark:text-white leading-tight"
                            data-oid="i6k38iz"
                          >
                            {user.full_name || 'learner_' + user.id.slice(0, 4)}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium" data-oid="-vrgfkb">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4" data-oid="4eyz4ma">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-lg px-2 py-0.5 text-[10px] font-extrabold border shadow-2xs transition-all',
                            user.subscription_tier === 'premium'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900'
                              : user.subscription_tier === 'pro'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          )}
                          data-oid=".0ab3b4"
                        >
                          {user.subscription_tier || 'Free'}
                        </Badge>
                        <div className="flex flex-col items-end min-w-[70px]">
                          <span
                            className="text-slate-950 dark:text-white font-extrabold text-[11px]"
                            data-oid="53tp1h8"
                          >
                            {new Date(user.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            JOINED
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg opacity-0 group-hover/row:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="text-center py-16 text-slate-400 text-xs font-semibold italic"
                    data-oid="lcf_rs."
                  >
                    No recent registrants found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserAnalytics;
