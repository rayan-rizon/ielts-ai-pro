import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, TILE } from '@/features/dashboard/components/primitives';
import { evidenceResultPath, formatEvidenceReference } from '../utils/evidenceReferences.js';

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
          const path = evidenceResultPath(ref, title);
          return (
            <li
              key={`${ref.id}-${claim}`}
              title={claim}
              className={cn(TILE, 'flex min-w-0 items-start gap-2 px-2.5 py-2')}
            >
              <BookOpenCheck
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#aeb3ff]"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[11px] font-bold leading-4 text-slate-700 dark:text-slate-200">
                  {path ? (
                    <Link
                      to={path}
                      aria-label={`Open ${title}`}
                      className="inline-flex items-center gap-1 text-[#4149bb] underline underline-offset-2 dark:text-[#c3c7ff]"
                    >
                      {title}
                      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                    </Link>
                  ) : (
                    title
                  )}
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
