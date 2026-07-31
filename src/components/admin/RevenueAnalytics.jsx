import { motion } from 'framer-motion';
import { DollarSign, Wallet, Crown, CreditCard } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

const RevenueAnalytics = ({ analyticsData = {}, stats = {}, recentTransactions = [] }) => {
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
          title="Revenue Intelligence"
          description="Financial performance and subscription health monitoring"
        />
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={FADE_UP} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Revenue (Local & Global)',
            value: `৳${Number(analyticsData.manualRevenue || 0).toLocaleString()} | $${Number(analyticsData.stripeRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sub: 'Local (BDT) · Global (USD)',
            icon: Wallet,
          },
          {
            label: 'Avg. Revenue / User',
            value: `৳${Number(analyticsData.arpuBdt || 0).toLocaleString()} | $${Number(analyticsData.arpuUsd || 0).toFixed(2)}`,
            sub: `LTV: ৳${Number(analyticsData.ltvBdt || 0).toLocaleString()} | $${Number(analyticsData.ltvUsd || 0).toFixed(2)}`,
            icon: CreditCard,
          },
          {
            label: 'Active Subscribers',
            value: (stats.proCount || 0) + (stats.premiumCount || 0),
            sub: `Pro: ${stats.proCount || 0} · Premium: ${stats.premiumCount || 0}`,
            icon: Crown,
          },
        ].map((item) => (
          <div key={item.label} className={cn(PANEL, 'py-2.5 px-3.5')}>
            <div className="flex items-center gap-1.5 mb-1">
              <p className={cn(MICRO, 'text-stone-400')}>{item.label}</p>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-900 dark:text-stone-50 leading-snug truncate">
                  {typeof item.value === 'number' ? (
                    <span className={cn(NUM, 'text-xl')}>{item.value.toLocaleString()}</span>
                  ) : (
                    item.value
                  )}
                </p>
                {item.sub && (
                  <p className={cn(MICRO, 'text-stone-400 mt-0.5 truncate')}>{item.sub}</p>
                )}
              </div>
              <item.icon className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Revenue Chart */}
      <motion.div variants={FADE_UP}>
        <div className={cn(PANEL, 'overflow-hidden')}>
          <div className="flex items-start justify-between p-4 border-b border-stone-200/80 dark:border-white/[0.07]">
            <div>
              <SectionLabel>Monthly Revenue Trajectory</SectionLabel>
              <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>
                Stripe (USD) and local BKash/Nagad (BDT)
              </p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full bg-emerald-500 inline-block" />
                <span className={cn(MICRO, 'text-stone-400')}>USD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full bg-indigo-500 inline-block" />
                <span className={cn(MICRO, 'text-stone-400')}>BDT</span>
              </div>
            </div>
          </div>

          <div className="p-4 min-h-[300px]">
            {analyticsData.monthlyRevenue && analyticsData.monthlyRevenue.length > 0 ? (
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthlyRevenue}>
                    <defs>
                      <linearGradient id="revUsd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revBdt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.15)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      fontSize={10}
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
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
                      tickFormatter={(v) => `$${v}`}
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
                      tickFormatter={(v) => `৳${v}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className={cn(PANEL, 'p-3 shadow-xl')}>
                              <p className={cn(MICRO, 'text-stone-400 mb-1.5')}>{label}</p>
                              {payload.map((p) => (
                                <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: p.stroke }}
                                  />
                                  <span
                                    className={cn(
                                      NUM,
                                      'text-sm font-bold text-stone-900 dark:text-stone-50'
                                    )}
                                  >
                                    {p.dataKey === 'revenue_usd'
                                      ? `$${Number(p.value).toFixed(2)}`
                                      : `৳${Number(p.value).toLocaleString()}`}
                                  </span>
                                  <span className={cn(MICRO, 'text-stone-400')}>
                                    {p.dataKey === 'revenue_usd' ? 'Global' : 'Local'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      yAxisId="usd"
                      type="monotone"
                      dataKey="revenue_usd"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#revUsd)"
                    />
                    <Area
                      yAxisId="bdt"
                      type="monotone"
                      dataKey="revenue_bdt"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#revBdt)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[290px]">
                <DollarSign className="w-7 h-7 text-stone-300 mb-2" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                  No revenue data yet
                </p>
                <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>
                  Payments will appear here as they are processed
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={FADE_UP}>
        <div className={cn(PANEL, 'overflow-hidden')}>
          <div className="p-4 border-b border-stone-200/80 dark:border-white/[0.07]">
            <SectionLabel>Recent Transactions</SectionLabel>
            <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>
              Latest payments across Stripe and local methods
            </p>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-white/[0.04]">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/[0.06] border border-stone-200/80 dark:border-white/[0.07] flex items-center justify-center shrink-0">
                      <span className={cn(MICRO, 'text-stone-600 dark:text-stone-300')}>
                        {(tx.full_name || tx.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-50 truncate">
                        {tx.full_name || tx.email || 'Unknown user'}
                      </p>
                      <p
                        className={cn(
                          MICRO,
                          'text-stone-400 font-mono normal-case tracking-normal truncate'
                        )}
                      >
                        {tx.tier || '—'} · {tx.billing_interval || '—'} · {tx.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span
                      className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}
                    >
                      {String(tx.currency).toUpperCase() === 'BDT' ? '৳' : '$'}
                      {Number(tx.amount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className={cn(MICRO, 'text-stone-400')}>
                      {new Date(tx.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-14">
                <CreditCard className="w-7 h-7 text-stone-300 mb-2" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                  No payments yet
                </p>
                <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>
                  Recorded transactions will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RevenueAnalytics;
