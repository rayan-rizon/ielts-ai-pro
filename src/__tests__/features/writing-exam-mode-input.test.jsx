import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath) => fs.readFileSync(path.resolve('.', relativePath), 'utf8');

describe('Writing Exam Mode input safeguards', () => {
  it('passes exam mode through to Quill and disables browser writing assistance', () => {
    const task = readSource('src/features/testing/writing/pages/WritingTask.jsx');
    const editor = readSource(
      'src/features/testing/writing/components/WritingTest/components/WritingEditor.jsx'
    );

    expect(task).toContain('testMode={testMode}');
    expect(editor).toContain("root.setAttribute('spellcheck', 'false')");
    expect(editor).toContain("root.setAttribute('autocorrect', 'off')");
    expect(editor).toContain("root.setAttribute('autocapitalize', 'off')");
    expect(editor).toContain("root.setAttribute('data-gramm', 'false')");
    expect(editor).toContain('spellCheck={!isExamMode}');
  });
});
