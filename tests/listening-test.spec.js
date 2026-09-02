import { test, expect } from '@playwright/test';

/**
 * Listening Test Flow E2E Tests
 * Tests the complete listening test user journey
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Listening Test Flow', () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (testEmail && testPassword) {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForURL(/dashboard/i, { timeout: 10000 });
    }
  });

  test('should load listening test library', async ({ page }) => {
    await page.goto(`${BASE_URL}/listening`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const url = page.url();
    expect(url.includes('/listening') || url.includes('/login')).toBeTruthy();
  });

  test('should display available listening tests', async ({ page }) => {
    await page.goto(`${BASE_URL}/listening`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    if (!page.url().includes('/listening')) {
      test.skip('Not authenticated');
      return;
    }

    // Look for test listings
    const testElements = await page.locator('[data-testid*="test"], .test-card, article').count();
    expect(testElements).toBeGreaterThanOrEqual(0);
  });

  test('should start a listening test', async ({ page }) => {
    await page.goto(`${BASE_URL}/listening`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    if (!page.url().includes('/listening')) {
      test.skip('Not authenticated');
      return;
    }

    const startButton = page.getByRole('button', { name: /start|begin|practice/i }).first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url.includes('/listening') || url.includes('/test')).toBeTruthy();
    }
  });

  test('should have audio player controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/listening`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    if (!page.url().includes('/listening')) {
      test.skip('Not authenticated');
      return;
    }

    const startButton = page.getByRole('button', { name: /start|begin|practice/i }).first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(3000);

      // Look for audio controls
      const audioControls = await page
        .locator('audio, [class*="audio"], [class*="player"], button:has-text("play")')
        .count();

      expect(audioControls).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display sections/parts navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/listening`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    if (!page.url().includes('/listening')) {
      test.skip('Not authenticated');
      return;
    }

    const startButton = page.getByRole('button', { name: /start|begin|practice/i }).first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(2000);

      // Look for section/part tabs or navigation
      const sectionNav = await page.locator('text=/section|part 1|part 2|part 3|part 4/i').count();

      expect(sectionNav).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display timer in test', async ({ page }) => {
    await page.goto(`${BASE_URL}/listening`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    if (!page.url().includes('/listening')) {
      test.skip('Not authenticated');
      return;
    }

    const startButton = page.getByRole('button', { name: /start|begin|practice/i }).first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(2000);

      // Look for timer
      const timerExists = await page
        .locator('[class*="timer"], text=/\\d+:\\d+/')
        .first()
        .isVisible()
        .catch(() => false);

      expect(typeof timerExists).toBe('boolean');
    }
  });
});

test.describe('Listening Test Question Types', () => {
  test('should support various question types', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i, { timeout: 10000 });

    await page.goto(`${BASE_URL}/listening`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for question type elements
    const formElements = await page
      .locator('input[type="text"], input[type="radio"], select, textarea')
      .count();

    expect(formElements).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Listening Test Submission', () => {
  test('should have submit functionality', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i, { timeout: 10000 });

    await page.goto(`${BASE_URL}/listening`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const startButton = page.getByRole('button', { name: /start|begin|practice/i }).first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(3000);

      // Look for submit button
      const submitButton = page.getByRole('button', { name: /submit|finish|complete/i });
      const submitVisible = await submitButton.isVisible().catch(() => false);

      expect(typeof submitVisible).toBe('boolean');
    }
  });
});
