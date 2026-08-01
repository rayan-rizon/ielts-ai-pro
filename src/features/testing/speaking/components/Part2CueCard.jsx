import React from 'react';
import { FileText, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MICRO, MUTED } from '@/features/dashboard/components/primitives';

function cleanPoint(point) {
  return String(point || '')
    .replace(/^[•\-–—]\s*/, '')
    .trim();
}

function isSectionLabel(point) {
  return /^you should say:?$/i.test(point);
}

const Part2CueCard = React.memo(({ cueCardTopic }) => {
  const points = (cueCardTopic?.bulletPoints || []).map(cleanPoint).filter(Boolean);
  const prompt = points[0] || 'Describe the topic on your card.';
  const talkingPoints = points.slice(1).filter((point) => !isSectionLabel(point));

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-2xl"
      aria-label="Part 2 topic card"
    >
      <div className="overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-b from-white to-[#faf9ff] shadow-[0_22px_55px_-36px_hsl(350_80%_50%/0.45)] dark:from-[#141319] dark:to-[#100f15]">
        <div className="flex items-center justify-between gap-4 border-b border-rose-500/10 bg-rose-500/[0.045] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className={cn(MICRO, 'text-rose-600 dark:text-rose-400')}>Part 2 topic card</p>
              <p className={cn(MUTED, 'mt-0.5 text-xs font-semibold')}>Individual long turn</p>
            </div>
          </div>
          <Badge className="shrink-0 border border-rose-500/15 bg-white px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-rose-600 shadow-sm dark:bg-white/[0.04] dark:text-rose-400">
            IELTS
          </Badge>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <p className={cn(MICRO, MUTED, 'mb-2')}>Describe</p>
            <p className="text-lg font-extrabold leading-7 tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
              {prompt}
            </p>
          </div>

          {talkingPoints.length > 0 && (
            <div className="border-t border-[#e4e2f0] pt-4 dark:border-white/[0.07]">
              <div className="mb-3 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-rose-500" aria-hidden="true" />
                <p className={cn(MICRO, MUTED)}>You should say</p>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {talkingPoints.map((point, index) => (
                  <li
                    key={`${point}-${index}`}
                    className="flex items-start gap-2.5 rounded-xl border border-[#ebeaf7] bg-[#fbfbfe] px-3 py-2.5 text-sm font-semibold leading-5 text-slate-800 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
});

Part2CueCard.displayName = 'Part2CueCard';
export default Part2CueCard;
