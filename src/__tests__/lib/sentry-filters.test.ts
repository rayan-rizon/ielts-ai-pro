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

  it('drops a wallet-extension rejection', () => {
    expect(
      shouldDropSentryEvent(
        {},
        { originalException: { code: 4001, message: 'wallet must has at least one account' } }
      )
    ).toBe(true);
  });

  it('keeps an application rejection that has a code and message', () => {
    expect(
      shouldDropSentryEvent(
        {},
        { originalException: { code: 'PGRST116', message: 'Row not found' } }
      )
    ).toBe(false);
  });

  it('drops a TypeError whose only frames are in the GTM loader', () => {
    expect(
      shouldDropSentryEvent(
        {
          exception: {
            values: [
              {
                type: 'TypeError',
                stacktrace: { frames: [{ filename: 'https://www.ieltsai.pro/mx/gtm.js' }] },
              },
            ],
          },
        },
        { originalException: new TypeError("Cannot read properties of null (reading '0')") }
      )
    ).toBe(true);
  });

  it('keeps a TypeError that reaches application code', () => {
    expect(
      shouldDropSentryEvent(
        {
          exception: {
            values: [
              {
                type: 'TypeError',
                stacktrace: {
                  frames: [
                    { filename: 'https://www.ieltsai.pro/mx/gtm.js' },
                    { filename: 'https://www.ieltsai.pro/assets/index-abc.js' },
                  ],
                },
              },
            ],
          },
        },
        { originalException: new TypeError("Cannot read properties of null (reading '0')") }
      )
    ).toBe(false);
  });
});
