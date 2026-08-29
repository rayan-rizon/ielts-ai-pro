import { describe, expect, it } from 'vitest';

import { resolveEdgeFunctionsUrl } from '@/lib/edgeFunctionEndpoint';

describe('resolveEdgeFunctionsUrl', () => {
  const supabaseUrl = 'https://example.supabase.co';

  it('uses the Vite same-origin proxy only for local development', () => {
    expect(
      resolveEdgeFunctionsUrl({
        supabaseUrl,
        isDevelopment: true,
        hostname: 'localhost',
      })
    ).toBe('/__supabase/functions');
  });

  it('keeps deployed and non-loopback callers on the Supabase URL', () => {
    expect(
      resolveEdgeFunctionsUrl({
        supabaseUrl,
        isDevelopment: false,
        hostname: 'localhost',
      })
    ).toBe('https://example.supabase.co/functions/v1');
    expect(
      resolveEdgeFunctionsUrl({
        supabaseUrl,
        isDevelopment: true,
        hostname: 'www.ieltsai.pro',
      })
    ).toBe('https://example.supabase.co/functions/v1');
  });
});
