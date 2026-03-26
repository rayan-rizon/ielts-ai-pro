/* eslint-env node */
import { createDatabaseBackup } from './backup-database.js';
import { restoreDatabase, listAvailableBackups } from './restore-database.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const execAsync = promisify(exec);

class DatabaseManager {
  constructor() {
    this.validateEnvironment();
  }

  validateEnvironment() {
    const required = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach((key) => console.error(`   - ${key}`));
      process.exit(1);
    }
  }

  async createBackup() {
    console.log('🔄 Creating database backup...');
    try {
      const backupFile = await createDatabaseBackup();
      console.log(`✅ Backup created successfully: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async restoreFromBackup(backupFile) {
    console.log(`🔄 Restoring database from: ${backupFile}`);
    try {
      await restoreDatabase(backupFile, { skipConfirmation: false });
      console.log('✅ Database restored successfully');
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    }
  }

  async resetDatabase() {
    console.log('🔄 Resetting database with Supabase...');
    try {
      // Change to project root directory
      process.chdir('..');

      const { stdout, stderr } = await execAsync('supabase db reset');

      if (stderr && !stderr.includes('Finished')) {
        console.warn('⚠️  Reset warnings:', stderr);
      }

      console.log('✅ Database reset completed');
      console.log(stdout);

      // Return to scripts directory
      process.chdir('scripts');
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      throw error;
    }
  }

  async safeReset() {
    console.log('🛡️  Performing safe database reset with backup...');

    try {
      // Step 1: Create backup
      console.log('\n📦 Step 1: Creating backup before reset...');
      const backupFile = await this.createBackup();

      // Step 2: Reset database
      console.log('\n🔄 Step 2: Resetting database...');
      await this.resetDatabase();

      // Step 3: Recreate admin user
      console.log('\n👤 Step 3: Recreating admin user...');
      await this.createAdminUser();

      console.log('\n✅ Safe reset completed successfully!');
      console.log(`📁 Backup available at: ${backupFile}`);
    } catch (error) {
      console.error('❌ Safe reset failed:', error.message);
      throw error;
    }
  }

  async createAdminUser() {
    try {
      const { stderr } = await execAsync('npm run create-admin');

      if (stderr && !stderr.includes('deprecated')) {
        console.warn('⚠️  Admin creation warnings:', stderr);
      }

      console.log('✅ Admin user created successfully');
    } catch (error) {
      console.error('❌ Admin user creation failed:', error.message);
      throw error;
    }
  }

  listBackups() {
    console.log('📋 Available database backups:');
    const backups = listAvailableBackups();

    if (backups.length === 0) {
      console.log('   No backups found.');
      console.log('   Create one with: npm run backup-db');
    } else {
      backups.forEach((backup, index) => {
        const filename = backup.split('/').pop();
        const timestamp = filename.replace('database_backup_', '').replace('.json', '');
        const date = new Date(timestamp.replace(/-/g, ':')).toLocaleString();
        console.log(`   ${index + 1}. ${filename} (${date})`);
      });
    }

    return backups;
  }

  async interactiveMode() {
    console.log('🎛️  Database Manager - Interactive Mode');
    console.log('=====================================\n');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

    try {
      while (true) {
        console.log('\nAvailable commands:');
        console.log('1. Create backup');
        console.log('2. List backups');
        console.log('3. Restore from backup');
        console.log('4. Reset database');
        console.log('5. Safe reset (backup + reset + admin)');
        console.log('6. Create admin user');
        console.log('7. Exit');

        const choice = await question('\nSelect an option (1-7): ');

        switch (choice.trim()) {
          case '1':
            await this.createBackup();
            break;

          case '2':
            this.listBackups();
            break;

          case '3':
            const backups = this.listBackups();
            if (backups.length > 0) {
              const index = await question('\nEnter backup number to restore: ');
              const backupIndex = parseInt(index) - 1;
              if (backupIndex >= 0 && backupIndex < backups.length) {
                await this.restoreFromBackup(backups[backupIndex]);
              } else {
                console.log('❌ Invalid backup number');
              }
            }
            break;

          case '4':
            const confirm = await question('⚠️  This will reset the database. Continue? (y/N): ');
            if (confirm.toLowerCase() === 'y') {
              await this.resetDatabase();
            }
            break;

          case '5':
            const confirmSafe = await question('🛡️  Perform safe reset with backup? (y/N): ');
            if (confirmSafe.toLowerCase() === 'y') {
              await this.safeReset();
            }
            break;

          case '6':
            await this.createAdminUser();
            break;

          case '7':
            console.log('👋 Goodbye!');
            rl.close();
            return;

          default:
            console.log('❌ Invalid option. Please select 1-7.');
        }
      }
    } catch (error) {
      console.error('❌ Interactive mode error:', error.message);
    } finally {
      rl.close();
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new DatabaseManager();
  const command = process.argv[2];

  switch (command) {
    case 'backup':
      manager.createBackup();
      break;

    case 'restore':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.log('❌ Please specify backup file');
        console.log('Usage: npm run db-manager restore <backup-file>');
        manager.listBackups();
      } else {
        manager.restoreFromBackup(backupFile);
      }
      break;

    case 'reset':
      manager.resetDatabase();
      break;

    case 'safe-reset':
      manager.safeReset();
      break;

    case 'list':
      manager.listBackups();
      break;

    case 'interactive':
    case undefined:
      manager.interactiveMode();
      break;

    default:
      console.log('❌ Unknown command:', command);
      console.log('Available commands: backup, restore, reset, safe-reset, list, interactive');
  }
}

export { DatabaseManager };
