import React from 'react';
import { CircleAlert, Fingerprint, Loader2, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  BODY,
  Empty,
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

function PasskeyItem({ passkey, canManage, isDeleting, onRemove }) {
  return (
    <div className={cn(TILE, 'flex items-center gap-3 p-3')}>
      <Fingerprint className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-extrabold text-stone-900 dark:text-stone-50">
          {passkey.friendly_name || 'Passkey'}
        </p>
        <p
          className={cn(
            MICRO,
            'mt-0.5 normal-case tracking-normal text-stone-500 dark:text-stone-400'
          )}
        >
          Added {formatDate(passkey.created_at)}
          {passkey.last_used_at ? ` · Last used ${formatDate(passkey.last_used_at)}` : ''}
        </p>
      </div>
      <button
        type="button"
        disabled={!canManage || isDeleting}
        onClick={onRemove}
        className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-500 dark:hover:text-rose-300"
        aria-label={`Remove ${passkey.friendly_name || 'passkey'}`}
      >
        {isDeleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function PasskeyList({ passkeys, isUnavailable, canManage, working, onRemovePasskey }) {
  if (isUnavailable) {
    return (
      <div className={cn(TILE, 'flex items-start gap-3 p-3')}>
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
        <div>
          <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
            Passkeys are unavailable for this project
          </p>
          <p className={cn(BODY, 'mt-1')}>
            Supabase Auth rejected the passkey request. MFA authenticators and session records
            remain available while the project setting is corrected.
          </p>
        </div>
      </div>
    );
  }

  if (passkeys.length === 0) {
    return (
      <Empty icon={Fingerprint} title="No passkey enrolled yet" className="py-7">
        Add one to this device or password manager.
      </Empty>
    );
  }

  return passkeys.map((passkey) => (
    <PasskeyItem
      key={passkey.id}
      passkey={passkey}
      canManage={canManage}
      isDeleting={working === `delete-passkey-${passkey.id}`}
      onRemove={() => onRemovePasskey(passkey)}
    />
  ));
}

function PasskeyActionPrompt({
  action,
  passkeyCode,
  onPasskeyCodeChange,
  working,
  onVerifyIdentity,
  onStartRegistration,
}) {
  if (action.type === 'add' && action.stage === 'register') {
    return (
      <div className={cn(TILE, 'flex flex-wrap items-center justify-between gap-3 p-3')}>
        <div>
          <SectionLabel accent="accent">Ready to add a passkey</SectionLabel>
          <p className={cn(BODY, 'mt-1')}>Keep this window active, then start the device prompt.</p>
        </div>
        <AdminButton loading={working === 'add-passkey'} onClick={onStartRegistration}>
          <Fingerprint className="h-3.5 w-3.5" /> Start passkey registration
        </AdminButton>
      </div>
    );
  }

  return (
    <div className={cn(TILE, 'space-y-3 p-3')}>
      <SectionLabel accent="accent">
        {action.type === 'add' ? 'Verify to add a passkey' : 'Verify to remove a passkey'}
      </SectionLabel>
      <div className="max-w-sm">
        <div>
          <Label className={FIELD_LABEL} htmlFor="passkey-code">
            Authenticator code
          </Label>
          <Input
            id="passkey-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={passkeyCode}
            onChange={(event) => onPasskeyCodeChange(event.target.value.replace(/\s/g, ''))}
            className={cn(FIELD_INPUT, 'font-mono tracking-[0.22em]')}
            placeholder="123456"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <AdminButton
          disabled={!passkeyCode}
          loading={working === 'add-passkey'}
          onClick={onVerifyIdentity}
        >
          <Fingerprint className="h-3.5 w-3.5" />
          {action.type === 'add' ? 'Verify identity' : 'Verify and remove'}
        </AdminButton>
      </div>
    </div>
  );
}

export function PasskeysSection({
  passkeys = [],
  passkeysAvailable = true,
  canManagePasskeys,
  isCanonicalPasskeyOrigin,
  hasRecentPasskeyStepUp,
  working,
  passkeyAction,
  passkeyCode,
  onPasskeyCodeChange,
  onBeginPasskeyAdd,
  onRemovePasskey,
  onVerifyPasskeyAction,
  onRegisterPasskey,
}) {
  const isBusy = working === 'prepare-passkey' || working === 'add-passkey';
  const canAdd = canManagePasskeys && isCanonicalPasskeyOrigin && !isBusy;

  return (
    <section className={cn(PANEL, 'col-span-12 overflow-hidden lg:col-span-7')}>
      <PanelHeader
        label="Passkeys"
        title="Phishing-resistant sign-in"
        description="Add a passkey for phishing-resistant sign-in."
        accent="accent"
      />
      <div className="space-y-3 p-4">
        {!isCanonicalPasskeyOrigin && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/8 dark:text-amber-200">
            Add and use passkeys at www.ieltsai.pro. WebAuthn intentionally rejects preview and
            alternate domains.
          </div>
        )}

        <PasskeyList
          passkeys={passkeys}
          isUnavailable={!passkeysAvailable}
          canManage={canManagePasskeys}
          working={working}
          onRemovePasskey={onRemovePasskey}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 pt-3 dark:border-white/[0.07]">
          <p className={cn(BODY, 'max-w-md')}>
            {hasRecentPasskeyStepUp
              ? 'This session was recently verified and is ready to add a passkey.'
              : 'Confirm with your authenticator before changing passkeys.'}
          </p>
          <AdminButton
            disabled={!canAdd}
            loading={working === 'prepare-passkey'}
            onClick={onBeginPasskeyAdd}
          >
            <Plus className="h-3.5 w-3.5" /> Add passkey
          </AdminButton>
        </div>

        {passkeyAction && (
          <PasskeyActionPrompt
            action={passkeyAction}
            passkeyCode={passkeyCode}
            onPasskeyCodeChange={onPasskeyCodeChange}
            working={working}
            onVerifyIdentity={onVerifyPasskeyAction}
            onStartRegistration={onRegisterPasskey}
          />
        )}
      </div>
    </section>
  );
}
