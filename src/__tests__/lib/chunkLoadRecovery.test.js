import { describe, expect, it } from 'vitest';
import { isChunkLoadError } from '@/lib/chunkLoadRecovery';

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://example.test/assets/dashboard.js',
    'Importing a module script failed.',
    'error loading dynamically imported module',
  ])('recognises a stale dynamic import: %s', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it('does not reload the app for an ordinary route TypeError', () => {
    expect(
      isChunkLoadError(new TypeError("Cannot read properties of null (reading 'useRef')"))
    ).toBe(false);
  });
});
