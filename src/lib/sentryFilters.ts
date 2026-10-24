type SentryLikeEvent = {
  contexts?: {
    browser?: { name?: string };
    os?: { name?: string };
  };
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
      mechanism?: { type?: string };
      stacktrace?: { frames?: Array<{ filename?: string }> };
    }>;
  };
  request?: { headers?: Record<string, string | undefined> };
};

type SentryLikeHint = { originalException?: unknown };

const NOISE_KEYWORDS = [
  'Java object is gone',
  'postMessage',
  'enableButtonsClickedMetaDataLogging',
  '__show__deepen',
  'atomic_css',
];

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error || error instanceof DOMException) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
};

// Wallet browser extensions (EIP-1193) reject their own provider calls with a
// plain `{ code, message }` object. Nothing in this app talks to a wallet, so
// the rejection is the extension's, not ours.
const isWalletExtensionRejection = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return typeof code === 'number' && typeof message === 'string' && /\bwallet\b/i.test(message);
};

// The only frames come from Google's tag-manager loader (served through the
// /mx proxy), so there is no application code to fix. Matches one signature
// only: a TypeError raised with nothing but gtm.js on the stack.
const isGtmLoaderTypeError = (event: SentryLikeEvent) => {
  const exception = event.exception?.values?.[0];
  const frames = exception?.stacktrace?.frames;
  if (exception?.type !== 'TypeError' || !frames?.length) return false;
  return frames.every((frame) => /(^|\/)gtm\.js(\?|$)/.test(frame.filename || ''));
};

export const shouldDropSentryEvent = (event: SentryLikeEvent, hint: SentryLikeHint) => {
  const errorMessage = getErrorMessage(hint.originalException);

  if (NOISE_KEYWORDS.some((keyword) => errorMessage.includes(keyword))) return true;
  if (isWalletExtensionRejection(hint.originalException)) return true;
  if (isGtmLoaderTypeError(event)) return true;

  const browserName = event.contexts?.browser?.name || '';
  const osName = event.contexts?.os?.name || '';
  const userAgent =
    event.request?.headers?.['User-Agent'] || event.request?.headers?.['user-agent'] || '';
  const isInstagramIos =
    (/instagram/i.test(browserName) || /instagram/i.test(userAgent)) &&
    (/ios/i.test(osName) || /iphone|ipad/i.test(userAgent));
  const isKnownTransitionRejection =
    errorMessage.includes('InvalidStateError') &&
    errorMessage.includes('Transition was aborted because of invalid state');

  return isInstagramIos && isKnownTransitionRejection;
};
