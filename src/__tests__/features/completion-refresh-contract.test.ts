import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readingSource = readFileSync(
  'src/features/testing/reading/components/ReadingTest/hooks/useReadingTestLogic.js',
  'utf8'
);
const listeningSource = readFileSync(
  'src/features/testing/listening/components/ListeningTest/hooks/useListeningTestLogic.js',
  'utf8'
);
const writingSubmitSource = readFileSync(
  'src/features/testing/writing/components/WritingTest/hooks/useWritingTaskLogic.js',
  'utf8'
);
const writingFeedbackSource = readFileSync(
  'src/features/testing/writing/components/WritingTest/hooks/useWritingFeedback.js',
  'utf8'
);

describe('scored completion learning-path refresh contract', () => {
  it.each([
    ['Reading', readingSource],
    ['Listening', listeningSource],
  ])('%s refreshes only inside the idempotent didComplete branch', (_module, source) => {
    expect(source.match(/refreshLearningPathAfterTest/g)).toHaveLength(2);
    expect(source.indexOf('if (didComplete)')).toBeLessThan(
      source.lastIndexOf('refreshLearningPathAfterTest')
    );
  });

  it.each([
    ['Reading', readingSource],
    ['Listening', listeningSource],
  ])('%s tracks completion only after persistence succeeds', (_module, source) => {
    const completionGuard = source.indexOf('if (didComplete)');
    const analyticsEvent = source.indexOf("trackAppEvent('test_completed'", completionGuard);

    expect(completionGuard).toBeGreaterThan(-1);
    expect(analyticsEvent).toBeGreaterThan(completionGuard);
  });

  it('does not refresh an unscored Writing submission', () => {
    expect(writingSubmitSource).not.toContain('refreshLearningPathAfterTest');
  });

  it('refreshes Writing only after a finite feedback score is persisted', () => {
    const save = writingFeedbackSource.indexOf('await completeWritingEvaluation(');
    const saveGuard = writingFeedbackSource.indexOf('if (!completedSession)');
    const scoreGuard = writingFeedbackSource.indexOf(
      'overallScore != null && Number.isFinite(Number(overallScore))'
    );
    const refresh = writingFeedbackSource.lastIndexOf('refreshLearningPathAfterTest');

    expect(save).toBeGreaterThan(-1);
    expect(saveGuard).toBeGreaterThan(save);
    expect(scoreGuard).toBeGreaterThan(saveGuard);
    expect(refresh).toBeGreaterThan(scoreGuard);
  });
});
