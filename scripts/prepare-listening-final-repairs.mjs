#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isSilenceSegment, parseSrt } from '../src/utils/parseSrt.js';

const outputDirectory = '/tmp/ielts-listening-final-repairs';
mkdirSync(outputDirectory, { recursive: true });

const sourceReport = JSON.parse(
  readFileSync('/tmp/ielts-listening-missing-openings/report.json', 'utf8')
);
const finalReport = JSON.parse(readFileSync('/tmp/ielts-listening-full-final/report.json', 'utf8'));
const metadata = new Map(
  [...sourceReport, ...finalReport].map((entry) => [
    `${entry.year}/${entry.test}/${entry.partNumber}`,
    entry,
  ])
);

const sources = new Map([
  ['2015/2/1', '/tmp/ielts-listening-full-retry/2015-2-1.srt'],
  ['2015/4/1', '/tmp/ielts-listening-full-final/2015-4-1.srt'],
  ['2016/3/4', '/tmp/ielts-listening-full-final/2016-3-4.srt'],
  ['2016/4/3', '/tmp/ielts-listening-full-retry/2016-4-3.srt'],
  ['2017/2/1', '/tmp/ielts-listening-full-final/2017-2-1.srt'],
  ['2018/1/1', '/tmp/ielts-listening-missing-openings/2018-1-1.srt'],
  ['2018/2/1', '/tmp/ielts-listening-full-retry/2018-2-1.srt'],
  ['2018/3/4', '/tmp/ielts-listening-full-retry/2018-3-4.srt'],
  ['2019/1/3', '/tmp/ielts-listening-full-retry/2019-1-3.srt'],
  ['2022/1/1', '/tmp/ielts-listening-full-final/2022-1-1.srt'],
]);

function withCeideFieldsIntro(body) {
  return `1
00:00:00,001 --> 00:00:00,601
ANNOUNCER: Part 4.

2
00:00:01,701 --> 00:00:09,601
ANNOUNCER: You will hear an archaeology student giving a presentation on an important site in Ireland called the Ceide Fields.

3
00:00:10,401 --> 00:00:14,891
ANNOUNCER: First, you have some time to look at questions 31 to 40.

4
00:00:49,800 --> 00:00:55,000
ANNOUNCER: Now listen carefully and answer questions 31 to 40.

${body}`;
}

sources.set('2024/1/4', '/tmp/ielts-listening-missing-openings/2024-1-4.srt');

const report = [];
for (const [target, sourcePath] of sources) {
  const entry = metadata.get(target);
  if (!entry) throw new Error(`Missing metadata for ${target}`);
  const [year, test, partNumber] = target.split('/').map(Number);
  let srt = readFileSync(sourcePath, 'utf8').trim();
  if (target === '2024/1/4') srt = withCeideFieldsIntro(srt);
  const segments = parseSrt(srt).filter((segment) => !isSilenceSegment(segment));
  const firstCueStart = segments[0]?.start ?? Infinity;
  const finalCueEnd = segments.at(-1)?.end || 0;
  const hasTerminalAnnouncement = /end of the listening test/i.test(segments.at(-1)?.text || '');
  const chronological = segments.every(
    (segment, index) =>
      segment.end > segment.start &&
      (!index || segment.start >= segments[index - 1].start) &&
      segment.end <= entry.duration + 3
  );
  const accepted =
    segments.length >= 10 &&
    firstCueStart < 10 &&
    (finalCueEnd >= entry.duration - 8 ||
      (hasTerminalAnnouncement && finalCueEnd >= entry.duration - 15)) &&
    chronological;
  const filename = `${year}-${test}-${partNumber}.srt`;
  writeFileSync(join(outputDirectory, filename), srt);
  report.push({
    ...entry,
    year,
    test,
    partNumber,
    srt: filename,
    accepted,
    cueCount: segments.length,
    firstCueStart,
    finalCueEnd,
    chronological,
  });
}

writeFileSync(join(outputDirectory, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.map(({ year, test, partNumber, accepted, cueCount, firstCueStart, finalCueEnd, duration }) => ({
  target: `${year}/${test}/${partNumber}`,
  accepted,
  cueCount,
  firstCueStart,
  finalCueEnd,
  duration,
})), null, 2));
if (report.some((entry) => !entry.accepted)) process.exitCode = 1;
