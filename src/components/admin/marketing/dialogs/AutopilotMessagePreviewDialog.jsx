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
import ExpiryTimer from '@/components/shared/ExpiryTimer';
import { scenarioForPlaybook } from '@/features/marketing/dev/adminNotificationScenarios';
import { channelLabel, deliveryStrategyFor } from '../autopilotDeliveryStrategy';

const channelIcon = { in_app: Megaphone, banner: MonitorSmartphone, email: Mail, push: Bell };

export default function AutopilotMessagePreviewDialog({ policy, open, onOpenChange }) {
  const allowedChannels = useMemo(() => {
    const strategy = deliveryStrategyFor(policy);
    return [...new Set([...strategy.active, ...strategy.away, ...strategy.remaining])];
  }, [policy]);
  const [channel, setChannel] = useState('in_app');
  const [previewExpiresAt, setPreviewExpiresAt] = useState('');

  useEffect(() => {
    if (open) {
      setChannel(allowedChannels.includes('in_app') ? 'in_app' : allowedChannels[0] || 'in_app');
      setPreviewExpiresAt(new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString());
    }
  }, [open, allowedChannels]);

  if (!policy) return null;
  const example = scenarioForPlaybook(policy.playbook_key) || {
    title: policy.name,
    message: 'A relevant next step is ready from the learner’s verified activity.',
    ctaLabel: 'Open my next step',
    contextLabel: 'Latest verified activity',
  };
  const { title, message, ctaLabel: cta, contextLabel, urgent = false } = example;
  const signals = [contextLabel].filter(Boolean);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-3xl overflow-y-auto border-stone-200 bg-white p-0 max-sm:left-3 max-sm:right-3 max-sm:w-auto max-sm:translate-x-0 dark:border-white/10 dark:bg-[#131315]">
        <div className="border-b border-stone-200/80 px-5 py-4 dark:border-white/[0.07]">
          <DialogHeader>
            <DialogTitle>Learner message preview</DialogTitle>
            <DialogDescription>Sample learner data · nothing is sent</DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Preview channel">
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
        </div>

        <div className="space-y-3 p-5">
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
                  {urgent && (
                    <div className="mt-5 rounded-xl border border-[#dedaf7] bg-[#f6f4ff] px-4 py-3 text-center">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6246d9]">
                        20% off · sample code
                      </p>
                      <p className="mt-1 font-mono text-lg font-extrabold tracking-[0.08em] text-[#4c43a8]">
                        IELTS20-DEMO
                      </p>
                      <ExpiryTimer
                        expiresAt={previewExpiresAt}
                        surface="light"
                        urgent
                        className="mt-2 justify-center"
                      />
                    </div>
                  )}
                  <span className="mt-4 inline-flex rounded-[10px] bg-[#6c4cff] px-5 py-3 text-[14px] font-extrabold text-white">
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
                {urgent && <ExpiryTimer expiresAt={previewExpiresAt} urgent className="mt-3" />}
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
                expiresAt={urgent ? previewExpiresAt : undefined}
                urgent={urgent}
                className="mx-auto max-w-md"
              />
            </div>
          )}
          <details className="group rounded-lg border border-stone-200 px-3 py-2 dark:border-white/[0.07]">
            <summary className="flex cursor-pointer list-none items-center gap-2 py-1">
              <Sparkles className="h-3.5 w-3.5 text-[#5a63df]" />
              <p className="text-xs font-extrabold text-stone-800 dark:text-stone-100">
                Personalization details
              </p>
            </summary>
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
              Eligibility and contact limits are checked again before delivery.
            </p>
          </details>
          {urgent && (
            <p className={cn(MICRO, MUTED, 'normal-case tracking-normal')}>
              Timer preview uses a sample 48-hour window. Live messages use the stored expiry.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
