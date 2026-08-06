import { useEffect, useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Clock, Megaphone, Save, Ticket, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  COLLAPSE,
  FADE_UP,
  MICRO,
  PANEL,
  PILL_BASE,
  pillTone,
} from '@/components/admin/ui/primitives';
import {
  DateTimeField,
  OptionGroup,
  PanelCard,
  TextAreaField,
  TextField,
  ToggleRow,
} from './fields';
import AnnouncementBanner from '@/components/shared/AnnouncementBanner';
import {
  AUDIENCES,
  AUDIENCE_LABEL,
  isAnnouncementLive,
  isWithinWindow,
  normalizeAnnouncement,
  relativeTime,
} from '@/lib/communications';

const SEVERITY_OPTIONS = [
  { id: 'info', label: 'Info', dot: 'bg-[#5a63df]', ring: 'border-[#5a63df]/50' },
  { id: 'success', label: 'Success', dot: 'bg-emerald-500', ring: 'border-emerald-400/60' },
  {
    id: 'warning',
    label: 'Warning',
    dot: 'bg-[rgb(var(--signal-warn))]',
    ring: 'border-[rgb(var(--signal-warn)/0.5)]',
  },
  {
    id: 'critical',
    label: 'Critical',
    dot: 'bg-[rgb(var(--signal-fault))]',
    ring: 'border-[rgb(var(--signal-fault)/0.5)]',
  },
];

const AUDIENCE_OPTIONS = AUDIENCES.map((id) => ({ id, label: AUDIENCE_LABEL[id] }));

const statusOf = (config) => {
  if (!config.enabled) return { tone: 'neutral', label: 'Hidden' };
  if (!config.message.trim() && !config.title.trim())
    return { tone: 'warn', label: 'Empty — nothing to show' };
  if (config.starts_at && !isWithinWindow(config))
    return { tone: 'warn', label: `Scheduled ${relativeTime(config.starts_at)}` };
  if (!isWithinWindow(config)) return { tone: 'neutral', label: 'Window closed' };
  return { tone: 'ok', label: 'Live' };
};

/**
 * The persistent site-wide banner. Previously lived under Settings →
 * Announcements with only a message and three severities; it now shares the
 * severity, audience and scheduling vocabulary with broadcasts, which is what
 * makes the two genuinely one system rather than two similar forms.
 */
export default function BannerPanel({ value, saving, onSave }) {
  const [draft, setDraft] = useState(() => normalizeAnnouncement(value));

  useEffect(() => {
    setDraft(normalizeAnnouncement(value));
  }, [value]);

  const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const saved = useMemo(() => normalizeAnnouncement(value), [value]);
  const status = statusOf(saved);
  const dirty = useMemo(
    () => JSON.stringify(normalizeAnnouncement(draft)) !== JSON.stringify(saved),
    [draft, saved]
  );

  const persist = (override) => {
    const next = normalizeAnnouncement({ ...draft, ...override });
    if (next.enabled && !next.message.trim() && !next.title.trim()) {
      toast.error('Add a headline or message before enabling the banner');
      return;
    }
    if (next.starts_at && next.ends_at && new Date(next.ends_at) <= new Date(next.starts_at)) {
      toast.error('The banner must stop showing after it starts');
      return;
    }
    setDraft(next);
    onSave('public_announcement', next);
  };

  // The preview must show the banner regardless of schedule/audience, so force
  // a copy that renders while still reporting the real live state above it.
  const previewConfig = { ...draft, enabled: true, starts_at: null, ends_at: null };
  const wouldShow = isAnnouncementLive(draft, { isAuthenticated: true, tier: 'free' });

  return (
    <m.div variants={FADE_UP} className="space-y-4">
      {/* Preview first: the banner is a full-width object, so a full-width preview is the honest one. */}
      <div className={cn(PANEL, 'overflow-hidden')}>
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-2.5 dark:border-white/6">
          <p className={cn(MICRO, 'flex items-center gap-1.5 text-stone-500 dark:text-stone-400')}>
            <Megaphone className="h-3 w-3" />
            Live preview — top of every page
          </p>
          <span className={cn(PILL_BASE, pillTone(status.tone))}>{status.label}</span>
        </div>
        <div className="bg-[#f8f7fc] p-4 dark:bg-white/4">
          {draft.message.trim() || draft.title.trim() ? (
            <div className="overflow-hidden rounded-lg">
              <AnnouncementBanner
                key={`${draft.type}-${draft.title}-${draft.message}-${draft.link_url}-${draft.promo_code}`}
                announcement={previewConfig}
                preview
              />
            </div>
          ) : (
            <p className="py-6 text-center text-[11px] font-semibold text-stone-400 dark:text-stone-500">
              Write a headline or message to preview the banner
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard icon={Megaphone} title="Message" subtitle="Copy and severity">
          <ToggleRow
            label="Show banner"
            description={
              saved.enabled
                ? 'Enabled. Visibility still depends on the schedule and audience below.'
                : 'Currently hidden from every page.'
            }
            checked={draft.enabled}
            onCheckedChange={(enabled) => persist({ enabled })}
            disabled={saving}
          />

          <TextField
            id="banner-title"
            label="Headline"
            value={draft.title}
            onChange={(event) => set({ title: event.target.value })}
            placeholder="Optional bold line"
          />
          <TextAreaField
            id="banner-message"
            label="Message"
            rows={3}
            value={draft.message}
            onChange={(event) => set({ message: event.target.value })}
            placeholder="Keep it to one sentence — this sits above every page."
          />
          <OptionGroup
            label="Severity"
            options={SEVERITY_OPTIONS}
            value={draft.type}
            onChange={(type) => set({ type })}
            columns={4}
          />
          <ToggleRow
            label="Dismissible"
            description="Users can close it. The dismissal is keyed to this exact wording, so editing the copy brings it back."
            checked={draft.dismissible}
            onCheckedChange={(dismissible) => set({ dismissible })}
          />
        </PanelCard>

        <div className="space-y-4">
          <PanelCard icon={Ticket} title="Offer" subtitle="Promo code and call to action">
            <TextField
              id="banner-promo-code"
              label="Promo code"
              value={draft.promo_code}
              onChange={(event) => set({ promo_code: event.target.value })}
              placeholder="SAVE20"
              hint="Shown as a copy-to-clipboard chip next to the message. Leave blank to hide."
            />
            <TextField
              id="banner-link"
              label="Link URL"
              value={draft.link_url}
              onChange={(event) => set({ link_url: event.target.value })}
              placeholder="/pricing or https://…"
            />
            <TextField
              id="banner-link-label"
              label="Button label"
              value={draft.link_label}
              onChange={(event) => set({ link_label: event.target.value })}
              placeholder="Learn more"
              hint="Defaults to “Learn more” when a URL is set. Hidden on small screens."
            />
          </PanelCard>

          <PanelCard icon={Users} title="Audience" subtitle="Who sees the banner">
            <OptionGroup
              options={AUDIENCE_OPTIONS}
              value={draft.audience}
              onChange={(audience) => set({ audience })}
              columns={2}
            />
            <p className="text-[10px] font-medium leading-snug text-stone-400 dark:text-stone-500">
              {draft.audience === 'guests'
                ? 'Signed-out visitors only — useful for conversion messaging on public pages.'
                : draft.audience === 'all'
                  ? 'Everyone, signed in or not.'
                  : `Only ${AUDIENCE_LABEL[draft.audience].toLowerCase()}.`}
            </p>
          </PanelCard>

          <PanelCard icon={Clock} title="Schedule" subtitle="Optional window">
            <div className="grid gap-3 sm:grid-cols-2">
              <DateTimeField
                id="banner-start"
                label="Show from"
                value={draft.starts_at}
                onChange={(starts_at) => set({ starts_at })}
              />
              <DateTimeField
                id="banner-end"
                label="Hide after"
                value={draft.ends_at}
                min={draft.starts_at}
                onChange={(ends_at) => set({ ends_at })}
              />
            </div>
            <p className="text-[10px] font-medium leading-snug text-stone-400 dark:text-stone-500">
              Leave both blank to show the banner for as long as it is enabled.
            </p>
          </PanelCard>
        </div>
      </div>

      <AnimatePresence>
        {dirty && (
          <m.div variants={COLLAPSE} initial="hidden" animate="visible" exit="exit">
            <AdminButton
              onClick={() => persist()}
              loading={saving}
              className="h-10 w-full justify-center"
            >
              <Save className="h-3.5 w-3.5" />
              {draft.enabled && !wouldShow
                ? 'Save banner (currently outside its window or audience)'
                : 'Save banner'}
            </AdminButton>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
