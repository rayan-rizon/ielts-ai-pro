// Full-database backup: every table in the public schema, every row.
//
//   node scripts/backup-database.js
//
// Discovers tables dynamically from the PostgREST schema so newly added tables
// are never silently missed, pages through results so nothing is truncated at
// PostgREST's max-rows limit, and verifies each table's row count against an
// exact server-side count before declaring success.
//
// Schema/DDL is NOT in here — that lives in supabase/migrations/ (tracked in
// git). A restore needs both: migrations rebuild the structure, this file
// refills the data.
//
// Output goes to backups/, which .gitignore excludes because these files
// contain real user PII.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// PostgREST caps a single response; page well under any server limit.
const PAGE_SIZE = 1000;

/**
 * Every table PostgREST exposes, read from its OpenAPI description. Preferred
 * over a hardcoded list, which silently goes stale as tables are added.
 */
async function discoverTables() {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` },
  });
  if (!response.ok) {
    throw new Error(`Could not read the PostgREST schema (HTTP ${response.status})`);
  }
  const spec = await response.json();
  const names = Object.keys(spec.definitions || spec.components?.schemas || {});
  if (names.length === 0) throw new Error('PostgREST schema listed no tables');
  return names.sort();
}

/** Fetch one table completely, page by page. */
async function fetchAllRows(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/** Server-side exact count, used to prove the export is complete. */
async function exactCount(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function createDatabaseBackup() {
  console.log('🔄 Starting full database backup...');

  const tables = await discoverTables();
  console.log(`🔎 Discovered ${tables.length} tables\n`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupDir = join(rootDir, 'backups');
  const backupFile = join(backupDir, `database_backup_${timestamp}.json`);
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });

  const backup = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    source: supabaseUrl,
    schemaNote: 'DDL lives in supabase/migrations/. Restore migrations first, then this data.',
    tables: {},
  };

  const incomplete = [];
  const failed = [];

  for (const table of tables) {
    try {
      const expected = await exactCount(table);
      const rows = await fetchAllRows(table);
      backup.tables[table] = { data: rows, count: rows.length, expectedCount: expected };

      if (rows.length === expected) {
        console.log(`✅ ${table}: ${rows.length} rows`);
      } else {
        incomplete.push(`${table} (got ${rows.length}, expected ${expected})`);
        console.log(`❌ ${table}: got ${rows.length}, expected ${expected}`);
      }
    } catch (error) {
      failed.push(`${table}: ${error.message}`);
      backup.tables[table] = { error: error.message, data: [], count: 0 };
      console.log(`⚠️  ${table}: ${error.message}`);
    }
  }

  const totalRows = Object.values(backup.tables).reduce((sum, entry) => sum + entry.count, 0);
  backup.totalRows = totalRows;
  backup.incompleteTables = incomplete;
  backup.failedTables = failed;

  writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  console.log(`\n📁 ${backupFile}`);
  console.log(`📈 ${totalRows} rows across ${tables.length} tables`);

  // A backup that quietly lost rows is worse than no backup, so fail loudly.
  if (incomplete.length || failed.length) {
    console.error('\n❌ BACKUP IS NOT COMPLETE — do not rely on this file:');
    for (const entry of [...incomplete, ...failed]) console.error(`   ${entry}`);
    process.exitCode = 1;
  } else {
    console.log('✅ Verified complete: every table matched its exact server-side row count.');
  }

  return backupFile;
}

// pathToFileURL, not string concatenation: the project path may contain spaces,
// which import.meta.url percent-encodes and a raw `file://${argv[1]}` does not.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createDatabaseBackup().catch((error) => {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  });
}

export { createDatabaseBackup };
