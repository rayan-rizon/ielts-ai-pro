import { CircleHelp, Compass, Link2, Mail, MousePointer2, Search, Share2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Tip } from '../ui/primitives';

/**
 * First-touch acquisition channels, as classified in src/lib/attribution.js and
 * stored on public.users.signup_channel. One definition shared by the overview
 * dashboard and the users table so both read the same way.
 */
export const SIGNUP_CHANNELS = {
  paid_search: {
    label: 'Paid search (Google ads)',
    short: 'Paid search',
    icon: MousePointer2,
    tone: 'text-[#4285f4] bg-[#4285f4]/10',
    bar: 'bg-[#4285F4]',
  },
  paid_social: {
    label: 'Paid social (Meta ads)',
    short: 'Paid social',
    icon: MousePointer2,
    tone: 'text-[#1877f2] bg-[#1877f2]/10',
    bar: 'bg-[#1877F2]',
  },
  organic_search: {
    label: 'Organic search',
    short: 'Organic search',
    icon: Search,
    tone: 'text-[#34a853] bg-[#34a853]/10',
    bar: 'bg-[rgb(var(--signal-ok))]',
  },
  organic_social: {
    label: 'Organic social',
    short: 'Organic social',
    icon: Share2,
    tone: 'text-[#e1306c] bg-[#e1306c]/10',
    bar: 'bg-[#E1306C]',
  },
  email: {
    label: 'Email',
    short: 'Email',
    icon: Mail,
    tone: 'text-[#b7791f] bg-[#b7791f]/10',
    bar: 'bg-[#B7791F]',
  },
  referral: {
    label: 'Referral',
    short: 'Referral',
    icon: Link2,
    tone: 'text-[#5a63df] bg-[#5a63df]/10',
    bar: 'bg-[rgb(var(--signal-warn))]',
  },
  direct: {
    label: 'Direct visit',
    short: 'Direct',
    icon: Compass,
    tone: 'text-stone-500 bg-stone-100 dark:text-stone-400 dark:bg-white/[0.06]',
    bar: 'bg-stone-400',
  },
  other: {
    label: 'Other source',
    short: 'Other',
    icon: Compass,
    tone: 'text-stone-500 bg-stone-100 dark:text-stone-400 dark:bg-white/[0.06]',
    bar: 'bg-stone-300',
  },
  unknown: {
    label: 'Source not captured',
    short: 'Unknown',
    icon: CircleHelp,
    tone: 'text-stone-400 bg-stone-100 dark:text-stone-500 dark:bg-white/[0.06]',
    bar: 'bg-stone-200 dark:bg-white/10',
  },
};

/** Filter/select order: paid first, since that is what spend decisions hinge on. */
export const SIGNUP_CHANNEL_KEYS = [
  'paid_search',
  'paid_social',
  'organic_search',
  'organic_social',
  'referral',
  'email',
  'direct',
  'other',
  'unknown',
];

export const channelMeta = (channel) => SIGNUP_CHANNELS[channel] || SIGNUP_CHANNELS.unknown;

/** "Paid search (Google ads) · newsletter-aug" — full provenance for a tooltip. */
export const channelDescription = (channel, source) => {
  const meta = channelMeta(channel);
  const sourceName = source?.trim();
  return sourceName ? `${meta.label} · ${sourceName}` : meta.label;
};

/** Bare channel chip, no tooltip — compose it inside one. */
const ChannelChip = ({ channel, className }) => {
  const meta = channelMeta(channel);
  const Icon = meta.icon;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid h-4 w-4 shrink-0 place-items-center rounded-[5px] ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
        meta.tone,
        className
      )}
    >
      <Icon className="h-2.5 w-2.5 stroke-[2.35]" />
    </span>
  );
};

/** Compact channel chip used beside a user's name. */
export const SignupSourceMark = ({ channel, source, className }) => {
  const description = channelDescription(channel, source);
  return (
    <Tip content={description}>
      <span aria-label={description} className="inline-grid shrink-0 place-items-center">
        <ChannelChip channel={channel} className={className} />
      </span>
    </Tip>
  );
};

/** Icon + label, for table cells where the channel needs to be readable at a glance. */
export const SignupSourceCell = ({ channel, source, campaign }) => {
  const meta = channelMeta(channel);
  const description = channelDescription(channel, source);
  const detail = [source?.trim(), campaign?.trim()].filter(Boolean).join(' \u00b7 ');

  return (
    <Tip content={description}>
      <span
        aria-label={description}
        className="inline-flex min-w-0 items-center gap-1.5 cursor-default"
      >
        <ChannelChip channel={channel} />
        <span className="min-w-0">
          <span className="block text-[11px] font-extrabold text-stone-900 dark:text-stone-50 leading-tight truncate">
            {meta.short}
          </span>
          {detail && (
            <span className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 leading-tight truncate max-w-[130px]">
              {detail}
            </span>
          )}
        </span>
      </span>
    </Tip>
  );
};
