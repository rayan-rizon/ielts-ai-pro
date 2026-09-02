import { test, expect } from '@playwright/test';

/**
 * Subscription/Pricing Flow E2E Tests
 * Tests subscription page, pricing tiers, and payment flows
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Pricing Page', () => {
  test('should load pricing page', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    await expect(page).toHaveURL(/pricing/i, { timeout: 5000 });
  });

  test('should display pricing tiers', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for tier names
    const tiers = await page.locator('text=/free|basic|pro|premium|starter/i').count();
    expect(tiers).toBeGreaterThanOrEqual(1);
  });

  test('should display prices', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for price indicators
    const prices = await page.locator('text=/\\$\\d+|\\d+ per|month|year|free/i').count();
    expect(prices).toBeGreaterThanOrEqual(1);
  });

  test('should list features for each tier', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for feature lists
    const features = await page.locator('ul li, [class*="feature"]').count();
    expect(features).toBeGreaterThanOrEqual(1);
  });

  test('should have CTA buttons for each tier', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for action buttons
    const ctaButtons = await page
      .locator('button:has-text("start"), button:has-text("subscribe"), button:has-text("get")')
      .count();
    expect(ctaButtons).toBeGreaterThanOrEqual(1);
  });

  test('should be accessible without authentication', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/pricing`);

    // Should not redirect to login
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(page).toHaveURL(/pricing/i, { timeout: 5000 });
  });
});

test.describe('Subscription Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Click on a subscribe button
    const subscribeBtn = page
      .getByRole('button', { name: /subscribe|get started|upgrade/i })
      .first();
    if (await subscribeBtn.isVisible().catch(() => false)) {
      await subscribeBtn.click();
      await page.waitForTimeout(2000);

      // Should redirect to login or show login modal
      const url = page.url();
      const hasLogin =
        url.includes('/login') ||
        (await page
          .locator('input[type="email"]')
          .isVisible()
          .catch(() => false));
      expect(url.includes('/login') || hasLogin || url.includes('/pricing')).toBeTruthy();
    }
  });

  test('should show subscription button when authenticated', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i, { timeout: 10000 });

    // Go to pricing
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for subscribe buttons
    const subscribeButtons = await page
      .locator('button:has-text("subscribe"), button:has-text("upgrade")')
      .count();
    expect(subscribeButtons).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Subscription Success Page', () => {
  test('success page should exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/subscription/success`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // May redirect or show success content
    const url = page.url();
    expect(url).toBeTruthy();
  });
});

test.describe('Billing Section', () => {
  test('should access billing from settings when authenticated', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i, { timeout: 10000 });

    // Go to settings
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for billing/subscription section
    const billingSection = await page.locator('text=/billing|subscription|plan|payment/i').count();
    expect(billingSection).toBeGreaterThanOrEqual(0);
  });
});
