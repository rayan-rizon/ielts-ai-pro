#!/usr/bin/env node

import 'dotenv/config';

import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

import { isSilenceSegment, parseSrt } from '../src/utils/parseSrt.js';

const INPUT = process.env.LISTENING_HIGHLIGHT_INPUT || '/tmp/listening-image-highlights-v2.json';
const OUTPUT = process.env.LISTENING_HIGHLIGHT_OUTPUT || '/tmp/listening-resolved-highlights.json';
const shouldApply = process.argv.includes('--apply');

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function normalizedTokens(value) {
  return String(value || '')
    .replace(/[|]/g, 'I')
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .match(/[\p{L}\p{N}£]+(?:'[\p{L}\p{N}]+)?/gu) || [];
}

function comparable(token) {
  return token
    .replace(/^ma$/, "i'm")
    .replace(/^im$/, "i'm")
    .replace(/^favourite$/, 'favorite')
    .replace(/^centre$/, 'center');
}

function lcsScore(left, right) {
  let previous = new Uint16Array(right.length + 1);
  for (let i = 1; i <= left.length; i += 1) {
    const current = new Uint16Array(right.length + 1);
    for (let j = 1; j <= right.length; j += 1) {
      current[j] =
        comparable(left[i - 1]) === comparable(right[j - 1])
          ? previous[j - 1] + 1
          : Math.max(previous[j], current[j - 1]);
    }
    previous = current;
  }
  return (2 * previous[right.length]) / Math.max(1, left.length + right.length);
}

function tokenizedSegments(srt) {
  const segments = parseSrt(srt).filter((segment) => !isSilenceSegment(segment));
  const tokens = [];
  segments.forEach((segment, segmentIndex) => {
    const expression = /[\p{L}\p{N}£]+(?:['’][\p{L}\p{N}]+)?/gu;
    for (const match of segment.text.matchAll(expression)) {
      tokens.push({
        value: match[0].toLowerCase().replace(/’/g, "'"),
        segmentIndex,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  });
  return { segments, tokens };
}

function bestWindow(phrase, transcriptTokens, cursor, globalSearch = false) {
  const wanted = normalizedTokens(phrase);
  if (!wanted.length) return null;
  const variance = Math.max(2, Math.min(8, Math.round(wanted.length * 0.25)));
  const candidateLengths = [wanted.length - variance, wanted.length - 2, wanted.length, wanted.length + 2, wanted.length + variance]
    .map((length) => Math.max(1, length))
    .filter((length, index, lengths) => lengths.indexOf(length) === index);
  let best = null;
  const searchStart = Math.max(0, cursor - 12);
  const searchEnd = globalSearch
    ? transcriptTokens.length
    : Math.min(transcriptTokens.length, cursor + (cursor ? 260 : 360));
  const candidateStarts = new Set();
  const searchableWanted = wanted
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => token.length >= 4)
    .map((item) => ({
      ...item,
      occurrences: transcriptTokens
        .slice(searchStart, searchEnd)
        .filter((token) => comparable(token.value) === comparable(item.token)).length,
    }))
    .filter((item) => item.occurrences > 0)
    .sort((a, b) => a.occurrences - b.occurrences || b.token.length - a.token.length);
  const anchors = searchableWanted.length ? [searchableWanted[0]] : wanted.map((token, index) => ({ token, index }));
  anchors.forEach(({ token: wantedToken, index: wantedIndex }) => {
    for (let position = searchStart; position < searchEnd; position += 1) {
      if (comparable(transcriptTokens[position].value) !== comparable(wantedToken)) continue;
      const estimatedStart = position - wantedIndex;
      for (let offset = -2; offset <= 2; offset += 1) {
        const start = estimatedStart + offset;
        if (start >= searchStart && start < searchEnd) candidateStarts.add(start);
      }
    }
  });
  if (!candidateStarts.size) {
    for (let start = searchStart; start < searchEnd; start += 1) candidateStarts.add(start);
  }

  for (const start of candidateStarts) {
    for (const length of candidateLengths) {
      if (start + length > transcriptTokens.length) continue;
      const candidate = transcriptTokens.slice(start, start + length).map((token) => token.value);
      let score = lcsScore(wanted, candidate);
      if (comparable(wanted[0]) === comparable(candidate[0])) score += 0.025;
      if (comparable(wanted.at(-1)) === comparable(candidate.at(-1))) score += 0.025;
      if (!best || score > best.score) best = { start, end: start + length, score };
    }
  }
  return best;
}

function exactPhrasesForWindow(window, segments, tokens) {
  const bySegment = new Map();
  for (const token of tokens.slice(window.start, window.end)) {
    const bounds = bySegment.get(token.segmentIndex) || { start: token.start, end: token.end };
    bounds.start = Math.min(bounds.start, token.start);
    bounds.end = Math.max(bounds.end, token.end);
    bySegment.set(token.segmentIndex, bounds);
  }
  return [...bySegment.entries()].map(([segmentIndex, bounds]) =>
    segments[segmentIndex].text.slice(bounds.start, bounds.end).trim()
  );
}

function resolvePart(imageRecord, part) {
  const { segments, tokens } = tokenizedSegments(part.srt_content || '');
  let cursor = 0;
  const highlights = [];
  const matches = [];

  for (const source of imageRecord.phrases) {
    const sentencePieces = source.ocr_phrase.split(/(?<=[.!?])\s+/).filter(Boolean);
    // If an unreadable badge caused adjacent green regions to be accumulated,
    // the detected badge belongs to the final region immediately before it.
    const matchPhrase = sentencePieces.length > 1 ? sentencePieces.at(-1) : source.ocr_phrase;
    const window = bestWindow(matchPhrase, tokens, cursor);
    const minimum = normalizedTokens(matchPhrase).length <= 3 ? 0.67 : 0.72;
    if (!window || window.score < minimum) {
      matches.push({ ...source, matched_phrase: matchPhrase, score: window?.score || 0, resolved: false });
      if (window?.score >= 0.3) cursor = Math.max(cursor, window.end);
      continue;
    }
    const phrases = exactPhrasesForWindow(window, segments, tokens);
    phrases.forEach((phrase, index) => {
      highlights.push({
        question_number: source.question_number,
        phrase,
        ...(index < phrases.length - 1 ? { show_badge: false } : {}),
      });
    });
    matches.push({ ...source, matched_phrase: matchPhrase, score: Number(window.score.toFixed(4)), resolved: true, phrases });
    cursor = Math.max(cursor, window.end);
  }

  const resolvedQuestionNumbers = new Set(highlights.map((item) => item.question_number));
  for (const match of matches.filter((item) => !item.resolved)) {
    if (resolvedQuestionNumbers.has(match.question_number)) continue;
    const window = bestWindow(match.matched_phrase, tokens, 0, true);
    const minimum = normalizedTokens(match.matched_phrase).length <= 3 ? 0.72 : 0.78;
    if (!window || window.score < minimum) continue;
    const phrases = exactPhrasesForWindow(window, segments, tokens);
    phrases.forEach((phrase, index) => {
      highlights.push({
        question_number: match.question_number,
        phrase,
        ...(index < phrases.length - 1 ? { show_badge: false } : {}),
      });
    });
    resolvedQuestionNumbers.add(match.question_number);
    match.resolved = true;
    match.globalFallback = true;
    match.score = Number(window.score.toFixed(4));
    match.phrases = phrases;
  }

  const expectedStart = (imageRecord.part - 1) * 10 + 1;
  const expected = Array.from({ length: 10 }, (_, index) => expectedStart + index);
  const detected = [...new Set(imageRecord.phrases.map((item) => item.question_number))].sort(
    (a, b) => a - b
  );
  const resolved = [...new Set(highlights.map((item) => item.question_number))].sort((a, b) => a - b);
  return {
    highlights,
    matches,
    expected,
    detected,
    resolved,
    missingDetected: expected.filter((number) => !detected.includes(number)),
    missingResolved: expected.filter((number) => !resolved.includes(number)),
  };
}

async function main() {
  const extracted = JSON.parse(readFileSync(INPUT, 'utf8'));
  const supabase = createClient(required('VITE_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from('passages')
    .select('id,title,cambridge_year,cambridge_test_number,content,updated_at')
    .eq('test_type', 'listening');
  if (error) throw error;

  const report = [];
  for (const imageRecord of extracted) {
    const passage = data.find(
      (row) =>
        row.cambridge_year === imageRecord.year && row.cambridge_test_number === imageRecord.test
    );
    if (!passage) throw new Error(`Missing passage ${imageRecord.year}/${imageRecord.test}`);
    const parts = JSON.parse(passage.content);
    const part = parts[imageRecord.part - 1];
    const result = resolvePart(imageRecord, part);
    report.push({
      passageId: passage.id,
      updatedAt: passage.updated_at,
      year: imageRecord.year,
      test: imageRecord.test,
      part: imageRecord.part,
      title: part.title,
      badgesDetected: imageRecord.badges_detected,
      ...result,
    });
  }

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  const unresolved = report.flatMap((item) =>
    item.matches.filter((match) => !match.resolved).map((match) => ({
      target: `${item.year}/${item.test}/${item.part}`,
      question: match.question_number,
      phrase: match.ocr_phrase,
      score: Number(match.score.toFixed(4)),
    }))
  );
  const incomplete = report
    .filter((item) => item.missingDetected.length || item.missingResolved.length)
    .map((item) => ({
      target: `${item.year}/${item.test}/${item.part}`,
      missingDetected: item.missingDetected,
      missingResolved: item.missingResolved,
    }));
  let appliedPassages = 0;
  let preservedCuratedSections = 0;
  if (shouldApply) {
    for (const passage of data) {
      const passageSections = report.filter((item) => item.passageId === passage.id);
      if (!passageSections.length) continue;
      const parts = JSON.parse(passage.content);
      passageSections.forEach((section) => {
        const index = section.part - 1;
        const isHandCuratedReference = section.year === 2026 && section.test === 4;
        if (
          isHandCuratedReference &&
          Array.isArray(parts[index].transcript_highlights) &&
          parts[index].transcript_highlights.length
        ) {
          preservedCuratedSections += 1;
          return;
        }
        parts[index] = { ...parts[index], transcript_highlights: section.highlights };
      });
      const { data: updated, error: updateError } = await supabase
        .from('passages')
        .update({ content: JSON.stringify(parts) })
        .eq('id', passage.id)
        .eq('updated_at', passage.updated_at)
        .select('id');
      if (updateError) throw updateError;
      if (updated.length !== 1) throw new Error(`Optimistic update conflict for ${passage.id}`);
      appliedPassages += 1;
    }
  }
  console.log(
    JSON.stringify(
      {
        sections: report.length,
        resolvedPhrases: report.reduce((total, item) => total + item.highlights.length, 0),
        unresolved,
        incomplete,
        appliedPassages,
        preservedCuratedSections,
        output: OUTPUT,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
