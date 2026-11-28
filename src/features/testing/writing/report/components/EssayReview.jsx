/** The learner's own essay in the report, and what it shows about their words. */
import React, { useEffect, useMemo, useRef } from 'react';
import AnnotatedText from '@/components/writing/AnnotatedText';
import EssayWords from '@/components/writing/EssayWords';
import { analyzeWriting } from '../../utils/writingCoaching';
import { reportedWords } from '../reportViewModel';
import { paragraphName } from './paragraphName';
import { MarkedEssayCard, weakestIndex } from './EssaySections';

/** Gives each highlight the number its fix has in the list beside the essay. */
function numberedAnnotations(annotations, fixes) {
  const numbers = new Map(
    fixes.flatMap((group) => group.items).map((item) => [item.original, item.n])
  );
  return (annotations || []).map((annotation) => ({
    ...annotation,
    n: numbers.get(annotation.originalText),
  }));
}

/** `explained` is the report in the learner's language; the essay stays theirs. */
export function MarkedEssay({ t, content, explained, essay }) {
  const annotations = useMemo(
    () => numberedAnnotations(explained.annotations, content.fixes),
    [explained.annotations, content.fixes]
  );
  const weakest = useMemo(() => {
    const index = weakestIndex(content.essayMap);
    const entry = content.essayMap.find((paragraph) => paragraph.index === index);
    if (!entry) return null;
    const toFix = t('mapToFix', { count: entry.mistakes });
    return { index, note: entry.note || `${paragraphName(t, entry)}: ${toFix}` };
  }, [content.essayMap, t]);
  // "Show in my essay" starts further up the report, so bring the essay to it.
  const card = useRef(null);
  const request = essay.focusAnnotation?.requestId;
  useEffect(() => {
    if (request) card.current?.scrollIntoView?.({ block: 'nearest' });
  }, [request]);
  if (!content.essayText) return null;
  return (
    <div ref={card} className="h-full">
      <MarkedEssayCard t={t}>
        <AnnotatedText
          t={t}
          text={content.essayText}
          annotations={annotations}
          highlight={weakest}
          onApplyCorrection={essay.onApplyCorrection}
          focusAnnotation={essay.focusAnnotation}
        />
      </MarkedEssayCard>
    </div>
  );
}

/** The marker's own description of a chart, whose labels must be repeated. */
function chartLabels({ taskType, taskAnalysis }) {
  if (taskType !== 'Task 1') return '';
  const { visualType, observedFeatures = [], limitations } = taskAnalysis || {};
  return [visualType, ...observedFeatures, limitations].filter(Boolean).join(' ');
}

export function WordsSection({ t, content, feedback, essay }) {
  const analysis = useMemo(
    () => analyzeWriting(content.essayText, feedback.taskPrompt),
    [content.essayText, feedback.taskPrompt]
  );
  if (!content.essayText) return null;
  return (
    <EssayWords
      t={t}
      text={content.essayText}
      writingAnalysis={analysis}
      vocabularyEnhancements={feedback.vocabularyEnhancements || []}
      reportedVocabulary={reportedWords(feedback.vocabularyEnhancements).map((e) => e.original)}
      chartText={chartLabels(feedback)}
      isVisualTask={content.taskType === 'Task 1'}
      onSaveVocabularyWord={essay.onSaveVocabularyWord}
      savedVocabularyTerms={essay.savedVocabularyTerms}
      savingVocabularyTerms={essay.savingVocabularyTerms}
    />
  );
}
