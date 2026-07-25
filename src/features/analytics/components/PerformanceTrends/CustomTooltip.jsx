import React from 'react';
import { formatBand } from '../../utils';

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload?.[0]?.value;
  return (
    <div
      className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl border-opacity-50 min-w-[140px]"
      data-oid="qdrn1w5"
    >
      <div className="text-sm font-black text-primary tracking-[0.2em] mb-1" data-oid="05wp2d7">
        {label}
      </div>
      <div className="flex items-baseline gap-1" data-oid=":880-cr">
        <span className="text-xl font-black text-foreground dark:text-white" data-oid="dgefpjn">
          {formatBand(val)}
        </span>
        <span className="text-sm font-bold text-muted-foreground/90" data-oid="wfhq1l6">
          Score
        </span>
      </div>
    </div>
  );
}
