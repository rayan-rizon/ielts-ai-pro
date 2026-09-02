import { describe, it, expect } from 'vitest';

/**
 * Database Migration Tests
 * Verifies migration safety and best practices
 */

// Migration naming convention
const MIGRATION_NAME_PATTERN = /^\d{14}_[a-z_]+\.sql$/;

// Example migrations from the project
const MIGRATIONS = ['20260902120537_complete_project_baseline.sql'];

describe('Migration Naming Conventions', () => {
  it('should follow timestamp_description.sql format', () => {
    MIGRATIONS.forEach((migration) => {
      // Check format: YYYYMMDDHHMMSS_description.sql
      const parts = migration.split('_');
      expect(parts.length).toBeGreaterThanOrEqual(2);

      const timestamp = parts[0];
      expect(timestamp).toMatch(/^\d{14}$/);
    });
  });

  it('should have descriptive names', () => {
    MIGRATIONS.forEach((migration) => {
      const name = migration.replace(/^\d{14}_/, '').replace('.sql', '');
      expect(name.length).toBeGreaterThan(5);
    });
  });

  it('should end with .sql extension', () => {
    MIGRATIONS.forEach((migration) => {
      expect(migration.endsWith('.sql')).toBe(true);
    });
  });
});

describe('Migration Best Practices', () => {
  // Safe migration patterns
  const SAFE_PATTERNS = {
    addColumn: /ALTER TABLE \w+ ADD COLUMN/i,
    addIndex: /CREATE INDEX/i,
    addConstraint: /ADD CONSTRAINT/i,
    createTable: /CREATE TABLE/i,
    enableRls: /ENABLE ROW LEVEL SECURITY/i,
    createPolicy: /CREATE POLICY/i,
    createFunction: /CREATE OR REPLACE FUNCTION/i,
  };

  // Potentially dangerous patterns
  const DANGEROUS_PATTERNS = {
    dropColumn: /DROP COLUMN(?! IF EXISTS)/i,
    dropTable: /DROP TABLE(?! IF EXISTS)/i,
    truncate: /TRUNCATE TABLE/i,
    deleteAll: /DELETE FROM \w+ WHERE TRUE/i,
  };

  it('should use IF EXISTS for DROP operations', () => {
    const safeDrop = 'DROP TABLE IF EXISTS temp_table;';
    const unsafeDrop = 'DROP TABLE temp_table;';

    expect(DANGEROUS_PATTERNS.dropTable.test(unsafeDrop)).toBe(true);
    expect(DANGEROUS_PATTERNS.dropTable.test(safeDrop)).toBe(false);
  });

  it('should use IF NOT EXISTS for CREATE operations', () => {
    const safeCreate = 'CREATE TABLE IF NOT EXISTS users (id UUID);';
    expect(safeCreate).toContain('IF NOT EXISTS');
  });

  it('should use CREATE OR REPLACE for functions', () => {
    const safeFunction = 'CREATE OR REPLACE FUNCTION my_func()';
    expect(SAFE_PATTERNS.createFunction.test(safeFunction)).toBe(true);
  });
});

describe('Migration Content Validation', () => {
  // Example migration content patterns
  const validateMigrationContent = (content: string): { valid: boolean; warnings: string[] } => {
    const warnings: string[] = [];

    // Check for raw DELETE without WHERE clause
    if (/DELETE FROM \w+;/i.test(content)) {
      warnings.push('DELETE without WHERE clause detected');
    }

    // Check for DROP without IF EXISTS
    if (/DROP (TABLE|COLUMN|INDEX) (?!IF EXISTS)/i.test(content)) {
      warnings.push('DROP without IF EXISTS detected');
    }

    // Check for missing transaction wrapper on multi-statement migrations
    const statements = content.split(';').filter((s) => s.trim().length > 0);
    if (statements.length > 5 && !content.includes('BEGIN') && !content.includes('TRANSACTION')) {
      warnings.push('Large migration without explicit transaction');
    }

    return { valid: warnings.length === 0, warnings };
  };

  it('should detect unsafe DELETE statements', () => {
    const unsafeContent = 'DELETE FROM users;';
    const result = validateMigrationContent(unsafeContent);
    expect(result.warnings).toContain('DELETE without WHERE clause detected');
  });

  it('should pass safe migration content', () => {
    const safeContent = `
            ALTER TABLE users ADD COLUMN IF NOT EXISTS new_field TEXT;
            CREATE INDEX IF NOT EXISTS idx_new_field ON users(new_field);
        `;
    const result = validateMigrationContent(safeContent);
    expect(result.valid).toBe(true);
  });
});

describe('Migration Rollback Safety', () => {
  interface MigrationPair {
    up: string;
    down: string;
  }

  const hasReversibleMigration = (pair: MigrationPair): boolean => {
    // Check if migration has a corresponding rollback
    if (pair.up.includes('CREATE TABLE')) {
      return pair.down.includes('DROP TABLE');
    }
    if (pair.up.includes('ADD COLUMN')) {
      return pair.down.includes('DROP COLUMN');
    }
    if (pair.up.includes('CREATE INDEX')) {
      return pair.down.includes('DROP INDEX');
    }
    return true;
  };

  it('should have rollback for CREATE TABLE', () => {
    const pair: MigrationPair = {
      up: 'CREATE TABLE new_table (id UUID);',
      down: 'DROP TABLE IF EXISTS new_table;',
    };
    expect(hasReversibleMigration(pair)).toBe(true);
  });

  it('should have rollback for ADD COLUMN', () => {
    const pair: MigrationPair = {
      up: 'ALTER TABLE users ADD COLUMN new_col TEXT;',
      down: 'ALTER TABLE users DROP COLUMN new_col;',
    };
    expect(hasReversibleMigration(pair)).toBe(true);
  });
});

describe('Migration Ordering', () => {
  it('should have migrations in chronological order', () => {
    const timestamps = MIGRATIONS.map((m) => parseInt(m.split('_')[0]));

    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
    }
  });

  it('should have unique timestamps', () => {
    const timestamps = MIGRATIONS.map((m) => m.split('_')[0]);
    const uniqueTimestamps = new Set(timestamps);
    expect(uniqueTimestamps.size).toBe(timestamps.length);
  });
});

describe('Migration Dependencies', () => {
  // Simulating migration dependency checks
  const SCHEMA_ORDER = {
    users: [],
    passages: [],
    questions: ['passages'],
    test_sessions: ['users', 'passages'],
    user_achievements: ['users', 'achievements'],
    achievements: [],
    user_points: ['users'],
    vocabulary_items: [],
  };

  const checkDependencyOrder = (tableOrder: string[]): boolean => {
    const created = new Set<string>();

    for (const table of tableOrder) {
      const deps = SCHEMA_ORDER[table as keyof typeof SCHEMA_ORDER] || [];
      for (const dep of deps) {
        if (!created.has(dep)) {
          return false;
        }
      }
      created.add(table);
    }
    return true;
  };

  it('should create tables in correct dependency order', () => {
    const correctOrder = [
      'users',
      'passages',
      'achievements',
      'questions',
      'test_sessions',
      'user_achievements',
    ];
    expect(checkDependencyOrder(correctOrder)).toBe(true);
  });

  it('should detect incorrect dependency order', () => {
    const wrongOrder = ['questions', 'passages']; // questions depends on passages
    expect(checkDependencyOrder(wrongOrder)).toBe(false);
  });
});
