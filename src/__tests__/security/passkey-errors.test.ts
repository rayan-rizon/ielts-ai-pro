import { describe, expect, it } from 'vitest';
import { getPasskeyErrorMessage } from '@/features/auth/utils/passkeyErrors';

describe('passkey error messages', () => {
  it('does not expose the browser WebAuthn privacy URL when no credential is selected', () => {
    const message = getPasskeyErrorMessage(
      new DOMException(
        'The operation either timed out or was not allowed. See: https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client.',
        'NotAllowedError'
      ),
      'sign-in'
    );

    expect(message).toContain('No passkey was selected');
    expect(message).not.toContain('w3.org');
  });

  it('gives a focused retry message for a cancelled registration prompt', () => {
    expect(
      getPasskeyErrorMessage(
        new DOMException('The operation was not allowed', 'NotAllowedError'),
        'registration'
      )
    ).toBe('Passkey setup was cancelled or timed out. Keep this window active and try again.');
  });
});
