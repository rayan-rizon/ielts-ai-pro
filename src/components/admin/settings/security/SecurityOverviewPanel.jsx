import React from 'react';
import { cn } from '@/lib/cn';
import { MICRO, NUM, PANEL, PanelHeader, Pill } from '@/components/admin/ui/primitives';
import { mfaEnforcementLabel } from '@/features/admin/utils/adminSecurityState';
import { formatDate } from './securitySessionUtils';

export function SecurityOverviewPanel({
  aal = 'aal1',
  mfaRequired = false,
  verifiedFactorsCount = 0,
  recoveryExpiresAt,
}) {
  const isAal2 = aal === 'aal2';
  const tone = isAal2 ? 'ok' : 'warn';
  const enforcementText = mfaEnforcementLabel(mfaRequired, verifiedFactorsCount);
  const recoveryText = recoveryExpiresAt
    ? `Temporary until ${formatDate(recoveryExpiresAt)}`
    : 'No temporary grant';

  return (
    <section className={cn(PANEL, 'col-span-12 overflow-hidden')}>
      <PanelHeader
        label="Admin security"
        title="Protected administrator access"
        description="Passkeys and MFA protect administrator access."
        accent={tone}
      >
        <Pill tone={tone}>{aal.toUpperCase()}</Pill>
      </PanelHeader>
      <div className="grid grid-cols-1 gap-px bg-stone-200/70 dark:bg-white/[0.07] sm:grid-cols-3">
        <div className="bg-white px-4 py-3 dark:bg-[#131315]">
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>MFA enforcement</p>
          <p className="mt-1 text-xs font-extrabold text-stone-900 dark:text-stone-50">
            {enforcementText}
          </p>
        </div>
        <div className="bg-white px-4 py-3 dark:bg-[#131315]">
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Verified authenticators</p>
          <p className={cn(NUM, 'mt-1 text-sm font-bold text-stone-900 dark:text-stone-50')}>
            {verifiedFactorsCount}
          </p>
        </div>
        <div className="bg-white px-4 py-3 dark:bg-[#131315]">
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Recovery status</p>
          <p className="mt-1 text-xs font-extrabold text-stone-900 dark:text-stone-50">
            {recoveryText}
          </p>
        </div>
      </div>
    </section>
  );
}
