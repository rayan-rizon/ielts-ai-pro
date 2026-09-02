import { describe, expect, it } from 'vitest';

import { resolveEdgeFunctionsUrl, rewriteEdgeFunctionRequest } from '@/lib/edgeFunctionEndpoint';

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

  it('routes direct SDK function requests through the local proxy', () => {
    expect(
      rewriteEdgeFunctionRequest('https://example.supabase.co/functions/v1/admin-payment-history', {
        supabaseUrl,
        isDevelopment: true,
        hostname: 'localhost',
      })
    ).toBe('/__supabase/functions/admin-payment-history');
  });

  it('does not rewrite database or deployed function requests', () => {
    expect(
      rewriteEdgeFunctionRequest('https://example.supabase.co/rest/v1/payment_requests', {
        supabaseUrl,
        isDevelopment: true,
        hostname: 'localhost',
      })
    ).toBe('https://example.supabase.co/rest/v1/payment_requests');

    expect(
      rewriteEdgeFunctionRequest('https://example.supabase.co/functions/v1/admin-payment-history', {
        supabaseUrl,
        isDevelopment: false,
        hostname: 'localhost',
      })
    ).toBe('https://example.supabase.co/functions/v1/admin-payment-history');
  });

  it('does not expose the proxy to non-loopback development hosts', () => {
    expect(
      rewriteEdgeFunctionRequest('https://example.supabase.co/functions/v1/admin-payment-history', {
        supabaseUrl,
        isDevelopment: true,
        hostname: '192.168.1.50',
      })
    ).toBe('https://example.supabase.co/functions/v1/admin-payment-history');
  });
});
