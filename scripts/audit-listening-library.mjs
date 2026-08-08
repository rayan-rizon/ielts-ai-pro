#!/usr/bin/env node

import 'dotenv/config';

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createClient } from '@supabase/supabase-js';

import { isSilenceSegment, parseSrt } from '../src/utils/parseSrt.js';

const execFileAsync = promisify(execFile);

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function mapLimited(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index]);
      }
    })
  );
  return results;
}

async function main() {
  const supabase = createClient(required('VITE_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from('passages')
    .select('id,title,cambridge_year,cambridge_test_number,content')
    .eq('test_type', 'listening')
    .order('cambridge_year')
    .order('cambridge_test_number');
  if (error) throw error;

  const sections = data.flatMap((passage) =>
    JSON.parse(passage.content).map((section, index) => ({
      passageId: passage.id,
      target: `${passage.cambridge_year}/${passage.cambridge_test_number}/${index + 1}`,
      ...section,
    }))
  );
  const audited = await mapLimited(sections, 8, async (section) => {
    const issues = [];
    if (!String(section.title || '').trim()) issues.push('missing-title');
    if (!String(section.audio_url || '').trim()) issues.push('missing-audio');
    if (!String(section.srt_content || '').trim()) issues.push('missing-srt');
    if (/\[\s*silence\s*\]|\(\s*silence\s*\)/i.test(section.srt_content || section.transcript || '')) {
      issues.push('silence-placeholder');
    }
    if (/\[\s*answer\b/i.test(section.srt_content || section.transcript || '')) issues.push('answer-marker');
    const cues = parseSrt(section.srt_content || '');
    if (cues.length < 10) issues.push('too-few-cues');
    if (cues.some(isSilenceSegment)) issues.push('parsed-silence');
    if (
      cues.some(
        (cue, index) =>
          cue.end <= cue.start || (index > 0 && cue.start < cues[index - 1].start)
      )
    ) issues.push('non-chronological');
    if ((cues[0]?.start ?? Infinity) > 20) issues.push('missing-opening');
    if (!Array.isArray(section.transcript_highlights) || !section.transcript_highlights.length) {
      issues.push('missing-image-highlights');
    }

    let duration = 0;
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', section.audio_url,
      ], { timeout: 30_000 });
      duration = Number(stdout.trim());
      if (!Number.isFinite(duration) || duration <= 0) issues.push('unplayable-audio');
    } catch {
      issues.push('unplayable-audio');
    }
    const finalCueEnd = cues.at(-1)?.end || 0;
    if (duration && finalCueEnd > duration + 3) issues.push('transcript-overrun');
    const terminalAnnouncement = /(?:end of (?:part|section|the listening test)|check your answers|transfer your answers)/i.test(
      cues.slice(-3).map((cue) => cue.text).join(' ')
    );
    if (duration && !terminalAnnouncement && finalCueEnd < duration - 8) issues.push('missing-ending');

    return {
      target: section.target,
      title: section.title,
      cues: cues.length,
      firstCueStart: cues[0]?.start ?? null,
      finalCueEnd,
      duration: Number(duration.toFixed(3)),
      highlights: section.transcript_highlights?.length || 0,
      issues,
    };
  });

  const failures = audited.filter((item) => item.issues.length);
  console.log(JSON.stringify({ passages: data.length, sections: sections.length, failures, audited }, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
