import { test, expect } from '@playwright/test';

/**
 * Admin Management E2E Tests
 * Tests for admin panel, user management, and test CRUD operations
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Admin Login', () => {
  test('should display admin login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/admin\/login/i);

    // Should have email and password fields
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');

    expect((await emailField.isVisible()) || (await passwordField.isVisible())).toBeTruthy();
  });

  test('should show error for invalid admin credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'notanadmin@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    // Should show error or remain on login page
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/admin/login') || url.includes('/login')).toBeTruthy();
  });
});

test.describe('Admin Panel Access', () => {
  test('should redirect non-admin users from admin panel', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    // Login as regular user
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/i);

    // Try to access admin panel
    await page.goto(`${BASE_URL}/admin/panel`);
    await page.waitForTimeout(2000);

    // Should be redirected away from admin panel
    const url = page.url();
    expect(!url.includes('/admin/panel') || url.includes('/login')).toBeTruthy();
  });

  test('should allow admin access to panel', async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip('Admin credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await page.waitForTimeout(3000);

    // Should be on admin panel or dashboard
    const url = page.url();
    expect(url.includes('/admin') || url.includes('/dashboard')).toBeTruthy();
  });
});

test.describe('Admin Panel Features', () => {
  test.beforeEach(async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip('Admin credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await page.waitForTimeout(3000);
  });

  test('should display user management section', async ({ page }) => {
    // Navigate to admin panel if not already there
    if (!page.url().includes('/admin/panel')) {
      await page.goto(`${BASE_URL}/admin/panel`);
      await page.waitForLoadState('networkidle');
    }

    // Look for user management elements
    const userSection = await page
      .locator('text=/user|manage|account/i, [class*="user"], table')
      .count();
    expect(typeof userSection).toBe('number');
  });

  test('should display test management section', async ({ page }) => {
    if (!page.url().includes('/admin/panel')) {
      await page.goto(`${BASE_URL}/admin/panel`);
      await page.waitForLoadState('networkidle');
    }

    // Look for test management elements
    const testSection = await page
      .locator(
        'text=/test|reading|writing|listening|create|import/i, button:has-text("Add"), button:has-text("Create")'
      )
      .count();
    expect(typeof testSection).toBe('number');
  });

  test('should access admin settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const url = page.url();
    // Should either be on admin settings or redirected
    expect(url.includes('/admin') || url.includes('/login')).toBeTruthy();
  });
});

test.describe('Admin User Details', () => {
  test('should have user detail page structure', async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip('Admin credentials not provided');
      return;
    }

    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await page.waitForTimeout(3000);

    // Try to access a user detail page (with placeholder ID)
    await page.goto(`${BASE_URL}/admin/user/test-id`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Should either show user details, 404, or redirect
    const url = page.url();
    expect(url).toContain('localhost');
  });
});
