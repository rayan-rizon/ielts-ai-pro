import { describe, expect, it } from 'vitest';
import { normalizeAnswersForComparison } from '@/hooks/useAutosave';

describe('autosave answer comparison', () => {
  it('detects changes in generic Reading and Listening answer maps', () => {
    expect(normalizeAnswersForComparison({ 'q-1': 'TRUE', 'q-2': 'London' })).toEqual({
      raw: '[["q-1","TRUE"],["q-2","London"]]',
    });
  });

  it('normalizes generic answer maps deterministically', () => {
    expect(normalizeAnswersForComparison({ b: '2', a: '1' })).toEqual(
      normalizeAnswersForComparison({ a: '1', b: '2' })
    );
  });
});
