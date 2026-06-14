import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Activity,
  Cpu,
  TrendingUp,
  Users,
  RefreshCw,
  DollarSign,
  Sparkles,
  Zap,
  Clock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { AIApiUsage } from '@/entities';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

import PaginationControls from './shared/PaginationControls';

const AIUsageManagement = () => {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [userStats, setUserStats] = useState([]);
  const [totals, setTotals] = useState({
    totalApiCalls: 0,
    totalCachedCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    uniqueUsers: 0,
  });
  const [dailyStats, setDailyStats] = useState([]);
  const [endpointStats, setEndpointStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('totalCalls');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchUserStats = async () => {
    try {
      setLoading(true);

      const [paginatedUsers, aggTotals] = await Promise.all([
        AIApiUsage.getUserStatsPaginated({
          page: currentPage,
          pageSize,
          sortField,
          sortDirection,
        }),
        AIApiUsage.getUsageAggregates(), // New RPC for top cards
      ]);

      const formattedUsers = (paginatedUsers.data || []).map((u) => ({
        user: {
          id: u.user_id,
          full_name: u.full_name,
          email: u.email,
          avatar_url: u.avatar_url,
        },
        totalCalls: u.total_calls,
        cachedCalls: u.cached_calls,
        totalTokens: u.total_tokens,
        cost: u.estimated_cost,
        endpoints: u.endpoints || {},
        lastActivity: u.last_activity,
      }));

      setUserStats(formattedUsers);
      setTotalItems(paginatedUsers.total || 0);
      setTotalPages(Math.ceil((paginatedUsers.total || 0) / pageSize));

      setTotals(aggTotals || {});
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartStats = async () => {
    try {
      const [daily, endpoints] = await Promise.all([
        AIApiUsage.getDailyStats(30).catch(() => []),
        AIApiUsage.getEndpointStats().catch(() => []),
      ]);
      setDailyStats(daily || []);
      setEndpointStats(endpoints || []);
    } catch (error) {
      console.error('Error fetching chart stats:', error);
    }
  };

  useEffect(() => {
    fetchUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortDirection]);

  useEffect(() => {
    fetchChartStats();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sorted users are now coming from backend, so we just use userStats directly
  const sortedUsers = userStats;

  const formatCost = (cost) => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Max calls provided by backend for progress bar context, or just use local max for now
  const maxCalls = Math.max(...userStats.map((u) => u.totalCalls), 1);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const endpointColors = {
    generateDetailedFeedback: '#8b5cf6',
    generateStudyRecommendations: '#06b6d4',
    generateAdaptiveLearningPath: '#22c55e',
    processSpeakingSession: '#10b981',
    transcribeAudio: '#f59e0b',
    SpeakingSession: '#10b981',
  };

  const getModelForEndpoint = (endpoint) => {
    const mapping = {
      generateDetailedFeedback: 'Gemini 2.5 Flash',
      processSpeakingSession: 'Gemini 2.5 Flash',
      transcribeAudio: 'Gemini 2.5 Flash',
      generateStudyRecommendations: 'Gemini 2.5 Flash-Lite',
      evaluateSpeakingTest: 'Gemini 2.5 Flash',
      generateAdaptiveLearningPath: 'Gemini 2.5 Flash-Lite',
      synthesizeSpeech: 'Google Cloud TTS',
      SpeakingSession: 'Gemini 2.5 Flash',
    };
    return mapping[endpoint] || 'Gemini Flash';
  };

  const SortHeader = ({ field, label }) => (
    <TableHead
      className="text-xs font-bold uppercase text-violet-700 dark:text-violet-300 cursor-pointer select-none hover:bg-violet-100/50 dark:hover:bg-violet-900/30 transition-colors"
      onClick={() => handleSort(field)}
      data-oid="n2040p2"
    >
      <div className="flex items-center gap-1" data-oid="96:rtsr">
        {label}
        {sortField === field && (
          <span className="text-violet-500" data-oid="96283j9">
            {sortDirection === 'asc' ? (
              <ChevronUp className="w-3 h-3" data-oid="1ojj2xt" />
            ) : (
              <ChevronDown className="w-3 h-3" data-oid="o76bceq" />
            )}
          </span>
        )}
      </div>
    </TableHead>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-10"
      data-oid="s-e8kw3"
    >
      {/* Header */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
        data-oid="0wxkv9e"
      >
        <motion.div variants={itemVariants} className="space-y-1" data-oid="fi28wvm">
          <h2
            className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3"
            data-oid="d8-5scy"
          >
            <div
              className="p-2 bg-violet-500/10 rounded-lg text-violet-500 shadow-sm border border-violet-500/20"
              data-oid="2we:syv"
            >
              <Cpu className="w-6 h-6" data-oid="tnt:qsf" />
            </div>
            AI Usage Analytics
          </h2>
          <p className="text-muted-foreground text-lg ml-1" data-oid="l3j5geg">
            Monitor AI API consumption and costs per user
          </p>
        </motion.div>

        <motion.div variants={itemVariants} data-oid="0mm_ivx">
          <Button
            onClick={() => {
              fetchUserStats();
              fetchChartStats();
            }}
            variant="outline"
            className="h-10 gap-2"
            data-oid="4xj4_fd"
          >
            <RefreshCw className="w-4 h-4" data-oid="0jp-fo0" />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5" data-oid="n0.2uw1">
        {[
          {
            label: 'Total API Calls',
            value: totals.totalApiCalls,
            icon: Activity,
            color: 'violet',
            gradient: 'from-violet-500 to-purple-600',
          },
          {
            label: 'Total Cost',
            value: formatCost(totals.totalCost),
            icon: DollarSign,
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-600',
            isString: true,
          },
          {
            label: 'Total Tokens',
            value: formatNumber(totals.totalTokens),
            icon: Zap,
            color: 'amber',
            gradient: 'from-amber-500 to-orange-600',
            isString: true,
          },
          {
            label: 'Cache Hits',
            value: totals.totalCachedCalls,
            subValue:
              totals.totalApiCalls > 0
                ? `${((totals.totalCachedCalls / totals.totalApiCalls) * 100).toFixed(0)}% Rate`
                : '0% Rate',
            icon: Sparkles,
            color: 'blue',
            gradient: 'from-blue-500 to-cyan-600',
          },
          {
            label: 'Active Users',
            value: totals.uniqueUsers,
            icon: Users,
            color: 'pink',
            gradient: 'from-pink-500 to-rose-600',
          },
        ].map((item, idx) => (
          <motion.div key={idx} variants={itemVariants} data-oid="1::fet9">
            <Card
              className="border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden rounded-2xl group relative h-full"
              data-oid="zq6.--4"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                data-oid=":q75c_t"
              />

              <CardContent
                className="p-5 flex flex-col justify-between h-full relative"
                data-oid="okleg5r"
              >
                <div className="flex items-center justify-between mb-2" data-oid="t6lu2pl">
                  <p
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60"
                    data-oid="6gfv9:l"
                  >
                    {item.label}
                  </p>
                  <div
                    className={`p-2 rounded-lg bg-${item.color}-500/10 text-${item.color}-500 group-hover:scale-110 transition-transform duration-500`}
                    data-oid="kdja-ju"
                  >
                    <item.icon className="w-4 h-4" data-oid="hhslrmk" />
                  </div>
                </div>
                <div data-oid="w_72d8r">
                  <h4
                    className="text-2xl font-black text-foreground leading-none"
                    data-oid="u:wrifr"
                  >
                    {loading ? (
                      <Skeleton className="h-7 w-16" data-oid="z8ij4t0" />
                    ) : item.isString ? (
                      item.value
                    ) : (
                      item.value.toLocaleString()
                    )}
                  </h4>
                  {item.subValue && !loading && (
                    <p
                      className={`text-[10px] mt-1 font-bold text-${item.color}-500/80`}
                      data-oid="cqjjos5"
                    >
                      {item.subValue}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-oid="_zfu_p9">
        {/* Daily Usage Chart */}
        <motion.div variants={itemVariants} data-oid="c64z10a">
          <Card
            className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl"
            data-oid="i51wr0g"
          >
            <CardHeader className="pb-2" data-oid="u4hky_x">
              <CardTitle className="text-lg font-bold flex items-center gap-2" data-oid="e:j3f2m">
                <TrendingUp className="w-5 h-5 text-violet-500" data-oid="rqr79s7" />
                Daily API Usage (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0" data-oid="9g6dlrf">
              <div className="h-64" data-oid="i2w63bh">
                {dailyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" data-oid=":bqd.ut">
                    <LineChart data={dailyStats} data-oid="6m.w235">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border/30"
                        data-oid="0f7:yp9"
                      />

                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val) =>
                          new Date(val).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        }
                        className="text-muted-foreground"
                        data-oid="p8l6s7f"
                      />

                      <YAxis
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        data-oid="cka3e.a"
                      />

                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        data-oid="8vzsloj"
                      />

                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                        name="Total"
                        data-oid="fgx.p0-"
                      />

                      <Line
                        type="monotone"
                        dataKey="cached"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name="Cached"
                        data-oid="wth.tfc"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="h-full flex items-center justify-center text-muted-foreground"
                    data-oid="825.wda"
                  >
                    <div className="text-center" data-oid="bi764g5">
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" data-oid="9.4apbk" />
                      <p data-oid="3:mf.37">No usage data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Endpoint Breakdown */}
        <motion.div variants={itemVariants} data-oid="3aq5dw-">
          <Card
            className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl"
            data-oid="ed.imum"
          >
            <CardHeader className="pb-2" data-oid="2f7d.-9">
              <CardTitle className="text-lg font-bold flex items-center gap-2" data-oid="v-f1hh4">
                <Cpu className="w-5 h-5 text-violet-500" data-oid="d5yd2ud" />
                Usage by Endpoint
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0" data-oid="9lxoewq">
              <div className="h-64" data-oid="murs6b5">
                {endpointStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" data-oid="tfxmgx0">
                    <BarChart data={endpointStats} layout="vertical" data-oid="evmh2fe">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border/30"
                        data-oid="2nf9o5z"
                      />

                      <XAxis type="number" tick={{ fontSize: 11 }} data-oid="hxzt5je" />
                      <YAxis
                        type="category"
                        dataKey="endpoint"
                        tick={{ fontSize: 10 }}
                        width={120}
                        tickFormatter={(val) => val.replace('generate', '').replace('process', '')}
                        data-oid="pd-f07t"
                      />

                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        data-oid="eww79ql"
                      />

                      <Bar dataKey="total" radius={[0, 4, 4, 0]} data-oid="7fhqspn">
                        {endpointStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={endpointColors[entry.endpoint] || '#8b5cf6'}
                            data-oid="-z9y709"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="h-full flex items-center justify-center text-muted-foreground"
                    data-oid="vfzqp4w"
                  >
                    <div className="text-center" data-oid="4gd64oa">
                      <Cpu className="w-10 h-10 mx-auto mb-2 opacity-50" data-oid="e0-iyq:" />
                      <p data-oid="m7n70y1">No endpoint data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* User Usage Table */}
      <motion.div variants={itemVariants} data-oid="x6py21p">
        <Card
          className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden"
          data-oid="82m_2vk"
        >
          <CardHeader className="pb-2 border-b border-border/30" data-oid="z72s0wy">
            <CardTitle className="text-lg font-bold flex items-center gap-2" data-oid="3hda8h-">
              <Users className="w-5 h-5 text-violet-500" data-oid="mukzmle" />
              Usage Per User
            </CardTitle>
          </CardHeader>
          <Table data-oid="o0dopdp">
            <TableHeader
              className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-900/20 dark:to-purple-900/20"
              data-oid="u_jeyt2"
            >
              <TableRow data-oid="sab72bu">
                <SortHeader field="name" label="User" data-oid=":uzf_ah" />
                <SortHeader field="totalCalls" label="Total Calls" data-oid="xf47b4m" />
                <SortHeader field="cachedCalls" label="Cached" data-oid="aevu_ur" />
                <SortHeader field="totalTokens" label="Tokens" data-oid="1r8w3.7" />
                <SortHeader field="cost" label="Cost" data-oid="t1qea0j" />
                <TableHead
                  className="text-xs font-bold uppercase text-violet-700 dark:text-violet-300"
                  data-oid="0f2n7bl"
                >
                  Top Endpoints & Models
                </TableHead>
                <TableHead
                  className="text-xs font-bold uppercase text-violet-700 dark:text-violet-300"
                  data-oid="3brfax8"
                >
                  Last Activity
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="ep6lkez">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} data-oid="6prk0zb">
                    <TableCell colSpan={7} className="py-4" data-oid="8chy42i">
                      <Skeleton className="h-12 w-full" data-oid="c.c_-n-" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedUsers.length > 0 ? (
                sortedUsers.map((row, idx) => (
                  <TableRow
                    key={row.user?.id || idx}
                    className="hover:bg-violet-50/40 dark:hover:bg-violet-900/20"
                    data-oid="9qw8byr"
                  >
                    <TableCell data-oid="3xtc5o-">
                      <div className="flex items-center gap-3" data-oid="3.mkty1">
                        <Avatar
                          className="h-9 w-9 border-2 border-violet-200 dark:border-violet-800"
                          data-oid="xsa83vq"
                        >
                          <AvatarImage src={row.user?.avatar_url} data-oid="071tj9g" />
                          <AvatarFallback
                            className="bg-gradient-to-br from-violet-400 to-purple-600 text-white text-xs font-bold"
                            data-oid="dx3fs4w"
                          >
                            {getInitials(row.user?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col" data-oid="mi044xl">
                          <span className="font-medium text-sm" data-oid="_8zvh12">
                            {row.user?.full_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground" data-oid="5n1a_5h">
                            {row.user?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-oid="npt:ia6">
                      <div className="flex flex-col gap-1" data-oid="d4:7-et">
                        <span className="font-bold text-lg text-foreground" data-oid="5b50vmd">
                          {row.totalCalls.toLocaleString()}
                        </span>
                        <Progress
                          value={(row.totalCalls / maxCalls) * 100}
                          className="h-1.5 w-24"
                          data-oid="j-tru74"
                        />
                      </div>
                    </TableCell>
                    <TableCell data-oid="tjqe354">
                      <TooltipProvider data-oid="0q93nbt">
                        <Tooltip data-oid="8cy2vub">
                          <TooltipTrigger data-oid="1-fjwj8">
                            <Badge
                              className="bg-emerald-500/10 text-emerald-600 gap-1"
                              data-oid="k0khmb."
                            >
                              <Sparkles className="w-3 h-3" data-oid="p_h73k8" />
                              {row.cachedCalls.toLocaleString()}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent data-oid="irdu04h">
                            <p data-oid="wwgy89i">
                              {row.totalCalls > 0
                                ? `${((row.cachedCalls / row.totalCalls) * 100).toFixed(1)}% cache hit rate`
                                : 'No calls yet'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell data-oid="p76fyme">
                      <span className="font-mono text-sm text-muted-foreground" data-oid="lvpt3xe">
                        {formatNumber(row.totalTokens)}
                      </span>
                    </TableCell>
                    <TableCell data-oid="dq20c97">
                      <span
                        className={`font-bold text-lg ${row.cost >= 1 ? 'text-red-500' : row.cost >= 0.1 ? 'text-amber-500' : 'text-emerald-500'}`}
                        data-oid="zsp7d-0"
                      >
                        {formatCost(row.cost)}
                      </span>
                    </TableCell>
                    <TableCell data-oid=".3p9lz2">
                      <div className="flex flex-col gap-1.5 max-w-[200px]" data-oid="94gg7_t">
                        {Object.entries(row.endpoints)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 3)
                          .map(([endpoint, count]) => (
                            <div
                              key={endpoint}
                              className="flex flex-col gap-0.5"
                              data-oid="_-_v8n8"
                            >
                              <div
                                className="flex items-center justify-between gap-2"
                                data-oid="aoulets"
                              >
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[10px] px-1.5 py-0"
                                  style={{
                                    borderColor: (endpointColors[endpoint] || '#8b5cf6') + '40',
                                    color: endpointColors[endpoint] || '#8b5cf6',
                                  }}
                                  data-oid="uzptp0:"
                                >
                                  {endpoint?.replace('generate', '').replace('process', '')}
                                  <span className="ml-1 opacity-60" data-oid=":75l3pi">
                                    ({count})
                                  </span>
                                </Badge>
                              </div>
                              <span
                                className="text-[9px] text-muted-foreground ml-1"
                                data-oid="jypw-r5"
                              >
                                using {getModelForEndpoint(endpoint)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell data-oid="pqd:0xg">
                      <div
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        data-oid=":0glwm3"
                      >
                        <Clock className="w-3 h-3" data-oid="l:9-lul" />
                        {row.lastActivity
                          ? new Date(row.lastActivity).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow data-oid="icv40:m">
                  <TableCell colSpan={7} className="py-16 text-center" data-oid="xhjdbmh">
                    <div
                      className="flex flex-col items-center gap-3 text-muted-foreground"
                      data-oid="0de_7sq"
                    >
                      <div className="p-4 bg-violet-500/10 rounded-full" data-oid="0pvshge">
                        <Users className="w-8 h-8 text-violet-500" data-oid="l4k5es5" />
                      </div>
                      <p className="font-medium" data-oid="9wpnk6h">
                        No usage data found
                      </p>
                      <p className="text-sm opacity-70" data-oid="fq.wxux">
                        AI API calls will appear here once users start using AI features
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-border/40" data-oid="6y9zuc7">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={totalItems}
              itemName="users"
              data-oid="e-1qics"
            />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AIUsageManagement;
