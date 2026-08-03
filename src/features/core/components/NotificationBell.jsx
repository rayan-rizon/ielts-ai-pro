import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  Megaphone,
  X,
} from 'lucide-react';
import { Notification } from '@/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import { relativeTime } from '@/lib/communications';
import { cn } from '@/lib/cn';

const TYPE_TONE = {
  info: { icon: Info, chip: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  success: { icon: CheckCircle2, chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  warning: { icon: AlertTriangle, chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  announcement: {
    icon: Megaphone,
    chip: 'bg-[#5a63df]/10 text-[#5a63df] dark:text-[#afb5ff]',
  },
};

const REFRESH_MS = 180_000;

/**
 * The panel deliberately does not anchor to the bell's own position.
 *
 * The trigger lives at the bottom of the left sidebar, so a normal
 * anchor-following popover (Radix's default) opened low and to the left —
 * exactly the corner it should not use. This renders through a portal as a
 * fixed panel pinned to the bottom-right of the viewport instead, the corner
 * users expect a notification panel to live in regardless of where the bell
 * icon itself sits.
 */
const NotificationPanel = ({ onClose, children }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    // Capture phase so this still closes the panel when the click lands on
    // the bell trigger itself (which toggles `open` separately).
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-5 right-5 z-[200] w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-xl border border-[#e4e2f0] bg-white shadow-xl dark:border-white/[0.10] dark:bg-[#131315]"
      >
        {children}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

/**
 * Learner-facing delivery for admin broadcasts.
 *
 * Broadcasts written in the admin panel previously went into the database and
 * were never rendered anywhere — nothing in the app read them. This is the
 * surface that makes a "send" actually reach someone.
 *
 * Renders as a compact icon-only button (paired with the sidebar's own
 * collapse toggle) rather than a full labeled menu row — it's a live status
 * affordance, not a navigation destination, so it shouldn't read as one.
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const authUserId = user?.auth_id || user?.id || null;
  const tier = user?.subscription_tier || 'free';

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!authUserId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const data = await Notification.listForUser(authUserId, tier);
      setItems(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [authUserId, tier]);

  useEffect(() => {
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const unread = useMemo(() => items.filter((item) => item.is_unread), [items]);

  const markRead = async (notification) => {
    if (!authUserId || !notification.is_unread) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === notification.id
          ? { ...item, is_unread: false, read_at: new Date().toISOString() }
          : item
      )
    );
    try {
      await Notification.markRead(notification.id, authUserId);
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const markAllRead = async () => {
    if (!authUserId || !unread.length) return;
    const ids = unread.map((item) => item.id);
    setItems((prev) => prev.map((item) => ({ ...item, is_unread: false })));
    try {
      await Notification.markAllRead(ids, authUserId);
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  const dismiss = async (notification) => {
    if (!authUserId) return;
    setItems((prev) => prev.filter((item) => item.id !== notification.id));
    try {
      await Notification.dismiss(notification.id, authUserId);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  if (!authUserId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={unread.length ? `Notifications, ${unread.length} unread` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
        className={cn(
          'relative grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors duration-200',
          'hover:bg-[#5a63df]/[0.08] hover:text-[#4a52c9] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100',
          open && 'bg-[#5a63df]/[0.08] text-[#4a52c9] dark:bg-white/[0.08] dark:text-slate-100'
        )}
      >
        <Bell className="h-4 w-4" strokeWidth={2} />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#5a63df] px-1 font-mono text-[8px] font-bold tabular-nums text-white">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel onClose={() => setOpen(false)}>
          <div className="flex items-center justify-between border-b border-[#ebeaf7] px-3.5 py-2.5 dark:border-white/[0.07]">
            <p className="text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Notifications
            </p>
            <div className="flex items-center gap-3">
              {unread.length > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 transition-colors hover:text-[#5a63df] dark:text-slate-400 dark:hover:text-[#afb5ff]"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[12px] font-semibold">Loading…</span>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-[13px] font-bold text-slate-700 dark:text-slate-200">
                  You're all caught up
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Updates from the IELTS AI Pro team land here.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const tone = TYPE_TONE[item.type] || TYPE_TONE.info;
                  const Icon = tone.icon;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      exit={{ opacity: 0, height: 0 }}
                      onMouseEnter={() => markRead(item)}
                      className={cn(
                        'group relative flex gap-2.5 border-b border-[#f2f1fa] px-3.5 py-3 last:border-b-0 dark:border-white/[0.05]',
                        item.is_unread && 'bg-[#5a63df]/[0.035] dark:bg-[#5a63df]/[0.07]'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                          tone.chip
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12.5px] font-extrabold leading-snug text-slate-800 dark:text-slate-100">
                            {item.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => dismiss(item)}
                            aria-label={`Dismiss ${item.title}`}
                            className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:text-slate-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-0.5 whitespace-pre-line break-words text-[11.5px] font-medium leading-snug text-slate-600 dark:text-slate-300">
                          {item.message}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                            {relativeTime(item.created_at)}
                          </span>
                          {item.link_url && (
                            <a
                              href={item.link_url}
                              target={item.link_url.startsWith('http') ? '_blank' : undefined}
                              rel="noopener noreferrer"
                              onClick={() => markRead(item)}
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#5a63df] hover:underline dark:text-[#afb5ff]"
                            >
                              {item.link_label || 'Open'}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </NotificationPanel>
      )}
    </>
  );
}
