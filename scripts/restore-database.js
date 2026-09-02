/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to restore (in dependency order)
const RESTORE_ORDER = [
  // Core user data (must be first)
  'users',
  'consent_history',
  // Content (no user dependency)
  'passages',
  'questions',
  'vocabulary_items',
  'resources',
  // Gamification (depends on users)
  'achievements',
  'user_achievements',
  'user_points',
  // Test progress (depends on users, passages)
  'test_sessions',
  // Learning & Analytics
  'learning_paths',
  'learning_path_activities',
  'skill_proficiency',
  'daily_focus',
  'analytics_data',
  // System (no dependencies)
  'promo_codes',
  'notifications',
  'system_settings',
  'tier_rate_limits',
  'ai_feedback_cache',
  'ai_api_usage',
];

function listAvailableBackups() {
  const backupDir = '../backups';

  if (!existsSync(backupDir)) {
    console.log('📁 No backups directory found.');
    return [];
  }

  const files = readdirSync(backupDir)
    .filter((file) => file.startsWith('database_backup_') && file.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first

  return files.map((file) => join(backupDir, file));
}

function validateBackupFile(backupPath) {
  try {
    if (!existsSync(backupPath)) {
      throw new Error('Backup file does not exist');
    }

    const content = readFileSync(backupPath, 'utf8');
    const backup = JSON.parse(content);

    if (!backup.timestamp || !backup.tables) {
      throw new Error('Invalid backup file format');
    }

    return backup;
  } catch (error) {
    throw new Error(`Invalid backup file: ${error.message}`);
  }
}

async function clearTable(tableName) {
  try {
    // Get all records to delete (we need IDs for proper deletion)
    const { data: records, error: selectError } = await supabase.from(tableName).select('id');

    if (selectError) {
      console.warn(`⚠️  Could not read ${tableName} for clearing: ${selectError.message}`);
      return;
    }

    if (!records || records.length === 0) {
      console.log(`📭 Table ${tableName} is already empty`);
      return;
    }

    // Delete all records
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.warn(`⚠️  Could not clear ${tableName}: ${deleteError.message}`);
    } else {
      console.log(`🗑️  Cleared ${records.length} records from ${tableName}`);
    }
  } catch (error) {
    console.warn(`⚠️  Exception clearing ${tableName}: ${error.message}`);
  }
}

async function restoreTable(tableName, tableData) {
  if (!tableData || !tableData.data || tableData.data.length === 0) {
    console.log(`📭 No data to restore for table: ${tableName}`);
    return;
  }

  console.log(`📥 Restoring ${tableData.data.length} records to ${tableName}`);

  try {
    // Insert data in batches to avoid timeout
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < tableData.data.length; i += batchSize) {
      batches.push(tableData.data.slice(i, i + batchSize));
    }

    let totalRestored = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`   📦 Processing batch ${i + 1}/${batches.length} (${batch.length} records)`);

      const { error } = await supabase.from(tableName).insert(batch);

      if (error) {
        console.error(`❌ Error restoring batch ${i + 1} for ${tableName}: ${error.message}`);
        // Continue with next batch instead of failing completely
      } else {
        totalRestored += batch.length;
      }
    }

    console.log(
      `✅ Successfully restored ${totalRestored}/${tableData.data.length} records to ${tableName}`
    );
  } catch (error) {
    console.error(`❌ Exception restoring ${tableName}: ${error.message}`);
  }
}

async function restoreDatabase(backupPath, options = {}) {
  try {
    console.log('🔄 Starting database restore...');
    console.log(`📁 Backup file: ${backupPath}`);

    // Validate backup file
    const backup = validateBackupFile(backupPath);
    console.log(`📅 Backup created: ${backup.timestamp}`);

    // Confirm restore operation
    if (!options.skipConfirmation) {
      console.log('\n⚠️  WARNING: This will replace all existing data!');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log('\n🗑️  Clearing existing data...');

    // Clear tables in reverse order to respect foreign key constraints
    const clearOrder = [...RESTORE_ORDER].reverse();
    for (const table of clearOrder) {
      await clearTable(table);
    }

    console.log('\n📥 Restoring data...');

    // Restore tables in dependency order
    for (const table of RESTORE_ORDER) {
      if (backup.tables[table]) {
        await restoreTable(table, backup.tables[table]);
      } else {
        console.log(`⚠️  No backup data found for table: ${table}`);
      }
    }

    console.log('\n✅ Database restore completed successfully!');
    console.log('\n📋 Summary:');

    let totalRestored = 0;
    for (const [table, info] of Object.entries(backup.tables)) {
      if (info.error) {
        console.log(`   ${table}: SKIPPED - ${info.error}`);
      } else {
        console.log(`   ${table}: ${info.count} records`);
        totalRestored += info.count;
      }
    }

    console.log(`\n📈 Total records restored: ${totalRestored}`);
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.log('📋 Available backups:');
    const backups = listAvailableBackups();

    if (backups.length === 0) {
      console.log('   No backups found. Create one first with: npm run backup-db');
    } else {
      backups.forEach((backup, index) => {
        const filename = backup.split('/').pop();
        console.log(`   ${index + 1}. ${filename}`);
      });

      console.log('\n💡 Usage: npm run restore-db <backup-file>');
      console.log(
        '   Example: npm run restore-db ../backups/database_backup_2025-01-20T10-30-00.json'
      );
    }
  } else {
    restoreDatabase(backupFile);
  }
}

export { restoreDatabase, listAvailableBackups, validateBackupFile };
