# Database Management Guide

## Quick Commands

| Action | Command |
|--------|---------|
| **Backup** | `node scripts/backup-database.js` |
| **Restore** | `node scripts/restore-database.js <backup-file>` |
| **Interactive** | `node scripts/database-manager.js` |
| **Lint** | `supabase db lint` |
| **Reset** | `supabase db reset` (⚠️ destructive) |

## Scripts

| File | Purpose |
|------|---------|
| `scripts/backup-database.js` | Creates JSON backup of all 21 tables |
| `scripts/restore-database.js` | Restores from JSON backup |
| `scripts/database-manager.js` | Interactive CLI for backup/restore/reset |
| `scripts/supabase_sync.py` | Hash-based migration sync (local/remote) |

## Backups

**Location:** `backups/`  
**Format:** `database_backup_YYYY-MM-DDTHH-MM-SS.json`  
**Tables:** 21 (users, passages, questions, test_sessions, achievements, etc.)

## Migrations

**Location:** `supabase/migrations/`  
**Naming:** `YYYYMMDDHHMMSS_description.sql`  

### Sync to Local
```bash
supabase migration up --local
```

### Push to Remote
```bash
supabase db push
```

## Seed Data

**File:** `supabase/seed.sql`

Provides sample data for: system_settings, tier_rate_limits, achievements, passages, questions, vocabulary, resources, notifications.

Applied automatically during `supabase db reset`.
