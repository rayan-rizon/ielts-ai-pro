#!/usr/bin/env node
/**
 * Validates src/features/university-match/data/*.json and reports which entries
 * are due for re-verification.
 *
 * Exits non-zero on a schema violation so bad data cannot ship. Staleness is a
 * warning, not a failure: an old entry still linked to its source page is more
 * useful than no entry, as long as the UI says it is old.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(
  process.cwd(),
  'src',
  'features',
  'university-match',
  'data',
);

const REVIEW_DUE_DAYS = 180;
const STALE_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

const LEVELS = new Set(['undergraduate', 'postgraduate']);
const SKILLS = new Set(['listening', 'reading', 'writing', 'speaking']);

const errors = [];
const reviewDue = [];
const stale = [];

function isBand(value) {
  return (
    typeof value === 'number' &&
    value >= 0 &&
    value <= 9 &&
    Math.round(value * 2) === value * 2
  );
}

function checkRequirement(requirement, where) {
  if (!requirement || typeof requirement !== 'object') {
    errors.push(`${where}: requirement must be an object`);
    return;
  }
  if (!isBand(requirement.overall)) {
    errors.push(`${where}: overall must be a band in 0.5 steps`);
  }
  if (
    requirement.minComponent !== undefined &&
    !isBand(requirement.minComponent)
  ) {
    errors.push(`${where}: minComponent must be a band in 0.5 steps`);
  }
  const range = requirement.range;
  if (range !== undefined) {
    if (!isBand(range.min) || !isBand(range.max)) {
      errors.push(`${where}: range min/max must be bands in 0.5 steps`);
    } else if (range.min > range.max) {
      errors.push(`${where}: range min is above range max`);
    } else if (
      isBand(requirement.overall) &&
      (requirement.overall < range.min || requirement.overall > range.max)
    ) {
      // A typical figure outside its own published spread means one of the two
      // was mis-transcribed from the source page.
      errors.push(
        `${where}: overall ${requirement.overall} sits outside its published range`,
      );
    }
  }
  for (const [skill, band] of Object.entries(requirement.skills ?? {})) {
    if (!SKILLS.has(skill)) errors.push(`${where}: unknown skill "${skill}"`);
    if (!isBand(band)) errors.push(`${where}: ${skill} must be a band in 0.5 steps`);
  }
}

function checkEntry(entry, where, seenIds) {
  for (const field of ['id', 'name', 'country', 'sourceUrl', 'lastVerified']) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      errors.push(`${where}: "${field}" is required`);
    }
  }

  if (seenIds.has(entry.id)) errors.push(`${where}: duplicate id "${entry.id}"`);
  seenIds.add(entry.id);

  if (typeof entry.ieltsAccepted !== 'boolean') {
    errors.push(`${where}: ieltsAccepted must be true or false`);
  }
  if (entry.scope !== 'university' && entry.scope !== 'programme') {
    errors.push(`${where}: scope must be "university" or "programme"`);
  }

  if (!/^https:\/\//.test(entry.sourceUrl ?? '')) {
    errors.push(`${where}: sourceUrl must be an https URL a learner can open`);
  }

  const requirements = entry.requirements ?? {};
  for (const [level, requirement] of Object.entries(requirements)) {
    if (!LEVELS.has(level)) errors.push(`${where}: unknown level "${level}"`);
    checkRequirement(requirement, `${where} → ${level}`);
  }

  // An entry that accepts IELTS but states no requirement tells a learner
  // nothing, and would render as "unknown" forever.
  if (entry.ieltsAccepted && Object.keys(requirements).length === 0) {
    errors.push(`${where}: accepts IELTS but lists no requirement`);
  }

  for (const [index, programme] of (
    entry.higherRequirementProgrammes ?? []
  ).entries()) {
    const at = `${where} → programme[${index}]`;
    if (typeof programme.programme !== 'string' || !programme.programme.trim()) {
      errors.push(`${at}: programme name is required`);
    }
    if (programme.level !== undefined && !LEVELS.has(programme.level)) {
      errors.push(`${at}: unknown level "${programme.level}"`);
    }
    checkRequirement(programme.requirement, at);
  }

  const verified = Date.parse(`${entry.lastVerified}T00:00:00Z`);
  if (Number.isNaN(verified)) {
    errors.push(`${where}: lastVerified must be an ISO date (YYYY-MM-DD)`);
    return;
  }

  const ageDays = Math.floor((Date.now() - verified) / DAY_MS);
  if (ageDays > STALE_DAYS) stale.push({ name: entry.name, ageDays });
  else if (ageDays > REVIEW_DUE_DAYS) reviewDue.push({ name: entry.name, ageDays });
}

let files = [];
try {
  files = readdirSync(DATA_DIR).filter((file) => file.endsWith('.json'));
} catch {
  console.error(`No data directory at ${DATA_DIR}`);
  process.exit(1);
}

let total = 0;
const seenIds = new Set();

for (const file of files) {
  const fullPath = path.join(DATA_DIR, file);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch (error) {
    errors.push(`${file}: invalid JSON — ${error.message}`);
    continue;
  }

  if (!Array.isArray(parsed)) {
    errors.push(`${file}: must be an array of entries`);
    continue;
  }

  const expectedCountry = path.basename(file, '.json').toUpperCase();
  parsed.forEach((entry, index) => {
    total += 1;
    const where = `${file}[${index}] ${entry?.name ?? '(unnamed)'}`;
    checkEntry(entry ?? {}, where, seenIds);
    if (entry?.country && entry.country !== expectedCountry) {
      errors.push(`${where}: country "${entry.country}" does not match ${file}`);
    }
  });
}

console.log(`Checked ${total} entries across ${files.length} file(s).`);

if (reviewDue.length > 0) {
  console.log(`\nDue for re-verification (over ${REVIEW_DUE_DAYS} days):`);
  for (const { name, ageDays } of reviewDue) {
    console.log(`  ${name} — ${ageDays} days`);
  }
}

if (stale.length > 0) {
  console.log(`\nStale, shown to learners with a warning (over ${STALE_DAYS} days):`);
  for (const { name, ageDays } of stale) {
    console.log(`  ${name} — ${ageDays} days`);
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} schema error(s):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log('\nSchema OK.');
