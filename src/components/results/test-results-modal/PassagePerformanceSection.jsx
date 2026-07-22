import React from 'react';
import { SectionCard } from './SectionCard';
import { Layers } from 'lucide-react';

export const PassagePerformanceSection = React.memo(({ testResults, testType }) => (
  <section data-oid="lb4:2zx" className="space-y-2.5">
    <div className="flex items-center justify-between px-1" data-oid="sfruxdo">
      <div className="flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <h3
          className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider"
          data-oid="_u840yb"
        >
          {testType === 'listening' ? 'Part Performance' : 'Passage Breakdown'}
        </h3>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-oid="vxlb5m2">
      {testResults.sectionStats?.map((stat, idx) => (
        <SectionCard
          key={idx}
          index={idx}
          title={testType === 'listening' ? `Part ${idx + 1}` : `Passage ${idx + 1}`}
          {...stat}
          data-oid="43690.f"
        />
      ))}
    </div>
  </section>
));


PassagePerformanceSection.displayName = 'PassagePerformanceSection';
