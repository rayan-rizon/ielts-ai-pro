import { describe, expect, it } from 'vitest';
import { shouldDropSentryEvent } from '@/lib/sentryFilters';

const transitionError = new DOMException(
  'Transition was aborted because of invalid state',
  'InvalidStateError'
);

describe('Sentry browser-noise filtering', () => {
  it('drops the known Instagram iOS transition rejection', () => {
    expect(
      shouldDropSentryEvent(
        {
          contexts: { browser: { name: 'Instagram' }, os: { name: 'iOS' } },
          exception: { values: [{ mechanism: { type: 'onunhandledrejection' } }] },
        },
        { originalException: transitionError }
      )
    ).toBe(true);
  });

  it('keeps the same application error outside the Instagram webview', () => {
    expect(
      shouldDropSentryEvent(
        { contexts: { browser: { name: 'Safari' }, os: { name: 'iOS' } } },
        { originalException: transitionError }
      )
    ).toBe(false);
  });

  it('keeps unrelated Instagram exceptions', () => {
    expect(
      shouldDropSentryEvent(
        { contexts: { browser: { name: 'Instagram' }, os: { name: 'iOS' } } },
        { originalException: new Error('Application state is invalid') }
      )
    ).toBe(false);
  });
});
