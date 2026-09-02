const errorText = (error: unknown) => {
  if (error instanceof Error) return `${error.name} ${error.message}`.trim();
  if (typeof error === 'object' && error) {
    const value = error as { name?: string; message?: string; code?: string };
    return `${value.name || ''} ${value.code || ''} ${value.message || ''}`.trim();
  }
  return String(error || '');
};

export const getPasskeyErrorMessage = (error: unknown, action: 'sign-in' | 'registration') => {
  const text = errorText(error);

  if (/document is not focused|not focused/i.test(text)) {
    return 'Keep this browser window active, then try again.';
  }
  if (/notallowederror|timed out|not allowed|aborterror|cancel/i.test(text)) {
    return action === 'sign-in'
      ? 'No passkey was selected. If you have not added one yet, sign in with your password and add it in Security settings.'
      : 'Passkey setup was cancelled or timed out. Keep this window active and try again.';
  }
  if (/invalidstateerror|already (?:registered|exists)|excludecredentials/i.test(text)) {
    return 'This passkey is already registered. Use a different device or password manager.';
  }
  if (/notsupportederror|not supported|passkey_disabled/i.test(text)) {
    return 'Passkeys are not available for this site or browser. Use the secure production site in Safari, Chrome, or Edge.';
  }
  return action === 'sign-in'
    ? 'Passkey sign-in could not be completed. Try again or use your password.'
    : 'Passkey setup could not be completed. Try again from the secure production site.';
};
