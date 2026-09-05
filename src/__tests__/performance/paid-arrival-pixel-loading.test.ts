import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The Meta Pixel lives inside GTM, and GTM is deliberately deferred to protect
 * LCP. That deferral is fine for organic traffic and expensive for paid: an ad
 * visitor who leaves before the Pixel initialises is billed as a link click but
 * recorded as no landing page view, which both under-reports the campaign and
 * starves Meta's optimiser of the signal it needs to find buyers.
 *
 * These assertions pin the exemption in place. They read index.html directly
 * because the loader runs in an inline <script> before any module is imported,
 * so there is nothing to import and spy on.
 */
describe('paid-arrival pixel loading', () => {
  const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

  it('loads GTM immediately when the visitor arrived from an ad click', () => {
    expect(indexHtml).toMatch(
      /if \(isPaidArrival\(\)\) \{\s*loadGtm\(\);\s*\} else \{\s*scheduleGtm\(\);/
    );
  });

  it('recognises the click ids and utm params that mark a paid arrival', () => {
    const detector = indexHtml.slice(
      indexHtml.indexOf('var isPaidArrival'),
      indexHtml.indexOf('// GTM owns the Meta Pixel tag')
    );

    for (const clickId of ['fbclid', 'gclid', 'ttclid', 'msclkid']) {
      expect(detector).toContain(clickId);
    }
    expect(detector).toContain('utm_(source|medium|campaign)');
  });

  it('still defers GTM for organic and direct visits', () => {
    // A single timer preserves the LCP deferral without entering the native
    // requestIdleCallback loop that overflowed the Google iOS webview stack.
    expect(indexHtml).toContain('window.setTimeout(loadNow, 3000)');
    expect(indexHtml).not.toContain('window.requestIdleCallback(loadNow');
    expect(indexHtml).toMatch(/\} else \{\s*scheduleGtm\(\);\s*\}/);
  });

  it('keeps the production-host gate ahead of any eager load', () => {
    // loadGtm() is now reachable on first paint, so the host gate inside it is
    // the only thing stopping a dev session from writing to the live dataset.
    expect(indexHtml).toMatch(
      /if \(window\.__gtmLoaded \|\| !gtmId \|\| !trackingEnabled\) return;/
    );
  });
});
