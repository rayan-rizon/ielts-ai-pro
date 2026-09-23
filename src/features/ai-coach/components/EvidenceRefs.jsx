import React from 'react';
import { BookOpenCheck, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO } from '@/features/dashboard/components/primitives';
import { formatEvidenceReference } from '../utils/evidenceReferences.js';

export function EvidenceRefs({ refs = [] }) {
  if (!refs.length) return null;

  return (
    <section
      className="mt-4 border-t border-[#e4e2f0] pt-3 dark:border-white/[0.07]"
      aria-label="Evidence used"
      dir="ltr"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <ShieldCheck
          className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#aeb3ff]"
          aria-hidden="true"
        />
        <span className={cn(MICRO, 'text-slate-500 dark:text-slate-400')}>Learning evidence</span>
        <span className="ml-auto text-[10px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
          {refs.length} {refs.length === 1 ? 'source' : 'sources'}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {refs.map((ref) => {
          const { claim, title, details } = formatEvidenceReference(ref);
          return (
            <li
              key={`${ref.id}-${claim}`}
              title={claim}
              className="flex min-w-0 items-start gap-2 rounded-lg border border-[#e4e2f0] bg-[#faf9ff] px-2.5 py-2 transition-colors duration-150 hover:border-[#5a63df]/30 dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:border-white/[0.14]"
            >
              <BookOpenCheck
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#aeb3ff]"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[11px] font-bold leading-4 text-slate-700 dark:text-slate-200">
                  {title}
                </span>
                {details.length ? (
                  <span className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                    {details.map((detail) => (
                      <span key={detail}>{detail}</span>
                    ))}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
