import React from 'react';
import { MICRO, MUTED } from '@/features/dashboard/components/primitives.jsx';
import { ReiconUsers } from '@/components/ui/reicon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '../utils/avatar';
import { cn } from '@/lib/cn';

export default function PairedEntryDuoPreview({ studentName, studentAvatarUrl, invitation }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[#e4e2f2] bg-[#f8f7fd] p-2 dark:border-white/[0.08] dark:bg-white/[0.03]">
      {/* Slot 1: You */}
      <div className="flex items-center gap-2.5 rounded-lg border border-[#e2dff2] bg-white p-2.5 shadow-2xs dark:border-white/10 dark:bg-[#15141c]">
        <div className="relative">
          <Avatar className="h-8 w-8 shrink-0 border border-[#5a63df]/30 ring-1 ring-[#5a63df]/20">
            <AvatarImage
              src={studentAvatarUrl}
              alt={studentName}
              className="aspect-square h-full w-full object-cover"
            />
            <AvatarFallback className="bg-[#5a63df]/15 text-[11px] font-bold text-[#5a63df] dark:bg-[#8f97ff]/20 dark:text-[#afb5ff]">
              {initials(studentName)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[rgb(var(--signal-ok))] ring-2 ring-white dark:ring-[#15141c]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
            {studentName}
          </p>
          <p className={cn(MICRO, 'text-[8px] text-[#5a63df] dark:text-[#afb5ff]')}>
            {invitation ? 'Ready to join' : 'Host (You)'}
          </p>
        </div>
      </div>

      {/* Slot 2: Study Partner */}
      <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-300 bg-white/60 p-2.5 dark:border-white/15 dark:bg-white/[0.02]">
        <div className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-slate-300 text-slate-400 dark:border-white/20">
          <ReiconUsers className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
            {invitation ? 'Inviting Partner' : 'Study Partner'}
          </p>
          <p className={cn(MICRO, MUTED, 'text-[8px]')}>
            {invitation ? 'Waiting in lobby' : 'Awaiting invite link'}
          </p>
        </div>
      </div>
    </div>
  );
}
