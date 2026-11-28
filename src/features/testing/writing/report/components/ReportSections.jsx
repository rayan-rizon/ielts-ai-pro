/** The report under the result card, in reading order. */
import React, { useRef, useState } from 'react';
import { buildPractice } from '../reportViewModel';
import { CompareSection } from './CompareSection';
import { MarkedEssay, WordsSection } from './EssayReview';
import { EssayMapCard } from './EssaySections';
import { FocusCard } from './FocusCard';
import { FixesCard } from './FixesCard';
import { AlsoWorkOn, ChartCheckCard, StrengthsCard } from './GuidanceCards';
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
  explained,
  essay,
}) {
  const compare = useCompareSelection(content.comparable);
  const { nextStep, taskType } = content;
  return (
    <>
      <FocusCard
        t={t}
        taskType={taskType}
        step={nextStep}
        score={scoreOf(content.criteria, nextStep?.criterion)}
        target={user?.target_band_score}
        onShowInEssay={onShowInEssay}
        onRevise={revise}
      >
        {content.canCompare && (
          <div ref={compare.ref} className="scroll-mt-3">
            <CompareSection
              key={`${sessionId}|${taskType}`}
              t={t}
              taskType={taskType}
              paragraphs={content.comparable}
              essayMap={content.essayMap}
              marked={content.marked}
              models={models}
              bands={content.bands}
              overallBand={feedback.overallBand}
              target={user?.target_band_score}
              position={compare.position}
              onPositionChange={compare.setPosition}
              onRevise={revise}
            />
          </div>
        )}
      </FocusCard>
      <ChartCheckCard t={t} check={content.chartCheck} />
      <AlsoWorkOn t={t} priorities={nextStep?.rest || []} onShowInEssay={onShowInEssay} />
      <EssayMapCard t={t} essayMap={content.essayMap} />
      <div className="grid gap-3.5 @4xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] @4xl:items-stretch">
        <div className="min-w-0">
          <MarkedEssay t={t} content={content} explained={explained} essay={essay} />
        </div>
        <div className="@container min-w-0">
          <FixesCard
            t={t}
            groups={content.fixes}
            onShowInEssay={onShowInEssay}
            reportKey={feedback.sourceFingerprint || feedback.generatedAt}
          />
        </div>
      </div>
      <div className="grid gap-3.5 @4xl:grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] @4xl:items-stretch">
        <WordsSection t={t} content={content} feedback={feedback} essay={essay} />
        <StrengthsCard t={t} strengths={content.strengths} />
      </div>
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
