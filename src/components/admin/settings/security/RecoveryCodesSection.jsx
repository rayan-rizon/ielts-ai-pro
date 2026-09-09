import React from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AdminButton, BODY, NUM, PANEL, PanelHeader, TILE } from '@/components/admin/ui/primitives';

export function RecoveryCodesSection({
  recoveryCodes = [],
  isAal2,
  working,
  onCopyRecoveryCodes,
  onRotateRecoveryCodes,
}) {
  return (
    <section className={cn(PANEL, 'col-span-12 overflow-hidden lg:col-span-7')}>
      <PanelHeader
        label="Recovery"
        title="Backup recovery codes"
        description="Use one at sign-in if your authenticator is unavailable."
        accent="warn"
      />
      <div className="space-y-3 p-4">
        {recoveryCodes.length > 0 ? (
          <div className={cn(TILE, 'p-3')}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                Save these codes offline now
              </p>
              <button
                type="button"
                onClick={onCopyRecoveryCodes}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {recoveryCodes.map((code) => (
                <code
                  key={code}
                  className={cn(
                    NUM,
                    'rounded-md bg-stone-100 px-2.5 py-2 text-center text-[11px] font-bold text-stone-800 dark:bg-white/[0.06] dark:text-stone-100'
                  )}
                >
                  {code}
                </code>
              ))}
            </div>
          </div>
        ) : (
          <div className={cn(TILE, 'p-3')}>
            <p className={cn(BODY, 'mb-3')}>
              Each code works once. Creating a new set invalidates every unused old code.
            </p>
            <AdminButton
              disabled={!isAal2}
              loading={working === 'rotate-recovery'}
              onClick={onRotateRecoveryCodes}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Generate recovery codes
            </AdminButton>
          </div>
        )}
      </div>
    </section>
  );
}
