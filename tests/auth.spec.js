import { test, expect } from '@playwright/test';

/**
 * Authentication Flow Tests
 * Tests login, signup, and logout functionality
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should display login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Try to submit empty form
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should show validation feedback
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="alert"]')).toContainText(/email|password|required/i);
  });

  test('should toggle between login and signup modes', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Look for signup toggle
    const signupToggle = page.getByRole('button', { name: /sign up|register|create account/i });
    if (await signupToggle.isVisible()) {
      await signupToggle.click();

      // Should show additional fields for signup (like confirm password or username)
      await expect(page.locator('input')).toHaveCount({ minimum: 2 });
    }
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // This test needs valid credentials - skip if not provided
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/i, { timeout: 10000 });
  });
});
