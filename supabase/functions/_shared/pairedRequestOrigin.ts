import { isAllowedOrigin } from './originValidation.ts';

/** Native requests have no browser Origin. Bearer authentication and room
 * ownership remain mandatory in paired-tests; these headers only select the
 * native transport. A supplied browser origin must always pass the web policy.
 */
export function isAllowedPairedRequestOrigin(headers: Headers): boolean {
  const origin = headers.get('origin');
  if (origin !== null) return isAllowedOrigin(origin);
  return (
    /^Bearer\s+\S+$/i.test(headers.get('authorization') || '') &&
    headers.get('x-ielts-client') === 'native-v1' &&
    headers.get('x-requested-with') === 'XMLHttpRequest' &&
    /^[a-f\d-]{36}$/i.test(headers.get('x-csrf-token') || '') &&
    !headers.has('cookie') &&
    !headers.has('sec-fetch-site')
  );
}
