import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Activity,
  TrendingUp,
  UserCheck,
  Clock,
  Award,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Download,
  MoreVertical,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { cn } from '@/lib/cn';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const UserAnalytics = ({
  stats = {},
  analyticsData = {},
  selectedRange = '30D',
  onRangeChange,
  isDataLoading = false,
}) => {
  const {
    userGrowthData = [],
    scoreDistribution = [],
    recentSignups = [],
    sessionActivity = [],
  } = analyticsData;

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
      className="space-y-4 pb-6"
      data-oid="6o_vgjg"
    >
      {/* Header Section */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-1"
        data-oid="x.6bi2i"
      >
        <motion.div variants={itemVariants} className="space-y-0.5" data-oid="fpvh1xc">
          <h2
            className="text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5"
            data-oid="s-nvif-"
          >
            <div
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
              data-oid="j_zqisa"
            >
              <BarChart3 className="w-5 h-5" data-oid="1mxkow0" />
            </div>
            User Analytics
          </h2>
          <p
            className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 ml-1"
            data-oid="w-_12:7"
          >
            Monitor registration trends, user growth, and learner engagement metrics
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2.5"
          data-oid="46ygl42"
        >
          <Button
            variant="outline"
            className="h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs shadow-2xs"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Export Report
          </Button>
          <div
            className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs"
            data-oid="wt4_e28"
          >
            <div className="relative" data-oid="lm:9cb5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" data-oid="010s21v" />
              <div
                className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"
                data-oid="ug5fzkn"
              />
            </div>
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider"
              data-oid="y8l83wc"
            >
              LIVE BROADCAST
            </span>
          </div>
        </motion.div>
      </div>

      {/* Compact KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" data-oid="2ki0x24">
        {[
          {
            title: 'Total Community',
            value: stats.totalUsers || 0,
            trend: '+12.5%',
            positive: true,
            icon: Users,
            color: 'indigo',
            description: 'Registered learners',
          },
          {
            title: 'Premium Conversion',
            value: stats.premiumUsers || 0,
            trend: `${stats.conversionRate || 0}%`,
            positive: true,
            icon: Award,
            color: 'emerald',
            description: 'Pro & Premium users',
          },
          {
            title: 'Weekly Active',
            value: analyticsData.weeklyActiveUsers || 0,
            trend: '-2.4%',
            positive: false,
            icon: Activity,
            color: 'rose',
            description: 'Rolling 7d activity',
          },
          {
            title: 'Session Total',
            value: stats.completedTests || 0,
            trend: stats.avgScore || 0,
            icon: Target,
            color: 'blue',
            description: 'Completed sessions',
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
                          className={cn(
                            'text-[10px] font-extrabold flex items-center',
                            item.positive === true
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : item.positive === false
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-500'
                          )}
                          data-oid="q54atgw"
                        >
                          {item.positive === true ? (
                            <ArrowUpRight className="w-3 h-3 mr-0.5" />
                          ) : item.positive === false ? (
                            <ArrowDownRight className="w-3 h-3 mr-0.5" />
                          ) : null}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-oid="igh71.8">
        {/* Growth Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2" data-oid="v:bl04s">
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

        {/* Score Distribution */}
        <motion.div variants={itemVariants} data-oid="laq2fq2">
          <Card
            className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden"
            data-oid="qex7i6h"
          >
            <CardHeader className="pb-2 p-4" data-oid="9v-co2a">
              <CardTitle
                className="text-base font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2"
                data-oid="jo4c9eb"
              >
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <BarChart3 className="w-4 h-4" data-oid="03yr_iy" />
                </div>
                Score Spectrum
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0" data-oid=".wvbgdk">
              <div className="h-[280px] w-full mt-2" data-oid="9rfv65d">
                <ResponsiveContainer width="100%" height="100%" data-oid="mk5obe1">
                  <BarChart
                    data={scoreDistribution}
                    layout="vertical"
                    margin={{ left: -10, right: 20 }}
                    data-oid="qy0_xdi"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="rgba(148, 163, 184, 0.2)"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="range"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={90}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        background: 'rgba(15, 23, 42, 0.9)',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20} data-oid="llhwxhi">
                      {scoreDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={0.9}
                          className="hover:opacity-100 transition-opacity duration-300"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section: Recent Registrations & Session Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-oid="6tyx8k-">
        {/* Recent Registrations Table */}
        <motion.div variants={itemVariants} className="lg:col-span-2" data-oid="2ur.p_v">
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
              <Badge
                variant="outline"
                className="h-7 px-2.5 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 font-extrabold text-[10px]"
              >
                LIVE UPDATES
              </Badge>
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

        {/* Session Activity */}
        <motion.div variants={itemVariants} data-oid="rx3rvfm">
          <Card
            className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden"
            data-oid="irinw0e"
          >
            <CardHeader className="p-4 pb-0" data-oid="mlo85r2">
              <CardTitle
                className="text-base font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2"
                data-oid="nxuibii"
              >
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Clock className="w-4 h-4" data-oid="o-fqvl8" />
                </div>
                Session Integrity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0" data-oid="5yqs5xc">
              <div className="h-[220px] w-full relative" data-oid="mg35w67">
                <ResponsiveContainer width="100%" height="100%" data-oid="4.9-.ql">
                  <PieChart>
                    <Pie
                      data={sessionActivity}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {sessionActivity.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={entry.color}
                          opacity={0.9}
                          className="hover:opacity-100 transition-opacity duration-300"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        background: 'rgba(15, 23, 42, 0.9)',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  data-oid="t7o-u9j"
                >
                  <span
                    className="text-2xl font-black text-slate-950 dark:text-white leading-none mb-0.5"
                    data-oid="nz.mjg8"
                  >
                    {stats.completedTests || 0}
                  </span>
                  <span
                    className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400"
                    data-oid="7f1al:u"
                  >
                    Total Tests
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-1" data-oid="k9a0s5:">
                {sessionActivity.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5"
                    data-oid="s6fyrxe"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5" data-oid=".2fp:ov">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                        data-oid="jl689a2"
                      />
                      <span
                        className="text-[9px] font-black uppercase tracking-wider text-slate-400 truncate"
                        data-oid="7flwyr3"
                      >
                        {item.name}
                      </span>
                    </div>
                    <span
                      className="text-sm font-black text-slate-950 dark:text-white"
                      data-oid="ryj_s:n"
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserAnalytics;
