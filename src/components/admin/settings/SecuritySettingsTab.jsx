import { m } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Lock, Save } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, PANEL, AdminButton, FADE_UP } from '@/components/admin/ui/primitives';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';
const FIELD_LABEL = cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-1.5 block');

export default function SecuritySettingsTab({
  passwordData,
  onChangePasswordData,
  changingPassword,
  onPasswordChange,
}) {
  return (
    <m.div variants={FADE_UP} className="max-w-3xl">
      <div className={cn(PANEL, 'overflow-hidden')}>
        <div className="p-4 border-b border-stone-100 dark:border-white/[0.06] flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-stone-300">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50">Security</h3>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
              Your account credentials
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h4 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Change password</h4>

          <div>
            <Label className={FIELD_LABEL} htmlFor="current-password">
              Current password
            </Label>
            <Input
              id="current-password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                onChangePasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              className={FIELD_INPUT}
              placeholder="Enter current password"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className={FIELD_LABEL} htmlFor="new-password">
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  onChangePasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className={FIELD_INPUT}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label className={FIELD_LABEL} htmlFor="confirm-password">
                Confirm new password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  onChangePasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className={FIELD_INPUT}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <AdminButton
              onClick={onPasswordChange}
              loading={changingPassword}
              disabled={!passwordData.currentPassword || !passwordData.newPassword}
            >
              <Save className="w-3.5 h-3.5" />
              {changingPassword ? 'Updating…' : 'Update password'}
            </AdminButton>
          </div>
        </div>
      </div>
    </m.div>
  );
}
