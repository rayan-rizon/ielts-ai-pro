import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign } from 'lucide-react';
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
  DualValue,
  Empty,
  Kpi,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelHeader,
  STAGGER_CONTAINER,
  FADE_UP,
  WELL,
} from './ui/primitives';

const AXIS = { fill: '#a8a29e', fontSize: 10, fontWeight: 700 };
const GRID = 'rgba(168,162,158,0.22)';
const USD = '#16966c';
const BDT = '#6366f1';

const bdt = (value) => `৳${Number(value || 0).toLocaleString()}`;
const usd = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const RevenueAnalytics = ({ analyticsData = {}, stats = {}, recentTransactions = [] }) => {
  const monthly = analyticsData.monthlyRevenue || [];
  const subscribers = (stats.proCount || 0) + (stats.premiumCount || 0);

  const mix = useMemo(() => {
    const pro = Number(stats.proCount || 0);
    const premium = Number(stats.premiumCount || 0);
    const total = pro + premium;
    return { pro, premium, proShare: total ? (100 * pro) / total : 0 };
  }, [stats.proCount, stats.premiumCount]);

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-6 pt-12 md:pt-0"
    >
      <motion.div variants={FADE_UP}>
        <AdminPageHeader
          title="Revenue Intelligence"
          description="Recorded payments across Stripe (USD) and local BKash/Nagad (BDT)"
          tip="Every figure comes from recorded billing history. Nothing here is projected or estimated."
        />
      </motion.div>

      {/* Currency pairs are stacked side by side rather than crammed into one
          "৳x | $y" string, where the pipe read as part of a number and both
          amounts truncated on a narrow tile. */}
      <motion.div variants={FADE_UP} className="grid gap-3 lg:grid-cols-3">
        <div className={cn(PANEL, 'px-3.5 py-2.5')}>
          <p className={cn(MICRO, MUTED)}>Revenue recorded</p>
          <div className="mt-2">
            <DualValue
              primary={bdt(analyticsData.manualRevenue)}
              primaryLabel="Local · BDT"
              secondary={usd(analyticsData.stripeRevenue)}
              secondaryLabel="Global · USD"
            />
          </div>
        </div>

        <div className={cn(PANEL, 'px-3.5 py-2.5')}>
          <p className={cn(MICRO, MUTED)}>Avg. revenue per user</p>
          <div className="mt-2">
            <DualValue
              primary={bdt(analyticsData.arpuBdt)}
              primaryLabel={`LTV ${bdt(analyticsData.ltvBdt)}`}
              secondary={usd(analyticsData.arpuUsd)}
              secondaryLabel={`LTV ${usd(analyticsData.ltvUsd)}`}
            />
          </div>
        </div>

        <Kpi
          label="Active subscribers"
          value={subscribers.toLocaleString()}
          sub={`Pro ${mix.pro.toLocaleString()} · Premium ${mix.premium.toLocaleString()}`}
          tip="Accounts currently on a paid tier."
        />
      </motion.div>

      <motion.div variants={FADE_UP} className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className={cn(PANEL, 'flex flex-col overflow-hidden')}>
          <PanelHeader label="Monthly trajectory" title="Revenue by settlement currency">
            <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
              <span className="h-0.5 w-2.5 rounded-full" style={{ background: USD }} />
              USD
            </span>
            <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
              <span className="h-0.5 w-2.5 rounded-full" style={{ background: BDT }} />
              BDT
            </span>
          </PanelHeader>

          <div className="flex-1 p-4">
            {monthly.length ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revUsd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={USD} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={USD} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revBdt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BDT} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={BDT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={AXIS}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      yAxisId="usd"
                      orientation="left"
                      tick={AXIS}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      yAxisId="bdt"
                      orientation="right"
                      tick={AXIS}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `৳${value}`}
                    />
                    <Tooltip
                      cursor={{ stroke: 'rgba(120,113,108,0.35)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className={cn(PANEL, 'min-w-[160px] p-3 shadow-xl')}>
                            <p className={cn(MICRO, MUTED, 'mb-1.5')}>{label}</p>
                            {payload.map((entry) => (
                              <div
                                key={entry.dataKey}
                                className="mt-0.5 flex items-center justify-between gap-3 text-[11px]"
                              >
                                <span className={cn('flex items-center gap-1.5', MUTED)}>
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: entry.stroke }}
                                  />
                                  {entry.dataKey === 'revenue_usd' ? 'Global' : 'Local'}
                                </span>
                                <span
                                  className={cn(
                                    NUM,
                                    'font-bold text-stone-800 dark:text-stone-100'
                                  )}
                                >
                                  {entry.dataKey === 'revenue_usd'
                                    ? usd(entry.value)
                                    : bdt(entry.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Area
                      yAxisId="usd"
                      type="monotone"
                      dataKey="revenue_usd"
                      stroke={USD}
                      strokeWidth={2.5}
                      fill="url(#revUsd)"
                    />
                    <Area
                      yAxisId="bdt"
                      type="monotone"
                      dataKey="revenue_bdt"
                      stroke={BDT}
                      strokeWidth={2.5}
                      fill="url(#revBdt)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                icon={DollarSign}
                title="No revenue recorded yet"
                className="h-[300px] justify-center"
              >
                Payments appear here as they settle. This chart never shows projected figures.
              </Empty>
            )}
          </div>

          {/* Subscriber mix reads as a footnote to revenue rather than its own
              full-width band — it is context for the chart above it. */}
          {subscribers > 0 && (
            <div className="border-t border-stone-200/80 p-4 dark:border-white/[0.07]">
              <div className="flex items-center justify-between gap-2">
                <p className={cn(MICRO, MUTED)}>Subscriber mix</p>
                <p className={cn(NUM, 'text-[10px] font-bold', MUTED)}>
                  {mix.proShare.toFixed(0)}% Pro · {(100 - mix.proShare).toFixed(0)}% Premium
                </p>
              </div>
              <div className={cn('mt-2 flex h-2 overflow-hidden rounded-full', WELL)}>
                <span
                  className="bg-indigo-500/70 transition-[width] duration-700"
                  style={{ width: `${mix.proShare}%` }}
                />
                <span className="flex-1 bg-[rgb(var(--signal-ok))]/70" />
              </div>
            </div>
          )}
        </div>

        <div className={cn(PANEL, 'flex flex-col overflow-hidden')}>
          <PanelHeader label="Recent transactions" title="Latest settled payments" />
          <div className="max-h-[420px] flex-1 divide-y divide-stone-100 overflow-y-auto dark:divide-white/5">
            {recentTransactions.length ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-2 px-3.5 py-2.5 transition-colors hover:bg-stone-50/60 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-200/80 bg-stone-100 dark:border-white/[0.07] dark:bg-white/[0.06]">
                      <span className={cn(MICRO, 'text-stone-600 dark:text-stone-300')}>
                        {(tx.full_name || tx.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-50">
                        {tx.full_name || tx.email || 'Unknown user'}
                      </p>
                      <p className={cn(NUM, 'truncate text-[10px] font-medium', MUTED)}>
                        {tx.tier || '—'} · {tx.billing_interval || '—'} · {tx.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn(NUM, 'text-xs font-bold text-stone-900 dark:text-stone-50')}>
                      {String(tx.currency).toUpperCase() === 'BDT'
                        ? bdt(tx.amount)
                        : usd(tx.amount)}
                    </p>
                    <p className={cn(NUM, 'text-[10px] font-medium', MUTED)}>
                      {new Date(tx.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <Empty icon={CreditCard} title="No payments yet">
                Recorded transactions from Stripe and local methods appear here.
              </Empty>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RevenueAnalytics;
