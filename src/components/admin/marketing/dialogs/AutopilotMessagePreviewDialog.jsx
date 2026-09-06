import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Mail, Megaphone, MonitorSmartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, Pill } from '@/components/admin/ui/primitives';
import { channelLabel, deliveryStrategyFor } from '../autopilotDeliveryStrategy';

// These are deliberately generic examples. The worker fills only validated,
// learner-specific fields at delivery time; this preview never exposes a learner.
const EXAMPLES = {
  first_practice: [
    'Choose your first practice',
    'Start with a short activity that fits your IELTS goal.',
    'Choose an activity',
  ],
  next_practice: [
    'Your next practice is ready',
    'A focused follow-up activity is ready from your latest saved result.',
    'Continue practice',
  ],
  subscriber_feature_help: [
    'Make the most of your plan',
    'A feature included in your plan can help with your next practice step.',
    'Explore your plan',
  ],
  quota_upgrade: [
    'Need more AI feedback?',
    'You have reached a verified free-plan limit. Review the available options whenever you are ready.',
    'View plan options',
  ],
  re_engagement: [
    'A manageable next step is ready',
    'Return with one short practice activity based on where you last left off.',
    'Resume practice',
  ],
  cancellation_support: [
    'Your plan is ending soon',
    'Your saved progress is available. Review your plan settings and next steps.',
    'Review plan settings',
  ],
  referral_bonus_reminder: [
    'Your referral credit is available',
    'Use your verified credit before its expiry date.',
    'View your credit',
  ],
  score_plateau: [
    'A focused practice review is ready',
    'Your recent comparable results suggest one area that may be useful to practise next.',
    'Review practice',
  ],
  incomplete_test: [
    'Your progress is saved',
    'Continue your test whenever you are ready. Your saved answers are still available.',
    'Resume test',
  ],
  exam_countdown: [
    'Your study plan is ready',
    'Your plan fits your confirmed exam date, available time, and current practice needs.',
    'View study plan',
  ],
  checkout_recovery: [
    'Need help with your upgrade?',
    'Your upgrade has not completed yet. Return to checkout or get help with payment.',
    'Return to checkout',
  ],
};

const channelIcon = { in_app: Megaphone, banner: MonitorSmartphone, email: Mail, push: Bell };

export default function AutopilotMessagePreviewDialog({ policy, open, onOpenChange }) {
  const allowedChannels = useMemo(() => {
    const strategy = deliveryStrategyFor(policy);
    return [...new Set([...strategy.active, ...strategy.away, ...strategy.remaining])];
  }, [policy]);
  const [channel, setChannel] = useState('in_app');

  useEffect(() => {
    if (open) setChannel(allowedChannels[0] || 'in_app');
  }, [open, allowedChannels]);

  if (!policy) return null;
  const [title, message, cta] = EXAMPLES[policy.playbook_key] || [
    policy.name,
    'A relevant next step is ready when the required evidence is available.',
    'Open',
  ];
  const Icon = channelIcon[channel] || Megaphone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-2xl overflow-y-auto border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <DialogTitle>Message preview</DialogTitle>
          <DialogDescription>
            A generic example only. No learner is selected, queued, or contacted.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5" aria-label="Preview channel">
          {allowedChannels.map((item) => {
            const ItemIcon = channelIcon[item] || Megaphone;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setChannel(item)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-bold',
                  channel === item
                    ? 'border-[#5a63df] bg-[#f4f4ff] text-[#4d56ca] dark:bg-[#222342] dark:text-[#c9ccff]'
                    : 'border-stone-200 text-stone-600 dark:border-white/[0.1] dark:text-stone-300'
                )}
              >
                <ItemIcon className="h-3.5 w-3.5" /> {channelLabel(item)}
              </button>
            );
          })}
        </div>

        {channel === 'email' ? (
          <div className="rounded-xl border border-stone-200 bg-stone-100 p-3 sm:p-5">
            <div className="mx-auto mb-3 max-w-[600px] rounded-lg border border-stone-200 bg-white px-4 py-3">
              <p className={cn(MICRO, MUTED)}>Inbox subject</p>
              <p className="mt-1 text-sm font-extrabold text-stone-900">{title}</p>
            </div>
            <div className="mx-auto max-w-[600px] overflow-hidden rounded-2xl border border-[#e6e3dd] bg-white">
              <div className="bg-[#111113] px-8 py-5 text-center text-sm font-extrabold text-[#f7f8ff]">
                IELTS AI Pro
              </div>
              <div className="h-[3px] bg-[#6c4cff]" />
              <div className="px-7 py-8 sm:px-10">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6c4cff]">
                  Practice support
                </p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#18181b]">
                  {title}
                </h3>
                <p className="mt-5 text-[15px] text-[#3f3f46]">Hi Alex,</p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#52525b]">{message}</p>
                <span className="mt-7 inline-flex rounded-[10px] bg-[#6c4cff] px-5 py-3 text-[14px] font-extrabold text-white">
                  {cta}
                </span>
              </div>
            </div>
          </div>
        ) : channel === 'push' ? (
          <div className="mx-auto max-w-sm rounded-[2rem] border-[6px] border-[#222] bg-[#17171c] p-3 shadow-sm">
            <div className="rounded-2xl bg-[#2b2b31] p-4 text-white">
              <div className="flex items-center gap-2 text-[11px] text-white/70">
                <Bell className="h-3.5 w-3.5" /> IELTS AI Pro · now
              </div>
              <p className="mt-2 text-sm font-bold">Your next practice activity is ready.</p>
              <p className="mt-1 text-[11px] text-white/70">
                Open IELTS AI Pro when you are ready.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#e4e2f0] bg-[#faf9ff] p-3.5 dark:border-white/[0.07] dark:bg-[#100f15]">
            {channel === 'banner' && <Pill tone="accent">Dashboard banner</Pill>}
            <div className="mt-2 flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#ececff] text-[#5a63df]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="accent">Suggested for you</Pill>
                  <span className={cn(MICRO, MUTED)}>{policy.name}</span>
                </div>
                <h3 className="mt-2 text-[14px] font-extrabold text-stone-900 dark:text-stone-50">
                  {title}
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-stone-600 dark:text-stone-300">
                  {message}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-[#5a63df] px-3 py-2 text-[11px] font-extrabold text-white">
                  {cta}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        )}
        <p className={cn(MICRO, MUTED)}>
          The server chooses one eligible route, checks current learner state, and applies contact
          limits before delivery.
        </p>
      </DialogContent>
    </Dialog>
  );
}
