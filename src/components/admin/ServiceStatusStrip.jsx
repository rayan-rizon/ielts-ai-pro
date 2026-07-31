import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import { PlatformHealth, STATUS_LABEL } from '@/features/admin/services/PlatformHealth';

const NUM = 'font-mono tabular-nums tracking-tight';
const MICRO = 'text-[9px] font-bold uppercase tracking-[0.14em]';

// Shared signal tokens (defined in index.css) keep this in step with the
// full health dashboard in Global Settings.
const FAULT = 'bg-[rgb(var(--signal-fault))]';
const WARN = 'bg-[rgb(var(--signal-warn))]';
const OK = 'bg-[rgb(var(--signal-ok))]';

const DOT = {
  down: FAULT,
  unconfigured: FAULT,
  degraded: WARN,
  attention: WARN,
  operational: OK,
  idle: 'bg-[rgb(var(--signal-idle))]',
};

/**
 * Compact status read-out for the admin landing page.
 *
 * The Overview is the first thing an admin sees, so a broken provider has to be
 * visible here rather than only inside Settings.
 */
const ServiceStatusStrip = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    PlatformHealth.get(24)
      .then((data) => active && setHealth(data))
      .catch((err) => console.error('Service status unavailable:', err))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200/80 dark:border-white/[0.07] bg-white dark:bg-[#131315] px-4 py-3 flex items-center gap-2 text-stone-500 dark:text-stone-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className={MICRO}>Polling services</span>
      </div>
    );
  }

  if (!health) return null;

  const services = health.services || [];
  const broken = services.filter((s) => s.status === 'down' || s.status === 'unconfigured');
  const warning = services.filter((s) => s.status === 'degraded' || s.status === 'attention');
  const healthy = broken.length === 0 && warning.length === 0;
  const problems = [...broken, ...warning];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-white dark:bg-[#131315]',
        broken.length > 0
          ? 'border-[rgb(var(--signal-fault)/0.35)]'
          : warning.length > 0
            ? 'border-[rgb(var(--signal-warn)/0.35)]'
            : 'border-stone-200/80 dark:border-white/[0.07]'
      )}
    >
      <span
        className={cn(
          'absolute left-0 top-0 h-full w-[3px]',
          broken.length > 0 ? FAULT : warning.length > 0 ? WARN : OK
        )}
      />
      <div className="pl-5 pr-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {broken.length > 0 ? (
            <AlertOctagon className="w-4 h-4 text-[rgb(var(--signal-fault))] shrink-0" />
          ) : warning.length > 0 ? (
            <AlertTriangle className="w-4 h-4 text-[rgb(var(--signal-warn))] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[rgb(var(--signal-ok))] shrink-0" />
          )}
          <div className="min-w-0">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Platform status</p>
            <p className="text-[13px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 truncate leading-tight mt-0.5">
              {healthy
                ? 'All systems nominal'
                : [
                    broken.length > 0 && `${broken.length} fault`,
                    warning.length > 0 && `${warning.length} degraded`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Problems get named; a healthy platform just reports the count. */}
          {problems.slice(0, 4).map((service) => (
            <span
              key={service.key}
              title={service.impact}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-stone-200 dark:border-white/10"
            >
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT[service.status])} />
              <span className="text-[10px] font-extrabold text-stone-700 dark:text-stone-200 whitespace-nowrap">
                {service.label}
              </span>
              <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 whitespace-nowrap')}>
                {STATUS_LABEL[service.status]}
              </span>
            </span>
          ))}
          {healthy && (
            <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              <span className={cn(NUM, 'text-[11px] text-stone-600 dark:text-stone-300')}>
                {services.length}
              </span>
              {' services · 24h'}
            </span>
          )}
          <Link
            to={`${createPageUrl('AdminPanel')}?tab=settings&section=general`}
            className={cn(
              MICRO,
              'inline-flex items-center gap-0.5 px-2 py-1 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap'
            )}
          >
            Details
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceStatusStrip;
