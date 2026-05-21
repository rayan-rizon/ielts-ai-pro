import React, { useState, useEffect, useMemo } from 'react';
import { m } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Clock,
  UserCheck,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/cn';

import { supabase } from '@/lib/supabase';

const ADMIN_ANALYTICS_LIMIT = 10000;
const USER_ANALYTICS_COLUMNS = 'id,email,full_name,created_at,last_active,subscription_tier';
const SESSION_ANALYTICS_COLUMNS = 'id,test_type,score,is_completed,completed_at,created_at';

const countRows = async (table, applyFilters = (query) => query) => {
  const query = applyFilters(supabase.from(table).select('id', { count: 'exact', head: true }));
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

const AdminOverview = () => {
  const [stats, setStats] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [activityFeed, setActivityFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized date and greeting matching user dashboard
  const { dateLabel, greeting } = useMemo(() => {
    const now = new Date();
    const label = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const hour = now.getHours();
    const greet = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    return { dateLabel: label, greeting: greet };
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [
        usersResponse,
        sessionsResponse,
        totalUsers,
        premiumUsers,
        totalQuestions,
        totalPassages,
        activePromoCodes,
      ] = await Promise.all([
        supabase
          .from('users')
          .select(USER_ANALYTICS_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(ADMIN_ANALYTICS_LIMIT),
        supabase
          .from('test_sessions')
          .select(SESSION_ANALYTICS_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(ADMIN_ANALYTICS_LIMIT),
        countRows('users'),
        countRows('users', (query) => query.in('subscription_tier', ['pro', 'premium'])),
        countRows('questions'),
        countRows('passages', (query) => query.eq('is_active', true)),
        countRows('promo_codes', (query) => query.eq('is_active', true)),
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (sessionsResponse.error) throw sessionsResponse.error;

      const usersData = usersResponse.data || [];
      const sessionsData = sessionsResponse.data || [];

      await processAnalyticsData(usersData, sessionsData);

      const completedSessions = sessionsData.filter((s) => s.is_completed).length;
      const avgScore =
        completedSessions > 0
          ? sessionsData
              .filter((s) => s.score !== null && s.score !== undefined)
              .reduce((acc, s) => acc + s.score, 0) /
            sessionsData.filter((s) => s.score !== null && s.score !== undefined).length
          : 0;

      setStats({
        totalUsers,
        premiumUsers,
        totalQuestions,
        totalPassages,
        completedTests: completedSessions,
        avgScore: avgScore.toFixed(1),
        conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0,
        activePromoCodes,
        activeTests: sessionsData.filter((s) => !s.is_completed).length,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalyticsData = async (usersData, sessionsData) => {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const liveUsers = usersData.filter(
        (u) => u.last_active && new Date(u.last_active) > twentyFourHoursAgo
      ).length;
      const weeklyActiveUsers = usersData.filter(
        (u) => u.last_active && new Date(u.last_active) > sevenDaysAgo
      ).length;
      const monthlyActiveUsers = usersData.filter(
        (u) => u.last_active && new Date(u.last_active) > thirtyDaysAgo
      ).length;

      // User acquisition over time
      const userAcquisition = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const newUsersOnDay = usersData.filter(
          (u) => u.created_at.split('T')[0] === dateStr
        ).length;
        const cumulativeUsers = usersData.filter((u) => new Date(u.created_at) <= date).length;

        userAcquisition.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          newUsers: newUsersOnDay,
          totalUsers: cumulativeUsers,
        });
      }

      // User engagement metrics (last 7 days)
      const engagementMetrics = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const sessionsOnDay = sessionsData.filter(
          (s) => s.created_at.split('T')[0] === dateStr
        ).length;
        const completedOnDay = sessionsData.filter(
          (s) => s.completed_at && s.completed_at.split('T')[0] === dateStr
        ).length;
        const activeUsersOnDay = usersData.filter(
          (u) => u.last_active && u.last_active.split('T')[0] === dateStr
        ).length;

        engagementMetrics.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sessions: sessionsOnDay,
          completed: completedOnDay,
          activeUsers: activeUsersOnDay,
        });
      }

      // Module analytics
      const moduleAnalytics = ['reading', 'writing', 'listening', 'speaking'].map((module) => {
        const moduleSessions = sessionsData.filter((s) => s.test_type === module);
        const completedSessions = moduleSessions.filter((s) => s.is_completed);
        const avgScore =
          completedSessions.length > 0
            ? completedSessions
                .filter((s) => s.score !== undefined && s.score !== null)
                .reduce((acc, s) => acc + s.score, 0) /
              completedSessions.filter((s) => s.score !== undefined && s.score !== null).length
            : 0;

        return {
          module: module.charAt(0).toUpperCase() + module.slice(1),
          totalSessions: moduleSessions.length,
          completedSessions: completedSessions.length,
          completionRate:
            moduleSessions.length > 0
              ? ((completedSessions.length / moduleSessions.length) * 100).toFixed(1)
              : 0,
          avgScore: avgScore.toFixed(1),
        };
      });

      setAnalyticsData({
        liveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        userAcquisition,
        engagementMetrics,
        moduleAnalytics,
      });

      // Activity Feed - Only most recent signups
      const combinedFeed = usersData.slice(0, 20).map((u) => ({
        type: 'signup',
        id: `signup-${u.id}`,
        user: u.full_name || u.email.split('@')[0],
        timestamp: new Date(u.created_at),
      }));

      setActivityFeed(combinedFeed);
    } catch (error) {
      console.error('Error processing analytics data:', error);
      setAnalyticsData({});
    }
  };

  useEffect(() => {
    loadAllData();

    let channel;
    if (typeof window !== 'undefined' && window.WebSocket) {
      try {
        channel = supabase
          .channel('admin-updates')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'users' },
            (payload) => {
              const newActivity = {
                id: `signup-${payload.new.id}`,
                type: 'signup',
                user: payload.new.full_name || payload.new.email?.split('@')[0],
                timestamp: new Date(payload.new.created_at),
              };
              setActivityFeed((prev) => [newActivity, ...prev.slice(0, 19)]);
              setStats((prev) => ({ ...prev, totalUsers: (prev.totalUsers || 0) + 1 }));
            }
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              console.warn('Real-time subscription error in AdminOverview: Connection failed');
            }
          });
      } catch (err) {
        console.warn('Real-time subscription failed to initialize in AdminOverview:', err.message);
      }
    } else {
      console.info('WebSockets not available or disabled (AdminOverview)');
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" data-oid="ujl2svy">
        <div
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
          data-oid="2i9ndnt"
        />

        <p
          className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse"
          data-oid="82kuusf"
        >
          Initializing Dashboard...
        </p>
      </div>
    );
  }

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
      data-oid="miu6d.p"
    >
      {/* Header Section - Matched with User Dashboard */}
      <m.header variants={itemVariants} className="space-y-6" data-oid="9.fgt2c">
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          data-oid="4emss84"
        >
          <div className="flex-1" data-oid="p:7zv.x">
            <div className="flex items-center gap-3" data-oid="steve5:">
              <Badge
                variant="outline"
                className="px-3 py-1 rounded-full bg-primary/5 border-primary/20 text-primary font-bold text-[10px] uppercase tracking-wider"
                data-oid="omcs.7b"
              >
                {dateLabel}
              </Badge>
              <Badge
                className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 border-0 text-white font-black text-[10px] shadow-xl shadow-red-500/30"
                data-oid="42j46jl"
              >
                <ShieldCheck
                  className="w-2.5 h-2.5 mr-1 text-white fill-white"
                  data-oid="w78.v5p"
                />
                ADMIN SYSTEM
              </Badge>
            </div>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-3 leading-tight"
              data-oid="4r:gftq"
            >
              {greeting},{' '}
              <span className="text-red-600 dark:text-red-400" data-oid="pg358tw">
                Admin
              </span>{' '}
              🛠️
            </h1>
            <p
              className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl"
              data-oid="x9ms8.6"
            >
              Platform status is{' '}
              <span
                className="text-emerald-500 font-bold uppercase tracking-tight"
                data-oid="-u_uk72"
              >
                Optimal
              </span>
              . Managing{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold" data-oid="9moo2pj">
                {stats.totalUsers || 0} learners
              </span>{' '}
              globally.
            </p>
          </div>

          <div
            className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4"
            data-oid="fhv7q2r"
          >
            {/* Admin Stats Bar - Compact & Information Rich */}
            <m.div
              whileHover={{ y: -4 }}
              className={cn(
                'flex flex-col md:flex-row items-stretch md:items-center bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full xl:w-auto overflow-hidden transition-all duration-300'
              )}
              data-oid="3-r4.xb"
            >
              {/* Total Users */}
              <div
                className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5"
                data-oid="--wcui8"
              >
                <div
                  className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20"
                  data-oid="57b3kz9"
                >
                  <Users className="w-4 h-4 text-blue-700 dark:text-blue-300" data-oid="8z.ni-o" />
                </div>
                <div className="flex flex-col" data-oid="oii4-7s">
                  <span
                    className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none"
                    data-oid="pv1tbgy"
                  >
                    Users
                  </span>
                  <span
                    className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                    data-oid="9nh6y4f"
                  >
                    {stats.totalUsers || 0}
                  </span>
                </div>
              </div>

              {/* Live Users */}
              <div
                className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5"
                data-oid="wxvrwpd"
              >
                <div
                  className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20 relative"
                  data-oid="ddmqte."
                >
                  <span className="absolute top-0 right-0 flex h-2 w-2" data-oid="kdehk.z">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                      data-oid="r56c5.y"
                    ></span>
                    <span
                      className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"
                      data-oid="x:6uowe"
                    ></span>
                  </span>
                  <Zap
                    className="w-4 h-4 text-emerald-700 dark:text-emerald-300 fill-emerald-500/20"
                    data-oid="ped52bu"
                  />
                </div>
                <div className="flex flex-col" data-oid="xo5:67r">
                  <span
                    className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none"
                    data-oid="z3ql:dr"
                  >
                    Live
                  </span>
                  <span
                    className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                    data-oid="x7oog1o"
                  >
                    {analyticsData.liveUsers || 0}
                  </span>
                </div>
              </div>

              {/* Performance */}
              <div
                className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5"
                data-oid="555i-3t"
              >
                <div
                  className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20"
                  data-oid=".pi5w5."
                >
                  <Target
                    className="w-4 h-4 text-amber-700 dark:text-amber-300"
                    data-oid="-4artr6"
                  />
                </div>
                <div className="flex flex-col" data-oid="7virsdv">
                  <span
                    className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none"
                    data-oid="zhgyj.f"
                  >
                    Avg Band
                  </span>
                  <span
                    className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                    data-oid="bpiuu-6"
                  >
                    {stats.avgScore || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Growth */}
              <div className="flex items-center gap-3 px-4 py-2" data-oid="6.6ou11">
                <div
                  className="w-9 h-9 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-500/20"
                  data-oid="583_7f4"
                >
                  <TrendingUp
                    className="w-4 h-4 text-violet-700 dark:text-violet-300"
                    data-oid="xbxjf4g"
                  />
                </div>
                <div className="flex flex-col" data-oid="59qkjwk">
                  <span
                    className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none"
                    data-oid="8dsd4qi"
                  >
                    Growth
                  </span>
                  <span
                    className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                    data-oid="ua3:aci"
                  >
                    +{stats.conversionRate || 0}%
                  </span>
                </div>
              </div>
            </m.div>
          </div>
        </div>
      </m.header>

      {/* Main Content Layout - Bento Grid */}
      <div className="grid grid-cols-12 gap-5 lg:gap-6 auto-rows-max" data-oid="7om8dy-">
        {/* Growth Analytics - Primary Chart */}
        <div className="col-span-12 lg:col-span-8" data-oid="e0n8sfu">
          <m.div variants={itemVariants} data-oid="ra69c4r">
            <Card
              className="rounded-3xl border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden group"
              data-oid="_:9ji2:"
            >
              <CardHeader
                className="flex flex-row items-center justify-between pb-2"
                data-oid="eknxff-"
              >
                <div data-oid="6jjh6xq">
                  <CardTitle
                    className="text-lg font-black tracking-tight flex items-center gap-2"
                    data-oid="zvk_0aa"
                  >
                    <TrendingUp className="w-5 h-5 text-indigo-500" data-oid="e41amff" />
                    User Growth Engine
                  </CardTitle>
                  <p
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                    data-oid="_pyqpy7"
                  >
                    Last 30 Days Acquisition
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-0 rounded-full font-bold"
                  data-oid="08.6vep"
                >
                  Real-time Data
                </Badge>
              </CardHeader>
              <CardContent data-oid="5--qa9y">
                <div className="h-[350px] w-full mt-4" data-oid="y8quo7.">
                  <ResponsiveContainer width="100%" height="100%" data-oid="ey4.9dv">
                    <AreaChart data={analyticsData.userAcquisition || []} data-oid="x5re60c">
                      <defs data-oid="f_rpz.a">
                        <linearGradient
                          id="colorUsers"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                          data-oid="6uzoobh"
                        >
                          <stop
                            offset="5%"
                            stopColor="#6366f1"
                            stopOpacity={0.3}
                            data-oid="y3yoio9"
                          />

                          <stop
                            offset="95%"
                            stopColor="#6366f1"
                            stopOpacity={0}
                            data-oid="3rdfz_j"
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-slate-800"
                        opacity={0.5}
                        data-oid="x6ld_73"
                      />

                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                        tickMargin={10}
                        data-oid="b.skujk"
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                        data-oid="tgmc7or"
                      />

                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div
                                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-white/10 p-3 rounded-2xl shadow-2xl"
                                data-oid="drmnebr"
                              >
                                <p
                                  className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"
                                  data-oid="vvrkgif"
                                >
                                  {label}
                                </p>
                                <div className="flex items-center gap-2" data-oid="z_hz3l1">
                                  <div
                                    className="w-2 h-2 rounded-full bg-indigo-500"
                                    data-oid="o9m.ns5"
                                  />

                                  <p
                                    className="text-sm font-black text-slate-900 dark:text-white"
                                    data-oid="wdj7ubt"
                                  >
                                    {payload[0].value.toLocaleString()}{' '}
                                    <span
                                      className="text-[10px] font-medium text-slate-500"
                                      data-oid="7qis.pc"
                                    >
                                      Users
                                    </span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                        data-oid="01.xo-b"
                      />

                      <Area
                        type="monotone"
                        dataKey="totalUsers"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                        animationDuration={1500}
                        data-oid="x7ahgby"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </m.div>
        </div>

        {/* Live Activity Stream - Secondary Bento Tile */}
        <div className="col-span-12 lg:col-span-4" data-oid="8y9n9b7">
          <m.div variants={itemVariants} className="h-full" data-oid="8kfac76">
            <Card
              className="rounded-3xl border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-none h-full overflow-hidden"
              data-oid="nmvno70"
            >
              <CardHeader
                className="pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5"
                data-oid="46_u:bw"
              >
                <CardTitle
                  className="text-lg font-black tracking-tight flex items-center gap-2 text-rose-500"
                  data-oid="u7x8cj2"
                >
                  <Activity className="w-5 h-5" data-oid="lczw:jk" />
                  Live Event Stream
                </CardTitle>
                <p
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]"
                  data-oid="bafjpuj"
                >
                  System Pulse
                </p>
              </CardHeader>
              <CardContent className="p-0" data-oid="v3lgmwu">
                <div className="overflow-y-auto max-h-[420px] custom-scrollbar" data-oid="ort0p1u">
                  {activityFeed.length > 0 ? (
                    <div
                      className="divide-y divide-slate-100 dark:divide-white/5"
                      data-oid="rw8g.ff"
                    >
                      {activityFeed.map((activity, i) => (
                        <m.div
                          key={activity.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                          data-oid="rjf27x:"
                        >
                          <div className="flex items-start gap-4" data-oid="qq8ty0y">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                              data-oid="mhxsn6f"
                            >
                              <UserCheck className="w-5 h-5" data-oid="5bgrq4r" />
                            </div>
                            <div className="min-w-0 flex-1" data-oid="rgdan2u">
                              <p
                                className="text-sm font-black text-slate-900 dark:text-white truncate"
                                data-oid="ajody6w"
                              >
                                {activity.user}
                              </p>
                              <p
                                className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5"
                                data-oid="odn02yn"
                              >
                                Joined the community
                              </p>
                              <div className="flex items-center gap-2 mt-2" data-oid="oimy03d">
                                <Clock className="w-3 h-3 text-slate-400" data-oid="0xe83.n" />
                                <span
                                  className="text-[10px] font-bold text-slate-400 tracking-wider"
                                  data-oid="1qk1s:t"
                                >
                                  {activity.timestamp.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                  ,{' '}
                                  {activity.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="self-center" data-oid="elbf2x8">
                              <ArrowUpRight
                                className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors"
                                data-oid="wi1l2n3"
                              />
                            </div>
                          </div>
                        </m.div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3"
                      data-oid="f4lfown"
                    >
                      <div
                        className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center"
                        data-oid="qgmc279"
                      >
                        <Activity className="w-6 h-6 opacity-20" data-oid="d.l7-5e" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest" data-oid="1f4idtu">
                        Awaiting Pulse...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </m.div>
        </div>

        {/* Module Performance Grid - Tertiary Bento Row */}
        <div className="col-span-12" data-oid="l2ot9c.">
          <m.div variants={itemVariants} data-oid="x1lr66l">
            <div className="flex items-center justify-between mb-4 mt-2" data-oid="g-:hy_5">
              <div data-oid="2ctc0c:">
                <h3
                  className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3"
                  data-oid="q-p3ufx"
                >
                  <BarChart3 className="w-6 h-6 text-emerald-500" data-oid="dswxp8." />
                  Module Intelligence
                </h3>
                <p
                  className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1"
                  data-oid="5plw86v"
                >
                  Global Performance Metrics
                </p>
              </div>
            </div>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              data-oid="2cxqlpj"
            >
              {(analyticsData.moduleAnalytics || []).map((module, index) => {
                const colors = [
                  { bg: 'bg-blue-600', text: 'text-blue-500', icon: BookOpen },
                  { bg: 'bg-orange-600', text: 'text-orange-500', icon: PenTool },
                  { bg: 'bg-violet-600', text: 'text-violet-500', icon: Headphones },
                  { bg: 'bg-rose-600', text: 'text-rose-500', icon: Mic },
                ];

                const theme = colors[index % colors.length];
                const score = parseFloat(module.avgScore);
                const percentage = (score / 9) * 100;

                return (
                  <m.div key={module.module} whileHover={{ y: -5 }} data-oid="zwgx8zv">
                    <Card
                      className="rounded-3xl border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg border-2 border-transparent hover:border-indigo-500/20 transition-all p-5"
                      data-oid="j5yxlm-"
                    >
                      <div className="flex items-center gap-4 mb-4" data-oid="svbt3nh">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20',
                            theme.bg
                          )}
                          data-oid="ea6sr0-"
                        >
                          <theme.icon className="w-6 h-6" data-oid="n8n8zmh" />
                        </div>
                        <div data-oid="1arv9fj">
                          <h4
                            className="font-black text-slate-900 dark:text-white"
                            data-oid="g7lckfa"
                          >
                            {module.module}
                          </h4>
                          <p
                            className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                            data-oid="uhwf2yr"
                          >
                            {module.totalSessions} Sessions
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3" data-oid="ai9sa97">
                        <div className="flex justify-between items-end" data-oid="gv1ash-">
                          <span
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                            data-oid="tl0oogb"
                          >
                            Average Score
                          </span>
                          <span
                            className="text-2xl font-black text-slate-900 dark:text-white leading-none"
                            data-oid=".15ua5x"
                          >
                            {module.avgScore}{' '}
                            <span className="text-[10px] text-slate-400" data-oid="x7_a.5-">
                              / 9
                            </span>
                          </span>
                        </div>
                        <div
                          className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden"
                          data-oid="iaq7eiq"
                        >
                          <m.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1.5, ease: 'circOut' }}
                            className={cn('h-full rounded-full', theme.bg)}
                            data-oid="eqzmnef"
                          />
                        </div>
                        <div
                          className="flex justify-between text-[10px] font-bold"
                          data-oid="agpkxqp"
                        >
                          <span
                            className="text-emerald-500 flex items-center gap-1"
                            data-oid="h7qkcxu"
                          >
                            <TrendingUp className="w-3 h-3" data-oid="nfiwt.." />{' '}
                            {module.completionRate}% Done
                          </span>
                          <span className="text-slate-400 font-black" data-oid="u5hglvn">
                            ACTIVE
                          </span>
                        </div>
                      </div>
                    </Card>
                  </m.div>
                );
              })}
            </div>
          </m.div>
        </div>
      </div>
    </m.div>
  );
};

export default AdminOverview;
