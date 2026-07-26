import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Palette, Sun, Moon, Laptop, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function SecuritySection({
  passwordData,
  setPasswordData,
  isUpdatingPassword,
  handleUpdatePassword,
  theme,
  setTheme,
  setShowDeleteModal,
}) {
  return (
    <motion.div
      key="account"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Password Update Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 dark:border-white/5">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              New Password
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 px-4 font-medium text-sm focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Confirm Password
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 px-4 font-medium text-sm focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-start">
          <Button
            onClick={handleUpdatePassword}
            disabled={isUpdatingPassword || !passwordData.newPassword}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10 px-5 rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all text-sm border-0"
          >
            {isUpdatingPassword ? <Clock className="w-4 h-4 animate-spin mr-2" /> : null}
            Update Password
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-rose-600">Danger Zone</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Permanently delete your account and all IELTS progress history.
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteModal(true)}
          className="rounded-xl font-semibold px-5 h-10 shadow-md shadow-rose-500/20 active:scale-95 transition-all border-0 text-sm shrink-0"
        >
          Delete Account
        </Button>
      </div>
    </motion.div>
  );
}
