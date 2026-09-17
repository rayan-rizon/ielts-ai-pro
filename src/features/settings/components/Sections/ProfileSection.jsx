import React from 'react';
import { m } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { BookOpen, Check, Laptop, Mail, Moon, Shield, Sun, User } from 'lucide-react';
import { IconChip, MUTED, PANEL, PanelTitle } from '@/features/dashboard/components/primitives';

const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Laptop },
];

const TEST_MODES = [
  {
    id: 'practice',
    label: 'Practice mode',
    desc: 'Untimed practice with instant feedback',
    icon: BookOpen,
  },
  { id: 'exam', label: 'Exam mode', desc: 'Timed mock exam under test conditions', icon: Shield },
];

export default function ProfileSection({ formData, setFormData, avatars, theme, setTheme }) {
  return (
    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
      {/* Left Column: Personal Info & Avatar */}
      <div className={cn(PANEL, 'p-4 sm:p-5')}>
        <PanelTitle label="Account details" accent />
        <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>
          Manage your personal display name & account email.
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Full name
            </Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="h-10 rounded-lg border-[#e2e5f2] bg-white text-sm font-semibold dark:border-white/10 dark:bg-white/4"
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Email address
              </Label>
              <span className="text-[10px] font-medium text-slate-400">(Read only)</span>
            </div>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={formData.email}
                disabled
                className="h-10 cursor-not-allowed rounded-lg border-[#e2e5f2] bg-[#f4f3fb] pl-9 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/2"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-[#eeedf7] pt-4 dark:border-white/[0.07]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconChip icon={User} size="sm" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Profile avatar
              </h4>
            </div>
            <span className={cn('text-xs font-medium', MUTED)}>Pick avatar</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {avatars.map((url) => {
              const isSelected = formData.avatar_url === url;
              return (
                <div key={url} className="relative">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_url: url })}
                    className={cn(
                      'group relative h-14 w-14 overflow-hidden rounded-xl transition-all duration-200 active:scale-[0.96] sm:h-16 sm:w-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                      isSelected
                        ? 'border-2 border-[#5a63df] shadow-md shadow-[#5a63df]/15 ring-2 ring-[#5a63df]/20 ring-offset-2 ring-offset-white dark:ring-offset-[#131315]'
                        : 'border border-[#e4e2f0] hover:border-[#5a63df]/40 hover:shadow-2xs dark:border-white/10 dark:hover:border-white/25'
                    )}
                  >
                    <img
                      src={url}
                      alt="Avatar option"
                      className={cn(
                        'h-full w-full object-cover transition-transform duration-200',
                        !isSelected && 'group-hover:scale-105'
                      )}
                    />
                  </button>

                  {isSelected && (
                    <m.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#5a63df] text-white shadow-xs ring-2 ring-white dark:ring-[#141319]"
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </m.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Appearance & Testing Preferences */}
      <div className="space-y-3">
        <div className={cn(PANEL, 'p-4 sm:p-5')}>
          <PanelTitle label="Appearance & theme" accent />
          <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>
            Choose your preferred visual mode.
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {THEMES.map(({ id, label, icon: Icon }) => {
              const isSelected = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme && setTheme(id)}
                  className={cn(
                    'relative flex h-[72px] flex-col items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                    isSelected
                      ? 'border-[#5a63df] bg-[#5a63df]/9 text-[#434ac9] dark:border-[#5a63df] dark:bg-[#5a63df]/18 dark:text-[#c3c7ff] shadow-xs'
                      : 'border-[#e2e5f2] bg-[#fbfbfe] text-slate-600 hover:border-[#c9cdf3] hover:bg-white dark:border-white/10 dark:bg-white/3 dark:text-slate-300 dark:hover:border-white/20'
                  )}
                >
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-[#5a63df]" />
                  )}
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-150',
                      isSelected ? 'text-[#5a63df] dark:text-[#a5adff]' : 'text-slate-400'
                    )}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={cn(PANEL, 'p-4 sm:p-5')}>
          <PanelTitle label="Default test mode" accent />
          <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>
            Starting mode for test module attempts.
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {TEST_MODES.map((mode) => {
              const isSelected = formData.default_test_mode === mode.id;
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, default_test_mode: mode.id })}
                  className={cn(
                    'relative flex flex-col rounded-xl border p-3.5 text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                    isSelected
                      ? 'border-[#5a63df] bg-[#5a63df]/8 text-slate-900 dark:border-[#5a63df] dark:bg-[#5a63df]/16 dark:text-white shadow-xs'
                      : 'border-[#e2e5f2] bg-[#fbfbfe] hover:border-[#c9cdf3] hover:bg-white dark:border-white/10 dark:bg-white/3 dark:hover:border-white/20'
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isSelected ? 'text-[#5a63df]' : 'text-slate-400'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-bold',
                          isSelected
                            ? 'text-[#434ac9] dark:text-[#c3c7ff]'
                            : 'text-slate-900 dark:text-white'
                        )}
                      >
                        {mode.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5a63df] text-white">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className={cn('text-xs font-medium leading-normal', MUTED)}>{mode.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
