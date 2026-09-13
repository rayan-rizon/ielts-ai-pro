import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  AttentionRow,
  InfoTip,
  LiveDot,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  SectionLabel,
} from '@/components/admin/ui/primitives';
import { blockingIssue, journeyState } from './shared';

/**
 * The hub's standing read-out, pinned above the tabs.
 *
 * This owns the headline numbers for the whole hub. They used to appear here
 * *and* again at the top of the Overview tab, so the same three figures were on
 * screen twice with different labels ("Live now" / "Live campaigns") — which is
 * what made the page read as more data than it actually contains. Overview now
 * starts at the funnel and these are the single copy, visible from every tab.
 *
 * Every figure is derived from loaded records. Nothing is estimated, and when
 * nothing is wrong the rail says so rather than padding itself with filler.
 */
const CommandStrip = ({ campaigns, journeys, recovery, dashboard, autopilot, onNavigate }) => {
  const live = campaigns.filter((campaign) => campaign.status === 'active');
  const liveConversion = live.filter((campaign) => campaign.objective === 'paid_conversion');

  const revenue = useMemo(() => {
    const totals = {};
    (dashboard.revenue || []).forEach((row) => {
      totals[row.currency] = (totals[row.currency] || 0) + Number(row.net || 0);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [dashboard.revenue]);

  const attention = useMemo(() => {
    const items = [];

    const prepared = Number(autopilot?.counts?.prepared || 0);
    const recommendations = (autopilot?.recommendations || []).length;
    if (prepared || recommendations) {
      items.push({
        tone: prepared ? 'warn' : 'accent',
        label: prepared
          ? `${prepared} personalized intervention${prepared === 1 ? '' : 's'} need review`
          : `${recommendations} Autopilot recommendation${recommendations === 1 ? '' : 's'} ready`,
        detail: prepared
          ? 'Evidence and learner-facing copy are prepared in Overview'
          : 'New evidence-led steps are available in Overview',
        action: 'Review',
        tab: 'copilot',
      });
    }

    // A journey armed against a campaign that is not active is the worst state
    // in the hub: the scheduler picks it up every fifteen minutes and the
    // dispatch throws "Campaign must be active or scheduled" every single time.
    // It looks switched on and sends nothing, so it leads the list.
    const stalled = journeys.filter((journey) => journeyState(journey, campaigns) === 'stalled');
    if (stalled.length) {
      items.push({
        tone: 'fault',
        label: `${stalled.length} journey${stalled.length === 1 ? ' is' : 's are'} on but cannot send`,
        detail: `Campaign is paused: ${stalled
          .slice(0, 3)
          .map((journey) => journey.name)
          .join(' · ')}`,
        action: 'Fix',
        tab: 'journeys',
      });
    }

    const blocked = campaigns.filter(
      (campaign) => !['completed', 'cancelled'].includes(campaign.status) && blockingIssue(campaign)
    );
    if (blocked.length) {
      items.push({
        tone: 'fault',
        label: `${blocked.length} campaign${blocked.length === 1 ? '' : 's'} cannot send`,
        detail: blocked
          .slice(0, 2)
          .map((campaign) => `${campaign.name} — ${blockingIssue(campaign)}`)
          .join(' · '),
        action: 'Fix',
        tab: 'campaigns',
      });
    }

    const unarmed = journeys.filter((journey) => journeyState(journey, campaigns) === 'unarmed');
    if (unarmed.length) {
      items.push({
        tone: 'warn',
        label: `${unarmed.length} journey${unarmed.length === 1 ? '' : 's'} unarmed`,
        detail: 'Automation is configured but no campaign is assigned to it',
        action: 'Assign',
        tab: 'journeys',
      });
    }

    if (!recovery?.campaign_id) {
      items.push({
        tone: 'warn',
        label: 'Checkout recovery is not configured',
        detail: 'Abandoned checkouts are being recorded but no offer is going out',
        action: 'Set up',
        tab: 'performance',
      });
    } else if (Number(recovery.eligible || 0) > 0) {
      items.push({
        tone: 'accent',
        label: `${recovery.eligible} abandoned checkout${Number(recovery.eligible) === 1 ? '' : 's'} eligible now`,
        detail: 'The scheduler will send their recovery offer within fifteen minutes',
        action: 'Watch',
        tab: 'performance',
      });
    }

    if (!liveConversion.length) {
      items.push({
        tone: 'warn',
        label: 'No paid-conversion campaign is live',
        detail: 'The core upgrade funnel has nothing running against it',
        action: 'Activate',
        tab: 'campaigns',
      });
    }

    return items;
  }, [autopilot, campaigns, journeys, recovery, liveConversion.length]);

  const counts = [
    {
      label: 'Live now',
      value: live.length.toLocaleString(),
      sub: `${liveConversion.length} paid conversion`,
      live: live.length > 0,
      tip: 'Campaigns with status "active". Only these can dispatch.',
    },
    {
      label: 'Reach',
      value: Number(dashboard.totals?.reach || 0).toLocaleString(),
      sub: 'Learners addressed · 30d',
    },
    {
      label: 'Clicks',
      value: Number(dashboard.totals?.clicks || 0).toLocaleString(),
      sub: 'Tracked CTA opens · 30d',
    },
    {
      label: 'Purchases',
      value: Number(dashboard.totals?.purchases || 0).toLocaleString(),
      sub: 'Attributed · 30d',
      tip: 'Counted only after a server-confirmed payment.',
    },
  ];

  return (
    <div className={cn(PANEL, 'overflow-hidden')}>
      <div className="grid grid-cols-2 gap-px bg-stone-200/80 sm:grid-cols-3 lg:grid-cols-5 dark:bg-white/[0.07]">
        {counts.map((count) => (
          <div
            key={count.label}
            className="flex min-w-0 flex-col justify-center bg-white px-3.5 py-3 dark:bg-[#131315]"
          >
            <div className="flex items-center gap-1.5">
              {count.live && <LiveDot />}
              <p className={cn(MICRO, MUTED, 'truncate')}>{count.label}</p>
              {count.tip && <InfoTip>{count.tip}</InfoTip>}
            </div>
            <p
              className={cn(
                NUM,
                'mt-1.5 text-2xl font-extrabold leading-none text-stone-900 dark:text-stone-50'
              )}
            >
              {count.value}
            </p>
            <p className={cn(MICRO, MUTED, 'mt-1.5 truncate')}>{count.sub}</p>
          </div>
        ))}

        {/* Currencies get a line each — joined onto one they overflow the tile
            and "USD 2210.50 · BDT 48200" reads as a single number. */}
        <div className="col-span-2 flex min-w-0 flex-col justify-center bg-white px-3.5 py-3 sm:col-span-1 dark:bg-[#131315]">
          <p className={cn(MICRO, MUTED, 'truncate')}>Attributed revenue</p>
          {revenue.length ? (
            <div className="mt-1.5 space-y-0.5">
              {revenue.map(([currency, value]) => (
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
            <p
              className={cn(
                NUM,
                'mt-1.5 text-2xl font-extrabold leading-none text-stone-900 dark:text-stone-50'
              )}
            >
              —
            </p>
          )}
          <p className={cn(MICRO, MUTED, 'mt-1.5 truncate')}>Net · 30d</p>
        </div>
      </div>

      <div className="border-t border-stone-200/80 dark:border-white/[0.07]">
        <div className="flex items-center justify-between gap-2 px-3.5 pb-1 pt-3">
          <SectionLabel accent={attention.length ? 'warn' : 'ok'}>
            Configuration checks
          </SectionLabel>
          {attention.length > 0 && (
            <span className={cn(MICRO, MUTED)}>
              {attention.length} item{attention.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        {attention.length ? (
          // Tall enough for four rows before it scrolls. Items are pushed in
          // severity order, so the top row must never start out of view.
          <div className="max-h-[248px] divide-y divide-stone-100 overflow-y-auto dark:divide-white/5">
            {attention.map((item) => (
              <AttentionRow
                key={item.label}
                tone={item.tone}
                label={item.label}
                detail={item.detail}
                action={item.action}
                onClick={() => onNavigate(item.tab)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 pb-4 pt-1">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[rgb(var(--signal-ok))]" />
            <p className={cn('text-[11px] font-medium', MUTED)}>
              No configuration issues detected by these checks. Delivery health and learner outcomes
              are reviewed below.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandStrip;
