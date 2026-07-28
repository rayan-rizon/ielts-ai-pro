import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260728040623_grammar_lab_schema_and_rpcs.sql'),
  'utf8'
).toLowerCase();
const seed = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260728040624_grammar_lab_seed_content.sql'),
  'utf8'
).toLowerCase();
const dashboardAliasFix = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260728050739_fix_grammar_dashboard_activity_alias.sql'
  ),
  'utf8'
).toLowerCase();
const contentV2 = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260728150456_grammar_lab_content_v2.sql'),
  'utf8'
).toLowerCase();

describe('Grammar Lab database contracts', () => {
  it('creates the five versioned data tables with RLS', () => {
    for (const table of [
      'grammar_skills',
      'grammar_items',
      'grammar_resources',
      'grammar_attempts',
      'grammar_responses',
    ]) {
      expect(schema).toContain(`create table if not exists public.${table}`);
      expect(schema).toContain(`alter table public.${table} enable row level security`);
    }
    expect(schema).toContain('content_version integer not null default 1');
  });

  it('keeps answer keys server-private and grades responses in secured RPCs', () => {
    expect(schema).toContain('revoke all on table public.grammar_items from anon, authenticated');
    expect(schema).toContain(
      'revoke all on table public.grammar_responses from anon, authenticated'
    );
    expect(schema).not.toContain('grant select on table public.grammar_items to authenticated');
    expect(schema).toContain('public.grammar_normalize_answer(p_answer)');
    expect(schema).toContain("'gradingmethod', 'normalized_exact_match'");
    expect(schema).toContain("set search_path = ''");
  });

  it('enforces free timezone limits and idempotent completion', () => {
    expect(schema).toContain('at time zone v_timezone');
    expect(schema).toContain("interval '30 days'");
    expect(schema).toContain("today''s five free grammar lab questions are already used");
    expect(schema).toContain("'alreadycompleted', true");
    expect(schema).toContain('and not coalesce(is_completed, false)');
  });

  it('seeds exactly six skills, six guides, and 240 items across four formats', () => {
    expect(seed).toContain('v_item_count <> 240');
    expect(seed).toContain('v_skill_count <> 6');
    expect(seed).toContain('v_resource_count <> 6');
    expect(seed).toContain('having count(*) <> 40');
    for (const format of [
      'form_selection',
      'error_correction',
      'sentence_completion',
      'meaning_preserving_transformation',
    ]) {
      expect(seed).toContain(`'${format}'::text`);
    }
    expect(schema).toContain(
      "question_format in ('form_selection', 'meaning_preserving_transformation')"
    );
    expect(seed).toContain('jsonb_build_array(c.correct_sentence, c.incorrect_sentence)');
  });

  it('keeps every initial scenario in Academic IELTS Writing or Speaking contexts', () => {
    expect(seed).toContain("'track', 'academic'");
    expect(seed).not.toMatch(/\('grammar_[^']+',\s*\d+,\s*[567],\s*'reading'/);
    expect(seed).not.toMatch(/\('grammar_[^']+',\s*\d+,\s*[567],\s*'listening'/);
    expect(seed).toContain("'writing', 'task_1'");
    expect(seed).toContain("'writing', 'task_2'");
    expect(seed).toContain("'speaking', 'part_3'");
  });

  it('uses explicit JSON aliases when extracting Grammar Learning Path activities', () => {
    expect(dashboardAliasFix).toContain('as days(day_name, activities)');
    expect(dashboardAliasFix).toContain(
      'cross join lateral jsonb_array_elements(days.activities) as activity(item)'
    );
    expect(dashboardAliasFix).toContain('jsonb_agg(activity.item)');
    expect(dashboardAliasFix).not.toContain('jsonb_agg(value)');
  });

  it('publishes concise version-2 items only after integrity checks pass', () => {
    expect(contentV2).toContain('v_item_count <> 240');
    expect(contentV2).toContain('v_resource_count <> 6');
    expect(contentV2).toContain('having count(*) <> 40');
    expect(contentV2).toContain('having count(*) <> 60');
    expect(contentV2).toContain("content_version = 2 then 'published' else 'retired'");
    expect(contentV2).toContain("prompt ilike '%complete this academic ielts%'");
    expect(contentV2).toContain("'variantgroup'");
  });

  it('constrains ambiguous completions and stratifies diagnostic evidence', () => {
    expect(contentV2).toContain("question_format = 'sentence_completion'");
    expect(contentV2).toContain('then form_item.options');
    expect(contentV2).toContain("('form_selection'::text, 5::smallint, 1, 1)");
    expect(contentV2).toContain("('meaning_preserving_transformation'::text, 7::smallint, 1, 4)");
    expect(contentV2).toContain('where candidate_rank = target_rank');
    expect(contentV2).toContain("current_item.publication_status = 'published'");
  });

  it('seeds full-page guides with IELTS examples and learner practice', () => {
    const guideSeed = contentV2.slice(
      contentV2.indexOf('insert into public.grammar_resources'),
      contentV2.indexOf('on conflict (slug, content_version)')
    );
    expect(guideSeed.match(/## see it in ielts/g)).toHaveLength(6);
    expect(guideSeed.match(/## check yourself/g)).toHaveLength(6);
    expect(guideSeed.match(/## final check/g)).toHaveLength(6);
  });
});
