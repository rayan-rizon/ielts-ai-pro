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
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { announcementSignature, normalizeAnnouncement } from '@/lib/communications';

const DISMISS_STORAGE_KEY = 'dismissed_announcements';
const COPY_RESET_MS = 1600;

/**
 * Tone theme definitions aligned with the Learner Panel Instrument-Panel Design System.
 */
const TONE = {
  info: {
    icon: Sparkles,
    surface:
      'border-b border-[#e4e2f0] dark:border-white/[0.07] bg-gradient-to-r from-white via-[#f7f6fd] to-white dark:from-[#141319] dark:via-[#181722] dark:to-[#141319]',
    chipBg:
      'border-[#5a63df]/25 bg-[#5a63df]/[0.08] text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/[0.14] dark:text-[#afb5ff]',
    title: 'text-slate-900 dark:text-slate-50',
    body: 'text-slate-600 dark:text-slate-300',
    accent:
      'text-[#5a63df] border-[#5a63df]/25 bg-[#5a63df]/[0.08] hover:bg-[#5a63df] hover:text-white dark:text-[#afb5ff] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/[0.14] dark:hover:bg-[#8f97ff] dark:hover:text-[#0b0c10]',
    dismiss:
      'border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 dark:border-white/10 dark:text-slate-400 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white',
  },
  success: {
    icon: CheckCircle2,
    surface:
      'border-b border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-[#0a1813] dark:to-[#091511]',
    chipBg:
      'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/[0.14] dark:text-emerald-300',
    title: 'text-emerald-950 dark:text-emerald-50',
    body: 'text-emerald-800 dark:text-emerald-200/90',
    accent:
      'text-emerald-700 border-emerald-500/25 bg-emerald-500/[0.08] hover:bg-emerald-600 hover:text-white dark:text-emerald-300 dark:border-emerald-400/30 dark:bg-emerald-400/[0.14] dark:hover:bg-emerald-400 dark:hover:text-[#0b0c10]',
    dismiss:
      'border-emerald-200 text-emerald-600/70 hover:border-emerald-300 hover:bg-emerald-100/60 hover:text-emerald-900 dark:border-emerald-800/40 dark:text-emerald-400/70 dark:hover:border-emerald-700/60 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200',
  },
  warning: {
    icon: AlertTriangle,
    surface:
      'border-b border-amber-200 dark:border-amber-500/20 bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-[#171208] dark:to-[#150f07]',
    chipBg:
      'border-amber-500/25 bg-amber-500/[0.08] text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/[0.14] dark:text-amber-300',
    title: 'text-amber-950 dark:text-amber-50',
    body: 'text-amber-800 dark:text-amber-200/90',
    accent:
      'text-amber-700 border-amber-500/25 bg-amber-500/[0.08] hover:bg-amber-600 hover:text-white dark:text-amber-300 dark:border-amber-400/30 dark:bg-amber-400/[0.14] dark:hover:bg-amber-400 dark:hover:text-[#0b0c10]',
    dismiss:
      'border-amber-200 text-amber-600/70 hover:border-amber-300 hover:bg-amber-100/60 hover:text-amber-900 dark:border-amber-800/40 dark:text-amber-400/70 dark:hover:border-amber-700/60 dark:hover:bg-amber-500/20 dark:hover:text-amber-200',
  },
  critical: {
    icon: AlertOctagon,
    surface:
      'border-b border-rose-200 dark:border-rose-500/20 bg-gradient-to-r from-rose-50/90 to-pink-50/90 dark:from-[#1a0a0c] dark:to-[#17090b]',
    chipBg:
      'border-rose-500/25 bg-rose-500/[0.08] text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/[0.14] dark:text-rose-300',
    title: 'text-rose-950 dark:text-rose-50',
    body: 'text-rose-800 dark:text-rose-200/90',
    accent:
      'text-rose-700 border-rose-500/25 bg-rose-500/[0.08] hover:bg-rose-600 hover:text-white dark:text-rose-300 dark:border-rose-400/30 dark:bg-rose-400/[0.14] dark:hover:bg-rose-400 dark:hover:text-[#0b0c10]',
    dismiss:
      'border-rose-200 text-rose-600/70 hover:border-rose-300 hover:bg-rose-100/60 hover:text-rose-900 dark:border-rose-800/40 dark:text-rose-400/70 dark:hover:border-rose-700/60 dark:hover:bg-rose-500/20 dark:hover:text-rose-200',
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
 * Promo code chip.
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
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider transition-colors',
        tone
      )}
      title="Copy promo code"
    >
      {code}
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

/**
 * Site-wide announcement banner.
 */
const AnnouncementBanner = ({ announcement, preview = false }) => {
  const config = normalizeAnnouncement(announcement);
  const signature = announcementSignature(config);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
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
        className={cn(
          'group relative z-[100] w-full overflow-hidden transition-all duration-300',
          tone.surface
        )}
      >
        {/* Subtle glowing accent highlight line across top border */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#5a63df]/40 to-transparent dark:via-[#8f97ff]/45" />

        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-10 py-2.5 sm:px-14">
          {/* Subtle Icon Chip */}
          <span
            className={cn(
              'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105',
              tone.chipBg
            )}
          >
            <Icon
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-[6deg]"
              strokeWidth={2.25}
            />
          </span>

          <p className="min-w-0 truncate text-xs sm:text-[13px] leading-snug">
            {title && (
              <span className={cn('font-black tracking-tight mr-1.5', tone.title)}>{title}</span>
            )}
            {title && body && (
              <span className="inline-block h-1 w-1 rounded-full bg-slate-300 dark:bg-white/20 mx-1.5 align-middle shrink-0" />
            )}
            {body && <span className={cn('font-medium', tone.body)}>{body}</span>}
          </p>

          {config.promo_code && <PromoCodeChip code={config.promo_code} tone={tone.accent} />}

          {config.link_url && (
            <a
              href={config.link_url}
              target={config.link_url.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={cn(
                'hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1 text-[11px] font-extrabold tracking-wide transition-all duration-200 hover:scale-[1.03] active:scale-95 sm:inline-flex shadow-sm',
                tone.accent
              )}
            >
              {config.link_label || 'Learn more'}
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
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
              'absolute right-2.5 top-1/2 grid h-6 w-6 shrink-0 -translate-y-1/2 place-items-center rounded-full border transition-all duration-200 active:scale-95 sm:right-3.5',
              tone.dismiss || DEFAULT_DISMISS
            )}
          >
            <X
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-90"
              strokeWidth={2.25}
            />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBanner;
