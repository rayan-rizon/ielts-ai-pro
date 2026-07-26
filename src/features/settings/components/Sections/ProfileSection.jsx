import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import {
  User,
  Sparkles,
  Sliders,
  Palette,
  Sun,
  Moon,
  Laptop,
  BookOpen,
  Shield,
  CheckCircle2,
  Mail,
} from 'lucide-react';

export default function ProfileSection({ formData, setFormData, avatars, theme, setTheme }) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left Column: Personal Info & Avatar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
          {/* Personal Info Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Account Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Manage your personal display name & account email.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Full Name
              </Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 px-4 font-semibold text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Email Address
                </Label>
                <span className="text-[11px] text-slate-400 font-medium">(Read Only)</span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  value={formData.email}
                  disabled
                  className="h-11 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 pl-10 pr-4 font-semibold text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Profile Avatar Selection */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Profile Avatar</h4>
              </div>
              <span className="text-xs font-medium text-slate-400">Pick avatar</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {avatars.map((url) => {
                const isSelected = formData.avatar_url === url;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_url: url })}
                    className={cn(
                      'relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden transition-all duration-300 active:scale-95 group',
                      isSelected
                        ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-md shadow-indigo-500/25'
                        : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100 border border-slate-200 dark:border-white/10 hover:scale-105'
                    )}
                  >
                    <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Appearance & Testing Preferences */}
        <div className="space-y-5">
          {/* Appearance & Theme Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Appearance & Theme
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Choose your preferred visual mode.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Laptop },
              ].map(({ id: t, label, icon: Icon }) => {
                const isSelected = theme === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme && setTheme(t)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 h-20 rounded-xl border transition-all text-sm font-semibold relative overflow-hidden group',
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 font-bold'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 hover:border-indigo-500/30 hover:bg-slate-100/80 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isSelected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'
                      )}
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Test Mode Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Default Test Mode
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Starting mode for test module attempts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'practice',
                  label: 'Practice Mode',
                  desc: 'Untimed practice with instant feedback',
                  icon: BookOpen,
                },
                {
                  id: 'exam',
                  label: 'Exam Mode',
                  desc: 'Timed mock exam under test conditions',
                  icon: Shield,
                },
              ].map((mode) => {
                const isSelected = formData.default_test_mode === mode.id;
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, default_test_mode: mode.id })}
                    className={cn(
                      'flex flex-col text-left p-4 rounded-xl border transition-all relative overflow-hidden group',
                      isSelected
                        ? 'bg-indigo-600/10 dark:bg-indigo-500/15 border-indigo-600 dark:border-indigo-400 shadow-sm'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            'w-4 h-4',
                            isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm font-bold',
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-900 dark:text-white'
                          )}
                        >
                          {mode.label}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
                      {mode.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
