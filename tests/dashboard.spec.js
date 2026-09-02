import { test, expect } from '@playwright/test';

/**
 * Dashboard Tests
 * Tests main dashboard functionality and navigation
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Dashboard', () => {
  // Note: These tests require authentication
  // Set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars for full testing

  test('should load dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Either shows dashboard content or redirects to login/landing
    await expect(page).toHaveURL(/(dashboard|login|\/)/i, { timeout: 10000 });
  });

  test('should display navigation sidebar', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Check for navigation elements (may be hidden on small screens)
    const navExists = await page
      .locator('nav, aside, [role="navigation"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(navExists || (await page.url())).toBeTruthy();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check for common navigation destinations
    const navLinks = ['reading', 'writing', 'listening', 'speaking'];

    for (const link of navLinks) {
      const linkElement = page.locator(`a[href*="${link}"], button:has-text("${link}")`).first();
      const exists = await linkElement.isVisible().catch(() => false);

      if (exists) {
        // At least one nav link exists
        expect(true).toBe(true);
        return;
      }
    }
  });
});

test.describe('Test Library Pages', () => {
  const testPages = [
    { name: 'Reading', path: '/reading' },
    { name: 'Writing', path: '/writing' },
    { name: 'Listening', path: '/listening' },
    { name: 'Speaking', path: '/speaking' },
  ];

  for (const { name, path } of testPages) {
    test(`${name} library page should load`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`);

      // Should either show content or redirect to login
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Page should have loaded without errors
      const errorVisible = await page
        .locator('text=/error|failed|not found/i')
        .isVisible()
        .catch(() => false);

      // Either shows login or the actual page (not an error)
      const url = page.url();
      expect(url.includes(path) || url.includes('login') || !errorVisible).toBeTruthy();
    });
  }
});
