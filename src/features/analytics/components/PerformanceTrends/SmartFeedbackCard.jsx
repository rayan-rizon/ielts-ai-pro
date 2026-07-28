import React from 'react';
import { CheckCircle2, Search, Target, Gauge } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EmptyAnalyticsState from '../EmptyAnalyticsState';
import LockedFeature from './LockedFeature';
import { EvidencePriorityItem, SectionHeading, StatMiniCard } from './SharedHelpers';

export default function SmartFeedbackCard({ stats, isPremium }) {
  const evidence = stats?.evidenceSummary;
  const measured = evidence?.measuredPriorities || [];
  const early = evidence?.earlySignals || [];
  const hasEvidence = Boolean(evidence);

  return (
    <Card
      className="flex h-[360px] flex-col overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950"
      data-oid="u_amfu5"
    >
      <CardHeader className="px-4 pb-1 pt-3.5 sm:px-4.5" data-oid="-4_zzio">
        <div className="flex items-center justify-between gap-3" data-oid="qub627-">
          <div className="flex items-center gap-2.5 min-w-0" data-oid="8y3-bj0">
            <div
              className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
              data-oid="w5:00go"
            >
              <Target className="h-3.5 w-3.5" data-oid="gjwp5w4" />
            </div>
            <div className="min-w-0" data-oid="7tzifoi">
              <CardTitle
                className="text-base font-black tracking-tight text-slate-950 dark:text-white"
                data-oid="e2-32.."
              >
                Smart Feedback
              </CardTitle>
              <CardDescription
                className="text-[11px] font-medium text-slate-500 truncate"
                data-oid="m_l7ys7"
              >
                Personalized tips for you
              </CardDescription>
            </div>
          </div>
          {!isPremium && (
            <Badge
              className="rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[9.5px] font-extrabold uppercase text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
              data-oid="r6a_lzr"
            >
              Pro Feature
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 relative" data-oid="8twiya3">
        <LockedFeature isLocked={!isPremium} compact className="h-full" data-oid="4u8r4z1">
          <div
            className="px-3.5 pb-3 pt-1 sm:px-4.5 space-y-2.5 overflow-y-auto h-full scrollbar-thin"
            data-oid="inner-content"
          >
            {hasEvidence ? (
              <>
                <div className="grid grid-cols-3 gap-1.5" data-oid="-lufzwo">
                  <StatMiniCard
                    icon={Target}
                    label="Confidence"
                    value={evidence.confidenceLabel}
                    data-oid="dgo-bc1"
                  />

                  <StatMiniCard
                    icon={CheckCircle2}
                    label="Measured"
                    value={evidence.counts?.measured || 0}
                    data-oid="3iltfcq"
                  />

                  <StatMiniCard
                    icon={Search}
                    label="Early"
                    value={evidence.counts?.early || 0}
                    data-oid="rry8.95"
                  />
                </div>

                {measured.length > 0 && (
                  <div className="space-y-1.5" data-oid="ms_lc-0">
                    <SectionHeading
                      icon={Target}
                      label="Measured Priorities"
                      subLabel="Recurring"
                      data-oid="5gk2v.7"
                    />

                    <div className="space-y-1.5" data-oid="amgi65c">
                      {measured.slice(0, 2).map((item) => (
                        <EvidencePriorityItem key={item.skillCode} item={item} data-oid="vt16-si" />
                      ))}
                    </div>
                  </div>
                )}

                {early.length > 0 && (
                  <div className="space-y-1.5 pt-0.5" data-oid="kwphww6">
                    <SectionHeading
                      icon={Search}
                      label="Keep Measuring"
                      color="text-indigo-600 dark:text-indigo-400"
                      data-oid="syzg9fg"
                    />

                    <div className="space-y-1.5" data-oid="ovu97pz">
                      {early.slice(0, 2).map((item) => (
                        <EvidencePriorityItem key={item.skillCode} item={item} data-oid="oh6it06" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyAnalyticsState
                icon={Gauge}
                title="Evidence Pending"
                description="Refresh your Learning Path after a scored test to classify measured priorities and early signals."
                compact
                data-oid="0e1mw:5"
              />
            )}
          </div>
        </LockedFeature>
      </CardContent>
    </Card>
  );
}
