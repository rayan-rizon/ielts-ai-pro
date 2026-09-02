#!/usr/bin/env node

import 'dotenv/config';

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

import { isSilenceSegment, parseSrt } from '../src/utils/parseSrt.js';

const outputDirectory = '/tmp/ielts-listening-extra-opening-repairs';
mkdirSync(outputDirectory, { recursive: true });

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function prepend(sectionNumber, introduction, questionRange, body, start = 0) {
  return `1
00:00:00,${String(start).padStart(3, '0')} --> 00:00:01,000
ANNOUNCER: Section ${sectionNumber}.

2
00:00:02,000 --> 00:00:09,500
ANNOUNCER: ${introduction}

3
00:00:10,500 --> 00:00:15,000
ANNOUNCER: First, you have some time to look at questions ${questionRange}.

${body.trim()}`;
}

const supabase = createClient(required('VITE_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await supabase
  .from('passages')
  .select('id,cambridge_year,cambridge_test_number,content')
  .eq('test_type', 'listening');
if (error) throw error;

const repairs = [
  { target: '2015/1/1', path: '/tmp/ielts-listening-extra-openings/2015-1-1.srt' },
  { target: '2017/2/2', path: '/tmp/ielts-listening-extra-openings/2017-2-2.srt' },
];

for (const target of ['2015/4/2', '2015/4/3']) {
  const [year, test, partNumber] = target.split('/').map(Number);
  const passage = data.find(
    (row) => row.cambridge_year === year && row.cambridge_test_number === test
  );
  const part = JSON.parse(passage.content)[partNumber - 1];
  let srt;
  if (partNumber === 2) {
    srt = prepend(
      2,
      'You will hear a recorded talk giving an introduction to the historical theme park of Manham Riverport in England.',
      '11 to 15',
      part.srt_content
    );
  } else {
    srt = prepend(
      3,
      "You will hear two psychology students, called Tim and Laura, talking about Laura's work placement.",
      '21 to 24',
      `${part.srt_content.trim()}\n\n999\n00:06:29,700 --> 00:06:32,500\nANNOUNCER: That is the end of section 3.\n\n1000\n00:06:32,500 --> 00:06:35,500\nANNOUNCER: You now have half a minute to check your answers.`
    );
  }
  const path = `${outputDirectory}/${year}-${test}-${partNumber}.srt`;
  writeFileSync(path, srt);
  repairs.push({ target, path });
}

const durations = new Map([
  ['2015/1/1', 365.507438],
  ['2015/4/2', 355.058458],
  ['2015/4/3', 397.74254],
  ['2017/2/2', 432.927347],
]);
const report = repairs.map(({ target, path }) => {
  const [year, test, partNumber] = target.split('/').map(Number);
  const passage = data.find(
    (row) => row.cambridge_year === year && row.cambridge_test_number === test
  );
  const part = JSON.parse(passage.content)[partNumber - 1];
  const filename = `${year}-${test}-${partNumber}.srt`;
  const srt = readFileSync(path, 'utf8');
  if (path !== `${outputDirectory}/${filename}`) writeFileSync(`${outputDirectory}/${filename}`, srt);
  const segments = parseSrt(srt).filter((segment) => !isSilenceSegment(segment));
  const duration = durations.get(target);
  const chronological = segments.every(
    (segment, index) => segment.end > segment.start && (!index || segment.start >= segments[index - 1].start)
  );
  return {
    passageId: passage.id,
    year,
    test,
    partNumber,
    title: part.title,
    srt: filename,
    duration,
    accepted:
      segments.length >= 10 &&
      (segments[0]?.start ?? Infinity) < 10 &&
      (segments.at(-1)?.end || 0) >= duration - 8 &&
      chronological,
    cueCount: segments.length,
    firstCueStart: segments[0]?.start,
    finalCueEnd: segments.at(-1)?.end,
    chronological,
  };
});

writeFileSync(`${outputDirectory}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.some((entry) => !entry.accepted)) process.exitCode = 1;
