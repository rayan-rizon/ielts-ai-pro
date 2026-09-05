import { describe, expect, it } from 'vitest';
import { isDatabaseId } from '@/lib/testInitializer';

describe('test initializer identifier validation', () => {
  it('accepts canonical UUID identifiers', () => {
    expect(isDatabaseId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it.each(['', 'undefined', 'reading-test', '123', '123e4567-e89b-12d3-a456'])(
    'rejects malformed route identifier %j before it reaches Supabase',
    (id) => {
      expect(isDatabaseId(id)).toBe(false);
    }
  );
});
