import React from 'react';
import { SectionCard } from './SectionCard';

export const PassagePerformanceSection = React.memo(({ testResults, testType }) => (
  <section data-oid="lb4:2zx">
    <div className="flex items-center justify-between mb-4 px-1" data-oid="sfruxdo">
      <h3
        className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-[0.15em]"
        data-oid="_u840yb"
      >
        {testType === 'listening' ? 'Part Performance' : 'Passage Performance'}
      </h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-oid="vxlb5m2">
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
