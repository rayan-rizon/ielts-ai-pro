import React, { useMemo } from 'react';
import { OverallScoreRing, CoachSummaryCard, PerformanceMetricsPanel } from './ScoreSection';
import {
  PronunciationBreakdownSection,
  StrengthsSection,
  ImprovementsSection,
} from './FeedbackSections';
import PartByPartSection from './PartByPartSection';
import { buildSpeakingReportSummary } from '../utils/speakingReportSummary';
import { cn } from '@/lib/cn';
import { MUTED, PANEL, Pill, TITLE } from '@/features/dashboard/components/primitives';

export default function SpeakingReportSummary({ finalEvaluation, pronunciationBreakdown }) {
  const summary = useMemo(() => buildSpeakingReportSummary(finalEvaluation), [finalEvaluation]);

  if (finalEvaluation?.assessmentStatus === 'insufficient_evidence') {
    return (
      <div className={cn(PANEL, 'p-5')} role="status" data-testid="insufficient-speaking-evidence">
        <Pill tone="warn">No band assigned</Pill>
        <h2 className={cn(TITLE, 'mt-3 text-lg')}>More speaking evidence is needed</h2>
        <p className={cn(MUTED, 'mt-2 max-w-2xl text-sm leading-6')}>{finalEvaluation.feedback}</p>
        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {finalEvaluation.targetBandTips}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-3 fade-in slide-in-from-bottom-5 duration-700">
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-12 sm:gap-3">
        <OverallScoreRing
          overallScore={summary.overallScore}
          bandInfo={summary.bandInfo}
          isTranscriptEstimate={summary.isTranscriptEstimate}
        />
        <CoachSummaryCard
          conciseFeedback={summary.conciseFeedback}
          conciseTargetTip={summary.conciseTargetTip}
          showTargetTip={summary.showTargetTip}
        />
        <PerformanceMetricsPanel criteria={summary.criteria} />
      </div>

      <PartByPartSection parts={summary.parts} />

      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2 sm:gap-3">
        <StrengthsSection conciseStrengths={summary.strengths} />
        <ImprovementsSection conciseImprovements={summary.improvements} />
      </div>

      <PronunciationBreakdownSection pronunciationBreakdown={pronunciationBreakdown} />
    </div>
  );
}
