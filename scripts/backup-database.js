import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to backup (in dependency order)
const TABLES_TO_BACKUP = [
  // Core user data
  'users',
  'consent_history',
  // Content
  'passages',
  'questions',
  'vocabulary_items',
  'resources',
  // Test progress
  'test_sessions',
  // Gamification
  'achievements',
  'user_achievements',
  'user_points',
  // Learning & Analytics
  'learning_paths',
  'learning_path_activities',
  'skill_proficiency',
  'daily_focus',
  'analytics_data',
  // System
  'promo_codes',
  'notifications',
  'system_settings',
  'tier_rate_limits',
  'ai_feedback_cache',
  'ai_api_usage',
];

async function createDatabaseBackup() {
  try {
    console.log('🔄 Starting database backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = join(rootDir, 'backups');
    const backupFile = join(backupDir, `database_backup_${timestamp}.json`);

    // Create backups directory if it doesn't exist
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tables: {},
    };

    // Backup each table
    for (const table of TABLES_TO_BACKUP) {
      console.log(`📦 Backing up table: ${table}`);

      try {
        const { data, error } = await supabase.from(table).select('*').select('*');

        if (error) {
          console.warn(`⚠️  Warning: Could not backup table ${table}: ${error.message}`);
          backup.tables[table] = { error: error.message, data: [] };
        } else {
          backup.tables[table] = { data: data || [], count: (data || []).length };
          console.log(`✅ Backed up ${(data || []).length} records from ${table}`);
        }
      } catch (err) {
        console.warn(`⚠️  Warning: Exception backing up table ${table}: ${err.message}`);
        backup.tables[table] = { error: err.message, data: [] };
      }
    }

    // Save backup to file
    writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log('\n✅ Database backup completed successfully!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 Backup summary:`);

    let totalRecords = 0;
    for (const [table, info] of Object.entries(backup.tables)) {
      if (info.error) {
        console.log(`   ${table}: ERROR - ${info.error}`);
      } else {
        console.log(`   ${table}: ${info.count} records`);
        totalRecords += info.count;
      }
    }

    console.log(`\n📈 Total records backed up: ${totalRecords}`);

    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDatabaseBackup();
}

export { createDatabaseBackup };
