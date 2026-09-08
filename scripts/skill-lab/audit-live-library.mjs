// Read-only: input is a private export of passages/questions, never student records.
// Example: node scripts/skill-lab/audit-live-library.mjs /tmp/library.json /tmp/report.json
import fs from 'node:fs';
import {
  prepareObjectiveSnapshot,
  gradeSnapshot,
  withoutSolutions,
} from '../../supabase/functions/_shared/objective-scoring/paired.js';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Supply the private library export and report paths');
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const tests = [];
for (const passage of data.passages.filter(
  (p) => p.is_active && ['reading', 'listening'].includes(p.test_type)
)) {
  const row = { id: passage.id, title: passage.title, module: passage.test_type };
  try {
    const snapshot = prepareObjectiveSnapshot(
      passage,
      data.questions.filter((q) => q.passage_id === passage.id)
    );
    const empty = gradeSnapshot(snapshot, {});
    const safe = withoutSolutions(snapshot);
    if (passage.test_type === 'reading') safe.testData.content = '';
    const payload = JSON.stringify(safe);
    const forbidden =
      /"(?:correct_answer|correctAnswer|correct_heading|answers|answer|explanation|explanation_data|transcript|transcript_highlights|srt_content|other_accepted_answers|why_correct)"\s*:/;
    const missing = Object.entries(empty.correctAnswersMap || empty.answersMap || {})
      .filter(
        ([, v]) =>
          v.correctAnswer == null ||
          String(v.correctAnswer).trim() === '' ||
          v.correctAnswer === '—'
      )
      .map(([id]) => id);
    Object.assign(row, {
      total: empty.totalQuestions,
      blankScore: empty.correctAnswers,
      sections: empty.sectionStats.map((s) => ({ title: s.title, total: s.total })),
      missingKeyIds: missing,
      solutionFieldsHidden: !forbidden.test(payload),
      questionTypes: [...new Set(snapshot.questions.map((q) => q.type))],
    });
    row.passed =
      row.total === 40 && row.blankScore === 0 && !missing.length && row.solutionFieldsHidden;
  } catch (error) {
    Object.assign(row, { passed: false, error: error.message });
  }
  tests.push(row);
}
const report = {
  generatedAt: new Date().toISOString(),
  source: 'supplied library export',
  records: { passages: data.passages.length, questions: data.questions.length },
  activeObjectiveTests: tests.length,
  passed: tests.filter((t) => t.passed).length,
  failed: tests.filter((t) => !t.passed).length,
  tests,
};
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ ...report, tests: tests.filter((t) => !t.passed) }, null, 2));
if (report.failed) process.exitCode = 1;
