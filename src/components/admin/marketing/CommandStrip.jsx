import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  AttentionRow,
  LiveDot,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  SectionLabel,
} from '@/components/admin/ui/primitives';
import { blockingIssue } from './shared';

/**
 * The hub's standing read-out, pinned above the tabs.
 *
 * Marketing state used to be spread across five tabs, so "is anything live?"
 * and "is anything stuck?" both cost a click to answer. This answers both
 * without one: three counts on the left, and on the right every condition that
 * needs a human — each row jumping straight to the tab that fixes it.
 *
 * Every figure is derived from loaded records. Nothing here is estimated, and
 * when there is genuinely nothing wrong the rail says so rather than padding
 * itself with filler.
 */
const CommandStrip = ({ campaigns, journeys, recovery, dashboard, onNavigate }) => {
  const live = campaigns.filter((campaign) => campaign.status === 'active');
  const liveConversion = live.filter((campaign) => campaign.objective === 'paid_conversion');

  const attention = useMemo(() => {
    const items = [];

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

    const unarmed = journeys.filter((journey) => !journey.campaign_id);
    if (unarmed.length) {
      items.push({
        tone: 'warn',
        label: `${unarmed.length} journey${unarmed.length === 1 ? '' : 's'} unarmed`,
        detail: 'Automation is configured but no campaign is assigned to it',
        action: 'Assign',
        tab: 'journeys',
      });
    }

    const paused = campaigns.filter((campaign) => campaign.status === 'paused');
    if (paused.length) {
      items.push({
        tone: 'warn',
        label: `${paused.length} campaign${paused.length === 1 ? '' : 's'} paused`,
        detail: paused
          .slice(0, 3)
          .map((campaign) => campaign.name)
          .join(' · '),
        action: 'Review',
        tab: 'campaigns',
      });
    }

    if (!recovery?.campaign_id) {
      items.push({
        tone: 'warn',
        label: 'Checkout recovery is not configured',
        detail: 'Abandoned checkouts are being recorded but no offer is going out',
        action: 'Set up',
        tab: 'overview',
      });
    } else if (Number(recovery.eligible || 0) > 0) {
      items.push({
        tone: 'accent',
        label: `${recovery.eligible} abandoned checkout${Number(recovery.eligible) === 1 ? '' : 's'} eligible now`,
        detail: 'The scheduler will send their recovery offer within fifteen minutes',
        action: 'Watch',
        tab: 'overview',
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
  }, [campaigns, journeys, recovery, liveConversion.length]);

  // Labels stay one short word each: at three columns in a fixed-width block
  // anything longer truncates to "LIVE CAMP…", which reads as a rendering bug
  // rather than a label.
  const counts = [
    {
      label: 'Live now',
      value: live.length,
      sub: `${liveConversion.length} core`,
      live: live.length > 0,
    },
    {
      label: 'Reach',
      value: Number(dashboard.totals?.reach || 0),
      sub: '30 days',
    },
    {
      label: 'Purchases',
      value: Number(dashboard.totals?.purchases || 0),
      sub: '30 days',
    },
  ];

  return (
    <div className={cn(PANEL, 'grid overflow-hidden lg:grid-cols-[minmax(0,380px)_1fr]')}>
      <div className="grid min-w-0 grid-cols-3 divide-x divide-stone-200/80 border-b border-stone-200/80 dark:divide-white/[0.07] dark:border-white/[0.07] lg:border-b-0 lg:border-r">
        {counts.map((count) => (
          // `min-w-0` is load-bearing: the labels are nowrap (truncate), which
          // makes each grid cell's min-content the full label width, so without
          // it the third column overflowed the panel and was clipped on mobile.
          <div
            key={count.label}
            className="flex min-w-0 flex-col justify-center px-3 py-3 sm:px-3.5"
          >
            <div className="flex items-center gap-1.5">
              {count.live && <LiveDot />}
              <p className={cn(MICRO, MUTED, 'truncate')}>{count.label}</p>
            </div>
            <p
              className={cn(
                NUM,
                'mt-1.5 text-2xl font-extrabold leading-none text-stone-900 dark:text-stone-50'
              )}
            >
              {count.value.toLocaleString()}
            </p>
            <p className={cn(MICRO, MUTED, 'mt-1.5 truncate')}>{count.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between gap-2 px-3.5 pb-1 pt-3">
          <SectionLabel accent={attention.length ? 'warn' : 'ok'}>Needs attention</SectionLabel>
          {attention.length > 0 && (
            <span className={cn(MICRO, MUTED)}>
              {attention.length} item{attention.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        {attention.length ? (
          // Tall enough for four rows before it scrolls. At the previous height
          // the top row — always the most severe, since items are pushed in
          // severity order — could sit scrolled out of view.
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
          <div className="flex flex-1 items-center gap-2 px-3.5 py-4">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[rgb(var(--signal-ok))]" />
            <p className={cn('text-[11px] font-medium', MUTED)}>
              Nothing is blocked. Every campaign has an audience, every journey has a campaign, and
              checkout recovery is armed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandStrip;
