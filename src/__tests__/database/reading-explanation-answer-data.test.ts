import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Cambridge 10 Test 1 Reading Q4', () => {
  it('keeps NOT GIVEN in both the question row and the embedded passage question', () => {
    const seed = readFileSync(resolve(process.cwd(), 'supabase/seed.sql'), 'utf8');
    const text = 'It took workers many years to build the stone steps characteristic of stepwells';
    expect(seed).toContain(`'${text}', 'true_false_not_given', '[]', 'NOT GIVEN'`);
    expect(seed).toContain(
      `"question_text":"${text}","type":"true_false_not_given","options":[],"correct_answer":"NOT GIVEN"`
    );
    expect(seed).not.toContain(`'${text}', 'true_false_not_given', '[]', 'sides'`);
  });
});
