import React from 'react';
import { Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  BODY,
  MICRO,
  PANEL,
  PanelHeader,
  TILE,
} from '@/components/admin/ui/primitives';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';
const FIELD_LABEL = cn(MICRO, 'mb-1.5 block text-stone-500 dark:text-stone-400');

export function PasswordChangeSection({
  passwordData,
  onChangePasswordData,
  changingPassword,
  onPasswordChange,
  passwordStrength,
}) {
  const isSubmitDisabled = !passwordData.currentPassword || !passwordData.newPassword;

  return (
    <section className={cn(PANEL, 'col-span-12 overflow-hidden lg:col-span-5')}>
      <PanelHeader
        label="Password"
        title="Change password"
        description="Use a unique 12-character password."
        accent="idle"
      />
      <div className="space-y-3 p-4">
        <div>
          <Label className={FIELD_LABEL} htmlFor="current-password">
            Current password
          </Label>
          <Input
            id="current-password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(event) =>
              onChangePasswordData({ ...passwordData, currentPassword: event.target.value })
            }
            className={FIELD_INPUT}
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className={FIELD_LABEL} htmlFor="new-password">
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              value={passwordData.newPassword}
              onChange={(event) =>
                onChangePasswordData({ ...passwordData, newPassword: event.target.value })
              }
              className={FIELD_INPUT}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label className={FIELD_LABEL} htmlFor="confirm-password">
              Confirm password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(event) =>
                onChangePasswordData({ ...passwordData, confirmPassword: event.target.value })
              }
              className={FIELD_INPUT}
              autoComplete="new-password"
            />
          </div>
        </div>
        {passwordData.newPassword && (
          <div className={cn(TILE, 'p-3')}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className={FIELD_LABEL}>Password strength</span>
              <span className="text-[11px] font-extrabold text-stone-700 dark:text-stone-200">
                {passwordStrength.label}
              </span>
            </div>
            <div
              className="grid grid-cols-5 gap-1"
              aria-label={`Password strength: ${passwordStrength.label}`}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    'h-1.5 rounded-full',
                    index < passwordStrength.score
                      ? passwordStrength.color
                      : 'bg-stone-200 dark:bg-white/10'
                  )}
                />
              ))}
            </div>
            <p className={cn(BODY, 'mt-2')}>
              Use upper- and lowercase letters, a number, and a symbol.
            </p>
          </div>
        )}
        <div className="flex justify-end pt-1">
          <AdminButton
            onClick={onPasswordChange}
            loading={changingPassword}
            disabled={isSubmitDisabled}
          >
            <Save className="h-3.5 w-3.5" /> Update password
          </AdminButton>
        </div>
      </div>
    </section>
  );
}
