import { Building2, Users, CreditCard, BarChart3, ShieldCheck } from 'lucide-react';
import { MICRO, MUTED, TILE, WELL, IconChip } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

export default function InstitutionAuthIntro() {
  return (
    <section className="relative hidden flex-col justify-between border-r border-[#e4e2f0] bg-linear-to-b from-[#faf9ff]/80 to-white/95 p-8 dark:border-white/[0.07] dark:from-[#131219] dark:to-[#0f0e14] lg:col-span-3 lg:flex">
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/15 dark:text-[#bfc3ff]">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              IELTS Ai Pro
            </div>
            <p className={cn(MICRO, MUTED, '-mt-0.5')}>Institution Portal</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            IELTS access for your students
          </h2>
          <p className={cn(MUTED, 'mt-2 text-xs leading-relaxed')}>
            Manage your institution’s Pro and Premium seats, student enrollments, and academic
            telemetry in one place.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {[
            {
              icon: CreditCard,
              tone: 'accent',
              title: 'Buy prepaid seats',
              desc: 'Choose a plan, duration, and seat quantity with instant tier provisioning.',
            },
            {
              icon: Users,
              tone: 'emerald',
              title: 'Invite your students',
              desc: 'Provide access individually or import complete candidate batches via CSV.',
            },
            {
              icon: BarChart3,
              tone: 'sky',
              title: 'Track access and billing',
              desc: 'See active invitations, student progress, license allocations, and invoices.',
            },
          ].map(({ icon, tone, title, desc }) => (
            <div
              key={title}
              className={cn(
                TILE,
                'flex items-start gap-3 p-3.5 transition-all duration-200 hover:border-[#5a63df]/35'
              )}
            >
              <IconChip icon={icon} tone={tone} size="md" className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                <p className={cn(MUTED, 'mt-0.5 text-[11px] leading-relaxed')}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          WELL,
          'mt-6 rounded-xl border border-[#eceafa] p-3.5 dark:border-white/[0.06]'
        )}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[rgb(var(--signal-ok))]" />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
            Verified Educational Access
          </span>
        </div>
        <p className={cn(MUTED, 'mt-1 text-[11px] leading-relaxed')}>
          Administrative credentials are bound to verified institutional domains. Account
          invitations are dispatched upon application approval.
        </p>
      </div>
    </section>
  );
}
