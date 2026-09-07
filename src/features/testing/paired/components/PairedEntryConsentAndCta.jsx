import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MUTED } from '@/features/dashboard/components/primitives.jsx';
import { ReiconAlertCircle, ReiconArrowRight, ReiconRefresh } from '@/components/ui/reicon';
import { cn } from '@/lib/cn';

export default function PairedEntryConsentAndCta({
  consent,
  setConsent,
  consentError,
  setConsentError,
  error,
  busy,
  loading,
  invitation,
  preview,
  proceed,
}) {
  const isBlockedByAccess = Boolean(preview && !preview.can_access);
  const isButtonDisabled = busy || loading || (Boolean(invitation) && !preview);

  return (
    <div className="mt-4 space-y-3 pt-3.5 border-t border-[#eceafa] dark:border-white/[0.07]">
      {/* Consent Card */}
      <label
        htmlFor="paired-consent"
        className={cn(
          'group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border',
          consent
            ? 'border-[#5a63df]/40 bg-[#5a63df]/[0.05] dark:border-[#8f97ff]/35 dark:bg-[#8f97ff]/[0.08]'
            : 'border-[#e4e2f0] bg-[#fbfbfe] hover:border-[#5a63df]/35 hover:bg-[#f7f6fd] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]',
          consentError &&
            !consent &&
            'border-[rgb(var(--signal-fault)/0.6)] bg-[rgb(var(--signal-fault)/0.04)]',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#5a63df] has-[:focus-visible]:ring-offset-2'
        )}
      >
        <input
          id="paired-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setConsentError(false);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#5a63df] accent-[#5a63df] cursor-pointer"
        />
        <div className="min-w-0 flex-1">
          <span className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
            I agree to share my final test results with my study partner
          </span>
          <span className={cn(MUTED, 'block text-[11px] mt-0.5 leading-normal')}>
            Required to generate the shared scoreboard and compare performance breakdown.
          </span>
          {consentError && !consent && (
            <span className="mt-1 block text-[11px] font-semibold text-[rgb(var(--signal-fault))]">
              Please check this box to agree before continuing.
            </span>
          )}
        </div>
      </label>

      {/* Error recovery alert */}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[rgb(var(--signal-fault)/0.35)] bg-[rgb(var(--signal-fault)/0.08)] text-xs text-[rgb(var(--signal-fault))] dark:bg-[rgb(var(--signal-fault)/0.14)]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ReiconAlertCircle className="h-4 w-4 shrink-0 text-[rgb(var(--signal-fault))]" />
            <span className="leading-snug">{error}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={proceed}
            disabled={busy}
            className="h-7 shrink-0 gap-1.5 border-[rgb(var(--signal-fault)/0.4)] bg-white px-2.5 text-xs font-semibold text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] dark:bg-[#1c1a22]"
          >
            <ReiconRefresh className={cn('h-3 w-3', busy && 'animate-spin')} />
            Try again
          </Button>
        </div>
      )}

      {/* CTA Button or Access Warning */}
      {isBlockedByAccess ? (
        <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] text-xs dark:border-amber-400/25 dark:bg-amber-400/[0.08]">
          <p className="text-slate-700 dark:text-slate-200">
            Your account needs access to this test before joining.{' '}
            <Link
              className="font-bold text-[#5a63df] underline underline-offset-2 dark:text-[#afb5ff]"
              to="/pricing"
            >
              View plans
            </Link>
          </p>
        </div>
      ) : (
        <div className="pt-1">
          <Button
            disabled={isButtonDisabled}
            onClick={proceed}
            className="w-full h-11 text-xs font-bold gap-2 rounded-xl bg-[#5a63df] hover:bg-[#4a52c9] text-white shadow-xs hover:shadow transition-all active:scale-[0.99]"
          >
            {busy ? (
              <>
                <ReiconRefresh className="h-3.5 w-3.5 animate-spin" />
                {invitation ? 'Joining room…' : 'Creating room…'}
              </>
            ) : (
              <>
                {invitation ? 'Join study room' : 'Create room & invite'}
                <ReiconArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
          <p className="mt-2 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {invitation
              ? 'You will enter the synchronized waiting room once joined.'
              : 'Generates an instant 24-hour private invitation link for your study partner.'}
          </p>
        </div>
      )}
    </div>
  );
}
