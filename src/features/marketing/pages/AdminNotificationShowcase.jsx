import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import InAppNotificationCard from '@/features/marketing/components/InAppNotificationCard';
import { ADMIN_NOTIFICATION_SCENARIOS } from '@/features/marketing/dev/adminNotificationScenarios';
import { MICRO, MUTED, Pill, TITLE } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

const ALL = 'All';

export default function AdminNotificationShowcase() {
  const [category, setCategory] = useState(ALL);
  const categories = useMemo(
    () => [ALL, ...new Set(ADMIN_NOTIFICATION_SCENARIOS.map((item) => item.category))],
    []
  );
  const visible =
    category === ALL
      ? ADMIN_NOTIFICATION_SCENARIOS
      : ADMIN_NOTIFICATION_SCENARIOS.filter((item) => item.category === category);
  const offerExpiry = useMemo(() => new Date(Date.now() + 48 * 3_600_000).toISOString(), []);

  return (
    <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pb-12 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-5 md:py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.08] dark:opacity-[0.12]"
      />
      <div className="relative mx-auto max-w-[1440px] space-y-4">
        <header className="rounded-xl border border-[#e4e2f0] bg-white px-4 py-4 dark:border-white/[0.07] dark:bg-[#131315] sm:px-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="accent">Temporary admin preview</Pill>
                <span className={cn(MICRO, MUTED)}>Static sample data · nothing is sent</span>
              </div>
              <h1 className={cn(TITLE, 'mt-2 text-xl sm:text-2xl')}>
                Learner notification showcase
              </h1>
              <p className={cn(MUTED, 'mt-1 max-w-2xl text-sm leading-relaxed')}>
                Review every current message in the real learner-dashboard card. Buttons are inert
                previews and do not create deliveries, discounts, or analytics events.
              </p>
            </div>
            <Link
              to="/admin/panel?tab=marketing"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#d9d7e8] bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-[#f4f3fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-white/10 dark:bg-[#18171e] dark:text-slate-200 dark:hover:bg-white/[0.06]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Filter notification previews">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={cn(
                  'h-8 rounded-md border px-3 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                  category === item
                    ? 'border-[#5a63df] bg-[#5a63df] text-white'
                    : 'border-[#dddbea] bg-white text-slate-600 hover:bg-[#f4f3fb] dark:border-white/10 dark:bg-[#18171e] dark:text-slate-300 dark:hover:bg-white/[0.06]'
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </header>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#5a63df]" />
            <p className={cn(MICRO, MUTED)}>{visible.length} learner states</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin only
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2" aria-label="Learner notification previews">
          {visible.map((scenario) => (
            <article key={scenario.id} className="min-w-0">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                  {scenario.label}
                </p>
                <span className={cn(MICRO, MUTED)}>{scenario.category}</span>
              </div>
              <InAppNotificationCard
                preview
                id={`admin-preview-${scenario.id}`}
                playbookKey={scenario.playbookKey}
                title={scenario.title}
                message={scenario.message}
                contextLabel={scenario.contextLabel}
                ctaLabel={scenario.ctaLabel}
                expiresAt={scenario.urgent ? offerExpiry : undefined}
                urgent={Boolean(scenario.urgent)}
              />
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
