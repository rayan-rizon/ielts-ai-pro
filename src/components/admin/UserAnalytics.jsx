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
import { cn } from '@/lib/utils';

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
      className="space-y-8 pb-10"
      data-oid="6o_vgjg"
    >
      {/* Header Section */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        data-oid="x.6bi2i"
      >
        <motion.div variants={itemVariants} className="space-y-1.5" data-oid="fpvh1xc">
          <div className="flex items-center gap-3 mb-1" data-oid="h-icn">
            <div
              className="p-2.5 bg-primary/10 rounded-2xl text-primary shadow-inner"
              data-oid="j_zqisa"
            >
              <BarChart3 className="w-6 h-6" data-oid="1mxkow0" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground" data-oid="s-nvif-">
                User Analytics
              </h2>
              <p className="text-muted-foreground font-medium" data-oid="w-_12:7">
                Monitor registration trends and learner engagement metrics
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center gap-3" data-oid="46ygl42">
          <Button
            variant="outline"
            className="h-11 px-5 rounded-2xl font-bold border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/50 transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <div
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-sm group transition-all"
            data-oid="wt4_e28"
          >
            <div className="relative" data-oid="lm:9cb5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" data-oid="010s21v" />
              <div
                className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"
                data-oid="ug5fzkn"
              />
            </div>
            <span
              className="text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400"
              data-oid="y8l83wc"
            >
              LIVE BROADCAST
            </span>
          </div>
        </motion.div>
      </div>

      {/* Compact KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-oid="2ki0x24">
        {[
          {
            title: 'Total Community',
            value: stats.totalUsers || 0,
            trend: '+12.5%',
            positive: true,
            icon: Users,
            color: 'blue',
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
            color: 'indigo',
            description: 'Completed sessions',
          },
        ].map((item, index) => (
          <motion.div key={index} variants={itemVariants} data-oid="muj-bk:">
            <Card
              className="group bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5"
              data-oid="3sdk21e"
            >
              <CardContent className="p-4" data-oid=":i0afil">
                <div className="flex items-center gap-3.5" data-oid="mia:.wn">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-inner shrink-0',
                      `bg-${item.color}-500/10 text-${item.color}-500`
                    )}
                    data-oid="mx5t8e0"
                  >
                    <item.icon className="w-5.5 h-5.5" data-oid="vf9e6gd" />
                  </div>
                  <div className="flex flex-col min-w-0" data-oid=".f-p_kr">
                    <div className="flex items-baseline gap-2" data-oid="val-row">
                      <h3
                        className="text-2xl font-black text-foreground tracking-tight leading-none"
                        data-oid="ofoy91v"
                      >
                        {item.value.toLocaleString()}
                      </h3>
                      {item.trend && (
                        <span
                          className={cn(
                            'text-[10px] font-black flex items-center',
                            item.positive === true
                              ? 'text-emerald-500'
                              : item.positive === false
                                ? 'text-rose-500'
                                : 'text-muted-foreground'
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
                    <p
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 truncate mt-1"
                      data-oid="h9yk:nc"
                    >
                      {item.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-oid="igh71.8">
        {/* Growth Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2" data-oid="v:bl04s">
          <Card
            className="group bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5"
            data-oid="vvw3:h5"
          >
            <CardHeader className="pb-4" data-oid="nuwrbeb">
              <div className="flex items-center justify-between" data-oid="00sgnel">
                <div data-oid="ro4d04p">
                  <CardTitle
                    className="text-xl font-black tracking-tight flex items-center gap-2.5"
                    data-oid="nenkpkm"
                  >
                    <div
                      className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"
                      data-oid="tr-icon"
                    >
                      <TrendingUp className="w-4.5 h-4.5 text-primary" data-oid="xgkk9-9" />
                    </div>
                    Growth Trajectory
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2" data-oid="controls">
                  <div
                    className="bg-muted/30 backdrop-blur-sm rounded-xl p-1 flex border border-border/50"
                    data-oid="fum8s9f"
                  >
                    {['30D', '90D', '1Y'].map((range) => (
                      <button
                        key={range}
                        onClick={() => onRangeChange?.(range)}
                        disabled={isDataLoading}
                        className={cn(
                          'px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                          range === selectedRange
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                          isDataLoading && 'opacity-50 cursor-not-allowed'
                        )}
                        data-oid="jeq9s6d"
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative min-h-[320px]" data-oid="opoldrj">
              {isDataLoading && (
                <div
                  className="absolute inset-0 z-10 bg-card/40 backdrop-blur-[2px] flex items-center justify-center rounded-[2rem]"
                  data-oid="load-over"
                >
                  <Activity className="w-8 h-8 text-primary animate-pulse" data-oid="pulse-act" />
                </div>
              )}
              <div className="h-[320px] w-full mt-6" data-oid="2nk.nrq">
                <ResponsiveContainer width="100%" height="100%" data-oid="4adlh-a">
                  <AreaChart
                    data={userGrowthData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    data-oid="g0chnp5"
                  >
                    <defs data-oid="bfpgtmu">
                      <linearGradient id="colorUsersV2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                      tickMargin={15}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card/95 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-2xl">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                {label}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-lg font-black text-foreground">
                                  {payload[0].value.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground">
                                  Learners
                                </span>
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
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorUsersV2)"
                      animationDuration={2000}
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
            className="group bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5"
            data-oid="qex7i6h"
          >
            <CardHeader className="pb-4" data-oid="9v-co2a">
              <CardTitle
                className="text-xl font-black tracking-tight flex items-center gap-2.5"
                data-oid="jo4c9eb"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5 text-primary" data-oid="03yr_iy" />
                </div>
                Score Spectrum
              </CardTitle>
            </CardHeader>
            <CardContent data-oid=".wvbgdk">
              <div className="h-[320px] w-full mt-2" data-oid="9rfv65d">
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
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="range"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={90}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                      contentStyle={{
                        borderRadius: '1.5rem',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--card)/0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={24} data-oid="llhwxhi">
                      {scoreDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={0.8}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-oid="6tyx8k-">
        {/* Recent Registrations Table */}
        <motion.div variants={itemVariants} className="lg:col-span-2" data-oid="2ur.p_v">
          <Card
            className="group bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5"
            data-oid="sx:ofyv"
          >
            <CardHeader
              className="flex flex-row items-center justify-between pb-6"
              data-oid="yvxb11s"
            >
              <div data-oid="z6cebiy">
                <CardTitle
                  className="text-xl font-black tracking-tight flex items-center gap-2.5 text-foreground"
                  data-oid="5xk8eza"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-4.5 h-4.5 text-primary" data-oid="fzltvl-" />
                  </div>
                  Recent Signups
                </CardTitle>
                <CardDescription
                  className="font-bold text-xs uppercase tracking-widest text-muted-foreground/60 mt-1"
                  data-oid="amy5u24"
                >
                  Latest learning community arrivals
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="h-8 px-4 rounded-xl border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-black tracking-widest text-[9px]"
              >
                LIVE UPDATES
              </Badge>
            </CardHeader>
            <CardContent data-oid="wlhb9u6">
              <div className="space-y-1.5" data-oid="wsyb62s">
                {recentSignups.length > 0 ? (
                  recentSignups.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-muted/40 transition-all border border-transparent hover:border-border/50 group/row"
                      data-oid="56ccbci"
                    >
                      <div className="flex items-center gap-4" data-oid="n:is3ee">
                        <div
                          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center text-base font-black text-primary border border-primary/20 shadow-inner group-hover/row:scale-105 transition-transform"
                          data-oid="wes-4wo"
                        >
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <div data-oid="shxiivr">
                          <p
                            className="font-black text-sm text-foreground leading-none mb-1.5"
                            data-oid="i6k38iz"
                          >
                            {user.full_name || 'learner_' + user.id.slice(0, 4)}
                          </p>
                          <p
                            className="text-xs text-muted-foreground/80 font-bold"
                            data-oid="-vrgfkb"
                          >
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8" data-oid="4eyz4ma">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[10px] font-black uppercase border backdrop-blur-md shadow-sm transition-all duration-300',
                            user.subscription_tier === 'premium'
                              ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400 shadow-purple-500/5 hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300'
                              : user.subscription_tier === 'pro'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 shadow-blue-500/5 hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300'
                                : 'bg-slate-500/10 text-slate-500 border-border/50 dark:text-slate-400'
                          )}
                          data-oid=".0ab3b4"
                        >
                          {user.subscription_tier || 'Free'}
                        </Badge>
                        <div className="flex flex-col items-end min-w-[80px]">
                          <span
                            className="text-foreground font-black text-[11px]"
                            data-oid="53tp1h8"
                          >
                            {new Date(user.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                            JOINED
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl opacity-0 group-hover/row:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="text-center py-20 text-muted-foreground text-sm font-medium italic opacity-50"
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
            className="group bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5"
            data-oid="irinw0e"
          >
            <CardHeader className="pb-0" data-oid="mlo85r2">
              <CardTitle
                className="text-xl font-black tracking-tight flex items-center gap-2.5"
                data-oid="nxuibii"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4.5 h-4.5 text-primary" data-oid="o-fqvl8" />
                </div>
                Session Integrity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0" data-oid="5yqs5xc">
              <div className="h-[280px] w-full relative" data-oid="mg35w67">
                <ResponsiveContainer width="100%" height="100%" data-oid="4.9-.ql">
                  <PieChart>
                    <Pie
                      data={sessionActivity}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={105}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {sessionActivity.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={entry.color}
                          opacity={0.8}
                          className="hover:opacity-100 transition-opacity duration-300"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '1.5rem',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--card)/0.95)',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  data-oid="t7o-u9j"
                >
                  <span className="text-3xl font-black mb-1" data-oid="nz.mjg8">
                    {stats.completedTests}
                  </span>
                  <span
                    className="text-[10px] items-center uppercase font-black tracking-widest text-muted-foreground/60"
                    data-oid="7f1al:u"
                  >
                    Total Tests
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full" data-oid="k9a0s5:">
                {sessionActivity.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-3.5 rounded-2xl bg-muted/20 border border-border/50 group-hover:bg-muted/40 transition-colors"
                    data-oid="s6fyrxe"
                  >
                    <div className="flex items-center gap-2 mb-1.5" data-oid=".2fp:ov">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                        data-oid="jl689a2"
                      />
                      <span
                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60"
                        data-oid="7flwyr3"
                      >
                        {item.name}
                      </span>
                    </div>
                    <span className="text-lg font-black text-foreground" data-oid="ryj_s:n">
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
