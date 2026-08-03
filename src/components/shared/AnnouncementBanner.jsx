import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { announcementSignature, normalizeAnnouncement } from '@/lib/communications';
import { IconChip } from '@/features/dashboard/components/primitives';

const DISMISS_STORAGE_KEY = 'dismissed_announcements';
const COPY_RESET_MS = 1600;

/**
 * Every tone is fully color-coordinated (surface + title + body + icon +
 * accent). `success`/`warning`/`critical` use the tinted-card convention most
 * alert components use (bg-{tone}-50 / text-{tone}-800 / text-{tone}-700).
 *
 * `info` — the default, general-announcement tone — is deliberately a solid,
 * high-contrast fill instead of a soft tint: a pastel card is easy to miss at
 * the top of the page, and it explicitly must not read as indigo/purple (that
 * hue is reserved for the brand accent elsewhere in the app, e.g. the
 * sidebar's "Upgrade to Pro" card), so it uses a true blue instead. `solid:
 * true` tells the component below to render white-on-color chip/dismiss
 * styling rather than the tinted-card treatment the other tones use.
 */
const TONE = {
  info: {
    chip: 'accent',
    icon: Info,
    solid: true,
    surface: 'border-blue-800 bg-blue-600 dark:border-blue-800 dark:bg-blue-600',
    title: 'text-white',
    body: 'text-white/90',
    accent:
      'text-white border-white/30 bg-white/15 hover:bg-white/25 dark:text-white dark:border-white/30 dark:bg-white/15 dark:hover:bg-white/25',
    dismiss:
      'border-white/25 text-white/75 hover:border-white/40 hover:bg-white/15 hover:text-white dark:border-white/25 dark:text-white/75 dark:hover:border-white/40 dark:hover:bg-white/15 dark:hover:text-white',
  },
  success: {
    chip: 'emerald',
    icon: CheckCircle2,
    surface:
      'border-emerald-100 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-500/[0.08]',
    title: 'text-emerald-900 dark:text-emerald-100',
    body: 'text-emerald-700 dark:text-emerald-300/90',
    accent:
      'text-emerald-600 border-emerald-300/50 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] dark:text-emerald-400 dark:border-emerald-800/60 dark:bg-emerald-400/[0.14] dark:hover:bg-emerald-400/[0.2]',
  },
  warning: {
    chip: 'amber',
    icon: AlertTriangle,
    surface: 'border-amber-100 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-500/[0.08]',
    title: 'text-amber-900 dark:text-amber-100',
    body: 'text-amber-700 dark:text-amber-300/90',
    accent:
      'text-amber-600 border-amber-300/50 bg-amber-500/[0.08] hover:bg-amber-500/[0.14] dark:text-amber-400 dark:border-amber-800/60 dark:bg-amber-400/[0.14] dark:hover:bg-amber-400/[0.2]',
  },
  critical: {
    chip: 'rose',
    icon: AlertOctagon,
    surface: 'border-rose-100 bg-rose-50 dark:border-rose-800/30 dark:bg-rose-500/[0.08]',
    title: 'text-rose-900 dark:text-rose-100',
    body: 'text-rose-700 dark:text-rose-300/90',
    accent:
      'text-rose-600 border-rose-300/50 bg-rose-500/[0.08] hover:bg-rose-500/[0.14] dark:text-rose-400 dark:border-rose-800/60 dark:bg-rose-400/[0.14] dark:hover:bg-rose-400/[0.2]',
  },
};

const DEFAULT_DISMISS =
  'border-black/10 text-slate-500/80 hover:border-black/20 hover:bg-black/5 hover:text-slate-700 dark:border-white/10 dark:text-slate-400/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-slate-200';

const readDismissed = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(DISMISS_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
};

/**
 * Promo code chip. Its own component so the "copied" state resets on a timer
 * without re-running that timer every time the parent banner re-renders.
 */
const PromoCodeChip = ({ code, tone }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const id = window.setTimeout(() => setCopied(false), COPY_RESET_MS);
    return () => window.clearTimeout(id);
  }, [copied]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) setCopied(true);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider transition-colors',
        tone
      )}
      title="Copy promo code"
    >
      {code}
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

/**
 * Site-wide announcement banner.
 *
 * A single truncated line — icon, title + message run together, then an
 * optional promo code and CTA — instead of a stacked title/message block.
 * The stacked version could grow to three lines on longer copy; a top-of-app
 * strip should never compete with the page for vertical space, so length is
 * bounded by an ellipsis rather than by wrapping. The centered group's own
 * max-width is generous (max-w-7xl, the same cap most page containers in this
 * app use) rather than a tight one — a narrow cap was truncating text on
 * screens that plainly had the room to show it in full.
 *
 * Every severity is fully color-coordinated (tinted surface + matching title
 * and body text), not just the icon — a neutral white/graphite card read as
 * washed out in light mode, where it barely differed from the page behind it.
 *
 * The banner spans the full shell width, above the sidebar, so its content
 * is centered as one inline group rather than left-anchored to the strip's
 * edge — the standard layout for a top-of-app announcement bar (Stripe,
 * Intercom, GitHub all do this). Dismiss is pinned to the corner
 * independently so it never skews that center.
 *
 * Dismissal is keyed to a signature of the banner's *content* (including the
 * promo code), so closing one announcement does not swallow the next one,
 * and editing the copy brings the banner back for everyone who had already
 * dismissed the previous wording.
 */
const AnnouncementBanner = ({ announcement, preview = false }) => {
  const config = normalizeAnnouncement(announcement);
  const signature = announcementSignature(config);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // In the admin preview the banner must always render, and closing it must
    // not persist a dismissal for the admin's own session.
    setDismissed(!preview && config.dismissible && readDismissed().includes(signature));
  }, [signature, config.dismissible, preview]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    if (preview || typeof window === 'undefined') return;
    try {
      const next = Array.from(new Set([...readDismissed(), signature])).slice(-20);
      window.localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // A full or blocked localStorage should not keep the banner on screen.
    }
  }, [signature, preview]);

  const tone = TONE[config.type] || TONE.info;
  const Icon = tone.icon;
  const body = config.message?.trim();
  const title = config.title?.trim();

  if (dismissed || (!body && !title)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        role="status"
        className={cn('relative z-[100] w-full overflow-hidden border-b', tone.surface)}
      >
        {/* One line, capped: title + message never push the strip past a
            single row of text, regardless of copy length. */}
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-10 py-2 sm:px-14">
          {tone.solid ? (
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/20">
              <Icon className="h-3 w-3 text-white" strokeWidth={2.25} />
            </span>
          ) : (
            <IconChip icon={Icon} tone={tone.chip} size="sm" className="shrink-0" />
          )}

          <p className="min-w-0 truncate text-[12.5px] leading-none">
            {title && <span className={cn('font-extrabold', tone.title)}>{title}</span>}
            {title && body && <span className={cn('opacity-40', tone.body)}> &middot; </span>}
            {body && <span className={cn('font-medium', tone.body)}>{body}</span>}
          </p>

          {config.promo_code && <PromoCodeChip code={config.promo_code} tone={tone.accent} />}

          {config.link_url && (
            <a
              href={config.link_url}
              target={config.link_url.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={cn(
                'hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors sm:inline-flex',
                tone.accent
              )}
            >
              {config.link_label || 'Learn more'}
              <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>

        {config.dismissible && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss announcement"
            title="Dismiss"
            className={cn(
              'absolute right-2.5 top-1/2 grid h-6 w-6 shrink-0 -translate-y-1/2 place-items-center rounded-full border transition-colors sm:right-3.5',
              tone.dismiss || DEFAULT_DISMISS
            )}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBanner;
