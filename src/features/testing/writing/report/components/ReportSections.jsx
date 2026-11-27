/** The report under the result card, in reading order. */
import React, { useRef, useState } from 'react';
import { buildPractice } from '../reportViewModel';
import { CompareSection } from './CompareSection';
import { EssayCard } from './EssaySections';
import { FixesCard } from './FixesCard';
import { AlsoWorkOn, ChartCheckCard, NextStepCard, StrengthsCard } from './GuidanceCards';
import { PracticeNext } from './PracticeNext';

const scoreOf = (criteria, label) => criteria.find((row) => row.label === label)?.score ?? null;

const prefersCalm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** The comparison's chosen paragraph, and how a drill can open it. */
function useCompareSelection(comparable) {
  const [position, setPosition] = useState(0);
  const ref = useRef(null);
  const open = (paragraphIndex) => {
    const next = comparable.findIndex((paragraph) => paragraph.index === paragraphIndex);
    if (next >= 0) setPosition(next);
    ref.current?.scrollIntoView({ behavior: prefersCalm() ? 'auto' : 'smooth', block: 'start' });
  };
  return { position, setPosition, ref, open };
}

function drillsFor(content, feedback, revise) {
  return buildPractice({
    criteria: content.criteria,
    fixes: content.fixes,
    essayMap: content.essayMap,
    vocabulary: feedback.vocabularyEnhancements,
    canRevise: Boolean(revise),
    comparable: content.canCompare ? content.comparable.map((paragraph) => paragraph.index) : [],
  });
}

export function ReportSections({
  t,
  feedback,
  content,
  models,
  sessionId,
  user,
  revise,
  onShowInEssay,
  coach,
}) {
  const compare = useCompareSelection(content.comparable);
  const { nextStep, taskType } = content;
  return (
    <>
      <NextStepCard
        t={t}
        step={nextStep}
        score={scoreOf(content.criteria, nextStep?.criterion)}
        onShowInEssay={onShowInEssay}
        onRevise={revise}
      />
      {content.canCompare && (
        <div ref={compare.ref}>
          <CompareSection
            key={`${sessionId}|${taskType}`}
            t={t}
            taskType={taskType}
            paragraphs={content.comparable}
            essayMap={content.essayMap}
            marked={content.marked}
            models={models}
            bands={content.bands}
            position={compare.position}
            onPositionChange={compare.setPosition}
            onRevise={revise}
          />
        </div>
      )}
      <ChartCheckCard t={t} check={content.chartCheck} />
      <AlsoWorkOn t={t} priorities={nextStep?.rest || []} onShowInEssay={onShowInEssay} />
      <div className="grid gap-3 @4xl:grid-cols-2 @4xl:items-start">
        <div className="min-w-0">
          <EssayCard t={t} essayMap={content.essayMap} marked={content.marked} />
        </div>
        <div className="min-w-0">
          <FixesCard
            t={t}
            groups={content.fixes}
            onShowInEssay={onShowInEssay}
            reportKey={feedback.sourceFingerprint || feedback.generatedAt}
          />
        </div>
      </div>
      <StrengthsCard t={t} strengths={content.strengths} />
      <PracticeNext
        t={t}
        sessionId={sessionId}
        taskType={taskType}
        drills={drillsFor(content, feedback, revise)}
        vocabularySource={feedback.vocabularyEnhancements || []}
        user={user}
        coachSession={coach.coachSession}
        onRevise={revise}
        onCompare={compare.open}
      />
    </>
  );
}
