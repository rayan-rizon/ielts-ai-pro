-- Performance indexes based on Supabase Query Performance Advisor suggestions
-- Applied: 2026-03-29
-- These indexes target the top slow queries consuming ~97% of total DB query time.

-- ============================================================
-- passages table (~66% of total query time)
-- ============================================================

-- Simple created_at index: covers ORDER BY created_at (ASC/DESC)
-- Before: startup_cost=20.95 → After: 3.67
CREATE INDEX IF NOT EXISTS idx_passages_created_at
  ON public.passages USING btree (created_at);

-- Composite: covers the most common filter pattern
-- WHERE test_type=? AND is_active=? ORDER BY created_at DESC
-- Eliminates both filter and sort in a single index scan
CREATE INDEX IF NOT EXISTS idx_passages_test_type_is_active_created_at
  ON public.passages USING btree (test_type, is_active, created_at DESC);

-- ============================================================
-- questions table (~28% of total query time)
-- ============================================================

-- Simple created_at index: covers ORDER BY created_at ASC
-- Before: startup_cost=2761.33 → After: 71.52 (97% reduction)
CREATE INDEX IF NOT EXISTS idx_questions_created_at
  ON public.questions USING btree (created_at);

-- ============================================================
-- resources table (~2.2% of total query time)
-- ============================================================

-- view_count DESC index: covers ORDER BY view_count DESC
-- Before: startup_cost=9.09 → After: 4.32
CREATE INDEX IF NOT EXISTS idx_resources_view_count
  ON public.resources USING btree (view_count DESC);

-- ============================================================
-- skill_proficiency table (~0.9% of total query time)
-- ============================================================

-- Simple mastery_probability index
-- Before: startup_cost=1.24 → After: 0.82
CREATE INDEX IF NOT EXISTS idx_skill_proficiency_mastery_probability
  ON public.skill_proficiency USING btree (mastery_probability);

-- Composite: covers the actual query pattern
-- WHERE user_id=? ORDER BY mastery_probability ASC
CREATE INDEX IF NOT EXISTS idx_skill_proficiency_user_id_mastery
  ON public.skill_proficiency USING btree (user_id, mastery_probability ASC);
