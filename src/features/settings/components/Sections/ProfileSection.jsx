import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

export default function ProfileSection({ formData, setFormData, avatars }) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-slate-200 dark:border-white/5">
        <h3 className="text-xl font-black mb-1">Avatar</h3>
        <p className="text-sm text-slate-500 mb-6 font-medium">Pick an image for your profile.</p>
        <div className="flex flex-wrap gap-5">
          {avatars.map((url) => (
            <button
              key={url}
              onClick={() => setFormData({ ...formData, avatar_url: url })}
              className={cn(
                'relative w-16 h-16 xs:w-20 xs:h-20 md:w-24 md:h-24 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden transition-all duration-500 active:scale-90 group',
                formData.avatar_url === url
                  ? 'ring-4 ring-indigo-500 ring-offset-4 dark:ring-offset-[#020617] scale-110 shadow-2xl shadow-indigo-500/40'
                  : 'grayscale opacity-40 hover:grayscale-0 hover:opacity-100 border-2 border-slate-100 dark:border-white/5 hover:scale-105'
              )}
            >
              <img src={url} alt="Avatar" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-slate-200 dark:border-white/5">
        <h3 className="text-xl font-black mb-1">Basic Info</h3>
        <p className="text-sm text-slate-500 mb-6 font-medium">Update your name and email.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Full Name
            </Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="h-14 rounded-2xl bg-white/50 dark:bg-slate-950/30 border-slate-200 dark:border-white/10 px-6 font-black text-lg focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all outline-none"
              placeholder="Your real name"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Email (Read Only)
            </Label>
            <Input
              value={formData.email}
              disabled
              className="h-14 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-white/10 px-6 font-bold text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
