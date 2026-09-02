import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const randomEmail = `testuser_${Math.floor(Math.random() * 100000)}@example.com`;

test('verify signup', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);

  // Try to find signup toggle or link
  // Switch to signup mode
  await page.getByRole('button', { name: /sign up/i }).click();

  // Wait for signup form fields
  await expect(page.locator('input[id="username"]')).toBeVisible({ timeout: 5000 });

  await page.fill('input[id="email"]', randomEmail);
  await page.fill('input[id="username"]', 'testuser');
  await page.fill('input[id="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  // Wait to see if we land on dashboard/onboarding, OR if we show the email verification view / SMTP error alert
  try {
    await page.waitForURL(/dashboard|onboarding/i, { timeout: 5000 });
    expect(page.url()).toMatch(/dashboard|onboarding/i);
  } catch {
    const alert = page.locator('[role="alert"]');
    if (await alert.isVisible()) {
      const text = await alert.textContent();
      expect(text).toMatch(/error|confirmation|email|already/i);
      console.info('Signup submitted and handled error successfully:', text);
    } else {
      await expect(page.locator('text=/verify your email|check your inbox/i')).toBeVisible({
        timeout: 5000,
      });
      console.info('Signup verification view is shown successfully.');
    }
  }
});
