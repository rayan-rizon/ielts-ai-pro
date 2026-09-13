import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, Mail, Megaphone, MonitorSmartphone, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, Pill } from '@/components/admin/ui/primitives';
import AnnouncementBanner from '@/components/shared/AnnouncementBanner';
import InAppNotificationCard from '@/features/marketing/components/InAppNotificationCard';
import { channelLabel, deliveryStrategyFor } from '../autopilotDeliveryStrategy';

// Sample learner contexts let admins judge the finished experience without
// exposing a real learner or creating a delivery.
const EXAMPLES = {
  first_practice: {
    title: 'Make your first 15 minutes count',
    message: 'Start with a short Reading check to build a useful baseline for your target band.',
    cta: 'Start my first practice',
    signals: ['Target band', 'No completed practice'],
  },
  next_practice: {
    title: 'Turn your first result into progress',
    message: 'Your first Reading result is saved. Review it and choose one focused follow-up.',
    cta: 'See my next step',
    signals: ['Saved result', 'Practice module'],
  },
  subscriber_feature_help: {
    title: 'One plan benefit is ready to use',
    message: 'Your plan includes guided practice and AI feedback. Try one short activity today.',
    cta: 'Use my plan benefit',
    signals: ['Current plan', 'Unused benefits'],
  },
  quota_upgrade: {
    title: 'Keep your feedback loop moving',
    message:
      'You reached your AI feedback allowance on two study days. Compare plans for more feedback.',
    cta: 'Compare my options',
    signals: ['Recent AI usage', 'Current allowance'],
  },
  re_engagement: {
    title: 'Pick up from your last saved step',
    message:
      'Your recent practice is still here. Continue with one short activity built from that progress.',
    cta: 'Continue where I left off',
    signals: ['Saved progress', 'Last practice'],
  },
  cancellation_support: {
    title: 'Use your remaining plan time well',
    message:
      'You still have 8 days of access. Review your progress and choose what you want to finish.',
    cta: 'Review my progress',
    signals: ['Plan end date', 'Saved progress'],
  },
  referral_bonus_reminder: {
    title: 'Your 2 referral credits are ready',
    message: 'Use your verified bonus credits before the current bonus period ends.',
    cta: 'Use my credits',
    signals: ['Credit balance', 'Expiry date'],
  },
  score_plateau: {
    title: 'Try a new route to your next 0.5',
    message: 'Three comparable Reading results point to one focused area worth practising next.',
    cta: 'See my focus area',
    signals: ['Comparable results', 'Supported weak area'],
  },
  incomplete_test: {
    title: 'Your 18 answers are still waiting',
    message:
      'Continue your saved Reading test without starting over. Your completed answers are safe.',
    cta: 'Resume my test',
    signals: ['Answered questions', 'Saved test'],
  },
  exam_countdown: {
    title: '15 days left: focus on what matters most',
    message:
      'Your study plan is fitted to your confirmed exam date, target band, and available time.',
    cta: 'Open my 15-day plan',
    signals: ['Confirmed exam date', 'Target band', 'Study time'],
  },
  checkout_recovery: {
    title: 'Your selected plan is still ready',
    message:
      'Your upgrade did not complete. Return to your selected plan or get help with payment.',
    cta: 'Continue my upgrade',
    signals: ['Selected plan', 'Unfinished checkout'],
  },
};

const channelIcon = { in_app: Megaphone, banner: MonitorSmartphone, email: Mail, push: Bell };

export default function AutopilotMessagePreviewDialog({ policy, open, onOpenChange }) {
  const allowedChannels = useMemo(() => {
    const strategy = deliveryStrategyFor(policy);
    return [...new Set([...strategy.active, ...strategy.away, ...strategy.remaining])];
  }, [policy]);
  const [channel, setChannel] = useState('in_app');

  useEffect(() => {
    if (open)
      setChannel(allowedChannels.includes('in_app') ? 'in_app' : allowedChannels[0] || 'in_app');
  }, [open, allowedChannels]);

  if (!policy) return null;
  const example = EXAMPLES[policy.playbook_key] || {
    title: policy.name,
    message: 'A relevant next step is ready from the learner’s verified activity.',
    cta: 'Open my next step',
    signals: ['Latest verified activity'],
  };
  const { title, message, cta, signals } = example;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-3xl overflow-y-auto border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <DialogTitle>Notification preview</DialogTitle>
          <DialogDescription>
            See the exact learner experience using sample context. Nothing is sent.
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
              <p className="mt-2 text-sm font-bold">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/70">{message}</p>
            </div>
          </div>
        ) : channel === 'banner' ? (
          <div className="overflow-hidden rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] py-10 dark:border-white/[0.07] dark:bg-[#08080a]">
            <div className="pointer-events-none">
              <AnnouncementBanner
                preview
                announcement={{
                  enabled: true,
                  type: 'info',
                  title,
                  message,
                  link_url: '/dashboard',
                  link_label: cta,
                  dismissible: false,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] p-3 sm:p-5 dark:border-white/[0.07] dark:bg-[#08080a]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className={cn(MICRO, MUTED)}>Live learner card</span>
              <Pill tone="accent">Sample data</Pill>
            </div>
            <InAppNotificationCard
              preview
              playbookKey={policy.playbook_key}
              title={title}
              message={message}
              ctaLabel={cta}
              className="mx-auto max-w-md"
            />
          </div>
        )}
        <div className="rounded-lg border border-stone-200 p-3 dark:border-white/[0.07]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#5a63df]" />
            <p className="text-xs font-extrabold text-stone-800 dark:text-stone-100">
              Personalization used
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {signals.map((signal) => (
              <span
                key={signal}
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-600 dark:border-white/[0.1] dark:text-stone-300"
              >
                <Check className="h-3 w-3 text-[rgb(var(--signal-ok))]" /> {signal}
              </span>
            ))}
          </div>
          <p className={cn(MICRO, MUTED, 'mt-3 normal-case tracking-normal')}>
            Copilot uses only verified learner activity, rechecks eligibility, and chooses one
            channel before delivery.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
