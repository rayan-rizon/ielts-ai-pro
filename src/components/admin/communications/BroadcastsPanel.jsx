import { useCallback, useEffect, useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Eye,
  Info,
  Link2,
  Loader2,
  Megaphone,
  Pause,
  Play,
  RefreshCcw,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Notification } from '@/entities';
import RefinedDeleteModal from '@/components/admin/shared/RefinedDeleteModal';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  FADE_UP,
  Kpi,
  MICRO,
  PANEL,
  PILL_BASE,
  pillTone,
} from '@/components/admin/ui/primitives';
import { DateTimeField, OptionGroup, PanelCard, TextAreaField, TextField } from './fields';
import {
  NOTIFICATION_AUDIENCES,
  AUDIENCE_LABEL,
  notificationState,
  relativeTime,
} from '@/lib/communications';
import {
  PANEL as USER_PANEL,
  IconChip,
  Pill as UserPill,
  TITLE as USER_TITLE,
  MUTED as USER_MUTED,
} from '@/features/dashboard/components/primitives';

const TYPE_META = {
  info: { label: 'Info', icon: Info, tone: 'sky', hint: 'Neutral, FYI' },
  success: { label: 'Success', icon: CheckCircle2, tone: 'emerald', hint: 'Positive update' },
  warning: { label: 'Alert', icon: AlertTriangle, tone: 'amber', hint: 'Needs attention' },
  announcement: { label: 'Announce', icon: Megaphone, tone: 'accent', hint: 'Product-wide news' },
};

const TYPE_OPTIONS = Object.entries(TYPE_META).map(([id, meta]) => ({ id, label: meta.label }));
const AUDIENCE_OPTIONS = NOTIFICATION_AUDIENCES.map((id) => ({ id, label: AUDIENCE_LABEL[id] }));
const PRIORITY_OPTIONS = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
];

const STATE_TONE = { live: 'ok', scheduled: 'accent', expired: 'neutral', paused: 'warn' };

const EMPTY_FORM = {
  title: '',
  message: '',
  type: 'info',
  target_audience: 'all',
  priority: 'normal',
  link_url: '',
  link_label: '',
  starts_at: null,
  expires_in_days: 7,
};

/**
 * Renders the broadcast exactly as the learner notification panel will, using
 * that panel's own primitives — the preview is only worth having if it cannot
 * drift from the real thing.
 */
const LearnerPreview = ({ form }) => {
  const meta = TYPE_META[form.type] || TYPE_META.info;
  const Icon = meta.icon;
  const title = form.title.trim() || 'Your notification title';
  const message = form.message.trim() || 'Your message will appear here as you type…';
  const isEmpty = !form.title.trim() && !form.message.trim();

  return (
    <div className="rounded-lg bg-[#f8f7fc] p-4 dark:bg-white/[0.04]">
      <div
        className={cn(
          USER_PANEL,
          'flex items-start gap-3 p-3.5 shadow-sm transition-opacity duration-200',
          isEmpty && 'opacity-60'
        )}
      >
        <IconChip icon={Icon} tone={meta.tone} size="md" />
        <div className="min-w-0 flex-1">
          <p className={cn(USER_TITLE, 'break-words')}>{title}</p>
          <p className="mt-1 break-words text-[12px] leading-snug text-slate-600 dark:text-slate-300">
            {message}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <UserPill tone={meta.tone}>{meta.label}</UserPill>
            <span className={cn(MICRO, USER_MUTED)}>
              {form.starts_at ? relativeTime(form.starts_at) : 'Just now'}
            </span>
            {form.link_url && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#5a63df] dark:text-[#afb5ff]">
                <Link2 className="h-2.5 w-2.5" />
                {form.link_label || 'Open'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryRow = ({ notification, readCount, onToggleActive, onDelete }) => {
  const meta = TYPE_META[notification.type] || TYPE_META.info;
  const Icon = meta.icon;
  const state = notificationState(notification);

  return (
    <m.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="group border-b border-stone-100 transition-colors hover:bg-stone-50/60 dark:border-white/[0.04] dark:hover:bg-white/[0.02]"
    >
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 rounded-lg border border-stone-200 p-1.5 text-stone-500 dark:border-white/10 dark:text-stone-300">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 text-xs font-bold text-stone-800 dark:text-stone-100">
              {notification.title}
            </p>
            <p className="line-clamp-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
              {notification.message}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className={cn(PILL_BASE, pillTone(STATE_TONE[state]))}>{state}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-stone-500 dark:text-stone-400" />
          <span className="text-xs font-semibold capitalize text-stone-700 dark:text-stone-200">
            {notification.target_audience}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3 w-3 text-stone-500 dark:text-stone-400" />
          <span className="font-mono text-xs font-bold tabular-nums text-stone-700 dark:text-stone-200">
            {readCount}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
          {notification.expires_at
            ? `${new Date(notification.expires_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })} · ${relativeTime(notification.expires_at)}`
            : 'Never'}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(notification)}
            title={notification.is_active === false ? 'Resume' : 'Pause'}
          >
            {notification.is_active === false ? (
              <Play className="h-3 w-3" />
            ) : (
              <Pause className="h-3 w-3" />
            )}
          </AdminButton>
          <AdminButton variant="destructive" size="sm" onClick={() => onDelete(notification.id)}>
            <Trash2 className="h-3 w-3" />
            Recall
          </AdminButton>
        </div>
      </TableCell>
    </m.tr>
  );
};

/**
 * One-off broadcasts delivered to the learner notification panel.
 *
 * Sends used to write a row that nothing in the app ever read; delivery,
 * per-user read state, scheduling and pausing all arrived with the unified
 * Communications module.
 */
export default function BroadcastsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [readCounts, setReadCounts] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [rows, counts] = await Promise.all([
        Notification.listAll(),
        Notification.readCounts().catch(() => new Map()),
      ]);
      setNotifications(rows || []);
      setReadCounts(counts);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Could not load broadcasts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const stats = useMemo(() => {
    const counts = { live: 0, scheduled: 0, paused: 0, expired: 0 };
    notifications.forEach((notification) => {
      counts[notificationState(notification)] += 1;
    });
    const reads = Array.from(readCounts.values()).reduce((sum, value) => sum + value, 0);
    return { ...counts, reads };
  }, [notifications, readCounts]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Add a title and a message');
      return;
    }
    const days = Number(form.expires_in_days);
    if (!Number.isFinite(days) || days < 1) {
      toast.error('Expiry must be at least one day');
      return;
    }

    try {
      setSending(true);
      const startsAt = form.starts_at ? new Date(form.starts_at) : new Date();
      const expiresAt = new Date(startsAt.getTime() + days * 86_400_000);

      await Notification.create({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        target_audience: form.target_audience,
        priority: form.priority,
        link_url: form.link_url.trim() || null,
        link_label: form.link_label.trim() || null,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

      toast.success(form.starts_at ? 'Broadcast scheduled' : 'Broadcast sent');
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  const handleToggleActive = async (notification) => {
    const next = notification.is_active === false;
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, is_active: next } : item))
    );
    try {
      await Notification.setActive(notification.id, next);
      toast.success(next ? 'Broadcast resumed' : 'Broadcast paused');
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Could not update broadcast');
      fetchAll();
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await Notification.delete(deletingId);
      toast.success('Broadcast recalled');
      setDeletingId(null);
      fetchAll();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to recall broadcast');
    }
  };

  return (
    <m.div variants={FADE_UP} className="space-y-4">
      <RefinedDeleteModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Recall broadcast"
        description="This removes the message from every learner's notification panel immediately."
        confirmText="CONFIRM RECALL"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Live" value={stats.live} sub="Visible right now" />
        <Kpi label="Scheduled" value={stats.scheduled} sub="Queued to appear" />
        <Kpi label="Paused" value={stats.paused} sub="Hidden, not deleted" />
        <Kpi
          label="Opens"
          value={stats.reads}
          sub="Learners who read a broadcast"
          tip="Counted from per-user read receipts, not sends."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <PanelCard icon={Send} title="Compose broadcast" subtitle="Delivered to the bell panel">
            <TextField
              id="broadcast-title"
              label="Title"
              value={form.title}
              onChange={(event) => set({ title: event.target.value })}
              placeholder="Notification title…"
            />
            <TextAreaField
              id="broadcast-message"
              label="Message"
              rows={4}
              value={form.message}
              onChange={(event) => set({ message: event.target.value })}
              placeholder="Enter your message…"
            />
            <OptionGroup
              label="Type"
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={(type) => set({ type })}
              columns={4}
              hint={TYPE_META[form.type]?.hint}
            />
            <OptionGroup
              label="Audience"
              options={AUDIENCE_OPTIONS}
              value={form.target_audience}
              onChange={(target_audience) => set({ target_audience })}
              columns={4}
            />
            <OptionGroup
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(priority) => set({ priority })}
              columns={3}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                id="broadcast-link"
                label="Link URL"
                value={form.link_url}
                onChange={(event) => set({ link_url: event.target.value })}
                placeholder="/pricing (optional)"
              />
              <TextField
                id="broadcast-link-label"
                label="Link label"
                value={form.link_label}
                onChange={(event) => set({ link_label: event.target.value })}
                placeholder="Open"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DateTimeField
                id="broadcast-start"
                label="Send at"
                value={form.starts_at}
                onChange={(starts_at) => set({ starts_at })}
                hint="Blank sends immediately."
              />
              <TextField
                id="broadcast-expiry"
                label="Visible for (days)"
                type="number"
                min="1"
                value={form.expires_in_days}
                onChange={(event) => set({ expires_in_days: event.target.value })}
              />
            </div>

            <AdminButton
              className="h-10 w-full justify-center"
              onClick={handleSend}
              loading={sending}
              disabled={sending}
            >
              <Send className="h-3.5 w-3.5" />
              {form.starts_at ? 'Schedule broadcast' : 'Send broadcast'}
            </AdminButton>
          </PanelCard>
        </div>

        <div className="lg:col-span-7">
          <div className={cn(PANEL, 'sticky top-4 p-4')}>
            <p
              className={cn(
                MICRO,
                'mb-3 flex items-center gap-1.5 text-stone-500 dark:text-stone-400'
              )}
            >
              <Bell className="h-3 w-3" />
              Live preview — learner notification panel
            </p>
            <LearnerPreview form={form} />

            <div className="mt-5 border-t border-stone-200/80 pt-4 dark:border-white/[0.07]">
              <p className={cn(MICRO, 'mb-2.5 text-stone-500 dark:text-stone-400')}>Type guide</p>
              <div className="space-y-1.5">
                {Object.entries(TYPE_META).map(([key, meta]) => {
                  const active = form.type === key;
                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors',
                        active
                          ? 'bg-stone-100 dark:bg-white/[0.05]'
                          : 'hover:bg-stone-50 dark:hover:bg-white/[0.02]'
                      )}
                    >
                      <IconChip icon={meta.icon} tone={meta.tone} size="sm" />
                      <span
                        className={cn(
                          'text-xs font-bold',
                          active
                            ? 'text-stone-900 dark:text-stone-50'
                            : 'text-stone-500 dark:text-stone-400'
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className={cn(MICRO, 'ml-auto text-stone-400 dark:text-stone-500')}>
                        {meta.hint}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 text-[10px] font-medium leading-snug text-stone-400 dark:text-stone-500">
              Goes to {(AUDIENCE_LABEL[form.target_audience] || 'Everyone').toLowerCase()},
              {form.starts_at ? ` starting ${relativeTime(form.starts_at)},` : ' immediately,'} and
              stays visible for {form.expires_in_days || 0} day
              {String(form.expires_in_days) === '1' ? '' : 's'}.
            </p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className={cn(PANEL, 'overflow-hidden')}>
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-2.5 dark:border-white/[0.06]">
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Broadcast history · {notifications.length}
          </p>
          <AdminButton variant="ghost" size="sm" onClick={fetchAll}>
            <RefreshCcw className={cn('h-3 w-3', loading && 'animate-spin')} />
            Refresh
          </AdminButton>
        </div>

        {/* Mobile list */}
        <div className="divide-y divide-stone-100 dark:divide-white/[0.05] md:hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-stone-500 dark:text-stone-400" />
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Loading…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="space-y-2 p-8 text-center">
              <Bell className="mx-auto h-7 w-7 text-stone-300" />
              <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                No broadcasts yet
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const state = notificationState(notification);
              return (
                <div key={notification.id} className="space-y-2.5 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-stone-800 dark:text-stone-100">
                        {notification.title}
                      </p>
                      <p className="line-clamp-2 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        {notification.message}
                      </p>
                    </div>
                    <span className={cn(PILL_BASE, pillTone(STATE_TONE[state]), 'shrink-0')}>
                      {state}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                      {notification.target_audience} · {readCounts.get(notification.id) || 0} opens
                    </span>
                    <div className="flex gap-1.5">
                      <AdminButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(notification)}
                      >
                        {notification.is_active === false ? (
                          <Play className="h-3 w-3" />
                        ) : (
                          <Pause className="h-3 w-3" />
                        )}
                      </AdminButton>
                      <AdminButton
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingId(notification.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </AdminButton>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-stone-200/80 hover:bg-transparent dark:border-white/[0.07]">
                {['Broadcast', 'State', 'Audience', 'Opens', 'Expires', 'Actions'].map(
                  (heading, index) => (
                    <TableHead
                      key={heading}
                      className={cn('px-4 py-3', index === 5 && 'text-right')}
                    >
                      <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                        {heading}
                      </span>
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  [...Array(4)].map((_, index) => (
                    <TableRow
                      key={`skeleton-${index}`}
                      className="border-b border-stone-100 dark:border-white/[0.04]"
                    >
                      <TableCell colSpan={6} className="px-4 py-3">
                        <div className="h-5 w-full animate-pulse rounded-md bg-stone-100 dark:bg-white/[0.04]" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-7 w-7 text-stone-300" />
                        <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                          No broadcasts yet
                        </p>
                        <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                          Compose one using the form above
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification) => (
                    <HistoryRow
                      key={notification.id}
                      notification={notification}
                      readCount={readCounts.get(notification.id) || 0}
                      onToggleActive={handleToggleActive}
                      onDelete={setDeletingId}
                    />
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>
    </m.div>
  );
}
