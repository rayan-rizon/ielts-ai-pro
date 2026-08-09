import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, ShieldAlert } from 'lucide-react';
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
  PILL_BASE,
  pillTone,
} from './ui/primitives';

const AXIS = { fill: '#a8a29e', fontSize: 10, fontWeight: 700 };
const GRID = 'rgba(168,162,158,0.22)';
const USD = '#16966c';
const BDT = '#6366f1';
const RANGES = ['30D', '90D', '1Y'];
const bdt = (value) => `৳${Number(value || 0).toLocaleString()}`;
const usd = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RevenueAnalytics = ({
  analyticsData = {},
  stats = {},
  recentTransactions = [],
  selectedRange = '30D',
  onRangeChange,
}) => {
  const trend = analyticsData.trend || [];
  const subscribers = Number(stats.activeSubscribers || 0);
  const risk = useMemo(() => {
    const cancelling = Number(stats.cancellingSubscribers || 0);
    const expiring = Number(stats.expiringSubscribers || 0);
    return {
      cancelling,
      expiring,
      share: subscribers ? (100 * (cancelling + expiring)) / subscribers : 0,
    };
  }, [stats.cancellingSubscribers, stats.expiringSubscribers, subscribers]);

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
          description="Settled payments, payment mix, and renewal risk — never currency-converted or projected."
          tip="Every figure comes from settled billing records or the current subscription state."
        >
          <div className="flex items-center gap-1 rounded-lg border border-stone-200/80 bg-stone-100 p-0.5 dark:border-white/[0.07] dark:bg-white/[0.04]">
            {RANGES.map((range) => (
              <button
                key={range}
                onClick={() => onRangeChange?.(range)}
                className={cn(
                  'rounded-md px-2.5 py-1',
                  MICRO,
                  range === selectedRange
                    ? 'bg-white text-stone-900 dark:bg-[#131315] dark:text-stone-50'
                    : 'text-stone-500 dark:text-stone-400'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </AdminPageHeader>
      </motion.div>

      <motion.div variants={FADE_UP} className="grid gap-3 lg:grid-cols-4">
        <div className={cn(PANEL, 'px-3.5 py-2.5')}>
          <p className={cn(MICRO, MUTED)}>Settled revenue · {selectedRange}</p>
          <div className="mt-2">
            <DualValue
              primary={bdt(analyticsData.revenueBdt)}
              primaryLabel="Local · BDT"
              secondary={usd(analyticsData.revenueUsd)}
              secondaryLabel="Global · USD"
            />
          </div>
        </div>
        <div className={cn(PANEL, 'px-3.5 py-2.5')}>
          <p className={cn(MICRO, MUTED)}>Previous equal period</p>
          <div className="mt-2">
            <DualValue
              primary={bdt(analyticsData.previousBdt)}
              primaryLabel="Local · BDT"
              secondary={usd(analyticsData.previousUsd)}
              secondaryLabel="Global · USD"
            />
          </div>
        </div>
        <Kpi
          label="Settled transactions"
          value={Number(stats.transactions || 0).toLocaleString()}
          sub={`${stats.previousTransactions || 0} in prior period`}
          tip="Approved manual payments and paid billing records after de-duplication."
        />
        <Kpi
          label="Active subscribers"
          value={subscribers.toLocaleString()}
          sub={`${risk.cancelling} cancelling · ${risk.expiring} expiring in 7d`}
          tip="Current paid accounts, with renewal-risk flags kept visible."
        />
      </motion.div>

      <motion.div variants={FADE_UP} className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className={cn(PANEL, 'flex flex-col overflow-hidden')}>
          <PanelHeader label="Settlement trajectory" title="Revenue by currency">
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
            {trend.length ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
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
                      dataKey="date"
                      tick={AXIS}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      minTickGap={28}
                    />
                    <YAxis
                      yAxisId="usd"
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
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div className={cn(PANEL, 'min-w-[160px] p-3 shadow-xl')}>
                            <p className={cn(MICRO, MUTED, 'mb-1.5')}>{label}</p>
                            {payload.map((entry) => (
                              <div
                                key={entry.dataKey}
                                className="mt-0.5 flex items-center justify-between gap-3 text-[11px]"
                              >
                                <span className={MUTED}>
                                  {entry.dataKey === 'revenueUsd' ? 'Global' : 'Local'}
                                </span>
                                <span
                                  className={cn(
                                    NUM,
                                    'font-bold text-stone-800 dark:text-stone-100'
                                  )}
                                >
                                  {entry.dataKey === 'revenueUsd'
                                    ? usd(entry.value)
                                    : bdt(entry.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null
                      }
                    />
                    <Area
                      yAxisId="usd"
                      type="monotone"
                      dataKey="revenueUsd"
                      stroke={USD}
                      strokeWidth={2.5}
                      fill="url(#revUsd)"
                    />
                    <Area
                      yAxisId="bdt"
                      type="monotone"
                      dataKey="revenueBdt"
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
          {subscribers > 0 && (
            <div className="border-t border-stone-200/80 p-4 dark:border-white/[0.07]">
              <div className="flex items-center justify-between gap-2">
                <p className={cn(MICRO, MUTED)}>Renewal risk</p>
                <p className={cn(NUM, 'text-[10px] font-bold', MUTED)}>
                  {risk.share.toFixed(0)}% flagged · {stats.failedPayments || 0} failed payments in
                  7d
                </p>
              </div>
              <div className={cn('mt-2 flex h-2 overflow-hidden rounded-full', WELL)}>
                <span
                  className="bg-[rgb(var(--signal-warn))]/70 transition-[width] duration-700"
                  style={{ width: `${risk.share}%` }}
                />
                <span className="flex-1 bg-[rgb(var(--signal-ok))]/45" />
              </div>
            </div>
          )}
        </div>
        <div className={cn(PANEL, 'flex flex-col overflow-hidden')}>
          <PanelHeader label="Payment mix" title="Settlement methods" />
          <div className="max-h-[420px] flex-1 divide-y divide-stone-100 overflow-y-auto dark:divide-white/5">
            {(analyticsData.paymentMethods || []).length ? (
              analyticsData.paymentMethods.map((method) => (
                <div
                  key={`${method.method}-${method.currency}`}
                  className="flex items-center justify-between gap-2 px-3.5 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stone-200/80 bg-stone-100 dark:border-white/[0.07] dark:bg-white/[0.06]">
                      <span className={cn(MICRO, 'text-stone-600 dark:text-stone-300')}>
                        {String(method.method || '?')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-50">
                        {method.method || 'Unknown method'}
                      </p>
                      <p className={cn(NUM, 'text-[10px] font-medium', MUTED)}>
                        {Number(method.transactions || 0).toLocaleString()} settled payments
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn(NUM, 'text-xs font-bold text-stone-900 dark:text-stone-50')}>
                      {String(method.currency).toUpperCase() === 'BDT'
                        ? bdt(method.amount)
                        : usd(method.amount)}
                    </p>
                    <span className={cn(PILL_BASE, pillTone('neutral'))}>{method.currency}</span>
                  </div>
                </div>
              ))
            ) : (
              <Empty icon={CreditCard} title="No settled payments yet">
                Settlement methods appear after the first approved or paid transaction.
              </Empty>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={FADE_UP} className={cn(PANEL, 'overflow-hidden')}>
        <PanelHeader label="Latest settlement" title="Recent payments" />
        {recentTransactions.length ? (
          <div className="divide-y divide-stone-100 dark:divide-white/5">
            {recentTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
              >
                <span className="min-w-0 truncate font-bold text-stone-800 dark:text-stone-100">
                  {tx.full_name || tx.email || 'Unknown user'}{' '}
                  <span className={cn(NUM, 'font-medium', MUTED)}>
                    · {tx.tier || '—'} · {tx.payment_method || '—'}
                  </span>
                </span>
                <span className={cn(NUM, 'shrink-0 font-bold')}>
                  {String(tx.currency).toUpperCase() === 'BDT' ? bdt(tx.amount) : usd(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={ShieldAlert} title="No payment history yet">
            Settled transactions will appear here.
          </Empty>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RevenueAnalytics;
