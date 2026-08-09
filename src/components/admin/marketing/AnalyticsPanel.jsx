import { useMemo } from 'react';
import { Activity, BarChart3, Clock3, Gift, Target, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  FunnelStep,
  Kpi,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelHeader,
  Pill,
  SectionLabel,
  WELL,
} from '@/components/admin/ui/primitives';
import { STATUS_TONE } from './shared';

const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);

/**
 * Compact ranked breakdown. Each row carries a share bar behind the label so a
 * dominant source is visible without reading the numbers — the previous plain
 * label/value list made four side-by-side breakdowns impossible to compare.
 */
const Breakdown = ({ title, rows = [], labelKey, valueKey, emptyHint }) => {
  const top = rows.slice(0, 6);
  const max = Math.max(1, ...top.map((row) => Number(row[valueKey] || 0)));
  return (
    <div className={cn(PANEL, 'flex flex-col')}>
      <div className="border-b border-stone-200/80 px-3.5 py-2.5 dark:border-white/[0.07]">
        <SectionLabel>{title}</SectionLabel>
      </div>
      {top.length ? (
        <div className="flex-1 space-y-1 p-2">
          {top.map((row, index) => {
            const value = Number(row[valueKey] || 0);
            return (
              <div
                key={`${row[labelKey]}-${index}`}
                className="relative flex items-center justify-between gap-2 overflow-hidden rounded-md px-2 py-1.5"
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-md bg-indigo-500/10 dark:bg-indigo-400/15"
                  style={{ width: `${(100 * value) / max}%` }}
                />
                <span className="relative truncate text-[11px] font-bold text-stone-700 dark:text-stone-200">
                  {row[labelKey] || 'unknown'}
                  {row.currency ? ` · ${row.currency}` : ''}
                </span>
                <span
                  className={cn(
                    NUM,
                    'relative shrink-0 text-[11px] font-bold text-stone-900 dark:text-stone-50'
                  )}
                >
                  {value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty className="py-8">{emptyHint}</Empty>
      )}
    </div>
  );
};

const RecoveryPanel = ({ recovery }) => {
  const metrics = [
    ['Waiting', recovery.waiting, 'Under two hours old'],
    ['Eligible now', recovery.eligible, 'Consent still required'],
    ['Offer sent', recovery.sent, 'One-use 15% codes'],
    [
      'Recovered',
      recovery.recovered,
      `${Number(recovery.conversion_rate || 0).toFixed(1)}% of sent`,
    ],
  ];
  return (
    <div className={cn(PANEL, 'flex flex-col')}>
      <PanelHeader
        label="Checkout recovery"
        title="Two-hour 15% offer"
        accent={recovery.campaign_id ? 'ok' : 'idle'}
      >
        <Pill tone={recovery.campaign_id ? 'ok' : 'warn'}>
          {recovery.campaign_id ? 'armed' : 'not configured'}
        </Pill>
      </PanelHeader>
      <div className="grid grid-cols-2 gap-2 p-3">
        {metrics.map(([label, value, detail]) => (
          <div key={label} className={cn(WELL, 'rounded-lg p-2.5')}>
            <p className={cn(MICRO, MUTED)}>{label}</p>
            <p className={cn(NUM, 'mt-1 text-lg font-extrabold text-stone-900 dark:text-stone-50')}>
              {Number(value || 0).toLocaleString()}
            </p>
            <p className={cn('mt-0.5 text-[10px] font-medium leading-tight', MUTED)}>{detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-start gap-1.5 border-t border-stone-200/80 px-3.5 py-2.5 dark:border-white/[0.07]">
        <Clock3 className="mt-px h-3 w-3 shrink-0 text-stone-400" />
        <p className={cn('text-[10px] font-medium leading-snug', MUTED)}>
          Only recognised free learners with marketing consent receive one assigned code, and each
          expires after seven days. The scheduler checks every fifteen minutes.
        </p>
      </div>
    </div>
  );
};

const AnalyticsPanel = ({ dashboard, intelligence, breakdowns, recovery }) => {
  const campaignRows = useMemo(() => dashboard.campaigns || [], [dashboard.campaigns]);

  // Currencies get one line each. Joined onto a single line they overflowed the
  // tile the moment a second currency appeared, and "USD 2210.50 · BDT 48200.00"
  // reads as one long number rather than two totals.
  const revenueByCurrency = useMemo(() => {
    const totals = {};
    (dashboard.revenue || []).forEach((row) => {
      totals[row.currency] = (totals[row.currency] || 0) + Number(row.net || 0);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [dashboard.revenue]);

  // The funnel is built from campaign rows when they exist and falls back to
  // the dashboard's reach total, so an operator never sees an all-zero funnel
  // while the totals row above it shows traffic.
  const funnel = useMemo(() => {
    const delivered = sum(campaignRows, 'delivered') || Number(dashboard.totals?.reach || 0);
    const stages = [
      ['Delivered', delivered],
      ['Viewed', sum(campaignRows, 'views')],
      ['Clicked', sum(campaignRows, 'clicks')],
      ['Checkout started', sum(campaignRows, 'checkouts')],
      ['Purchased', sum(campaignRows, 'purchases')],
    ];
    return stages.map(([label, value], index) => {
      const previous = index === 0 ? value : stages[index - 1][1];
      return {
        label,
        value,
        share: delivered ? (100 * value) / delivered : 0,
        drop: previous ? 100 - (100 * value) / previous : 0,
        isFirst: index === 0,
      };
    });
  }, [campaignRows, dashboard.totals]);

  const funnelStart = funnel[0]?.value || 0;

  return (
    <div className="space-y-3">
      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi
          label="Live campaigns"
          value={Number(dashboard.totals?.active || 0).toLocaleString()}
          sub="Currently sending"
          tip="Campaigns with status 'active' — these can dispatch."
        />
        <Kpi
          label="Reach"
          value={Number(dashboard.totals?.reach || 0).toLocaleString()}
          sub="Learners addressed · 30d"
        />
        <Kpi
          label="Clicks"
          value={Number(dashboard.totals?.clicks || 0).toLocaleString()}
          sub="Tracked CTA opens · 30d"
        />
        <Kpi
          label="Purchases"
          value={Number(dashboard.totals?.purchases || 0).toLocaleString()}
          sub="Attributed · 30d"
          tip="Counted only after a server-confirmed payment."
        />
        <div className={cn(PANEL, 'col-span-2 px-3.5 py-2.5 lg:col-span-1')}>
          <p className={cn(MICRO, MUTED)}>Attributed revenue</p>
          {revenueByCurrency.length ? (
            <div className="mt-1.5 space-y-0.5">
              {revenueByCurrency.map(([currency, value]) => (
                <p key={currency} className="flex items-baseline justify-between gap-2">
                  <span className={cn(MICRO, MUTED)}>{currency}</span>
                  <span
                    className={cn(NUM, 'text-base font-bold text-stone-900 dark:text-stone-50')}
                  >
                    {value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
              ))}
            </div>
          ) : (
            <p className={cn(NUM, 'mt-1 text-xl font-bold text-stone-900 dark:text-stone-50')}>—</p>
          )}
          <p className={cn(MICRO, MUTED, 'mt-1.5')}>Net · 30d</p>
        </div>
      </div>

      {/* Funnel + recovery */}
      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <div className={cn(PANEL, 'flex flex-col')}>
          <PanelHeader label="30-day funnel" title="From delivery to paid learner" accent="accent">
            <span className={cn(NUM, 'text-[11px] font-bold', MUTED)}>
              {funnelStart.toLocaleString()} entered
            </span>
          </PanelHeader>
          {funnelStart ? (
            <>
              <div className="space-y-2 p-4">
                {funnel.map((stage) => (
                  <FunnelStep key={stage.label} {...stage} />
                ))}
              </div>
              <p
                className={cn(
                  MICRO,
                  MUTED,
                  'mt-auto border-t border-stone-200/80 px-4 py-2.5 dark:border-white/[0.07]'
                )}
              >
                Bar = share of delivered · figure under each count = drop-off from the step above
              </p>
            </>
          ) : (
            <Empty icon={BarChart3} title="Funnel is empty">
              Stages populate once the first eligible learner receives a campaign. Nothing here is
              estimated.
            </Empty>
          )}
        </div>
        <RecoveryPanel recovery={recovery} />
      </div>

      {/* Per-campaign drill-down */}
      <div className={cn(PANEL, 'overflow-hidden')}>
        <PanelHeader
          label="Campaign drill-down"
          title="Conversion quality per campaign"
          description="Last 30 days"
        />
        {campaignRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-white/[0.07]">
                  {[
                    ['Campaign', 'left'],
                    ['Reach', 'right'],
                    ['Delivered', 'right'],
                    ['Views', 'right'],
                    ['Clicks', 'right'],
                    ['CTR', 'right'],
                    ['Checkouts', 'right'],
                    ['Purchases', 'right'],
                    ['Failed / skipped', 'right'],
                    ['Conversion', 'right'],
                  ].map(([label, align]) => (
                    <th
                      key={label}
                      className={cn(
                        MICRO,
                        MUTED,
                        'whitespace-nowrap px-3 py-2.5',
                        align === 'right' && 'text-right'
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignRows.map((row) => {
                  const failed = Number(row.failed || 0);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/60 dark:border-white/5 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                          {row.name}
                        </p>
                        <Pill tone={STATUS_TONE[row.status]} className="mt-1">
                          {row.status}
                        </Pill>
                      </td>
                      {['reach', 'delivered', 'views', 'clicks'].map((key) => (
                        <td
                          key={key}
                          className={cn(
                            NUM,
                            'px-3 py-2.5 text-right text-xs font-bold text-stone-700 dark:text-stone-200'
                          )}
                        >
                          {Number(row[key] || 0).toLocaleString()}
                        </td>
                      ))}
                      <td className={cn(NUM, 'px-3 py-2.5 text-right text-xs font-bold', MUTED)}>
                        {row.ctr || 0}%
                      </td>
                      <td
                        className={cn(
                          NUM,
                          'px-3 py-2.5 text-right text-xs font-bold text-stone-700 dark:text-stone-200'
                        )}
                      >
                        {Number(row.checkouts || 0).toLocaleString()}
                      </td>
                      <td
                        className={cn(
                          NUM,
                          'px-3 py-2.5 text-right text-xs font-bold text-stone-900 dark:text-stone-50'
                        )}
                      >
                        {Number(row.purchases || 0).toLocaleString()}
                      </td>
                      <td
                        className={cn(
                          NUM,
                          'px-3 py-2.5 text-right text-xs font-bold',
                          failed > 0 ? 'text-[rgb(var(--signal-fault))]' : MUTED
                        )}
                      >
                        {failed} / {Number(row.skipped || 0)}
                      </td>
                      <td
                        className={cn(
                          NUM,
                          'px-3 py-2.5 text-right text-xs font-extrabold',
                          Number(row.conversion_rate || 0) > 0
                            ? 'text-[rgb(var(--signal-ok))]'
                            : MUTED
                        )}
                      >
                        {row.conversion_rate || 0}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={Activity} title="No campaign activity in the last 30 days">
            Each campaign appears here after its first dispatch.
          </Empty>
        )}
      </div>

      {/* Attribution */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Breakdown
          title="Delivery channel"
          rows={breakdowns.delivery_channels}
          labelKey="channel"
          valueKey="recipients"
          emptyHint="No deliveries recorded yet."
        />
        <Breakdown
          title="Acquisition source"
          rows={breakdowns.acquisition_sources}
          labelKey="source"
          valueKey="purchases"
          emptyHint="No attributed purchases yet."
        />
        <Breakdown
          title="Purchased plan"
          rows={breakdowns.plans}
          labelKey="plan"
          valueKey="purchases"
          emptyHint="No plan purchases yet."
        />
        <Breakdown
          title="First-touch source"
          rows={breakdowns.first_touch}
          labelKey="source"
          valueKey="purchases"
          emptyHint="No first-touch data yet."
        />
      </div>

      {/* Offers and referrals */}
      <div className="grid gap-3 xl:grid-cols-2">
        <div className={cn(PANEL, 'flex flex-col')}>
          <PanelHeader label="Offer intelligence" title="Redemption vs. purchase" accent="warn">
            <Gift className="h-3.5 w-3.5 text-[rgb(var(--signal-warn))]" />
          </PanelHeader>
          {intelligence.promos?.length ? (
            <div className="divide-y divide-stone-100 dark:divide-white/5">
              {intelligence.promos.slice(0, 8).map((promo) => (
                <div
                  key={promo.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        NUM,
                        'text-xs font-extrabold text-stone-900 dark:text-stone-50'
                      )}
                    >
                      {promo.code}
                    </p>
                    <p className={cn('text-[10px] font-medium', MUTED)}>
                      {Number(promo.purchasers || 0).toLocaleString()} purchaser
                      {Number(promo.purchasers) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      NUM,
                      'shrink-0 text-xs font-bold text-stone-700 dark:text-stone-200'
                    )}
                  >
                    {Number(promo.redemptions || 0).toLocaleString()} uses
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={Gift}>No attributed promo activity yet.</Empty>
          )}
        </div>

        <div className={cn(PANEL, 'flex flex-col')}>
          <PanelHeader
            label="Referral conversion"
            title="Who is bringing paying learners"
            accent="accent"
          >
            <Target className="h-3.5 w-3.5 text-indigo-500" />
          </PanelHeader>
          {intelligence.referrals?.length ? (
            <div className="divide-y divide-stone-100 dark:divide-white/5">
              {intelligence.referrals.slice(0, 8).map((row) => (
                <div
                  key={row.referrer_id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-stone-900 dark:text-stone-50">
                      {row.name || row.email}
                    </p>
                    <p className={cn('text-[10px] font-medium', MUTED)}>
                      {Number(row.signups || 0)} signups · {Number(row.activated || 0)} activated
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {row.risk_flags?.length > 0 && (
                      <Pill tone="fault">{row.risk_flags.length} risk</Pill>
                    )}
                    <span
                      className={cn(NUM, 'text-xs font-bold text-stone-900 dark:text-stone-50')}
                    >
                      {Number(row.paid || 0)} paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={Users}>No referral activity yet.</Empty>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
