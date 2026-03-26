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
      className="space-y-8 pb-10"
      data-oid="45jhl4z"
    >
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        data-oid="1.gc99z"
      >
        <div className="flex items-center gap-4" data-oid="6a.w2wk">
          <div
            className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-sm"
            data-oid="sam3tn:"
          >
            <DollarSign
              className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
              data-oid="0sam1wh"
            />
          </div>
          <div data-oid="7fl_9iv">
            <h1 className="text-3xl font-bold tracking-tight text-foreground" data-oid="m:s25zy">
              Revenue Intelligence
            </h1>
            <p className="text-muted-foreground text-sm" data-oid="kfha:9x">
              Financial performance and subscription health monitoring
            </p>
          </div>
        </div>
        <div className="flex gap-3" data-oid="_x5waub">
          <Button variant="outline" className="gap-2" data-oid="ja3t_jw">
            <ArrowDownRight className="w-4 h-4 text-emerald-500" data-oid="2v0flcy" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-oid="1k7:55y">
        {[
          {
            title: 'Revenue (Local & Global)',
            value: `৳${Number(analyticsData.manualRevenue || 0).toLocaleString()} | $${Number(analyticsData.stripeRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: Wallet,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            subtext: `Local (BDT) • Global (USD)`,
          },
          {
            title: 'Avg. Revenue / User',
            value: `৳${Number(analyticsData.arpuBdt || 0).toLocaleString()} | $${Number(analyticsData.arpuUsd || 0).toFixed(2)}`,
            icon: CreditCard,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            subtext: `LTV: ৳${Number(analyticsData.ltvBdt || 0).toLocaleString()} | $${Number(analyticsData.ltvUsd || 0).toFixed(2)}`,
          },
          {
            title: 'Churn Risk',
            value: `${analyticsData.churnRate || 0}%`,
            icon: AlertTriangle,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            subtext: `${analyticsData.churnRiskCount || 0} users at risk`,
            valueColor: 'text-orange-600 dark:text-orange-400',
          },
          {
            title: 'Active Subscribers',
            value: (stats.proCount || 0) + (stats.premiumCount || 0),
            icon: Crown,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            subtext: 'Pro: ' + (stats.proCount || 0) + ' • Premium: ' + (stats.premiumCount || 0),
          },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            variants={itemVariants}
            className="h-full"
            data-oid="og1rf6."
          >
            <Card
              className="border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden h-full flex flex-col"
              data-oid="i_4zfhn"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5" data-oid="4m29t_w">
                <item.icon className="w-24 h-24" data-oid="6_v9fox" />
              </div>
              <CardContent className="p-4 flex-1 flex flex-col justify-between" data-oid="ixv2e7f">
                <div className="flex items-center justify-between mb-3" data-oid="dbjw1:o">
                  <div
                    className={`p-2 rounded-xl ${item.bg} ${item.border} border`}
                    data-oid="ye7vd14"
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} data-oid="5um4g.9" />
                  </div>
                  {item.trend && (
                    <Badge
                      variant="outline"
                      className={`bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 text-xs`}
                      data-oid="8dzyn6v"
                    >
                      {item.trend}
                    </Badge>
                  )}
                </div>
                <div className="space-y-0.5" data-oid="4odn1a0">
                  <p className="text-xs font-medium text-muted-foreground" data-oid="7hs5bua">
                    {item.title}
                  </p>
                  <h3
                    className={`text-xl font-bold ${item.valueColor || 'text-foreground'}`}
                    data-oid="_vr4zix"
                  >
                    {item.value}
                  </h3>
                  {item.subtext && (
                    <p className="text-xs text-muted-foreground font-medium" data-oid="2zq64yh">
                      {item.subtext}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-oid=".-p_k-p">
        {/* Main Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2" data-oid="wy:d9sd">
          <Card className="h-full border shadow-sm" data-oid="c1thd_0">
            <CardHeader data-oid="_3roj3d">
              <CardTitle className="flex items-center gap-2" data-oid="b_gdsx0">
                <LineChartIcon className="w-5 h-5 text-primary" data-oid="e.wh:v5" />
                Monthly Revenue
              </CardTitle>
              <CardDescription data-oid="sf7pnii">
                Actual revenue collected from Stripe and manual payments
              </CardDescription>
            </CardHeader>
            <CardContent data-oid="yo_c3pu">
              <div className="h-[350px] w-full" data-oid="qdpavu_">
                {analyticsData.monthlyRevenue && analyticsData.monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" data-oid="z96n4gt">
                    <AreaChart data={analyticsData.monthlyRevenue} data-oid="nbfju51">
                      <defs data-oid="eie84.d">
                        <linearGradient id="revenueUsdGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="revenueBdtGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                        data-oid="p_vkn.q"
                      />

                      <XAxis
                        dataKey="label"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        data-oid="cvpz8af"
                      />

                      <YAxis
                        yAxisId="usd"
                        orientation="left"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                        tickFormatter={(value) => `$${value}`}
                        data-oid="zl64smz"
                      />

                      <YAxis
                        yAxisId="bdt"
                        orientation="right"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dx={10}
                        tickFormatter={(value) => `৳${value}`}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
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
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fill="url(#revenueBdtGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center h-full text-muted-foreground"
                    data-oid="x7gy0h8"
                  >
                    <DollarSign className="w-10 h-10 mb-2 opacity-20" data-oid="u9fsn9h" />
                    <p data-oid="2g1s48b">No revenue data available yet</p>
                    <p className="text-xs mt-1" data-oid="tjk7xyv">
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
          <Card className="h-full border shadow-sm flex flex-col" data-oid="znnfl8c">
            <CardHeader data-oid="_sxucxs">
              <CardTitle
                className="flex items-center gap-2 text-orange-600 dark:text-orange-500"
                data-oid="ap6-0qn"
              >
                <AlertTriangle className="w-5 h-5" data-oid="v_tuc9v" />
                At-Risk Subscribers
              </CardTitle>
              <CardDescription data-oid="7:o7k2k">Paid users inactive for 30+ days</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden" data-oid="ofs5z9t">
              <div className="space-y-4" data-oid="x4ps5w:">
                {analyticsData.atRiskUsers && analyticsData.atRiskUsers.length > 0 ? (
                  analyticsData.atRiskUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30"
                      data-oid="h5-r:wu"
                    >
                      <div className="flex items-center gap-3" data-oid="x:f5j-l">
                        <Avatar className="w-9 h-9 border border-background" data-oid="3cp9v8.">
                          <AvatarFallback
                            className="bg-orange-200 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                            data-oid="3lof81:"
                          >
                            {user.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div data-oid="n_78.rz">
                          <p className="text-sm font-semibold text-foreground" data-oid="c6bzzq0">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground" data-oid="2ws7eu_">
                            Last active:{' '}
                            {new Date(user.last_login || user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-background text-xs border-orange-200 text-orange-600"
                        data-oid="t3msltj"
                      >
                        {user.subscription_tier}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div
                    className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground opacity-70"
                    data-oid="4mu0zq7"
                  >
                    <Users className="w-10 h-10 mb-2" data-oid="i0lmu3e" />
                    <p data-oid="mfp_p30">No at-risk users detected</p>
                  </div>
                )}
                {analyticsData.churnRiskCount > 5 && (
                  <div className="pt-2 text-center" data-oid="zf-.x3l">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
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
        <Card className="border shadow-sm" data-oid="jdrpm93">
          <CardHeader data-oid="lie8zmr">
            <CardTitle className="flex items-center gap-2" data-oid="3stjd-7">
              <Tag className="w-5 h-5 text-purple-500" data-oid="3bbqshh" />
              Promo Code Performance
            </CardTitle>
            <CardDescription data-oid="y71spqt">
              Top performing discount codes by usage
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="2hf333:">
            <div className="h-[250px] w-full" data-oid="i8:tfb8">
              {analyticsData.promoStats && analyticsData.promoStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" data-oid="ieulj73">
                  <BarChart
                    data={analyticsData.promoStats}
                    layout="vertical"
                    margin={{ left: 20 }}
                    data-oid="2a74nsx"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="hsl(var(--border))"
                      data-oid="_es:ic2"
                    />

                    <XAxis type="number" hide data-oid="isammcd" />
                    <YAxis
                      dataKey="code"
                      type="category"
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                      width={100}
                      axisLine={false}
                      tickLine={false}
                      data-oid="13rx.jy"
                    />

                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      data-oid="_.oijkb"
                    />

                    <Bar
                      dataKey="usage_count"
                      name="Redemptions"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                      data-oid="ts0fo3j"
                    >
                      {analyticsData.promoStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'][index % 5]}
                          data-oid="6pjq4re"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-full text-muted-foreground"
                  data-oid="tvbj74i"
                >
                  <Tag className="w-8 h-8 mb-2 opacity-20" data-oid="5hruyhh" />
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
