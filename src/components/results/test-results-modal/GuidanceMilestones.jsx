import React from 'react';
import { WhatsNextCard } from '@/components/results/WhatsNextCard';
import { TargetBandGapCard } from '@/components/results/TargetBandGapCard';

export const GuidanceMilestones = React.memo(({ testResults, testType }) => {
  const weakestType = React.useMemo(() => {
    if (!testResults.typeStats) return null;
    let weakest = null;
    Object.entries(testResults.typeStats).forEach(([type, stats]) => {
      if (stats.total > 0) {
        const accuracy = (stats.correct / stats.total) * 100;
        if (!weakest || accuracy < weakest.accuracy) {
          weakest = { type, accuracy };
        }
      }
    });
    return weakest;
  }, [testResults.typeStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-oid="guidance-grid">
      <WhatsNextCard
        typeStats={testResults.typeStats}
        bandScore={parseFloat(testResults.bandScore)}
        testType={testType}
        className="h-full"
        data-oid="ens4h:e"
      />

      <TargetBandGapCard
        currentBand={parseFloat(testResults.bandScore)}
        correctAnswers={testResults.correctAnswers}
        totalQuestions={testResults.totalQuestions}
        testType={testType}
        weakestType={weakestType}
        className="h-full"
        data-oid="target-band-gap"
      />
    </div>
  );
});

GuidanceMilestones.displayName = 'GuidanceMilestones';
