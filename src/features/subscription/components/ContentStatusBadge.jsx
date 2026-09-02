import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getContentStatus } from '@/features/subscription/config/contentAccess';

const TONE_CLASSES = {
  completed:
    'border-emerald-200/90 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300',
  included:
    'border-indigo-200/90 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300',
  free: 'border-slate-200/90 bg-white/85 text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300',
  locked:
    'border-slate-200/90 bg-white/85 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200',
};

export default function ContentStatusBadge({ user, requiredTier, completed = false, className }) {
  const status = getContentStatus({ user, requiredTier, completed });
  if (status.visible === false) return null;
  const Icon =
    status.tone === 'completed' ? CheckCircle2 : status.tone === 'locked' ? LockKeyhole : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-2xs',
        TONE_CLASSES[status.tone],
        className
      )}
    >
      {Icon && <Icon className="h-2.5 w-2.5" aria-hidden="true" />}
      {status.label}
    </span>
  );
}
