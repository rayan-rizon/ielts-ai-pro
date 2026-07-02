import React, { useMemo } from 'react';
import { MessageSquare, Mic2, BookOpen, Brain } from 'lucide-react';
import {
  compactText,
  textKey,
  compactStrengthList,
  compactDevelopmentArea,
} from '../utils/speakingReportHelpers';
import { OverallScoreRing, PerformanceMetricsPanel } from './ScoreSection';
import {
  PronunciationBreakdownSection,
  StrengthsSection,
  ImprovementsSection,
  TargetTipSection,
} from './FeedbackSections';
import PartByPartSection from './PartByPartSection';
import CriterionNotesSection from './CriterionNotesSection';

function buildCriterionCards(notes, legacy, hasPronunciation) {
  return [
    {
      title: 'Fluency & Coherence',
      analysis: notes.fluency || legacy.fluencyAnalysis,
      icon: 'FC',
      color: 'from-rose-500 to-orange-500',
      bgColor: 'bg-rose-500/5',
      borderColor: 'border-rose-500/20',
    },
    {
      title: 'Lexical Resource',
      analysis: notes.lexical || legacy.lexicalAnalysis,
      icon: 'LR',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/5',
      borderColor: 'border-orange-500/20',
    },
    {
      title: 'Grammar Range',
      analysis: notes.grammar || legacy.grammarAnalysis,
      icon: 'GRA',
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-500/5',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Pronunciation',
      analysis: notes.pronunciation || legacy.pronunciationAnalysis,
      icon: 'P',
      color: 'from-rose-500 to-pink-500',
      bgColor: 'bg-pink-500/5',
      borderColor: 'border-pink-500/20',
    },
  ]
    .filter((c) => c.analysis && (c.title !== 'Pronunciation' || hasPronunciation))
    .map((criterion) => ({
      ...criterion,
      analysis: compactText(criterion.analysis, { maxSentences: 1, maxChars: 155 }),
    }))
    .filter((criterion) => criterion.analysis);
}

function buildPerformanceMetrics(finalEvaluation) {
  return [
    {
      label: 'Fluency & Coherence',
      icon: MessageSquare,
      value: finalEvaluation.fluency,
      color: 'from-rose-500 to-rose-600',
      bg: 'bg-rose-500/5',
    },
    {
      label: 'Lexical Resource',
      icon: BookOpen,
      value: finalEvaluation.lexical,
      color: 'from-orange-500 to-rose-500',
      bg: 'bg-orange-500/5',
    },
    {
      label: 'Grammar Range',
      icon: Brain,
      value: finalEvaluation.grammar,
      color: 'from-indigo-500 to-rose-500',
      bg: 'bg-indigo-500/5',
    },
    {
      label: 'Pronunciation',
      icon: Mic2,
      value: finalEvaluation.pronunciation,
      color: 'from-rose-600 to-rose-800',
      bg: 'bg-rose-600/5',
    },
  ].filter((score) => score.value != null && Number.isFinite(Number(score.value)));
}

function buildImprovements(rawImprovements) {
  return (Array.isArray(rawImprovements) ? rawImprovements : [])
    .map(compactDevelopmentArea)
    .filter((item) => item.title && item.content)
    .filter((item, idx, items) => {
      const key = textKey(item.content);
      return key && items.findIndex((c) => textKey(c.content) === key) === idx;
    })
    .slice(0, 3);
}

export default function SpeakingReportSummary({ finalEvaluation, pronunciationBreakdown }) {
  const summaryData = useMemo(() => {
    const hasOverall =
      finalEvaluation.overallBand != null && Number.isFinite(Number(finalEvaluation.overallBand));
    const overallScore = hasOverall ? Number(finalEvaluation.overallBand) : null;
    const hasPronunciation =
      finalEvaluation.pronunciation != null &&
      Number.isFinite(Number(finalEvaluation.pronunciation));
    const isTranscriptEstimate = finalEvaluation.scoreBasis === 'transcript' || !hasPronunciation;
    const notes = finalEvaluation.criterionNotes || {};
    const legacy = finalEvaluation.analysis || {};

    const conciseFeedback = compactText(finalEvaluation.feedback, {
      maxSentences: 2,
      maxChars: 220,
    });

    const conciseTargetTip = compactText(finalEvaluation.targetBandTips, {
      maxSentences: 1,
      maxChars: 190,
    });

    return {
      overallScore,
      isTranscriptEstimate,
      conciseFeedback,
      criterionCards: buildCriterionCards(notes, legacy, hasPronunciation),
      conciseStrengths: compactStrengthList(finalEvaluation.strengths),
      conciseImprovements: buildImprovements(finalEvaluation.improvements),
      conciseTargetTip,
      showTargetTip: conciseTargetTip && textKey(conciseTargetTip) !== textKey(conciseFeedback),
      performanceMetrics: buildPerformanceMetrics(finalEvaluation),
    };
  }, [finalEvaluation]);

  const {
    overallScore,
    isTranscriptEstimate,
    conciseFeedback,
    criterionCards,
    conciseStrengths,
    conciseImprovements,
    conciseTargetTip,
    showTargetTip,
    performanceMetrics,
  } = summaryData;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* ─── Top Score Section (Side-by-Side) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <OverallScoreRing
          overallScore={overallScore}
          isTranscriptEstimate={isTranscriptEstimate}
          hasMetrics={performanceMetrics.length > 0}
        />
        <PerformanceMetricsPanel performanceMetrics={performanceMetrics} />
      </div>

      {/* ─── Part-by-Part Evaluation ─── */}
      <PartByPartSection finalEvaluation={finalEvaluation} />

      {/* ─── Feedback & Criterion Notes ─── */}
      <CriterionNotesSection conciseFeedback={conciseFeedback} criterionCards={criterionCards} />

      {/* ─── Pronunciation Breakdown ─── */}
      <PronunciationBreakdownSection pronunciationBreakdown={pronunciationBreakdown} />

      {/* ─── Strengths & Development Areas ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <StrengthsSection conciseStrengths={conciseStrengths} />
        <ImprovementsSection conciseImprovements={conciseImprovements} />
      </div>

      {/* ─── Band 9 Strategy ─── */}
      <TargetTipSection showTargetTip={showTargetTip} conciseTargetTip={conciseTargetTip} />
    </div>
  );
}
