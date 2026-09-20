import { useMemo, useState } from 'react';
import { Activity, BarChart3, Clock3, Gift, Target, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  FilterRail,
  FunnelStep,
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
      <PanelHeader label={title} className="px-3.5 py-2.5" />
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
    ['Offer sent', recovery.sent, 'One-use 20% codes'],
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
        title="48-hour 20% offer"
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
          expires after 48 hours. The scheduler checks every fifteen minutes.
        </p>
      </div>
    </div>
  );
};

const AnalyticsPanel = ({ dashboard, intelligence, breakdowns, recovery }) => {
  const [statusFilter, setStatusFilter] = useState('active');
  const campaignRows = useMemo(() => dashboard.campaigns || [], [dashboard.campaigns]);

  const filteredCampaignRows = useMemo(() => {
    if (statusFilter === 'active') return campaignRows.filter((r) => r.status === 'active');
    if (statusFilter === 'paused') return campaignRows.filter((r) => r.status === 'paused');
    return campaignRows;
  }, [campaignRows, statusFilter]);

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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2 dark:border-white/[0.07]">
        <SectionLabel accent="accent">Measured outcomes</SectionLabel>
        <p className={cn(MICRO, MUTED)}>Server-confirmed attribution · last 30 days</p>
      </div>
      {/* The headline totals live once, in the hub's command strip above the
          tabs — repeating them here put the same figures on screen twice
          under two different labels. Overview starts at the funnel. */}

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
        >
          <FilterRail
            layoutId="analyticsStatusFilterActivePill"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              ['all', 'All'],
              ['active', 'Active only'],
              ['paused', 'Paused only'],
            ].map(([id, label]) => ({
              id,
              label,
              count:
                id === 'all'
                  ? campaignRows.length
                  : campaignRows.filter((row) => row.status === id).length,
            }))}
          />
        </PanelHeader>
        {filteredCampaignRows.length ? (
          <>
            {/* Mobile Responsive Drilldown (< md) — zero horizontal overflow */}
            <div className="divide-y divide-stone-100 md:hidden dark:divide-white/5">
              {filteredCampaignRows.map((row) => {
                const failed = Number(row.failed || 0);
                const skipped = Number(row.skipped || 0);
                const hasIssues = failed > 0 || skipped > 0;
                const convRate = Number(row.conversion_rate || 0);
                const purchases = Number(row.purchases || 0);
                const checkouts = Number(row.checkouts || 0);
                const reach = Number(row.reach || 0);
                const delivered = Number(row.delivered || 0);
                const views = Number(row.views || 0);
                const clicks = Number(row.clicks || 0);
                const ctr = row.ctr || 0;

                return (
                  <div key={row.id} className="p-3.5 space-y-2">
                    {/* Header: Campaign name, status pill, and Conversion outcome */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold leading-snug text-stone-900 dark:text-stone-50">
                          {row.name}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Pill tone={STATUS_TONE[row.status]}>{row.status}</Pill>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            NUM,
                            'text-sm font-extrabold',
                            convRate > 0
                              ? 'text-[rgb(var(--signal-ok))]'
                              : 'text-stone-500 dark:text-stone-400'
                          )}
                        >
                          {convRate}%
                        </p>
                        <p className={cn(MICRO, MUTED, 'text-[8px]')}>conversion</p>
                      </div>
                    </div>

                    {/* 4-column metric grid */}
                    <div className={cn(WELL, 'grid grid-cols-4 gap-1 rounded-lg p-2 text-center')}>
                      <div className="min-w-0">
                        <p className={cn(MICRO, MUTED, 'truncate text-[8px]')}>Delivery</p>
                        <p
                          className={cn(
                            NUM,
                            'mt-0.5 text-xs font-bold text-stone-800 dark:text-stone-100'
                          )}
                        >
                          {delivered.toLocaleString()}
                        </p>
                        <p className={cn(NUM, MUTED, 'mt-0.5 truncate text-[8px]')}>
                          {reach.toLocaleString()} reach
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className={cn(MICRO, MUTED, 'truncate text-[8px]')}>Engagement</p>
                        <p
                          className={cn(
                            NUM,
                            'mt-0.5 text-xs font-bold text-stone-800 dark:text-stone-100'
                          )}
                        >
                          {views.toLocaleString()}
                        </p>
                        <p className={cn(NUM, MUTED, 'mt-0.5 truncate text-[8px]')}>
                          {clicks.toLocaleString()} clicks
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className={cn(MICRO, MUTED, 'truncate text-[8px]')}>CTR</p>
                        <p
                          className={cn(
                            NUM,
                            'mt-0.5 text-xs font-bold text-stone-800 dark:text-stone-100'
                          )}
                        >
                          {ctr}%
                        </p>
                        <p className={cn(MICRO, MUTED, 'mt-0.5 truncate text-[8px]')}>click rate</p>
                      </div>
                      <div className="min-w-0">
                        <p className={cn(MICRO, MUTED, 'truncate text-[8px]')}>Purchases</p>
                        <p
                          className={cn(
                            NUM,
                            'mt-0.5 text-xs font-extrabold',
                            purchases > 0
                              ? 'text-[rgb(var(--signal-ok))]'
                              : 'text-stone-900 dark:text-stone-50'
                          )}
                        >
                          {purchases.toLocaleString()}
                        </p>
                        <p className={cn(NUM, MUTED, 'mt-0.5 truncate text-[8px]')}>
                          {checkouts.toLocaleString()} chkout
                        </p>
                      </div>
                    </div>

                    {/* Issue alert if any failed or skipped */}
                    {hasIssues && (
                      <div className="flex items-center justify-between rounded bg-red-500/5 px-2 py-1 text-[10px] font-medium dark:bg-red-500/10">
                        <span className={cn(MICRO, 'text-[8px] text-[rgb(var(--signal-fault))]')}>
                          Delivery issues
                        </span>
                        <span
                          className={cn(
                            NUM,
                            'text-[10px] font-bold text-[rgb(var(--signal-fault))]'
                          )}
                        >
                          {failed} failed · {skipped} skipped
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden overflow-x-auto md:block">
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
                    ].map(([label, align], idx) => (
                      <th
                        key={label}
                        className={cn(
                          MICRO,
                          MUTED,
                          'whitespace-nowrap px-3 py-2.5',
                          align === 'right' && 'text-right',
                          idx === 0 &&
                            'sticky left-0 z-20 bg-white/95 dark:bg-[#131315]/95 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.06)]'
                        )}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaignRows.map((row) => {
                    const failed = Number(row.failed || 0);
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/60 dark:border-white/5 dark:hover:bg-white/[0.02]"
                      >
                        <td className="sticky left-0 z-10 bg-white/95 px-3 py-2.5 dark:bg-[#131315]/95 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.06)]">
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
          </>
        ) : (
          <Empty
            icon={Activity}
            title={
              statusFilter === 'all'
                ? 'No campaign activity in the last 30 days'
                : `No ${statusFilter} campaigns match this view`
            }
          >
            {statusFilter === 'all'
              ? 'Each campaign appears here after its first dispatch.'
              : `There are currently no ${statusFilter} campaigns.`}
          </Empty>
        )}
      </div>

      {/* Attribution */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2 pt-1 dark:border-white/[0.07]">
        <SectionLabel>Where purchases come from</SectionLabel>
        <p className={cn(MICRO, MUTED)}>Top 6 per breakdown</p>
      </div>
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2 pt-1 dark:border-white/[0.07]">
        <SectionLabel>Offers and advocates</SectionLabel>
      </div>
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
