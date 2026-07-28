import React from 'react';
import { formatBand } from '../../utils';

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload?.[0]?.value;

  return (
    <div className="rounded-lg border border-slate-200/90 bg-white/95 px-2.5 py-1 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 pointer-events-none">
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4f46e5] shrink-0" />
        <span className="font-extrabold text-slate-700 dark:text-slate-300">{label}:</span>
        <span className="font-black text-slate-950 dark:text-white">Band {formatBand(val)}</span>
      </div>
    </div>
  );
}
