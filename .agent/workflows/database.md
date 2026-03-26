---
description: How to work with the Supabase database in this project
---

# Database Rules for Antigravity

## Critical Rules

### 🚫 NEVER Reset Database in Production

- **NEVER** run `supabase db reset` unless explicitly confirmed by the user
- This command is destructive and will delete all data
- Always create a backup before any destructive operation

### 📝 Migration Best Practices

1. **Naming**: Use `YYYYMMDDHHMMSS_description.sql` format
2. **Idempotent**: Use `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DROP IF EXISTS`
3. **Backwards Compatible**: Avoid breaking changes to existing columns
4. **Test Locally First**: Always run `supabase db lint` before pushing

### 🔒 RLS Policy Guidelines

1. **Performance**: Wrap `auth.uid()` and `auth.role()` in subqueries: `(SELECT auth.uid())`
2. **Explicit Roles**: Always specify `TO authenticated` or `TO service_role`
3. **Avoid Overlaps**: Don't create multiple permissive policies for the same role/action
4. **Service Role**: Use for server-side functions that need full access

### 🛡️ Function Security

1. **Search Path**: Always set `SET search_path = public` on `SECURITY DEFINER` functions
2. **Minimal Privileges**: Prefer `SECURITY INVOKER` when possible

## Common Commands

```bash
# Lint database for issues
supabase db lint

# Create backup (use this before any risky operation)
node scripts/backup-database.js

# Apply migrations locally
supabase migration up --local

# Push to remote (requires confirmation)
supabase db push

# View migration status
supabase migration list
```

## Schema Overview

### Core Tables (21 total)

| Category         | Tables                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| **Users**        | `users`, `consent_history`                                                                                 |
| **Content**      | `passages`, `questions`, `vocabulary_items`, `resources`                                                   |
| **Progress**     | `test_sessions`                                                                                            |
| **Gamification** | `achievements`, `user_achievements`, `user_points`                                                         |
| **Learning**     | `learning_paths`, `learning_path_activities`, `skill_proficiency`, `daily_focus`                           |
| **Analytics**    | `analytics_data`                                                                                           |
| **System**       | `notifications`, `system_settings`, `promo_codes`, `tier_rate_limits`, `ai_feedback_cache`, `ai_api_usage` |

## Seed File

Location: `supabase/seed.sql`

Contains sample data for development/testing. Applied during `supabase db reset`.

## Backup Strategy

- **Format**: JSON via `scripts/backup-database.js`
- **Location**: `backups/` directory
- **Retention**: Keep recent 10 backups
- **Scope**: All 21 public schema tables
