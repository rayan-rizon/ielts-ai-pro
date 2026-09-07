import React from 'react';
import { cn } from '@/lib/cn';
import { PANEL } from '@/features/dashboard/components/primitives.jsx';

export default function RoomLoading() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 p-4 sm:p-6" aria-label="Loading study room">
      <div className={cn(PANEL, 'h-44 animate-pulse')} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn(PANEL, 'h-56 animate-pulse')} />
        <div className={cn(PANEL, 'h-56 animate-pulse')} />
      </div>
    </div>
  );
}
