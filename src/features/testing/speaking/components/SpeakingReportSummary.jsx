import React, { useMemo } from 'react';
import { OverallScoreRing, CoachSummaryCard, PerformanceMetricsPanel } from './ScoreSection';
import {
  PronunciationBreakdownSection,
  StrengthsSection,
  ImprovementsSection,
} from './FeedbackSections';
import PartByPartSection from './PartByPartSection';
import { buildSpeakingReportSummary } from '../utils/speakingReportSummary';

export default function SpeakingReportSummary({ finalEvaluation, pronunciationBreakdown }) {
  const summary = useMemo(() => buildSpeakingReportSummary(finalEvaluation), [finalEvaluation]);

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
