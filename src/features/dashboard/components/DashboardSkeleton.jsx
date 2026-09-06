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
    <main className="min-h-full bg-[#f8f8fb] px-3 py-4 pb-10 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
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

        {/* Stat band — 5 tiles, 5th spans 2 cols on mobile */}
        <div className="grid grid-cols-2 gap-1.5 [&>*:last-child]:col-span-2 lg:grid-cols-5 lg:[&>*:last-child]:col-span-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={cn(PANEL, 'space-y-1.5 px-3 py-2')}>
              <Block className="h-2.5 w-20" />
              <Block className="h-5 w-14" />
              <Block className="h-2.5 w-24" />
            </div>
          ))}
        </div>

        {/* Main grid — mirrors DashboardGrid row for row */}
        <div className="grid grid-cols-12 gap-3">
          {/* Row 1: module meters (5 cols) · band trajectory (4 cols) · next up (3 cols) */}
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

          {/* Row 2: skill mastery (5 cols) · weekly volume (4 cols) · overall band (3 cols) */}
          <div className={cn(PANEL, 'col-span-12 space-y-2 p-4 lg:col-span-5')}>
            <Block className="mb-3 h-2.5 w-36" />
            {Array.from({ length: 4 }).map((_, index) => (
              <Block key={index} className="h-8 rounded-md" />
            ))}
          </div>

          <div className={cn(PANEL, 'col-span-12 p-4 md:col-span-7 lg:col-span-4')}>
            <Block className="mb-3 h-2.5 w-32" />
            <Block className="h-[160px] rounded-md" />
          </div>

          {/* OverallBandPanel skeleton: band score numeral + target comparison + module breakdown */}
          <div className={cn(PANEL, 'col-span-12 space-y-3 p-4 md:col-span-5 lg:col-span-3')}>
            <Block className="mb-1 h-2.5 w-24" />
            <div className="flex items-baseline gap-2">
              <Block className="h-9 w-16 rounded" />
              <Block className="h-3 w-28" />
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Block key={index} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Row 3: Session log (8 cols) · Engagement heatmap (4 cols) */}
          <div className={cn(PANEL, 'col-span-12 space-y-2 p-4 lg:col-span-8')}>
            <Block className="mb-3 h-2.5 w-32" />
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Block key={index} className="h-14 rounded-lg" />
              ))}
            </div>
          </div>

          <div className={cn(PANEL, 'col-span-12 space-y-3 p-4 lg:col-span-4')}>
            <Block className="mb-3 h-2.5 w-36" />
            <Block className="h-[140px] rounded-md" />
          </div>

          {/* Row 4: Cambridge library (12 cols) */}
          <div className={cn(PANEL, 'col-span-12 p-4')}>
            <Block className="mb-3 h-2.5 w-40" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Block key={index} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Row 5: Study resources hub (12 cols, 2 sub-columns for videos & guides) */}
          <div className={cn(PANEL, 'col-span-12 p-4')}>
            <Block className="mb-3 h-2.5 w-32" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <Block className="h-3 w-24" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <Block key={index} className="h-14 rounded-lg" />
                ))}
              </div>
              <div className="space-y-2">
                <Block className="h-3 w-24" />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Block key={index} className="h-14 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
