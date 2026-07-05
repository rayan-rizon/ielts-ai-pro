import { createClient } from '@supabase/supabase-js';
import { writeFileSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load environment variables
dotenv.config({ path: join(rootDir, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Tables to seed (in dependency order)
const TABLES_TO_SEED = [
  'users',
  'consent_history',
  'passages',
  'questions',
  'vocabulary_items',
  'resources',
  'test_sessions',
  'achievements',
  'user_achievements',
  'user_points',
  'learning_paths',
  'learning_path_activities',
  'skill_proficiency',
  'daily_focus',
  'analytics_data',
  'promo_codes',
  'notifications',
  'system_settings',
  'tier_rate_limits',
  'ai_feedback_cache',
  'ai_api_usage',
];

const formatValue = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return value;
  if (typeof value === 'object') {
    // Handle arrays and objects
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  // Handle strings
  return `'${String(value).replace(/'/g, "''")}'`;
};

async function generateSeed() {
  try {
    const seedFile = join(rootDir, 'supabase', 'seed.sql');
    console.log(`🔄 Generating seed file at ${seedFile}...`);

    // Clear/Create file
    writeFileSync(
      seedFile,
      '-- Auto-generated seed file\n-- Generated on: ' + new Date().toISOString() + '\n\n'
    );

    let totalRecords = 0;

    for (const table of TABLES_TO_SEED) {
      console.log(`📦 Processing table: ${table}`);

      const { data, error } = await supabase.from(table).select('*');

      if (error) {
        console.warn(`⚠️  Warning: Could not fetch table ${table}: ${error.message}`);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`   No records found for ${table}`);
        continue;
      }

      const columns = Object.keys(data[0]).join(', ');
      appendFileSync(seedFile, `\n-- Data for ${table} (${data.length} records)\n`);

      const insertStart = `INSERT INTO public.${table} (${columns}) VALUES`;

      // Batch writes to avoid huge memory usage, though direct append is fine for this scale
      for (const row of data) {
        // Ensure we map values in the same order as keys
        const values = Object.keys(data[0])
          .map((key) => formatValue(row[key]))
          .join(', ');
        const sql = `${insertStart} (${values}) ON CONFLICT DO NOTHING;\n`;
        appendFileSync(seedFile, sql);
      }

      console.log(`✅ Added ${data.length} records to seed file`);
      totalRecords += data.length;
    }

    console.log(`\n✅ Seed file generated successfully!`);
    console.log(`Total records: ${totalRecords}`);
    console.log(`Location: ${seedFile}`);
  } catch (error) {
    console.error('❌ Generator failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSeed();
}

export { generateSeed };
