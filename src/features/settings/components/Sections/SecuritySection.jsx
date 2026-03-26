import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Palette, Smartphone, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Security Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-white/5">
        <h3 className="text-xl font-black mb-4 text-indigo-600 dark:text-indigo-400">Password</h3>
        <div className="space-y-6 max-w-md">
          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">
              New Password
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="h-14 rounded-2xl bg-white/50 dark:bg-slate-950/30 border-slate-200 dark:border-white/10 px-6 font-bold focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">
              Confirm Password
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              className="h-14 rounded-2xl bg-white/50 dark:bg-slate-950/30 border-slate-200 dark:border-white/10 px-6 font-bold focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <Button
            onClick={handleUpdatePassword}
            disabled={isUpdatingPassword || !passwordData.newPassword}
            className="w-full bg-slate-950 dark:bg-white dark:text-slate-950 text-white font-black h-14 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-base border-0"
          >
            {isUpdatingPassword ? <Clock className="animate-spin" /> : 'Update Password'}
          </Button>
        </div>
      </div>

      {/* Visual Mode Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 dark:border-white/5 max-w-2xl">
        <h3 className="text-lg font-black mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark', 'system'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 font-black transition-all uppercase tracking-widest text-[9px]',
                theme === t
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/30'
                  : 'border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:border-indigo-500/30'
              )}
            >
              {t === 'light' && <Palette className="w-5 h-5" />}
              {t === 'dark' && <Smartphone className="w-5 h-5" />}
              {t === 'system' && <Layout className="w-5 h-5" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h4 className="text-xl font-black text-rose-600">Danger Zone</h4>
          <p className="text-sm text-rose-500/70 font-medium max-w-sm mt-1 leading-relaxed">
            Deleting your account is permanent and cannot be undone. All your progress will be lost.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteModal(true)}
          className="rounded-2xl font-black px-8 h-12 shadow-2xl shadow-rose-500/20 active:scale-95 transition-all border-0 text-sm"
        >
          Delete Account
        </Button>
      </div>
    </motion.div>
  );
}
