import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, Mail, ShieldCheck, Wrench } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DEFAULT_MAINTENANCE, normalizeMaintenance } from '@/lib/communications';

/** `01:23:45` from a millisecond delta, dropping the hour segment under an hour. */
const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

const Countdown = ({ endsAt }) => {
  const target = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = target - now;

  if (!Number.isFinite(target)) return null;

  return (
    <div className="rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {remaining > 0 ? 'Estimated time remaining' : 'Expected back'}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
        {remaining > 0 ? formatCountdown(remaining) : 'Any moment now'}
      </p>
      <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {new Date(target).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </p>
    </div>
  );
};

/**
 * The learner-facing maintenance page. Everything except the layout is
 * operator-controlled from Admin → Communications → Maintenance, so a real
 * incident can carry a real explanation instead of a generic placeholder.
 */
const MaintenanceScreen = ({ config }) => {
  const settings = normalizeMaintenance(config);
  const title = settings.title || DEFAULT_MAINTENANCE.title;
  const message = settings.message || DEFAULT_MAINTENANCE.message;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-[#070913]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'w-full max-w-md rounded-2xl border border-[#e4e2f0] bg-white p-7 text-center',
          'dark:border-white/10 dark:bg-[#131315] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
        )}
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#5a63df]/9 dark:bg-[#5a63df]/18">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Wrench className="h-6 w-6 text-[#5a63df] dark:text-[#afb5ff]" strokeWidth={2} />
          </motion.div>
        </div>

        <h1 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        <p className="mt-2 whitespace-pre-line text-[13px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
          {message}
        </p>

        <div className="mt-5 space-y-2.5 text-left">
          {settings.ends_at ? (
            <Countdown endsAt={settings.ends_at} />
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                Please check back shortly
              </span>
            </div>
          )}

          {settings.status_url && (
            <a
              href={settings.status_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-xl border border-[#e4e2f0] px-4 py-2.5 transition-colors hover:bg-[#f7f6fd] dark:border-white/10 dark:hover:bg-white/6"
            >
              <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                Live status updates
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            </a>
          )}

          {settings.contact_email && (
            <a
              href={`mailto:${settings.contact_email}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-[#e4e2f0] px-4 py-2.5 transition-colors hover:bg-[#f7f6fd] dark:border-white/10 dark:hover:bg-white/6"
            >
              <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                <Mail className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                {settings.contact_email}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 h-9 w-full rounded-lg bg-[#5a63df] text-[12px] font-bold text-white transition-colors hover:bg-[#4a52c9] active:scale-[0.98]"
        >
          Try again
        </button>
      </motion.div>
    </div>
  );
};

export default MaintenanceScreen;
