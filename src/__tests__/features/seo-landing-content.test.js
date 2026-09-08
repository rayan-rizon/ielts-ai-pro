import { describe, expect, it } from 'vitest';

import {
  RELATED_LINKS,
  SEO_LANDING_CONTENT,
  toPrerenderConfig,
} from '@/features/core/components/seo-landing/seoLandingContent';

/*
 * These two routes are served twice: once as the static #static-prerender-content
 * article that scripts/generate-public-seo-pages.mjs writes for crawlers that do
 * not run JavaScript, and once by the React route. Google compares what it is told
 * (FAQPage JSON-LD) against what the page shows, so the two renderings have to
 * describe the same page.
 */
const pages = Object.entries(SEO_LANDING_CONTENT);

describe('SEO landing content', () => {
  it.each(pages)('%s: the React H1 matches the prerendered H1', (_key, content) => {
    // The React hero composes the H1 from headingLead + headingScript; the static
    // article prints `heading`. A crawler that sees both must see one heading.
    expect(`${content.headingLead} ${content.headingScript}`).toBe(content.heading);
    expect(toPrerenderConfig(content).heading).toBe(content.heading);
  });

  it.each(pages)(
    '%s: the prerendered FAQ list is the FAQ list the page renders',
    (_key, content) => {
      const prerendered = toPrerenderConfig(content).faqs;
      expect(prerendered).toEqual(content.faqs);
      expect(prerendered.length).toBeGreaterThanOrEqual(3);
      prerendered.forEach(([question, answer]) => {
        expect(question.trim()).not.toBe('');
        expect(answer.trim()).not.toBe('');
      });
    }
  );

  it.each(pages)('%s: every visible section reaches the static article', (_key, content) => {
    const headings = toPrerenderConfig(content).sections.map((section) => section.heading);
    expect(headings).toContain(content.featuresHeading);
    expect(headings).toContain(content.breakdown.heading);
    expect(headings).toContain(content.stepsHeading);
  });

  it.each(pages)('%s: metadata stays within what search engines display', (_key, content) => {
    expect(content.path.startsWith('/')).toBe(true);
    expect(content.title.length).toBeLessThanOrEqual(60);
    expect(content.description.length).toBeGreaterThanOrEqual(120);
    expect(content.description.length).toBeLessThanOrEqual(170);
    expect(content.heroAlt.trim()).not.toBe('');
  });

  it('does not link a page to itself in the related-links rail', () => {
    pages.forEach(([, content]) => {
      const links = RELATED_LINKS.filter((link) => link.href !== content.path);
      expect(links).toHaveLength(RELATED_LINKS.length - 1);
    });
  });

  it('keeps the footer and blog deep links pointing at real anchors', () => {
    // Footer.jsx and BlogPost.jsx link to #reading and #listening on the practice
    // page; the breakdown section owns those ids.
    const ids = SEO_LANDING_CONTENT.practice.breakdown.items.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining(['reading', 'listening']));
  });
});
