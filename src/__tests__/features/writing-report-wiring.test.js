import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const page = readFileSync(resolve('src/features/testing/writing/pages/WritingTask.jsx'), 'utf8');

const componentBody = (name) => {
  const start = page.indexOf(`function ${name}(`);
  const next = page.indexOf('\nfunction ', start + 10);
  return page.slice(start, next < 0 ? undefined : next);
};

describe('how the writing page feeds the report', () => {
  it('gives both layouts the saved attempt, in exam mode as well', () => {
    const content = componentBody('WritingTaskContent');
    expect(
      content.match(/\{\.\.\.attemptProps\(testMode, logic\.session, activeType\)\}/g)
    ).toHaveLength(2);
    // The coach is hidden in exam mode; translation and comparison are not.
    const helper = componentBody('attemptProps');
    expect(helper).toContain("coachSession: testMode !== 'exam' ? session : null");
    expect(helper).toContain('reportSessionId: session?.id');
    expect(componentBody('WritingFeedbackDrawer')).toContain('reportSessionId={reportSessionId}');
    expect(componentBody('WritingPaneBody')).toContain('reportSessionId={reportSessionId}');
    expect(componentBody('WritingEditorPane')).toContain('reportSessionId={reportSessionId}');
  });

  it('shows the marked essay’s explanations in the report language too', () => {
    const review = componentBody('AnnotatedReviewPane');
    expect(review).toContain('useTranslatedReport(');
    expect(review).toContain('annotations={explained.annotations || []}');
  });
});
