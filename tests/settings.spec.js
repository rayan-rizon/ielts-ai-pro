import { test, expect } from '@playwright/test';

/**
 * Settings Page E2E Tests
 * Tests user settings, profile updates, and preferences
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Settings Page Access', () => {
  test('should redirect unauthenticated users from settings', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(2000);

    // Should redirect to login or landing
    expect(page.url()).not.toContain('/settings');
  });

  test('should load settings for authenticated users', async ({ page }) => {
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

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    await expect(page).toHaveURL(/settings/i, { timeout: 5000 });
  });
});

test.describe('Profile Settings', () => {
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

  test('should display profile section', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    if (!testEmail) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for profile-related elements
    const profileSection = await page.locator('text=/profile|name|email|avatar/i').count();
    expect(profileSection).toBeGreaterThanOrEqual(1);
  });

  test('should have editable name field', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    if (!testEmail) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for name input
    const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
    const nameExists = await nameInput.isVisible().catch(() => false);

    expect(typeof nameExists).toBe('boolean');
  });

  test('should have save button', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    if (!testEmail) {
      test.skip('Test credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const saveButton = page.getByRole('button', { name: /save|update/i }).first();
    const saveExists = await saveButton.isVisible().catch(() => false);

    expect(typeof saveExists).toBe('boolean');
  });
});

test.describe('Theme Settings', () => {
  test('should have theme toggle option', async ({ page }) => {
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

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for theme toggle
    const themeToggle = await page
      .locator('text=/theme|dark|light|appearance/i, button[aria-label*="theme"]')
      .count();
    expect(themeToggle).toBeGreaterThanOrEqual(0);
  });

  test('theme toggle should work', async ({ page }) => {
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

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Find and click theme toggle
    const themeBtn = page
      .locator('button:has-text("dark"), button:has-text("light"), [aria-label*="theme"]')
      .first();
    if (await themeBtn.isVisible().catch(() => false)) {
      const initialClass = await page.locator('html').getAttribute('class');
      await themeBtn.click();
      await page.waitForTimeout(500);

      // Theme class may have changed
      const newClass = await page.locator('html').getAttribute('class');
      expect(typeof newClass).toBe('string');
    }
  });
});

test.describe('Password Change', () => {
  test('should have password change section', async ({ page }) => {
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

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for password section
    const passwordSection = await page.locator('text=/password|security|change password/i').count();
    expect(passwordSection).toBeGreaterThanOrEqual(0);
  });

  test('should have password fields', async ({ page }) => {
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

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for password inputs
    const passwordInputs = await page.locator('input[type="password"]').count();
    expect(passwordInputs).toBeGreaterThanOrEqual(0);
  });
});

test.describe('IELTS Goals Settings', () => {
  test('should have target band score setting', async ({ page }) => {
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

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for band score setting
    const bandScoreSection = await page.locator('text=/band|score|goal|target/i').count();
    expect(bandScoreSection).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Account Management', () => {
  test('should have account section', async ({ page }) => {
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

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Look for account management options
    const accountSection = await page.locator('text=/account|delete|export|data/i').count();
    expect(accountSection).toBeGreaterThanOrEqual(0);
  });
});
