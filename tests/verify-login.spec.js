import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const randomEmail = `testuser_${Math.floor(Math.random() * 100000)}@example.com`;

test('verify signup', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);

  // Try to find signup toggle or link
  // Switch to signup mode
  await page.getByRole('button', { name: /join now/i }).click();

  // Wait for signup form fields
  await expect(page.locator('input[id="username"]')).toBeVisible({ timeout: 5000 });

  await page.fill('input[id="email"]', randomEmail);
  await page.fill('input[id="username"]', 'testuser');
  await page.fill('input[id="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  // Wait to see if we land on dashboard or onboarding
  await page.waitForURL(/dashboard|onboarding/i, { timeout: 15000 });
  console.log('Final URL:', page.url());
  expect(page.url()).toMatch(/dashboard|onboarding/i);
});
