import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseline = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260902120537_complete_project_baseline.sql'),
  'utf8'
);
const sourceMarker = '-- Source migration: ';

export function readMigrationSource(filenameOrName: string): string {
  const sourceName = filenameOrName.replace(/^\d{14}_/, '').replace(/\.sql$/, '');
  const lines = baseline.split('\n');
  const markerStart = lines.findIndex(
    (line) => line.startsWith(sourceMarker) && line.endsWith(`_${sourceName}`)
  );

  if (markerStart < 0) {
    throw new Error(`Canonical migration source not found: ${sourceName}`);
  }

  const bodyStart = markerStart + 3;
  const nextMarker = lines.findIndex(
    (line, index) => index > bodyStart && line.startsWith(sourceMarker)
  );
  const bodyEnd = nextMarker < 0 ? lines.length : nextMarker - 1;

  return lines.slice(bodyStart, bodyEnd).join('\n');
}

export function readLatestMigrationSourceDefining(marker: string): string {
  const sections = baseline
    .split(`\n${sourceMarker}`)
    .slice(1)
    .map((section) => `${sourceMarker}${section}`);
  const source = sections.reverse().find((section) => section.includes(marker));

  if (!source) {
    throw new Error(`No canonical migration source defines: ${marker}`);
  }

  return source;
}
