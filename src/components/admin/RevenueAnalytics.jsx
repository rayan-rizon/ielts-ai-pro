import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Zap,
  Crown,
  LineChartIcon,
  AlertTriangle,
  Users,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const RevenueAnalytics = ({ analyticsData = {}, stats = {}, recentTransactions = [] }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-6 pt-12 md:pt-0"
      data-oid="45jhl4z"
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1"
        data-oid="1.gc99z"
      >
        <div className="space-y-0.5 min-w-0 flex-1" data-oid="7fl_9iv">
          <h1
            className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5"
            data-oid="m:s25zy"
          >
            <div
              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 shadow-2xs shrink-0"
              data-oid="sam3tn:"
            >
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" data-oid="0sam1wh" />
            </div>
            <span className="truncate">Revenue Intelligence</span>
          </h1>
          <p
            className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 ml-1"
            data-oid="kfha:9x"
          >
            Financial performance and subscription health monitoring
          </p>
        </div>
        <div
          className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0"
          data-oid="_x5waub"
        >
          <Button
            variant="outline"
            className="w-full sm:w-auto justify-center h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs shadow-2xs"
            data-oid="ja3t_jw"
          >
            <ArrowDownRight
              className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400"
              data-oid="2v0flcy"
            />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Grid (2 Columns on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5" data-oid="1k7:55y">
        {[
          {
            title: 'Revenue (Local & Global)',
            value: `৳${Number(analyticsData.manualRevenue || 0).toLocaleString()} | $${Number(analyticsData.stripeRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: Wallet,
            color: 'emerald',
            subtext: `Local (BDT) • Global (USD)`,
          },
          {
            title: 'Avg. Revenue / User',
            value: `৳${Number(analyticsData.arpuBdt || 0).toLocaleString()} | $${Number(analyticsData.arpuUsd || 0).toFixed(2)}`,
            icon: CreditCard,
            color: 'blue',
            subtext: `LTV: ৳${Number(analyticsData.ltvBdt || 0).toLocaleString()} | $${Number(analyticsData.ltvUsd || 0).toFixed(2)}`,
          },
          {
            title: 'Churn Risk',
            value: `${analyticsData.churnRate || 0}%`,
            icon: AlertTriangle,
            color: 'amber',
            subtext: `${analyticsData.churnRiskCount || 0} users at risk`,
            valueColor: 'text-amber-600 dark:text-amber-400',
          },
          {
            title: 'Active Subscribers',
            value: (stats.proCount || 0) + (stats.premiumCount || 0),
            icon: Crown,
            color: 'purple',
            subtext: `Pro: ${stats.proCount || 0} • Premium: ${stats.premiumCount || 0}`,
          },
        ].map((item) => (
          <motion.div
            key={item.title}
            variants={itemVariants}
            className="h-full"
            data-oid="og1rf6."
          >
            <Card
              className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden h-full"
              data-oid="i_4zfhn"
            >
              <CardContent
                className="p-3.5 px-4 flex items-center justify-between"
                data-oid="ixv2e7f"
              >
                <div className="space-y-0.5 min-w-0 flex-1 pr-2" data-oid="4odn1a0">
                  <p
                    className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate"
                    data-oid="7hs5bua"
                  >
                    {item.title}
                  </p>
                  <h3
                    className={`text-base sm:text-lg font-black tracking-tight leading-snug truncate ${item.valueColor || 'text-slate-950 dark:text-white'}`}
                    data-oid="_vr4zix"
                  >
                    {item.value}
                  </h3>
                  {item.subtext && (
                    <p
                      className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate"
                      data-oid="2zq64yh"
                    >
                      {item.subtext}
                    </p>
                  )}
                </div>
                <div
                  className={`p-2.5 rounded-xl border shrink-0 ${
                    item.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900'
                      : item.color === 'blue'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200/80 dark:border-blue-900'
                        : item.color === 'amber'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/80 dark:border-amber-900'
                          : 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200/80 dark:border-purple-900'
                  }`}
                  data-oid="ye7vd14"
                >
                  <item.icon className="w-4 h-4" data-oid="5um4g.9" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-oid=".-p_k-p">
        {/* Main Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2" data-oid="wy:d9sd">
          <Card
            className="h-full border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col"
            data-oid="c1thd_0"
          >
            <CardHeader className="p-4 pb-2" data-oid="_3roj3d">
              <CardTitle
                className="text-base font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2"
                data-oid="b_gdsx0"
              >
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <LineChartIcon
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                    data-oid="e.wh:v5"
                  />
                </div>
                Monthly Revenue Trajectory
              </CardTitle>
              <CardDescription
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1 mt-0.5"
                data-oid="sf7pnii"
              >
                Actual revenue collected from Stripe (USD) and local BKash/Nagad (BDT)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex-1 min-h-[300px]" data-oid="yo_c3pu">
              <div className="h-[290px] w-full" data-oid="qdpavu_">
                {analyticsData.monthlyRevenue && analyticsData.monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" data-oid="z96n4gt">
                    <AreaChart data={analyticsData.monthlyRevenue} data-oid="nbfju51">
                      <defs data-oid="eie84.d">
                        <linearGradient id="revenueUsdGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="revenueBdtGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148, 163, 184, 0.2)"
                        vertical={false}
                        data-oid="p_vkn.q"
                      />

                      <XAxis
                        dataKey="label"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                        data-oid="cvpz8af"
                      />

                      <YAxis
                        yAxisId="usd"
                        orientation="left"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        dx={-8}
                        tickFormatter={(value) => `$${value}`}
                        data-oid="zl64smz"
                      />

                      <YAxis
                        yAxisId="bdt"
                        orientation="right"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        dx={8}
                        tickFormatter={(value) => `৳${value}`}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius: '0.75rem',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          background: 'rgba(15, 23, 42, 0.95)',
                          color: '#fff',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                        }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}
                        formatter={(value, name) => {
                          if (name === 'revenue_usd')
                            return [`$${Number(value).toFixed(2)}`, 'Global (USD)'];
                          if (name === 'revenue_bdt')
                            return [`৳${Number(value).toLocaleString()}`, 'Local (BDT)'];
                          return [value, name];
                        }}
                        data-oid="e0gtph7"
                      />

                      <Area
                        yAxisId="usd"
                        type="monotone"
                        dataKey="revenue_usd"
                        name="revenue_usd"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#revenueUsdGradient)"
                        data-oid="s.zyh6b"
                      />
                      <Area
                        yAxisId="bdt"
                        type="monotone"
                        dataKey="revenue_bdt"
                        name="revenue_bdt"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fill="url(#revenueBdtGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center h-full text-slate-400 text-xs font-semibold italic"
                    data-oid="x7gy0h8"
                  >
                    <DollarSign className="w-8 h-8 mb-2 opacity-30" data-oid="u9fsn9h" />
                    <p data-oid="2g1s48b">No revenue data available yet</p>
                    <p className="text-[11px] mt-0.5" data-oid="tjk7xyv">
                      Payments will appear here as they are processed
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* At Risk Users */}
        <motion.div variants={itemVariants} className="lg:col-span-1" data-oid="brhaq:j">
          <Card
            className="h-full border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col"
            data-oid="znnfl8c"
          >
            <CardHeader className="p-4 pb-2" data-oid="_sxucxs">
              <CardTitle
                className="text-base font-black tracking-tight flex items-center gap-2 text-amber-600 dark:text-amber-400"
                data-oid="ap6-0qn"
              >
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900 text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" data-oid="v_tuc9v" />
                </div>
                At-Risk Subscribers
              </CardTitle>
              <CardDescription
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1 mt-0.5"
                data-oid="7:o7k2k"
              >
                Paid users inactive for 30+ days
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex-1 overflow-hidden" data-oid="ofs5z9t">
              <div className="space-y-2" data-oid="x4ps5w:">
                {analyticsData.atRiskUsers && analyticsData.atRiskUsers.length > 0 ? (
                  analyticsData.atRiskUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30"
                      data-oid="h5-r:wu"
                    >
                      <div className="flex items-center gap-2.5" data-oid="x:f5j-l">
                        <Avatar
                          className="w-8 h-8 rounded-lg border border-amber-200/80 dark:border-amber-900"
                          data-oid="3cp9v8."
                        >
                          <AvatarFallback
                            className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 font-black text-xs"
                            data-oid="3lof81:"
                          >
                            {user.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div data-oid="n_78.rz">
                          <p
                            className="text-xs font-black text-slate-950 dark:text-white leading-tight"
                            data-oid="c6bzzq0"
                          >
                            {user.full_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium" data-oid="2ws7eu_">
                            Last:{' '}
                            {new Date(user.last_login || user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="h-6 px-2 rounded-md bg-white dark:bg-slate-900 text-[10px] font-extrabold border-amber-200 text-amber-600 shadow-2xs"
                        data-oid="t3msltj"
                      >
                        {user.subscription_tier || 'Pro'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div
                    className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs font-semibold italic"
                    data-oid="4mu0zq7"
                  >
                    <Users className="w-8 h-8 mb-1.5 opacity-30" data-oid="i0lmu3e" />
                    <p data-oid="mfp_p30">No at-risk users detected</p>
                  </div>
                )}
                {analyticsData.churnRiskCount > 5 && (
                  <div className="pt-1 text-center" data-oid="zf-.x3l">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs font-extrabold text-slate-500 hover:text-slate-900 dark:hover:text-white h-7 rounded-lg"
                      data-oid="rwee-td"
                    >
                      View All {analyticsData.churnRiskCount} At-Risk Users
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Promo Code Performance */}
      <motion.div variants={itemVariants} data-oid="_aqkdcu">
        <Card
          className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden"
          data-oid="jdrpm93"
        >
          <CardHeader className="p-4 pb-2" data-oid="lie8zmr">
            <CardTitle
              className="text-base font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2"
              data-oid="3stjd-7"
            >
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/80 dark:border-purple-900 text-purple-600 dark:text-purple-400 shrink-0">
                <Tag className="w-4 h-4" data-oid="3bbqshh" />
              </div>
              Promo Code Performance
            </CardTitle>
            <CardDescription
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1 mt-0.5"
              data-oid="y71spqt"
            >
              Top performing discount codes by usage redemptions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1" data-oid="2hf333:">
            <div className="h-[220px] w-full" data-oid="i8:tfb8">
              {analyticsData.promoStats && analyticsData.promoStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" data-oid="ieulj73">
                  <BarChart
                    data={analyticsData.promoStats}
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                    data-oid="2a74nsx"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="rgba(148, 163, 184, 0.2)"
                      data-oid="_es:ic2"
                    />

                    <XAxis type="number" hide data-oid="isammcd" />
                    <YAxis
                      dataKey="code"
                      type="category"
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      width={100}
                      axisLine={false}
                      tickLine={false}
                      data-oid="13rx.jy"
                    />

                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        background: 'rgba(15, 23, 42, 0.95)',
                        color: '#fff',
                      }}
                      data-oid="_.oijkb"
                    />

                    <Bar
                      dataKey="usage_count"
                      name="Redemptions"
                      radius={[0, 8, 8, 0]}
                      barSize={18}
                      data-oid="ts0fo3j"
                    >
                      {analyticsData.promoStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'][index % 5]}
                          opacity={0.9}
                          data-oid="6pjq4re"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-full text-slate-400 text-xs font-semibold italic"
                  data-oid="tvbj74i"
                >
                  <Tag className="w-8 h-8 mb-1.5 opacity-30" data-oid="5hruyhh" />
                  <p data-oid="18:z7p5">No promo code data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default RevenueAnalytics;
