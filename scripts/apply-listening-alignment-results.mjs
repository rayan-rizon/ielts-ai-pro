#!/usr/bin/env node

import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

import { isSilenceSegment, parseSrt } from '../src/utils/parseSrt.js';

const directories = String(process.env.LISTENING_ALIGNMENT_RESULTS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const shouldApply = process.argv.includes('--apply');
const requestedTargets = new Set(
  String(process.env.LISTENING_ALIGNMENT_APPLY_TARGETS || '').split(',').map((value) => value.trim()).filter(Boolean)
);
const sourceComparisonExceptions = new Set(
  String(process.env.LISTENING_ALIGNMENT_SOURCE_EXCEPTIONS || '').split(',').map((value) => value.trim()).filter(Boolean)
);

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function tokens(value) {
  return String(value || '').toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
}

function sequentialSimilarity(leftValue, rightValue) {
  const left = tokens(leftValue);
  const right = tokens(rightValue);
  let previous = new Uint16Array(right.length + 1);
  for (let i = 1; i <= left.length; i += 1) {
    const current = new Uint16Array(right.length + 1);
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = left[i - 1] === right[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], current[j - 1]);
    }
    previous = current;
  }
  return (2 * previous[right.length]) / Math.max(1, left.length + right.length);
}

function plainText(segments) {
  return segments
    .map((segment) => (segment.speaker ? `${segment.speaker}: ${segment.text}` : segment.text))
    .join('\n');
}

async function main() {
  if (!directories.length) throw new Error('Set LISTENING_ALIGNMENT_RESULTS to report directories');
  const latest = new Map();
  for (const directory of directories) {
    const report = JSON.parse(readFileSync(join(directory, 'report.json'), 'utf8'));
    report.forEach((entry) => latest.set(`${entry.year}/${entry.test}/${entry.partNumber}`, { ...entry, directory }));
  }

  const supabase = createClient(required('VITE_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const outcome = [];
  for (const [target, entry] of latest) {
    if (requestedTargets.size && !requestedTargets.has(target)) continue;
    if (!entry.accepted) {
      outcome.push({ target, status: 'rejected-by-alignment-validator' });
      continue;
    }
    const { data: passage, error } = await supabase
      .from('passages')
      .select('id,content,updated_at')
      .eq('id', entry.passageId)
      .single();
    if (error) throw error;
    const parts = JSON.parse(passage.content);
    const part = parts[entry.partNumber - 1];
    const generatedSrt = readFileSync(join(entry.directory, entry.srt), 'utf8');
    const generatedSegments = parseSrt(generatedSrt).filter((segment) => !isSilenceSegment(segment));
    const currentSegments = parseSrt(part.srt_content || '').filter((segment) => !isSilenceSegment(segment));
    const similarity = sequentialSimilarity(plainText(currentSegments), plainText(generatedSegments));
    if (similarity < 0.78 && !sourceComparisonExceptions.has(target)) {
      outcome.push({ target, status: 'rejected-by-source-comparison', similarity: Number(similarity.toFixed(4)) });
      continue;
    }
    outcome.push({ target, status: shouldApply ? 'ready' : 'dry-run', similarity: Number(similarity.toFixed(4)), cues: generatedSegments.length });
    if (!shouldApply) continue;

    parts[entry.partNumber - 1] = {
      ...part,
      srt_content: generatedSrt,
      transcript: plainText(generatedSegments),
    };
    const { data: updated, error: updateError } = await supabase
      .from('passages')
      .update({ content: JSON.stringify(parts) })
      .eq('id', passage.id)
      .eq('updated_at', passage.updated_at)
      .select('id');
    if (updateError) throw updateError;
    if (updated.length !== 1) throw new Error(`Optimistic update conflict for ${target}`);
    outcome.at(-1).status = 'applied';
  }
  console.log(JSON.stringify(outcome, null, 2));
  if (outcome.some((item) => item.status.startsWith('rejected'))) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
