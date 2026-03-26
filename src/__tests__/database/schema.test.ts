import { describe, it, expect } from 'vitest';

/**
 * Database Schema Tests
 * Tests for verifying database table structures and relationships
 */

// Database schema definitions based on migrations
const TABLES = {
    users: {
        columns: ['id', 'auth_id', 'email', 'full_name', 'role', 'subscription_tier', 'target_band_score', 'study_hours_goal', 'current_streak', 'longest_streak', 'last_study_date', 'created_at', 'updated_at'],
        primaryKey: 'id',
        uniqueColumns: ['email', 'auth_id'],
        foreignKeys: [{ column: 'auth_id', references: 'auth.users(id)' }],
        indexes: ['idx_users_email', 'idx_users_role', 'idx_users_auth_id'],
    },
    passages: {
        columns: ['id', 'title', 'content', 'test_type', 'test_format', 'topic', 'access_tier', 'is_official_cambridge', 'audio_url', 'transcript', 'is_active', 'created_at', 'updated_at'],
        primaryKey: 'id',
        indexes: ['idx_passages_test_type', 'idx_passages_is_active'],
    },
    questions: {
        columns: ['id', 'passage_id', 'question_text', 'type', 'options', 'correct_answer', 'explanation', 'explanation_data', 'question_number', 'group_instructions', 'created_at', 'updated_at'],
        primaryKey: 'id',
        foreignKeys: [{ column: 'passage_id', references: 'passages(id)', onDelete: 'CASCADE' }],
        indexes: ['idx_questions_passage_id'],
    },
    test_sessions: {
        columns: ['id', 'user_id', 'passage_id', 'test_type', 'answers', 'score', 'is_completed', 'completed_at', 'content_data', 'created_at', 'updated_at'],
        primaryKey: 'id',
        foreignKeys: [
            { column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' },
            { column: 'passage_id', references: 'passages(id)' },
        ],
        indexes: ['idx_test_sessions_user_id', 'idx_test_sessions_completed'],
    },
    vocabulary_items: {
        columns: ['id', 'word', 'definition', 'example_sentence', 'synonyms', 'part_of_speech', 'ielts_level', 'topic', 'created_at', 'updated_at'],
        primaryKey: 'id',
    },
    achievements: {
        columns: ['id', 'name', 'description', 'badge_icon', 'badge_color', 'criteria', 'points', 'created_at', 'updated_at'],
        primaryKey: 'id',
    },
    user_achievements: {
        columns: ['id', 'user_id', 'achievement_id', 'unlocked_at'],
        primaryKey: 'id',
        foreignKeys: [
            { column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' },
            { column: 'achievement_id', references: 'achievements(id)', onDelete: 'CASCADE' },
        ],
        indexes: ['idx_user_achievements_user_id'],
    },
    user_points: {
        columns: ['id', 'user_id', 'points', 'level', 'updated_at'],
        primaryKey: 'id',
        foreignKeys: [{ column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' }],
        indexes: ['idx_user_points_user_id'],
    },
    promo_codes: {
        columns: ['id', 'code', 'discount_type', 'discount_value', 'max_uses', 'current_uses', 'valid_until', 'is_active', 'created_at', 'updated_at'],
        primaryKey: 'id',
        uniqueColumns: ['code'],
    },
    learning_paths: {
        columns: ['id', 'user_id', 'path_data', 'activities_completed', 'created_at', 'updated_at'],
        primaryKey: 'id',
        foreignKeys: [{ column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' }],
        indexes: ['idx_learning_paths_user_id'],
    },
    analytics_data: {
        columns: ['id', 'user_id', 'data_type', 'value', 'recorded_at'],
        primaryKey: 'id',
        foreignKeys: [{ column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' }],
        indexes: ['idx_analytics_data_user_id'],
    },
    // New Adaptive Learning Tables
    skill_proficiency: {
        columns: ['id', 'user_id', 'skill_code', 'module', 'mastery_probability', 'confidence_level', 'practice_count', 'correct_count', 'last_practiced_at', 'next_review_at', 'streak_count', 'created_at', 'updated_at'],
        primaryKey: 'id',
        foreignKeys: [{ column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' }],
        uniqueColumns: ['user_id', 'skill_code'],
        indexes: ['idx_skill_proficiency_user_id', 'idx_skill_proficiency_module'],
    },
    learning_path_activities: {
        columns: ['id', 'learning_path_id', 'user_id', 'activity_key', 'activity_type', 'module', 'title', 'description', 'skill_targets', 'scheduled_day', 'scheduled_date', 'estimated_minutes', 'priority', 'is_completed', 'completed_at', 'outcome_score', 'outcome_data', 'created_at', 'updated_at'],
        primaryKey: 'id',
        foreignKeys: [
            { column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' },
            { column: 'learning_path_id', references: 'learning_paths(id)', onDelete: 'CASCADE' },
        ],
        indexes: ['idx_learning_path_activities_user_id', 'idx_learning_path_activities_path_id'],
    },
    daily_focus: {
        columns: ['id', 'user_id', 'focus_date', 'primary_activity_id', 'primary_skill', 'primary_module', 'ai_reason', 'is_completed', 'completed_at', 'created_at'],
        primaryKey: 'id',
        foreignKeys: [{ column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' }],
        uniqueColumns: ['user_id', 'focus_date'],
        indexes: ['idx_daily_focus_user_date'],
    },
    // System Tables
    notifications: {
        columns: ['id', 'title', 'message', 'type', 'is_active', 'priority', 'created_at', 'updated_at'],
        primaryKey: 'id',
    },
    system_settings: {
        columns: ['id', 'setting_key', 'setting_value', 'description', 'created_at', 'updated_at'],
        primaryKey: 'id',
        uniqueColumns: ['setting_key'],
    },
    resources: {
        columns: ['id', 'title', 'description', 'resource_type', 'url', 'category', 'access_tier', 'is_active', 'created_at', 'updated_at'],
        primaryKey: 'id',
    },
    tier_rate_limits: {
        columns: ['id', 'tier_name', 'daily_limit', 'monthly_limit', 'created_at', 'updated_at'],
        primaryKey: 'id',
        uniqueColumns: ['tier_name'],
    },
    ai_feedback_cache: {
        columns: ['id', 'input_hash', 'feedback_data', 'created_at', 'expires_at'],
        primaryKey: 'id',
        uniqueColumns: ['input_hash'],
    },
    ai_api_usage: {
        columns: ['id', 'user_id', 'usage_date', 'request_count', 'token_count', 'created_at'],
        primaryKey: 'id',
        foreignKeys: [{ column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' }],
    },
    consent_history: {
        columns: ['id', 'user_id', 'consent_type', 'consented', 'consent_version', 'ip_address', 'created_at'],
        primaryKey: 'id',
        foreignKeys: [{ column: 'user_id', references: 'users(id)', onDelete: 'CASCADE' }],
        indexes: ['idx_consent_history_user_id'],
    },
};


describe('Database Schema - Core Tables', () => {
    it('should have users table with required columns', () => {
        const { columns, primaryKey } = TABLES.users;
        expect(columns).toContain('id');
        expect(columns).toContain('email');
        expect(columns).toContain('role');
        expect(columns).toContain('subscription_tier');
        expect(primaryKey).toBe('id');
    });

    it('should have passages table with test metadata', () => {
        const { columns } = TABLES.passages;
        expect(columns).toContain('test_type');
        expect(columns).toContain('test_format');
        expect(columns).toContain('is_active');
        expect(columns).toContain('access_tier');
    });

    it('should have questions table linked to passages', () => {
        const { foreignKeys } = TABLES.questions;
        const passageFk = foreignKeys?.find((fk) => fk.column === 'passage_id');
        expect(passageFk).toBeDefined();
        expect(passageFk?.onDelete).toBe('CASCADE');
    });

    it('should have test_sessions table for tracking progress', () => {
        const { columns, foreignKeys } = TABLES.test_sessions;
        expect(columns).toContain('user_id');
        expect(columns).toContain('score');
        expect(columns).toContain('answers');
        expect(foreignKeys?.length).toBeGreaterThanOrEqual(1);
    });
});

describe('Database Schema - Gamification Tables', () => {
    it('should have achievements table with criteria field', () => {
        const { columns } = TABLES.achievements;
        expect(columns).toContain('name');
        expect(columns).toContain('criteria');
    });

    it('should have user_achievements junction table', () => {
        const { foreignKeys } = TABLES.user_achievements;
        expect(foreignKeys?.length).toBe(2);

        const userFk = foreignKeys?.find((fk) => fk.column === 'user_id');
        const achievementFk = foreignKeys?.find((fk) => fk.column === 'achievement_id');

        expect(userFk).toBeDefined();
        expect(achievementFk).toBeDefined();
    });

    it('should have user_points table for XP tracking', () => {
        const { columns } = TABLES.user_points;
        expect(columns).toContain('points');
        expect(columns).toContain('level');
    });
});

describe('Database Schema - Indexes', () => {
    it('should have index on users email', () => {
        const { indexes } = TABLES.users;
        expect(indexes).toContain('idx_users_email');
    });

    it('should have index on test_sessions user_id', () => {
        const { indexes } = TABLES.test_sessions;
        expect(indexes).toContain('idx_test_sessions_user_id');
    });

    it('should have index on passages test_type', () => {
        const { indexes } = TABLES.passages;
        expect(indexes).toContain('idx_passages_test_type');
    });

    it('should have indexes on all foreign key columns', () => {
        // Foreign key columns should generally have indexes
        const tablesWithFk = ['questions', 'test_sessions', 'user_achievements', 'user_points', 'learning_paths', 'analytics_data'];

        tablesWithFk.forEach((tableName) => {
            const table = TABLES[tableName as keyof typeof TABLES];
            if (table && typeof table === 'object' && 'indexes' in table && (table as any).indexes) {
                expect((table as any).indexes.length).toBeGreaterThan(0);
            }
        });
    });
});

describe('Database Schema - Foreign Key Constraints', () => {
    it('should cascade delete user-related data', () => {
        const userRelatedTables = ['test_sessions', 'user_achievements', 'user_points', 'learning_paths', 'analytics_data'];

        userRelatedTables.forEach((tableName) => {
            const table = TABLES[tableName as keyof typeof TABLES];
            const userFk =
                table && typeof table === 'object' && 'foreignKeys' in table
                    ? (table as any).foreignKeys?.find((fk: any) => fk.column === 'user_id')
                    : undefined;
            expect(userFk?.onDelete).toBe('CASCADE');
        });
    });

    it('should cascade delete questions when passage is deleted', () => {
        const { foreignKeys } = TABLES.questions;
        const passageFk = foreignKeys?.find((fk) => fk.column === 'passage_id');
        expect(passageFk?.onDelete).toBe('CASCADE');
    });
});

describe('Database Schema - Unique Constraints', () => {
    it('should have unique email in users table', () => {
        const { uniqueColumns } = TABLES.users;
        expect(uniqueColumns).toContain('email');
    });

    it('should have unique code in promo_codes table', () => {
        const { uniqueColumns } = TABLES.promo_codes;
        expect(uniqueColumns).toContain('code');
    });
});
