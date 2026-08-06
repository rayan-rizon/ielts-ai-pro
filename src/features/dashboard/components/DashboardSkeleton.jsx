import React from 'react';
import { PANEL } from './primitives';
import { cn } from '@/lib/cn';

const Block = ({ className }) => (
  <div className={cn('animate-pulse rounded bg-[#eceafa] dark:bg-white/6', className)} />
);

/**
 * Mirrors the real layout's proportions so the page doesn't reflow when data
 * lands — same page background, same grid, same panel heights.
 */
export default function DashboardSkeleton() {
  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_82%_-4%,rgba(224,220,255,0.42),transparent_34%),#f8f8fc] px-3 py-4 pb-10 dark:bg-[#08080a] sm:px-4 md:px-5 md:py-5">
      <div className="mx-auto max-w-[1440px] space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Block className="h-2.5 w-32" />
            <Block className="h-7 w-44" />
            <Block className="h-3 w-56" />
          </div>
          <Block className="h-8 w-40 rounded-md" />
        </div>

        {/* Stat band */}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={cn(PANEL, 'space-y-1.5 px-3 py-2')}>
              <Block className="h-2.5 w-20" />
              <Block className="h-4 w-12" />
              <Block className="h-2.5 w-24" />
            </div>
          ))}
        </div>

        {/* Main grid — mirrors DashboardGrid row for row */}
        <div className="grid grid-cols-12 gap-3">
          {/* Row: module meters · band trajectory · next up */}
          <div className={cn(PANEL, 'col-span-12 space-y-2 p-4 lg:col-span-5')}>
            <Block className="mb-3 h-2.5 w-28" />
            {Array.from({ length: 4 }).map((_, index) => (
              <Block key={index} className="h-8 rounded-md" />
            ))}
          </div>

          <div className={cn(PANEL, 'col-span-12 p-4 md:col-span-7 lg:col-span-4')}>
            <Block className="mb-3 h-2.5 w-32" />
            <Block className="h-[160px] rounded-md" />
          </div>

          <div className={cn(PANEL, 'col-span-12 space-y-2.5 p-4 md:col-span-5 lg:col-span-3')}>
            <Block className="mb-3 h-2.5 w-16" />
            {Array.from({ length: 3 }).map((_, index) => (
              <Block key={index} className="h-11 rounded-lg" />
            ))}
          </div>

          {/* Row: question types · weekly volume · vocabulary */}
          <div className={cn(PANEL, 'col-span-12 space-y-2 p-4 lg:col-span-5')}>
            <Block className="mb-3 h-2.5 w-36" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Block key={index} className="h-8 rounded-md" />
            ))}
          </div>

          <div className={cn(PANEL, 'col-span-12 p-4 md:col-span-7 lg:col-span-4')}>
            <Block className="mb-3 h-2.5 w-32" />
            <Block className="h-[160px] rounded-md" />
          </div>

          <div className={cn(PANEL, 'col-span-12 p-4 md:col-span-5 lg:col-span-3')}>
            <Block className="mb-3 h-2.5 w-24" />
            <div className="flex items-center gap-4">
              <Block className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2.5">
                <Block className="h-6 w-16" />
                <Block className="h-6 w-16" />
              </div>
            </div>
          </div>

          {/* Row: attempt log · practice history */}
          <div className={cn(PANEL, 'col-span-12 space-y-2 p-4 lg:col-span-5')}>
            <Block className="mb-3 h-2.5 w-32" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Block key={index} className="h-11 rounded-lg" />
            ))}
          </div>

          <div className={cn(PANEL, 'col-span-12 p-4 lg:col-span-7')}>
            <Block className="mb-3 h-2.5 w-36" />
            <Block className="h-[140px] rounded-md" />
          </div>

          {/* Row: Cambridge library */}
          <div className={cn(PANEL, 'col-span-12 p-4')}>
            <Block className="mb-3 h-2.5 w-40" />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Block key={index} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Row: study resources */}
          <div className={cn(PANEL, 'col-span-12 p-4')}>
            <Block className="mb-3 h-2.5 w-32" />
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Block key={index} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
