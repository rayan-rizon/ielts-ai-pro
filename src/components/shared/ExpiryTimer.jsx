import { useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatExpiryCountdown } from './expiryCountdown';

const SECOND = 1_000;

export default function ExpiryTimer({
  expiresAt,
  className,
  prefix = 'Available',
  urgent = false,
  surface = 'adaptive',
}) {
  const [now, setNow] = useState(() => Date.now());
  const countdown = useMemo(() => formatExpiryCountdown(expiresAt, now), [expiresAt, now]);

  useEffect(() => {
    if (!expiresAt || countdown?.expired) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), SECOND);
    return () => window.clearInterval(timer);
  }, [expiresAt, countdown?.expired]);

  if (!countdown) return null;
  const fullDate = new Date(expiresAt).toLocaleString();

  return (
    <span
      role="timer"
      aria-label={countdown.expired ? `${prefix} period ended` : `${prefix} until ${fullDate}`}
      title={
        countdown.expired ? 'This message is no longer available' : `Available until ${fullDate}`
      }
      className={cn(
        'inline-flex min-h-6 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tabular-nums',
        countdown.expired
          ? surface === 'light'
            ? 'border-stone-200 text-stone-500'
            : 'border-stone-200 text-stone-500 dark:border-white/10 dark:text-stone-400'
          : surface === 'light'
            ? 'border-amber-300/70 bg-amber-50 text-amber-800'
            : 'border-amber-300/60 bg-amber-500/[0.07] text-amber-700 dark:border-amber-400/25 dark:text-amber-300',
        className
      )}
    >
      <Clock3 className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
      {urgent ? `Ends in ${countdown.label.replace(/ left$/, '')}` : countdown.label}
    </span>
  );
}
