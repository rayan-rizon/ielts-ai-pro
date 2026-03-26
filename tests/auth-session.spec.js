import { test, expect } from '@playwright/test';

/**
 * Authentication Session Persistence & Admin Tests
 * Comprehensive E2E tests for session management, admin auth, and multi-tab sync
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Session Persistence', () => {
  test('should persist session after page refresh', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip('Test credentials not provided');
      return;
    }

    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL(/dashboard/i, { timeout: 10000 });

    // Refresh the page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/dashboard/i, { timeout: 5000 });

    // Verify user is still logged in by checking for logged-in only elements
    await expect(page.getByText(/sign out|logout/i)).toBeVisible({ timeout: 5000 });
  });

  test('should maintain session after navigating between pages', async ({ page }) => {
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

    await expect(page).toHaveURL(/dashboard/i, { timeout: 10000 });

    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    await expect(page).toHaveURL(/settings/i, { timeout: 5000 });

    // Navigate back to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/dashboard/i, { timeout: 5000 });

    // Should still be logged in
    await expect(page.getByText(/sign out|logout/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Authentication', () => {
  test('should display admin login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);

    // Check for admin login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in as admin|admin/i })).toBeVisible();
  });

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

    await expect(page).toHaveURL(/dashboard/i, { timeout: 10000 });

    // Try to access admin panel
    await page.goto(`${BASE_URL}/admin/panel`);

    // Should be redirected (either to dashboard or admin login)
    await expect(page).not.toHaveURL(/admin\/panel/i, { timeout: 5000 });
  });

  test('should allow admin login and access admin panel', async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip('Admin credentials not provided');
      return;
    }

    // Go to admin login
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.getByRole('button', { name: /sign in|log in|admin/i }).click();

    // Should redirect to admin panel
    await expect(page).toHaveURL(/admin\/panel/i, { timeout: 10000 });

    // Verify admin panel content is visible
    await expect(page.getByText(/admin|management|overview/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to landing page', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto(`${BASE_URL}/settings`);

    // Should be redirected to landing/login page (not stay on settings)
    await page.waitForTimeout(1000); // Allow for redirect buffer
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/settings');
  });

  test('should allow unauthenticated users to access public pages', async ({ page }) => {
    // Pricing page should be accessible
    await page.goto(`${BASE_URL}/pricing`);
    await expect(page).toHaveURL(/pricing/i, { timeout: 5000 });

    // Landing page should be accessible
    await page.goto(`${BASE_URL}/`);
    await expect(page).toHaveURL(BASE_URL + '/', { timeout: 3000 });
  });
});

test.describe('Logout Flow', () => {
  test('should properly sign out user', async ({ page }) => {
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

    await expect(page).toHaveURL(/dashboard/i, { timeout: 10000 });

    // Find and click logout button
    const logoutBtn = page.getByRole('button', { name: /sign out|logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Try finding in sidebar or menu
      const sidebarLogout = page.locator('text=/sign out|logout/i').first();
      await sidebarLogout.click();
    }

    // Should be redirected to landing/login
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/dashboard');

    // Try to access protected route - should fail
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/settings');
  });
});
