import { useEffect, useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Clock, LifeBuoy, Save, ShieldCheck, Users, Wrench } from 'lucide-react';
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
import { DateTimeField, Field, PanelCard, TextAreaField, TextField, ToggleRow } from './fields';
import MaintenanceScreen from '@/components/shared/MaintenanceScreen';
import {
  isMaintenanceActive,
  isMaintenanceScheduled,
  normalizeMaintenance,
  relativeTime,
} from '@/lib/communications';

const statusOf = (config) => {
  if (!config.enabled)
    return { tone: 'ok', label: 'Site online', detail: 'All users have access.' };
  if (isMaintenanceScheduled(config))
    return {
      tone: 'warn',
      label: 'Scheduled',
      detail: `Maintenance begins ${relativeTime(config.starts_at)}.`,
    };
  if (isMaintenanceActive(config))
    return {
      tone: 'fault',
      label: 'Site offline',
      detail: 'Everyone except admins and allowlisted emails sees the maintenance page.',
    };
  return {
    tone: 'warn',
    label: 'Window closed',
    detail: 'Auto-resume passed the end time, so the site is serving normally again.',
  };
};

/**
 * Maintenance mode.
 *
 * The switch used to write a bare boolean that nothing outside the
 * authenticated app shell ever read. It is now a full configuration — copy,
 * window, bypass list — enforced site-wide by <MaintenanceGate>.
 */
export default function MaintenancePanel({ value, saving, onSave }) {
  const [draft, setDraft] = useState(() => normalizeMaintenance(value));

  useEffect(() => {
    setDraft(normalizeMaintenance(value));
  }, [value]);

  const [allowlistText, setAllowlistText] = useState(() =>
    normalizeMaintenance(value).allowed_emails.join('\n')
  );
  useEffect(() => {
    setAllowlistText(normalizeMaintenance(value).allowed_emails.join('\n'));
  }, [value]);

  const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const saved = useMemo(() => normalizeMaintenance(value), [value]);
  const status = statusOf(saved);

  const dirty = useMemo(
    () =>
      JSON.stringify(normalizeMaintenance({ ...draft, allowed_emails: allowlistText })) !==
      JSON.stringify(saved),
    [draft, allowlistText, saved]
  );

  const persist = (override) => {
    const next = normalizeMaintenance({
      ...draft,
      ...override,
      allowed_emails: allowlistText,
    });
    if (next.starts_at && next.ends_at && new Date(next.ends_at) <= new Date(next.starts_at)) {
      toast.error('The maintenance window must end after it starts');
      return;
    }
    setDraft(next);
    onSave('maintenance_mode', next);
  };

  return (
    <m.div variants={FADE_UP} className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        {/* Status + master switch */}
        <div className={cn(PANEL, 'p-4')}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(PILL_BASE, pillTone(status.tone))}>{status.label}</span>
                {saved.enabled && saved.allow_admins && (
                  <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500')}>
                    Admins exempt
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] font-medium leading-snug text-stone-500 dark:text-stone-400">
                {status.detail}
              </p>
            </div>
            <AdminButton
              variant={draft.enabled ? 'destructive' : 'primary'}
              onClick={() => persist({ enabled: !draft.enabled })}
              loading={saving}
              className="shrink-0"
            >
              <Wrench className="h-3 w-3" />
              {draft.enabled ? 'Bring site back online' : 'Take site offline'}
            </AdminButton>
          </div>
        </div>

        <PanelCard
          icon={Wrench}
          title="Maintenance page"
          subtitle="What signed-out and non-admin users see"
        >
          <TextField
            id="maintenance-title"
            label="Headline"
            value={draft.title}
            onChange={(event) => set({ title: event.target.value })}
            placeholder="We'll be right back"
          />
          <TextAreaField
            id="maintenance-message"
            label="Message"
            rows={4}
            value={draft.message}
            onChange={(event) => set({ message: event.target.value })}
            placeholder="Explain what is happening and reassure people their data is safe."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              id="maintenance-contact"
              label="Support email"
              type="email"
              value={draft.contact_email}
              onChange={(event) => set({ contact_email: event.target.value })}
              placeholder="support@ieltsai.pro"
              hint="Shown as a mailto link. Leave blank to hide."
            />
            <TextField
              id="maintenance-status-url"
              label="Status page URL"
              value={draft.status_url}
              onChange={(event) => set({ status_url: event.target.value })}
              placeholder="https://status.ieltsai.pro"
              hint="Optional link to live incident updates."
            />
          </div>
        </PanelCard>

        <PanelCard icon={Clock} title="Window" subtitle="Optional start and end times">
          <div className="grid gap-3 sm:grid-cols-2">
            <DateTimeField
              id="maintenance-start"
              label="Starts"
              value={draft.starts_at}
              onChange={(starts_at) => set({ starts_at })}
              hint="Queue a window ahead of time. Blank means immediately."
            />
            <DateTimeField
              id="maintenance-end"
              label="Expected end"
              value={draft.ends_at}
              min={draft.starts_at}
              onChange={(ends_at) => set({ ends_at })}
              hint="Drives the countdown on the maintenance page."
            />
          </div>
          <ToggleRow
            label="Auto-resume at the end time"
            description="Off by default: an ETA is a guess, and a site that un-breaks itself on a guess is worse than one that waits for a human."
            checked={draft.auto_resume}
            onCheckedChange={(auto_resume) => set({ auto_resume })}
            disabled={!draft.ends_at}
          />
        </PanelCard>

        <PanelCard icon={ShieldCheck} title="Who can still get in" subtitle="Bypass rules">
          <ToggleRow
            label="Admins bypass maintenance"
            description="Keeps the admin panel reachable while the site is down."
            checked={draft.allow_admins}
            onCheckedChange={(allow_admins) => set({ allow_admins })}
          />
          <Field
            label="Allowlisted emails"
            hint="One per line or comma separated. Useful for contractors and the support rota without granting admin rights."
            htmlFor="maintenance-allowlist"
          >
            <textarea
              id="maintenance-allowlist"
              value={allowlistText}
              onChange={(event) => setAllowlistText(event.target.value)}
              rows={3}
              placeholder={'ops@ieltsai.pro\nqa@partner.com'}
              className="w-full resize-none rounded-md border border-stone-300 bg-white p-2.5 font-mono text-xs font-medium dark:border-white/15 dark:bg-[#131315]"
            />
          </Field>
          <p className="flex items-start gap-1.5 rounded-md bg-stone-50 p-2.5 text-[10px] font-medium leading-snug text-stone-500 dark:bg-white/[0.03] dark:text-stone-400">
            <LifeBuoy className="mt-px h-3 w-3 shrink-0" />
            <span>
              <strong className="font-bold">/admin</strong> and{' '}
              <strong className="font-bold">/admin-login</strong> stay reachable no matter what, so
              turning this on from another device can never lock you out.
            </span>
          </p>
        </PanelCard>

        <AnimatePresence>
          {dirty && (
            <m.div variants={COLLAPSE} initial="hidden" animate="visible" exit="exit">
              <AdminButton
                onClick={() => persist()}
                loading={saving}
                className="h-10 w-full justify-center"
              >
                <Save className="h-3.5 w-3.5" />
                Save maintenance settings
              </AdminButton>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live preview */}
      <div className="lg:col-span-5">
        <div className={cn(PANEL, 'sticky top-4 p-4')}>
          <p
            className={cn(
              MICRO,
              'mb-3 flex items-center gap-1.5 text-stone-500 dark:text-stone-400'
            )}
          >
            <Users className="h-3 w-3" />
            Live preview — what users see
          </p>
          <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-white/[0.07]">
            <div className="origin-top scale-[0.82] [&>div]:min-h-0 [&>div]:py-6">
              <MaintenanceScreen config={draft} />
            </div>
          </div>
          <p className="mt-3 text-[10px] font-medium leading-snug text-stone-400 dark:text-stone-500">
            Rendered with the same component the maintenance page uses, so the preview cannot drift
            from production.
          </p>
        </div>
      </div>
    </m.div>
  );
}
