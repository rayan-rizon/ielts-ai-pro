import React from 'react';
import { CheckCircle2, Gauge, Search, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
} from '@/features/dashboard/components/primitives';
import LockedFeature from './LockedFeature';
import { EvidencePriorityItem, SectionHeading, StatMiniCard } from './SharedHelpers';

export default function SmartFeedbackCard({ stats, isPremium }) {
  const evidence = stats?.evidenceSummary;
  const measured = evidence?.measuredPriorities || [];
  const rawEarly = evidence?.earlySignals || [];
  const measuredCodes = new Set(measured.map((item) => item.skillCode || item.module));
  const early = rawEarly.filter((item) => !measuredCodes.has(item.skillCode || item.module));
  const hasEvidence = Boolean(evidence);

  return (
    <section className={cn(PANEL, 'flex h-[360px] flex-col p-4')}>
      <PanelTitle
        label="Focus areas"
        tip="Skills your graded answers keep flagging. 'Confirmed' means enough evidence to act on; 'Needs results' means it is still a hunch."
        action={!isPremium ? <Pill tone="amber">Pro</Pill> : null}
      />

      <LockedFeature isLocked={!isPremium} compact className="flex-1">
        <div className="-mr-1 h-full space-y-2.5 overflow-y-auto pr-1">
          {hasEvidence ? (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                <StatMiniCard icon={Target} label="Confidence" value={evidence.confidenceLabel} />
                <StatMiniCard
                  icon={CheckCircle2}
                  label="Confirmed"
                  value={evidence.counts?.measured || 0}
                />
                <StatMiniCard
                  icon={Search}
                  label="Provisional"
                  value={evidence.counts?.early || 0}
                />
              </div>

              {measured.length > 0 && (
                <div className="space-y-1.5">
                  <SectionHeading icon={Target} label="Confirmed focus" subLabel="Recurring" />
                  {measured.slice(0, 2).map((item) => (
                    <EvidencePriorityItem key={item.skillCode || item.module} item={item} />
                  ))}
                </div>
              )}

              {early.length > 0 && (
                <div className="space-y-1.5">
                  <SectionHeading icon={Search} label="Needs more results" />
                  {early.slice(0, 2).map((item) => (
                    <EvidencePriorityItem key={item.skillCode || item.module} item={item} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <Empty icon={Gauge}>
              Complete a scored test, then refresh your Learning Path to see confirmed focus areas.
            </Empty>
          )}
        </div>
      </LockedFeature>

      <PanelFootnote>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Derived from graded answers, not predictions.
        </span>
      </PanelFootnote>
    </section>
  );
}
