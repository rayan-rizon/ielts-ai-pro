import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(resolve(path), 'utf8');
const page = read('src/features/testing/writing/pages/WritingTask.jsx');
const reportBody = read('src/features/testing/writing/report/components/WritingReportBody.jsx');

const componentBody = (name) => {
  const start = page.indexOf(`function ${name}(`);
  const next = page.indexOf('\nfunction ', start + 10);
  return page.slice(start, next < 0 ? undefined : next);
};

describe('how the writing page feeds the report', () => {
  it('gives the one report panel the saved attempt, in exam mode as well', () => {
    const content = componentBody('WritingTaskContent');
    expect(
      content.match(/\{\.\.\.attemptProps\(testMode, logic\.session, activeType\)\}/g)
    ).toHaveLength(1);
    // The coach is hidden in exam mode; translation and comparison are not.
    const helper = componentBody('attemptProps');
    expect(helper).toContain("coachSession: testMode !== 'exam' ? session : null");
    expect(helper).toContain('reportSessionId: session?.id');
    expect(componentBody('WritingPaneBody')).toContain('reportSessionId={reportSessionId}');
    expect(componentBody('WritingEditorPane')).toContain('reportSessionId={reportSessionId}');
    expect(page.match(/<MemoizedFeedbackPanel/g)).toHaveLength(1);
  });

  it('shows the marked essay’s explanations in the report language too', () => {
    expect(reportBody).toContain('explained={translation.shown}');
  });
});
