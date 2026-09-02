# Database Management & Schema Guide

## 🚨 Critical Database Safety Rules

> [!CAUTION]
> **NEVER RUN `supabase db reset`**: Destructive database resets wipe live learner history, test attempts, auth records, and custom migrations. All schema evolutions must be non-destructive incremental migrations.

---

## 🛠️ Operations & Scripts

| Action                  | Command                                   | Purpose                                                         |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| **Backup DB**           | `node scripts/backup-database.js`         | Exports full JSON snapshot of all database tables to `backups/` |
| **Restore DB**          | `node scripts/restore-database.js <file>` | Restores data safely from a designated JSON backup              |
| **Interactive Manager** | `node scripts/database-manager.js`        | Safe interactive CLI for backup/restore inspection              |
| **Migration Lint**      | `supabase db lint`                        | Verifies SQL migration syntax and security lints                |
| **Push Migrations**     | `supabase db push`                        | Pushes pending local migrations to remote Supabase project      |

---

## 🏗️ Database Architecture & Schema Domains

The IELTS AI Pro PostgreSQL database contains domain-segregated tables with strict Row Level Security (RLS) policies:

### 1. User & Identity Domain

- `public.users`: Core learner profiles synced from `auth.users`, subscription tiers (`free`, `pro`, `premium`), admin flags (`is_admin`, `is_super_admin`), target band scores, and study streak counters.
- `public.user_points`: Gamification XP ledger and daily check-in streaks.
- `public.achievements` & `public.user_achievements`: Milestones unlocked by test completions and high scores.

### 2. IELTS Testing & Content Domain

- `public.tests`: Metadata for Cambridge test sets (Reading, Listening, Writing, Speaking) and Academic/General modules.
- `public.passages`: Reading passages and listening transcript sections with media URLs.
- `public.questions`: Cambridge-style questions (MCQ, True/False/Not Given, Heading Matching, Flowcharts, Gap-fill, Map Labeling).
- `public.test_sessions`: Learner test attempts with timing, band scores, and completion states (`is_completed`).
- `public.test_answers`: Individual response rows with user answers, correctness, and Paraphrase Detective explanations.
- `public.speaking_sessions`: Turn-by-turn examiner transcripts, audio URLs, and acoustic assessment metrics.
- `public.writing_evaluations`: AI-generated criterion breakdowns (TA/TR, CC, LR, GRA) and sentence rewrites.
- `public.media_assets`: Registry of Cloudflare R2 media assets (audio, diagram maps, writing prompts).

### 3. Adaptive Learning & Study Hub Domain

- `public.learning_paths`: Dynamic 7-day personalized study schedules.
- `public.learning_path_activities`: Granular milestone tasks linked to specific weak skills.
- `public.grammar_topics` & `public.grammar_attempts`: Grammar workbook curriculum and interactive transfer submissions.
- `public.vocabulary_items`, `public.vocabulary_review_events`, `public.vocabulary_user_progress`: Curated 20-category IELTS vocabulary engine with Leitner spaced repetition.

### 4. Billing, System & Telemetry Domain

- `public.subscriptions` & `public.subscription_history`: Stripe customer IDs, subscription status, and billing cycle records.
- `public.manual_payment_requests`: Regional Bangladesh manual payment verification workflows (bKash/Nagad).
- `public.promo_codes`: Atomic discount redemptions with usage capacity locks.
- `public.api_usage_logs`: Token consumption and idempotency reservations.
- `public.system_settings`: Platform toggles and feature gates.

---

## 🛡️ Security & Migration Invariants

1. **Row Level Security (RLS)**:
   - Every table in `public` **must have RLS enabled**.
   - Direct mutations (`UPDATE`, `DELETE`) to scores or completed test sessions are restricted to authoritative Edge Functions or RPCs.
2. **`SECURITY DEFINER` Hardening**:
   - All `SECURITY DEFINER` functions must explicitly specify `SET search_path = ''` to prevent search path hijacking.
3. **Concurrency & Race Condition Prevention**:
   - Quota operations and point awards acquire advisory transaction locks (`PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));`).
   - Promo code decrement uses `SELECT ... FOR UPDATE` row-level locks.

---

## 📦 Backups

- **Storage Location:** `backups/` (strictly excluded from git via `.gitignore`).
- **Format:** `database_backup_YYYY-MM-DDTHH-MM-SS.json`.
- **Run Before Migrations:** Always create a fresh backup prior to applying major schema migrations:
  ```bash
  node scripts/backup-database.js
  ```
