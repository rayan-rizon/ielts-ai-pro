import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260917160737_restore_vocabulary_review_events.sql'),
  'utf8'
);
const indexMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260917160912_index_vocabulary_review_event_item.sql'
  ),
  'utf8'
);

describe('vocabulary review evidence schema', () => {
  it('restores the evidence relation required by Learning Path refreshes', () => {
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.vocabulary_review_events/i);
    expect(migration).toMatch(
      /vocabulary_item_id uuid NOT NULL REFERENCES public\.vocabulary_items/i
    );
    expect(migration).toMatch(/quality smallint NOT NULL CHECK \(quality BETWEEN 0 AND 5\)/i);
  });

  it('keeps review evidence private to the signed-in learner', () => {
    expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY/i);
    expect(migration).toMatch(/TO authenticated[\s\S]*get_my_public_user_id/i);
    expect(migration).toMatch(
      /REVOKE ALL ON TABLE public\.vocabulary_review_events FROM PUBLIC, anon/i
    );
  });

  it('covers both foreign-key access paths', () => {
    expect(migration).toMatch(/\(user_id, reviewed_at DESC\)/i);
    expect(indexMigration).toMatch(/\(vocabulary_item_id\)/i);
  });
});
