import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bell,
  Send,
  Trash2,
  Loader2,
  Info,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import { Notification } from '@/entities';
import { toast } from 'sonner';
import RefinedDeleteModal from '../shared/RefinedDeleteModal';
import { cn } from '@/lib/cn';
import {
  AdminPageHeader,
  AdminButton,
  PANEL,
  MICRO,
  PILL_BASE,
  STAGGER_CONTAINER,
  FADE_UP,
} from '../ui/primitives';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';
const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');

const TYPE_META = {
  info: {
    label: 'Info',
    icon: Info,
    cls: 'text-blue-600 dark:text-blue-400 border-blue-300/50 dark:border-blue-800/60 bg-blue-500/[0.06]',
  },
  success: {
    label: 'Success',
    icon: CheckCircle2,
    cls: 'text-emerald-600 dark:text-emerald-400 border-emerald-300/50 dark:border-emerald-800/60 bg-emerald-500/[0.06]',
  },
  warning: {
    label: 'Alert',
    icon: AlertCircle,
    cls: 'text-amber-600 dark:text-amber-400 border-amber-300/50 dark:border-amber-800/60 bg-amber-500/[0.06]',
  },
  announcement: {
    label: 'Announce',
    icon: Megaphone,
    cls: 'text-violet-600 dark:text-violet-400 border-violet-300/50 dark:border-violet-800/60 bg-violet-500/[0.06]',
  },
};

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    target_audience: 'all',
    expires_in_days: 7,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await Notification.listAll();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = async () => {
    if (!form.title || !form.message) {
      toast.error('Please fill in title and message');
      return;
    }
    try {
      setSending(true);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(form.expires_in_days));
      await Notification.create({
        title: form.title,
        message: form.message,
        type: form.type,
        target_audience: form.target_audience,
        expires_at: expiresAt.toISOString(),
      });
      toast.success('Notification broadcasted successfully!');
      setForm({ title: '', message: '', type: 'info', target_audience: 'all', expires_in_days: 7 });
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await Notification.delete(deletingId);
      toast.success('Notification removed');
      fetchNotifications();
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-6 pt-12 md:pt-0"
    >
      <RefinedDeleteModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Recall Notification"
        description="This will instantly remove the message from all target user dashboards."
        confirmText="CONFIRM RECALL"
      />

      {/* Header */}
      <motion.div variants={FADE_UP}>
        <AdminPageHeader
          title="Notifications"
          description="Broadcast real-time communications to your user community"
          tip="Notifications land in every targeted user's dashboard immediately and disappear on their own once expired — recalling one removes it early from everyone it reached."
        >
          <AdminButton variant="outline" onClick={fetchNotifications}>
            <RefreshCcw className={cn('w-3 h-3', loading && 'animate-spin')} />
            Refresh
          </AdminButton>
        </AdminPageHeader>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Compose Panel */}
        <motion.div variants={FADE_UP} className="lg:col-span-4">
          <div className={cn(PANEL, 'p-4 space-y-4')}>
            <div>
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Compose broadcast</p>
            </div>

            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className={FIELD_LABEL}>Title</label>
                <div className="relative">
                  <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Notification title…"
                    className={cn(FIELD_INPUT, 'pl-8 w-full')}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className={FIELD_LABEL}>Message</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Enter your message…"
                  rows={4}
                  className="rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium resize-none p-2.5"
                />
              </div>

              {/* Type + Audience */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={FIELD_LABEL}>Type</label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className={cn(FIELD_INPUT, 'w-full')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">System Alert</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={FIELD_LABEL}>Audience</label>
                  <Select
                    value={form.target_audience}
                    onValueChange={(v) => setForm({ ...form, target_audience: v })}
                  >
                    <SelectTrigger className={cn(FIELD_INPUT, 'w-full')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="free">Free Tier</SelectItem>
                      <SelectItem value="pro">Pro Users</SelectItem>
                      <SelectItem value="premium">Premium Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Expires */}
              <div>
                <label className={FIELD_LABEL}>Expires in (days)</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <Input
                    type="number"
                    min="1"
                    value={form.expires_in_days}
                    onChange={(e) => setForm({ ...form, expires_in_days: e.target.value })}
                    className={cn(FIELD_INPUT, 'pl-8 w-full')}
                  />
                </div>
              </div>

              <AdminButton
                className="w-full justify-center"
                onClick={handleSend}
                loading={sending}
                disabled={sending}
              >
                <Send className="w-3 h-3" />
                Send Notification
              </AdminButton>
            </div>
          </div>
        </motion.div>

        {/* History Table */}
        <motion.div variants={FADE_UP} className="lg:col-span-8">
          <div className={cn(PANEL, 'overflow-hidden')}>
            {/* Mobile list */}
            <div className="md:hidden divide-y divide-stone-100 dark:divide-white/[0.05]">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-500 dark:text-stone-400 mb-2" />
                  <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Loading…</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Bell className="w-7 h-7 mx-auto text-stone-300" />
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                    No notifications yet
                  </p>
                  <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                    Create your first broadcast above
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const meta = TYPE_META[notif.type] || TYPE_META.info;
                  const Icon = meta.icon;
                  const expired = new Date(notif.expires_at) < new Date();
                  return (
                    <div key={notif.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={cn('p-1.5 rounded-lg border shrink-0', meta.cls)}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate">
                              {notif.title}
                            </p>
                            <p
                              className={cn(
                                MICRO,
                                'text-stone-500 dark:text-stone-400 font-mono normal-case tracking-normal'
                              )}
                            >
                              {notif.id.substring(0, 8)}…
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            PILL_BASE,
                            meta.cls,
                            'shrink-0 transition-transform duration-150 hover:scale-105'
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                          {notif.target_audience} ·{' '}
                          {new Date(notif.expires_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {expired && <span className="ml-1 text-rose-500"> EXPIRED</span>}
                        </span>
                        <AdminButton
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingId(notif.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Recall
                        </AdminButton>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-stone-200/80 dark:border-white/[0.07] hover:bg-transparent">
                    <TableHead className="py-3 px-4 w-[280px]">
                      <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                        Notification
                      </span>
                    </TableHead>
                    <TableHead className="py-3 px-4">
                      <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Type</span>
                    </TableHead>
                    <TableHead className="py-3 px-4">
                      <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                        Audience
                      </span>
                    </TableHead>
                    <TableHead className="py-3 px-4">
                      <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                        Expires
                      </span>
                    </TableHead>
                    <TableHead className="py-3 px-4 text-right">
                      <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                        Actions
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow
                          key={`skel-${i}`}
                          className="border-b border-stone-100 dark:border-white/[0.04]"
                        >
                          <TableCell colSpan={5} className="py-3 px-4">
                            <div className="h-5 w-full bg-stone-100 dark:bg-white/[0.04] animate-pulse rounded-md" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Bell className="w-7 h-7 text-stone-300" />
                            <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                              No notifications yet
                            </p>
                            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                              Create your first broadcast using the form
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notif) => {
                        const meta = TYPE_META[notif.type] || TYPE_META.info;
                        const Icon = meta.icon;
                        const expired = new Date(notif.expires_at) < new Date();
                        return (
                          <motion.tr
                            layout
                            key={notif.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="group border-b border-stone-100 dark:border-white/[0.04] hover:bg-stone-50/60 dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className={cn('p-1.5 rounded-lg border shrink-0', meta.cls)}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-stone-800 dark:text-stone-100 line-clamp-1">
                                    {notif.title}
                                  </p>
                                  <p
                                    className={cn(
                                      MICRO,
                                      'text-stone-500 dark:text-stone-400 font-mono normal-case tracking-normal'
                                    )}
                                  >
                                    {notif.id.substring(0, 8)}…
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span
                                className={cn(
                                  PILL_BASE,
                                  meta.cls,
                                  'transition-transform duration-150 hover:scale-105'
                                )}
                              >
                                {meta.label}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                                <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 capitalize">
                                  {notif.target_audience}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                                <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                                  {new Date(notif.expires_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                                {expired && (
                                  <span className={cn(MICRO, 'text-[rgb(var(--signal-fault))]')}>
                                    EXPIRED
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <AdminButton
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeletingId(notif.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                                Recall
                              </AdminButton>
                            </TableCell>
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotificationCenter;
