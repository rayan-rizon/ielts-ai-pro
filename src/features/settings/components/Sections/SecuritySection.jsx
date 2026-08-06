import React from 'react';
import { m } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, PANEL, PanelTitle } from '@/features/dashboard/components/primitives';

export default function SecuritySection({
  passwordData,
  setPasswordData,
  isUpdatingPassword,
  handleUpdatePassword,
  setShowDeleteModal,
}) {
  return (
    <m.div
      key="account"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <div className={cn(PANEL, 'p-4 sm:p-5')}>
        <PanelTitle label="Change password" accent />
        <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>
          Choose a strong password you don&apos;t use elsewhere.
        </p>

        <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              New password
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="h-10 rounded-lg border-[#e2e5f2] bg-white text-sm font-semibold dark:border-white/10 dark:bg-white/4"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Confirm password
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              className="h-10 rounded-lg border-[#e2e5f2] bg-white text-sm font-semibold dark:border-white/10 dark:bg-white/4"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-start border-t border-[#eeedf7] pt-4 dark:border-white/[0.07]">
          <button
            type="button"
            onClick={handleUpdatePassword}
            disabled={isUpdatingPassword || !passwordData.newPassword}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {isUpdatingPassword ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            Update password
          </button>
        </div>
      </div>

      <div
        className={cn(
          PANEL,
          'flex flex-col items-start justify-between gap-3 border-[rgba(var(--signal-fault),0.25)] bg-[rgba(var(--signal-fault),0.04)] p-4 sm:flex-row sm:items-center sm:p-5'
        )}
      >
        <div className="flex items-center gap-3">
          <IconChip icon={AlertTriangle} tone="fault" />
          <div>
            <h4 className="text-sm font-extrabold text-[rgb(var(--signal-fault))]">Danger zone</h4>
            <p className={cn('text-xs font-medium', MUTED)}>
              Permanently delete your account and all IELTS progress history.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex h-9 shrink-0 items-center rounded-lg bg-[rgb(var(--signal-fault))] px-4 text-xs font-bold text-white transition-all active:scale-95"
        >
          Delete account
        </button>
      </div>
    </m.div>
  );
}
