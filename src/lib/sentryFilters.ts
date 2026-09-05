type SentryLikeEvent = {
  contexts?: {
    browser?: { name?: string };
    os?: { name?: string };
  };
  exception?: {
    values?: Array<{ mechanism?: { type?: string } }>;
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

export const shouldDropSentryEvent = (event: SentryLikeEvent, hint: SentryLikeHint) => {
  const errorMessage = getErrorMessage(hint.originalException);

  if (NOISE_KEYWORDS.some((keyword) => errorMessage.includes(keyword))) return true;

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
