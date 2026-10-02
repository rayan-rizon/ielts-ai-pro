#!/usr/bin/env node
// Read-only browser metadata audit. Input contains catalog metadata, not learner data.
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const [catalogPath, outputPath] = process.argv.slice(2);
if (!catalogPath || !outputPath)
  throw new Error('Usage: node scripts/audit-listening-exam-audio.mjs catalog.json output.json');
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const source = await fs.readFile(
  new URL(
    '../src/features/testing/listening/components/ListeningTest/utils/examAudio.js',
    import.meta.url
  ),
  'utf8'
);
const loader = source
  .slice(
    source.indexOf('export function loadAudioDuration'),
    source.indexOf('export async function recoverListeningExamTiming')
  )
  .replace('export function', 'function');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.AUDIT_CHROME_PATH ? { executablePath: process.env.AUDIT_CHROME_PATH } : {}),
});
try {
  const page = await browser.newPage();
  await page.addScriptTag({ content: loader });
  const parts = catalog.flatMap((test) =>
    (test.parts || []).map((part) => ({ testId: test.id, title: test.title, ...part }))
  );
  const results = await page.evaluate(async (parts) => {
    let cursor = 0;
    const results = new Array(parts.length);
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (cursor < parts.length) {
          const index = cursor++;
          const part = parts[index];
          try {
            const duration = await loadAudioDuration(part.audio_url);
            results[index] = {
              ...part,
              duration,
              valid: Number.isFinite(duration) && duration > 0,
            };
          } catch (error) {
            results[index] = { ...part, valid: false, error: error.message };
          }
        }
      })
    );
    return results;
  }, parts);
  const report = {
    auditedAt: new Date().toISOString(),
    tests: catalog.length,
    audioFiles: parts.length,
    passed: results.filter((item) => item.valid).length,
    failures: results.filter((item) => !item.valid),
    results,
  };
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, results: undefined }));
  if (report.failures.length) process.exitCode = 1;
} finally {
  await browser.close();
}
