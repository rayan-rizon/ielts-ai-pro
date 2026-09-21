import React from 'react';
import ChevronLeft from 'lucide-react/icons/chevron-left';
import ChevronRight from 'lucide-react/icons/chevron-right';

import { MICRO, MUTED } from '@/features/dashboard/components/primitives';

/**
 * Which page numbers to show around the current page, plus the first and
 * last page with a gap marker between them when they are not adjacent. A
 * full run of 1..N would wrap awkwardly once the dataset (and so the page
 * count) grows, which is the exact problem this component exists to solve.
 */
function buildPageList(page, totalPages) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) items.push('gap');
    items.push(p);
    previous = p;
  }
  return items;
}

const ARROW_BUTTON =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-[#f4f3fb] hover:text-[#5a63df] disabled:pointer-events-none disabled:opacity-30 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-violet-300';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pageItems = buildPageList(page, totalPages);

  return (
    <nav aria-label="University results pages" className="flex flex-col items-center gap-2 pt-2">
      {/*
        One compact pill, centered — not spread edge-to-edge with prev/next
        pinned to the panel's corners. On a wide desktop column that earlier
        layout left a dead gap of empty space between the arrows and the page
        numbers, which read as broken rather than just plain.
      */}
      <div className="inline-flex items-center gap-0.5 rounded-2xl border border-[#e4e2f0] bg-white p-1 shadow-2xs dark:border-white/10 dark:bg-[#16151e]">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={ARROW_BUTTON}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-0.5 px-0.5">
          {pageItems.map((item, index) =>
            item === 'gap' ? (
              <span
                key={`gap-${index}`}
                className={`flex h-8 w-6 items-center justify-center text-xs font-bold ${MUTED}`}
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums transition-colors ${
                  item === page
                    ? 'bg-[#5a63df] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-violet-300'
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={ARROW_BUTTON}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>

      <span className={`text-[10.5px] font-bold uppercase tracking-wider ${MICRO} ${MUTED}`}>
        Page {page} of {totalPages}
      </span>
    </nav>
  );
}
