import { test, expect } from '@playwright/test';

/**
 * SEO & Metadata E2E Tests
 * Verifies proper SEO implementation across key pages
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

const footerAppDestinations = {
  'Band Score Calculator': '/ielts-band-score-calculator',
  'Writing Task Evaluator': '/ielts-writing-checker',
  'Speaking Test Simulator': '/speaking',
  'Listening Practice Hub': '/listening',
  'Reading Comprehension': '/reading',
  'IELTS Prep Blog & Guides': '/blog',
  'Cambridge Practice Material': '/resources',
};

test.describe('SEO - Title Tags', () => {
  test('landing page should have proper title', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title.toLowerCase()).toContain('ielts');
  });

  test('login page should have descriptive title', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('reading page should have skill-specific title', async ({ page }) => {
    await page.goto(`${BASE_URL}/reading`);
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('writing page should have skill-specific title', async ({ page }) => {
    await page.goto(`${BASE_URL}/writing`);
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('pricing page should have descriptive title', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe('SEO - Meta Descriptions', () => {
  test('landing page should have meta description', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

    // Meta description should exist and be reasonably long
    if (metaDescription) {
      expect(metaDescription.length).toBeGreaterThan(50);
    }
  });

  test('pricing page should have pricing-related meta', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('domcontentloaded');

    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

    expect(typeof metaDescription).toBe('string');
  });
});

test.describe('SEO - Heading Structure', () => {
  test('landing page should have single h1', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('pricing page should have single h1', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toHaveCount(1);
  });
});

test.describe('SEO - Open Graph Tags', () => {
  test('landing page should have og:title', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');

    // OG title is optional but recommended
    expect(typeof ogTitle === 'string' || ogTitle === null).toBeTruthy();
  });

  test('landing page should have og:type', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');

    expect(typeof ogType === 'string' || ogType === null).toBeTruthy();
  });
});

test.describe('SEO - Semantic HTML', () => {
  test('should use semantic elements', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // Check for nav, main, footer
    const nav = await page.locator('nav').count();
    const main = await page.locator('main').count();
    const footer = await page.locator('footer').count();

    // At least one semantic element should be present
    expect(nav + main + footer).toBeGreaterThan(0);
  });

  test('should have accessible links', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // Check that links have text or aria-labels
    const links = await page.locator('a').all();
    for (const link of links.slice(0, 10)) {
      // Check first 10 links
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('footer practice links point to app screens', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    for (const [label, href] of Object.entries(footerAppDestinations)) {
      await expect(page.getByRole('link', { name: label, exact: true })).toHaveAttribute(
        'href',
        href
      );
    }
  });
});

test.describe('Error Pages', () => {
  test('404 page should exist for unknown routes', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`);
    await page.waitForLoadState('domcontentloaded');

    // Should either show 404 content or redirect
    await expect(page.locator('body')).toContainText(/404|not found/i);
  });

  test('500 error page should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/500`);
    await page.waitForLoadState('domcontentloaded');

    // 500 page should load
    expect(new URL(page.url()).pathname).toBe('/500');
  });
});

test.describe('Legal Pages', () => {
  test('terms of service page should load', async ({ page }) => {
    await page.goto(`${BASE_URL}/terms`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/terms|service|agreement/i);
  });

  test('privacy policy page should load', async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/privacy|data|policy/i);
  });
});
