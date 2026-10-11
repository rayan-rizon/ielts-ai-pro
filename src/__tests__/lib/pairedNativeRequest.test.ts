import { describe, expect, it } from 'vitest';
import { isAllowedPairedRequestOrigin } from '../../../supabase/functions/_shared/pairedRequestOrigin';

const native = () =>
  new Headers({
    authorization: 'Bearer synthetic-test-token',
    'x-ielts-client': 'native-v1',
    'x-requested-with': 'XMLHttpRequest',
    'x-csrf-token': '11111111-1111-4111-8111-111111111111',
  });

describe('paired practice web and native transport', () => {
  it('keeps the existing website origins', () => {
    expect(isAllowedPairedRequestOrigin(new Headers({ origin: 'https://ieltsai.pro' }))).toBe(true);
    expect(isAllowedPairedRequestOrigin(new Headers({ origin: 'https://www.ieltsai.pro' }))).toBe(
      true
    );
  });
  it('allows an originless bearer transport with native headers', () => {
    expect(isAllowedPairedRequestOrigin(native())).toBe(true);
  });
  it.each(['https://evil.example', 'null', '', 'https://ieltsai.pro.evil.example'])(
    'rejects supplied origin %s even with native headers',
    (origin) => {
      const headers = native();
      headers.set('origin', origin);
      expect(isAllowedPairedRequestOrigin(headers)).toBe(false);
    }
  );
  it.each(['authorization', 'x-ielts-client', 'x-requested-with', 'x-csrf-token'])(
    'requires %s on native transport',
    (header) => {
      const headers = native();
      headers.delete(header);
      expect(isAllowedPairedRequestOrigin(headers)).toBe(false);
    }
  );
  it.each(['cookie', 'sec-fetch-site'])('rejects originless browser metadata %s', (header) => {
    const headers = native();
    headers.set(header, 'synthetic');
    expect(isAllowedPairedRequestOrigin(headers)).toBe(false);
  });
  it('does not accept an anonymous native request', () => {
    const headers = native();
    headers.set('authorization', 'Bearer ');
    expect(isAllowedPairedRequestOrigin(headers)).toBe(false);
  });
});
