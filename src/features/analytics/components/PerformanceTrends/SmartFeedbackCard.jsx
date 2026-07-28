import React from 'react';
import { CheckCircle2, Search, Target, Gauge, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EmptyAnalyticsState from '../EmptyAnalyticsState';
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
    <Card className="flex h-[360px] flex-col overflow-hidden rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)]">
      <CardHeader className="px-4 pb-2 pt-4 sm:px-5 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs">
              <Sparkles className="h-4.5 w-4.5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                Smart Feedback
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-slate-500 truncate">
                Personalized tips for you
              </CardDescription>
            </div>
          </div>
          {!isPremium && (
            <Badge className="rounded-full border-0 bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
              Pro Feature
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 relative">
        <LockedFeature isLocked={!isPremium} compact className="h-full">
          <div className="px-3.5 pb-3.5 pt-2 sm:px-4.5 space-y-2.5 overflow-y-auto h-full scrollbar-thin">
            {hasEvidence ? (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  <StatMiniCard icon={Target} label="How sure" value={evidence.confidenceLabel} />

                  <StatMiniCard
                    icon={CheckCircle2}
                    label="Confirmed"
                    value={evidence.counts?.measured || 0}
                  />

                  <StatMiniCard
                    icon={Search}
                    label="Need results"
                    value={evidence.counts?.early || 0}
                  />
                </div>

                {measured.length > 0 && (
                  <div className="space-y-1.5">
                    <SectionHeading icon={Target} label="Confirmed focus" subLabel="Recurring" />

                    <div className="space-y-1.5">
                      {measured.slice(0, 2).map((item) => (
                        <EvidencePriorityItem key={item.skillCode || item.module} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {early.length > 0 && (
                  <div className="space-y-1.5 pt-0.5">
                    <SectionHeading icon={Search} label="Needs more results" />

                    <div className="space-y-1.5">
                      {early.slice(0, 2).map((item) => (
                        <EvidencePriorityItem key={item.skillCode || item.module} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyAnalyticsState
                icon={Gauge}
                title="More results needed"
                description="Complete a scored test, then refresh your Learning Path to see confirmed focus areas."
                compact
              />
            )}
          </div>
        </LockedFeature>
      </CardContent>
    </Card>
  );
}
