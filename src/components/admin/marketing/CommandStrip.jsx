import { useMemo } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  SIGNAL_BG,
  SIGNAL_TEXT,
  SectionLabel,
  StatCell,
  StatRail,
} from '@/components/admin/ui/primitives';
import { blockingIssue, journeyState } from './shared';

/**
 * The hub's standing read-out.
 *
 * Two things live here and they answer different questions, so they now render
 * in two places rather than one stacked block:
 *
 *   `HubChecks`    — "is anything misconfigured?" That is true of the whole hub,
 *                    not of one tab, so it sits directly under the page header
 *                    and stays on screen whichever tab is open. It used to be
 *                    buried inside Performance, where an operator working in
 *                    Campaigns never saw a stalled journey.
 *   `CommandStrip` — "how is it performing?" Thirty-day totals, which belong
 *                    with the rest of Performance and nowhere else.
 *
 * Every figure is derived from loaded records. Nothing is estimated, and when
 * nothing is wrong the rail says so rather than padding itself with filler.
 */

/**
 * Ordered worst-first. The list is deliberately short: each entry is something
 * an operator can act on in one click, and the tab it routes to is the place
 * that action happens.
 */
const buildAttention = ({ campaigns, journeys, recovery, autopilot }) => {
  const items = [];
  const liveConversion = campaigns.filter(
    (campaign) => campaign.status === 'active' && campaign.objective === 'paid_conversion'
  );

  const prepared = Number(autopilot?.counts?.prepared || 0);
  const recommendations = (autopilot?.recommendations || []).length;
  if (prepared || recommendations) {
    items.push({
      tone: prepared ? 'warn' : 'accent',
      label: prepared
        ? `${prepared} personalized intervention${prepared === 1 ? '' : 's'} need review`
        : `${recommendations} Autopilot recommendation${recommendations === 1 ? '' : 's'} ready`,
      detail: prepared
        ? 'Evidence and learner-facing copy are prepared in Copilot'
        : 'New evidence-led steps are available in Copilot',
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
};

/** Severity in words, so the card does not rely on colour alone. */
const SEVERITY_LABEL = {
  fault: 'Blocking',
  warn: 'Needs setup',
  accent: 'In progress',
};

/**
 * One check, as a card an operator can act on.
 *
 * These were a scrolling list of one-line rows, which forced the detail — the
 * part that says *which* journey is stalled and what happens next — to truncate
 * mid-sentence. A card gives the sentence room, states the severity in words
 * rather than only in colour, and carries its own button, so nothing is hidden
 * behind a scroll or an expander.
 */
const CheckCard = ({ item, onNavigate, wide = false }) => (
  <button
    type="button"
    onClick={() => onNavigate(item.tab)}
    className={cn(
      PANEL,
      'group relative min-w-0 overflow-hidden p-3 pl-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12',
      // A single check has a whole row to itself, so it lies down: severity and
      // sentence on the left, the action parked on the right. Stacking it into
      // a narrow column left most of the row empty and the card looking clipped.
      wide ? 'flex items-center gap-4 sm:pr-4' : 'flex flex-col'
    )}
  >
    <span className={cn('absolute inset-y-0 left-0 w-[3px]', SIGNAL_BG[item.tone])} />
    <span className={cn('min-w-0 flex-1', wide && 'flex flex-col')}>
      <span className={cn(MICRO, SIGNAL_TEXT[item.tone], 'block')}>
        {SEVERITY_LABEL[item.tone]}
      </span>
      <span className="mt-1.5 block text-[12px] font-extrabold leading-snug text-stone-900 dark:text-stone-50">
        {item.label}
      </span>
      <span className={cn('mt-1 block text-[10px] font-medium leading-relaxed', MUTED)}>
        {item.detail}
      </span>
    </span>
    <span
      className={cn(
        MICRO,
        'flex items-center gap-1 text-stone-600 dark:text-stone-300',
        wide ? 'shrink-0' : 'mt-auto pt-2.5'
      )}
    >
      {item.action}
      <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
    </span>
  </button>
);

export const HubChecks = ({ campaigns, journeys, recovery, autopilot, onNavigate }) => {
  const attention = useMemo(
    () => buildAttention({ campaigns, journeys, recovery, autopilot }),
    [campaigns, journeys, recovery, autopilot]
  );

  if (!attention.length) {
    return (
      <div className={cn(PANEL, 'flex items-center gap-2 px-3.5 py-2.5')}>
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]" />
        <p className={cn('text-[11px] font-medium', MUTED)}>
          <span className="font-bold text-stone-700 dark:text-stone-200">
            No configuration issues.
          </span>{' '}
          Delivery health and learner outcomes are reviewed under Performance.
        </p>
      </div>
    );
  }

  const blocking = attention.filter((item) => item.tone === 'fault').length;

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel accent={blocking ? 'fault' : 'warn'}>Needs attention</SectionLabel>
        <p className={cn(MICRO, MUTED)}>
          {blocking
            ? `${blocking} blocking · ${attention.length - blocking} to set up`
            : `${attention.length} item${attention.length === 1 ? '' : 's'} to set up`}
        </p>
      </div>
      {/* Every check is on screen. Severity already orders them, so an operator
          reads top-left to bottom-right and stops when they run out. The column
          count follows the number of checks so the row is always filled — a
          three-column grid holding one card reads as a broken layout. */}
      <div
        className={cn(
          'grid grid-cols-1 gap-2.5',
          attention.length === 2 && 'sm:grid-cols-2',
          attention.length >= 3 && 'sm:grid-cols-2 xl:grid-cols-3'
        )}
      >
        {attention.map((item) => (
          <CheckCard
            key={item.label}
            item={item}
            wide={attention.length === 1}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
};

const CommandStrip = ({ campaigns, dashboard }) => {
  const live = campaigns.filter((campaign) => campaign.status === 'active');
  const liveConversion = live.filter((campaign) => campaign.objective === 'paid_conversion');

  const revenue = useMemo(() => {
    const totals = {};
    (dashboard.revenue || []).forEach((row) => {
      totals[row.currency] = (totals[row.currency] || 0) + Number(row.net || 0);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [dashboard.revenue]);

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
      <StatRail className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((count) => (
          <StatCell key={count.label} {...count} />
        ))}

        {/* Currencies get a line each — joined onto one they overflow the tile
            and "USD 2210.50 · BDT 48200" reads as a single number. */}
        <StatCell label="Attributed revenue" sub="Net · 30d" className="col-span-2 sm:col-span-1">
          {revenue.length ? (
            <div className="w-full space-y-0.5">
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
                'text-2xl font-extrabold leading-none text-stone-900 dark:text-stone-50'
              )}
            >
              —
            </p>
          )}
        </StatCell>
      </StatRail>
    </div>
  );
};

export default CommandStrip;
