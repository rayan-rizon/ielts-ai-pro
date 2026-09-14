import React from 'react';
import { Lock, Plus, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  BODY,
  MICRO,
  PANEL,
  PanelHeader,
  SectionLabel,
  TILE,
} from '@/components/admin/ui/primitives';
import { formatDate } from './securitySessionUtils';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';
const FIELD_LABEL = cn(MICRO, 'mb-1.5 block text-stone-500 dark:text-stone-400');

function AuthenticatorList({ factors = [], canRemove, working, onRemove }) {
  return factors.map((factor) => (
    <div
      key={factor.id}
      className={cn(
        TILE,
        'flex items-center gap-3 p-3 transition-all duration-150 ease-smooth-out hover:border-stone-300 dark:hover:border-white/20'
      )}
    >
      <Smartphone className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-extrabold text-stone-900 dark:text-stone-50">
          {factor.friendly_name || 'Authenticator app'}
        </p>
        <p
          className={cn(
            MICRO,
            'mt-0.5 normal-case tracking-normal text-stone-500 dark:text-stone-400'
          )}
        >
          Verified {formatDate(factor.created_at)}
        </p>
      </div>
      <button
        type="button"
        disabled={!canRemove || working === `remove-factor-${factor.id}`}
        onClick={() => onRemove(factor.id)}
        className="rounded-md p-1.5 text-stone-400 transition-all duration-150 ease-smooth-out hover:bg-rose-500/10 hover:text-rose-600 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-500 dark:hover:text-rose-300"
        aria-label={`Remove ${factor.friendly_name || 'authenticator'}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  ));
}

function PendingTotpEnrollment({ pendingTotp, totpCode, onTotpCodeChange, working, onVerify }) {
  return (
    <div className={cn(TILE, 'space-y-3 p-3')}>
      <SectionLabel accent="accent">Verify new authenticator</SectionLabel>
      <img
        src={pendingTotp.totp.qr_code}
        alt="Scan this QR code with your authenticator app"
        className="mx-auto h-36 w-36 rounded-md border border-stone-200 bg-white p-2"
      />
      <p className={cn(BODY, 'text-center')}>
        Scan the code, then enter the current six-digit code. The secret is never stored by this
        app.
      </p>
      <Input
        aria-label="New authenticator verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={8}
        value={totpCode}
        onChange={(event) => onTotpCodeChange(event.target.value.replace(/\s/g, ''))}
        className={cn(FIELD_INPUT, 'font-mono tracking-[0.22em]')}
        placeholder="123456"
      />
      <AdminButton className="w-full" loading={working === 'verify-totp'} onClick={onVerify}>
        <ShieldCheck className="h-3.5 w-3.5" /> Verify authenticator
      </AdminButton>
    </div>
  );
}

function Aal2UpgradePrompt({ stepUpCode, onStepUpCodeChange, working, onVerify }) {
  return (
    <div className={cn(TILE, 'mb-3 p-3')}>
      <p className={cn(BODY, 'mb-2')}>
        You already have a verified authenticator. Enter its current code to upgrade this session to
        AAL2 and unlock passkeys and recovery codes.
      </p>
      <div className="flex gap-2">
        <Input
          aria-label="Current authenticator code"
          value={stepUpCode}
          onChange={(event) => onStepUpCodeChange(event.target.value.replace(/\s/g, ''))}
          className={cn(FIELD_INPUT, 'font-mono tracking-[0.22em]')}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
        />
        <AdminButton loading={working} onClick={onVerify}>
          Verify
        </AdminButton>
      </div>
    </div>
  );
}

function NewFactorForm({ factorName, onFactorNameChange, working, onEnroll }) {
  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <Label htmlFor="factor-name" className={FIELD_LABEL}>
          New authenticator name
        </Label>
        <Input
          id="factor-name"
          value={factorName}
          onChange={(event) => onFactorNameChange(event.target.value)}
          className={FIELD_INPUT}
          maxLength={80}
        />
      </div>
      <AdminButton loading={working === 'enroll-totp'} onClick={onEnroll}>
        <Plus className="h-3.5 w-3.5" /> Add
      </AdminButton>
    </div>
  );
}

function MfaEnforcementCard({ isAal2, working, onEnforce }) {
  return (
    <div className="border-t border-stone-200/80 pt-3 dark:border-white/[0.07]">
      <p className={cn(BODY, 'mb-2')}>
        Your authenticator is ready. Turn on enforcement to require AAL2 for every protected admin
        query and action.
      </p>
      <AdminButton
        className="w-full"
        disabled={!isAal2}
        loading={working === 'enforce-mfa'}
        onClick={onEnforce}
      >
        <Lock className="h-3.5 w-3.5" /> Require MFA for admin access
      </AdminButton>
    </div>
  );
}

function AuthenticatorEnrollmentOrUpgrade({
  pendingTotp,
  totpCode,
  onTotpCodeChange,
  working,
  onVerifyTotpEnrollment,
  showUpgradePrompt,
  stepUpCode,
  onStepUpCodeChange,
  verifiedFactors,
  onVerifyCurrentSession,
  factorName,
  onFactorNameChange,
  onBeginTotpEnrollment,
}) {
  if (pendingTotp) {
    return (
      <PendingTotpEnrollment
        pendingTotp={pendingTotp}
        totpCode={totpCode}
        onTotpCodeChange={onTotpCodeChange}
        working={working}
        onVerify={onVerifyTotpEnrollment}
      />
    );
  }

  return (
    <>
      {showUpgradePrompt && (
        <Aal2UpgradePrompt
          stepUpCode={stepUpCode}
          onStepUpCodeChange={onStepUpCodeChange}
          working={working === `verify-session-${verifiedFactors[0]?.id}`}
          onVerify={() => onVerifyCurrentSession(verifiedFactors[0]?.id)}
        />
      )}
      <NewFactorForm
        factorName={factorName}
        onFactorNameChange={onFactorNameChange}
        working={working}
        onEnroll={onBeginTotpEnrollment}
      />
    </>
  );
}

export function AuthenticatorsSection(props) {
  const {
    isAal2,
    mfaRequired = false,
    verifiedFactors = [],
    working,
    onRemoveFactor,
    onEnforceMfa,
  } = props;
  const showEnforceCard = !mfaRequired && verifiedFactors.length > 0;
  const canRemoveFactor = verifiedFactors.length > 1 && isAal2;
  const showUpgradePrompt = verifiedFactors.length > 0 && !isAal2;

  return (
    <section className={cn(PANEL, 'col-span-12 overflow-hidden lg:col-span-5')}>
      <PanelHeader
        label="Authenticator"
        title="Second factor"
        description="Use an authenticator to verify sensitive actions."
        accent={verifiedFactors.length ? 'ok' : 'warn'}
      />
      <div className="space-y-3 p-4">
        <AuthenticatorList
          factors={verifiedFactors}
          canRemove={canRemoveFactor}
          working={working}
          onRemove={onRemoveFactor}
        />
        <AuthenticatorEnrollmentOrUpgrade {...props} showUpgradePrompt={showUpgradePrompt} />
        {showEnforceCard && (
          <MfaEnforcementCard isAal2={isAal2} working={working} onEnforce={onEnforceMfa} />
        )}
      </div>
    </section>
  );
}
