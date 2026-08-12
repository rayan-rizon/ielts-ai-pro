import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const seed = readFileSync(resolve(process.cwd(), 'supabase/seed.sql'), 'utf8');

describe('Cambridge IELTS 17 Academic Test 1 Reading answer data', () => {
  it('keeps the Roman amphitheatres answer and multi-select ranges separate', () => {
    const start = seed.indexOf("'8fe3161e-9e6b-4cda-a710-0a55ba196d5a'");
    const end = seed.indexOf("'17d0fa4c-6479-492e-9e8b-71f5c7870028'", start);
    const questionBlock = seed.slice(start, end);

    expect(questionBlock).toContain('"22":"shops"');
    expect(questionBlock).not.toContain('"22":"shops\\n\\n23&24');
    expect(questionBlock).toMatch(/'Questions 23-24\s+Choose \*\*TWO letters\*\*, A-E\./);
    expect(questionBlock).toMatch(/'Questions 25-26\s+Choose \*\*TWO letters\*\*, A-E\./);
    expect(questionBlock).toContain('NULL, 2, TRUE, 2, 23, NULL)');
    expect(questionBlock).toContain('NULL, 2, TRUE, 2, 25, NULL)');
  });
});
